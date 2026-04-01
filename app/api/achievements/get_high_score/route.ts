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
      return NextResponse.json({ high_score: 0, error: 'wallet_address and game_id required' }, { status: 400 });
    }

    const supabase = getArcadeSupabase();
    const resolved = await resolveCanonicalArcadeWallet(
      supabase,
      wallet,
      glyphUserId,
      glyphEvmHint || null
    );
    wallet = resolved.wallet;
    const { data, error } = await supabase
      .from('game_scores')
      .select('score')
      .ilike('wallet_address', wallet)
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) {
      console.error('[get_high_score]', error);
      return NextResponse.json({ high_score: 0 });
    }

    return NextResponse.json({ high_score: data?.score ?? 0 });
  } catch (e) {
    return NextResponse.json({ high_score: 0 });
  }
}
