import 'server-only';

import { unstable_cache } from 'next/cache';
import { walletColumnIlikeOr } from '@/lib/arcade-glyph-resolve';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';
import { toGatewayUri } from '@/lib/studio/urls';

const CDN_TOKENS_JSON =
  'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/tokens.json';

/** Service role when available; otherwise anon server client (RLS allows reading public profile data). */
function getMainSupabase() {
  return getSupabaseServiceClient() ?? getSupabaseServerClient();
}

/** Cached map of token id → image URI from collection index */
export const getCachedTokenImageMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const res = await fetch(CDN_TOKENS_JSON, { next: { revalidate: 86_400 } });
      if (!res.ok) return {};
      const tokens = (await res.json()) as Array<{ id: number; image: string }>;
      const map: Record<string, string> = {};
      for (const t of tokens) {
        map[String(t.id)] = t.image || '';
      }
      return map;
    } catch {
      return {};
    }
  },
  ['arcade-leaderboard-token-images'],
  { revalidate: 86_400 }
);

function selectedApeImageUrl(raw: unknown): string | null {
  if (raw == null) return null;
  let o: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      o = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof raw === 'object') {
    o = raw as Record<string, unknown>;
  } else {
    return null;
  }
  const img = o.image || o.imageUrl;
  if (typeof img !== 'string' || !img.trim()) return null;
  if (img.includes('placehold.co')) return null;
  return toGatewayUri(img);
}

export type ProfileEnrichment = {
  avatar_url: string | null;
  /** X handle for `/profile/[username]` — no leading @ */
  profile_slug: string | null;
  /** Shown when arcade display name is empty — from X / site profile */
  display_name: string | null;
};

type UserProfileRow = {
  glyph_user_id: string;
  avatar_url: string | null;
  display_name: string | null;
  x_username: string | null;
};

function applyUserProfile(outAddr: ProfileEnrichment, pr: UserProfileRow) {
  /** Leaderboard image: `forever_ape_id` + CDN only — not `user_profiles.avatar_url`. */
  if (pr.display_name?.trim()) {
    outAddr.display_name = pr.display_name.trim();
  } else if (pr.x_username?.trim()) {
    outAddr.display_name = pr.x_username.replace(/^@/, '').trim();
  }
  if (pr.x_username?.trim() && !outAddr.profile_slug) {
    outAddr.profile_slug = pr.x_username.replace(/^@/, '').toLowerCase();
  }
}

/** When arcade `user_profiles.glyph_user_id` is set, prefer site display names over wallet heuristics */
function applyStoredGlyphProfileOverride(outAddr: ProfileEnrichment, pr: UserProfileRow) {
  if (pr.display_name?.trim()) {
    outAddr.display_name = pr.display_name.trim();
  } else if (pr.x_username?.trim()) {
    outAddr.display_name = pr.x_username.replace(/^@/, '').trim();
  }
  if (pr.x_username?.trim()) {
    outAddr.profile_slug = pr.x_username.replace(/^@/, '').toLowerCase();
  }
}

/**
 * Leaderboard portrait: `user_profiles.forever_ape_id` + collection CDN (`tokens.json`), then `selected_ape` JSON.
 * Display names / slugs: studio creations, main `user_profiles` by glyph / x_username (no legacy `username` column).
 */
export async function enrichArcadeLeaderboardWallets(wallets: string[]): Promise<Record<string, ProfileEnrichment>> {
  const out: Record<string, ProfileEnrichment> = {};
  const normList = [...new Set(wallets.map((w) => normalizeWallet(w)))].filter(Boolean);
  for (const w of normList) {
    out[w] = { avatar_url: null, profile_slug: null, display_name: null };
  }
  if (normList.length === 0) return out;

  const arcade = getArcadeSupabase();
  const { data: arcadeUsers } = await arcade
    .from('user_profiles')
    .select(
      'wallet_address, selected_ape, glyph_user_id, display_name, x_username, forever_ape_id'
    )
    .or(walletColumnIlikeOr('wallet_address', normList));

  const tokenMap = await getCachedTokenImageMap();
  const mainDb = getMainSupabase();

  /** `forever_ape_id` → collection CDN image (primary leaderboard portrait). */
  for (const u of arcadeUsers ?? []) {
    const row = u as {
      wallet_address?: string | null;
      forever_ape_id?: number | null;
    };
    const addr = normalizeWallet(String(row.wallet_address ?? ''));
    const id = row.forever_ape_id;
    if (!addr || !out[addr] || id == null) continue;
    const raw = tokenMap[String(id)];
    if (raw) out[addr].avatar_url = toGatewayUri(raw);
  }

  /** Same-row display fields + map by glyph for `applyStoredGlyphProfileOverride` at end. */
  const arcadeGlyphProfileByGid = new Map<string, UserProfileRow>();
  for (const u of arcadeUsers ?? []) {
    const row = u as {
      wallet_address?: string | null;
      glyph_user_id?: string | null;
      display_name?: string | null;
      x_username?: string | null;
    };
    const addr = normalizeWallet(String(row.wallet_address ?? ''));
    if (addr && out[addr]) {
      applyUserProfile(out[addr], {
        glyph_user_id: (row.glyph_user_id && String(row.glyph_user_id).trim()) || '',
        avatar_url: null,
        display_name: (row.display_name || '').trim() || null,
        x_username: (row.x_username || '').trim() || null,
      });
    }
    const gid = String(row.glyph_user_id ?? '').trim();
    if (gid) {
      arcadeGlyphProfileByGid.set(gid, {
        glyph_user_id: gid,
        avatar_url: null,
        display_name: (row.display_name || '').trim() || null,
        x_username: (row.x_username || '').trim() || null,
      });
    }
  }

  if (mainDb) {
    const { data: creations } = await mainDb
      .from('studio_creations')
      .select('creator_address, glyph_profile, created_at')
      .or(walletColumnIlikeOr('creator_address', normList))
      .order('created_at', { ascending: false });

    for (const row of creations ?? []) {
      const addr = normalizeWallet(String(row.creator_address || ''));
      if (!out[addr] || out[addr].profile_slug) continue;
      const gp = row.glyph_profile as { xHandle?: string } | null;
      const h = gp?.xHandle?.trim();
      if (h) {
        const slug = h.replace(/^@/, '').toLowerCase();
        out[addr].profile_slug = slug;
        out[addr].display_name = slug;
      }
    }

    /** Collect every glyph_user_id from creations (newest rows first per wallet) for profile lookup */
    const rowsByWallet = new Map<string, Array<{ glyph_profile: unknown; created_at: string }>>();
    for (const row of creations ?? []) {
      const addr = normalizeWallet(String(row.creator_address || ''));
      if (!out[addr]) continue;
      if (!rowsByWallet.has(addr)) rowsByWallet.set(addr, []);
      rowsByWallet.get(addr)!.push(row as { glyph_profile: unknown; created_at: string });
    }
    for (const rows of rowsByWallet.values()) {
      rows.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
    }

    const allGlyphIds = new Set<string>();
    const orderedGlyphIdsByWallet = new Map<string, string[]>();
    for (const w of normList) {
      const rows = rowsByWallet.get(w);
      if (!rows?.length) continue;
      const ordered: string[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        const gid = (row.glyph_profile as { glyphId?: string } | null)?.glyphId?.trim();
        if (gid && !seen.has(gid)) {
          seen.add(gid);
          ordered.push(gid);
          allGlyphIds.add(gid);
        }
      }
      if (ordered.length) orderedGlyphIdsByWallet.set(w, ordered);
    }

    if (allGlyphIds.size > 0) {
      const { data: profsByGlyph } = await mainDb
        .from('user_profiles')
        .select('glyph_user_id, display_name, x_username')
        .in('glyph_user_id', [...allGlyphIds]);

      const byGid = new Map<string, UserProfileRow>();
      for (const p of profsByGlyph ?? []) {
        const gid = (p.glyph_user_id || '').trim();
        if (!gid) continue;
        byGid.set(gid, {
          glyph_user_id: gid,
          avatar_url: null,
          display_name: (p.display_name || '').trim() || null,
          x_username: (p.x_username || '').trim() || null,
        });
      }

      for (const w of normList) {
        const ordered = orderedGlyphIdsByWallet.get(w);
        if (!ordered?.length) continue;
        for (const gid of ordered) {
          const pr = byGid.get(gid);
          if (!pr) continue;
          applyUserProfile(out[w], pr);
          break;
        }
      }
    }
  }

  for (const u of arcadeUsers ?? []) {
    const addr = normalizeWallet(u.wallet_address);
    if (!out[addr]) continue;
    if (!out[addr].avatar_url) {
      const fromApe = selectedApeImageUrl(u.selected_ape);
      if (fromApe) out[addr].avatar_url = fromApe;
    }
    const rowU = u as { x_username?: string | null; display_name?: string | null };
    if (!out[addr].profile_slug) {
      const un = (rowU.x_username || '').trim().replace(/^@/, '');
      if (/^[a-zA-Z0-9_]{1,15}$/.test(un)) {
        out[addr].profile_slug = un.toLowerCase();
      }
    }
    const club =
      (rowU.display_name || '').trim() ||
      (rowU.x_username || '').trim().replace(/^@/, '');
    if (club && !out[addr].display_name) {
      out[addr].display_name = club;
    }
  }

  /** Match site profile by x_username — case-insensitive (handles DB vs arcade casing) */
  if (mainDb) {
    const slugs = [...new Set(normList.map((w) => out[w].profile_slug).filter(Boolean))] as string[];
    if (slugs.length > 0) {
      const orFilter = slugs.map((s) => `x_username.ilike.${s.replace(/[%*,]/g, '')}`).join(',');
      const { data: profs } = await mainDb
        .from('user_profiles')
        .select('x_username, display_name')
        .or(orFilter);

      const byLower = new Map<string, { label: string }>();
      for (const p of profs ?? []) {
        const xu = (p.x_username || '').trim();
        if (!xu) continue;
        const label = ((p.display_name || xu) as string).trim();
        byLower.set(xu.toLowerCase(), { label });
      }

      for (const w of normList) {
        const slug = out[w].profile_slug;
        if (!slug) continue;
        const pr = byLower.get(slug.toLowerCase());
        if (!pr) continue;
        if (pr.label) out[w].display_name = pr.label;
      }
    }
  }

  /**
   * Direct match: arcade `x_username` as X handle → `user_profiles` (even if slug step missed).
   */
  if (mainDb) {
    const handlePairs: { addr: string; h: string }[] = [];
    for (const u of arcadeUsers ?? []) {
      const addr = normalizeWallet(u.wallet_address);
      const rowU = u as { x_username?: string | null };
      const raw = (rowU.x_username || '').trim().replace(/^@/, '');
      if (!raw || !/^[a-zA-Z0-9_]{1,15}$/.test(raw)) continue;
      if (!out[addr]) continue;
      handlePairs.push({ addr, h: raw.toLowerCase() });
    }
    const unique = [...new Set(handlePairs.map((p) => p.h))];
    if (unique.length > 0) {
      const orFilter = unique.map((s) => `x_username.ilike.${s.replace(/[%*,]/g, '')}`).join(',');
      const { data: directProfs } = await mainDb
        .from('user_profiles')
        .select('x_username, display_name')
        .or(orFilter);

      const byLower = new Map<string, { label: string }>();
      for (const p of directProfs ?? []) {
        const xu = (p.x_username || '').trim();
        if (!xu) continue;
        const label = ((p.display_name || xu) as string).trim();
        byLower.set(xu.toLowerCase(), { label });
      }

      for (const { addr, h } of handlePairs) {
        const pr = byLower.get(h);
        if (!pr) continue;
        if (pr.label) out[addr].display_name = pr.label;
        if (!out[addr].profile_slug) {
          out[addr].profile_slug = h;
        }
      }
    }
  }

  for (const u of arcadeUsers ?? []) {
    const addr = normalizeWallet(u.wallet_address);
    if (!out[addr]) continue;
    const gid = (String(u.glyph_user_id ?? '').trim());
    if (!gid) continue;
    const pr = arcadeGlyphProfileByGid.get(gid);
    if (!pr) continue;
    applyStoredGlyphProfileOverride(out[addr], pr);
  }

  return out;
}
