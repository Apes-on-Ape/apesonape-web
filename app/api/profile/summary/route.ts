import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/profile/summary
 * Fetches user profile, bananas, achievements, and active quests
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 1. Get user profile (bananas) — maybeSingle: row may not exist yet for new Glyph users
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(
        'bananas, avatar_url, display_name, x_username, engagement_streak_current, engagement_streak_best, engagement_last_active_date',
      )
      .eq('glyph_user_id', userId)
      .maybeSingle();

    const bananas = profile?.bananas || 0;

    // 2. Get user achievements (earned achievements with catalog details)
    const { data: userAchievements } = await supabase
      .from('gamify_user_achievements')
      .select(`
        achievement_code,
        earned_at,
        gamify_achievements_catalog (
          title,
          description,
          badge_icon,
          bananas_reward,
          category
        )
      `)
      .eq('glyph_user_id', userId)
      .order('earned_at', { ascending: false });

    // 3. Get all achievements catalog to show not-yet-earned
    const { data: allAchievements } = await supabase
      .from('gamify_achievements_catalog')
      .select('achievement_code, title, description, badge_icon, bananas_reward, category')
      .order('category', { ascending: true });

    const earnedCodes = new Set((userAchievements || []).map(a => a.achievement_code));
    
    const achievements = (allAchievements || []).map(ach => {
      const earned = earnedCodes.has(ach.achievement_code);
      const userAch = (userAchievements || []).find(ua => ua.achievement_code === ach.achievement_code);
      return {
        achievement_code: ach.achievement_code,
        title: ach.title,
        description: ach.description,
        badge_icon: ach.badge_icon,
        bananas_reward: ach.bananas_reward,
        category: ach.category,
        earned,
        earned_at: earned && userAch ? userAch.earned_at : null
      };
    });

    // 4. Get active quests (not completed)
    const { data: activeQuests } = await supabase
      .from('gamify_user_quests')
      .select(`
        quest_code,
        progress,
        target,
        status,
        gamify_quests_catalog (
          title,
          description,
          quest_icon,
          bananas_reward,
          category
        )
      `)
      .eq('glyph_user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // 5. Get all quests catalog for not-yet-started quests
    const { data: allQuests } = await supabase
      .from('gamify_quests_catalog')
      .select('quest_code, title, description, quest_icon, bananas_reward, category, target_count')
      .order('category', { ascending: true });

    const todayUtc = new Date().toISOString().slice(0, 10);

    const { data: userQuestRows } = await supabase
      .from('gamify_user_quests')
      .select('quest_code, status, progress, last_daily_period_utc')
      .eq('glyph_user_id', userId);

    const catalogByCode = new Map((allQuests || []).map((q) => [q.quest_code, q]));

    const completedQuestCodes = new Set(
      (userQuestRows || [])
        .filter((r) => {
          if (r.status !== 'completed') return false;
          const meta = catalogByCode.get(r.quest_code);
          if (meta?.category === 'daily' && r.last_daily_period_utc && r.last_daily_period_utc < todayUtc) {
            return false;
          }
          return true;
        })
        .map((r) => r.quest_code),
    );

    const userQuestByCode = new Map((userQuestRows || []).map((r) => [r.quest_code, r]));

    const quests = (allQuests || [])
      .filter((q) => !completedQuestCodes.has(q.quest_code))
      .map((quest) => {
        const userQuest = (activeQuests || []).find((uq) => uq.quest_code === quest.quest_code);
        const row = userQuestByCode.get(quest.quest_code);
        let progress = userQuest?.progress ?? row?.progress ?? 0;
        let status: string = userQuest?.status || row?.status || 'not_started';
        if (
          quest.category === 'daily' &&
          row?.status === 'completed' &&
          row.last_daily_period_utc &&
          row.last_daily_period_utc < todayUtc
        ) {
          progress = 0;
          status = 'active';
        }
        return {
          quest_code: quest.quest_code,
          title: quest.title,
          description: quest.description,
          quest_icon: quest.quest_icon,
          bananas_reward: quest.bananas_reward,
          category: quest.category,
          progress,
          target: quest.target_count,
          status,
        };
      });

    return NextResponse.json({
      bananas,
      achievements,
      quests,
      profile: {
        avatar_url: profile?.avatar_url,
        display_name: profile?.display_name,
        x_username: profile?.x_username,
      },
      engagement: {
        streak_current: profile?.engagement_streak_current ?? 0,
        streak_best: profile?.engagement_streak_best ?? 0,
        last_active_date: profile?.engagement_last_active_date ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching profile summary:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
