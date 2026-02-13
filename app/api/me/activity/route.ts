import { NextRequest, NextResponse } from 'next/server';

// Magic Eden NFT Activity - https://docs.magiceden.io/reference/evm-api-overview
const ME_EVM_API = 'https://api-mainnet.magiceden.dev/v4/evm-public';
const COLLECTION_ID = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';

export const runtime = 'edge';
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '12';
    const type = searchParams.get('type') || 'sale'; // sale, listing, transfer, etc.

    const apiKey = process.env.MAGIC_EDEN_API_KEY;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const params = new URLSearchParams({
      chain: 'apechain',
      collectionId: COLLECTION_ID,
      limit,
    });
    if (type !== 'all') params.set('type', type);

    const res = await fetch(`${ME_EVM_API}/activity?${params}`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 502 });
  }
}
