-- Mirror profile Forever Ape on arcade `users` for leaderboards / server queries (source of truth remains `studio_forever_ape` on main DB).

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS forever_ape_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_arcade_users_forever_ape_id ON public.users (forever_ape_id)
WHERE forever_ape_id IS NOT NULL;

COMMENT ON COLUMN public.users.forever_ape_id IS 'Apes on Ape token id from profile Forever Ape — CDN via collection index';
