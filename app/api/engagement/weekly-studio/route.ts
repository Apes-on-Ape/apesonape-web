import { NextResponse } from 'next/server';
import { creatorCards } from '@/lib/profile/creator-identity';
import { listCreations } from '@/lib/studio/persistence';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type WeeklyCreatorRow = {
	creatorAddress: string;
	count: number;
	label: string;
	profileHref: string | null;
	avatarUrl: string | null;
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
		const glyphByAddress = new Map<string, string>();

		for (const c of result.items) {
			const t = new Date(c.createdAt).getTime();
			if (t < cutoff) continue;
			const addr = (c.creatorAddress || '').toLowerCase();
			if (!addr) continue;
			counts.set(addr, (counts.get(addr) || 0) + 1);
			const glyphId = c.glyphProfile?.glyphId?.trim();
			if (glyphId && !glyphByAddress.has(addr)) glyphByAddress.set(addr, glyphId);
		}

		const cards = await creatorCards([...counts.keys()], glyphByAddress);
		const rows: WeeklyCreatorRow[] = [...counts.entries()]
			.map(([creatorAddress, count]) => {
				const card = cards.get(creatorAddress);
				return {
					creatorAddress,
					count,
					label: card?.label || creatorAddress,
					profileHref: card?.profileHref || null,
					avatarUrl: card?.avatarUrl || null,
				};
			})
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
