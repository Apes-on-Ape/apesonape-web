-- Daily engagement: UTC daily quest rollover, studio quests, visit streak columns,
-- and touch_engagement_streak RPC. Run in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- 1) gamify_user_quests: track UTC calendar day for daily quest reset
-- ---------------------------------------------------------------------------
ALTER TABLE public.gamify_user_quests
  ADD COLUMN IF NOT EXISTS last_daily_period_utc DATE;

COMMENT ON COLUMN public.gamify_user_quests.last_daily_period_utc IS
  'UTC date of last daily-quest period; when < today (UTC), daily quests reset on next progress.';

-- ---------------------------------------------------------------------------
-- 2) user_profiles: streak fields (Glyph id keyed rows)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS engagement_streak_current INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_streak_best INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_last_active_date DATE;

COMMENT ON COLUMN public.user_profiles.engagement_streak_current IS
  'Consecutive UTC days with at least one qualifying engagement (visit mosaic or studio publish).';
COMMENT ON COLUMN public.user_profiles.engagement_streak_best IS 'Highest streak reached.';
COMMENT ON COLUMN public.user_profiles.engagement_last_active_date IS 'Last UTC date streak was touched.';

-- ---------------------------------------------------------------------------
-- 3) New quests (studio daily loop)
-- ---------------------------------------------------------------------------
INSERT INTO public.gamify_quests_catalog (quest_code, title, description, quest_icon, bananas_reward, category, target_count) VALUES
('daily_studio_mosaic_visit', 'Studio visitor', 'Open the community mosaic or studio feed once today', '🖼️', 3, 'daily', 1),
('daily_studio_publish', 'Daily studio drop', 'Publish one AI image to the studio today', '✨', 5, 'daily', 1)
ON CONFLICT (quest_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) progress_quest — daily category resets when last_daily_period_utc < UTC today
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.progress_quest(p_glyph_user_id TEXT, p_quest_code TEXT, p_increment INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  v_target INTEGER;
  v_current_progress INTEGER;
  v_bananas INTEGER;
  v_title TEXT;
  v_quest_status TEXT;
  v_category TEXT;
  v_today DATE := (NOW() AT TIME ZONE 'utc')::date;
BEGIN
  SELECT target_count, bananas_reward, title, category
  INTO v_target, v_bananas, v_title, v_category
  FROM public.gamify_quests_catalog
  WHERE quest_code = p_quest_code;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.gamify_user_quests (
    glyph_user_id, quest_code, progress, target, status, last_daily_period_utc
  )
  VALUES (
    p_glyph_user_id,
    p_quest_code,
    LEAST(p_increment, v_target),
    v_target,
    'active',
    CASE WHEN v_category = 'daily' THEN v_today ELSE NULL END
  )
  ON CONFLICT (glyph_user_id, quest_code)
  DO UPDATE SET
    last_daily_period_utc = CASE
      WHEN v_category = 'daily' THEN
        CASE
          WHEN gamify_user_quests.last_daily_period_utc IS NULL
            OR gamify_user_quests.last_daily_period_utc < v_today
          THEN v_today
          ELSE gamify_user_quests.last_daily_period_utc
        END
      ELSE gamify_user_quests.last_daily_period_utc
    END,
    progress = CASE
      WHEN v_category = 'daily'
        AND (
          gamify_user_quests.last_daily_period_utc IS NULL
          OR gamify_user_quests.last_daily_period_utc < v_today
        )
      THEN LEAST(p_increment, v_target)
      ELSE LEAST(gamify_user_quests.progress + p_increment, v_target)
    END,
    status = CASE
      WHEN v_category = 'daily'
        AND (
          gamify_user_quests.last_daily_period_utc IS NULL
          OR gamify_user_quests.last_daily_period_utc < v_today
        )
      THEN 'active'::text
      ELSE gamify_user_quests.status
    END,
    completed_at = CASE
      WHEN v_category = 'daily'
        AND (
          gamify_user_quests.last_daily_period_utc IS NULL
          OR gamify_user_quests.last_daily_period_utc < v_today
        )
      THEN NULL::timestamptz
      ELSE gamify_user_quests.completed_at
    END,
    target = v_target,
    updated_at = NOW()
  RETURNING progress, status INTO v_current_progress, v_quest_status;

  IF v_current_progress >= v_target AND v_quest_status = 'active' THEN
    UPDATE public.gamify_user_quests
    SET status = 'completed', completed_at = NOW()
    WHERE glyph_user_id = p_glyph_user_id AND quest_code = p_quest_code;

    PERFORM public.award_bananas(p_glyph_user_id, v_bananas);

    INSERT INTO public.gamify_notifications (glyph_user_id, notification_type, title, message, bananas_earned)
    VALUES (
      p_glyph_user_id,
      'quest_complete',
      'Quest Complete!',
      v_title || ' - You earned ' || v_bananas || ' bananas!',
      v_bananas
    );

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 5) Streak: idempotent per UTC day (first qualifying action increments)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_engagement_streak(p_glyph_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'utc')::date;
  v_last DATE;
  v_streak INTEGER;
  v_best INTEGER;
  v_new_streak INTEGER;
  v_updated INTEGER;
BEGIN
  UPDATE public.user_profiles
  SET
    engagement_last_active_date = v_today,
    engagement_streak_current = CASE
      WHEN engagement_last_active_date IS NULL THEN 1
      WHEN engagement_last_active_date = v_today THEN engagement_streak_current
      WHEN engagement_last_active_date = v_today - 1 THEN engagement_streak_current + 1
      ELSE 1
    END,
    engagement_streak_best = GREATEST(
      engagement_streak_best,
      CASE
        WHEN engagement_last_active_date IS NULL THEN 1
        WHEN engagement_last_active_date = v_today THEN engagement_streak_current
        WHEN engagement_last_active_date = v_today - 1 THEN engagement_streak_current + 1
        ELSE 1
      END
    ),
    updated_at = NOW()
  WHERE glyph_user_id = p_glyph_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    INSERT INTO public.user_profiles (
      glyph_user_id,
      bananas,
      engagement_streak_current,
      engagement_streak_best,
      engagement_last_active_date
    )
    VALUES (p_glyph_user_id, 0, 1, 1, v_today)
    ON CONFLICT (glyph_user_id) DO UPDATE SET
      engagement_last_active_date = v_today,
      engagement_streak_current = CASE
        WHEN user_profiles.engagement_last_active_date IS NULL THEN 1
        WHEN user_profiles.engagement_last_active_date = v_today THEN user_profiles.engagement_streak_current
        WHEN user_profiles.engagement_last_active_date = v_today - 1 THEN user_profiles.engagement_streak_current + 1
        ELSE 1
      END,
      engagement_streak_best = GREATEST(
        user_profiles.engagement_streak_best,
        CASE
          WHEN user_profiles.engagement_last_active_date IS NULL THEN 1
          WHEN user_profiles.engagement_last_active_date = v_today THEN user_profiles.engagement_streak_current
          WHEN user_profiles.engagement_last_active_date = v_today - 1 THEN user_profiles.engagement_streak_current + 1
          ELSE 1
        END
      ),
      updated_at = NOW();
  END IF;

  SELECT engagement_last_active_date, engagement_streak_current, engagement_streak_best
  INTO v_last, v_streak, v_best
  FROM public.user_profiles
  WHERE glyph_user_id = p_glyph_user_id;

  RETURN json_build_object(
    'last_active_date', v_last,
    'streak_current', COALESCE(v_streak, 0),
    'streak_best', COALESCE(v_best, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.touch_engagement_streak(TEXT) TO anon;
