import { NextResponse } from 'next/server';

const SOUNDCLOUD_USER_URL = process.env.SOUNDCLOUD_USER_URL || 'https://soundcloud.com/apesonape';
const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
// Public Widget API client_id (used by SoundCloud's own widget)
const WIDGET_CLIENT_ID = 'gqKBMSuBw5rbN9rDRYPqKNvF17ovlObu';

export const runtime = 'edge';
export const revalidate = 3600; // Cache for 1 hour

const PLAYLIST_CHUNK_SIZE = 10; // Resolve this many playlists per chunk
const COMPACT_TRACKS_PER_CHUNK = 500; // Max compact tracks to fetch per chunk (batch /tracks?ids=)

type TrackData = {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url: string;
  playback_count: number;
  likes_count: number;
  reposts_count: number;
  duration: number;
};

function addTrack(
  trackById: Map<number, TrackData>,
  t: any
): void {
  if (!t?.id) return;
  const pc = typeof t.playback_count === 'number' ? t.playback_count : undefined;
  const existing = trackById.get(t.id);
  if (pc !== undefined) {
    if (!existing || pc > (existing.playback_count ?? 0)) {
      trackById.set(t.id, {
        id: t.id,
        title: t.title || 'Untitled',
        permalink_url: t.permalink_url || '',
        artwork_url: t.artwork_url || '',
        playback_count: pc,
        likes_count: t.likes_count || 0,
        reposts_count: t.reposts_count || 0,
        duration: t.duration || 0,
      });
    } else if (existing && (!existing.title || existing.title === 'Untitled') && t.title) {
      existing.title = t.title;
      existing.permalink_url = existing.permalink_url || t.permalink_url || '';
      existing.artwork_url = existing.artwork_url || t.artwork_url || '';
    }
  } else if (existing && (!existing.title || existing.title === 'Untitled') && t.title) {
    existing.title = t.title;
    existing.permalink_url = existing.permalink_url || t.permalink_url || '';
    existing.artwork_url = existing.artwork_url || t.artwork_url || '';
  }
}

async function resolvePlaylists(
  playlists: any[],
  clientId: string,
  startIdx: number,
  count: number
): Promise<{ tracks: TrackData[]; remainingCompactIds: number[] }> {
  const trackById = new Map<number, TrackData>();
  const compactIds = new Set<number>();
  const slice = playlists.slice(startIdx, startIdx + count);

  for (const pl of slice) {
    const permalinkUrl = pl.permalink_url || pl.uri;
    if (!permalinkUrl) continue;
    try {
      const resolveUrl = `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(permalinkUrl)}&format=json&client_id=${clientId}`;
      const plRes = await fetch(resolveUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });
      if (!plRes.ok) continue;
      const fullPl = await plRes.json();
      const plTracks = fullPl.tracks || [];
      for (const t of plTracks) {
        if (t?.id && typeof t.playback_count === 'number') {
          addTrack(trackById, t);
        } else if (t?.id && !trackById.has(t.id)) {
          compactIds.add(t.id);
        }
      }
    } catch {
      // skip failed playlist
    }
  }

  // Fetch compact tracks via batch /tracks?ids= (1 request vs many). Playlist often returns id-only refs.
  const allCompactIds = Array.from(compactIds);
  const idsToFetch = allCompactIds.slice(0, COMPACT_TRACKS_PER_CHUNK);
  const remainingCompactIds = allCompactIds.slice(COMPACT_TRACKS_PER_CHUNK);
  const BATCH_SIZE = 100; // ~400 max per URL limit, use 100 to be safe
  for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
    const batch = idsToFetch.slice(i, i + BATCH_SIZE);
    const idsParam = batch.join(',');
    const mainClientId = SOUNDCLOUD_CLIENT_ID || clientId;
    const urls = [
      `https://api-widget.soundcloud.com/tracks?ids=${idsParam}&format=json&client_id=${clientId}`,
      `https://api.soundcloud.com/tracks?ids=${idsParam}&client_id=${mainClientId}`,
    ];
    let fetched = false;
    for (const batchUrl of urls) {
      try {
        const res = await fetch(batchUrl, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.collection || []);
        for (const t of arr) {
          if (t?.id) addTrack(trackById, t);
        }
        fetched = true;
        break;
      } catch {
        continue;
      }
    }
    if (!fetched) {
      // Fallback: fetch individually if batch fails
      for (const id of batch) {
        try {
          const r = await fetch(`https://api-widget.soundcloud.com/tracks/${id}?format=json&client_id=${clientId}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 },
          });
          if (r.ok) {
            const t = await r.json();
            if (t?.id) addTrack(trackById, t);
          }
        } catch {
          // skip
        }
      }
    }
  }

  return {
    tracks: Array.from(trackById.values()),
    remainingCompactIds,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistChunk = searchParams.get('playlistChunk');
    const fetchTrackIds = searchParams.get('fetchTrackIds');
    const chunkIndex = playlistChunk !== null ? parseInt(playlistChunk, 10) : -1;

    const clientId = WIDGET_CLIENT_ID;

    // Fetch specific track IDs (for compact tracks we couldn't fetch in playlist chunks)
    if (fetchTrackIds) {
      const ids = fetchTrackIds.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      const tracks: TrackData[] = [];
      const BATCH = 100;
      const mainClientId = SOUNDCLOUD_CLIENT_ID || clientId;
      for (let i = 0; i < ids.length; i += BATCH) {
        const batch = ids.slice(i, i + BATCH);
        const idsParam = batch.join(',');
        const urls = [
          `https://api-widget.soundcloud.com/tracks?ids=${idsParam}&format=json&client_id=${clientId}`,
          `https://api.soundcloud.com/tracks?ids=${idsParam}&client_id=${mainClientId}`,
        ];
        for (const url of urls) {
          try {
            const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } });
            if (!res.ok) continue;
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data.collection || []);
            for (const t of arr) {
              if (t?.id && typeof t.playback_count === 'number') {
                tracks.push({
                  id: t.id,
                  title: t.title || 'Untitled',
                  permalink_url: t.permalink_url || '',
                  artwork_url: t.artwork_url || '',
                  playback_count: t.playback_count,
                  likes_count: t.likes_count || 0,
                  reposts_count: t.reposts_count || 0,
                  duration: t.duration || 0,
                });
              }
            }
            break;
          } catch {
            continue;
          }
        }
      }
      return NextResponse.json({ tracks });
    }

    // Chunk-only request: just resolve a slice of playlists (needs playlists list)
    if (chunkIndex >= 0) {
      const userRes = await fetch(
        `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(SOUNDCLOUD_USER_URL)}&format=json&client_id=${clientId}`,
        { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } }
      );
      if (!userRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: userRes.status });
      }
      const user = await userRes.json();

      let allPlaylists: any[] = [];
      let nextUrl = `https://api-widget.soundcloud.com/users/${user.id}/playlists?format=json&client_id=${clientId}&limit=50&linked_partitioning=1`;
      let pages = 0;
      while (nextUrl && pages < 10) {
        pages++;
        const res = await fetch(nextUrl, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 },
        });
        if (!res.ok) break;
        const data = await res.json();
        const pls = Array.isArray(data) ? data : (data.collection || []);
        allPlaylists = allPlaylists.concat(pls);
        nextUrl = data.next_href ? `${data.next_href}&client_id=${clientId}` : '';
        if (pls.length === 0 || !nextUrl) break;
      }

      const startIdx = chunkIndex * PLAYLIST_CHUNK_SIZE;
      const totalChunks = Math.ceil(allPlaylists.length / PLAYLIST_CHUNK_SIZE);
      if (startIdx >= allPlaylists.length) {
        return NextResponse.json({ tracks: [], chunkIndex, totalChunks });
      }

      const { tracks, remainingCompactIds } = await resolvePlaylists(
        allPlaylists,
        clientId,
        startIdx,
        PLAYLIST_CHUNK_SIZE
      );
      return NextResponse.json({
        tracks,
        remainingCompactIds,
        chunkIndex,
        totalChunks,
      });
    }

    // Base request: user + tracks + playlists list + first chunk of resolved playlists
    const resolveUrl = `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(SOUNDCLOUD_USER_URL)}&format=json&client_id=${clientId}`;
    const userResponse = await fetch(resolveUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return NextResponse.json({ error: 'Failed to fetch user data', details: errorText }, { status: userResponse.status });
    }
    const user = await userResponse.json();

    // Try api-v2 stats/totals for direct total plays (unofficial, may work for public profiles)
    let directTotalPlays: number | null = null;
    try {
      const now = Date.now();
      const statsUrl = `https://api-v2.soundcloud.com/users/soundcloud:users:${user.id}/stats/totals?from=0&to=${now}&client_id=${clientId}&app_version=1`;
      const statsRes = await fetch(statsUrl, {
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://soundcloud.com',
          'Referer': 'https://soundcloud.com/',
        },
        next: { revalidate: 3600 },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const plays = statsData?.plays ?? statsData?.total_plays ?? statsData?.playback_count
          ?? statsData?.count ?? (Array.isArray(statsData) ? statsData.reduce((s: number, d: any) => s + (d?.plays ?? d?.count ?? 0), 0) : null);
        if (typeof plays === 'number' && plays > 0) {
          directTotalPlays = plays;
        }
      }
    } catch {
      // api-v2 may require auth or be unavailable
    }

    let allTracks: any[] = [];
    let nextUrl = `https://api-widget.soundcloud.com/users/${user.id}/tracks?format=json&client_id=${clientId}&limit=200&linked_partitioning=1`;
    let pageCount = 0;
    while (nextUrl && pageCount < 20) {
      pageCount++;
      const tracksResponse = await fetch(nextUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });
      if (!tracksResponse.ok) break;
      const tracksData = await tracksResponse.json();
      const tracks = Array.isArray(tracksData) ? tracksData : (tracksData.collection || []);
      allTracks = allTracks.concat(tracks);
      nextUrl = tracksData.next_href ? `${tracksData.next_href}&client_id=${clientId}` : '';
      if (tracks.length === 0 || !nextUrl) break;
    }

    let allPlaylists: any[] = [];
    let playlistsNextUrl = `https://api-widget.soundcloud.com/users/${user.id}/playlists?format=json&client_id=${clientId}&limit=50&linked_partitioning=1`;
    let playlistsPageCount = 0;
    while (playlistsNextUrl && playlistsPageCount < 10) {
      playlistsPageCount++;
      const playlistsResponse = await fetch(playlistsNextUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });
      if (!playlistsResponse.ok) break;
      const playlistsData = await playlistsResponse.json();
      const playlists = Array.isArray(playlistsData) ? playlistsData : (playlistsData.collection || []);
      allPlaylists = allPlaylists.concat(playlists);
      playlistsNextUrl = playlistsData.next_href ? `${playlistsData.next_href}&client_id=${clientId}` : '';
      if (playlists.length === 0 || !playlistsNextUrl) break;
    }

    const trackById = new Map<number, TrackData>();
    for (const t of allTracks) addTrack(trackById, t);
    for (const pl of allPlaylists) {
      for (const t of pl.tracks || []) addTrack(trackById, t);
    }

    // Resolve first chunk of playlists
    const { tracks: firstChunkTracks, remainingCompactIds: firstChunkRemaining } = await resolvePlaylists(
      allPlaylists,
      clientId,
      0,
      PLAYLIST_CHUNK_SIZE
    );
    for (const t of firstChunkTracks) {
      const existing = trackById.get(t.id);
      if (!existing || t.playback_count > (existing.playback_count ?? 0)) {
        trackById.set(t.id, t);
      }
    }

    const totalChunks = Math.ceil(allPlaylists.length / PLAYLIST_CHUNK_SIZE);
    let totalPlays = 0;
    let totalLikes = 0;
    let totalReposts = 0;
    for (const [, data] of trackById) {
      totalPlays += data.playback_count || 0;
      totalLikes += data.likes_count || 0;
      totalReposts += data.reposts_count || 0;
    }
    if (directTotalPlays !== null && directTotalPlays > totalPlays) {
      totalPlays = directTotalPlays;
    }

    const tracksWithScore = Array.from(trackById.values()).map((t) => ({
      ...t,
      score: (t.playback_count || 0) + (t.likes_count || 0) * 2,
    }));
    const topTracks = tracksWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      user: {
        followers_count: user.followers_count,
        track_count: user.track_count,
        playlist_count: user.playlist_count,
      },
      stats: {
        followers: user.followers_count || 0,
        tracks: user.track_count || 0,
        playlists: user.playlist_count || 0,
        likes: totalLikes,
        reposts: totalReposts,
        totalPlays,
        topTracks,
      },
      tracks: Array.from(trackById.values()),
      playlistChunks: {
        total: totalChunks,
        chunkSize: PLAYLIST_CHUNK_SIZE,
      },
      remainingCompactIds: firstChunkRemaining,
      directTotalPlays: directTotalPlays ?? undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
