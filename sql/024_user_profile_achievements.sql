-- Profile Achievements. The only unlock ledger for the new AOA era.
-- Old public.achievements / public.user_achievements rows are left in place and are not read.
-- Not executed by the app. Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.user_profile_achievements (
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress_value INTEGER NOT NULL DEFAULT 0,
  rewarded_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_profile_achievements_user_idx
  ON public.user_profile_achievements (user_id, unlocked_at DESC);

ALTER TABLE public.user_profile_achievements ENABLE ROW LEVEL SECURITY;

-- No public write policy. The service role inserts a row only after the server
-- evaluates the milestone. Missing policies block anon and authenticated writes.
