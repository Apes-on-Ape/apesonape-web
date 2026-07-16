'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Sparkles } from 'lucide-react';
import TodayOnApeMosaic from './TodayOnApeMosaic';
import WeeklyStudioLeaderboard from './WeeklyStudioLeaderboard';

export default function EngagementHomeSection() {
	const { user } = (usePrivy() as unknown) as { user?: { id?: string } };
	const userId = user?.id?.trim() || null;
	const rootRef = useRef<HTMLDivElement>(null);
	const checkinSent = useRef(false);

	useEffect(() => {
		if (!userId) return;
		const el = rootRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting || checkinSent.current) return;
				checkinSent.current = true;
				void fetch('/api/engagement/daily-checkin', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId }),
				});
			},
			{ threshold: 0.2 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [userId]);

	return (
		<section ref={rootRef} className="py-16 md:py-20 border-y border-white/8 bg-white/[0.02]">
			<div className="container-premium">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
					<div>
						<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-hero-blue mb-3">
							<Sparkles className="w-4 h-4" />
							Live from the studio
						</div>
						<h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
							Today on <span className="text-hero-blue">Ape</span>
						</h2>
						<p className="text-white/50 mt-3 max-w-xl text-base">
							A 48-hour mosaic of community AI images. Scroll in while signed in to log a daily visit and
							keep your streak warm — then{' '}
							<Link href="/studio" className="text-hero-blue hover:underline font-semibold">
								open the studio
							</Link>{' '}
							to publish your own tile.
						</p>
					</div>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">
					<div className="rounded-2xl border border-white/10 bg-black/35 p-4 md:p-6">
						<TodayOnApeMosaic variant="compact" />
					</div>
					<div className="rounded-2xl border border-white/10 bg-black/35 p-4 md:p-5">
						<WeeklyStudioLeaderboard compact />
					</div>
				</div>
			</div>
		</section>
	);
}
