import { withCache } from '../cache';
import type { CollectionMetadata } from '../types';

const BASE_URL = 'https://api-mainnet.magiceden.dev/v3/rtp/apechain/collections/v7';
const DEFAULT_LIMIT = 100;
const CACHE_TTL_MS = 5 * 60 * 1000;

function getHeaders() {
  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  const apiKey = process.env.MAGICEDEN_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

type RawCollection = Record<string, unknown>;

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeCollection(raw: RawCollection): CollectionMetadata | null {
  const contract =
    (raw as { contractAddress?: string }).contractAddress ||
    (raw as { contract?: string }).contract ||
    (raw as { address?: string }).address ||
    (raw as { mint?: string }).mint;

  const name =
    (raw as { name?: string }).name ||
    (raw as { collectionName?: string }).collectionName ||
    (raw as { symbol?: string }).symbol;

  if (!contract || !name) return null;

  return {
    name,
    contractAddress: contract,
    image:
      (raw as { image?: string }).image ||
      (raw as { imageURI?: string }).imageURI ||
      (raw as { img?: string }).img ||
      undefined,
    slug:
      (raw as { slug?: string }).slug ||
      (raw as { collectionSymbol?: string }).collectionSymbol ||
      (raw as { symbol?: string }).symbol ||
      undefined,
    floorPrice:
      coerceNumber((raw as { floor?: number }).floor) ||
      coerceNumber((raw as { floorPrice?: number }).floorPrice) ||
      coerceNumber((raw as { floor_price?: number }).floor_price),
    volume24h:
      coerceNumber((raw as { volume24h?: number }).volume24h) ||
      coerceNumber((raw as { volume_24h?: number }).volume_24h) ||
      coerceNumber((raw as { volume24?: number }).volume24),
    volume7d:
      coerceNumber((raw as { volume7d?: number }).volume7d) ||
      coerceNumber((raw as { volume_7d?: number }).volume_7d),
    ticker: (raw as { ticker?: string }).ticker,
    website: (raw as { website?: string }).website,
    twitter: (raw as { twitter?: string }).twitter,
  };
}

function extractCollections(payload: unknown): RawCollection[] {
  if (Array.isArray(payload)) return payload as RawCollection[];
  if (payload && typeof payload === 'object') {
    const maybeCollections = (payload as { collections?: RawCollection[] }).collections;
    if (Array.isArray(maybeCollections)) return maybeCollections;
    const data = (payload as { data?: RawCollection[] }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

export async function fetchMagicEdenCollections(limit = DEFAULT_LIMIT): Promise<CollectionMetadata[]> {
  return withCache(`magiceden:collections:${limit}`, CACHE_TTL_MS, async () => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: '0',
    });

    let json: unknown;
    try {
      const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        headers: getHeaders(),
        next: { revalidate: 0 },
      });
      if (!res.ok) {
        throw new Error(`Magic Eden collections failed: ${res.status} ${res.statusText}`);
      }
      json = await res.json();
    } catch (err) {
      console.error('Magic Eden collections fetch failed, returning empty list:', err);
      return [];
    }

    const raw = extractCollections(json);
    const collections = raw
      .map(normalizeCollection)
      .filter((c): c is CollectionMetadata => Boolean(c));

    return collections;
  });
}

export async function findCollectionByContract(contract: string): Promise<CollectionMetadata | null> {
  const collections = await fetchMagicEdenCollections(200);
  const lower = contract.toLowerCase();
  const found = collections.find((c) => c.contractAddress.toLowerCase() === lower);
  return found || null;
}

export function buildMagicEdenUrl(collection: CollectionMetadata): string | undefined {
  const slugOrAddress = collection.slug || collection.contractAddress;
  if (!slugOrAddress) return undefined;
  return `https://magiceden.io/collections/apechain/${slugOrAddress}`;
}

