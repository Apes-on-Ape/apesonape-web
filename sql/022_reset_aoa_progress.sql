-- OPTIONAL DEV RESET. Do not run unless you intend to wipe the new AOA launch data.
-- This was not executed by the app.
--
-- Resets:
--   public.user_progress_events
--   public.user_progress
--   public.aoa_achievement_unlocks
--   public.aoa_arcade_era
--
-- Does not touch:
--   game_scores
--   user_profiles high-score columns (block_dodger_score, ape_man_score, and the rest)
--   user_profiles.total_points
--   user_profiles.bananas, experience, level
--   user_achievements
--   gamify_user_achievements

-- Skips any table that is not created yet, so this can run before or after sql/021.
DO $$
DECLARE
  rel text;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'public.user_progress_events',
    'public.user_progress',
    'public.aoa_achievement_unlocks',
    'public.aoa_arcade_era'
  ]
  LOOP
    IF to_regclass(rel) IS NOT NULL THEN
      EXECUTE 'DELETE FROM ' || rel;
    END IF;
  END LOOP;
END $$;
