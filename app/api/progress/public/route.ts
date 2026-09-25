import { NextRequest, NextResponse } from 'next/server';
import { readProgressByUsername } from '@/lib/progress/read';

/** GET /api/progress/public?username= — no glyph id, wallets, or event metadata. */
export async function GET(req: NextRequest) {
	const username = new URL(req.url).searchParams.get('username')?.trim() || '';
	if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });
	const progress = await readProgressByUsername(username);
	if (!progress) return NextResponse.json({ progress: null });
	return NextResponse.json({
		progress: {
			totalAoa: progress.totalAoa,
			level: progress.level,
			currentLevelAoa: progress.currentLevelAoa,
			nextLevelAoa: progress.nextLevelAoa,
			progressPercent: progress.progressPercent,
			networkRank: progress.networkRank,
			sourceBreakdown: progress.sourceBreakdown,
			recentEvents: progress.recentEvents,
			achievements: progress.achievements,
		},
	});
}
