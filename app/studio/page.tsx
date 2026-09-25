'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { BadgeCheck } from 'lucide-react';
import Footer from '@/app/components/Footer';
import ApeIdentityLink from '@/app/components/profile/ApeIdentityLink';
import ApeMark from '@/app/components/profile/ApeMark';
import SafeImage from '@/app/components/SafeImage';
import BroadcastLabel from '@/app/components/signal/BroadcastLabel';
import DailyEngagementStudioSection from '@/app/components/engagement/DailyEngagementStudioSection';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimeAgo(dateIso: string) {
	const diff = Date.now() - new Date(dateIso).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function StudioExplorePage() {
	const { user } = (usePrivy() as unknown) as { user?: { id?: string } };
	const privyUserId = user?.id?.trim() ?? null;

	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sortMode, setSortMode] = useState<'newest' | 'oldest'>('newest');

	const loadFeed = async () => {
		try {
			setLoading(true);
			setError(null);
			const qs = new URLSearchParams();
			qs.set('type', 'visual');
			if (search) qs.set('search', search);
			qs.set('limit', '50');
			const res = await fetch(`/api/studio/creations/?${qs.toString()}`, { cache: 'no-store' });
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || 'Failed to load feed');
			setCreations(json.items || []);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load feed');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadFeed();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSearch = (e: React.FormEvent) => {
		e.preventDefault();
		void loadFeed();
	};

	const renderPreview = (creation: CreationRecord) => {
		if (creation.type === 'visual') {
			return (
				<SafeImage
					src={toGatewayUri(creation.artifactUrl)}
					alt={creation.title}
					className="w-full h-full object-cover"
					fill
				/>
			);
		}
		return (
			<div className="flex items-center justify-center h-full w-full bg-black/40 text-off-white/70 text-sm">
				Preview unavailable
			</div>
		);
	};

	return (
		<div className="min-h-screen flex flex-col text-[var(--ink)]">
			<main className="flex-1 container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
				<div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<BroadcastLabel>Transmission lab</BroadcastLabel>
						<h1 className="type-hero-home mt-4 max-w-[8ch]">AOA Lab</h1>
						<p className="mt-4 max-w-xl text-lg">Create. Publish. Transmit.</p>
						<p className="mt-2 max-w-xl text-sm text-[var(--ink-dim)]">Visual artifacts created by the AOA network.</p>
					</div>
					<Link href="/studio/new" className="aoa-home-cta aoa-home-cta-solid w-full sm:w-auto">Create transmission</Link>
				</div>

				<form onSubmit={onSearch} className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
					<div className="min-w-0 flex-1">
						<label htmlFor="studio-search" className="aoa-meta">Search</label>
						<input
							id="studio-search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="mt-2 w-full min-h-11 border border-[rgba(243,238,228,0.18)] bg-transparent px-3 text-sm text-[var(--ink)]"
							placeholder="Title, address, or handle"
						/>
					</div>
					<button type="submit" className="aoa-home-cta aoa-home-cta-ghost">Search</button>
				</form>

				<DailyEngagementStudioSection userId={privyUserId} />

				{/* Loading State */}
				{loading && (
					<p className="aoa-meta py-16 text-center">Scanning the lab...</p>
				)}
				
				{error && (
					<p className="border border-red-400/40 p-4 text-sm text-red-300" role="alert">{error}</p>
				)}
				
				{!loading && !error && creations.length === 0 && (
					<div className="border border-[rgba(243,238,228,0.12)] px-6 py-16 text-center">
						<p className="type-section">No visual transmissions yet.</p>
						<Link href="/studio/new" className="aoa-home-cta aoa-home-cta-solid mt-6">Create the first signal</Link>
					</div>
				)}

				{!loading && !error && creations.length > 0 && (
					<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
						<p className="aoa-meta">{creations.length} transmission{creations.length === 1 ? '' : 's'}</p>
						<div className="flex gap-2">
							<button type="button" onClick={() => setSortMode('newest')} className={`aoa-home-cta ${sortMode === 'newest' ? 'aoa-home-cta-solid' : 'aoa-home-cta-ghost'}`}>Newest</button>
							<button type="button" onClick={() => setSortMode('oldest')} className={`aoa-home-cta ${sortMode === 'oldest' ? 'aoa-home-cta-solid' : 'aoa-home-cta-ghost'}`}>Oldest</button>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...creations]
						.sort((a, b) =>
							sortMode === 'newest'
								? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
								: new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
						)
						.map((creation) => (
						<article key={creation.id} className="flex min-w-0 flex-col border border-[rgba(243,238,228,0.12)]">
							<Link href={`/studio/${creation.id}`} className="block min-w-0">
								<div className="relative aspect-[4/3] overflow-hidden bg-black/40">
									{renderPreview(creation)}
								</div>
								<div className="space-y-2 p-3">
									<p className="aoa-meta text-[var(--signal)]">Artifact // {creation.id.slice(0, 8)}</p>
									<h3 className="line-clamp-1 text-base font-semibold">{creation.title}</h3>
									<p className="aoa-meta" title={new Date(creation.createdAt).toLocaleString()}>{formatTimeAgo(creation.createdAt)}</p>
									{(creation.artifact?.prompt || creation.description) ? (
										<p className="line-clamp-2 text-sm text-[var(--ink-dim)]">{creation.artifact?.prompt || creation.description}</p>
									) : null}
								</div>
							</Link>
							<div className="flex flex-wrap items-center gap-2 px-3 pb-3">
								<span className="relative h-7 w-7 shrink-0 overflow-hidden bg-black">
									<ApeMark username={creation.glyphProfile?.xHandle} />
								</span>
								<ApeIdentityLink
									username={creation.glyphProfile?.xHandle}
									fallbackHref={`/studio/creator/${(creation.glyphProfile?.xHandle || creation.creatorAddress).toLowerCase()}/`}
									className="aoa-meta text-[var(--signal)]"
								>
									{creation.glyphProfile?.xHandle ? `@${creation.glyphProfile.xHandle}` : shortAddress(creation.creatorAddress)}
								</ApeIdentityLink>
								{creation.glyphProfile?.verified ? (
									<span className="aoa-meta inline-flex items-center gap-1">
										<BadgeCheck className="h-3 w-3" /> Verified
									</span>
								) : null}
							</div>
						</article>
					))}
				</div>
			</main>
			<Footer />
		</div>
	);
}

