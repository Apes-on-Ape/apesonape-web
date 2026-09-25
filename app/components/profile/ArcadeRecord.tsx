'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ArcadeMerged = {
	total_games_played: number;
	block_dodger_score: number;
	neon_racer_score: number;
	ape_man_score: number;
	flappy_ape_score: number;
	galaxy_ape_score: number;
	tailstrike_arena_score: number;
	block_dodger_games: number;
	neon_racer_games: number;
	ape_man_games: number;
	flappy_ape_games: number;
	galaxy_ape_games: number;
	tailstrike_arena_games: number;
	clubroom_visits: number;
	walletCount: number;
};

const GAMES: Array<{ name: string; score: keyof ArcadeMerged; runs: keyof ArcadeMerged }> = [
	{ name: 'Block Dodger', score: 'block_dodger_score', runs: 'block_dodger_games' },
	{ name: 'Neon Racer', score: 'neon_racer_score', runs: 'neon_racer_games' },
	{ name: 'Ape Man', score: 'ape_man_score', runs: 'ape_man_games' },
	{ name: 'Flappy Ape', score: 'flappy_ape_score', runs: 'flappy_ape_games' },
	{ name: 'Galaxy Ape', score: 'galaxy_ape_score', runs: 'galaxy_ape_games' },
	{ name: 'Tailstrike Arena', score: 'tailstrike_arena_score', runs: 'tailstrike_arena_games' },
];

export default function ArcadeRecord({ addresses }: { addresses: string[] }) {
	const [merged, setMerged] = useState<ArcadeMerged | null>(null);
	const [found, setFound] = useState(false);
	const [loading, setLoading] = useState(true);
	const [nonce, setNonce] = useState(0);
	const key = addresses.join(',');
	const refresh = useCallback(() => setNonce((value) => value + 1), []);

	useEffect(() => {
		if (!addresses.length) {
			setLoading(false);
			setFound(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		const params = new URLSearchParams();
		addresses.forEach((address) => params.append('addresses', address));
		fetch(`/api/profile/arcade-stats?${params.toString()}`, { cache: 'no-store' })
			.then((response) => response.json())
			.then((json: { found?: boolean; merged?: ArcadeMerged | null }) => {
				if (cancelled) return;
				setFound(!!json.found);
				setMerged(json.merged ?? null);
			})
			.catch(() => {
				if (!cancelled) {
					setFound(false);
					setMerged(null);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [key, nonce]);

	return (
		<section className="mt-8">
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="font-[family-name:var(--font-signal-display)] text-2xl font-bold uppercase tracking-tight">Arcade record</h2>
					<p className="mt-2 text-sm text-[var(--ink-dim)]">Personal bests stay scores. They are not AOA.</p>
				</div>
				<div className="flex flex-wrap gap-5">
					<button type="button" onClick={refresh} disabled={loading} className="aoa-meta text-[var(--ink)] disabled:opacity-40">
						{loading ? 'Loading' : 'Refresh'}
					</button>
					<Link href="/arcade/leaderboard" className="aoa-meta hover:text-[var(--ink)]">Scoreboard</Link>
					<Link href="/arcade" className="aoa-meta text-[var(--ink)]">Play</Link>
				</div>
			</div>
			{loading ? <div className="h-40 animate-pulse bg-white/5" /> : null}
			{!loading && (!found || !merged) ? (
				<p className="text-sm text-[var(--ink-mute)]">No scores yet.</p>
			) : null}
			{!loading && found && merged ? (
				<div>
					{merged.walletCount > 1 ? (
						<p className="mb-4 text-sm text-[var(--ink-mute)]">Combined across {merged.walletCount} wallets.</p>
					) : null}
					<p className="aoa-meta">Runs {merged.total_games_played.toLocaleString()}</p>
					<ul className="mt-4 border-t border-white/10">
						{GAMES.map((game) => (
							<li key={game.name} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4">
								<div>
									<p className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none">{game.name}</p>
									<p className="mt-2 font-mono text-[12px] text-[var(--ink-mute)]">{Number(merged[game.runs]).toLocaleString()} runs</p>
								</div>
								<p className="font-[family-name:var(--font-signal-display)] text-3xl font-bold tabular-nums leading-none">
									{Number(merged[game.score]).toLocaleString()}
								</p>
							</li>
						))}
					</ul>
					<p className="mt-4 text-sm text-[var(--ink-mute)]">Clubroom · {merged.clubroom_visits.toLocaleString()} visits</p>
				</div>
			) : null}
		</section>
	);
}
