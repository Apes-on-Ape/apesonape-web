-- AOA ecosystem progression. Fresh launch: totals are the sum of new ledger events only.
-- Deprecated and NOT read by this system:
--   user_profiles.bananas, user_profiles.experience, user_profiles.level
--   user_achievements (historical arcade unlocks)
--   gamify_user_achievements rows earned before this launch
-- This script does not delete those columns or rows, and it does not touch game_scores.

CREATE TABLE IF NOT EXISTS public.user_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  reference_id TEXT,
  aoa_amount INTEGER NOT NULL CHECK (aoa_amount > 0),
  dedupe_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_progress_events_dedupe_key_idx
  ON public.user_progress_events (dedupe_key);

CREATE INDEX IF NOT EXISTS user_progress_events_user_created_idx
  ON public.user_progress_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_progress_events_user_source_action_day_idx
  ON public.user_progress_events (user_id, source, action, created_at);

CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id TEXT PRIMARY KEY,
  total_aoa INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_progress_total_aoa_idx
  ON public.user_progress (total_aoa DESC);

-- New-era achievement unlocks. Old user_achievements rows are left in place and are not read.
CREATE TABLE IF NOT EXISTS public.aoa_achievement_unlocks (
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Runs and bests counted only after AOA launch. Not copied from historical high scores.
CREATE TABLE IF NOT EXISTS public.aoa_arcade_era (
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  runs INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, game_id)
);

ALTER TABLE public.aoa_achievement_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aoa_arcade_era ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_progress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_progress_public_read ON public.user_progress;
CREATE POLICY user_progress_public_read ON public.user_progress
  FOR SELECT TO anon, authenticated USING (true);

-- Events stay server-only. No public insert.

CREATE OR REPLACE FUNCTION public.get_aoa_required_for_level(level_num INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF level_num <= 1 THEN
    RETURN 0;
  END IF;
  RETURN (50 * level_num * level_num + 100 * level_num - 150);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_level_from_aoa(total_aoa INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  level_num INTEGER := 1;
BEGIN
  IF total_aoa IS NULL OR total_aoa < 0 THEN
    RETURN 1;
  END IF;
  WHILE level_num < 100 AND total_aoa >= public.get_aoa_required_for_level(level_num + 1) LOOP
    level_num := level_num + 1;
  END LOOP;
  RETURN level_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_aoa(
  p_user_id TEXT,
  p_source TEXT,
  p_action TEXT,
  p_reference_id TEXT,
  p_amount INTEGER,
  p_dedupe_key TEXT,
  p_metadata JSONB,
  p_daily_cap INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted UUID;
  v_today DATE := (NOW() AT TIME ZONE 'utc')::date;
  v_count INTEGER;
  v_total INTEGER;
  v_level INTEGER;
BEGIN
  IF p_user_id IS NULL OR length(trim(p_user_id)) = 0 OR p_dedupe_key IS NULL OR length(trim(p_dedupe_key)) = 0 THEN
    RETURN json_build_object('awarded', false, 'reason', 'invalid');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('awarded', false, 'reason', 'invalid');
  END IF;

  IF p_daily_cap IS NOT NULL AND p_daily_cap > 0 THEN
    SELECT COUNT(*) INTO v_count
    FROM public.user_progress_events
    WHERE user_id = p_user_id
      AND source = p_source
      AND action = p_action
      AND (created_at AT TIME ZONE 'utc')::date = v_today;
    IF v_count >= p_daily_cap THEN
      RETURN json_build_object('awarded', false, 'capped', true);
    END IF;
  END IF;

  INSERT INTO public.user_progress_events (
    user_id, source, action, reference_id, aoa_amount, dedupe_key, metadata
  ) VALUES (
    p_user_id, p_source, p_action, p_reference_id, p_amount, p_dedupe_key, COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (dedupe_key) DO NOTHING
  RETURNING id INTO v_inserted;

  IF v_inserted IS NULL THEN
    RETURN json_build_object('awarded', false, 'duplicate', true);
  END IF;

  SELECT COALESCE(SUM(aoa_amount), 0) INTO v_total
  FROM public.user_progress_events
  WHERE user_id = p_user_id
    AND source <> 'legacy';

  v_level := public.get_level_from_aoa(v_total);

  INSERT INTO public.user_progress (user_id, total_aoa, level, updated_at)
  VALUES (p_user_id, v_total, v_level, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET total_aoa = EXCLUDED.total_aoa,
        level = EXCLUDED.level,
        updated_at = NOW();

  RETURN json_build_object('awarded', true, 'total_aoa', v_total, 'level', v_level);
END;
$$;

REVOKE ALL ON FUNCTION public.award_aoa(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_aoa(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.award_aoa(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB, INTEGER) FROM authenticated;

-- Existing quest payouts keep their catalog amounts, but land in the ledger once.
CREATE OR REPLACE FUNCTION public.award_bananas(p_glyph_user_id TEXT, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;
  PERFORM public.award_aoa(
    p_glyph_user_id,
    'activity',
    'quest',
    NULL,
    p_amount,
    'activity:quest:' || p_glyph_user_id || ':' || p_amount::text || ':' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'),
    '{}'::jsonb,
    NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_achievement(p_glyph_user_id TEXT, p_achievement_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bananas INTEGER;
  v_title TEXT;
  v_already_earned BOOLEAN;
  v_pay INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.gamify_user_achievements
    WHERE glyph_user_id = p_glyph_user_id AND achievement_code = p_achievement_code
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN FALSE;
  END IF;

  SELECT bananas_reward, title INTO v_bananas, v_title
  FROM public.gamify_achievements_catalog
  WHERE achievement_code = p_achievement_code;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.gamify_user_achievements (glyph_user_id, achievement_code)
  VALUES (p_glyph_user_id, p_achievement_code);

  -- Wardrobe does not pay AOA in this phase. The unlock row is still stored.
  v_pay := CASE WHEN p_achievement_code = 'wardrobe_used' THEN 0 ELSE COALESCE(v_bananas, 0) END;
  IF v_pay > 0 THEN
    PERFORM public.award_aoa(
      p_glyph_user_id,
      'achievement',
      'gamify',
      p_achievement_code,
      v_pay,
      'achievement:' || p_achievement_code || ':' || p_glyph_user_id,
      jsonb_build_object('title', v_title),
      NULL
    );
  END IF;

  RETURN TRUE;
END;
$$;

-- Recompute aggregates from new events only. Legacy seed rows, if any, do not count.
-- Users with no new events are set back to 0 / level 1. Game scores are not touched.
INSERT INTO public.user_progress (user_id, total_aoa, level, updated_at)
SELECT
  user_id,
  SUM(aoa_amount)::INTEGER,
  public.get_level_from_aoa(SUM(aoa_amount)::INTEGER),
  NOW()
FROM public.user_progress_events
WHERE source <> 'legacy'
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
  SET total_aoa = EXCLUDED.total_aoa,
      level = EXCLUDED.level,
      updated_at = NOW();

UPDATE public.user_progress
SET total_aoa = 0,
    level = 1,
    updated_at = NOW()
WHERE user_id NOT IN (
  SELECT user_id FROM public.user_progress_events WHERE source <> 'legacy'
);
