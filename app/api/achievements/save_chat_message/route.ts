import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalArcadeWallet } from '@/lib/arcade-canonical-wallet';
import {
  resolveGlyphUserIdFromStudioWallet,
  resolveGlyphUserIdFromUserProfileWallet,
} from '@/lib/arcade-glyph-resolve';
import { getArcadeSupabase, normalizeWallet, upsertUserProfileByWallet } from '@/lib/arcade-db';

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
    if (!glyphUserId && glyphEvmHint) glyphUserId = await resolveGlyphUserIdFromUserProfileWallet(glyphEvmHint);
    if (!glyphUserId && glyphEvmHint) glyphUserId = await resolveGlyphUserIdFromStudioWallet(glyphEvmHint);
    if (!glyphUserId) glyphUserId = await resolveGlyphUserIdFromStudioWallet(wallet);
    if (!glyphUserId) glyphUserId = await resolveGlyphUserIdFromUserProfileWallet(wallet);
    const messages = Math.max(0, parseInt(String(body.messages_sent ?? 0), 10) || 0);
    if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });
    if (!glyphUserId && !glyphEvmHint) {
      return NextResponse.json(
        { error: 'glyph identity required (glyph_user_id or glyph_evm_wallet)' },
        { status: 400 }
      );
    }

    const supabase = getArcadeSupabase();
    const resolved = await resolveCanonicalArcadeWallet(
      supabase,
      wallet,
      glyphUserId,
      glyphEvmHint || null
    );
    wallet = resolved.wallet;
    await upsertUserProfileByWallet(supabase, wallet, glyphUserId);
    const { error } = await supabase
      .from('user_profiles')
      .update({ messages_sent: messages })
      .ilike('wallet_address', wallet);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
