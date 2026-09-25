'use client';

import { useEffect, useState } from 'react';
import SafeImage from '@/app/components/SafeImage';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

export default function ProfileTransmissions({
	addresses = [],
	items,
	loadingItems = false,
	canPublish = false,
}: {
	addresses?: string[];
	items?: CreationRecord[];
	loadingItems?: boolean;
	canPublish?: boolean;
}) {
	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [loading, setLoading] = useState(false);
	const key = addresses.join(',');
	const provided = items !== undefined;

	useEffect(() => {
		if (provided) return;
		if (!key) {
			setCreations([]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		const creators = key ? key.split(',').filter(Boolean) : [];
		Promise.all(
			creators.map((address) =>
				fetch(`/api/studio/creations/?creator=${encodeURIComponent(address)}&limit=50&type=visual`, { cache: 'no-store' })
					.then((response) => response.json())
					.then((json: { items?: CreationRecord[] }) => json.items ?? [])
					.catch(() => [] as CreationRecord[]),
			),
		)
			.then((groups) => {
				if (cancelled) return;
				const byId = new Map<string, CreationRecord>();
				for (const item of groups.flat()) {
					if (item?.id) byId.set(item.id, item);
				}
				setCreations([...byId.values()]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [key, provided]);

	const visible = provided ? items : creations;
	const busy = provided ? loadingItems : loading;

	return (
		<section className="mt-8">
			<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<h2 className="font-[family-name:var(--font-signal-display)] text-2xl font-bold uppercase tracking-tight">
					Transmissions{visible.length ? ` // ${visible.length}` : ''}
				</h2>
				{canPublish ? (
					<a href="/studio/new" className="aoa-meta text-[var(--ink)] hover:text-[var(--signal)]">Make something</a>
				) : null}
			</div>
			{busy ? (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className="aspect-[4/3] animate-pulse bg-white/5" />
					))}
				</div>
			) : null}
			{!busy && visible.length === 0 ? (
				<p className="text-sm text-[var(--ink-mute)]">Nothing transmitted yet</p>
			) : null}
			{!busy && visible.length > 0 ? (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{visible.map((creation) => (
						<a key={creation.id} href={`/studio/${creation.id}`} className="group block min-w-0">
							<div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-black">
								{creation.type === 'visual' ? (
									<SafeImage src={toGatewayUri(creation.artifactUrl)} alt={creation.title} fill className="object-cover" />
								) : (
									<div className="flex h-full items-center justify-center text-sm text-[var(--ink-mute)]">No preview</div>
								)}
							</div>
							<p className="mt-3 truncate text-base font-semibold group-hover:text-[var(--signal)]">{creation.title}</p>
							<p className="mt-1 font-mono text-[12px] text-[var(--ink-mute)]">{new Date(creation.createdAt).toLocaleDateString()}</p>
						</a>
					))}
				</div>
			) : null}
		</section>
	);
}
