import { NextRequest, NextResponse } from 'next/server';
import { enrichArcadeLeaderboardWallets } from '@/lib/arcade-leaderboard-enrich';
import { walletColumnIlikeOr } from '@/lib/arcade-glyph-resolve';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

const ALLOWED_GAME_IDS = new Set([
  'block_dodger',
  'neon_racer',
  'galaxy_ape',
  'ape_man',
  'flappy_ape',
  'tailstrike_arena',
]);

const GAME_SCORE_COLUMN: Record<string, string> = {
  block_dodger: 'block_dodger_score',
  neon_racer: 'neon_racer_score',
  galaxy_ape: 'galaxy_ape_score',
  ape_man: 'ape_man_score',
  flappy_ape: 'flappy_ape_score',
  tailstrike_arena: 'tailstrike_arena_score',
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
 * GET /api/arcade/leaderboard?mode=game|points&gameId=neon_racer&limit=50
 * - mode=points: top users by total_points (`user_profiles`)
 * - mode=game: top scores for one game (`game_scores`)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'game';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const supabase = getArcadeSupabase();

    if (mode === 'points') {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .not('wallet_address', 'is', null)
        .order('total_points', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[arcade/leaderboard]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const scored = (data ?? []).map((r) => {
        const sumGames =
          Number(r.block_dodger_score ?? 0) +
          Number(r.neon_racer_score ?? 0) +
          Number(r.ape_man_score ?? 0) +
          Number(r.flappy_ape_score ?? 0) +
          Number(r.galaxy_ape_score ?? 0) +
          Number(r.tailstrike_arena_score ?? 0);
        const stored = Number(r.total_points ?? 0);
        const total_points = Math.max(stored, sumGames);
        const legacyUsername =
          (typeof r.x_username === 'string' && r.x_username.trim().replace(/^@/, '')) ||
          (typeof r.display_name === 'string' && r.display_name.trim()) ||
          null;
        return {
          wallet_address: r.wallet_address,
          /** @deprecated legacy field — prefer `display_name` in enriched rows; use x_username / display_name */
          username: legacyUsername,
          total_points,
          level: Number(r.level ?? 1),
          experience: Number(r.experience ?? 0),
        };
      });

      scored.sort((a, b) => b.total_points - a.total_points);

      const rows = scored.slice(0, limit).map((r, i) => ({
        ...r,
        rank: i + 1,
      }));

      const wallets = rows.map((row) => row.wallet_address);
      const enrich = await enrichArcadeLeaderboardWallets(wallets);
      const rowsEnriched = rows.map((row) => {
        const e = enrich[normalizeWallet(row.wallet_address)];
        const display_name =
          (e?.display_name && e.display_name.trim()) ||
          (row.username && String(row.username).trim()) ||
          null;
        return {
          ...row,
          display_name,
          avatar_url: e?.avatar_url ?? null,
          profile_slug: e?.profile_slug ?? null,
        };
      });

      return NextResponse.json({ mode: 'points', rows: rowsEnriched });
    }

    const gameId = searchParams.get('gameId') || '';
    if (!ALLOWED_GAME_IDS.has(gameId)) {
      return NextResponse.json(
        { error: 'Invalid or missing gameId', allowed: [...ALLOWED_GAME_IDS] },
        { status: 400 }
      );
    }

    const { data: scores, error } = await supabase
      .from('game_scores')
      .select('wallet_address, score, created_at')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error && !isMissingGameScoresTableError(error)) {
      console.error('[arcade/leaderboard]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    let list = scores ?? [];
    if (error && isMissingGameScoresTableError(error)) {
      const scoreCol = GAME_SCORE_COLUMN[gameId];
      const { data: fallbackRows, error: fallbackErr } = await supabase
        .from('user_profiles')
        .select(`wallet_address, ${scoreCol}, updated_at`)
        .not('wallet_address', 'is', null)
        .gt(scoreCol, 0)
        .order(scoreCol, { ascending: false })
        .limit(limit);
      if (fallbackErr) {
        console.error('[arcade/leaderboard:fallback]', fallbackErr);
        return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
      }
      list = ((fallbackRows ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          wallet_address: String(row.wallet_address ?? ''),
          score: Number(row[scoreCol] ?? 0),
          created_at: String(row.updated_at ?? ''),
        };
      });
    }
    const wallets = [...new Set(list.map((s) => s.wallet_address))];
    const normWallets = [...new Set(wallets.map((w) => normalizeWallet(String(w))))].filter(Boolean);
    let usernameByWallet: Record<string, string | null> = {};

    if (normWallets.length > 0) {
      const { data: profRows } = await supabase
        .from('user_profiles')
        .select('wallet_address, x_username, display_name')
        .or(walletColumnIlikeOr('wallet_address', normWallets));
      usernameByWallet = Object.fromEntries(
        (profRows ?? []).map((u) => {
          const legacy =
            (typeof u.x_username === 'string' && u.x_username.trim().replace(/^@/, '')) ||
            (typeof u.display_name === 'string' && u.display_name.trim()) ||
            null;
          return [normalizeWallet(u.wallet_address), legacy];
        })
      );
    }

    const rows = list.map((s, i) => ({
      rank: i + 1,
      wallet_address: s.wallet_address,
      username: usernameByWallet[normalizeWallet(s.wallet_address)] ?? null,
      score: Number(s.score),
      created_at: s.created_at,
    }));

    const enrichWallets = rows.map((r) => r.wallet_address);
    const enrich = await enrichArcadeLeaderboardWallets(enrichWallets);
    const rowsEnriched = rows.map((row) => {
      const e = enrich[normalizeWallet(row.wallet_address)];
      const display_name = (e?.display_name && e.display_name.trim()) || (row.username && String(row.username).trim()) || null;
      return {
        ...row,
        display_name,
        avatar_url: e?.avatar_url ?? null,
        profile_slug: e?.profile_slug ?? null,
      };
    });

    return NextResponse.json({ mode: 'game', gameId, rows: rowsEnriched });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
