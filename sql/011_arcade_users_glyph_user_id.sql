-- Link arcade `users` rows to site `user_profiles` (Glyph id) for leaderboard display names, avatars, X handles.
-- Clients send `glyph_user_id` with score / stats saves when the user is signed in on the main site.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS glyph_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_arcade_users_glyph_user_id ON public.users (glyph_user_id)
WHERE glyph_user_id IS NOT NULL AND length(trim(glyph_user_id)) > 0;

COMMENT ON COLUMN public.users.glyph_user_id IS 'Glyph account id — matches user_profiles.glyph_user_id for profile enrichment';
