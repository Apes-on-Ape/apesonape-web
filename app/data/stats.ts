/**
 * Stats displayed on the homepage / music pages.
 *
 * "source" describes where the live value comes from so it is easy to
 * update if the API shape changes. Values are fetched at runtime from
 * /api/soundcloud/stats or hardcoded from the collection constants.
 *
 * IMPORTANT: only display stats that have a reliable source.
 * Do NOT invent numbers — if a stat is unavailable, omit it.
 */

export interface StatDefinition {
  id: string;
  label: string;
  /** Hardcoded fallback shown while loading or if API is unavailable. */
  fallback: string;
  /** Where this number comes from. Informational only. */
  source: 'soundcloud_api' | 'collection_constant' | 'hardcoded';
  /** Field on the /api/soundcloud/stats response that supplies this value, if any. */
  apiField?: string;
}

/** Fixed collection supply — never changes. */
export const COLLECTION_SUPPLY = 10_000;

export const HOMEPAGE_STATS: StatDefinition[] = [
  {
    id: 'plays',
    label: 'Plays',
    fallback: '2M+',
    source: 'soundcloud_api',
    apiField: 'totalPlayCount',
  },
  {
    id: 'releases',
    label: 'Releases',
    fallback: '100+',
    source: 'soundcloud_api',
    apiField: 'playlistCount',
  },
  {
    id: 'tracks',
    label: 'Tracks',
    fallback: '1,000+',
    source: 'soundcloud_api',
    apiField: 'trackCount',
  },
  {
    id: 'apes',
    label: 'Apes',
    fallback: '10,000',
    source: 'collection_constant',
  },
];

/** Format a raw number for display (e.g. 2500000 → "2.5M") */
export function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
  return String(n);
}
