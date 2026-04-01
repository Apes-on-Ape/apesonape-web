import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = normalizeWallet(body.wallet_address || '');
    if (!wallet) {
      return NextResponse.json({ username: null });
    }

    const supabase = getArcadeSupabase();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .ilike('wallet_address', wallet)
      .maybeSingle();

    if (error) {
      console.error('[clubroom/get_username]', error);
      return NextResponse.json({ username: null });
    }

    return NextResponse.json({ username: data?.username ?? null });
  } catch {
    return NextResponse.json({ username: null });
  }
}
