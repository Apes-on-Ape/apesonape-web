import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet, upsertUserProfileByWallet } from '@/lib/arcade-db';
import { resolveCanonicalArcadeWallet } from '@/lib/arcade-canonical-wallet';
import {
  resolveGlyphUserIdFromStudioWallet,
  resolveGlyphUserIdFromUserProfileWallet,
} from '@/lib/arcade-glyph-resolve';

type Body = {
  action?: 'get' | 'save_upgrade' | 'save_powerup' | 'save_selected_powerup' | 'set_points';
  wallet_address?: string;
  glyph_user_id?: string;
  glyph_evm_wallet?: string;
  game_id?: string;
  upgrade_id?: string;
  level?: number;
  powerup_id?: string;
  owned?: boolean;
  points?: number;
};

const ALLOWED_GAMES = new Set(['block_dodger', 'neon_racer']);

async function resolveIdentity(body: Body) {
  const supabase = getArcadeSupabase();
  const walletInput = normalizeWallet(String(body.wallet_address ?? ''));
  if (!walletInput) return { error: 'wallet_address required' as const };

  const glyphEvmHint = normalizeWallet(String(body.glyph_evm_wallet ?? ''));
  let glyphUserId = String(body.glyph_user_id ?? '').trim();

  if (!glyphUserId && glyphEvmHint) {
    glyphUserId = (await resolveGlyphUserIdFromUserProfileWallet(glyphEvmHint)) ?? '';
  }
  if (!glyphUserId && glyphEvmHint) {
    glyphUserId = (await resolveGlyphUserIdFromStudioWallet(glyphEvmHint)) ?? '';
  }
  if (!glyphUserId) {
    glyphUserId = (await resolveGlyphUserIdFromUserProfileWallet(walletInput)) ?? '';
  }
  if (!glyphUserId) {
    glyphUserId = (await resolveGlyphUserIdFromStudioWallet(walletInput)) ?? '';
  }

  const resolved = await resolveCanonicalArcadeWallet(
    supabase,
    walletInput,
    glyphUserId || null,
    glyphEvmHint || null
  );
  const wallet = resolved.wallet;

  if (glyphUserId) {
    await upsertUserProfileByWallet(supabase, wallet, glyphUserId);
  }

  return { supabase, wallet, glyphUserId: glyphUserId || null };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const action = body.action || 'get';
    const identity = await resolveIdentity(body);
    if ('error' in identity) {
      return NextResponse.json({ error: identity.error }, { status: 400 });
    }

    const { supabase, wallet } = identity;
    const gameId = String(body.game_id ?? '').trim();

    if (!ALLOWED_GAMES.has(gameId)) {
      return NextResponse.json(
        { error: 'Invalid game_id', allowed: Array.from(ALLOWED_GAMES) },
        { status: 400 }
      );
    }

    if (action === 'get') {
      const [{ data: upRow }, { data: pRow }, { data: selRow }, { data: prof }] = await Promise.all([
        supabase
          .from('user_upgrades')
          .select('upgrades')
          .ilike('wallet_address', wallet)
          .eq('game_id', gameId)
          .maybeSingle(),
        supabase
          .from('user_powerups')
          .select('powerups')
          .ilike('wallet_address', wallet)
          .eq('game_id', gameId)
          .maybeSingle(),
        supabase
          .from('user_selected_powerup')
          .select('powerup_id')
          .ilike('wallet_address', wallet)
          .eq('game_id', gameId)
          .maybeSingle(),
        supabase
          .from('user_profiles')
          .select('total_points')
          .ilike('wallet_address', wallet)
          .maybeSingle(),
      ]);

      return NextResponse.json({
        wallet_address: wallet,
        game_id: gameId,
        upgrades: (upRow?.upgrades as Record<string, number>) ?? {},
        powerups: (pRow?.powerups as Record<string, boolean>) ?? {},
        selected_powerup: (selRow?.powerup_id as string | null) ?? null,
        total_points: Number(prof?.total_points ?? 0),
      });
    }

    if (action === 'save_upgrade') {
      const upgradeId = String(body.upgrade_id ?? '').trim();
      const level = Math.max(0, Number(body.level ?? 0));
      if (!upgradeId) {
        return NextResponse.json({ error: 'upgrade_id required' }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from('user_upgrades')
        .select('upgrades')
        .ilike('wallet_address', wallet)
        .eq('game_id', gameId)
        .maybeSingle();
      const upgrades = ((existing?.upgrades as Record<string, number>) ?? {});
      upgrades[upgradeId] = level;
      const { error } = await supabase.from('user_upgrades').upsert(
        {
          wallet_address: wallet,
          game_id: gameId,
          upgrades,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address,game_id' }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, upgrades });
    }

    if (action === 'save_powerup') {
      const powerupId = String(body.powerup_id ?? '').trim();
      const owned = Boolean(body.owned);
      if (!powerupId) {
        return NextResponse.json({ error: 'powerup_id required' }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from('user_powerups')
        .select('powerups')
        .ilike('wallet_address', wallet)
        .eq('game_id', gameId)
        .maybeSingle();
      const powerups = ((existing?.powerups as Record<string, boolean>) ?? {});
      powerups[powerupId] = owned;
      const { error } = await supabase.from('user_powerups').upsert(
        {
          wallet_address: wallet,
          game_id: gameId,
          powerups,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address,game_id' }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, powerups });
    }

    if (action === 'save_selected_powerup') {
      const powerupId = String(body.powerup_id ?? '').trim();
      if (!powerupId) {
        return NextResponse.json({ error: 'powerup_id required' }, { status: 400 });
      }
      const { error } = await supabase.from('user_selected_powerup').upsert(
        {
          wallet_address: wallet,
          game_id: gameId,
          powerup_id: powerupId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address,game_id' }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, selected_powerup: powerupId });
    }

    if (action === 'set_points') {
      const points = Math.max(0, Number(body.points ?? 0));
      const { error } = await supabase
        .from('user_profiles')
        .update({ total_points: points, updated_at: new Date().toISOString() })
        .ilike('wallet_address', wallet);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, total_points: points });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

