import type { SocialMetrics } from '../../types';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildSeries(base: number): SocialMetrics['dailyMentions7d'] {
  const now = new Date();
  const series: SocialMetrics['dailyMentions7d'] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const variance = (base % 11) - 5;
    const count = Math.max(2, (base % 60) + variance + i * 2);
    series.push({
      date: day.toISOString().slice(0, 10),
      count,
    });
  }
  return series;
}

export class MockSocialProvider {
  isMock = true;

  async getMentions(name: string, _ticker?: string): Promise<SocialMetrics> {
    const seed = hashString(name);
    const dailyMentions7d = buildSeries(seed);
    const mentions7d = dailyMentions7d.reduce((acc, p) => acc + p.count, 0);
    return {
      mentions7d,
      dailyMentions7d,
      isMock: true,
      lastFetched: new Date().toISOString(),
    };
  }
}

