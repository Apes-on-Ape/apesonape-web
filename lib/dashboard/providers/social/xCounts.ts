import { withCache } from '../../cache';
import type { SocialMetrics } from '../../types';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function sanitizeName(name: string): string {
  return name.replace(/"/g, '').trim();
}

function buildQuery(name: string, ticker?: string): string {
  const safeName = sanitizeName(name);
  const parts = [`"${safeName}"`, `#${safeName.replace(/\s+/g, '')}`];
  if (ticker) {
    const cleanedTicker = ticker.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanedTicker) {
      parts.push(`$${cleanedTicker}`);
    }
  }
  return parts.join(' OR ');
}

type TweetCountResponse = {
  data?: Array<{ start: string; end: string; tweet_count: number }>;
};

function normalizeSeries(raw: TweetCountResponse['data']): SocialMetrics['dailyMentions7d'] {
  const now = new Date();
  const series: SocialMetrics['dailyMentions7d'] = [];
  const lookup = new Map<string, number>();
  (raw || []).forEach((bucket) => {
    if (bucket?.start && typeof bucket.tweet_count === 'number') {
      lookup.set(bucket.start.slice(0, 10), bucket.tweet_count);
    }
  });

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    series.push({
      date: key,
      count: lookup.get(key) ?? 0,
    });
  }
  return series;
}

export class XSocialProvider {
  isMock = false;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async getMentions(name: string, ticker?: string): Promise<SocialMetrics> {
    const query = buildQuery(name, ticker);
    const cacheKey = `social:x:${query}`;

    return withCache(cacheKey, CACHE_TTL_MS, async () => {
      const params = new URLSearchParams({
        query,
        granularity: 'day',
      });

      const res = await fetch(`https://api.x.com/2/tweets/counts/recent?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`X API error: ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as TweetCountResponse;
      const dailyMentions7d = normalizeSeries(json.data);
      const mentions7d = dailyMentions7d.reduce((acc, p) => acc + p.count, 0);

      return {
        mentions7d,
        dailyMentions7d,
        isMock: false,
        lastFetched: new Date().toISOString(),
      };
    });
  }
}

