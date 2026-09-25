-- Public profile link preferences.
-- X visibility and which wallets may appear as OpenSea links.
-- Does not copy wallet rows and does not expose unselected wallets.
-- Not executed by the app. Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.user_profile_public_links (
  user_id TEXT PRIMARY KEY,
  show_x BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_public_wallets (
  user_id TEXT NOT NULL,
  wallet_address_normalized TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, wallet_address_normalized)
);

CREATE INDEX IF NOT EXISTS user_public_wallets_user_idx
  ON public.user_public_wallets (user_id);

ALTER TABLE public.user_profile_public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_public_wallets ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated policies. The service role writes after Privy verification.
