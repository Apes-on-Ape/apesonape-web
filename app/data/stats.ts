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

/** Shape returned by /api/soundcloud/stats. Field names differ from StatDefinition.apiField. */
export type SoundcloudStatsPayload = {
  user?: { track_count?: number; playlist_count?: number };
  stats?: { tracks?: number; playlists?: number; totalPlays?: number };
  playlistChunks?: { total?: number };
  directTotalPlays?: number | null;
};

/**
 * Read one homepage stat from the live payload.
 * Play totals from the first playlist chunk are partial, so they are omitted
 * unless the route includes a direct total or the catalogue fits in one chunk.
 * Pass completePlays only after every stats chunk has been summed.
 */
export function readHomepageStat(
  def: StatDefinition,
  data: SoundcloudStatsPayload | null,
  completePlays?: number | null,
): string | null {
  if (def.source === 'collection_constant' && def.id === 'apes') {
    return COLLECTION_SUPPLY.toLocaleString('en-US');
  }
  if (def.id === 'plays' && typeof completePlays === 'number' && completePlays > 0) {
    return formatStat(completePlays);
  }
  if (!data || def.source !== 'soundcloud_api') return null;

  if (def.id === 'plays') {
    const chunks = data.playlistChunks?.total ?? 1;
    const direct = data.directTotalPlays;
    const summed = data.stats?.totalPlays;
    const plays =
      typeof direct === 'number' && direct > 0
        ? direct
        : chunks <= 1 && typeof summed === 'number' && summed > 0
          ? summed
          : null;
    return plays == null ? null : formatStat(plays);
  }

  if (def.id === 'releases') {
    const count = data.stats?.playlists ?? data.user?.playlist_count;
    return typeof count === 'number' && count > 0 ? formatStat(count) : null;
  }

  if (def.id === 'tracks') {
    const count = data.stats?.tracks ?? data.user?.track_count;
    return typeof count === 'number' && count > 0 ? formatStat(count) : null;
  }

  return null;
}
