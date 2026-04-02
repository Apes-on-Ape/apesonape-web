import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalArcadeWallet } from '@/lib/arcade-canonical-wallet';
import {
  resolveGlyphUserIdFromStudioWallet,
  resolveGlyphUserIdFromUserProfileWallet,
} from '@/lib/arcade-glyph-resolve';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let wallet = normalizeWallet(body.wallet_address || '');
    const glyphEvmHint =
      typeof body.glyph_evm_wallet === 'string' && body.glyph_evm_wallet.trim()
        ? normalizeWallet(body.glyph_evm_wallet)
        : '';
    let glyphUserId =
      typeof body.glyph_user_id === 'string' && body.glyph_user_id.trim().length > 0
        ? body.glyph_user_id.trim()
        : null;
    if (!glyphUserId) glyphUserId = await resolveGlyphUserIdFromStudioWallet(wallet);
    if (!glyphUserId) glyphUserId = await resolveGlyphUserIdFromUserProfileWallet(wallet);
    const gameId = String(body.game_id || '');
    if (!wallet || !gameId) {
      return NextResponse.json({ rank: 0 });
    }

    const supabase = getArcadeSupabase();
    const resolved = await resolveCanonicalArcadeWallet(
      supabase,
      wallet,
      glyphUserId,
      glyphEvmHint || null
    );
    wallet = resolved.wallet;

    const { data: mine } = await supabase
      .from('game_scores')
      .select('score')
      .ilike('wallet_address', wallet)
      .eq('game_id', gameId)
      .maybeSingle();

    const myScore = mine?.score ?? 0;
    if (myScore <= 0) {
      return NextResponse.json({ rank: 0 });
    }

    const { count, error } = await supabase
      .from('game_scores')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .gt('score', myScore);

    if (error) {
      console.error('[get_user_rank]', error);
      return NextResponse.json({ rank: 1 });
    }

    const rank = (count ?? 0) + 1;
    return NextResponse.json({ rank });
  } catch {
    return NextResponse.json({ rank: 0 });
  }
}
