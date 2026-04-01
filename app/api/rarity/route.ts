import { NextResponse } from 'next/server';

const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index';

export const revalidate = 3600; // re-fetch every hour

type TokenRecord = { id: number; image: string; attributes: Array<{ trait_type?: string; type?: string; value: string }> };
type TraitsMeta  = { types: string[]; valuesByType: Record<string, string[]>; counts: Record<string, Record<string, number>> };

export type RarityEntry = {
  id: number;
  rank: number;
  score: number;
  tier: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';
  traits: Array<{ name: string; value: string; count: number; rarity: number }>;
};

function getTier(rank: number, total: number): RarityEntry['tier'] {
  const pct = rank / total;
  if (pct <= 0.01) return 'Legendary';
  if (pct <= 0.05) return 'Epic';
  if (pct <= 0.20) return 'Rare';
  if (pct <= 0.50) return 'Uncommon';
  return 'Common';
}

let cache: { data: RarityEntry[]; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function buildRarity(): Promise<RarityEntry[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const [tokensRes, traitsRes] = await Promise.all([
    fetch(`${CDN_BASE}/tokens.json`, { cache: 'force-cache' }),
    fetch(`${CDN_BASE}/traits.json`, { cache: 'force-cache' }),
  ]);
  if (!tokensRes.ok || !traitsRes.ok) throw new Error('CDN fetch failed');

  const tokens: TokenRecord[] = await tokensRes.json();
  const meta: TraitsMeta = await traitsRes.json();
  const total = tokens.length;

  const entries: RarityEntry[] = tokens.map(token => {
    let score = 0;
    const traitDetails: RarityEntry['traits'] = [];

    for (const attr of token.attributes || []) {
      const name = attr.trait_type || attr.type || '';
      const value = attr.value || '';
      if (!name || !value) continue;
      const count = meta.counts?.[name]?.[value] ?? 1;
      const rarityScore = total / count;
      score += rarityScore;
      traitDetails.push({ name, value, count, rarity: Math.round(rarityScore * 100) / 100 });
    }

    return { id: token.id, rank: 0, score: Math.round(score * 100) / 100, tier: 'Common', traits: traitDetails };
  });

  // Sort by score descending, assign rank and tier
  entries.sort((a, b) => b.score - a.score);
  for (let i = 0; i < entries.length; i++) {
    entries[i].rank = i + 1;
    entries[i].tier = getTier(i + 1, total);
  }

  cache = { data: entries, ts: Date.now() };
  return entries;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const tier = searchParams.get('tier');

    const all = await buildRarity();

    // Single token lookup
    if (tokenId !== null) {
      const entry = all.find(e => e.id === parseInt(tokenId));
      if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ entry, total: all.length });
    }

    // Filter by tier
    let filtered = tier ? all.filter(e => e.tier === tier) : all;

    // Paginate
    const start = (page - 1) * limit;
    const slice = filtered.slice(start, start + limit);

    return NextResponse.json({
      entries: slice,
      total: filtered.length,
      page,
      limit,
      pages: Math.ceil(filtered.length / limit),
      tierCounts: {
        Legendary: all.filter(e => e.tier === 'Legendary').length,
        Epic:      all.filter(e => e.tier === 'Epic').length,
        Rare:      all.filter(e => e.tier === 'Rare').length,
        Uncommon:  all.filter(e => e.tier === 'Uncommon').length,
        Common:    all.filter(e => e.tier === 'Common').length,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
