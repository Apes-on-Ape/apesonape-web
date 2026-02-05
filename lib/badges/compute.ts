import 'server-only';
import { magicEdenAPI } from '@/lib/magic-eden';
import { listCreations } from '@/lib/studio/persistence';
import { BADGE_DEFS } from './types';

const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/';

export type TraitCounts = Record<string, Record<string, number>>;
export type WalletAnalysis = {
  tokenIds: number[];
  totalApes: number;
  traitCounts: TraitCounts;
  creationCount: number;
};

/**
 * Fetch traitIndex from CDN and build a map: tokenId (0-based) -> { type -> value }.
 */
async function buildTokenTraitsMap(): Promise<Map<number, Record<string, string>>> {
  const res = await fetch(`${CDN_BASE}traitIndex.json`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch traitIndex');
  const traitIndex = (await res.json()) as Record<string, Record<string, number[]>>;
  const map = new Map<number, Record<string, string>>();
  for (const [type, values] of Object.entries(traitIndex)) {
    if (!values || typeof values !== 'object') continue;
    for (const [value, ids] of Object.entries(values)) {
      if (!Array.isArray(ids)) continue;
      for (const id of ids) {
        const n = Number(id);
        if (Number.isNaN(n)) continue;
        const existing = map.get(n) ?? {};
        existing[type] = value;
        map.set(n, existing);
      }
    }
  }
  return map;
}

/**
 * Get token IDs owned by wallet for the AoA collection.
 * Tries ME wallet tokens; if empty, no other source for now.
 */
async function getWalletTokenIds(wallet: string): Promise<number[]> {
  const ids = await magicEdenAPI.getWalletTokenIds(wallet);
  // ME may return 1-indexed display IDs; traitIndex is 0-based. We'll use both when looking up.
  return ids;
}

/**
 * Normalize token ID to 0-based index (ME may return 1-indexed).
 */
function toZeroBasedId(tokenId: number): number {
  if (tokenId <= 0) return 0;
  return tokenId > 10000 ? tokenId : tokenId - 1;
}

/**
 * Analyze wallet: token IDs, total count, trait counts, and AI Studio creation count.
 */
export async function analyzeWallet(
  address: string,
  options: { includeCreations?: boolean } = {}
): Promise<WalletAnalysis> {
  const wallet = address.toLowerCase().trim();
  const tokenIds = await getWalletTokenIds(wallet);
  const totalApes = tokenIds.length;
  console.log(`[Badges] Analyzed wallet ${wallet}: found ${totalApes} token IDs`, tokenIds.slice(0, 10));

  const traitCounts: TraitCounts = {};
  let tokenTraits: Map<number, Record<string, string>>;
  try {
    tokenTraits = await buildTokenTraitsMap();
  } catch {
    tokenTraits = new Map();
  }

  for (const id of tokenIds) {
    const idx = toZeroBasedId(id);
    const traits = tokenTraits.get(idx) ?? tokenTraits.get(id);
    if (!traits) continue;
    for (const [type, value] of Object.entries(traits)) {
      if (!traitCounts[type]) traitCounts[type] = {};
      traitCounts[type][value] = (traitCounts[type][value] ?? 0) + 1;
    }
  }

  let creationCount = 0;
  if (options.includeCreations !== false) {
    try {
      const list = await listCreations({ creator: wallet, limit: 500 });
      creationCount = list.items?.length ?? 0;
    } catch {
      // ignore
    }
  }

  return {
    tokenIds,
    totalApes,
    traitCounts,
    creationCount,
  };
}

/**
 * Compute which badge slugs the user has earned from wallet analysis.
 */
export function computeEarnedBadges(analysis: WalletAnalysis): string[] {
  const earned: string[] = [];
  const { traitCounts, totalApes, creationCount } = analysis;

  for (const def of BADGE_DEFS) {
    if (def.trait) {
      const { type, value, minCount } = def.trait;
      const count = traitCounts[type]?.[value] ?? 0;
      if (count >= minCount) earned.push(def.slug);
    } else if (def.outfit) {
      const { value, minCount } = def.outfit;
      const count = traitCounts['Clothes']?.[value] ?? 0;
      if (count >= minCount) earned.push(def.slug);
    } else if (def.milestone !== undefined) {
      if (totalApes >= def.milestone) earned.push(def.slug);
    } else if (def.minPublishes !== undefined) {
      if (creationCount >= def.minPublishes) earned.push(def.slug);
    }
  }

  return earned;
}

/**
 * Merge analyses from multiple wallets (e.g. all Glyph-linked wallets).
 * Union token IDs, sum trait counts, sum creation count.
 */
export function mergeAnalyses(analyses: WalletAnalysis[]): WalletAnalysis {
  const allTokenIds = new Set<number>();
  const traitCounts: TraitCounts = {};
  let creationCount = 0;
  for (const a of analyses) {
    a.tokenIds.forEach((id) => allTokenIds.add(id));
    for (const [type, values] of Object.entries(a.traitCounts)) {
      if (!traitCounts[type]) traitCounts[type] = {};
      for (const [value, count] of Object.entries(values)) {
        traitCounts[type][value] = (traitCounts[type][value] ?? 0) + count;
      }
    }
    creationCount += a.creationCount;
  }
  return {
    tokenIds: [...allTokenIds],
    totalApes: allTokenIds.size,
    traitCounts,
    creationCount,
  };
}
