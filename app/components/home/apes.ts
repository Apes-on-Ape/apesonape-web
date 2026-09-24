/** CDN thumbs already used by the collection. Homepage only ever requests this small set. */
export const APE_THUMB_BASE =
  'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

export function apeThumb(id: number) {
  return `${APE_THUMB_BASE}/${id}.webp`;
}

export function apeCode(id: number) {
  return String(id).padStart(4, '0');
}

/** One image on first paint. The other two load only if the hero rotates. */
export const HERO_APE_IDS = [42, 1337, 2191] as const;

/** Eight archive samples. Lazy-loaded below the fold. */
export const SCAN_APE_IDS = [42, 188, 337, 512, 701, 888, 1024, 1337] as const;
