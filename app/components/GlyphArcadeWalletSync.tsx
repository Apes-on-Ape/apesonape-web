'use client';

import { useEffect, useRef } from 'react';
import { ARCADE_WALLET_SYNC_EVENT } from '@/lib/arcade-wallet';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';

/**
 * When the user is signed in with Glyph on the main site, mirror their verified holder
 * wallet into `localStorage.connectedWallet` so arcade static HTML + wallet-guard see it
 * without a separate wallet prompt.
 */
const GLYPH_USER_ID_STORAGE_KEY = 'glyphUserId';
/** Persisted with `glyphUserId` so static arcade games always use Glyph EVM for saves */
const GLYPH_EVM_WALLET_STORAGE_KEY = 'glyphEvmWallet';
const ARCADE_NON_TRUSTED_STORAGE_KEYS = [
  'aoa_reveal_2025_christmas_seen',
  'hasVisitedArcade',
  'consecutiveDays',
  'lastPlayDate',
  'neonRacerHighScores',
  'jsPacman',
  'supabaseUrl',
  'supabaseKey',
];

export default function GlyphArcadeWalletSync() {
  const { signedIn, userId, primaryAddress } = useSessionWallets();
  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    for (const key of ARCADE_NON_TRUSTED_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!signedIn || !primaryAddress) {
      lastSyncedRef.current = '';
      if (!signedIn) {
        try {
          localStorage.removeItem(GLYPH_USER_ID_STORAGE_KEY);
          localStorage.removeItem(GLYPH_EVM_WALLET_STORAGE_KEY);
          localStorage.removeItem('connectedWallet');
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const normalized = primaryAddress.toLowerCase().trim();
    try {
      localStorage.setItem(GLYPH_EVM_WALLET_STORAGE_KEY, normalized);
      localStorage.setItem('connectedWallet', normalized);
      if (userId) {
        localStorage.setItem(GLYPH_USER_ID_STORAGE_KEY, userId);
        window.dispatchEvent(new CustomEvent('aoa-glyph-user-id-sync', { detail: { glyphUserId: userId } }));
      }
      window.dispatchEvent(new CustomEvent('aoa-glyph-arcade-sync', { detail: { glyphUserId: userId, address: normalized } }));
    } catch {
      /* ignore */
    }

    if (lastSyncedRef.current === normalized) return;
    lastSyncedRef.current = normalized;
    window.dispatchEvent(
      new CustomEvent(ARCADE_WALLET_SYNC_EVENT, { detail: { address: normalized } })
    );
  }, [signedIn, userId, primaryAddress]);

  return null;
}
