import type { OnchainMetrics } from '../../types';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildTimeseries(seed: number): OnchainMetrics['timeseriesDaily7d'] {
  const now = new Date();
  const points = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const variance = (seed % 7) * 3 + i;
    points.push({
      date: day.toISOString().slice(0, 10),
      txCount: Math.max(5, (seed % 150) + variance * 4),
      uniqueWallets: Math.max(3, (seed % 90) + variance * 2),
    });
  }
  return points;
}

export class MockOnchainAdapter {
  name = 'mock';

  async getMetrics(contractAddress: string): Promise<OnchainMetrics> {
    const seed = hashString(contractAddress);
    const timeseries = buildTimeseries(seed);
    const txCount7d = timeseries.reduce((acc, p) => acc + p.txCount, 0);
    const uniqueWallets7d = timeseries.reduce((acc, p) => acc + p.uniqueWallets, 0);
    const txCount24h = timeseries[timeseries.length - 1]?.txCount ?? 0;
    const uniqueWallets24h = timeseries[timeseries.length - 1]?.uniqueWallets ?? 0;

    return {
      txCount7d,
      uniqueWallets7d,
      txCount24h,
      uniqueWallets24h,
      timeseriesDaily7d: timeseries,
      provider: this.name,
    };
  }
}

