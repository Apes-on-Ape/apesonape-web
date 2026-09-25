import { NextRequest, NextResponse } from 'next/server';
import { authFailure, requireAuthenticatedApe } from '@/lib/auth/ape';
import { getSupabaseServerClient } from '@/lib/supabase';
import { awardDailyActivity } from '@/lib/progress/hooks';

/**
 * Records a qualifying visit once per UTC day. The Ape comes from the Privy session.
 */
export async function POST(req: NextRequest) {
	try {
		const ape = await requireAuthenticatedApe(req);
		const userId = ape.userId;

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

		try {
			await awardDailyActivity(userId);
		} catch (progressErr) {
			console.error('daily-checkin aoa:', progressErr);
		}

		return NextResponse.json({
			ok: true,
			mosaicQuestCompleted: !!questDone,
			streak: streakJson,
		});
	} catch (e: unknown) {
		const denied = authFailure(e);
		if (denied) return denied;
		const message = e instanceof Error ? e.message : 'Unknown error';
		console.error('daily-checkin:', message);
		return NextResponse.json({ error: 'Could not record this visit.' }, { status: 500 });
	}
}
