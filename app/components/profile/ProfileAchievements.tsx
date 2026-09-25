'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import LoadingBar from './LoadingBar';

type Card = {
	id: string;
	name: string;
	description: string;
	category: string;
	aoaReward: number;
	unlocked: boolean;
	unlockedAt: string | null;
	progress: number | null;
	target: number | null;
};

type View = { unlocked: number; total: number; achievements: Card[] };

const CATEGORY_ORDER = ['collection', 'creator', 'activity', 'community', 'explorer'] as const;

function unlockDate(iso: string | null) {
	if (!iso) return '';
	const date = new Date(iso);
	if (!Number.isFinite(date.getTime())) return '';
	return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function progressRatio(card: Card) {
	if (card.progress == null || card.target == null || card.target <= 0) return 0;
	return Math.min(card.progress, card.target) / card.target;
}

function previewCards(cards: Card[]) {
	const unlocked = [...cards]
		.filter((card) => card.unlocked)
		.sort((a, b) => new Date(b.unlockedAt ?? 0).getTime() - new Date(a.unlockedAt ?? 0).getTime())
		.slice(0, 2);
	const picked = new Set(unlocked.map((card) => card.id));
	const closest = [...cards]
		.filter((card) => !card.unlocked && !picked.has(card.id))
		.sort((a, b) => progressRatio(b) - progressRatio(a))
		.slice(0, 2);
	const chosen = [...unlocked, ...closest];
	for (const card of cards) {
		if (chosen.length >= 4) break;
		if (!chosen.some((item) => item.id === card.id)) chosen.push(card);
	}
	return chosen.slice(0, 4);
}

function AchievementFilters({
	categories,
	filter,
	onChange,
}: {
	categories: string[];
	filter: string;
	onChange: (value: string) => void;
}) {
	if (!categories.length) return null;
	return (
		<div className="inline-flex max-w-full flex-wrap gap-1 border border-white/15 bg-black p-1" role="tablist" aria-label="Achievement categories">
			{['all', ...categories].map((item) => (
				<button
					key={item}
					type="button"
					role="tab"
					aria-selected={filter === item}
					onClick={() => onChange(item)}
					className={`px-2.5 py-1 font-[family-name:var(--font-meta)] text-[11px] uppercase tracking-[0.14em] ${
						filter === item ? 'bg-[var(--signal)] text-white' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
					}`}
				>
					{item}
				</button>
			))}
		</div>
	);
}

function AchievementCard({ card }: { card: Card }) {
	const [open, setOpen] = useState(false);
	const hasProgress = card.progress != null && card.target != null && card.target > 0;
	const current = hasProgress ? Math.min(card.progress ?? 0, card.target ?? 0) : 0;
	const complete = hasProgress && current >= (card.target ?? 0);
	const width = hasProgress ? Math.max(0, Math.min(100, (current / (card.target ?? 1)) * 100)) : 0;
	const when = card.unlocked ? unlockDate(card.unlockedAt) : '';
	const hasDetails = Boolean(card.description || when);

	return (
		<li
			className={`border px-3 py-2.5 ${
				card.unlocked ? 'border-[var(--signal)]/45 bg-[var(--signal-dim)] text-[var(--ink)]' : 'border-white/10 bg-black text-[var(--ink-dim)]'
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				<p className="aoa-meta text-[var(--ink-dim)]">{card.category}</p>
				<p className={`aoa-meta ${card.unlocked ? 'text-[var(--ink)]' : ''}`}>{card.unlocked ? 'Unlocked' : 'Locked'}</p>
			</div>
			<p className="mt-1.5 font-[family-name:var(--font-signal-display)] text-xl font-bold uppercase leading-none text-[var(--ink)]">{card.name}</p>
			{hasProgress ? (
				<div className="mt-2">
					<p className="font-mono text-[12px] tabular-nums text-[var(--ink)]">
						{card.unlocked && complete ? 'Complete' : `${current.toLocaleString()} / ${card.target?.toLocaleString()}`}
					</p>
					<div className="mt-1 h-1 bg-white/10">
						<div className={`h-full ${card.unlocked ? 'bg-[var(--signal)]' : 'bg-white/45'}`} style={{ width: `${width}%` }} />
					</div>
				</div>
			) : null}
			<div className="mt-2 flex items-end justify-between gap-2">
				<p className="font-[family-name:var(--font-signal-display)] text-lg font-bold tabular-nums leading-none text-[var(--signal)]">
					+{card.aoaReward.toLocaleString()} AOA
				</p>
				{hasDetails ? (
					<button type="button" className="aoa-meta text-[var(--ink)]" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
						{open ? 'Hide' : 'Details'}
					</button>
				) : null}
			</div>
			{open && card.description ? <p className="mt-2 text-sm leading-snug">{card.description}</p> : null}
			{open && when ? <p className="mt-1 aoa-meta">{when}</p> : null}
		</li>
	);
}

function AchievementArchive({
	unlocked,
	total,
	categories,
	cards,
	onClose,
	returnFocusRef,
}: {
	unlocked: number;
	total: number;
	categories: string[];
	cards: Card[];
	onClose: () => void;
	returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const [filter, setFilter] = useState('all');
	const [entered, setEntered] = useState(false);
	const locked = Math.max(0, total - unlocked);
	const visible = cards.filter((card) => filter === 'all' || card.category === filter);

	useEffect(() => {
		const frame = requestAnimationFrame(() => setEntered(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	useEffect(() => {
		const y = window.scrollY;
		const body = document.body;
		const html = document.documentElement;
		const previous = {
			bodyOverflow: body.style.overflow,
			htmlOverflow: html.style.overflow,
			position: body.style.position,
			top: body.style.top,
			width: body.style.width,
		};
		html.style.overflow = 'hidden';
		body.style.overflow = 'hidden';
		body.style.position = 'fixed';
		body.style.top = `-${y}px`;
		body.style.width = '100%';

		const root = dialogRef.current;
		const focusable = () =>
			[...(root?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])];
		focusable()[0]?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				onCloseRef.current();
				return;
			}
			if (event.key !== 'Tab') return;
			const nodes = focusable();
			if (!nodes.length || !root?.contains(document.activeElement)) return;
			const first = nodes[0];
			const last = nodes[nodes.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
			body.style.overflow = previous.bodyOverflow;
			html.style.overflow = previous.htmlOverflow;
			body.style.position = previous.position;
			body.style.top = previous.top;
			body.style.width = previous.width;
			window.scrollTo(0, y);
			returnFocusRef.current?.focus();
		};
	}, [returnFocusRef]);

	return (
		<div className="fixed inset-0 z-[90] flex bg-black/80 md:items-center md:justify-center md:p-6" onMouseDown={onClose}>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="achievement-archive-title"
				onMouseDown={(event) => event.stopPropagation()}
				className={`flex h-[100dvh] w-full flex-col bg-black motion-safe:transition motion-safe:duration-200 motion-reduce:transition-none md:h-[min(88vh,880px)] md:w-[min(1100px,90vw)] md:border md:border-white/15 ${
					entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
				}`}
			>
				<header className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 id="achievement-archive-title" className="font-[family-name:var(--font-signal-display)] text-2xl font-bold uppercase leading-none sm:text-3xl">
								Achievement archive
							</h2>
							<p className="mt-2 font-[family-name:var(--font-signal-display)] text-xl font-bold uppercase tabular-nums leading-none">
								{unlocked} / {total} <span className="text-[var(--ink-dim)]">unlocked</span>
							</p>
						</div>
						<button type="button" className="aoa-meta text-[var(--ink)]" onClick={onClose}>
							Close
						</button>
					</div>
					<p className="mt-3 flex gap-4">
						<span className="aoa-meta text-[var(--ink-dim)]">Unlocked {unlocked}</span>
						<span className="aoa-meta text-[var(--ink-dim)]">Locked {locked}</span>
					</p>
					<div className="mt-3">
						<AchievementFilters categories={categories} filter={filter} onChange={setFilter} />
					</div>
				</header>
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
					{visible.length === 0 ? (
						<p className="text-sm text-[var(--ink-mute)]">No achievements in this view.</p>
					) : (
						<ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
							{visible.map((card) => (
								<AchievementCard key={card.id} card={card} />
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}

export default function ProfileAchievements({
	userId,
	username,
	addresses = [],
}: {
	userId?: string;
	username?: string;
	addresses?: string[];
}) {
	const { getAccessToken } = (usePrivy() as unknown) as { getAccessToken?: () => Promise<string | null> };
	const [view, setView] = useState<View | null>(null);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	const openButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (new URLSearchParams(window.location.search).get('archive') === 'achievements') setOpen(true);
	}, []);
	const key = addresses.join(',');

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		(async () => {
			try {
				if (username && !userId) {
					const response = await fetch(`/api/profile/achievements?username=${encodeURIComponent(username)}`, { cache: 'no-store' });
					const json = await response.json();
					if (!cancelled) setView(json);
					return;
				}
				if (!userId) {
					if (!cancelled) setView(null);
					return;
				}
				const token = await getAccessToken?.();
				if (!token) {
					if (!cancelled) setView(null);
					return;
				}
				const response = await fetch('/api/profile/achievements', {
					method: 'POST',
					headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({ connectedWallets: key ? key.split(',') : [] }),
				});
				const json = await response.json();
				if (!cancelled && response.ok) setView(json);
			} catch {
				if (!cancelled) setView(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [userId, username, key]);

	const allCards = view?.achievements ?? [];
	const categories = useMemo(
		() => CATEGORY_ORDER.filter((category) => allCards.some((card) => card.category === category)),
		[allCards],
	);
	const preview = useMemo(() => previewCards(allCards), [allCards]);
	const unlocked = view?.unlocked ?? 0;
	const total = view?.total ?? 0;

	const closeArchive = () => setOpen(false);

	return (
		<section className="min-w-0">
			<div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
				<h2 className="font-[family-name:var(--font-signal-display)] text-3xl font-bold uppercase leading-none tracking-tight">
					Achievements
				</h2>
				{view ? (
					<p className="font-[family-name:var(--font-signal-display)] text-2xl font-bold uppercase leading-none tabular-nums">
						{unlocked} / {total}
					</p>
				) : null}
			</div>

			{loading ? <LoadingBar label="Loading achievements" /> : null}

			{!loading && unlocked === 0 && allCards.length === 0 ? (
				<p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--ink-dim)]">
					No achievements unlocked yet. Start collecting Apes, publishing transmissions, and using the ecosystem.
				</p>
			) : null}

			{!loading && preview.length > 0 ? (
				<ul className="mt-4 grid grid-cols-2 gap-2">
					{preview.map((card) => {
						const hasProgress = card.progress != null && card.target != null && card.target > 0;
						const current = hasProgress ? Math.min(card.progress ?? 0, card.target ?? 0) : 0;
						return (
							<li
								key={card.id}
								className={`border px-3 py-2.5 ${card.unlocked ? 'border-[var(--signal)]/45 bg-[var(--signal-dim)]' : 'border-white/10 bg-black/70'}`}
							>
								<p className="font-[family-name:var(--font-signal-display)] text-lg font-bold uppercase leading-none text-[var(--ink)]">{card.name}</p>
								<p className="mt-2 font-mono text-[12px] uppercase tabular-nums text-[var(--ink-dim)]">
									{card.unlocked ? 'Unlocked' : hasProgress ? `${current.toLocaleString()} / ${card.target?.toLocaleString()}` : 'Locked'}
								</p>
							</li>
						);
					})}
				</ul>
			) : null}

			{!loading && allCards.length > 0 ? (
				<button ref={openButtonRef} type="button" className="aoa-meta mt-4 text-[var(--ink)]" onClick={() => setOpen(true)}>
					View all achievements
				</button>
			) : null}

			{open && view ? (
				<AchievementArchive
					unlocked={unlocked}
					total={total}
					categories={categories}
					cards={allCards}
					onClose={closeArchive}
					returnFocusRef={openButtonRef}
				/>
			) : null}
		</section>
	);
}
