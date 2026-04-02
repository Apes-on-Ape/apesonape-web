import type { SupabaseClient } from '@supabase/supabase-js';

function normalizeWallet(w: string): string {
  return w.trim().toLowerCase();
}

/** `legacy:0x…` synthetic ids — not a real Glyph account */
export function isSyntheticLegacyGlyphId(glyphUserId: string | null | undefined): boolean {
  const g = String(glyphUserId ?? '').trim();
  return g.startsWith('legacy:');
}

function n(x: unknown): number {
  return Math.max(0, Number(x ?? 0) || 0);
}

/**
 * When a real `glyph_user_id` is sent, arcade data must live on the profile row for that Glyph
 * account (`user_profiles.wallet_address` = Glyph EVM), not on a separate legacy wallet row.
 * If the request wallet is a linked MM address, merge that row into the canonical row and delete the duplicate.
 */
export async function mergeLegacyWalletIntoCanonical(
  supabase: SupabaseClient,
  legacyWallet: string,
  canonicalWallet: string
): Promise<void> {
  const legacy = normalizeWallet(legacyWallet);
  const canonical = normalizeWallet(canonicalWallet);
  if (!legacy || !canonical || legacy === canonical) return;

  const { data: legacyProf, error: legErr } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('wallet_address', legacy)
    .maybeSingle();
  if (legErr || !legacyProf) return;

  const { data: canonProf, error: cErr } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('wallet_address', canonical)
    .maybeSingle();
  if (cErr || !canonProf) return;

  const c = legacyProf as Record<string, unknown>;
  const d = canonProf as Record<string, unknown>;

  const mergeMax = (a: unknown, b: unknown) => Math.max(n(a), n(b));
  const mergeSum = (a: unknown, b: unknown) => n(a) + n(b);

  const mergedPatch: Record<string, unknown> = {
    block_dodger_score: mergeMax(c.block_dodger_score, d.block_dodger_score),
    neon_racer_score: mergeMax(c.neon_racer_score, d.neon_racer_score),
    ape_man_score: mergeMax(c.ape_man_score, d.ape_man_score),
    flappy_ape_score: mergeMax(c.flappy_ape_score, d.flappy_ape_score),
    galaxy_ape_score: mergeMax(c.galaxy_ape_score, d.galaxy_ape_score),
    total_points: mergeMax(c.total_points, d.total_points),
    level: mergeMax(c.level, d.level),
    experience: mergeMax(c.experience, d.experience),
    total_games_played: mergeSum(c.total_games_played, d.total_games_played),
    block_dodger_games: mergeSum(c.block_dodger_games, d.block_dodger_games),
    neon_racer_games: mergeSum(c.neon_racer_games, d.neon_racer_games),
    ape_man_games: mergeSum(c.ape_man_games, d.ape_man_games),
    flappy_ape_games: mergeSum(c.flappy_ape_games, d.flappy_ape_games),
    galaxy_ape_games: mergeSum(c.galaxy_ape_games, d.galaxy_ape_games),
    clubroom_visits: mergeSum(c.clubroom_visits, d.clubroom_visits),
    messages_sent: mergeSum(c.messages_sent, d.messages_sent),
    reactions_sent: mergeSum(c.reactions_sent, d.reactions_sent),
    nft_count: mergeMax(c.nft_count, d.nft_count),
    bananas: mergeMax(c.bananas, d.bananas),
    updated_at: new Date().toISOString(),
  };

  if (d.forever_ape_id == null && c.forever_ape_id != null) mergedPatch.forever_ape_id = c.forever_ape_id;
  if (d.selected_ape == null && c.selected_ape != null) mergedPatch.selected_ape = c.selected_ape;

  const { data: gsLegacy } = await supabase.from('game_scores').select('*').ilike('wallet_address', legacy);
  for (const row of gsLegacy ?? []) {
    const gameId = String(row.game_id);
    const { data: ex } = await supabase
      .from('game_scores')
      .select('score')
      .ilike('wallet_address', canonical)
      .eq('game_id', gameId)
      .maybeSingle();
    const best = Math.max(n(ex?.score), n(row.score));
    await supabase.from('game_scores').delete().ilike('wallet_address', legacy).eq('game_id', gameId);
    if (ex) {
      await supabase.from('game_scores').update({ score: best }).ilike('wallet_address', canonical).eq('game_id', gameId);
    } else {
      await supabase.from('game_scores').insert({
        wallet_address: canonical,
        game_id: gameId,
        score: best,
        created_at: row.created_at ?? new Date().toISOString(),
      });
    }
  }

  const { data: uaLegacy } = await supabase.from('user_achievements').select('*').ilike('wallet_address', legacy);
  for (const row of uaLegacy ?? []) {
    const { data: ex } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .ilike('wallet_address', canonical)
      .eq('achievement_id', row.achievement_id)
      .maybeSingle();
    if (!ex) {
      await supabase.from('user_achievements').insert({
        wallet_address: canonical,
        achievement_id: row.achievement_id,
        unlocked_at: row.unlocked_at ?? new Date().toISOString(),
      });
    }
  }
  await supabase.from('user_achievements').delete().ilike('wallet_address', legacy);

  for (const table of ['user_upgrades', 'user_powerups', 'user_selected_powerup'] as const) {
    try {
      const { data: rows, error: tErr } = await supabase.from(table).select('*').ilike('wallet_address', legacy);
      if (tErr) continue;
      for (const row of rows ?? []) {
        const gameId = String(row.game_id);
        const { data: ex } = await supabase
          .from(table)
          .select('id')
          .ilike('wallet_address', canonical)
          .eq('game_id', gameId)
          .maybeSingle();
        await supabase.from(table).delete().ilike('wallet_address', legacy).eq('game_id', gameId);
        if (!ex) {
          const { id: _id, ...rest } = row as Record<string, unknown>;
          await supabase.from(table).insert({ ...rest, wallet_address: canonical, game_id: gameId });
        }
      }
    } catch {
      /* table may be missing in some environments */
    }
  }

  await supabase.from('user_profiles').update(mergedPatch).ilike('wallet_address', canonical);

  const { error: delErr } = await supabase.from('user_profiles').delete().ilike('wallet_address', legacy);
  if (delErr) {
    console.warn('[arcade-canonical-wallet] delete legacy profile', delErr.message);
  } else {
    console.info('[arcade-canonical-wallet] merged legacy wallet', legacy, '→', canonical);
  }
}

/**
 * @param glyphEvmWalletHint — Glyph holder EVM from the client (`glyphEvmWallet` localStorage).
 *   Resolves the profile **by wallet_address** so it works when `user_profiles.glyph_user_id` is
 *   Privy’s id (init-user) but the client only sends Glyph’s account id — `.eq(glyph_user_id, …)` would miss.
 */
export async function resolveCanonicalArcadeWallet(
  supabase: SupabaseClient,
  requestWallet: string,
  glyphUserId: string | null | undefined,
  glyphEvmWalletHint?: string | null
): Promise<{ wallet: string; mergedFrom: string | null }> {
  const w = normalizeWallet(requestWallet);
  if (!w) return { wallet: w, mergedFrom: null };

  // If a real Glyph account id is available, its profile wallet is the only canonical target.
  const gid = String(glyphUserId ?? '').trim();
  if (gid && !isSyntheticLegacyGlyphId(gid)) {
    const { data: byGlyph, error } = await supabase
      .from('user_profiles')
      .select('wallet_address')
      .eq('glyph_user_id', gid)
      .maybeSingle();

    if (!error && byGlyph?.wallet_address) {
      const canon = normalizeWallet(String(byGlyph.wallet_address));
      if (canon && canon !== w) {
        await mergeLegacyWalletIntoCanonical(supabase, w, canon);
        return { wallet: canon, mergedFrom: w };
      }
      if (canon) {
        return { wallet: canon, mergedFrom: null };
      }
    }
  }

  const evmHint = normalizeWallet(String(glyphEvmWalletHint ?? '').trim());
  if (evmHint) {
    if (evmHint !== w) {
      await mergeLegacyWalletIntoCanonical(supabase, w, evmHint);
      return { wallet: evmHint, mergedFrom: w };
    }
    return { wallet: w, mergedFrom: null };
  }

  if (!gid || isSyntheticLegacyGlyphId(gid)) {
    return { wallet: w, mergedFrom: null };
  }

  const { data: byGlyph, error } = await supabase
    .from('user_profiles')
    .select('wallet_address')
    .eq('glyph_user_id', gid)
    .maybeSingle();

  if (error || !byGlyph) {
    return { wallet: w, mergedFrom: null };
  }

  const canon = normalizeWallet(String(byGlyph.wallet_address ?? ''));
  if (!canon) {
    return { wallet: w, mergedFrom: null };
  }

  if (canon === w) {
    return { wallet: w, mergedFrom: null };
  }

  await mergeLegacyWalletIntoCanonical(supabase, w, canon);
  return { wallet: canon, mergedFrom: w };
}
