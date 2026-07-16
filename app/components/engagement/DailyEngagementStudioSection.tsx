'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Flame, Sparkles } from 'lucide-react';
import TodayOnApeMosaic from './TodayOnApeMosaic';
import WeeklyStudioLeaderboard from './WeeklyStudioLeaderboard';

type EngagementSummary = {
	engagement?: { streak_current?: number; streak_best?: number };
	quests?: Array<{ quest_code: string; title: string; progress: number; target: number; category?: string }>;
};

/**
 * Studio page: mosaic + weekly slice + server check-in for daily visit quest + streak.
 */
export default function DailyEngagementStudioSection({ userId }: { userId: string | null }) {
	const checkinOnce = useRef(false);
	const [summary, setSummary] = useState<EngagementSummary | null>(null);

	useEffect(() => {
		if (!userId || checkinOnce.current) return;
		checkinOnce.current = true;
		void fetch('/api/engagement/daily-checkin', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId }),
		}).catch(() => {});
	}, [userId]);

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		fetch(`/api/profile/summary?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
			.then((r) => r.json())
			.then((json: EngagementSummary) => {
				if (!cancelled) setSummary(json);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [userId]);

	const studioQuests =
		summary?.quests?.filter(
			(q) => q.quest_code === 'daily_studio_mosaic_visit' || q.quest_code === 'daily_studio_publish',
		) ?? [];

	const streak = summary?.engagement?.streak_current ?? 0;
	const best = summary?.engagement?.streak_best ?? 0;

	return (
		<section className="mb-10 rounded-2xl border border-white/10 bg-black/30 p-6 md:p-8 backdrop-blur-sm">
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
				<div>
					<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-hero-blue mb-2">
						<Sparkles className="w-4 h-4" />
						Community mosaic
					</div>
					<h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Today on Ape</h2>
					<p className="text-sm text-muted mt-2 max-w-xl">
						Last 48 hours of studio images — one shared canvas. Tap a tile to open the creation. Visiting
						here counts toward your daily streak when you&apos;re signed in.
					</p>
				</div>
				{userId ? (
					<div className="flex flex-col items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 shrink-0">
						<div className="flex items-center gap-2 text-amber-200 text-sm font-bold">
							<Flame className="w-4 h-4" />
							<span>
								{streak} day streak
								{best > streak ? (
									<span className="text-off-white/50 font-normal"> · best {best}</span>
								) : null}
							</span>
						</div>
						{studioQuests.length > 0 && (
							<ul className="text-xs text-off-white/70 space-y-1">
								{studioQuests.map((q) => (
									<li key={q.quest_code}>
										{q.title}: {q.progress}/{q.target}
									</li>
								))}
							</ul>
						)}
					</div>
				) : (
					<p className="text-xs text-muted shrink-0">
						<Link href="/profile" className="text-hero-blue hover:underline">
							Sign in
						</Link>{' '}
						to track streaks and daily studio quests.
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(200px,280px)] gap-8 items-start">
				<TodayOnApeMosaic variant="full" />
				<WeeklyStudioLeaderboard />
			</div>
		</section>
	);
}
