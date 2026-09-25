import { NextRequest, NextResponse } from 'next/server';
import { readProgress } from '@/lib/progress/read';

/** GET /api/progress/me?userId= — signed-in profile. Same identity trust as /api/profile/summary. */
export async function GET(req: NextRequest) {
	const userId = new URL(req.url).searchParams.get('userId')?.trim() || '';
	if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
	const progress = await readProgress(userId);
	if (!progress) return NextResponse.json({ error: 'Progress is not available' }, { status: 503 });
	return NextResponse.json(progress);
}
