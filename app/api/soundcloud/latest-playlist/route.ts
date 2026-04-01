import { NextResponse } from 'next/server';

const CLIENT_ID = 'gqKBMSuBw5rbN9rDRYPqKNvF17ovlObu';
const USER_URL = 'https://soundcloud.com/apesonape';

export const runtime = 'edge';
export const revalidate = 3600; // re-check every hour

export async function GET() {
  try {
    // Step 1: resolve username → user object (to get numeric ID)
    const userRes = await fetch(
      `https://api-widget.soundcloud.com/resolve?url=${encodeURIComponent(USER_URL)}&format=json&client_id=${CLIENT_ID}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
    );
    if (!userRes.ok) throw new Error(`resolve ${userRes.status}`);
    const user = await userRes.json();

    // Step 2: fetch up to 50 playlists for this user
    const plRes = await fetch(
      `https://api-widget.soundcloud.com/users/${user.id}/playlists?format=json&client_id=${CLIENT_ID}&limit=50`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
    );
    if (!plRes.ok) throw new Error(`playlists ${plRes.status}`);
    const plData = await plRes.json();
    const playlists: Array<{ permalink_url: string; title: string; track_count: number; created_at: string }> =
      Array.isArray(plData) ? plData : (plData.collection || []);

    if (!playlists.length) throw new Error('no playlists');

    // Sort descending by creation date — first item = most recently uploaded album
    playlists.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const latest = playlists[0];
    return NextResponse.json({
      url: latest.permalink_url,
      title: latest.title,
      trackCount: latest.track_count,
    });
  } catch {
    // Fallback: stream the whole user page (SoundCloud will play all public tracks)
    return NextResponse.json({ url: USER_URL, title: 'AOA Radio', trackCount: 0 });
  }
}
