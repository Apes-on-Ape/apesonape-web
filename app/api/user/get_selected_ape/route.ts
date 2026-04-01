import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet_address');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });
  }

  try {
    const supabase = getArcadeSupabase();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('selected_ape')
      .ilike('wallet_address', normalizeWallet(wallet))
      .maybeSingle();

    if (error) {
      console.error('[get_selected_ape]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ status: 'user_not_found', selected_ape: null });
    }

    const selected = data.selected_ape;
    if (selected == null) {
      return NextResponse.json({ status: 'no_ape_selected', selected_ape: null });
    }

    return NextResponse.json({
      status: 'success',
      selected_ape: selected,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
