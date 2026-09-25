-- Reserved for a possible later custom avatar.
-- Unused by the current UI. The profile image is the Forever Ape.
-- Do not drop this column. Not executed by the app. Run this in the Supabase SQL editor only if the column is still missing.
--
-- Column: public.user_profiles.avatar_token_id INTEGER NULL
-- Default: NULL
-- No new table, index, or RLS change. The existing user_profiles policies stay as they are.
-- The settings API writes this column with the service role after Privy verification.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_token_id INTEGER;
