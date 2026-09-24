'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import SafeImage from '@/app/components/SafeImage';
import { usePrivy } from '@privy-io/react-auth';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
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
	const { addresses: sessionAddresses } = useSessionWallets();

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

	return (
		<div className="min-h-screen bg-black text-white flex flex-col">
			<main className="container-premium flex-1 pt-32 pb-28">
				<p className="text-[11px] tracking-[0.35em] uppercase text-white/35">Profile</p>
				<div className="mt-8 flex flex-col sm:flex-row sm:items-end gap-8">
					{foreverApeImg && (
						<div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 overflow-hidden bg-white/5">
							<SafeImage
								src={toGatewayUri(foreverApeImg)}
								alt={`Ape #${foreverApe}`}
								className="object-cover"
								fill
							/>
						</div>
					)}
					<div>
						<h1 className="font-black leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}>
							@{displayHandle}
						</h1>
						{creatorAddress && (
							<p className="mt-3 text-sm text-white/35 font-mono">{shortAddress(creatorAddress)}</p>
						)}
						{foreverApe !== null && (
							<p className="mt-2 text-white/40 text-sm">Ape #{foreverApe}</p>
						)}
					</div>
				</div>
				<div className="mt-10 flex flex-wrap gap-8">
					<Link href="/studio" className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white">Studio</Link>
					{creatorAddress && sessionAddresses.includes(creatorAddress.toLowerCase()) && (
						<Link href="/profile" className="text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1">Your profile</Link>
					)}
				</div>

				<section className="mt-16 border-t border-white/10 pt-10">
					<h2 className="text-[11px] tracking-[0.35em] uppercase text-white/40">Studio</h2>
					{loading && <p className="mt-6 text-white/40 text-sm">Loading…</p>}
					{error && <p className="mt-6 text-red-300 text-sm">{error}</p>}
					{!loading && !error && creations.length === 0 && (
						<p className="mt-6 text-white/40 text-sm">Nothing here yet.</p>
					)}
					{creations.length > 0 && (
						<div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{creations.map((c) => (
								<a key={c.id} href={`/studio/${c.id}`} className="group block">
									<div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
									{c.type === 'visual' ? (
										<SafeImage src={toGatewayUri(c.artifactUrl)} alt={c.title} className="w-full h-full object-cover" fill />
									) : (
										<div className="flex items-center justify-center h-full w-full text-white/30 text-sm">
											No preview
										</div>
									)}
									</div>
									<p className="mt-3 font-bold truncate group-hover:text-hero-blue">{c.title}</p>
									<p className="text-xs text-white/35 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
								</a>
							))}
						</div>
					)}
				</section>
			</main>
			<Footer />
		</div>
	);
}

