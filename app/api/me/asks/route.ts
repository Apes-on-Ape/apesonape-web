import { NextRequest, NextResponse } from 'next/server';
import tallalTest from '@api/tallal-test';

// getAssets returns { assets: [{ asset: { tokenId, name, mediaV2.main.uri }, floorAsk: { price.amount.native } }] }
const COLLECTION_ID = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';
const ME_ITEM_BASE = 'https://magiceden.io/collections/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0';

export const revalidate = 300;

type NormalizedListing = {
  tokenId: string;
  price: number;
  image: string;
  name: string;
  link: string;
};

/** Parse getAssets response item - asset + floorAsk structure */
function normalizeAsset(item: { asset?: unknown; floorAsk?: unknown }): NormalizedListing | null {
  const asset = item.asset as Record<string, unknown> | undefined;
  const floorAsk = item.floorAsk as Record<string, unknown> | undefined;
  if (!asset || !floorAsk) return null;

  const tokenId = String(asset.tokenId ?? '').trim();
  if (!tokenId) return null;

  const priceObj = floorAsk.price as Record<string, unknown> | undefined;
  const amount = priceObj?.amount as Record<string, unknown> | undefined;
  const native = amount?.native ?? amount?.decimal;
  const priceNum = typeof native === 'number' ? native : (typeof native === 'string' ? parseFloat(native) : 0) || 0;

  const media = asset.mediaV2 as Record<string, unknown> | undefined;
  const main = media?.main as Record<string, unknown> | undefined;
  const image = String(main?.uri ?? '').trim();
  const name = String(asset.name ?? `#${tokenId}`).trim() || `#${tokenId}`;

  return {
    tokenId,
    price: priceNum,
    image,
    name,
    link: `${ME_ITEM_BASE}/${tokenId}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const sortBy = searchParams.get('sortBy') || 'price';
    const sortDir = searchParams.get('sortDir') || 'asc';

    const apiKey = process.env.MAGIC_EDEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MAGIC_EDEN_API_KEY not configured' }, { status: 500 });
    }

    tallalTest.auth(`Bearer ${apiKey}`);

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const { data } = await tallalTest.getAssets({
      chain: 'apechain',
      collectionId: COLLECTION_ID,
      limit: limitNum,
      sortBy,
      sortDir,
      accept: '*/*',
    });

    const rawItems = (data as Record<string, unknown>).assets ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [];

    const normalized = items
      .map((item: { asset?: unknown; floorAsk?: unknown }) => normalizeAsset(item))
      .filter((n): n is NormalizedListing => n != null && n.tokenId !== '');

    const sliced = normalized.slice(0, limitNum);

    return NextResponse.json({
      items: sliced,
      total: normalized.length,
      floor: sliced[0]?.price,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 502 });
  }
}
