import { NextRequest, NextResponse } from 'next/server';
import { magicEdenAPI } from '@/lib/magic-eden';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Accept ?address=0x... OR ?addresses=0x1&addresses=0x2  (mirrors the badges API pattern)
  const single    = searchParams.get('address');
  const multi     = searchParams.getAll('addresses').filter(Boolean);
  const addresses = single ? [single] : multi;

  if (!addresses.length) {
    return NextResponse.json({ error: 'address or addresses required' }, { status: 400 });
  }

  try {
    // Query every wallet in parallel — same method the badges API uses
    const results = await Promise.all(
      addresses.map(addr => magicEdenAPI.getWalletTokenIds(addr.toLowerCase().trim()))
    );

    // Merge all token IDs, deduplicate, sort ascending
    const merged = [...new Set(results.flat())].sort((a, b) => a - b);

    console.log(`[portfolio] ${addresses.length} wallet(s) → ${merged.length} token IDs`, merged.slice(0, 10));

    return NextResponse.json({ tokenIds: merged, total: merged.length });
  } catch (err) {
    console.error('[portfolio]', err);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
