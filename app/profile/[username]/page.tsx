'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import SafeImage from '@/app/components/SafeImage';
import { ProfileBadges } from '@/app/components/ProfileBadges';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';

const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/';

function shortAddress(addr: string) {
	if (!addr) return '';
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ProfileByUsernamePage({ params }: { params: Promise<{ username: string }> }) {
	const { username } = use(params);
	const router = useRouter();
	const privy = (usePrivy() as unknown) as { user?: { twitter?: { username?: string } } };
	const glyph = (useGlyph() as unknown) as {
		user?: { evmWallet?: string; smartWallet?: string };
	};

	const loggedHandle = (privy?.user?.twitter?.username || '').toLowerCase();
	const isSelf = loggedHandle && loggedHandle === username.toLowerCase();

	// If viewing own handle, use the main profile page for full controls
	useEffect(() => {
		if (isSelf) {
			router.replace('/profile');
		}
	}, [isSelf, router]);

	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [apeImgMap, setApeImgMap] = useState<Record<string, string> | null>(null);
	const [foreverApeImg, setForeverApeImg] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch(`/api/studio/creations?creator=${encodeURIComponent(username)}&limit=50&type=visual`, { cache: 'no-store' });
				const json = await res.json();
				if (!res.ok) throw new Error(json?.error || 'Failed to load profile');
				if (!cancelled) setCreations(json.items || []);

				const creatorAddr = (json.items?.[0]?.creatorAddress || '').toLowerCase();
				if (creatorAddr) {
					try {
						const faRes = await fetch(`/api/profile/forever-ape?address=${encodeURIComponent(creatorAddr)}`, { cache: 'no-store' });
						const faJson = await faRes.json().catch(() => ({}));
						if (faRes.ok && !cancelled) {
							setForeverApe(typeof faJson.apeId === 'number' ? faJson.apeId : null);
						}
					} catch {
						// ignore
					}
				}
			} catch (err: unknown) {
				if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [username]);

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

	useEffect(() => {
		if (!foreverApe || !apeImgMap) return;
		const img = apeImgMap[String(foreverApe)];
		setForeverApeImg(img || null);
	}, [foreverApe, apeImgMap]);

	const displayHandle = creations[0]?.glyphProfile?.xHandle || username;
	const creatorAddress = creations[0]?.creatorAddress || '';

	const walletAddress = useMemo(
		() => (glyph?.user?.evmWallet || glyph?.user?.smartWallet || '').toLowerCase(),
		[glyph?.user?.evmWallet, glyph?.user?.smartWallet],
	);

	return (
		<div className="min-h-screen flex flex-col">
			<Nav />
			<main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
				<div className="glass-dark rounded-2xl p-6 border border-white/10 mb-6 shadow-2xl shadow-black/40 bg-gradient-to-br from-hero-blue/10 via-white/5 to-transparent">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div>
							<div className="text-sm text-off-white/70">Profile</div>
							<h1 className="text-3xl font-bold">@{displayHandle}</h1>
							{creatorAddress && (
								<div className="text-off-white/60 text-sm mt-1">{shortAddress(creatorAddress)}</div>
							)}
						{foreverApe !== null && (
							<div className="flex flex-col gap-2">
								<div className="text-sm text-off-white/70">Forever Ape: #{foreverApe}</div>
								{foreverApeImg && (
									<div className="w-32 h-32 rounded-lg overflow-hidden border border-white/15 bg-black/30 relative">
										<SafeImage
											src={toGatewayUri(foreverApeImg)}
											alt={`Forever Ape #${foreverApe}`}
											className="object-cover"
											fill
										/>
									</div>
								)}
							</div>
						)}
						</div>
						<div className="flex gap-2 flex-wrap">
							<Link href="/studio" className="btn-secondary px-4 py-2 text-sm">← Back to Studio</Link>
							{walletAddress && walletAddress === creatorAddress.toLowerCase() && (
								<Link href="/profile" className="btn-primary px-4 py-2 text-sm">Edit my profile</Link>
							)}
						</div>
					</div>
					{creatorAddress && (
						<div className="mt-4">
							<ProfileBadges address={creatorAddress} showRefresh={false} />
						</div>
					)}
				</div>

				<div className="glass-dark rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/40">
					<h2 className="text-xl font-semibold mb-4">Studio Creations</h2>
					{loading && <p className="text-off-white/70 text-sm">Loading…</p>}
					{error && <p className="text-red-300 text-sm">{error}</p>}
					{!loading && !error && creations.length === 0 && (
						<p className="text-off-white/70 text-sm">No creations yet.</p>
					)}
					{creations.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{creations.map((c) => (
								<a
									key={c.id}
									href={`/studio/${c.id}`}
									className="group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-black/30 to-black/50 hover:border-hero-blue/40 transition-colors overflow-hidden flex flex-col shadow-md shadow-black/30"
								>
									<div className="relative aspect-[4/3] w-full overflow-hidden bg-black/30">
									{c.type === 'visual' ? (
										<SafeImage src={toGatewayUri(c.artifactUrl)} alt={c.title} className="w-full h-full object-cover" fill />
									) : (
										<div className="flex items-center justify-center h-full w-full text-off-white/70 text-sm">
											Preview unavailable
										</div>
									)}
									</div>
									<div className="p-3 space-y-1">
										<div className="text-sm font-semibold line-clamp-1">{c.title}</div>
										<div className="text-xs text-off-white/60 line-clamp-2">{c.description}</div>
										<div className="text-2xs text-off-white/50">{new Date(c.createdAt).toLocaleString()}</div>
									</div>
								</a>
							))}
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}

