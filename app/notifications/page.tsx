'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
import { NotificationRow, type NotificationView } from '../components/notifications/NotificationRows';

const FILTERS = ['all', 'unread', 'studio', 'achievement', 'collection', 'arcade', 'profile'] as const;

export default function NotificationsPage() {
	const { signedIn } = useSessionWallets();
	const { getAccessToken, authenticated } = (usePrivy() as unknown) as {
		getAccessToken?: () => Promise<string | null>;
		authenticated?: boolean;
	};
	const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
	const [items, setItems] = useState<NotificationView[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async (nextFilter: (typeof FILTERS)[number], nextCursor: string | null) => {
		const access = await getAccessToken?.();
		if (!access) {
			setLoading(false);
			return;
		}
		const params = new URLSearchParams({ limit: '20' });
		if (nextFilter === 'unread') params.set('unread', '1');
		if (nextFilter !== 'all' && nextFilter !== 'unread') params.set('category', nextFilter);
		if (nextCursor) params.set('cursor', nextCursor);
		const response = await fetch(`/api/notifications/inbox?${params}`, {
			headers: { Authorization: `Bearer ${access}` },
			cache: 'no-store',
		});
		setLoading(false);
		if (!response.ok) return;
		const json = (await response.json()) as { notifications: NotificationView[]; nextCursor: string | null };
		setCursor(json.nextCursor);
		setItems((current) => nextCursor ? [...current, ...json.notifications] : json.notifications);
	}, [getAccessToken]);

	useEffect(() => {
		if (!signedIn && !authenticated) return;
		setLoading(true);
		void load(filter, null);
	}, [authenticated, filter, load, signedIn]);

	const markRead = async (id: string) => {
		const access = await getAccessToken?.();
		if (!access) return;
		await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } });
		setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item));
	};

	if (!signedIn && !authenticated) {
		return <main className="container-premium py-16"><p className="text-[var(--ink-dim)]">Sign in to see notifications.</p></main>;
	}

	return (
		<main className="container-premium py-10">
			<h1 className="font-[family-name:var(--font-signal-display)] text-5xl uppercase leading-none tracking-tight">Notifications</h1>
			<div className="mt-6 flex flex-wrap gap-2">
				{FILTERS.map((item) => (
					<button
						key={item}
						type="button"
						onClick={() => setFilter(item)}
						className={`aoa-meta border px-3 py-2 uppercase ${filter === item ? 'border-[var(--signal)] text-[var(--ink)]' : 'border-white/15 text-[var(--ink-dim)]'}`}
					>
						{item}
					</button>
				))}
			</div>
			{loading ? <div className="mt-6 h-24 animate-pulse bg-white/5" /> : null}
			{!loading && items.length === 0 ? <p className="mt-8 text-sm text-[var(--ink-dim)]">No notifications yet.</p> : null}
			<ul className="mt-6 max-w-2xl space-y-2">
				{items.map((item) => (
					<li key={item.id}>
						<NotificationRow item={item} onOpen={(selected) => { if (!selected.readAt) void markRead(selected.id); }} />
					</li>
				))}
			</ul>
			{cursor ? (
				<button type="button" className="aoa-meta mt-6 text-[var(--ink)]" onClick={() => void load(filter, cursor)}>
					Older
				</button>
			) : null}
		</main>
	);
}
