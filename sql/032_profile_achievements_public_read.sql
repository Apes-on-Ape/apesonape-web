-- Let the profile read earned achievements.
-- The AOA total already has a public read on user_progress.
-- This does not change amounts, unlock rows, or who can write.
-- Run in the Supabase SQL editor. Safe to re-run.

ALTER TABLE public.user_profile_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profile_achievements_public_read ON public.user_profile_achievements;

CREATE POLICY user_profile_achievements_public_read
ON public.user_profile_achievements
FOR SELECT
TO anon, authenticated
USING (true);
