import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalArcadeWallet } from '@/lib/arcade-canonical-wallet';
import { buildSelectedApePayloadForArcade, getForeverApeForWallet } from '@/lib/arcade-forever-ape';
import { resolveGlyphUserIdFromStudioWallet } from '@/lib/arcade-glyph-resolve';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';
import { magicEdenAPI } from '@/lib/magic-eden';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';
import { toGatewayUri } from '@/lib/studio/urls';
import type { SupabaseClient } from '@supabase/supabase-js';

function getMainSupabase() {
  return getSupabaseServiceClient() ?? getSupabaseServerClient();
}

function profileFieldsFromRow(prof: {
  avatar_url?: string | null;
  display_name?: string | null;
  x_username?: string | null;
} | null) {
  let profile_avatar_url: string | null = null;
  let profile_display_name: string | null = null;
  if (prof?.avatar_url?.trim()) {
    profile_avatar_url = toGatewayUri(prof.avatar_url.trim()) || prof.avatar_url.trim();
  }
  if (prof?.display_name?.trim()) {
    profile_display_name = prof.display_name.trim();
  } else if (prof?.x_username?.trim()) {
    profile_display_name = prof.x_username.replace(/^@/, '').trim();
  }
  return { profile_avatar_url, profile_display_name };
}

/** Direct wallet → profile (`user_profiles.wallet_address`). */
async function siteProfileForWallet(wallet: string): Promise<{
  profile_avatar_url: string | null;
  profile_display_name: string | null;
  glyph_user_id: string | null;
}> {
  const main = getMainSupabase();
  if (!main) {
    return { profile_avatar_url: null, profile_display_name: null, glyph_user_id: null };
  }
  const { data: rows } = await main
    .from('user_profiles')
    .select('glyph_user_id, avatar_url, display_name, x_username')
    .ilike('wallet_address', wallet)
    .limit(1);
  const prof = rows?.[0];
  if (!prof) {
    return { profile_avatar_url: null, profile_display_name: null, glyph_user_id: null };
  }
  const { profile_avatar_url, profile_display_name } = profileFieldsFromRow(prof);
  const gid = (prof.glyph_user_id && String(prof.glyph_user_id).trim()) || null;
  return { profile_avatar_url, profile_display_name, glyph_user_id: gid };
}

async function siteProfileForGlyph(glyphUserId: string | null | undefined) {
  const gid = typeof glyphUserId === 'string' ? glyphUserId.trim() : '';
  if (!gid) {
    return { profile_avatar_url: null as string | null, profile_display_name: null as string | null };
  }
  const main = getMainSupabase();
  if (!main) {
    return { profile_avatar_url: null as string | null, profile_display_name: null as string | null };
  }
  const { data: prof } = await main
    .from('user_profiles')
    .select('avatar_url, display_name, x_username')
    .eq('glyph_user_id', gid)
    .maybeSingle();

  return profileFieldsFromRow(prof);
}

/**
 * Refresh `nft_count` from on-chain / indexer (same source as `/api/portfolio`) and persist when a profile row exists.
 */
async function refreshNftCount(
  wallet: string,
  supabase: SupabaseClient,
  hasProfileRow: boolean,
  previous: number | null | undefined
): Promise<number> {
  try {
    const ids = await magicEdenAPI.getWalletTokenIds(wallet);
    const nft_count = ids.length;
    if (hasProfileRow) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ nft_count, updated_at: new Date().toISOString() })
        .ilike('wallet_address', wallet);
      if (error) {
        console.warn('[achievements/user] nft_count update', error.message);
      }
    }
    return nft_count;
  } catch (e) {
    console.warn('[achievements/user] nft_count fetch', e);
    return previous ?? 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let wallet = normalizeWallet(body.wallet_address || '');
    if (!wallet) {
      return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });
    }

    const glyphFromBody =
      typeof body.glyph_user_id === 'string' && body.glyph_user_id.trim().length > 0
        ? body.glyph_user_id.trim()
        : null;
    const glyphEvmHint =
      typeof body.glyph_evm_wallet === 'string' && body.glyph_evm_wallet.trim()
        ? normalizeWallet(body.glyph_evm_wallet)
        : '';

    const supabase = getArcadeSupabase();
    const resolved = await resolveCanonicalArcadeWallet(
      supabase,
      wallet,
      glyphFromBody,
      glyphEvmHint || null
    );
    wallet = resolved.wallet;

    const { data: userRows, error: userErr } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('wallet_address', wallet)
      .limit(1);

    if (userErr) {
      console.error('[achievements/user] user', userErr);
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }

    const user = userRows?.[0] ?? null;

    const { data: uaRows } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .ilike('wallet_address', wallet);

    const achievements = (uaRows || []).map((r) => ({
      achievement_id: r.achievement_id,
    }));

    let glyphId =
      (user?.glyph_user_id && String(user.glyph_user_id).trim()) || glyphFromBody;
    if (!glyphId) {
      glyphId = await resolveGlyphUserIdFromStudioWallet(wallet);
    }

    const byWallet = await siteProfileForWallet(wallet);
    if (!glyphId && byWallet.glyph_user_id) {
      glyphId = byWallet.glyph_user_id;
    }

    const byGlyph = await siteProfileForGlyph(glyphId);
    const siteProfile = {
      profile_avatar_url: byWallet.profile_avatar_url || byGlyph.profile_avatar_url,
      profile_display_name: byWallet.profile_display_name || byGlyph.profile_display_name,
    };

    const foreverApe = await getForeverApeForWallet(wallet);
    let selectedApePayload = user?.selected_ape ?? null;
    if (!selectedApePayload && foreverApe.forever_ape_id != null) {
      try {
        selectedApePayload = await buildSelectedApePayloadForArcade(foreverApe.forever_ape_id);
        if (user) {
          await supabase
            .from('user_profiles')
            .update({ selected_ape: selectedApePayload, updated_at: new Date().toISOString() })
            .ilike('wallet_address', wallet);
        }
      } catch {
        /* ignore selected ape payload build issues */
      }
    }

    const nft_count = await refreshNftCount(wallet, supabase, !!user, user?.nft_count);

    if (!user) {
      return NextResponse.json({
        level: 1,
        experience: 0,
        total_games_played: 0,
        total_points: 0,
        block_dodger_games: 0,
        neon_racer_games: 0,
        ape_man_games: 0,
        flappy_ape_games: 0,
        galaxy_ape_games: 0,
        tailstrike_arena_games: 0,
        clubroom_visits: 0,
        messages_sent: 0,
        reactions_sent: 0,
        nft_count,
        achievements,
        selected_ape: selectedApePayload,
        ...siteProfile,
        forever_ape_id: foreverApe.forever_ape_id,
        forever_ape_image_url: foreverApe.forever_ape_image_url,
      });
    }

    return NextResponse.json({
      level: user.level ?? 1,
      experience: user.experience ?? 0,
      total_games_played: user.total_games_played ?? 0,
      total_points: user.total_points ?? 0,
      block_dodger_games: user.block_dodger_games ?? 0,
      neon_racer_games: user.neon_racer_games ?? 0,
      ape_man_games: user.ape_man_games ?? 0,
      flappy_ape_games: user.flappy_ape_games ?? 0,
      galaxy_ape_games: user.galaxy_ape_games ?? 0,
      tailstrike_arena_games: user.tailstrike_arena_games ?? 0,
      clubroom_visits: user.clubroom_visits ?? 0,
      messages_sent: user.messages_sent ?? 0,
      reactions_sent: user.reactions_sent ?? 0,
      nft_count,
      first_game_played: user.first_game_played,
      last_game_played: user.last_game_played,
      achievements,
      selected_ape: selectedApePayload,
      ...siteProfile,
      forever_ape_id: foreverApe.forever_ape_id,
      forever_ape_image_url: foreverApe.forever_ape_image_url,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
