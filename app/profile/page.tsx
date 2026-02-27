'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import SafeImage from '../components/SafeImage';
import { ProfileBadges } from '../components/ProfileBadges';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/';

type PrivyTwitter = { name?: string; username?: string; profilePictureUrl?: string };
type PrivyUser = { id?: string; twitter?: PrivyTwitter };
export default function ProfilePage() {
	const searchParams = useSearchParams();
	const { user, linkTwitter } = (usePrivy() as unknown) as { user?: PrivyUser; linkTwitter?: () => Promise<void> };
	const glyph = (useGlyph() as unknown) as {
		logout?: () => Promise<void>;
		user?: {
			evmWallet?: string;
			smartWallet?: string;
			linkedWallets?: Array<{ address?: string }>;
		};
	};

	// Read from Privy user (populated by the automatic sessions call)
	const twitter = useMemo(() => user?.twitter || null, [user]);

	const name: string = twitter?.name || '';
	const username: string = twitter?.username || '';
	const displayName = name;
	const displayHandle = username;
	const userId = user?.id || '';

	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [loadingCreations, setLoadingCreations] = useState(false);
	const [creationsError, setCreationsError] = useState<string | null>(null);
	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [foreverApeInput, setForeverApeInput] = useState('');
	const [foreverApeSaving, setForeverApeSaving] = useState(false);
	const [foreverApeError, setForeverApeError] = useState<string | null>(null);
	const [apeImgMap, setApeImgMap] = useState<Record<string, string> | null>(null);
	const [foreverApeImg, setForeverApeImg] = useState<string | null>(null);

	// All wallets from Glyph (primary + linked) for badge and creation lookup
	const walletAddresses = useMemo(() => {
		const primary = glyph?.user?.evmWallet || glyph?.user?.smartWallet || '';
		const linked = glyph?.user?.linkedWallets?.map((w) => (w?.address || '').trim()).filter(Boolean) || [];
		const set = new Set<string>([primary, ...linked].map((a) => a.toLowerCase()).filter(Boolean));
		return Array.from(set);
	}, [glyph?.user?.evmWallet, glyph?.user?.smartWallet, glyph?.user?.linkedWallets]);
	const walletAddress = walletAddresses[0] ?? '';

	useEffect(() => {
		if (!walletAddress) return;
		let cancelled = false;
		(async () => {
			try {
				setLoadingCreations(true);
				setCreationsError(null);
			const res = await fetch(`/api/studio/creations?creator=${encodeURIComponent(walletAddress)}&limit=50&type=visual`, {
					cache: 'no-store',
				});
				const json = await res.json();
				if (!res.ok) throw new Error(json?.error || 'Failed to load creations');
				if (!cancelled) setCreations(json.items || []);
			} catch (err: unknown) {
				if (!cancelled) setCreationsError(err instanceof Error ? err.message : 'Failed to load creations');
			} finally {
				if (!cancelled) setLoadingCreations(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [walletAddress]);

	useEffect(() => {
		if (!walletAddress) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/profile/forever-ape?address=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' });
				const json = await res.json();
				if (!res.ok) throw new Error(json?.error || 'Failed to load forever ape');
				if (!cancelled) {
					const apeId = typeof json.apeId === 'number' ? json.apeId : null;
					setForeverApe(apeId);
					setForeverApeInput(apeId !== null ? String(apeId) : '');
				}
			} catch {
				if (!cancelled) {
					setForeverApe(null);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [walletAddress]);

	// Fetch CDN token index once for ape images
	useEffect(() => {
		let cancelled = false;
		if (!CDN_BASE) return;
		if (apeImgMap) return;
		(async () => {
			try {
				const base = CDN_BASE.replace(/\/+$/, '');
				const res = await fetch(`${base}/tokens.json`, { cache: 'force-cache' });
				if (!res.ok) return;
				const tokens = await res.json();
				if (cancelled) return;
				const map: Record<string, string> = {};
				for (const t of tokens as Array<{ id: number; image: string }>) {
					map[String(t.id)] = t.image || '';
				}
				setApeImgMap(map);
			} catch {
				// ignore
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [apeImgMap]);

	// Resolve forever ape image
	useEffect(() => {
		if (!foreverApe || !apeImgMap) {
			setForeverApeImg(null);
			return;
		}
		const img = apeImgMap[String(foreverApe)];
		setForeverApeImg(img || null);
		// Trigger nav update
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event('forever-ape-updated'));
		}
	}, [foreverApe, apeImgMap]);

	const saveForeverApe = async () => {
		setForeverApeError(null);
		const parsed = Number(foreverApeInput);
		if (!Number.isFinite(parsed) || parsed < 0) {
			setForeverApeError('Enter a valid Ape ID');
			return;
		}
		try {
			setForeverApeSaving(true);
			const res = await fetch('/api/profile/forever-ape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ address: walletAddress, apeId: parsed }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || 'Failed to save');
			setForeverApe(parsed);
			// Trigger update event for nav
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new Event('forever-ape-updated'));
			}
		} catch (err: unknown) {
			setForeverApeError(err instanceof Error ? err.message : 'Failed to save');
		} finally {
			setForeverApeSaving(false);
		}
	};

	return (
		<div className="min-h-screen relative">
			<Nav />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
				{/* PROFILE HEADER */}
				<div className="relative overflow-hidden glass-dark rounded-3xl p-6 sm:p-10 border-2 border-white/10 mb-8 shadow-2xl shadow-black/50 bg-gradient-to-br from-hero-blue/20 via-purple-900/15 to-ape-gold/15 backdrop-blur-xl">
					{/* Animated background gradient */}
					<div className="absolute inset-0 opacity-40">
						<div className="absolute top-0 left-0 w-96 h-96 bg-hero-blue/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
						<div className="absolute bottom-0 right-0 w-96 h-96 bg-ape-gold/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
						<div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '0.5s' }} />
					</div>
					{/* Decorative grid pattern */}
					<div className="absolute inset-0 opacity-5" style={{
						backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
						backgroundSize: '50px 50px'
					}} />
					
					<div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-8">
						{/* Forever Ape Profile Image */}
						<div className="flex flex-col items-center sm:items-start gap-4 flex-shrink-0">
							<div className="relative group">
								<div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-4 border-ape-gold/70 bg-gradient-to-br from-ape-gold/40 via-hero-blue/30 to-purple-500/30 flex items-center justify-center relative shadow-2xl ring-4 ring-ape-gold/40 ring-offset-4 ring-offset-black/50 transition-all group-hover:scale-105 group-hover:ring-ape-gold/60">
									{foreverApeImg ? (
										<SafeImage 
											src={toGatewayUri(foreverApeImg)} 
											alt={`Forever Ape #${foreverApe || ''}`} 
											className="w-full h-full object-cover" 
											fill
											sizes="(max-width: 640px) 160px, 208px"
											unoptimized={true}
										/>
									) : (
										<div className="text-base text-off-white/60 text-center p-6">
											<div className="text-4xl mb-2">🦍</div>
											<div className="text-xs">Set Forever Ape</div>
										</div>
									)}
									{/* Animated glow effect */}
									<div className="absolute inset-0 bg-gradient-to-br from-ape-gold/20 via-transparent to-hero-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
								</div>
								{walletAddress && (
									<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-ape-gold/90 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-black/20">
										{foreverApe !== null ? `#${foreverApe}` : 'Not Set'}
									</div>
								)}
							</div>
							
							{/* Change Forever Ape Button */}
							{walletAddress && (
								<div className="w-full sm:w-auto">
									<div className="flex flex-col sm:flex-row gap-3 items-center p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
										<div className="flex items-center gap-2">
											<span className="text-ape-gold text-lg">🦍</span>
											<input
												value={foreverApeInput}
												onChange={(e) => setForeverApeInput(e.target.value)}
												className="rounded-lg bg-black/80 border-2 border-hero-blue/50 p-2.5 text-sm w-32 text-center font-mono text-white focus:border-ape-gold/80 focus:ring-2 focus:ring-ape-gold/40 focus:outline-none transition-all"
												placeholder="Ape ID"
												maxLength={5}
											/>
										</div>
										<button
											onClick={saveForeverApe}
											className="px-6 py-2.5 text-sm font-bold whitespace-nowrap hover:scale-105 transition-all shadow-lg bg-gradient-to-r from-ape-gold via-hero-blue to-purple-500 hover:from-ape-gold/90 hover:via-hero-blue/90 hover:to-purple-500/90 text-black rounded-lg border-2 border-black/20"
											disabled={foreverApeSaving}
										>
											{foreverApeSaving ? (
												<span className="flex items-center gap-2">
													<span className="animate-spin">⏳</span>
													<span>Saving...</span>
												</span>
											) : (
												<span className="flex items-center gap-2">
													<span>✨</span>
													<span>{foreverApe !== null ? 'Update' : 'Set'} Forever Ape</span>
												</span>
											)}
										</button>
									</div>
									{foreverApeError && (
										<div className="text-red-400 text-xs mt-2 text-center sm:text-left font-semibold">{foreverApeError}</div>
									)}
								</div>
							)}
						</div>

						{/* Profile Info */}
						<div className="flex-1 flex flex-col items-center sm:items-start gap-5 text-center sm:text-left">
							{/* Name & Username */}
							<div className="space-y-3">
								{displayName && (
									<h1 className="text-4xl sm:text-6xl font-black mb-2 bg-gradient-to-r from-hero-blue via-purple-400 to-ape-gold bg-clip-text text-transparent leading-tight drop-shadow-lg">
										{displayName}
									</h1>
								)}
								{displayHandle && (
									<div className="text-xl sm:text-3xl text-off-white/95 font-bold mb-2 flex items-center gap-2 justify-center sm:justify-start">
										<span>@</span>
										<span className="bg-gradient-to-r from-hero-blue/90 to-purple-400/90 bg-clip-text text-transparent">
											{displayHandle}
										</span>
									</div>
								)}
								{walletAddress && (
									<div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 border-2 border-hero-blue/40 text-sm text-off-white/80 font-mono backdrop-blur-sm hover:border-hero-blue/60 transition-colors shadow-lg">
										<span className="text-hero-blue text-lg">🔗</span>
										<span className="font-semibold">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
									</div>
								)}
							</div>

							{/* X Account Link */}
							<div className="mt-2">
								{!twitter ? (
									<button
										className="btn-secondary px-5 py-2.5 text-sm font-semibold hover:bg-hero-blue/20 transition-all hover:scale-105"
										onClick={async () => { try { await linkTwitter?.(); } catch {} }}
									>
										🐦 Link X account
									</button>
								) : (
									<span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-green-600/20 text-green-400 border-2 border-green-500/40 font-semibold shadow-lg">
										<span className="text-lg">✓</span> X Account Linked
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Ape Badges (wallets from Glyph, black background) */}
				<div className="mt-10">
					<ProfileBadges addresses={walletAddresses} showRefresh />
				</div>

				{/* Studio Creations */}
				<div className="relative overflow-hidden glass-dark rounded-3xl p-6 sm:p-8 border-2 border-white/10 mt-10 shadow-xl shadow-black/40 bg-gradient-to-br from-purple-900/15 via-black/40 to-hero-blue/15 backdrop-blur-xl">
					<div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-900/15 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 animate-pulse" />
					<div className="absolute top-0 right-0 w-64 h-64 bg-hero-blue/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
					<div className="relative">
						<div className="flex items-center justify-between mb-6 flex-wrap gap-4">
							<h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-hero-blue via-purple-400 to-ape-gold bg-clip-text text-transparent">
								My Studio Creations
							</h2>
							{walletAddress && (
								<a href="/studio/new" className="px-6 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-hero-blue to-purple-500 hover:from-hero-blue/90 hover:to-purple-500/90 transition-all hover:scale-105 shadow-lg text-white border-2 border-black/20">
									<span className="flex items-center gap-2">
										<span>✨</span>
										<span>Publish new</span>
									</span>
								</a>
							)}
						</div>

					{!walletAddress && (
						<p className="text-off-white/70 text-sm">Connect your wallet via Glyph to see your creations.</p>
					)}
					{walletAddress && loadingCreations && (
						<p className="text-off-white/70 text-sm">Loading your creations…</p>
					)}
					{walletAddress && creationsError && (
						<p className="text-red-300 text-sm">{creationsError}</p>
					)}
					{walletAddress && !loadingCreations && !creationsError && creations.length === 0 && (
						<p className="text-off-white/70 text-sm">
							No Studio posts yet. <a href="/studio/new" className="underline">Publish your first experiment.</a>
						</p>
					)}
					{walletAddress && creations.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{creations.map((c) => (
								<a
									key={c.id}
									href={`/studio/${c.id}`}
									className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black/30 to-black/50 hover:border-hero-blue/50 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-hero-blue/20 flex flex-col shadow-lg shadow-black/40"
								>
									<div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
										{c.type === 'visual' ? (
											<SafeImage 
												src={toGatewayUri(c.artifactUrl)} 
												alt={c.title} 
												className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
												fill 
											/>
										) : (
											<div className="flex items-center justify-center h-full w-full text-off-white/70 text-sm">
												Preview unavailable
											</div>
										)}
										<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
									<div className="p-4 space-y-2 bg-gradient-to-b from-transparent to-black/20">
										<div className="text-base font-bold line-clamp-1 text-white group-hover:text-hero-blue transition-colors">{c.title}</div>
										<div className="text-sm text-off-white/70 line-clamp-2">{c.description}</div>
										<div className="text-xs text-off-white/50">{new Date(c.createdAt).toLocaleString()}</div>
									</div>
								</a>
							))}
						</div>
					)}
					</div>
				</div>
				<div className="flex justify-center mt-8">
					<button
						className="btn-secondary px-4 py-2 text-sm"
						onClick={() => { void glyph.logout?.(); }}
					>
						Sign out
					</button>
				</div>
			</main>
			<Footer />
		</div>
	);
}
