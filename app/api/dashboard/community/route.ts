import { NextRequest, NextResponse } from 'next/server';
import { getCommunityDetail } from '@/lib/dashboard/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contract = searchParams.get('contract');

  if (!contract) {
    return NextResponse.json({ error: 'contract is required' }, { status: 400 });
  }

  try {
    const detail = await getCommunityDetail(contract);
    return NextResponse.json(detail, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('dashboard community error', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


