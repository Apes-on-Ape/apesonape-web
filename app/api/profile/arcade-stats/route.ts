import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

type ArcadeUserRow = {
  wallet_address: string;
  block_dodger_score: number | null;
  neon_racer_score: number | null;
  ape_man_score: number | null;
  flappy_ape_score: number | null;
  galaxy_ape_score: number | null;
  tailstrike_arena_score: number | null;
  total_points: number | null;
  level: number | null;
  experience: number | null;
  total_games_played: number | null;
  block_dodger_games: number | null;
  neon_racer_games: number | null;
  ape_man_games: number | null;
  flappy_ape_games: number | null;
  galaxy_ape_games: number | null;
  tailstrike_arena_games: number | null;
  clubroom_visits: number | null;
};

function mergeArcadeRows(rows: ArcadeUserRow[]) {
  const n = (v: number | null | undefined) => v ?? 0;
  const max = (a: number, b: number) => Math.max(a, b);
  return {
    total_points: rows.reduce((s, r) => s + n(r.total_points), 0),
    level: rows.reduce((m, r) => max(m, n(r.level) || 1), 1),
    experience: rows.reduce((s, r) => s + n(r.experience), 0),
    total_games_played: rows.reduce((s, r) => s + n(r.total_games_played), 0),
    block_dodger_score: rows.reduce((m, r) => max(m, n(r.block_dodger_score)), 0),
    neon_racer_score: rows.reduce((m, r) => max(m, n(r.neon_racer_score)), 0),
    ape_man_score: rows.reduce((m, r) => max(m, n(r.ape_man_score)), 0),
    flappy_ape_score: rows.reduce((m, r) => max(m, n(r.flappy_ape_score)), 0),
    galaxy_ape_score: rows.reduce((m, r) => max(m, n(r.galaxy_ape_score)), 0),
    tailstrike_arena_score: rows.reduce((m, r) => max(m, n(r.tailstrike_arena_score)), 0),
    block_dodger_games: rows.reduce((s, r) => s + n(r.block_dodger_games), 0),
    neon_racer_games: rows.reduce((s, r) => s + n(r.neon_racer_games), 0),
    ape_man_games: rows.reduce((s, r) => s + n(r.ape_man_games), 0),
    flappy_ape_games: rows.reduce((s, r) => s + n(r.flappy_ape_games), 0),
    galaxy_ape_games: rows.reduce((s, r) => s + n(r.galaxy_ape_games), 0),
    tailstrike_arena_games: rows.reduce((s, r) => s + n(r.tailstrike_arena_games), 0),
    clubroom_visits: rows.reduce((s, r) => s + n(r.clubroom_visits), 0),
    walletCount: rows.length,
  };
}

/**
 * GET /api/profile/arcade-stats?addresses=0x...&addresses=0x...
 * Arcade `user_profiles` row(s) by wallet — merged when multiple addresses (e.g. linked wallets).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const addresses = searchParams
      .getAll('addresses')
      .map((a) => normalizeWallet(a))
      .filter(Boolean);

    if (addresses.length === 0) {
      return NextResponse.json({ error: 'addresses required' }, { status: 400 });
    }

    const supabase = getArcadeSupabase();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('wallet_address', addresses);

    if (error) {
      console.error('[arcade-stats]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as ArcadeUserRow[];
    if (rows.length === 0) {
      return NextResponse.json({ found: false, merged: null, rows: [] });
    }

    const merged = mergeArcadeRows(rows);
    return NextResponse.json({ found: true, merged, rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
