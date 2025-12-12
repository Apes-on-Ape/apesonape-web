import { CovalentOnchainAdapter } from './covalent';
import { MockOnchainAdapter } from './mock';
import type { OnchainAdapter } from './types';

export function getOnchainProvider(): OnchainAdapter {
  const preferred = (process.env.ONCHAIN_PROVIDER || '').toLowerCase();
  const covalentKey = process.env.COVALENT_KEY;

  if (preferred === 'covalent' && covalentKey) {
    return new CovalentOnchainAdapter(covalentKey);
  }

  if (!preferred && covalentKey) {
    return new CovalentOnchainAdapter(covalentKey);
  }

  // Additional providers can be added here (bitquery/explorer) as needed.
  return new MockOnchainAdapter();
}

export type { OnchainAdapter } from './types';

