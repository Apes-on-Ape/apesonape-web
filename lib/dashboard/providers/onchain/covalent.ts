import type { OnchainMetrics } from '../../types';
import type { OnchainAdapter } from './types';

const DEFAULT_CHAIN_ID = process.env.NEXT_PUBLIC_APECHAIN_CHAIN_ID || '33139';
const PAGE_SIZE = 200;
const MAX_PAGES = 3;

type CovalentTx = {
  block_signed_at: string;
  from_address: string;
  to_address: string;
  successful?: boolean;
};

function iso(date: Date): string {
  return date.toISOString();
}

function ensureDays(timeseries: Record<string, { txCount: number; uniqueWallets: Set<string> }>): Array<{
  date: string;
  txCount: number;
  uniqueWallets: number;
}> {
  const now = new Date();
  const points: Array<{ date: string; txCount: number; uniqueWallets: number }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = timeseries[key] || { txCount: 0, uniqueWallets: new Set<string>() };
    points.push({
      date: key,
      txCount: entry.txCount,
      uniqueWallets: entry.uniqueWallets.size,
    });
  }
  return points;
}

export class CovalentOnchainAdapter implements OnchainAdapter {
  name = 'covalent';
  private chainId: string;
  private apiKey: string;

  constructor(apiKey: string, chainId: string = DEFAULT_CHAIN_ID) {
    this.apiKey = apiKey;
    this.chainId = chainId;
  }

  async getMetrics(contractAddress: string): Promise<OnchainMetrics> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);

    const txs = await this.fetchTransactions(contractAddress, sevenDaysAgo, now);

    const timeseries: Record<string, { txCount: number; uniqueWallets: Set<string> }> = {};
    let txCount24h = 0;
    let uniqueWallets24h = 0;
    const unique7d = new Set<string>();
    const unique24h = new Set<string>();

    for (const tx of txs) {
      const ts = new Date(tx.block_signed_at);
      const key = ts.toISOString().slice(0, 10);
      const sender = tx.from_address?.toLowerCase();
      if (!timeseries[key]) {
        timeseries[key] = { txCount: 0, uniqueWallets: new Set<string>() };
      }
      timeseries[key].txCount += 1;
      if (sender) {
        timeseries[key].uniqueWallets.add(sender);
        unique7d.add(sender);
        if (ts >= oneDayAgo) {
          unique24h.add(sender);
        }
      }
      if (ts >= oneDayAgo) {
        txCount24h += 1;
      }
    }

    const series = ensureDays(timeseries);
    const txCount7d = series.reduce((acc, p) => acc + p.txCount, 0);
    const uniqueWallets7d = Array.from(unique7d).length;
    uniqueWallets24h = unique24h.size;

    return {
      txCount7d,
      uniqueWallets7d,
      txCount24h,
      uniqueWallets24h,
      timeseriesDaily7d: series,
      provider: this.name,
    };
  }

  private async fetchTransactions(
    contractAddress: string,
    from: Date,
    to: Date
  ): Promise<CovalentTx[]> {
    const results: CovalentTx[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && page < MAX_PAGES) {
      const params = new URLSearchParams({
        'page-size': String(PAGE_SIZE),
        'page-number': String(page),
        'no-logs': 'true',
        format: 'JSON',
        from: iso(from),
        to: iso(to),
        key: this.apiKey,
      });

      const url = `https://api.covalenthq.com/v1/${this.chainId}/address/${contractAddress}/transactions_v3/?${params.toString()}`;
      try {
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (!res.ok) break;
        const json = (await res.json()) as {
          data?: { items?: CovalentTx[]; pagination?: { has_more?: boolean } };
        };
        const items = json?.data?.items ?? [];
        results.push(...items);
        hasMore = Boolean(json?.data?.pagination?.has_more);
      } catch (err) {
        console.error('Covalent fetch error', err);
        break;
      }
      page += 1;
    }

    return results;
  }
}

