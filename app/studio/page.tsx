'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Play, Code2, Image as ImageIcon, MousePointerClick, Loader2, BadgeCheck, Search } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import SafeImage from '@/app/components/SafeImage';
import { CreationRecord, CreationType } from '@/lib/studio/types';
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

const typeLabels: Record<CreationType, string> = {
	sound: 'Sound',
	visual: 'Visual',
	interactive: 'Interactive',
	code: 'Code',
};

export default function StudioExplorePage() {
	const searchParams = useSearchParams();
	const defaultType = (searchParams.get('type') as CreationType | 'all') || 'all';
	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [typeFilter, setTypeFilter] = useState<CreationType | 'all'>(defaultType);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const filteredSubtitle = useMemo(() => {
		if (typeFilter === 'all') return 'All creations';
		return `${typeLabels[typeFilter]} creations`;
	}, [typeFilter]);

	const loadFeed = async () => {
		try {
			setLoading(true);
			setError(null);
			const qs = new URLSearchParams();
			if (typeFilter !== 'all') qs.set('type', typeFilter);
			if (search) qs.set('search', search);
			qs.set('limit', '50');
			const res = await fetch(`/api/studio/creations?${qs.toString()}`, { cache: 'no-store' });
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
	}, [typeFilter]);

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
		if (creation.type === 'sound') {
			const url = creation.artifact.externalUrl || creation.artifactUrl;
			if (url.includes('soundcloud.com')) {
				return (
					<iframe
						title="Sound preview"
						width="100%"
						height="100%"
						allow="autoplay"
						src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`}
					/>
				);
			}
			if (url.includes('spotify.com')) {
				const embed = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
				return (
					<iframe
						title="Spotify preview"
						width="100%"
						height="100%"
						allow="encrypted-media"
						src={embed}
					/>
				);
			}
			return (
				<div className="flex items-center justify-center h-full w-full bg-black/40">
					<Play className="w-10 h-10 text-off-white/80" />
					<audio controls className="absolute bottom-2 left-2 right-2">
						<source src={toGatewayUri(creation.artifactUrl)} />
					</audio>
				</div>
			);
		}
		if (creation.type === 'interactive') {
			return (
				<div className="flex flex-col items-center justify-center h-full w-full gap-2 text-off-white/80">
					<MousePointerClick className="w-8 h-8" />
					<div className="text-sm">Open preview</div>
				</div>
			);
		}
		// code
		return (
			<pre className="text-xs font-mono p-3 text-left whitespace-pre-wrap text-off-white/80">
				{creation.codePreview || creation.description || '// Code snippet'}
			</pre>
		);
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Nav />
			<main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
				<div className="glass-dark border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl shadow-black/40">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div>
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hero-blue/40 text-hero-blue text-sm font-semibold">
								AOA Studio
							</div>
							<h1 className="text-4xl font-bold mt-3">Sound. Art. Code. Vision.</h1>
							<p className="text-off-white/70 mt-2 max-w-2xl">
								Raw creations—published by creators. Every drop is attributed to the wallet that shipped it.
							</p>
							<div className="text-off-white/60 text-sm mt-1">{filteredSubtitle}</div>
						</div>
						<div className="flex items-center gap-3">
							<Link href="/studio/new" className="btn-primary px-5 py-2 text-sm">
								Publish
							</Link>
						</div>
					</div>

					<form onSubmit={onSearch} className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
						<div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
							<Search className="w-4 h-4 text-off-white/60" />
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="bg-transparent flex-1 outline-none text-sm"
								placeholder="Search title, creator address, or handle"
							/>
						</div>
						<div className="flex items-center gap-2 lg:justify-end">
							{(['all', 'sound', 'visual', 'interactive', 'code'] as (CreationType | 'all')[]).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setTypeFilter(t)}
									className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
										typeFilter === t
											? 'border-hero-blue bg-hero-blue/10 text-hero-blue'
											: 'border-white/10 text-off-white/80 hover:border-white/30'
									}`}
								>
									{t === 'all' ? 'All' : typeLabels[t as CreationType]}
								</button>
							))}
						</div>
						<div className="flex items-center lg:justify-end gap-3">
							<button type="submit" className="btn-secondary px-4 py-2 text-sm">Search</button>
						</div>
					</form>
				</div>

				{loading && (
					<div className="flex items-center gap-2 text-off-white/70">
						<Loader2 className="w-4 h-4 animate-spin" />
						<span>Loading feed…</span>
					</div>
				)}
				{error && <div className="text-red-300 text-sm">{error}</div>}
				{!loading && !error && creations.length === 0 && (
					<div className="rounded-xl border border-white/10 bg-black/40 p-6 text-off-white/70">
						No creations yet. Be the first to <Link href="/studio/new" className="underline">publish</Link>.
					</div>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					{creations.map((creation) => (
						<Link
							key={creation.id}
							href={`/studio/${creation.id}`}
							className="group rounded-xl border border-white/10 bg-black/40 hover:border-hero-blue/40 transition-colors overflow-hidden flex flex-col"
						>
							<div className="relative aspect-[4/3] w-full overflow-hidden bg-black/30">
								{renderPreview(creation)}
								<div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-black/60 border border-white/10">
									{creation.type === 'sound' && <Play className="w-4 h-4" />}
									{creation.type === 'visual' && <ImageIcon className="w-4 h-4" />}
									{creation.type === 'interactive' && <MousePointerClick className="w-4 h-4" />}
									{creation.type === 'code' && <Code2 className="w-4 h-4" />}
									<span>{typeLabels[creation.type]}</span>
								</div>
							</div>
							<div className="p-4 space-y-2">
								<div className="flex items-center justify-between gap-2">
									<h3 className="font-semibold text-lg line-clamp-1">{creation.title}</h3>
									<span className="text-xs text-off-white/60">{formatTimeAgo(creation.createdAt)}</span>
								</div>
								<p className="text-sm text-off-white/70 line-clamp-2">{creation.description}</p>
								<div className="flex items-center gap-2 text-xs text-off-white/60">
									<Link
										href={
											creation.glyphProfile?.xHandle
												? `/studio/creator/${creation.glyphProfile.xHandle.toLowerCase()}`
												: `/studio/creator/${creation.creatorAddress.toLowerCase()}`
										}
										className="hover:underline underline-offset-2"
									>
										{creation.glyphProfile?.xHandle ? `@${creation.glyphProfile.xHandle}` : shortAddress(creation.creatorAddress)}
									</Link>
									{creation.glyphProfile?.verified ? (
										<span className="inline-flex items-center gap-1 text-green-400">
											<BadgeCheck className="w-3 h-3" /> Glyph verified
										</span>
									) : (
										<span className="text-off-white/50">Not verified</span>
									)}
									{creation.glyphProfile?.xHandle && (
										<span className="text-off-white/70">@{creation.glyphProfile.xHandle}</span>
									)}
								</div>
								{creation.tags && creation.tags.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{creation.tags.map((tag) => (
											<span key={tag} className="px-2 py-1 text-2xs rounded-full bg-white/5 border border-white/10 text-off-white/70">
												#{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</Link>
					))}
				</div>
			</main>
			<Footer />
		</div>
	);
}

