'use client';

import { useGlyph } from '@use-glyph/sdk-react';
import { useEffect, useMemo, useRef } from 'react';
import {
  ARCADE_WALLET_SYNC_EVENT,
  getGlyphEvmWalletAddress,
  getGlyphPrimaryAddress,
  type GlyphUserLike
} from '@/lib/arcade-wallet';

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
  const glyph = (useGlyph() as unknown) as { user?: GlyphUserLike };

  /** Prefer explicit Glyph EVM; fallback to Glyph primary so arcade always gets a canonical wallet. */
  const primaryAddress = useMemo(() => {
    const evm = getGlyphEvmWalletAddress(glyph?.user);
    if (evm) return evm;
    return getGlyphPrimaryAddress(glyph?.user);
  }, [glyph?.user]);

  const glyphUserId = useMemo(() => {
    const id = glyph?.user?.id?.trim();
    return id || '';
  }, [glyph?.user?.id]);

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
    if (!glyph?.user) {
      try {
        localStorage.removeItem(GLYPH_USER_ID_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    } else if (glyphUserId) {
      try {
        localStorage.setItem(GLYPH_USER_ID_STORAGE_KEY, glyphUserId);
        window.dispatchEvent(new CustomEvent('aoa-glyph-user-id-sync', { detail: { glyphUserId } }));
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.removeItem(GLYPH_USER_ID_STORAGE_KEY);
        localStorage.removeItem(GLYPH_EVM_WALLET_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [glyph?.user, glyphUserId]);

  /** Keep Glyph EVM in localStorage whenever we have a signed-in Glyph user (holder check still gates `connectedWallet`). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!glyph?.user || !glyphUserId || !primaryAddress) {
      try {
        localStorage.removeItem(GLYPH_EVM_WALLET_STORAGE_KEY);
        localStorage.removeItem('connectedWallet');
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      localStorage.setItem(GLYPH_EVM_WALLET_STORAGE_KEY, primaryAddress.toLowerCase().trim());
      window.dispatchEvent(new CustomEvent('aoa-glyph-arcade-sync', { detail: { glyphUserId, address: primaryAddress } }));
    } catch {
      /* ignore */
    }
  }, [glyph?.user, glyphUserId, primaryAddress]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!primaryAddress) {
      lastSyncedRef.current = '';
      try {
        localStorage.removeItem('connectedWallet');
      } catch {
        /* ignore */
      }
      return;
    }

    const normalized = primaryAddress.toLowerCase().trim();
    if (lastSyncedRef.current === normalized) return;

    localStorage.setItem('connectedWallet', normalized);
    lastSyncedRef.current = normalized;
    window.dispatchEvent(
      new CustomEvent(ARCADE_WALLET_SYNC_EVENT, { detail: { address: normalized } })
    );
  }, [primaryAddress]);

  return null;
}
