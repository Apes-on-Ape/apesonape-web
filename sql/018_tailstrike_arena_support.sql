-- Tailstrike Arena support:
-- - adds per-game score/run columns to user_profiles
-- - includes Tailstrike in total_points recompute trigger
-- - wires game_scores -> user_profiles high score sync for tailstrike_arena
-- - seeds Tailstrike run-count achievements

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS tailstrike_arena_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tailstrike_arena_games INTEGER DEFAULT 0;

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
    + COALESCE(NEW.tailstrike_arena_score, 0)
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
  ELSIF NEW.game_id = 'tailstrike_arena' THEN
    UPDATE public.user_profiles SET tailstrike_arena_score = NEW.score
    WHERE wallet_address = NEW.wallet_address
      AND (tailstrike_arena_score IS NULL OR NEW.score > tailstrike_arena_score);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_points_trigger ON public.user_profiles;
CREATE TRIGGER update_total_points_trigger
  AFTER UPDATE OF block_dodger_score, neon_racer_score, ape_man_score, flappy_ape_score, galaxy_ape_score, tailstrike_arena_score
  ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_total_points();

-- Keep existing scores if this table already has tailstrike rows.
INSERT INTO public.game_scores (wallet_address, game_id, score, created_at)
SELECT wallet_address, 'tailstrike_arena', COALESCE(tailstrike_arena_score, 0), NOW()
FROM public.user_profiles
WHERE COALESCE(tailstrike_arena_score, 0) > 0
ON CONFLICT (wallet_address, game_id)
DO UPDATE SET score = GREATEST(public.game_scores.score, EXCLUDED.score);

DO $$
BEGIN
  -- Newer schema variant
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'achievements'
      AND column_name = 'achievement_id'
  ) THEN
    INSERT INTO public.achievements
      (achievement_id, name, description, category, icon, criteria, reward_points, hidden)
    VALUES
      ('tailstrike_arena_1', 'Tailstrike Rookie', 'Play 1 Tailstrike Arena run', 'games', '⚔️', '{"tailstrike_arena_games": 1}', 225, false),
      ('tailstrike_arena_5', 'Tailstrike Explorer', 'Play 5 Tailstrike Arena runs', 'games', '🛡️', '{"tailstrike_arena_games": 5}', 375, false),
      ('tailstrike_arena_25', 'Tailstrike Expert', 'Play 25 Tailstrike Arena runs', 'games', '🏅', '{"tailstrike_arena_games": 25}', 750, false),
      ('tailstrike_arena_100', 'Tailstrike Legend', 'Play 100 Tailstrike Arena runs', 'games', '👑', '{"tailstrike_arena_games": 100}', 1500, false)
    ON CONFLICT DO NOTHING;
  ELSE
    -- Original schema variant from this repo
    INSERT INTO public.achievements
      (id, name, description, category, icon, requirements, reward_xp, is_hidden)
    VALUES
      ('tailstrike_arena_1', 'Tailstrike Rookie', 'Play 1 Tailstrike Arena run', 'games', '⚔️', '{"tailstrike_arena_games": 1}', 225, false),
      ('tailstrike_arena_5', 'Tailstrike Explorer', 'Play 5 Tailstrike Arena runs', 'games', '🛡️', '{"tailstrike_arena_games": 5}', 375, false),
      ('tailstrike_arena_25', 'Tailstrike Expert', 'Play 25 Tailstrike Arena runs', 'games', '🏅', '{"tailstrike_arena_games": 25}', 750, false),
      ('tailstrike_arena_100', 'Tailstrike Legend', 'Play 100 Tailstrike Arena runs', 'games', '👑', '{"tailstrike_arena_games": 100}', 1500, false)
    ON CONFLICT DO NOTHING;
  END IF;
END
$$;

-- Recompute totals once for existing rows.
UPDATE public.user_profiles
SET total_points =
    COALESCE(block_dodger_score, 0)
  + COALESCE(neon_racer_score, 0)
  + COALESCE(ape_man_score, 0)
  + COALESCE(flappy_ape_score, 0)
  + COALESCE(galaxy_ape_score, 0)
  + COALESCE(tailstrike_arena_score, 0);
