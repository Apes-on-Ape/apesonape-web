import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

/**
 * POST /api/engagement/daily-checkin
 * Records a qualifying visit (mosaic / studio surface) once per UTC day for quests + streak.
 * Body: { userId: string } — same trust model as other gamify routes (client supplies Privy id).
 */
export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as { userId?: string };
		const userId = String(body?.userId || '').trim();
		if (!userId) {
			return NextResponse.json({ error: 'userId required' }, { status: 400 });
		}

		const supabase = getSupabaseServerClient();

		const { data: questDone, error: qErr } = await supabase.rpc('progress_quest', {
			p_glyph_user_id: userId,
			p_quest_code: 'daily_studio_mosaic_visit',
			p_increment: 1,
		});
		if (qErr) {
			console.error('daily-checkin progress_quest:', qErr);
			return NextResponse.json({ error: qErr.message }, { status: 500 });
		}

		const { data: streakJson, error: sErr } = await supabase.rpc('touch_engagement_streak', {
			p_glyph_user_id: userId,
		});
		if (sErr) {
			console.error('daily-checkin touch_engagement_streak:', sErr);
			return NextResponse.json({ error: sErr.message }, { status: 500 });
		}

		return NextResponse.json({
			ok: true,
			mosaicQuestCompleted: !!questDone,
			streak: streakJson,
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		console.error('daily-checkin:', message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
