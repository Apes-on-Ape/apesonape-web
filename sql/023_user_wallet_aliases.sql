-- Display names for wallets an Ape has connected.
-- Does not change the address, authentication, or which wallet is primary.
-- Not executed by the app. Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.user_wallet_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_address_normalized TEXT NOT NULL,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_wallet_aliases_alias_len CHECK (char_length(btrim(alias)) BETWEEN 1 AND 32),
  CONSTRAINT user_wallet_aliases_user_wallet_unique UNIQUE (user_id, wallet_address_normalized)
);

CREATE INDEX IF NOT EXISTS user_wallet_aliases_user_idx
  ON public.user_wallet_aliases (user_id);

CREATE INDEX IF NOT EXISTS user_wallet_aliases_wallet_idx
  ON public.user_wallet_aliases (wallet_address_normalized);

ALTER TABLE public.user_wallet_aliases ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies. Writes go through the service role
-- after the API verifies the Privy access token. A missing policy means
-- the public key cannot insert, update, or delete rows.
