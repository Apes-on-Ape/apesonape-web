import type { SocialMetrics } from '../../types';
import { MockSocialProvider } from './mock';
import { XSocialProvider } from './xCounts';

export interface SocialProvider {
  isMock: boolean;
  getMentions: (name: string, ticker?: string) => Promise<SocialMetrics>;
}

export function getSocialProvider(): SocialProvider {
  const token = process.env.X_BEARER_TOKEN;
  if (token) {
    return new XSocialProvider(token);
  }
  return new MockSocialProvider();
}

