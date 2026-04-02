-- =============================================================================
-- Merge arcade `users` into `user_profiles`, drop `users`, repoint FKs.
-- Run after 011/012/013. Requires PostgreSQL 15+ (FK → partial unique index).
-- Backup first.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Columns from arcade `users` → `user_profiles` (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS block_dodger_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS neon_racer_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ape_man_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flappy_ape_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS galaxy_ape_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selected_ape JSONB,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_games_played INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS block_dodger_games INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS neon_racer_games INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ape_man_games INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flappy_ape_games INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS galaxy_ape_games INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clubroom_visits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reactions_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nft_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_game_played TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_game_played TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forever_ape_id INTEGER;

COMMENT ON COLUMN public.user_profiles.wallet_address IS
  'Primary EVM address for arcade (lowercase). FK target for game_scores, user_achievements, upgrades.';

-- Migrate 013 `evm_wallet` → `wallet_address` if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'evm_wallet'
  ) THEN
    UPDATE public.user_profiles
    SET wallet_address = lower(trim(evm_wallet))
    WHERE wallet_address IS NULL AND evm_wallet IS NOT NULL AND length(trim(evm_wallet)) > 0;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Copy data from `users` when it exists
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN

  -- 2a) Match by glyph_user_id (both set)
  UPDATE public.user_profiles up
  SET
    username = COALESCE(up.username, u.username),
    wallet_address = COALESCE(lower(trim(up.wallet_address)), lower(trim(u.wallet_address))),
    block_dodger_score = GREATEST(COALESCE(u.block_dodger_score, 0), COALESCE(up.block_dodger_score, 0)),
    neon_racer_score = GREATEST(COALESCE(u.neon_racer_score, 0), COALESCE(up.neon_racer_score, 0)),
    ape_man_score = GREATEST(COALESCE(u.ape_man_score, 0), COALESCE(up.ape_man_score, 0)),
    flappy_ape_score = GREATEST(COALESCE(u.flappy_ape_score, 0), COALESCE(up.flappy_ape_score, 0)),
    galaxy_ape_score = GREATEST(COALESCE(u.galaxy_ape_score, 0), COALESCE(up.galaxy_ape_score, 0)),
    total_points = GREATEST(COALESCE(up.total_points, 0), COALESCE(u.total_points, 0)),
    selected_ape = COALESCE(up.selected_ape, u.selected_ape),
    level = GREATEST(COALESCE(up.level, 1), COALESCE(u.level, 1)),
    experience = GREATEST(COALESCE(up.experience, 0), COALESCE(u.experience, 0)),
    total_games_played = GREATEST(COALESCE(up.total_games_played, 0), COALESCE(u.total_games_played, 0)),
    block_dodger_games = GREATEST(COALESCE(up.block_dodger_games, 0), COALESCE(u.block_dodger_games, 0)),
    neon_racer_games = GREATEST(COALESCE(up.neon_racer_games, 0), COALESCE(u.neon_racer_games, 0)),
    ape_man_games = GREATEST(COALESCE(up.ape_man_games, 0), COALESCE(u.ape_man_games, 0)),
    flappy_ape_games = GREATEST(COALESCE(up.flappy_ape_games, 0), COALESCE(u.flappy_ape_games, 0)),
    galaxy_ape_games = GREATEST(COALESCE(up.galaxy_ape_games, 0), COALESCE(u.galaxy_ape_games, 0)),
    clubroom_visits = GREATEST(COALESCE(up.clubroom_visits, 0), COALESCE(u.clubroom_visits, 0)),
    messages_sent = GREATEST(COALESCE(up.messages_sent, 0), COALESCE(u.messages_sent, 0)),
    reactions_sent = GREATEST(COALESCE(up.reactions_sent, 0), COALESCE(u.reactions_sent, 0)),
    nft_count = GREATEST(COALESCE(up.nft_count, 0), COALESCE(u.nft_count, 0)),
    first_game_played = COALESCE(up.first_game_played, u.first_game_played),
    last_game_played = COALESCE(up.last_game_played, u.last_game_played),
    forever_ape_id = COALESCE(up.forever_ape_id, u.forever_ape_id),
    updated_at = NOW()
  FROM public.users u
  WHERE NULLIF(TRIM(up.glyph_user_id), '') IS NOT NULL
    AND NULLIF(TRIM(u.glyph_user_id), '') IS NOT NULL
    AND up.glyph_user_id = u.glyph_user_id;

  -- 2b) Match by wallet (case-insensitive)
  UPDATE public.user_profiles up
  SET
    username = COALESCE(up.username, u.username),
    wallet_address = lower(trim(u.wallet_address)),
    glyph_user_id = CASE
      WHEN NULLIF(TRIM(up.glyph_user_id), '') IS NULL AND NULLIF(TRIM(u.glyph_user_id), '') IS NOT NULL THEN u.glyph_user_id
      ELSE up.glyph_user_id
    END,
    block_dodger_score = GREATEST(COALESCE(u.block_dodger_score, 0), COALESCE(up.block_dodger_score, 0)),
    neon_racer_score = GREATEST(COALESCE(u.neon_racer_score, 0), COALESCE(up.neon_racer_score, 0)),
    ape_man_score = GREATEST(COALESCE(u.ape_man_score, 0), COALESCE(up.ape_man_score, 0)),
    flappy_ape_score = GREATEST(COALESCE(u.flappy_ape_score, 0), COALESCE(up.flappy_ape_score, 0)),
    galaxy_ape_score = GREATEST(COALESCE(u.galaxy_ape_score, 0), COALESCE(up.galaxy_ape_score, 0)),
    total_points = GREATEST(COALESCE(up.total_points, 0), COALESCE(u.total_points, 0)),
    selected_ape = COALESCE(up.selected_ape, u.selected_ape),
    level = GREATEST(COALESCE(up.level, 1), COALESCE(u.level, 1)),
    experience = GREATEST(COALESCE(up.experience, 0), COALESCE(u.experience, 0)),
    total_games_played = GREATEST(COALESCE(up.total_games_played, 0), COALESCE(u.total_games_played, 0)),
    block_dodger_games = GREATEST(COALESCE(up.block_dodger_games, 0), COALESCE(u.block_dodger_games, 0)),
    neon_racer_games = GREATEST(COALESCE(up.neon_racer_games, 0), COALESCE(u.neon_racer_games, 0)),
    ape_man_games = GREATEST(COALESCE(up.ape_man_games, 0), COALESCE(u.ape_man_games, 0)),
    flappy_ape_games = GREATEST(COALESCE(up.flappy_ape_games, 0), COALESCE(u.flappy_ape_games, 0)),
    galaxy_ape_games = GREATEST(COALESCE(up.galaxy_ape_games, 0), COALESCE(u.galaxy_ape_games, 0)),
    clubroom_visits = GREATEST(COALESCE(up.clubroom_visits, 0), COALESCE(u.clubroom_visits, 0)),
    messages_sent = GREATEST(COALESCE(up.messages_sent, 0), COALESCE(u.messages_sent, 0)),
    reactions_sent = GREATEST(COALESCE(up.reactions_sent, 0), COALESCE(u.reactions_sent, 0)),
    nft_count = GREATEST(COALESCE(up.nft_count, 0), COALESCE(u.nft_count, 0)),
    first_game_played = COALESCE(up.first_game_played, u.first_game_played),
    last_game_played = COALESCE(up.last_game_played, u.last_game_played),
    forever_ape_id = COALESCE(up.forever_ape_id, u.forever_ape_id),
    updated_at = NOW()
  FROM public.users u
  WHERE lower(trim(u.wallet_address)) = lower(trim(up.wallet_address))
    AND length(trim(up.wallet_address)) > 0;

  -- 2c) Insert remaining `users` rows as new profiles (synthetic glyph id)
  INSERT INTO public.user_profiles (
    glyph_user_id,
    wallet_address,
    username,
    avatar_url,
    display_name,
    x_username,
    bananas,
    block_dodger_score,
    neon_racer_score,
    ape_man_score,
    flappy_ape_score,
    galaxy_ape_score,
    total_points,
    selected_ape,
    level,
    experience,
    total_games_played,
    block_dodger_games,
    neon_racer_games,
    ape_man_games,
    flappy_ape_games,
    galaxy_ape_games,
    clubroom_visits,
    messages_sent,
    reactions_sent,
    nft_count,
    first_game_played,
    last_game_played,
    forever_ape_id,
    created_at,
    updated_at
  )
  SELECT
    COALESCE(NULLIF(TRIM(u.glyph_user_id), ''), 'legacy:' || lower(trim(u.wallet_address))),
    lower(trim(u.wallet_address)),
    u.username,
    NULL,
    NULL,
    NULL,
    0,
    COALESCE(u.block_dodger_score, 0),
    COALESCE(u.neon_racer_score, 0),
    COALESCE(u.ape_man_score, 0),
    COALESCE(u.flappy_ape_score, 0),
    COALESCE(u.galaxy_ape_score, 0),
    COALESCE(u.total_points, 0),
    u.selected_ape,
    COALESCE(u.level, 1),
    COALESCE(u.experience, 0),
    COALESCE(u.total_games_played, 0),
    COALESCE(u.block_dodger_games, 0),
    COALESCE(u.neon_racer_games, 0),
    COALESCE(u.ape_man_games, 0),
    COALESCE(u.flappy_ape_games, 0),
    COALESCE(u.galaxy_ape_games, 0),
    COALESCE(u.clubroom_visits, 0),
    COALESCE(u.messages_sent, 0),
    COALESCE(u.reactions_sent, 0),
    COALESCE(u.nft_count, 0),
    u.first_game_played,
    u.last_game_played,
    u.forever_ape_id,
    COALESCE(u.created_at, NOW()),
    NOW()
  FROM public.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_profiles p
    WHERE lower(trim(p.wallet_address)) = lower(trim(u.wallet_address))
  )
  ON CONFLICT (glyph_user_id) DO NOTHING;

  ELSE
    RAISE NOTICE 'public.users not found — skipping row merge (columns already added).';
  END IF;

END $$;

-- Drop 013 evm_wallet (replaced by wallet_address)
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS evm_wallet;
DROP INDEX IF EXISTS public.idx_user_profiles_evm_wallet_lower;

-- Normalize wallet addresses to lowercase
UPDATE public.user_profiles
SET wallet_address = lower(trim(wallet_address))
WHERE wallet_address IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) Drop FKs pointing at `users`, then drop `users`
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_scores DROP CONSTRAINT IF EXISTS game_scores_wallet_address_fkey;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_wallet_address_fkey;
ALTER TABLE public.user_upgrades DROP CONSTRAINT IF EXISTS user_upgrades_wallet_address_fkey;
ALTER TABLE public.user_powerups DROP CONSTRAINT IF EXISTS user_powerups_wallet_address_fkey;
ALTER TABLE public.user_selected_powerup DROP CONSTRAINT IF EXISTS user_selected_powerup_wallet_address_fkey;

DROP TRIGGER IF EXISTS update_total_points_trigger ON public.users;
DROP TRIGGER IF EXISTS after_insert_score ON public.game_scores;
DROP TRIGGER IF EXISTS after_update_score ON public.game_scores;

DROP TABLE IF EXISTS public.users;

-- ---------------------------------------------------------------------------
-- 4) UNIQUE on `wallet_address` for FK references.
--    Partial unique indexes are NOT valid FK targets on PG14 / many hosts (ERROR 42830).
--    PostgreSQL allows multiple NULLs in a UNIQUE column (each NULL is distinct).
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_user_profiles_wallet_lower;
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_wallet_address_key;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_wallet_address_key UNIQUE (wallet_address);

CREATE INDEX IF NOT EXISTS idx_user_profiles_glyph_arcade
  ON public.user_profiles (glyph_user_id)
  WHERE glyph_user_id IS NOT NULL AND length(trim(glyph_user_id)) > 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_forever_ape_id
  ON public.user_profiles (forever_ape_id)
  WHERE forever_ape_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5) Repoint FKs to `user_profiles(wallet_address)`
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_scores
  ADD CONSTRAINT game_scores_wallet_address_fkey
  FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);

ALTER TABLE public.user_achievements
  ADD CONSTRAINT user_achievements_wallet_address_fkey
  FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);

ALTER TABLE public.user_upgrades
  ADD CONSTRAINT user_upgrades_wallet_address_fkey
  FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);

ALTER TABLE public.user_powerups
  ADD CONSTRAINT user_powerups_wallet_address_fkey
  FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);

ALTER TABLE public.user_selected_powerup
  ADD CONSTRAINT user_selected_powerup_wallet_address_fkey
  FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);

-- ---------------------------------------------------------------------------
-- 6) Triggers & functions: `users` → `user_profiles`
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_total_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET total_points =
      COALESCE(NEW.block_dodger_score, 0)
    + COALESCE(NEW.neon_racer_score, 0)
    + COALESCE(NEW.ape_man_score, 0)
    + COALESCE(NEW.flappy_ape_score, 0)
    + COALESCE(NEW.galaxy_ape_score, 0)
  WHERE wallet_address = NEW.wallet_address;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_game_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.game_id = 'block_dodger' THEN
    UPDATE public.user_profiles SET block_dodger_score = NEW.score
    WHERE wallet_address = NEW.wallet_address
      AND (block_dodger_score IS NULL OR NEW.score > block_dodger_score);
  ELSIF NEW.game_id = 'neon_racer' THEN
    UPDATE public.user_profiles SET neon_racer_score = NEW.score
    WHERE wallet_address = NEW.wallet_address
      AND (neon_racer_score IS NULL OR NEW.score > neon_racer_score);
  ELSIF NEW.game_id IN ('ape_man', 'pacman') THEN
    UPDATE public.user_profiles SET ape_man_score = NEW.score
    WHERE wallet_address = NEW.wallet_address
      AND (ape_man_score IS NULL OR NEW.score > ape_man_score);
  ELSIF NEW.game_id = 'flappy_ape' THEN
    UPDATE public.user_profiles SET flappy_ape_score = NEW.score
    WHERE wallet_address = NEW.wallet_address
      AND (flappy_ape_score IS NULL OR NEW.score > flappy_ape_score);
  ELSIF NEW.game_id IN ('galaxy_ape', 'run_ape') THEN
    UPDATE public.user_profiles SET galaxy_ape_score = NEW.score
    WHERE wallet_address = NEW.wallet_address
      AND (galaxy_ape_score IS NULL OR NEW.score > galaxy_ape_score);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_points_trigger ON public.user_profiles;
CREATE TRIGGER update_total_points_trigger
  AFTER UPDATE OF block_dodger_score, neon_racer_score, ape_man_score, flappy_ape_score, galaxy_ape_score
  ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_total_points();

DROP TRIGGER IF EXISTS after_insert_score ON public.game_scores;
CREATE TRIGGER after_insert_score
  AFTER INSERT ON public.game_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_game_score();

DROP TRIGGER IF EXISTS after_update_score ON public.game_scores;
CREATE TRIGGER after_update_score
  AFTER UPDATE OF score ON public.game_scores
  FOR EACH ROW
  WHEN (NEW.score > OLD.score)
  EXECUTE FUNCTION public.update_game_score();

CREATE OR REPLACE FUNCTION public.add_experience(user_wallet TEXT, xp_amount INTEGER)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, total_xp INTEGER) AS $$
DECLARE
  old_level INTEGER;
  new_xp INTEGER;
  calculated_level INTEGER;
  did_level_up BOOLEAN := FALSE;
BEGIN
  SELECT level, experience INTO old_level, new_xp
  FROM public.user_profiles WHERE wallet_address = user_wallet;

  new_xp := COALESCE(new_xp, 0) + xp_amount;
  calculated_level := get_level_from_experience(new_xp);
  IF calculated_level > COALESCE(old_level, 1) THEN
    did_level_up := TRUE;
  END IF;

  UPDATE public.user_profiles SET experience = new_xp, level = calculated_level WHERE wallet_address = user_wallet;

  RETURN QUERY SELECT calculated_level, did_level_up, new_xp;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_achievements(user_wallet TEXT)
RETURNS TABLE(achievement_id TEXT, achievement_name TEXT, reward_xp INTEGER) AS $$
DECLARE
  user_data RECORD;
  achievement RECORD;
  meets_requirement BOOLEAN;
BEGIN
  SELECT * INTO user_data FROM public.user_profiles WHERE wallet_address = user_wallet;
  FOR achievement IN
    SELECT * FROM public.achievements a WHERE a.id NOT IN (
      SELECT ua.achievement_id FROM public.user_achievements ua WHERE ua.wallet_address = user_wallet
    )
  LOOP
    meets_requirement := TRUE;
    IF achievement.id LIKE 'first_%' AND COALESCE(user_data.total_games_played, 0) < 1 THEN
      meets_requirement := FALSE;
    END IF;
    IF meets_requirement THEN
      INSERT INTO public.user_achievements (wallet_address, achievement_id)
      VALUES (user_wallet, achievement.id)
      ON CONFLICT (wallet_address, achievement_id) DO NOTHING;
      PERFORM add_experience(user_wallet, COALESCE(achievement.reward_xp, 0));
      RETURN QUERY SELECT achievement.id, achievement.name, achievement.reward_xp;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 7) RLS: allow anon insert/update (same as former `users` arcade policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Arcade client insert user_profiles" ON public.user_profiles;
CREATE POLICY "Arcade client insert user_profiles" ON public.user_profiles
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Arcade client update user_profiles" ON public.user_profiles;
CREATE POLICY "Arcade client update user_profiles" ON public.user_profiles
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

COMMIT;
