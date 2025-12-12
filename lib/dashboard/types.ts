export type Period = '7d' | '24h';

export interface CollectionMetadata {
  name: string;
  contractAddress: string;
  image?: string;
  slug?: string;
  floorPrice?: number;
  volume24h?: number;
  volume7d?: number;
  ticker?: string;
  website?: string;
  twitter?: string;
}

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  txCount: number;
  uniqueWallets: number;
  mentions?: number;
}

export interface OnchainMetrics {
  txCount7d: number;
  uniqueWallets7d: number;
  txCount24h: number;
  uniqueWallets24h: number;
  timeseriesDaily7d: TimeseriesPoint[];
  provider: string;
}

export interface SocialMetrics {
  mentions7d: number;
  dailyMentions7d: Array<{ date: string; count: number }>;
  isMock: boolean;
  lastFetched?: string;
}

export interface CommunityRecord {
  collection: CollectionMetadata;
  onchain: OnchainMetrics;
  social: SocialMetrics;
  score: number;
  scoreBreakdown: {
    tx: number;
    wallets: number;
    social: number;
  };
}

export interface DashboardSnapshot {
  period: Period;
  lastUpdated: string;
  totals: {
    txCount: number;
    uniqueWallets: number;
    socialMentions: number;
  };
  topCollection?: CollectionMetadata;
  isSocialMock: boolean;
  items: CommunityRecord[];
}

export interface CommunityDetail {
  lastUpdated: string;
  collection: CollectionMetadata;
  onchain: OnchainMetrics;
  social: SocialMetrics;
  links: {
    magicEden?: string;
    explorer?: string;
    website?: string;
    twitter?: string;
  };
}

