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
			<main className="flex-1 container-premium pt-24 pb-16">
				{/* Premium Hero Section */}
				<div className="glass-premium rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden">
					{/* Background gradient */}
					<div className="absolute inset-0 bg-gradient-to-br from-hero-blue/5 via-transparent to-accent-purple/5 opacity-50" />
					<div className="relative z-10">
						<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
							<div className="space-y-4">
								<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-hero-blue/40 text-hero-blue text-sm font-semibold">
									<span className="w-2 h-2 bg-hero-blue rounded-full animate-pulse" />
									AOA Studio
								</div>
								<h1 className="section-heading text-4xl md:text-5xl lg:text-6xl">
									Sound. Art. Code. Vision.
								</h1>
								<p className="section-description max-w-2xl">
									Raw creations—published by creators. Every drop is attributed to the wallet that shipped it.
								</p>
								<div className="text-muted text-sm">{filteredSubtitle}</div>
							</div>
							<div className="flex items-center gap-3">
								<Link href="/studio/new" className="btn-primary btn-lg">
									Publish
								</Link>
							</div>
						</div>

						{/* Premium Search & Filters */}
						<form onSubmit={onSearch} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
							<div className="flex items-center gap-3 glass rounded-xl px-4 py-3 focus-within:border-hero-blue/50 transition-colors" style={{ borderColor: 'rgba(0, 84, 249, 0.3)' }}>
								<Search className="w-5 h-5 text-muted" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted"
									style={{ color: 'var(--foreground)' }}
									placeholder="Search title, creator address, or handle"
								/>
							</div>
							<div className="flex items-center gap-2 lg:justify-end overflow-x-auto scrollbar-hide whitespace-nowrap pr-2">
								{(['all', 'sound', 'visual', 'interactive', 'code'] as (CreationType | 'all')[]).map((t) => (
									<button
										key={t}
										type="button"
										onClick={() => setTypeFilter(t)}
										className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 flex-shrink-0 ${
											typeFilter === t
												? 'border-hero-blue bg-hero-blue/20 text-hero-blue shadow-md shadow-hero-blue/20'
												: 'text-muted hover:border-hero-blue/30'
										}
										style={typeFilter === t ? undefined : { borderColor: 'rgba(0, 84, 249, 0.3)', color: 'var(--foreground)' }}
										`}
									>
										{t === 'all' ? 'All' : typeLabels[t as CreationType]}
									</button>
								))}
							</div>
							<div className="flex items-center lg:justify-end gap-3">
								<button type="submit" className="btn-secondary">Search</button>
							</div>
						</form>
					</div>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="flex items-center justify-center gap-3 text-muted py-20">
						<Loader2 className="w-5 h-5 animate-spin text-hero-blue" />
						<span>Loading feed…</span>
					</div>
				)}
				
				{/* Error State */}
				{error && (
					<div className="card-premium border-red-500/30 bg-red-500/5 p-6 text-red-400">
						{error}
					</div>
				)}
				
				{/* Empty State */}
				{!loading && !error && creations.length === 0 && (
					<div className="card-premium text-center p-12">
						<p className="text-muted text-lg mb-4">
							No creations yet. Be the first to{' '}
							<Link href="/studio/new" className="text-hero-blue hover:underline font-semibold">
								publish
							</Link>.
						</p>
					</div>
				)}

				{/* Premium Creation Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{creations.map((creation) => (
						<Link
							key={creation.id}
							href={`/studio/${creation.id}`}
							className="group card-premium overflow-hidden flex flex-col hover:border-hero-blue/50 transition-all duration-500"
						>
							<div className="relative aspect-[4/3] w-full overflow-hidden bg-background-surface rounded-xl mb-4">
								{renderPreview(creation)}
								<div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs glass font-medium" style={{ borderColor: 'rgba(0, 84, 249, 0.3)' }}>
									{creation.type === 'sound' && <Play className="w-3.5 h-3.5" />}
									{creation.type === 'visual' && <ImageIcon className="w-3.5 h-3.5" />}
									{creation.type === 'interactive' && <MousePointerClick className="w-3.5 h-3.5" />}
									{creation.type === 'code' && <Code2 className="w-3.5 h-3.5" />}
									<span>{typeLabels[creation.type]}</span>
								</div>
							</div>
							<div className="space-y-3 flex-1 flex flex-col">
								<div className="flex items-start justify-between gap-2">
									<h3 className="font-bold text-lg line-clamp-1 group-hover:text-hero-blue transition-colors">
										{creation.title}
									</h3>
									<span className="text-xs text-muted whitespace-nowrap">{formatTimeAgo(creation.createdAt)}</span>
								</div>
								<p className="text-sm text-muted line-clamp-2 leading-relaxed flex-1">
									{creation.description}
								</p>
								<div className="flex items-center gap-2 text-xs flex-wrap">
									<Link
										href={
											creation.glyphProfile?.xHandle
												? `/studio/creator/${creation.glyphProfile.xHandle.toLowerCase()}`
												: `/studio/creator/${creation.creatorAddress.toLowerCase()}`
										}
										onClick={(e) => e.stopPropagation()}
										className="text-hero-blue hover:underline underline-offset-2 font-medium"
									>
										{creation.glyphProfile?.xHandle ? `@${creation.glyphProfile.xHandle}` : shortAddress(creation.creatorAddress)}
									</Link>
									{creation.glyphProfile?.verified ? (
										<span className="inline-flex items-center gap-1 text-accent-green badge-primary text-xs">
											<BadgeCheck className="w-3 h-3" /> Verified
										</span>
									) : null}
								</div>
								{creation.tags && creation.tags.length > 0 && (
									<div className="flex flex-wrap gap-2 pt-2">
										{creation.tags.map((tag) => (
											<span key={tag} className="badge text-xs">
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

