import { NextRequest, NextResponse } from 'next/server';
import { analyzeWallet, computeEarnedBadges, mergeAnalyses } from '@/lib/badges/compute';
import { getStoredBadges, setStoredBadges } from '@/lib/badges/db';
import { BADGE_BY_SLUG } from '@/lib/badges/types';

/**
 * GET /api/profile/badges?address=0x...  OR  ?addresses=0x1&addresses=0x2
 * Returns earned badges. Wallet list should come from Glyph (evm + smart + linked).
 * Uses cached badges from DB when available (single address only).
 * ?refresh=1 forces recomputation and updates the cache.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const addressesParam = searchParams.getAll('addresses').filter(Boolean);
    const refresh = searchParams.get('refresh') === '1' || searchParams.get('refresh') === 'true';

    const addresses: string[] = address
      ? [address]
      : addressesParam.map((a) => a.toLowerCase().trim()).filter(Boolean);
    if (addresses.length === 0) {
      return NextResponse.json({ error: 'address or addresses required' }, { status: 400 });
    }

    const toList = (badges: string[]) =>
      badges.map((slug) => ({
        slug,
        title: BADGE_BY_SLUG.get(slug)?.title,
        description: BADGE_BY_SLUG.get(slug)?.description,
        asset: BADGE_BY_SLUG.get(slug)?.asset,
        category: BADGE_BY_SLUG.get(slug)?.category,
      }));

    if (addresses.length > 1) {
      const analyses = await Promise.all(
        addresses.map((addr) => analyzeWallet(addr))
      );
      const merged = mergeAnalyses(analyses);
      const badges = computeEarnedBadges(merged);
      console.log(`[Badges API] Multi-wallet: ${addresses.length} wallets, ${merged.totalApes} total apes, ${badges.length} badges`);
      return NextResponse.json({
        badges: toList(badges),
        totalApes: merged.totalApes,
        analyzedAt: new Date().toISOString(),
      });
    }

    const addr = addresses[0];

    if (refresh) {
      const analysis = await analyzeWallet(addr);
      const badges = computeEarnedBadges(analysis);
      console.log(`[Badges API] Refresh for ${addr}: ${analysis.totalApes} apes, ${badges.length} badges`);
      await setStoredBadges(addr, badges, analysis.totalApes);
      return NextResponse.json({
        badges: toList(badges),
        totalApes: analysis.totalApes,
        analyzedAt: new Date().toISOString(),
      });
    }

    const cached = await getStoredBadges(addr);
    if (cached.badges.length > 0 || cached.analyzedAt) {
      return NextResponse.json({
        badges: toList(cached.badges),
        totalApes: cached.totalApes,
        analyzedAt: cached.analyzedAt,
      });
    }

    const analysis = await analyzeWallet(addr);
    const badges = computeEarnedBadges(analysis);
    console.log(`[Badges API] First-time compute for ${addr}: ${analysis.totalApes} apes, ${badges.length} badges`);
    await setStoredBadges(addr, badges, analysis.totalApes);
    return NextResponse.json({
      badges: toList(badges),
      totalApes: analysis.totalApes,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in /api/profile/badges:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
