-- Verified user actions. Separate from the AOA reward ledger (user_progress_events).
-- An action can exist when it earns no AOA.
-- Not executed by the app. Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.user_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  reference_id TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_activity_events_user_occurred_idx
  ON public.user_activity_events (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS user_activity_events_reference_idx
  ON public.user_activity_events (source, reference_id);

ALTER TABLE public.user_activity_events ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies. The service role writes after a verified action.
