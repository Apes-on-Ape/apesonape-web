import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = normalizeWallet(body.wallet_address || '');
    const gameId = String(body.game_id || '');
    if (!wallet || !gameId) {
      return NextResponse.json({ high_score: 0, error: 'wallet_address and game_id required' }, { status: 400 });
    }

    const supabase = getArcadeSupabase();
    const { data, error } = await supabase
      .from('game_scores')
      .select('score')
      .ilike('wallet_address', wallet)
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) {
      console.error('[get_high_score]', error);
      return NextResponse.json({ high_score: 0 });
    }

    return NextResponse.json({ high_score: data?.score ?? 0 });
  } catch (e) {
    return NextResponse.json({ high_score: 0 });
  }
}
