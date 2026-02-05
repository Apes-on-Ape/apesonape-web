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
    const maxPages = 10; // Limit to prevent infinite loops (10 pages = 2000 tracks)

    while (nextUrl && pageCount < maxPages) {
      pageCount++;
      const tracksResponse = await fetch(nextUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });

      if (!tracksResponse.ok) {
        break;
      }

      const tracksData = await tracksResponse.json();
      const tracks = Array.isArray(tracksData) ? tracksData : (tracksData.collection || []);
      
      allTracks = allTracks.concat(tracks);
      
      // Get next page URL
      nextUrl = tracksData.next_href ? `${tracksData.next_href}&client_id=${clientId}` : '';
      
      // Stop if we've fetched all tracks
      if (tracks.length === 0 || !nextUrl) break;
    }

    let totalPlays = 0;
    let totalLikes = 0;
    let totalReposts = 0;

    if (allTracks.length > 0) {
      // Calculate aggregate stats from all tracks
      totalPlays = allTracks.reduce((sum: number, track: any) => sum + (track.playback_count || 0), 0);
      totalLikes = allTracks.reduce((sum: number, track: any) => sum + (track.likes_count || 0), 0);
      totalReposts = allTracks.reduce((sum: number, track: any) => sum + (track.reposts_count || 0), 0);
    }

    // Calculate top tracks by ranking score (plays + likes * 2)
    const tracksWithScore = allTracks.map((track: any) => ({
      id: track.id,
      title: track.title || 'Untitled',
      permalink_url: track.permalink_url || '',
      artwork_url: track.artwork_url || '',
      playback_count: track.playback_count || 0,
      likes_count: track.likes_count || 0,
      reposts_count: track.reposts_count || 0,
      duration: track.duration || 0,
      // Ranking score: plays count heavily, likes count more
      score: (track.playback_count || 0) + (track.likes_count || 0) * 2,
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
