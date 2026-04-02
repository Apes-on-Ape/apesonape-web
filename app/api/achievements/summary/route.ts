import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';

type AchievementCatalogRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requirements: unknown;
  reward_xp: number | null;
  is_hidden: boolean | null;
};

/**
 * GET /api/achievements/summary?addresses=0x...&addresses=0x...
 * Full arcade achievement catalog with earned state merged across all given wallets.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const addresses = searchParams
      .getAll('addresses')
      .map((a) => normalizeWallet(a))
      .filter(Boolean);

    if (addresses.length === 0) {
      return NextResponse.json({ error: 'addresses required' }, { status: 400 });
    }

    const supabase = getArcadeSupabase();

    const { data: catalogRaw, error: catErr } = await supabase
      .from('achievements')
      .select('id, name, description, category, icon, requirements, reward_xp, is_hidden')
      .order('category', { ascending: true })
      .order('id', { ascending: true });

    if (catErr) {
      console.error('[achievements/summary] catalog', catErr);
      return NextResponse.json({ error: catErr.message }, { status: 500 });
    }

    const catalog = (catalogRaw ?? []) as AchievementCatalogRow[];

    const { data: uaRaw, error: uaErr } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .in('wallet_address', addresses);

    if (uaErr) {
      console.error('[achievements/summary] user_achievements', uaErr);
      return NextResponse.json({ error: uaErr.message }, { status: 500 });
    }

    const earnedKeys = new Set<string>();
    const earliestUnlock = new Map<string, string>();

    for (const row of uaRaw ?? []) {
      const id = row.achievement_id as string;
      earnedKeys.add(id);
      const t = row.unlocked_at as string | null;
      if (!t) continue;
      const prev = earliestUnlock.get(id);
      if (!prev || t < prev) earliestUnlock.set(id, t);
    }

    const visible = catalog.filter((c) => !c.is_hidden || earnedKeys.has(c.id));

    const achievements = visible.map((c) => {
      const earned = earnedKeys.has(c.id);
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        icon: c.icon,
        requirements: c.requirements,
        reward_xp: c.reward_xp ?? 0,
        is_hidden: !!c.is_hidden,
        earned,
        unlocked_at: earned ? earliestUnlock.get(c.id) ?? null : null,
      };
    });

    const earnedCount = achievements.filter((a) => a.earned).length;

    return NextResponse.json({
      earnedCount,
      total: achievements.length,
      achievements,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
