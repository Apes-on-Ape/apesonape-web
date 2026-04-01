import { NextResponse } from 'next/server';
import { getArcadeSupabase } from '@/lib/arcade-db';

/** Optional: list recent clubroom users from DB. Realtime lobby may still use Socket.IO memory. */
export async function GET() {
  try {
    const supabase = getArcadeSupabase();
    const { data, error } = await supabase
      .from('clubroom_users')
      .select('socket_id, username, ape_image, position, wallet_address, level, last_seen')
      .order('last_seen', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ users: [] });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch {
    return NextResponse.json({ users: [] });
  }
}
