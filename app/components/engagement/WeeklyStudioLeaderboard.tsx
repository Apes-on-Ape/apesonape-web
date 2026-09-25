'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Trophy } from 'lucide-react';
import BrandLogo from '@/app/components/BrandLogo';
import SafeImage from '@/app/components/SafeImage';

export type WeeklyRow = {
	creatorAddress: string;
	count: number;
	label: string;
	profileHref?: string | null;
	avatarUrl?: string | null;
};

export default function WeeklyStudioLeaderboard({ compact }: { compact?: boolean }) {
	const [rows, setRows] = useState<WeeklyRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/engagement/weekly-studio', { cache: 'no-store' })
			.then((r) => r.json())
			.then((json: { items?: WeeklyRow[] }) => {
				if (!cancelled) setRows(json.items || []);
			})
			.catch(() => {
				if (!cancelled) setRows([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-muted text-sm py-4">
				<Loader2 className="w-4 h-4 animate-spin" />
				Loading weekly creators…
			</div>
		);
	}

	if (!rows.length) {
		return <p className="text-xs text-muted py-2">No studio publishes in the last 7 days yet.</p>;
	}

	return (
		<div className={compact ? 'space-y-2' : 'space-y-3'}>
			<div className="flex items-center gap-2 text-off-white/90">
				<Trophy className="w-4 h-4 text-amber-400" />
				<span className="text-sm font-semibold">Top studio drops (7 days)</span>
			</div>
			<ol className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
				{rows.map((r, i) => (
					<li
						key={r.creatorAddress}
						className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/25 px-3 py-2"
					>
						<span className="flex items-center gap-2 min-w-0 text-muted">
							<span className="w-5 text-right font-mono text-hero-blue">{i + 1}</span>
							<Link
								href={r.profileHref || `/studio/creator/${r.creatorAddress.toLowerCase()}/`}
								className="flex min-w-0 items-center gap-2 text-off-white hover:text-hero-blue transition-colors font-medium"
							>
								<span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black">
									{r.avatarUrl ? <SafeImage src={r.avatarUrl} alt="" fill className="object-cover" unoptimized /> : <BrandLogo className="h-full w-full" />}
								</span>
								<span className="truncate">{r.label}</span>
							</Link>
						</span>
						<span className="flex-shrink-0 tabular-nums text-off-white/80">{r.count} img{r.count !== 1 ? 's' : ''}</span>
					</li>
				))}
			</ol>
		</div>
	);
}
