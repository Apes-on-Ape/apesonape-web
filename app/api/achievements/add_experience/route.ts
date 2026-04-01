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
    if (!glyphUserId && glyphEvmHint) {
      glyphUserId = await resolveGlyphUserIdFromUserProfileWallet(glyphEvmHint);
    }
    if (!glyphUserId && glyphEvmHint) {
      glyphUserId = await resolveGlyphUserIdFromStudioWallet(glyphEvmHint);
    }
    if (!glyphUserId) {
      glyphUserId = await resolveGlyphUserIdFromStudioWallet(wallet);
    }
    if (!glyphUserId) {
      glyphUserId = await resolveGlyphUserIdFromUserProfileWallet(wallet);
    }
    const xp = Math.max(0, parseInt(String(body.experience || 0), 10) || 0);
    if (!wallet || xp <= 0) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
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

    const { data: rpcData, error: rpcErr } = await supabase.rpc('add_experience', {
      user_wallet: wallet,
      xp_amount: xp,
    });

    if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData[0]) {
      const row = rpcData[0] as { new_level?: number; level_up?: boolean; total_xp?: number };
      if (glyphUserId) {
        const { error: gErr } = await supabase
          .from('user_profiles')
          .update({ glyph_user_id: glyphUserId })
          .ilike('wallet_address', wallet);
        if (gErr) console.warn('[add_experience] glyph_user_id', gErr.message);
      }
      return NextResponse.json({
        new_level: row.new_level,
        level_up: row.level_up,
        total_xp: row.total_xp,
      });
    }

    const { data: user } = await supabase
      .from('user_profiles')
      .select('experience, level, glyph_user_id')
      .ilike('wallet_address', wallet)
      .maybeSingle();

    const oldXp = user?.experience ?? 0;
    const newXp = oldXp + xp;
    const newLevel = Math.min(100, Math.floor(Math.sqrt(newXp / 100)) + 1);

    const existingGid = String(user?.glyph_user_id ?? '').trim();
    let effectiveGlyphId = existingGid || glyphUserId;
    if (existingGid.startsWith('legacy:') && glyphUserId) {
      effectiveGlyphId = glyphUserId;
    }

    await supabase.from('user_profiles').upsert(
      {
        wallet_address: wallet,
        experience: newXp,
        level: newLevel,
        glyph_user_id: effectiveGlyphId,
      },
      { onConflict: 'wallet_address' }
    );

    return NextResponse.json({
      new_level: newLevel,
      level_up: newLevel > (user?.level ?? 1),
      total_xp: newXp,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
