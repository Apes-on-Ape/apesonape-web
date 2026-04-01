/**
 * Arcade uses `localStorage.connectedWallet` for static HTML games + wallet-guard.js.
 * Glyph session wallet must be verified as an Ape holder before arcade access.
 */

export type VerifyArcadeWalletResult =
  | { ok: true }
  | { ok: false; reason: 'no_apes' | 'network' };

export async function verifyArcadeWallet(address: string): Promise<VerifyArcadeWalletResult> {
  const normalized = address.toLowerCase().trim();
  try {
    const res = await fetch(`/api/portfolio?${new URLSearchParams({ address: normalized })}`, {
      method: 'GET',
      credentials: 'same-origin',
    });
    if (!res.ok) return { ok: false, reason: 'network' };
    const data = (await res.json()) as { total?: number; tokenIds?: string[] };
    const total =
      typeof data.total === 'number' ? data.total : Array.isArray(data.tokenIds) ? data.tokenIds.length : 0;
    if (total <= 0) return { ok: false, reason: 'no_apes' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export type GlyphUserLike = {
  /** Glyph account id — matches `user_profiles.glyph_user_id` */
  id?: string;
  evmWallet?: string;
  smartWallet?: string;
  linkedWallets?: Array<{ address?: string }>;
};

/** Primary EVM address for arcade — matches profile page ordering */
export function getGlyphPrimaryAddress(user: GlyphUserLike | undefined | null): string {
  if (!user) return '';
  const primary = (user.evmWallet ?? user.smartWallet ?? '').trim();
  if (primary) return primary;
  const linked = user.linkedWallets?.map((w) => (w?.address ?? '').trim()).filter(Boolean) ?? [];
  return linked[0] ?? '';
}

/**
 * Glyph-linked EVM wallet only (matches `/api/portfolio` + `studio_forever_ape.address`).
 * Do not use smart wallet or linked wallets — those break parity with profile Forever Ape + arcade DB.
 */
export function getGlyphEvmWalletAddress(user: GlyphUserLike | undefined | null): string {
  if (!user) return '';
  return (user.evmWallet ?? '').trim();
}

export const ARCADE_WALLET_SYNC_EVENT = 'aoa-arcade-wallet-sync';
