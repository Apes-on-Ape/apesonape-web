'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
import { NotificationRow, type NotificationView } from './notifications/NotificationRows';

type Inbox = { notifications: NotificationView[]; unreadCount: number };

function badgeLabel(count: number) {
	if (count > 99) return '99+';
	return String(count);
}

export default function NotificationBell() {
	const pathname = usePathname();
	const router = useRouter();
	const { signedIn } = useSessionWallets();
	const { getAccessToken, authenticated } = (usePrivy() as unknown) as {
		getAccessToken?: () => Promise<string | null>;
		authenticated?: boolean;
	};
	const [open, setOpen] = useState(false);
	const [count, setCount] = useState(0);
	const [inbox, setInbox] = useState<Inbox | null>(null);
	const [loading, setLoading] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const loggedIn = signedIn || authenticated;

	const token = useCallback(async () => {
		const value = await getAccessToken?.();
		return value || '';
	}, [getAccessToken]);

	const refreshCount = useCallback(async () => {
		const access = await token();
		if (!access) return;
		const response = await fetch('/api/notifications/unread-count', {
			headers: { Authorization: `Bearer ${access}` },
			cache: 'no-store',
		});
		if (!response.ok) return;
		const json = (await response.json()) as { count?: number };
		setCount(Number(json.count ?? 0));
	}, [token]);

	const refreshInbox = useCallback(async () => {
		const access = await token();
		if (!access) return;
		setLoading(true);
		try {
			const response = await fetch('/api/notifications/inbox?limit=8', {
				headers: { Authorization: `Bearer ${access}` },
				cache: 'no-store',
			});
			if (!response.ok) return;
			const json = (await response.json()) as Inbox;
			setInbox(json);
			setCount(Number(json.unreadCount ?? 0));
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		if (!loggedIn) return;
		void refreshCount();
		const timer = window.setInterval(() => void refreshCount(), 45000);
		return () => window.clearInterval(timer);
	}, [loggedIn, pathname, refreshCount]);

	useEffect(() => {
		if (!open) return;
		void refreshInbox();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		const onPointer = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener('keydown', onKey);
		document.addEventListener('mousedown', onPointer);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('mousedown', onPointer);
		};
	}, [open, refreshInbox]);

	const markRead = async (id: string) => {
		const access = await token();
		if (!access) return;
		await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } });
		setInbox((current) => current && ({
			...current,
			notifications: current.notifications.map((item) => item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item),
		}));
		setCount((value) => Math.max(0, value - 1));
	};

	const markAll = async () => {
		const access = await token();
		if (!access) return;
		await fetch('/api/notifications/read-all', { method: 'POST', headers: { Authorization: `Bearer ${access}` } });
		const now = new Date().toISOString();
		setInbox((current) => current && ({
			unreadCount: 0,
			notifications: current.notifications.map((item) => ({ ...item, readAt: item.readAt ?? now })),
		}));
		setCount(0);
	};

	if (!loggedIn) return null;

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				className="relative inline-flex h-11 w-11 items-center justify-center text-[var(--ink)]"
				aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
				aria-expanded={open}
				onClick={() => setOpen((value) => !value)}
			>
				<Bell size={20} aria-hidden="true" />
				{count > 0 ? (
					<span className="aoa-meta absolute -right-0.5 -top-0.5 min-w-[1.1rem] bg-[var(--signal)] px-1 text-center text-[10px] leading-4 text-white">
						{badgeLabel(count)}
					</span>
				) : null}
			</button>
			{open ? (
				<div className="fixed inset-x-0 bottom-0 top-[var(--aoa-header-h)] z-[80] flex flex-col border-t border-white/10 bg-[var(--bg)] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:h-auto md:max-h-[560px] md:w-[420px] md:border">
					<div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
						<h2 className="font-[family-name:var(--font-signal-display)] text-2xl uppercase leading-none tracking-tight">Notifications</h2>
						{count > 0 ? <span className="aoa-meta text-[var(--ink-dim)]">{badgeLabel(count)} unread</span> : null}
						<button type="button" className="aoa-meta ml-auto text-[var(--ink)]" onClick={() => void markAll()}>
							Mark all read
						</button>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto">
						{loading && !inbox ? (
							<div className="space-y-2 p-3">
								{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse bg-white/5" />)}
							</div>
						) : null}
						{inbox && inbox.notifications.length === 0 ? (
							<p className="px-4 py-8 text-sm text-[var(--ink-dim)]">No notifications yet.</p>
						) : null}
						<ul className="space-y-2 p-3">
							{(inbox?.notifications ?? []).map((item) => (
								<li key={item.id}>
									<NotificationRow
										item={item}
										onOpen={(selected) => {
											if (!selected.readAt) void markRead(selected.id);
											setOpen(false);
											if (!selected.actionUrl) router.push('/notifications/');
										}}
									/>
								</li>
							))}
						</ul>
					</div>
					<div className="border-t border-white/10 px-4 py-3">
						<Link href="/notifications/" className="aoa-meta text-[var(--ink)]" onClick={() => setOpen(false)}>
							View all notifications →
						</Link>
					</div>
				</div>
			) : null}
		</div>
	);
}
