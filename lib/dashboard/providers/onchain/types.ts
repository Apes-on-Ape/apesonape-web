import type { OnchainMetrics } from '../../types';

export interface OnchainAdapter {
  name: string;
  getMetrics: (contractAddress: string) => Promise<OnchainMetrics>;
}

