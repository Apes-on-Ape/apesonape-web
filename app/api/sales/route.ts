import { NextResponse } from 'next/server';

export const revalidate = 60; // 1-minute cache

const CONTRACT = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';
const COLLECTION_SLUG = 'apes-on-apechain';
const ME_API_KEY = process.env.MAGIC_EDEN_API_KEY || '';

export type SaleEvent = {
  tokenId: number;
  price: string;
  priceRaw: number;
  buyer: string;
  seller: string;
  marketplace: string;
  txHash: string;
  timestamp: number;
};

async function fetchMagicEdenSales(): Promise<SaleEvent[]> {
  const url = `https://api-mainnet.magiceden.dev/v3/rtp/apechain/collections/activity/v6?collection=${CONTRACT}&types=sale&limit=20`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ME_API_KEY}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`MagicEden error ${res.status}`);
  const data = await res.json();
  const activities = data.activities || [];
  return activities.map((a: {
    token?: { tokenId?: string | number };
    price?: { amount?: { decimal?: number; usd?: number }; currency?: { symbol?: string } };
    fromAddress?: string;
    toAddress?: string;
    txHash?: string;
    timestamp?: number;
  }) => ({
    tokenId: parseInt(String(a.token?.tokenId || 0)),
    price: `${(a.price?.amount?.decimal || 0).toFixed(3)} ${a.price?.currency?.symbol || 'APE'}`,
    priceRaw: a.price?.amount?.decimal || 0,
    buyer: a.toAddress || '',
    seller: a.fromAddress || '',
    marketplace: 'MagicEden',
    txHash: a.txHash || '',
    timestamp: a.timestamp || Date.now() / 1000,
  }));
}

async function fetchOpenSeaSales(): Promise<SaleEvent[]> {
  const url = `https://api.opensea.io/api/v2/events/collection/${COLLECTION_SLUG}?event_type=sale&limit=20`;
  const res = await fetch(url, {
    headers: { 'x-api-key': '' }, // Public endpoint — no key needed for basic access
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`OpenSea error ${res.status}`);
  const data = await res.json();
  const events = data.asset_events || [];
  return events.map((e: {
    nft?: { identifier?: string | number };
    payment?: { quantity?: string; decimals?: number; symbol?: string };
    buyer?: string;
    seller?: string;
    transaction?: string;
    event_timestamp?: string;
  }) => {
    const rawQty = BigInt(e.payment?.quantity || '0');
    const decimals = e.payment?.decimals || 18;
    const price = Number(rawQty) / 10 ** decimals;
    return {
      tokenId: parseInt(String(e.nft?.identifier || 0)),
      price: `${price.toFixed(3)} ${e.payment?.symbol || 'APE'}`,
      priceRaw: price,
      buyer: e.buyer || '',
      seller: e.seller || '',
      marketplace: 'OpenSea',
      txHash: e.transaction || '',
      timestamp: e.event_timestamp ? new Date(e.event_timestamp).getTime() / 1000 : Date.now() / 1000,
    };
  });
}

export async function GET() {
  try {
    // Try MagicEden first, fallback to OpenSea
    let sales: SaleEvent[] = [];
    try {
      sales = await fetchMagicEdenSales();
    } catch {
      try {
        sales = await fetchOpenSeaSales();
      } catch {
        sales = [];
      }
    }

    // Sort by timestamp desc
    sales.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ sales: sales.slice(0, 20) });
  } catch (e) {
    return NextResponse.json({ sales: [], error: String(e) });
  }
}
