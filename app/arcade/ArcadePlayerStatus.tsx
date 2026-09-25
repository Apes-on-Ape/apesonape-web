'use client';

import { useSessionWallets } from '@/app/hooks/useSessionWallets';

/** Connected or guest. Does not print a full wallet address. */
export default function ArcadePlayerStatus() {
  const { signedIn } = useSessionWallets();
  return <p className="arcade-subline">Player // {signedIn ? 'Connected' : 'Guest'}</p>;
}
