import { fetchMagicEdenCollections, findCollectionByContract, buildMagicEdenUrl } from './providers/magicEden';
import { getOnchainProvider } from './providers/onchain';
import { MockOnchainAdapter } from './providers/onchain/mock';
import { getSocialProvider } from './providers/social';
import { MockSocialProvider } from './providers/social/mock';
import { applyCompositeScores, DEFAULT_WEIGHTS } from './scoring';
import { withCache } from './cache';
import type {
  CommunityDetail,
  CommunityRecord,
  DashboardSnapshot,
  Period,
  CollectionMetadata,
} from './types';

const LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const PER_CONTRACT_CACHE_TTL_MS = 5 * 60 * 1000;
const SOCIAL_LIMIT = 50;
const CONCURRENCY = 6;

function pickMetric(record: CommunityRecord, period: Period, field: 'tx' | 'wallets'): number {
  if (period === '24h') {
    return field === 'tx' ? record.onchain.txCount24h : record.onchain.uniqueWallets24h;
  }
  return field === 'tx' ? record.onchain.txCount7d : record.onchain.uniqueWallets7d;
}

async function asyncPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (err) {
        console.error('dashboard worker error', err);
      }
    }
  });
  await Promise.all(runners);
  return results;
}

export async function getDashboardCommunities(params?: {
  period?: Period;
  limit?: number;
}): Promise<DashboardSnapshot> {
  const period = params?.period ?? '7d';
  const limit = params?.limit ?? 100;
  const cacheKey = `dashboard:list:${period}:${limit}`;

  return withCache(cacheKey, LIST_CACHE_TTL_MS, async () => {
    const collections = await fetchMagicEdenCollections(limit);
    const onchainProvider = getOnchainProvider();
    const socialProvider = getSocialProvider();
    const mockSocial = socialProvider.isMock ? socialProvider : new MockSocialProvider();
    const mockOnchain = new MockOnchainAdapter();

    const onchainResults = await asyncPool(collections, CONCURRENCY, async (collection) => {
      try {
        return await onchainProvider.getMetrics(collection.contractAddress);
      } catch (err) {
        console.error('Onchain provider failed, using mock', err);
        return mockOnchain.getMetrics(collection.contractAddress);
      }
    });

    const baseRecords: CommunityRecord[] = collections.map((collection, idx) => ({
      collection,
      onchain: onchainResults[idx],
      social: {
        mentions7d: 0,
        dailyMentions7d: [],
        isMock: socialProvider.isMock,
      },
      score: 0,
      scoreBreakdown: { tx: 0, wallets: 0, social: 0 },
    }));

    const socialFetchLimit = socialProvider.isMock
      ? baseRecords.length
      : Math.min(baseRecords.length, SOCIAL_LIMIT);

    const rankedByTx = [...baseRecords]
      .map((record, index) => ({ index, tx: pickMetric(record, period, 'tx') }))
      .sort((a, b) => b.tx - a.tx);

    const topIndexes = rankedByTx.slice(0, socialFetchLimit).map((r) => r.index);

    await asyncPool(topIndexes, 3, async (recordIndex) => {
      const target = baseRecords[recordIndex];
      try {
        target.social = await socialProvider.getMentions(
          target.collection.name,
          target.collection.ticker
        );
      } catch (err) {
        console.error('Social provider failed, using mock', err);
        target.social = await mockSocial.getMentions(target.collection.name);
      }
    });

    // Fill remaining with mock so UI stays stable
    await asyncPool(
      baseRecords
        .map((_, index) => index)
        .filter((i) => !topIndexes.includes(i)),
      4,
      async (index) => {
        baseRecords[index].social = await mockSocial.getMentions(baseRecords[index].collection.name);
      }
    );

    const scored = applyCompositeScores(baseRecords, period, DEFAULT_WEIGHTS).sort(
      (a, b) => b.score - a.score
    );

    const totals = scored.reduce(
      (acc, record) => {
        acc.txCount += pickMetric(record, period, 'tx');
        acc.uniqueWallets += pickMetric(record, period, 'wallets');
        acc.socialMentions += record.social.mentions7d;
        return acc;
      },
      { txCount: 0, uniqueWallets: 0, socialMentions: 0 }
    );

    const topCollection = scored[0]?.collection;
    const snapshot: DashboardSnapshot = {
      period,
      lastUpdated: new Date().toISOString(),
      totals,
      topCollection,
      isSocialMock: socialProvider.isMock,
      items: scored,
    };

    return snapshot;
  });
}

export async function getCommunityDetail(contractAddress: string): Promise<CommunityDetail> {
  const cacheKey = `dashboard:detail:${contractAddress.toLowerCase()}`;
  return withCache(cacheKey, PER_CONTRACT_CACHE_TTL_MS, async () => {
    const collection =
      (await findCollectionByContract(contractAddress)) || ({
        name: `Collection ${contractAddress.slice(0, 6)}`,
        contractAddress,
        image: '/apechain.png',
      } as CollectionMetadata);

    const onchainProvider = getOnchainProvider();
    const socialProvider = getSocialProvider();
    const mockOnchain = new MockOnchainAdapter();
    const mockSocial = socialProvider.isMock ? socialProvider : new MockSocialProvider();

    const [onchain, social] = await Promise.all([
      (async () => {
        try {
          return await onchainProvider.getMetrics(contractAddress);
        } catch (err) {
          console.error('Onchain detail failed, using mock', err);
          return mockOnchain.getMetrics(contractAddress);
        }
      })(),
      (async () => {
        try {
          return await socialProvider.getMentions(collection.name, collection.ticker);
        } catch (err) {
          console.error('Social detail failed, using mock', err);
          return mockSocial.getMentions(collection.name);
        }
      })(),
    ]);

    const links = {
      magicEden: buildMagicEdenUrl(collection),
      explorer: `https://apescan.io/address/${contractAddress}`,
      website: collection.website,
      twitter: collection.twitter,
    };

    return {
      lastUpdated: new Date().toISOString(),
      collection,
      onchain,
      social,
      links,
    };
  });
}

