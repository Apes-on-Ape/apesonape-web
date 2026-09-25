import { NextRequest, NextResponse } from 'next/server';
import { authFailure, requireAuthenticatedApe } from '@/lib/auth/ape';
import { resolveCanonicalArcadeWallet } from '@/lib/arcade-canonical-wallet';
import { getForeverApeForWallet } from '@/lib/arcade-forever-ape';
import { buildSelectedApePayloadForArcade } from '@/lib/arcade-forever-ape';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';
import { arcadePersonalBestDedupe, arcadeRunDedupe, awardArcadePersonalBest, awardArcadeRun } from '@/lib/progress/hooks';
import { recordUserActivity } from '@/lib/progress/activity';
import { recordEraRun } from '@/lib/progress/era';
import { aoaMetadata, createNotification } from '@/lib/notifications/create';
import { AOA_REWARDS } from '@/lib/progress/rewards';
import { ARCADE_LEADERBOARD_GAMES } from '@/app/arcade/arcade-games';

const GAME_SCORE_COLUMN: Record<string, string> = {
  block_dodger: 'block_dodger_score',
  neon_racer: 'neon_racer_score',
  galaxy_ape: 'galaxy_ape_score',
  ape_man: 'ape_man_score',
  flappy_ape: 'flappy_ape_score',
  tailstrike_arena: 'tailstrike_arena_score',
};

const GAME_PLAY_COUNT_COLUMN: Record<string, string> = {
  block_dodger: 'block_dodger_games',
  neon_racer: 'neon_racer_games',
  galaxy_ape: 'galaxy_ape_games',
  ape_man: 'ape_man_games',
  flappy_ape: 'flappy_ape_games',
  tailstrike_arena: 'tailstrike_arena_games',
};

function isMissingGameScoresTableError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return Boolean(
    e &&
      e.code === 'PGRST205' &&
      typeof e.message === 'string' &&
      e.message.includes("public.game_scores")
  );
}

/**
 * Single pipeline for arcade scores (all games):
 * 1. Upsert `user_profiles` (glyph, XP, game play counts, etc.).
 * 2. If this is a real run with score > 0, upsert `game_scores` when the score beats the stored high.
 * 3. Triggers on `game_scores` copy the high into `user_profiles.{game}_score` and recompute
 *    `total_points` as the **sum of per-game highs** (not the client’s cumulative “points earned” total).
 *
 * Do not persist client `total_points` when step 2 applies — it fights the triggers and mixed semantics.
 */

export async function POST(req: NextRequest) {
  try {
    const ape = await requireAuthenticatedApe(req);
    const body = await req.json();
    let wallet = normalizeWallet(body.wallet_address || '');
    if (wallet && !ape.wallets.includes(wallet)) {
      return NextResponse.json({ error: 'That wallet is not linked to this Ape.' }, { status: 403 });
    }
    if (!wallet) wallet = ape.primaryWallet || '';
    const glyphUserId = ape.userId;
    const gameId = String(body.game_id || '');
    const activeGame = ARCADE_LEADERBOARD_GAMES.some((game) => game.gameId === gameId);
    if (!activeGame) {
      return NextResponse.json({ error: 'Unknown game.' }, { status: 400 });
    }
    const score = Math.max(0, Math.floor(Number(body.score)));
    if (!Number.isFinite(score)) {
      return NextResponse.json({ error: 'Score must be a number.' }, { status: 400 });
    }
    const isRecordedGameRun = Boolean(gameId) && score > 0;

    if (!wallet) {
      return NextResponse.json({ error: 'Link a wallet before saving a score.' }, { status: 400 });
    }

    const supabase = getArcadeSupabase();
    const resolved = await resolveCanonicalArcadeWallet(supabase, wallet, glyphUserId, ape.primaryWallet);
    if (resolved.wallet && ape.wallets.includes(resolved.wallet)) wallet = resolved.wallet;

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('glyph_user_id, selected_ape')
      .ilike('wallet_address', wallet)
      .maybeSingle();

    const existingGid = String(existingProfile?.glyph_user_id ?? '').trim();
    if (existingGid && existingGid !== glyphUserId && !existingGid.startsWith('legacy:')) {
      return NextResponse.json({ error: 'That wallet belongs to another Ape.' }, { status: 403 });
    }
    const effectiveGlyphId = glyphUserId;

    const patch: Record<string, unknown> = {
      last_game_played: new Date().toISOString(),
      glyph_user_id: effectiveGlyphId,
    };

    const fa = await getForeverApeForWallet(wallet);
    if (fa.forever_ape_id != null) {
      patch.forever_ape_id = fa.forever_ape_id;
      if (existingProfile?.selected_ape == null) {
        try {
          patch.selected_ape = await buildSelectedApePayloadForArcade(fa.forever_ape_id);
        } catch {
          /* ignore avatar payload build failures */
        }
      }
    }

    const upsertRow: Record<string, unknown> = {
      wallet_address: wallet,
      ...patch,
    };
    const upsertConflict =
      effectiveGlyphId && typeof effectiveGlyphId === 'string'
        ? 'glyph_user_id'
        : 'wallet_address';
    const { error: upErr } = await supabase
      .from('user_profiles')
      .upsert(upsertRow, { onConflict: upsertConflict });

    if (upErr) {
      console.error('[save_game_stats] update', upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (isRecordedGameRun) {
      const scoreCol = GAME_SCORE_COLUMN[gameId];
      const gamesCol = GAME_PLAY_COUNT_COLUMN[gameId];
      let existingGameScore = 0;
      const { data: gsRow, error: gsSelectErr } = await supabase
        .from('game_scores')
        .select('score')
        .ilike('wallet_address', wallet)
        .eq('game_id', gameId)
        .maybeSingle();
      if (gsSelectErr && !isMissingGameScoresTableError(gsSelectErr)) {
        console.error('[save_game_stats] game_scores select', gsSelectErr);
        return NextResponse.json({ error: gsSelectErr.message }, { status: 500 });
      }
      if (!gsSelectErr) {
        existingGameScore = Number(gsRow?.score ?? 0);
      }

      const { data: currentRow, error: currentErr } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('wallet_address', wallet)
        .maybeSingle();

      if (currentErr) {
        console.error('[save_game_stats] user_profiles select', currentErr);
        return NextResponse.json({ error: currentErr.message }, { status: 500 });
      }

      const previousBest = Math.max(
        existingGameScore,
        scoreCol ? Number((currentRow as Record<string, unknown> | null)?.[scoreCol] ?? 0) : 0,
      );
      const isPersonalBest = score > previousBest;
      let bestScore = Math.max(existingGameScore, score);
      if (scoreCol) {
        bestScore = Math.max(bestScore, Number((currentRow as Record<string, unknown> | null)?.[scoreCol] ?? 0));
      }

      if (!gsSelectErr && bestScore > existingGameScore) {
        const { error: gsUpsertErr } = await supabase.from('game_scores').upsert(
          {
            wallet_address: wallet,
            game_id: gameId,
            score: bestScore,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'wallet_address,game_id' }
        );
        if (gsUpsertErr) {
          console.error('[save_game_stats] game_scores upsert', gsUpsertErr);
          return NextResponse.json({ error: gsUpsertErr.message }, { status: 500 });
        }
      }

      const nextTotalGames = Number(currentRow?.total_games_played ?? 0) + 1;
      const profilePatch: Record<string, unknown> = {
        total_games_played: nextTotalGames,
        first_game_played: currentRow?.first_game_played ?? new Date().toISOString(),
        last_game_played: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (scoreCol && gamesCol) {
        const nextScores: Record<string, number> = {
          block_dodger_score: Number(currentRow?.block_dodger_score ?? 0),
          neon_racer_score: Number(currentRow?.neon_racer_score ?? 0),
          galaxy_ape_score: Number(currentRow?.galaxy_ape_score ?? 0),
          ape_man_score: Number(currentRow?.ape_man_score ?? 0),
          flappy_ape_score: Number(currentRow?.flappy_ape_score ?? 0),
          tailstrike_arena_score: Number(currentRow?.tailstrike_arena_score ?? 0),
        };
        nextScores[scoreCol] = Math.max(Number(nextScores[scoreCol] ?? 0), bestScore);
        const recomputedTotalPoints =
          nextScores.block_dodger_score +
          nextScores.neon_racer_score +
          nextScores.galaxy_ape_score +
          nextScores.ape_man_score +
          nextScores.flappy_ape_score +
          nextScores.tailstrike_arena_score;
        const nextGameCount = Number((currentRow as Record<string, unknown> | null)?.[gamesCol] ?? 0) + 1;
        profilePatch[scoreCol] = nextScores[scoreCol];
        profilePatch.total_points = recomputedTotalPoints;
        profilePatch[gamesCol] = nextGameCount;
      }

      const { error: scoreUpdateErr } = await supabase
        .from('user_profiles')
        .update(profilePatch)
        .ilike('wallet_address', wallet);

      if (scoreUpdateErr) {
        console.error('[save_game_stats] user_profiles score update', scoreUpdateErr);
        return NextResponse.json({ error: scoreUpdateErr.message }, { status: 500 });
      }

      if (effectiveGlyphId) {
        try {
          await recordUserActivity({
            userId: effectiveGlyphId,
            source: 'arcade',
            action: 'run_completed',
            referenceId: gameId,
            dedupeKey: arcadeRunDedupe(effectiveGlyphId, gameId, score),
            metadata: { gameId, score },
          });
          await awardArcadeRun(effectiveGlyphId, gameId, score);
          if (isPersonalBest) {
            await recordUserActivity({
              userId: effectiveGlyphId,
              source: 'arcade',
              action: 'personal_best',
              referenceId: gameId,
              dedupeKey: arcadePersonalBestDedupe(effectiveGlyphId, gameId, score),
              metadata: { gameId, score },
            });
            const personalBest = await awardArcadePersonalBest(effectiveGlyphId, gameId, score);
            const gameTitle = ARCADE_LEADERBOARD_GAMES.find((game) => game.gameId === gameId)?.title ?? gameId;
            await createNotification({
              userId: effectiveGlyphId,
              type: 'personal_best',
              category: 'arcade',
              title: 'New personal best',
              message: `${gameTitle} // ${score.toLocaleString('en-US')}`,
              actionLabel: 'View record',
              actionUrl: '/profile/?tab=arcade',
              referenceType: 'arcade_game',
              referenceId: gameId,
              metadata: aoaMetadata(personalBest.awarded ? AOA_REWARDS.arcadePersonalBest : 0),
              dedupeKey: `arcade-personal-best:${gameId}:${score}:${effectiveGlyphId}`,
            });
          }
          await recordEraRun(effectiveGlyphId, gameId, score);
        } catch (progressErr) {
          console.error('[save_game_stats] aoa', progressErr);
        }
      }
    }

    /** Re-read the persisted profile after score/stats updates. */
    const { data: fresh } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('wallet_address', wallet)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user_data: fresh,
      canonical_wallet: wallet,
      merged_from_wallet: resolved.mergedFrom,
      debug: {
        game_id: gameId,
        score,
        has_score_column_mapping: Boolean(GAME_SCORE_COLUMN[gameId]),
      },
    });
  } catch (e) {
    const denied = authFailure(e);
    if (denied) return denied;
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
