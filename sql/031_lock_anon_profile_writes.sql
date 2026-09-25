-- Staging-only lock for browser writes that bypass the API.
-- Do not run this from the app. Do not run it on production until staging
-- confirms score submission still works through /api/achievements/save_game_stats.
-- The service role bypasses RLS, so authenticated API routes keep working.
-- Public SELECT policies are left in place so leaderboard reads do not break.

DROP POLICY IF EXISTS "Arcade client insert user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Arcade client update user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can insert their own scores" ON public.game_scores;
DROP POLICY IF EXISTS "Users can update their own scores" ON public.game_scores;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.gamify_notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.gamify_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.gamify_notifications;
