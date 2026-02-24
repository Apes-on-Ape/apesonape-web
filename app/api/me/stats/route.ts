import { NextResponse } from 'next/server';

// Magic Eden EVM API: https://docs.magiceden.io/reference/getcollections
// Collection: https://magiceden.io/collections/apechain/apes-on-apechain
const ME_EVM_API = 'https://api-mainnet.magiceden.dev/v4/evm-public';

export const runtime = 'edge';
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const apiKey = process.env.MAGIC_EDEN_API_KEY;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Use Magic Eden EVM API - POST to get collection metadata and stats
    // https://docs.magiceden.io/reference/getcollections
    // API expects: chain + collectionSlugs OR collectionIds (contract address)
    const response = await fetch(`${ME_EVM_API}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chain: 'apechain',
        collectionIds: [COLLECTION_ID],
        collectionSlugs: ['apes-on-apechain'],
      }),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Magic Eden EVM Stats API error:', response.status, response.statusText, errText);
      // Fallback: getAsks (listings) or v2 stats
      const assetsFallback = await tryGetAssetsFallback(apiKey);
      if (assetsFallback) return NextResponse.json(assetsFallback);
      const fallback = await tryV2Fallback(apiKey);
      if (fallback) return NextResponse.json(fallback);
      return NextResponse.json(
        { error: 'Failed to fetch stats from Magic Eden' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const stats = normalizeEvmResponse(data);
    // If EVM returned no useful stats, try getAsks fallback (listings → floor + count)
    const hasData = stats.listedCount != null || stats.floorPrice != null ||
      stats.uniqueHolders != null || stats.totalSupply != null;
    if (!hasData) {
      const assetsFallback = await tryGetAssetsFallback(apiKey);
      if (assetsFallback) return NextResponse.json(assetsFallback);
      const v2Fallback = await tryV2Fallback(apiKey);
      if (v2Fallback) return NextResponse.json(v2Fallback);
    }
    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching collection stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats from Magic Eden' },
      { status: 502 }
    );
  }
}

const COLLECTION_ID = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';

function extractPrice(obj: unknown): number | undefined {
  if (obj == null) return undefined;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'string') return parseFloat(obj) || undefined;
  if (typeof obj === 'object') {
    const r = obj as Record<string, unknown>;
    const v = r.decimal ?? r.amount ?? r.price ?? r.value;
    return extractPrice(v);
  }
  return undefined;
}

/** Fallback: getAsks (listings) to derive floor price and listed count - https://docs.magiceden.io/reference/getasks */
async function tryGetAssetsFallback(apiKey?: string): Promise<Record<string, unknown> | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const params = new URLSearchParams({
      chain: 'apechain',
      collectionId: COLLECTION_ID,
      limit: '100',
      sortBy: 'price',
      sortDir: 'asc',
    });
    const res = await fetch(`${ME_EVM_API}/orders/asks?${params}`, {
      headers,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = (data as Record<string, unknown>).asks ?? (data as Record<string, unknown>).items ?? (Array.isArray(data) ? data : []);
    const list = Array.isArray(items) ? items : [];
    const first = list.length > 0 ? (list[0] as Record<string, unknown>) : null;
    const priceObj = first?.price as Record<string, unknown> | undefined;
    const amount = priceObj?.amount as Record<string, unknown> | undefined;
    const native = amount?.native ?? amount?.decimal;
    const floorPrice = typeof native === 'number' ? native : (typeof native === 'string' ? parseFloat(native) : undefined);
    const total = (data as Record<string, unknown>).total ?? (data as Record<string, unknown>).totalCount ?? list.length;
    return {
      symbol: 'apes-on-apechain',
      listedCount: typeof total === 'number' ? total : list.length,
      floorPrice,
      totalSupply: 10000, // Known collection supply
    };
  } catch {
    return null;
  }
}

/** Fallback to v2 collections/stats (Solana-style, limited for Apechain) */
async function tryV2Fallback(apiKey?: string): Promise<Record<string, unknown> | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const res = await fetch(
      'https://api-mainnet.magiceden.dev/v2/collections/apes-on-apechain/stats',
      { headers, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return normalizeEvmResponse(data);
  } catch {
    return null;
  }
}

/** Normalize Magic Eden EVM API response to our stats shape */
function normalizeEvmResponse(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  // Handle various response shapes: array, { collections: [...] }, { data: [...] }, or flat object
  let coll: unknown = d;
  if (Array.isArray(d)) coll = d[0];
  else if (Array.isArray(d.collections)) coll = d.collections[0];
  else if (Array.isArray(d.data)) coll = d.data[0];
  else if (d.collection && typeof d.collection === 'object') coll = d.collection;
  if (!coll || typeof coll !== 'object') return {};
  const c = coll as Record<string, unknown>;
  return {
    symbol: c.symbol ?? c.slug ?? 'apes-on-apechain',
    listedCount: c.listedCount ?? c.listed_count ?? c.numListings ?? c.listingsCount ?? 0,
    floorPrice: c.floorPrice ?? c.floor_price ?? c.floor,
    totalSupply: c.totalSupply ?? c.total_supply ?? c.supply ?? c.quantity,
    uniqueHolders: c.uniqueHolders ?? c.unique_holders ?? c.holders ?? c.ownerCount,
    volume24hr: c.volume24hr ?? c.volume24h ?? c.volume_24h ?? c.volume24hr,
    volume7d: c.volume7d ?? c.volume_7d,
    volume30d: c.volume30d ?? c.volume_30d,
    volumeAll: c.volumeAll ?? c.volume_all ?? c.totalVolume ?? c.total_volume,
  };
}
