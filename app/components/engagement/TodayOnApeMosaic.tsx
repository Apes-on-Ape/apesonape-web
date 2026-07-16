'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

const HOURS_48 = 48 * 60 * 60 * 1000;
const MAX_TILES = 48;

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export type TodayOnApeMosaicProps = {
	variant?: 'full' | 'compact';
};

export default function TodayOnApeMosaic({ variant = 'full' }: TodayOnApeMosaicProps) {
	const [items, setItems] = useState<CreationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const qs = new URLSearchParams();
				qs.set('type', 'visual');
				qs.set('limit', '50');
				const res = await fetch(`/api/studio/creations?${qs.toString()}`, { cache: 'no-store' });
				const json = await res.json();
				if (!res.ok) throw new Error(json?.error || 'Failed to load');
				const raw: CreationRecord[] = json.items || [];
				const cutoff = Date.now() - HOURS_48;
				const recent = raw.filter((c) => new Date(c.createdAt).getTime() >= cutoff && c.type === 'visual');
				if (!cancelled) setItems(recent.slice(0, MAX_TILES));
			} catch (e: unknown) {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const gridClass = useMemo(
		() =>
			variant === 'compact'
				? 'grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5'
				: 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2',
		[variant],
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center gap-2 py-12 text-muted">
				<Loader2 className="w-5 h-5 animate-spin text-hero-blue" />
				<span className="text-sm">Loading mosaic…</span>
			</div>
		);
	}

	if (error) {
		return <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>;
	}

	if (items.length === 0) {
		return (
			<p className="text-sm text-muted text-center py-8">
				No studio images in the last 48 hours yet.{' '}
				<Link href="/studio/new" className="text-hero-blue hover:underline font-semibold">
					Publish the first tile
				</Link>
				.
			</p>
		);
	}

	return (
		<div className={gridClass}>
			{items.map((c) => (
				<Link
					key={c.id}
					href={`/studio/${c.id}`}
					className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-hero-blue/80"
					title={c.title}
				>
					<SafeImage
						src={toGatewayUri(c.artifactUrl)}
						alt={c.title}
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						fill
						sizes={variant === 'compact' ? '64px' : '120px'}
					/>
					<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
						<span className="block truncate text-[10px] font-medium text-white/90">
							{c.glyphProfile?.xHandle ? `@${c.glyphProfile.xHandle}` : shortAddress(c.creatorAddress)}
						</span>
					</div>
				</Link>
			))}
		</div>
	);
}
