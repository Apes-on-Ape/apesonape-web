import { NextResponse } from 'next/server';
import { listCreations } from '@/lib/studio/persistence';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type WeeklyCreatorRow = {
	creatorAddress: string;
	count: number;
	label: string;
};

/**
 * GET /api/engagement/weekly-studio
 * Top studio visual creators in the last 7 days (by creation count), capped for a small leaderboard.
 */
export async function GET() {
	try {
		const result = await listCreations({ limit: 50, type: 'visual' });
		const cutoff = Date.now() - WEEK_MS;
		const counts = new Map<string, number>();

		for (const c of result.items) {
			const t = new Date(c.createdAt).getTime();
			if (t < cutoff) continue;
			const addr = (c.creatorAddress || '').toLowerCase();
			if (!addr) continue;
			counts.set(addr, (counts.get(addr) || 0) + 1);
		}

		const rows: WeeklyCreatorRow[] = [...counts.entries()]
			.map(([creatorAddress, count]) => ({
				creatorAddress,
				count,
				label: `${creatorAddress.slice(0, 6)}…${creatorAddress.slice(-4)}`,
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 8);

		return NextResponse.json({ items: rows, windowDays: 7 }, {
			headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=60' },
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		console.error('weekly-studio:', message);
		return NextResponse.json({ items: [] as WeeklyCreatorRow[], error: message, windowDays: 7 });
	}
}
