import 'server-only';

import { getCachedTokenImageMap } from '@/lib/arcade-leaderboard-enrich';
import { normalizeWallet } from '@/lib/arcade-db';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';
import { toGatewayUri } from '@/lib/studio/urls';

/** WebP thumbs — fallback when `tokens.json` has no image for an id */
const COLLECTION_THUMB_BASE =
  'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

/**
 * JSON for `user_profiles.selected_ape` so arcade games can show the same avatar as the profile
 * (`tokenId`, `image` / `imageUrl`, `name`).
 */
export async function buildSelectedApePayloadForArcade(apeId: number): Promise<Record<string, unknown>> {
  const tokenMap = await getCachedTokenImageMap();
  const raw = tokenMap[String(apeId)]?.trim();
  const image = raw ? toGatewayUri(raw) || raw : `${COLLECTION_THUMB_BASE}/${apeId}.webp`;
  return {
    tokenId: apeId,
    name: `Ape #${apeId}`,
    image,
    imageUrl: image,
  };
}

function getMainSupabase() {
  return getSupabaseServiceClient() ?? getSupabaseServerClient();
}

/**
 * Forever Ape id from `user_profiles.forever_ape_id` + collection CDN (same as profile page).
 * `studio_forever_ape` is not required.
 */
export async function getForeverApeForWallet(walletRaw: string): Promise<{
  forever_ape_id: number | null;
  forever_ape_image_url: string | null;
}> {
  const wallet = normalizeWallet(walletRaw);
  if (!wallet) {
    return { forever_ape_id: null, forever_ape_image_url: null };
  }
  const main = getMainSupabase();
  if (!main) {
    return { forever_ape_id: null, forever_ape_image_url: null };
  }
  const { data: rows } = await main
    .from('user_profiles')
    .select('forever_ape_id')
    .ilike('wallet_address', wallet)
    .limit(1);

  const raw = rows?.[0]?.forever_ape_id;
  const id = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
  if (id == null) {
    return { forever_ape_id: null, forever_ape_image_url: null };
  }
  const tokenMap = await getCachedTokenImageMap();
  const img = tokenMap[String(id)];
  const forever_ape_image_url = img ? toGatewayUri(img) || img : null;
  return { forever_ape_id: id, forever_ape_image_url };
}
