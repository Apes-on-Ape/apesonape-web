-- Primary EVM address for direct lookups from arcade `game_scores` / `wallet_address`
-- without traversing studio_creations. Stored lowercase in app code; index is case-insensitive.
-- `glyph_user_id` remains the canonical identity for the row.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS evm_wallet TEXT;

COMMENT ON COLUMN public.user_profiles.evm_wallet IS
  'Glyph-linked EVM address (lowercase 0x…). Enables wallet → PFP/display_name for games; synced when profile is saved or achievements/user resolves Glyph + wallet.';

-- One profile per wallet (when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_evm_wallet_lower
  ON public.user_profiles (lower(trim(evm_wallet)))
  WHERE evm_wallet IS NOT NULL AND length(trim(evm_wallet)) > 0;
