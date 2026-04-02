import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveCanonicalArcadeWallet } from '@/lib/arcade-canonical-wallet';

/** Arcade tables use RLS permissive policies; prefer service role when available. */
export function getArcadeSupabase(): SupabaseClient {
  const svc = getSupabaseServiceClient();
  if (svc) return svc;
  return getSupabaseServerClient();
}

export function normalizeWallet(w: string): string {
  return w.trim().toLowerCase();
}

/** Ensure a `user_profiles` row exists for this wallet (preserves existing real `glyph_user_id`). */
export async function upsertUserProfileByWallet(
  supabase: SupabaseClient,
  walletRaw: string,
  glyphUserId?: string | null
) {
  const gidInput = String(glyphUserId ?? '').trim();
  // Never create wallet-only synthetic rows for arcade writes.
  if (!gidInput) return;
  let wallet = normalizeWallet(walletRaw);
  if (!wallet) return;
  if (gidInput) {
    const r = await resolveCanonicalArcadeWallet(
      supabase,
      wallet,
      gidInput,
      null
    );
    wallet = r.wallet;
  }
  const { data: ex } = await supabase
    .from('user_profiles')
    .select('glyph_user_id')
    .ilike('wallet_address', wallet)
    .maybeSingle();
  const gid = String(ex?.glyph_user_id ?? '').trim() || gidInput;
  await supabase.from('user_profiles').upsert({ wallet_address: wallet, glyph_user_id: gid }, { onConflict: 'wallet_address' });
}
