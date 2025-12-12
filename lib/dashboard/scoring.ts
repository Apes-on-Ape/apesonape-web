import type { CommunityRecord, Period } from './types';

export const DEFAULT_WEIGHTS = {
  tx: 0.5,
  wallets: 0.3,
  social: 0.2,
};

function normalize(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.log(1 + value) / Math.log(1 + maxValue);
}

function pickOnchain(value: CommunityRecord, period: Period, field: 'tx' | 'wallets'): number {
  const { onchain } = value;
  if (period === '24h') {
    return field === 'tx' ? onchain.txCount24h : onchain.uniqueWallets24h;
  }
  return field === 'tx' ? onchain.txCount7d : onchain.uniqueWallets7d;
}

export function applyCompositeScores(
  items: CommunityRecord[],
  period: Period,
  weights = DEFAULT_WEIGHTS
): CommunityRecord[] {
  const maxTx = Math.max(...items.map((i) => pickOnchain(i, period, 'tx')), 0);
  const maxWallets = Math.max(...items.map((i) => pickOnchain(i, period, 'wallets')), 0);
  const maxSocial = Math.max(...items.map((i) => i.social.mentions7d), 0);

  return items.map((item) => {
    const txNorm = normalize(pickOnchain(item, period, 'tx'), maxTx);
    const walletNorm = normalize(pickOnchain(item, period, 'wallets'), maxWallets);
    const socialNorm = normalize(item.social.mentions7d, maxSocial);
    const score =
      txNorm * weights.tx +
      walletNorm * weights.wallets +
      socialNorm * weights.social;
    return {
      ...item,
      score,
      scoreBreakdown: {
        tx: txNorm * weights.tx,
        wallets: walletNorm * weights.wallets,
        social: socialNorm * weights.social,
      },
    };
  });
}

