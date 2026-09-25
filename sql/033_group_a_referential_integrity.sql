-- GROUP A. Safe before preview.
-- Review in the Supabase SQL editor. The app does not run this file.
-- Does not delete rows, does not reset progression, and does not use CASCADE.
-- Audited 2026-09-25: every active user_id already matches user_profiles.glyph_user_id.
-- If VALIDATE fails, stop. Do not delete the blocking rows.

-- ---------------------------------------------------------------------------
-- 1. Foreign keys. Deleting a profile must not erase progression history.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  target RECORD;
BEGIN
  FOR target IN
    SELECT *
    FROM (VALUES
      ('user_progress', 'user_progress_user_id_fkey'),
      ('user_progress_events', 'user_progress_events_user_id_fkey'),
      ('user_wallet_aliases', 'user_wallet_aliases_user_id_fkey'),
      ('user_profile_achievements', 'user_profile_achievements_user_id_fkey'),
      ('user_activity_events', 'user_activity_events_user_id_fkey'),
      ('user_notifications', 'user_notifications_user_id_fkey'),
      ('user_owned_ape_observations', 'user_owned_ape_observations_user_id_fkey'),
      ('user_ownership_baselines', 'user_ownership_baselines_user_id_fkey'),
      ('user_profile_public_links', 'user_profile_public_links_user_id_fkey'),
      ('user_public_wallets', 'user_public_wallets_user_id_fkey'),
      ('aoa_achievement_unlocks', 'aoa_achievement_unlocks_user_id_fkey'),
      ('aoa_arcade_era', 'aoa_arcade_era_user_id_fkey')
    ) AS planned(table_name, constraint_name)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = target.constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES public.user_profiles (glyph_user_id) ON DELETE RESTRICT NOT VALID',
        target.table_name,
        target.constraint_name
      );
    END IF;
    EXECUTE format(
      'ALTER TABLE public.%I VALIDATE CONSTRAINT %I',
      target.table_name,
      target.constraint_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Idempotency indexes. Live rows had no duplicate keys on 2026-09-25.
--    Global uniqueness stays. Studio keys omit user id on purpose:
--    studio:publish:<creation id> and studio:published:<creation id>
--    must not be claimable by a second Ape.
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS user_progress_events_dedupe_key_idx
  ON public.user_progress_events (dedupe_key);

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_dedupe_key_idx
  ON public.user_notifications (dedupe_key);

-- user_activity_events.dedupe_key is already UNIQUE. Do not replace it
-- with (user_id, dedupe_key). The studio publish key is creation-scoped.

-- ---------------------------------------------------------------------------
-- 3. Nullable Studio owner. No backfill in this file.
-- ---------------------------------------------------------------------------

ALTER TABLE public.studio_creations
  ADD COLUMN IF NOT EXISTS user_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'studio_creations_user_id_fkey'
  ) THEN
    ALTER TABLE public.studio_creations
      ADD CONSTRAINT studio_creations_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.user_profiles (glyph_user_id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.studio_creations VALIDATE CONSTRAINT studio_creations_user_id_fkey;

-- ---------------------------------------------------------------------------
-- 4. One updated_at trigger for mutable profile tables that do not have one.
--    Ledgers are left alone: user_progress_events, user_activity_events,
--    user_notifications, user_owned_ape_observations.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_wallet_aliases_set_updated_at ON public.user_wallet_aliases;
CREATE TRIGGER trg_user_wallet_aliases_set_updated_at
  BEFORE UPDATE ON public.user_wallet_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_user_progress_set_updated_at ON public.user_progress;
CREATE TRIGGER trg_user_progress_set_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_user_profile_public_links_set_updated_at ON public.user_profile_public_links;
CREATE TRIGGER trg_user_profile_public_links_set_updated_at
  BEFORE UPDATE ON public.user_profile_public_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ---------------------------------------------------------------------------
-- 5. Legacy columns stay. They are not the AOA ledger.
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN public.user_profiles.bananas IS 'LEGACY. Not AOA. Active progression is user_progress.total_aoa.';
COMMENT ON COLUMN public.user_profiles.level IS 'LEGACY arcade level. Active level is derived from user_progress.total_aoa.';
COMMENT ON COLUMN public.user_profiles.experience IS 'LEGACY arcade XP. Not AOA.';
COMMENT ON COLUMN public.user_profiles.total_points IS 'LEGACY. Sum of per-game high scores for the arcade cabinet, not AOA.';
COMMENT ON COLUMN public.user_profiles.total_games_played IS 'LEGACY arcade counter.';
COMMENT ON COLUMN public.user_profiles.clubroom_visits IS 'LEGACY clubroom counter.';
COMMENT ON COLUMN public.user_profiles.messages_sent IS 'LEGACY clubroom counter.';
COMMENT ON COLUMN public.user_profiles.reactions_sent IS 'LEGACY clubroom counter.';
