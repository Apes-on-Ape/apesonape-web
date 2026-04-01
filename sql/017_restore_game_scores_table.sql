-- Restore competitive leaderboard table if it was dropped.
-- Keeps `user_profiles` as profile/progression source, while `game_scores`
-- stores one high-score row per wallet+game for cross-player ranking.

CREATE TABLE IF NOT EXISTS public.game_scores (
  wallet_address TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wallet_address, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_score
  ON public.game_scores (game_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_scores_wallet
  ON public.game_scores (wallet_address);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'game_scores_wallet_address_fkey'
  ) THEN
    ALTER TABLE public.game_scores
      ADD CONSTRAINT game_scores_wallet_address_fkey
      FOREIGN KEY (wallet_address)
      REFERENCES public.user_profiles(wallet_address);
  END IF;
END $$;

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_scores'
      AND policyname = 'Game scores are viewable by everyone'
  ) THEN
    CREATE POLICY "Game scores are viewable by everyone"
      ON public.game_scores
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_scores'
      AND policyname = 'Users can insert their own scores'
  ) THEN
    CREATE POLICY "Users can insert their own scores"
      ON public.game_scores
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_scores'
      AND policyname = 'Users can update their own scores'
  ) THEN
    CREATE POLICY "Users can update their own scores"
      ON public.game_scores
      FOR UPDATE
      USING (true);
  END IF;
END $$;

-- Backfill highs from user_profiles so leaderboard works immediately.
INSERT INTO public.game_scores (wallet_address, game_id, score, created_at)
SELECT wallet_address, 'block_dodger', block_dodger_score, NOW()
FROM public.user_profiles
WHERE wallet_address IS NOT NULL AND COALESCE(block_dodger_score, 0) > 0
ON CONFLICT (wallet_address, game_id) DO UPDATE
SET score = GREATEST(public.game_scores.score, EXCLUDED.score);

INSERT INTO public.game_scores (wallet_address, game_id, score, created_at)
SELECT wallet_address, 'neon_racer', neon_racer_score, NOW()
FROM public.user_profiles
WHERE wallet_address IS NOT NULL AND COALESCE(neon_racer_score, 0) > 0
ON CONFLICT (wallet_address, game_id) DO UPDATE
SET score = GREATEST(public.game_scores.score, EXCLUDED.score);

INSERT INTO public.game_scores (wallet_address, game_id, score, created_at)
SELECT wallet_address, 'galaxy_ape', galaxy_ape_score, NOW()
FROM public.user_profiles
WHERE wallet_address IS NOT NULL AND COALESCE(galaxy_ape_score, 0) > 0
ON CONFLICT (wallet_address, game_id) DO UPDATE
SET score = GREATEST(public.game_scores.score, EXCLUDED.score);

INSERT INTO public.game_scores (wallet_address, game_id, score, created_at)
SELECT wallet_address, 'ape_man', ape_man_score, NOW()
FROM public.user_profiles
WHERE wallet_address IS NOT NULL AND COALESCE(ape_man_score, 0) > 0
ON CONFLICT (wallet_address, game_id) DO UPDATE
SET score = GREATEST(public.game_scores.score, EXCLUDED.score);

INSERT INTO public.game_scores (wallet_address, game_id, score, created_at)
SELECT wallet_address, 'flappy_ape', flappy_ape_score, NOW()
FROM public.user_profiles
WHERE wallet_address IS NOT NULL AND COALESCE(flappy_ape_score, 0) > 0
ON CONFLICT (wallet_address, game_id) DO UPDATE
SET score = GREATEST(public.game_scores.score, EXCLUDED.score);
