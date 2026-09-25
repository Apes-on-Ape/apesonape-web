'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import BrandLogo from '../components/BrandLogo';
import ApeIdentityLink from '../components/profile/ApeIdentityLink';

interface LeaderboardEntry {
	rank: number;
	displayName: string;
	username: string | null;
	avatarUrl: string | null;
	aoa: number;
	level: number;
}

export default function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [limit, setLimit] = useState<number>(50);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/leaderboard?limit=${limit}`);
				if (res.ok) {
					const json = await res.json();
					if (Array.isArray(json?.leaderboard)) {
						setLeaderboard(json.leaderboard);
					}
				}
			} catch (err) {
				console.error('Error fetching leaderboard:', err);
			} finally {
				setLoading(false);
			}
		})();
	}, [limit]);

	return (
		<div className="min-h-screen text-[var(--ink)]">
			<main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
				<p className="aoa-meta">AOA</p>
				<h1 className="mt-3 font-[family-name:var(--font-signal-display)] text-4xl font-bold uppercase tracking-tight sm:text-6xl">
					Ape Board
				</h1>
				<p className="mt-4 max-w-xl text-sm text-[var(--ink-mute)]">
					Apes ranked by AOA. Arcade high scores stay on the arcade scoreboard.
				</p>

				{loading ? (
					<p className="py-12 text-sm text-[var(--ink-mute)]">Loading board.</p>
				) : leaderboard.length === 0 ? (
					<p className="py-12 text-sm text-[var(--ink-mute)]">No AOA records yet.</p>
				) : (
					<>
					<div className="aoa-meta mt-8 flex items-center gap-3 border-b border-white/10 py-3 sm:gap-4">
						<span className="w-10 shrink-0">Rank</span>
						<span className="w-12 shrink-0" aria-hidden="true" />
						<span className="min-w-0 flex-1">Ape</span>
						<span className="shrink-0 text-right">
							<span className="block">Level</span>
							<span className="block">AOA</span>
						</span>
					</div>
					<ol className="border-t border-white/10">
						{leaderboard.map((entry) => {
							const handle = entry.username?.trim();
							const identity = (
								<div className="min-w-0 flex-1">
									<p className="truncate font-semibold text-[var(--ink)]">{entry.displayName}</p>
									{handle ? <p className="truncate text-sm text-[var(--ink-mute)]">@{handle}</p> : null}
								</div>
							);
							return (
								<li key={`${entry.rank}-${entry.username || entry.displayName}`} className="flex items-center gap-3 border-b border-white/10 py-4 sm:gap-4">
									<span className="w-10 shrink-0 font-mono text-sm tabular-nums text-[var(--signal)]">
										{String(entry.rank).padStart(2, '0')}
									</span>
									<div className="relative h-12 w-12 shrink-0 overflow-hidden bg-black">
										{entry.avatarUrl ? (
											<SafeImage src={entry.avatarUrl} alt="" className="h-full w-full object-cover" width={96} height={96} />
										) : (
											<BrandLogo className="h-full w-full" />
										)}
									</div>
									<ApeIdentityLink username={handle} className="min-w-0 flex-1 hover:text-[var(--signal)]">
										{identity}
									</ApeIdentityLink>
									<div className="shrink-0 text-right">
										<p className="aoa-meta">Lvl {entry.level}</p>
										<p className="font-mono text-lg tabular-nums text-[var(--ink)]">{entry.aoa.toLocaleString()} AOA</p>
									</div>
								</li>
							);
						})}
					</ol>
					</>
				)}

				{!loading && leaderboard.length >= limit && (
					<div className="mt-6">
						<button
							type="button"
							className="aoa-home-cta aoa-home-cta-ghost"
							onClick={() => setLimit(prev => prev + 50)}
						>
							Load more
						</button>
					</div>
				)}
			</main>
			<Footer />
		</div>
	);
}
