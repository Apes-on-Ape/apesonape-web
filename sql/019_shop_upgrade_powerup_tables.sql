-- Ensures permanent shop persistence tables exist for arcade games.
-- Used by Block Dodger and Neon Racer via /api/arcade/shop/state.

CREATE TABLE IF NOT EXISTS public.user_powerups (
  id serial NOT NULL,
  wallet_address text NOT NULL,
  game_id text NOT NULL,
  powerups jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_powerups_pkey PRIMARY KEY (id),
  CONSTRAINT user_powerups_wallet_address_game_id_key UNIQUE (wallet_address, game_id),
  CONSTRAINT user_powerups_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.user_profiles (wallet_address)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS user_powerups_wallet_address_idx
  ON public.user_powerups USING btree (wallet_address) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS user_powerups_game_id_idx
  ON public.user_powerups USING btree (game_id) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.user_upgrades (
  id serial NOT NULL,
  wallet_address text NOT NULL,
  game_id text NOT NULL,
  upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_upgrades_pkey PRIMARY KEY (id),
  CONSTRAINT user_upgrades_wallet_address_game_id_key UNIQUE (wallet_address, game_id),
  CONSTRAINT user_upgrades_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.user_profiles (wallet_address)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS user_upgrades_wallet_address_idx
  ON public.user_upgrades USING btree (wallet_address) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS user_upgrades_game_id_idx
  ON public.user_upgrades USING btree (game_id) TABLESPACE pg_default;

