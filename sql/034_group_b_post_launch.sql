-- GROUP B. Post-launch normalization.
-- Do not run this before preview.
-- Do not run it automatically.
-- Does not delete legacy tables, does not fabricate arcade runs, and does not move scores.

-- ---------------------------------------------------------------------------
-- 1. Studio owner backfill.
--    Requires sql/033, which adds nullable studio_creations.user_id.
--    Sets user_id only when the creator address maps to exactly one
--    glyph_user_id, and a stored glyph id does not disagree.
--    Leaves ambiguous and already-filled rows unchanged.
--    Audited 2026-09-25: 9 creations, 9 unambiguous, 0 glyph mismatches.
-- ---------------------------------------------------------------------------

WITH owners AS (
  SELECT lower(wallet_address) AS wallet, glyph_user_id AS user_id
  FROM public.user_profiles
  WHERE wallet_address IS NOT NULL AND btrim(wallet_address) <> ''
  UNION
  SELECT wallet_address_normalized, user_id
  FROM public.user_wallet_aliases
),
unique_owners AS (
  SELECT wallet
  FROM owners
  GROUP BY wallet
  HAVING COUNT(DISTINCT user_id) = 1
),
mapped AS (
  SELECT sc.id, MIN(owners.user_id) AS user_id
  FROM public.studio_creations sc
  JOIN owners ON owners.wallet = lower(sc.creator_address)
  JOIN unique_owners ON unique_owners.wallet = owners.wallet
  GROUP BY sc.id
)
UPDATE public.studio_creations AS sc
SET user_id = mapped.user_id
FROM mapped
WHERE sc.id = mapped.id
  AND sc.user_id IS NULL
  AND (
    NULLIF(sc.glyph_profile->>'glyphId', '') IS NULL
    OR sc.glyph_profile->>'glyphId' = mapped.user_id
  );

-- After the app writes user_id on every new publish and this backfill
-- covers every live row, a later migration may set the column NOT NULL.
-- Do not do that here.

-- ---------------------------------------------------------------------------
-- 2. Future arcade run ledger. Empty. No historical rows are invented.
--    Current runs are counted by aoa_arcade_era and deduped with
--    arcade:run:<game>:<user>:<utc minute>:<score>.
--    The client does not send a run id yet. Do not point the app at this
--    table until a server-generated run id exists.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.arcade_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles (glyph_user_id) ON DELETE RESTRICT,
  game_id TEXT NOT NULL,
  run_id UUID NOT NULL,
  score INTEGER NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  is_personal_best BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arcade_runs_user_game_run_unique UNIQUE (user_id, game_id, run_id)
);

CREATE INDEX IF NOT EXISTS arcade_runs_user_completed_idx
  ON public.arcade_runs (user_id, completed_at DESC);

ALTER TABLE public.arcade_runs ENABLE ROW LEVEL SECURITY;

-- No anon policies. The service role writes a run only after the score API
-- has already decided the canonical Ape.

-- ---------------------------------------------------------------------------
-- 3. game_scores stays keyed by wallet_address + game_id.
--    Do not copy or delete those rows here.
--
--    Future reconciliation, when one Ape has more than one wallet with a
--    score in the same game:
--      keep MAX(score) for that canonical glyph_user_id and game_id.
--      Do not sum scores.
--      Do not drop the lower wallet row until the leaderboard reads the
--      canonical user instead of the wallet.
--    Audited 2026-09-25: 9 score rows, 0 games split across two wallets
--    of the same Ape.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. FUTURE user_wallets. Not created.
--
--    Target shape, after launch:
--      id UUID PK
--      user_id TEXT NOT NULL REFERENCES user_profiles(glyph_user_id) ON DELETE RESTRICT
--      wallet_address TEXT NOT NULL
--      wallet_address_normalized TEXT NOT NULL UNIQUE
--      alias TEXT
--      is_primary BOOLEAN NOT NULL DEFAULT false
--      is_public BOOLEAN NOT NULL DEFAULT false
--      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--
--    One normalized wallet belongs to one Ape.
--    Sources to fold later, without dropping them first:
--      user_profiles.wallet_address
--      user_wallet_aliases
--      user_public_wallets
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5. Legacy tables stay.
--    Do not drop gamify_notifications, gamify_user_achievements,
--    user_achievements, achievements, or aoa_achievement_unlocks.
-- ---------------------------------------------------------------------------
