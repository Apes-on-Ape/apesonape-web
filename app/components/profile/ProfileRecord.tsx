'use client';

import { useEffect, useState } from 'react';
import { activityTitle, relativeTime } from './format';
import ProfileAchievements from './ProfileAchievements';
import LoadingBar from './LoadingBar';

type Breakdown = {
	studio: number;
	arcade: number;
	achievements: number;
	activity: number;
};

type EventRow = {
	source: string;
	action: string;
	amount: number;
	label: string;
	createdAt: string;
	referenceId?: string | null;
};

type Progress = {
	totalAoa: number;
	level: number;
	currentLevelAoa: number;
	nextLevelAoa: number;
	progressPercent: number;
	networkRank: number | null;
	sourceBreakdown: Breakdown;
	recentEvents: EventRow[];
	achievements: { unlocked: number; total: number };
};

export default function ProfileRecord({
	userId,
	username,
	addresses = [],
}: {
	userId?: string;
	username?: string;
	addresses?: string[];
}) {
	const [progress, setProgress] = useState<Progress | null>(null);
	const [loading, setLoading] = useState(true);
	const [activityPage, setActivityPage] = useState(0);

	useEffect(() => {
		if (!userId && !username) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setActivityPage(0);
		const url = userId
			? `/api/progress/me?userId=${encodeURIComponent(userId)}`
			: `/api/progress/public?username=${encodeURIComponent(username || '')}`;
		fetch(url, { cache: 'no-store' })
			.then((response) => response.json())
			.then((json: Progress & { progress?: Progress | null }) => {
				if (cancelled) return;
				setProgress(userId ? (json.totalAoa != null ? json : null) : json.progress ?? null);
			})
			.catch(() => {
				if (!cancelled) setProgress(null);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [userId, username]);

	if (loading) {
		return (
			<section className="mt-10 border-t border-white/10 pt-8">
				<LoadingBar label="Loading record" />
			</section>
		);
	}

	if (!progress) {
		return <p className="mt-10 text-sm text-[var(--ink-mute)]">Progress is not available.</p>;
	}

	const activityPageSize = 3;
	const activityPageCount = Math.max(1, Math.ceil(progress.recentEvents.length / activityPageSize));
	const activityPageIndex = Math.min(activityPage, activityPageCount - 1);
	const visibleActivity = progress.recentEvents.slice(
		activityPageIndex * activityPageSize,
		activityPageIndex * activityPageSize + activityPageSize,
	);
	const rank = progress.networkRank != null ? `#${String(progress.networkRank).padStart(2, '0')}` : '—';
	const nextLevel = progress.level >= 100 ? null : progress.level + 1;
	const remaining = nextLevel != null ? Math.max(0, progress.nextLevelAoa - progress.totalAoa) : 0;
	const breakdown = (
		[
			['Arcade', progress.sourceBreakdown.arcade],
			['Studio', progress.sourceBreakdown.studio],
			['Achievements', progress.sourceBreakdown.achievements],
			['Activity', progress.sourceBreakdown.activity],
		] as const
	).filter(([, value]) => value > 0);

	return (
		<div className="mt-10">
			<section className="border-t border-white/10 pt-8">
				<div className="grid gap-8 sm:grid-cols-3">
					<div>
						<p className="aoa-meta">AOA</p>
						<p className="mt-2 font-[family-name:var(--font-signal-display)] text-5xl font-bold tabular-nums leading-none text-[var(--ink)] sm:text-6xl">
							{progress.totalAoa.toLocaleString()}
						</p>
					</div>
					<div>
						<p className="aoa-meta">Level</p>
						<p className="mt-2 font-[family-name:var(--font-signal-display)] text-4xl font-bold tabular-nums leading-none sm:text-5xl">
							{progress.level}
						</p>
					</div>
					<div>
						<p className="aoa-meta">Ape rank</p>
						<p className="mt-2 font-[family-name:var(--font-signal-display)] text-4xl font-bold tabular-nums leading-none sm:text-5xl">
							{rank}
						</p>
					</div>
				</div>

				<div className="mt-8 max-w-3xl">
					<p className="aoa-meta">Level progress</p>
					<p className="mt-3 text-base text-[var(--ink)]">
						{progress.totalAoa.toLocaleString()} / {progress.nextLevelAoa.toLocaleString()} AOA
					</p>
					<div className="mt-3 h-2 bg-white/10">
						<div className="h-full bg-[var(--signal)]" style={{ width: `${progress.progressPercent}%` }} />
					</div>
					{nextLevel != null && remaining > 0 ? (
						<p className="mt-3 font-mono text-sm text-[var(--ink-dim)]">
							{remaining.toLocaleString()} AOA to level {nextLevel}
						</p>
					) : null}
				</div>

				{breakdown.length > 0 ? (
					<ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
						{breakdown.map(([label, value]) => (
							<li key={label}>
								<p className="aoa-meta">{label}</p>
								<p className="mt-1 font-mono text-base tabular-nums">{value.toLocaleString()}</p>
							</li>
						))}
					</ul>
				) : null}
			</section>

			<section className="relative mt-12 grid items-start gap-8 border-t border-white/10 bg-black/90 pt-8 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] lg:gap-10">
				<div className="min-w-0">
					<div className="flex items-end justify-between gap-4">
						<h2 className="font-[family-name:var(--font-signal-display)] text-3xl font-bold uppercase leading-none tracking-tight">Recent activity</h2>
						{progress.recentEvents.length > activityPageSize ? (
							<div className="flex items-center gap-3">
								<button
									type="button"
									className="aoa-meta text-[var(--ink-dim)] disabled:opacity-30"
									disabled={activityPageIndex === 0}
									onClick={() => setActivityPage(activityPageIndex - 1)}
								>
									Newer
								</button>
								<p className="aoa-meta tabular-nums text-[var(--ink)]">
									{activityPageIndex + 1} / {activityPageCount}
								</p>
								<button
									type="button"
									className="aoa-meta text-[var(--ink-dim)] disabled:opacity-30"
									disabled={activityPageIndex >= activityPageCount - 1}
									onClick={() => setActivityPage(activityPageIndex + 1)}
								>
									Older
								</button>
							</div>
						) : null}
					</div>
					{progress.recentEvents.length === 0 ? (
						<p className="mt-4 text-sm text-[var(--ink-mute)]">No signals yet</p>
					) : (
						<ul className="mt-4 border-t border-white/15">
							{visibleActivity.map((event) => (
								<li key={`${event.createdAt}-${event.action}-${event.referenceId ?? ''}-${event.amount}`} className="border-b border-white/15 py-3.5">
									{event.amount > 0 ? (
										<p className="font-[family-name:var(--font-signal-display)] text-3xl font-bold tabular-nums leading-none text-[var(--signal)]">
											+{event.amount.toLocaleString()} AOA
										</p>
									) : null}
									<p className={`font-[family-name:var(--font-signal-display)] font-bold uppercase leading-none text-[var(--ink)] ${event.amount > 0 ? 'mt-2 text-xl' : 'text-2xl'}`}>
										{activityTitle(event)}
									</p>
									<p className="mt-2 font-[family-name:var(--font-meta)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">{event.source}</p>
									<p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">{relativeTime(event.createdAt)}</p>
								</li>
							))}
						</ul>
					)}
				</div>
				<ProfileAchievements userId={userId} username={username} addresses={addresses} />
			</section>
		</div>
	);
}
