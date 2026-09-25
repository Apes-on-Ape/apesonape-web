import Link from 'next/link';

export type NotificationView = {
	id: string;
	category: string;
	title: string;
	message: string;
	actionLabel: string | null;
	actionUrl: string | null;
	aoa: number | null;
	readAt: string | null;
	createdAt: string;
};

export function relativeTime(iso: string) {
	const then = new Date(iso).getTime();
	if (!Number.isFinite(then)) return '';
	const minutes = Math.round((Date.now() - then) / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 14) return `${days}d ago`;
	return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NotificationRow({
	item,
	onOpen,
}: {
	item: NotificationView;
	onOpen: (item: NotificationView) => void;
}) {
	const unread = !item.readAt;
	const body = (
		<>
			<div className="flex items-center gap-2">
				<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${unread ? 'bg-[var(--signal)]' : 'bg-transparent'}`} aria-hidden="true" />
				<p className="aoa-meta text-[10px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
					{item.category}
					{unread ? <span className="sr-only">, unread</span> : <span className="sr-only">, read</span>}
				</p>
				<p className="aoa-meta ml-auto text-[10px] text-[var(--ink-mute)]">{relativeTime(item.createdAt)}</p>
			</div>
			<p className={`mt-1 font-[family-name:var(--font-signal-display)] text-lg uppercase leading-none tracking-tight ${unread ? 'text-[var(--ink)]' : 'text-[var(--ink-dim)]'}`}>
				{item.title}
			</p>
			<p className="mt-1 text-sm leading-snug text-[var(--ink-dim)]">{item.message}</p>
			{item.aoa ? <p className="aoa-meta mt-2 text-[var(--signal)]">+{item.aoa} AOA</p> : null}
			{item.actionLabel ? <p className="aoa-meta mt-2 text-[var(--ink)]">{item.actionLabel} →</p> : null}
		</>
	);
	const className = `block w-full border px-3 py-3 text-left ${unread ? 'border-[var(--signal)]/50 bg-white/[0.04]' : 'border-white/10 bg-transparent'}`;
	if (!item.actionUrl) {
		return (
			<button type="button" className={className} onClick={() => onOpen(item)}>
				{body}
			</button>
		);
	}
	return (
		<Link href={item.actionUrl} className={className} onClick={() => onOpen(item)}>
			{body}
		</Link>
	);
}
