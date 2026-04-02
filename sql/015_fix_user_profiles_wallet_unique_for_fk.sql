-- Repair: ERROR 42830 — FK needs a non-partial UNIQUE on `user_profiles(wallet_address)`.
-- Use if 014 applied a partial unique index and failed on the FOREIGN KEY step.
-- Run in SQL Editor after fixing any duplicate non-null `wallet_address` rows on `user_profiles`.

BEGIN;

DROP INDEX IF EXISTS public.idx_user_profiles_wallet_lower;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_wallet_address_key;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_wallet_address_key UNIQUE (wallet_address);

-- FKs (skip any that already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_scores_wallet_address_fkey'
  ) THEN
    ALTER TABLE public.game_scores
      ADD CONSTRAINT game_scores_wallet_address_fkey
      FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_wallet_address_fkey'
  ) THEN
    ALTER TABLE public.user_achievements
      ADD CONSTRAINT user_achievements_wallet_address_fkey
      FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_upgrades_wallet_address_fkey'
  ) THEN
    ALTER TABLE public.user_upgrades
      ADD CONSTRAINT user_upgrades_wallet_address_fkey
      FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_powerups_wallet_address_fkey'
  ) THEN
    ALTER TABLE public.user_powerups
      ADD CONSTRAINT user_powerups_wallet_address_fkey
      FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_selected_powerup_wallet_address_fkey'
  ) THEN
    ALTER TABLE public.user_selected_powerup
      ADD CONSTRAINT user_selected_powerup_wallet_address_fkey
      FOREIGN KEY (wallet_address) REFERENCES public.user_profiles(wallet_address);
  END IF;
END $$;

COMMIT;
