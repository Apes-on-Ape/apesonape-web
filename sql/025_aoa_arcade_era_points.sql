-- New-era points for Profile Achievements that read total_points.
-- Historical game_scores are not copied. Not executed by the app.

ALTER TABLE public.aoa_arcade_era
  ADD COLUMN IF NOT EXISTS points_total INTEGER NOT NULL DEFAULT 0;
