import { NextResponse } from 'next/server';

const SOUNDCLOUD_USER_URL = process.env.SOUNDCLOUD_USER_URL || 'https://soundcloud.com/apesonape';
const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;

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
    // If we have a SoundCloud Client ID, use the API
    if (SOUNDCLOUD_CLIENT_ID) {
      const username = SOUNDCLOUD_USER_URL.split('/').pop();
      
      // First resolve the user
      const resolveUrl = `https://api.soundcloud.com/resolve?url=${SOUNDCLOUD_USER_URL}&client_id=${SOUNDCLOUD_CLIENT_ID}`;
      const userResponse = await fetch(resolveUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        
        // Fetch user's playlists
        const playlistsUrl = `https://api.soundcloud.com/users/${user.id}/playlists?client_id=${SOUNDCLOUD_CLIENT_ID}&limit=50`;
        const playlistsResponse = await fetch(playlistsUrl, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 },
        });

        if (playlistsResponse.ok) {
          const playlists = await playlistsResponse.json();
          
          const formattedPlaylists = playlists.map((playlist: any) => ({
            id: String(playlist.id),
            title: playlist.title || 'Untitled',
            permalink: playlist.permalink_url || '',
            artwork: playlist.artwork_url?.replace('-large', '-t500x500') || '/AoA-placeholder-apecoinblue.jpg',
            trackCount: playlist.track_count || 0,
          }));

          return NextResponse.json({ playlists: formattedPlaylists });
        }
      }
    }

    // Return empty array if API not available
    return NextResponse.json({ playlists: [] });

  } catch (error) {
    console.error('Error fetching SoundCloud playlists:', error);
    return NextResponse.json({ playlists: [] });
  }
}
