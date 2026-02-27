import { NextResponse } from 'next/server';

const SOUNDCLOUD_USER_URL = process.env.SOUNDCLOUD_USER_URL || 'https://soundcloud.com/apesonape';
const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
// Public Widget API client_id (used by SoundCloud's own widget)
const WIDGET_CLIENT_ID = 'gqKBMSuBw5rbN9rDRYPqKNvF17ovlObu';

export const runtime = 'edge';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Use the widget client_id for public API access
    const clientId = WIDGET_CLIENT_ID;

    // Step 1: Resolve the user URL using Widget API (no auth required)
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

    // Step 2: Fetch ALL user's tracks using pagination
    let allTracks: any[] = [];
    let nextUrl = `https://api-widget.soundcloud.com/users/${user.id}/tracks?format=json&client_id=${clientId}&limit=200`;
    let pageCount = 0;
    const maxPages = 20; // 20 pages = 4000 tracks

    while (nextUrl && pageCount < maxPages) {
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

    // Step 3: Fetch ALL playlists and extract tracks from each (albums contain tracks not always in /tracks)
    let allPlaylists: any[] = [];
    let playlistsNextUrl = `https://api-widget.soundcloud.com/users/${user.id}/playlists?format=json&client_id=${clientId}&limit=50`;
    let playlistsPageCount = 0;
    const maxPlaylistPages = 10; // 10 pages = 500 playlists

    while (playlistsNextUrl && playlistsPageCount < maxPlaylistPages) {
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

    // Step 4: Merge tracks from /tracks and playlists, dedupe by id (use track with playback_count)
    const trackById = new Map<number, any>();

    const addTrack = (t: any) => {
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
    };

    for (const t of allTracks) {
      addTrack(t);
    }

    // Step 5a: Extract tracks from playlists we already have (list may include embedded tracks)
    for (const pl of allPlaylists) {
      const plTracks = pl.tracks || [];
      for (const t of plTracks) {
        addTrack(t);
      }
    }

    // Step 5b: Resolve a limited number of playlists (avoid 502 timeout - Netlify/Edge ~10s limit)
    const MAX_PLAYLIST_RESOLVES = 25;
    const playlistsToResolve = allPlaylists.slice(0, MAX_PLAYLIST_RESOLVES);
    for (const pl of playlistsToResolve) {
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
          addTrack(t);
        }
      } catch {
        // skip failed playlist
      }
    }

    let totalPlays = 0;
    let totalLikes = 0;
    let totalReposts = 0;

    for (const [, data] of trackById) {
      totalPlays += data.playback_count || 0;
      totalLikes += data.likes_count || 0;
      totalReposts += data.reposts_count || 0;
    }

    const tracksWithScore = Array.from(trackById.values()).map((t) => ({
      ...t,
      score: (t.playback_count || 0) + (t.likes_count || 0) * 2,
    }));

    // Sort by score and get top 10
    const topTracks = tracksWithScore
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

    const stats = {
      followers: user.followers_count || 0,
      tracks: user.track_count || 0,
      playlists: user.playlist_count || 0,
      likes: totalLikes,
      reposts: totalReposts,
      totalPlays: totalPlays,
      topTracks: topTracks,
    };

    return NextResponse.json(stats);

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
