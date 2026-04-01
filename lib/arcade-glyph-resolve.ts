import 'server-only';

import { normalizeWallet } from '@/lib/arcade-db';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';

function getMainSupabase() {
  return getSupabaseServiceClient() ?? getSupabaseServerClient();
}

/**
 * Latest `glyph_profile.glyphId` from studio creations for this wallet (matches `user_profiles.glyph_user_id`).
 * Uses case-insensitive match on `creator_address` because DB may store checksummed addresses.
 */
export async function resolveGlyphUserIdFromStudioWallet(walletRaw: string): Promise<string | null> {
  const wallet = normalizeWallet(walletRaw);
  if (!wallet) return null;
  const main = getMainSupabase();
  if (!main) return null;

  const { data: rows, error } = await main
    .from('studio_creations')
    .select('glyph_profile, created_at')
    .ilike('creator_address', wallet)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn('[arcade-glyph-resolve] studio_creations', error.message);
    return null;
  }

  for (const row of rows ?? []) {
    const gp = row.glyph_profile as { glyphId?: string } | null;
    const gid = gp?.glyphId?.trim();
    if (gid) return gid;
  }
  return null;
}

/**
 * If this wallet already has a `user_profiles` row with a real Glyph id (not `legacy:…`),
 * return it — helps server-side merge when the client wallet is already the canonical Glyph EVM.
 */
export async function resolveGlyphUserIdFromUserProfileWallet(walletRaw: string): Promise<string | null> {
  const wallet = normalizeWallet(walletRaw);
  if (!wallet) return null;
  const main = getMainSupabase();
  if (!main) return null;

  const { data, error } = await main
    .from('user_profiles')
    .select('glyph_user_id')
    .ilike('wallet_address', wallet)
    .maybeSingle();

  if (error || !data) return null;
  const gid = String(data.glyph_user_id ?? '').trim();
  if (gid && !gid.startsWith('legacy:')) return gid;
  return null;
}

/** PostgREST `or=(col.ilike.w1,col.ilike.w2,…)` — case-insensitive match for EVM addresses in main DB. */
export function walletColumnIlikeOr(column: string, wallets: string[]): string {
  const uniq = [...new Set(wallets.map((w) => normalizeWallet(w)).filter(Boolean))];
  return uniq.map((w) => `${column}.ilike.${w}`).join(',');
}
