import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = normalizeWallet(body.wallet_address || '');
    const gameId = String(body.game_id || '');
    if (!wallet || !gameId) {
      return NextResponse.json({ rank: 0 });
    }

    const supabase = getArcadeSupabase();
    const { data: mine } = await supabase
      .from('game_scores')
      .select('score')
      .ilike('wallet_address', wallet)
      .eq('game_id', gameId)
      .maybeSingle();

    const myScore = mine?.score ?? 0;
    if (myScore <= 0) {
      return NextResponse.json({ rank: 0 });
    }

    const { count, error } = await supabase
      .from('game_scores')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .gt('score', myScore);

    if (error) {
      console.error('[get_user_rank]', error);
      return NextResponse.json({ rank: 1 });
    }

    const rank = (count ?? 0) + 1;
    return NextResponse.json({ rank });
  } catch {
    return NextResponse.json({ rank: 0 });
  }
}
