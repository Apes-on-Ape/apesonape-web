import { NextResponse } from 'next/server';

const SOUNDCLOUD_USER_URL = process.env.SOUNDCLOUD_USER_URL || 'https://soundcloud.com/apesonape';
const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
// Public Widget API client_id (used by SoundCloud's own widget)
const WIDGET_CLIENT_ID = 'gqKBMSuBw5rbN9rDRYPqKNvF17ovlObu';

export const runtime = 'edge';
export const revalidate = 3600; // Cache for 1 hour

interface Playlist {
  id: string;
  title: string;
  permalink: string;
  artwork: string;
  trackCount: number;
}

export async function GET() {
  try {
    // Use the widget client_id for public API access
    const clientId = WIDGET_CLIENT_ID;

    // Step 1: Resolve the user URL using Widget API (no auth required)
    const resolveUrl = `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(SOUNDCLOUD_USER_URL)}&format=json&client_id=${clientId}`;
    
    const userResponse = await fetch(resolveUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return NextResponse.json({ error: 'Failed to fetch user data', details: errorText }, { status: userResponse.status });
    }

    const user = await userResponse.json();

    // Step 2: Fetch ALL playlists by following pagination cursors (next_href)
    const allPlaylists: any[] = [];
    let nextUrl: string | null =
      `https://api-widget.soundcloud.com/users/${user.id}/playlists?format=json&client_id=${clientId}&limit=200`;

    while (nextUrl) {
      const playlistsResponse = await fetch(nextUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (!playlistsResponse.ok) {
        const errorText = await playlistsResponse.text();
        return NextResponse.json(
          { error: 'Failed to fetch playlists', details: errorText },
          { status: playlistsResponse.status }
        );
      }

      const playlistsData = await playlistsResponse.json();

      if (Array.isArray(playlistsData)) {
        // Non-paginated legacy response — all data in one shot
        allPlaylists.push(...playlistsData);
        nextUrl = null;
      } else {
        // Paginated response: { collection: [...], next_href: "..." | null }
        const page: any[] = playlistsData.collection || [];
        allPlaylists.push(...page);
        // next_href already contains the client_id from SC, just use it directly
        nextUrl = playlistsData.next_href || null;
      }
    }

    // Format with high-quality artwork
    const formattedPlaylists = allPlaylists.map((playlist: any) => {
      const artwork =
        playlist.artwork_url
          ?.replace('-large.jpg', '-t500x500.jpg')
          .replace('-large.png', '-t500x500.png') || '';
      return {
        id: String(playlist.id),
        title: playlist.title || 'Untitled',
        permalink: playlist.permalink_url || '',
        artwork,
        trackCount: playlist.track_count || 0,
      };
    });

    return NextResponse.json({ playlists: formattedPlaylists });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
