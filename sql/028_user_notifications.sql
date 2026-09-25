-- Persistent in-app notifications and ownership observations.
-- Not executed by the app. Run this in the Supabase SQL editor.
-- Does not read or write gamify_notifications.

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_url TEXT,
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_dedupe_key_idx
  ON public.user_notifications (dedupe_key);

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_unread_idx
  ON public.user_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- First time an Ape's wallets are scanned, every current token is recorded here
-- and no "new Ape" notification is sent. Later inserts are the only detections.
CREATE TABLE IF NOT EXISTS public.user_owned_ape_observations (
  user_id TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token_id)
);

CREATE INDEX IF NOT EXISTS user_owned_ape_observations_user_idx
  ON public.user_owned_ape_observations (user_id);

-- One row means the baseline snapshot already happened for that Ape.
CREATE TABLE IF NOT EXISTS public.user_ownership_baselines (
  user_id TEXT PRIMARY KEY,
  established_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_owned_ape_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ownership_baselines ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies. The service role writes after a verified event.
