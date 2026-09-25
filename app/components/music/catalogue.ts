import { ARTISTS, type Artist } from '@/app/data/artists';
import type { SoundcloudStatsPayload } from '@/app/data/stats';

export type StationPlaylist = {
  id: string;
  title: string;
  url: string;
  trackCount: number;
  artwork?: string;
  /** Position in the full catalogue. A shelf label, not a release date or chain id. */
  shelf: number;
};

export type RankedTrack = {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url: string;
  playback_count: number;
};

export type StationStatsResult = {
  payload: SoundcloudStatsPayload | null;
  /** Present only after every playlist chunk was summed. */
  completePlays: number | null;
  topTracks: RankedTrack[];
};

/** Known SoundCloud sets used only when the playlist API returns nothing. */
export const FALLBACK_PLAYLISTS: Omit<StationPlaylist, 'shelf'>[] = [
  { id: 'saint-dank', title: 'Saint Dank by smokethatdank', url: 'https://soundcloud.com/apesonape/sets/saint-dank-by-smokethatdank', trackCount: 8 },
  { id: 'fubar', title: 'FUBAR by smokethatdank', url: 'https://soundcloud.com/apesonape/sets/fubar-by-smokethatdank', trackCount: 5 },
  { id: 'visionary', title: 'Visionary by smokethatdank', url: 'https://soundcloud.com/apesonape/sets/visionary-by-smokethatdank', trackCount: 8 },
  { id: 'unwrapped', title: 'Unwrapped But Not Finished by 2Real2x', url: 'https://soundcloud.com/apesonape/sets/unwrapped-but-not-finished-by-2real2x', trackCount: 8 },
  { id: 'press-start', title: 'Press Start by 2Real2x', url: 'https://soundcloud.com/apesonape/sets/press-start-by-2real2x', trackCount: 7 },
  { id: 'teeth-in-the-vines', title: 'Teeth In The Vines by NoTime', url: 'https://soundcloud.com/apesonape/sets/teeth-in-the-vines-by-notime', trackCount: 6 },
  { id: 'sinatra-season-2', title: 'Sinatra Season 2 by Dr. Dibs', url: 'https://soundcloud.com/apesonape/sets/sinatra-season-2-by-dr-dibs', trackCount: 12 },
  { id: 'brutal-dynasty', title: 'Brutal Dynasty by Simian Maw', url: 'https://soundcloud.com/apesonape/sets/brutal-dynasty-by-simian-maw', trackCount: 9 },
  { id: 'warm-up-vol-i', title: 'Warm Up Vol. I by ZEN', url: 'https://soundcloud.com/apesonape/sets/warm-up-vol-i-by-zen', trackCount: 10 },
  { id: 'el-juego', title: 'El Juego by ZEN', url: 'https://soundcloud.com/apesonape/sets/el-juego-by-zen', trackCount: 6 },
];

const ARTIST_PLAYLIST_SEED: Record<string, string> = {
  smokethatdank1: 'https://soundcloud.com/apesonape/sets/saint-dank-by-smokethatdank',
  '2real2x': 'https://soundcloud.com/apesonape/sets/unwrapped-but-not-finished-by-2real2x',
  alexnotime: 'https://soundcloud.com/apesonape/sets/teeth-in-the-vines-by-notime',
  doinitbettersan: 'https://soundcloud.com/apesonape/sets/dibsify-by-dr-dibs',
  dudeman22: 'https://soundcloud.com/apesonape/sets/brutal-dynasty-by-simian-maw',
};

const ARTIST_SC_ALIASES: Record<string, string[]> = {
  dudeman22: ['simianmaw', 'simiamaw'],
  surfingpunk: ['surfer', 'surfingpunk', 'surfpunk'],
};

export function releaseTitle(title: string) {
  return title.replace(/\s+by\s+.+$/i, '').trim() || title;
}

export function creditedArtist(title: string) {
  return title.match(/\bby\s+(.+)$/i)?.[1]?.trim() ?? '';
}

function creditKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function artistsForPlaylist(playlist: { title: string }): Artist[] {
  const byMatch = playlist.title.match(/\bby\s+(.+)$/i);
  if (!byMatch) return [];
  const credited = creditKey(byMatch[1]);
  return ARTISTS.filter((artist) => {
    const aliases = ARTIST_SC_ALIASES[artist.slug] ?? [];
    const keys = [creditKey(artist.name), creditKey(artist.handle), ...aliases];
    return keys.some((key) => key.length > 2 && (key === credited || credited.includes(key) || key.includes(credited)));
  });
}

export function albumsByArtist(playlists: StationPlaylist[]): Record<string, StationPlaylist[]> {
  const map: Record<string, StationPlaylist[]> = {};
  for (const playlist of playlists) {
    if (!playlist.url) continue;
    for (const artist of artistsForPlaylist(playlist)) {
      const list = map[artist.slug] ?? [];
      if (!list.some((item) => item.url === playlist.url)) list.push(playlist);
      map[artist.slug] = list;
    }
  }
  for (const slug of Object.keys(ARTIST_PLAYLIST_SEED)) {
    if (!map[slug]) map[slug] = [];
  }
  return map;
}

export function latestReleaseUrl(slug: string, albums: StationPlaylist[]) {
  return ARTIST_PLAYLIST_SEED[slug] || albums[0]?.url || '';
}

export function withShelf(playlists: Omit<StationPlaylist, 'shelf'>[]): StationPlaylist[] {
  return playlists
    .filter((playlist) => playlist.title?.trim() && playlist.url)
    .map((playlist, index) => ({ ...playlist, shelf: index + 1 }));
}

type RawTrack = {
  id: number;
  title?: string;
  permalink_url?: string;
  artwork_url?: string;
  playback_count?: number;
};

function rememberTrack(map: Map<number, RawTrack>, track: RawTrack) {
  if (!track?.id) return;
  const existing = map.get(track.id);
  if (!existing || (track.playback_count ?? 0) > (existing.playback_count ?? 0)) {
    map.set(track.id, track);
  }
}

/** Full stats pass. Play totals and rankings are returned only when every chunk succeeds. */
export async function loadStationStats(): Promise<StationStatsResult> {
  const empty: StationStatsResult = { payload: null, completePlays: null, topTracks: [] };
  try {
    const baseRes = await fetch('/api/soundcloud/stats');
    if (!baseRes.ok) return empty;
    const base = await baseRes.json();
    if (base.error) return empty;

    const payload = base as SoundcloudStatsPayload;
    const trackById = new Map<number, RawTrack>();
    for (const track of base.tracks || []) rememberTrack(trackById, track);

    const totalChunks = base.playlistChunks?.total ?? 1;
    const remaining = new Set<number>();
    for (const id of base.remainingCompactIds || []) {
      if (!trackById.has(id)) remaining.add(id);
    }

    let chunksComplete = true;
    for (let i = 1; i < totalChunks; i++) {
      const chunkRes = await fetch(`/api/soundcloud/stats?playlistChunk=${i}`);
      if (!chunkRes.ok) {
        chunksComplete = false;
        continue;
      }
      const chunk = await chunkRes.json();
      for (const track of chunk.tracks || []) rememberTrack(trackById, track);
      for (const id of chunk.remainingCompactIds || []) {
        if (!trackById.has(id)) remaining.add(id);
      }
    }

    const ids = Array.from(remaining);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const res = await fetch(`/api/soundcloud/stats?fetchTrackIds=${batch.join(',')}`);
      if (!res.ok) {
        chunksComplete = false;
        continue;
      }
      const data = await res.json();
      for (const track of data.tracks || []) rememberTrack(trackById, track);
    }

    if (!chunksComplete) {
      return { payload, completePlays: null, topTracks: [] };
    }

    let totalPlays = 0;
    for (const track of trackById.values()) totalPlays += track.playback_count || 0;
    if (typeof base.directTotalPlays === 'number' && base.directTotalPlays > totalPlays) {
      totalPlays = base.directTotalPlays;
    }

    const topTracks = Array.from(trackById.values())
      .filter((track) => typeof track.playback_count === 'number' && track.playback_count > 0 && track.title)
      .sort((a, b) => (b.playback_count || 0) - (a.playback_count || 0))
      .slice(0, 8)
      .map((track) => ({
        id: track.id,
        title: track.title || 'Untitled',
        permalink_url: track.permalink_url || '',
        artwork_url: track.artwork_url || '',
        playback_count: track.playback_count || 0,
      }));

    return {
      payload,
      completePlays: totalPlays > 0 ? totalPlays : null,
      topTracks,
    };
  } catch {
    return empty;
  }
}
