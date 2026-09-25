import { NextRequest, NextResponse } from 'next/server';
import { getArcadeSupabase, normalizeWallet } from '@/lib/arcade-db';
import { arcadeAchievementAoa, ecosystemCategory } from '@/lib/progress/rewards';

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
    if (!catalog.some((row) => row.id === 'first_studio_transmission')) {
      catalog.push(
        {
          id: 'first_studio_transmission',
          name: 'First transmission',
          description: 'Publish a studio piece',
          category: 'studio',
          icon: '✦',
          requirements: null,
          reward_xp: 750,
          is_hidden: false,
        },
        {
          id: 'ten_transmissions',
          name: 'Ten transmissions',
          description: 'Publish ten studio pieces',
          category: 'studio',
          icon: '✦',
          requirements: null,
          reward_xp: 3750,
          is_hidden: false,
        },
      );
    }

    const { data: profileRows } = await supabase
      .from('user_profiles')
      .select('glyph_user_id')
      .in('wallet_address', addresses);
    const userIds = (profileRows ?? [])
      .map((row) => String(row.glyph_user_id ?? '').trim())
      .filter(Boolean);

    const { data: uaRaw, error: uaErr } = userIds.length
      ? await supabase
          .from('aoa_achievement_unlocks')
          .select('achievement_id, unlocked_at')
          .in('user_id', userIds)
      : { data: [], error: null };

    if (uaErr) {
      console.error('[achievements/summary] aoa_achievement_unlocks', uaErr.message);
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
        aoa_reward: arcadeAchievementAoa(c.reward_xp ?? 0),
        ecosystem_category: ecosystemCategory(c.category),
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
