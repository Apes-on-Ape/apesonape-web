'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import SafeImage from '@/app/components/SafeImage';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import { CreationRecord } from '@/lib/studio/types';
import type { CreatorSkills } from '@/lib/studio/xp';
import { getSkillBadges } from '@/lib/studio/xp-client';
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
	const [skills, setSkills] = useState<CreatorSkills | null>(null);
	const [badgeUrl, setBadgeUrl] = useState<string | null>(null);
	const [badgeGenerating, setBadgeGenerating] = useState(false);
	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [foreverApeInput, setForeverApeInput] = useState('');
	const [foreverApeSaving, setForeverApeSaving] = useState(false);
	const [foreverApeError, setForeverApeError] = useState<string | null>(null);
	const [apeImgMap, setApeImgMap] = useState<Record<string, string> | null>(null);
	const [foreverApeImg, setForeverApeImg] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch(`/api/studio/creations?creator=${encodeURIComponent(username)}&limit=50`, { cache: 'no-store' });
				const json = await res.json();
				if (!res.ok) throw new Error(json?.error || 'Failed to load profile');
				if (!cancelled) setCreations(json.items || []);

				const creatorAddr = (json.items?.[0]?.creatorAddress || '').toLowerCase();
				if (creatorAddr) {
					const xpRes = await fetch(`/api/studio/profile/xp?address=${encodeURIComponent(creatorAddr)}`, { cache: 'no-store' });
					const xpJson = await xpRes.json().catch(() => ({}));
					if (xpRes.ok && !cancelled) setSkills(xpJson.skills || null);
					// forever ape
					try {
						const faRes = await fetch(`/api/profile/forever-ape?address=${encodeURIComponent(creatorAddr)}`, { cache: 'no-store' });
						const faJson = await faRes.json().catch(() => ({}));
						if (faRes.ok && !cancelled) {
							setForeverApe(typeof faJson.apeId === 'number' ? faJson.apeId : null);
							setForeverApeInput(
								typeof faJson.apeId === 'number' ? String(faJson.apeId) : '',
							);
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

	const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${username}` : '';

	const generateBadge = async () => {
		if (!skills) return;
		setBadgeGenerating(true);
		try {
			const top = creations[0];
			const previewUrl = top ? toGatewayUri(top.artifactUrl) : null;
			const loadImage = (url: string) =>
				new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = url;
				});

			const canvas = document.createElement('canvas');
			canvas.width = 900;
			canvas.height = 520;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas unavailable');

			const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			grad.addColorStop(0, '#0b1024');
			grad.addColorStop(1, '#0a1a3a');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'rgba(0,84,249,0.08)';
			ctx.beginPath();
			ctx.arc(740, 120, 140, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = 'rgba(255,215,0,0.06)';
			ctx.beginPath();
			ctx.arc(140, 360, 180, 0, Math.PI * 2);
			ctx.fill();

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 34px Raleway, sans-serif';
			ctx.fillText('AOA Studio Badge', 40, 60);
			ctx.font = '24px Raleway, sans-serif';
			ctx.fillStyle = '#7bb0ff';
			ctx.fillText(`@${displayHandle}`, 40, 100);
			if (foreverApe !== null) {
				ctx.font = '18px Raleway, sans-serif';
				ctx.fillStyle = '#ffd700';
				ctx.fillText(`Forever Ape: #${foreverApe}`, 40, 130);
			}

			ctx.fillStyle = 'rgba(255,255,255,0.08)';
			ctx.fillRect(36, 160, 828, 90);
			ctx.font = '18px Raleway, sans-serif';
			ctx.fillStyle = '#ffffff';
			const levelLine = `Visual L${skills.visual.level}   •   Sound L${skills.sound.level}   •   Interactive L${skills.interactive.level}   •   Code L${skills.code.level}`;
			ctx.fillText(levelLine, 50, 210);

			if (top) {
				ctx.fillStyle = '#9ad5ff';
				ctx.fillText('Recent creation:', 40, 270);
				ctx.fillStyle = '#ffffff';
				ctx.font = '20px Raleway, sans-serif';
				ctx.fillText(`${top.title || '(untitled)'}`, 40, 300);

				const boxX = 40;
				const boxY = 320;
				const boxW = 360;
				const boxH = 140;
				ctx.fillStyle = 'rgba(255,255,255,0.06)';
				ctx.fillRect(boxX, boxY, boxW, boxH);
				ctx.strokeStyle = 'rgba(255,255,255,0.12)';
				ctx.strokeRect(boxX, boxY, boxW, boxH);

				if (top.type === 'visual' && previewUrl) {
					try {
						const img = await loadImage(previewUrl);
						const aspect = img.width / img.height;
						let drawW = boxW - 16;
						let drawH = drawW / aspect;
						if (drawH > boxH - 16) {
							drawH = boxH - 16;
							drawW = drawH * aspect;
						}
						const dx = boxX + (boxW - drawW) / 2;
						const dy = boxY + (boxH - drawH) / 2;
						ctx.drawImage(img, dx, dy, drawW, drawH);
					} catch {
						ctx.fillStyle = '#7bb0ff';
						ctx.fillText('Preview image unavailable', boxX + 12, boxY + 30);
					}
				} else {
					ctx.fillStyle = '#7bb0ff';
					ctx.font = '16px Raleway, sans-serif';
					if (top.type === 'sound') {
						ctx.fillText('Sound preview', boxX + 12, boxY + 30);
						ctx.fillStyle = '#9ad5ff';
						ctx.fillText(
							top.artifact?.provider === 'spotify'
								? 'Spotify link'
								: top.artifact?.provider === 'soundcloud'
									? 'SoundCloud link'
									: 'Audio upload',
							boxX + 12,
							boxY + 55,
						);
					} else if (top.type === 'interactive') {
						ctx.fillText('Interactive preview', boxX + 12, boxY + 30);
						ctx.fillStyle = '#9ad5ff';
						ctx.fillText('Opens sandbox on detail', boxX + 12, boxY + 55);
					} else if (top.type === 'code') {
						ctx.fillText('Code snippet', boxX + 12, boxY + 30);
						ctx.fillStyle = '#9ad5ff';
						const snippet = top.codePreview || top.description || '// code';
						ctx.fillText(snippet.slice(0, 50) + (snippet.length > 50 ? '…' : ''), boxX + 12, boxY + 55);
					}
				}
			}

			ctx.fillStyle = '#7bb0ff';
			ctx.font = '16px Raleway, sans-serif';
			ctx.fillText('apesonape.io/studio', 40, 500);

			const url = canvas.toDataURL('image/png');
			setBadgeUrl(url);
		} catch (e) {
			console.error(e);
		} finally {
			setBadgeGenerating(false);
		}
	};

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
				body: JSON.stringify({ address: creatorAddress, apeId: parsed }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || 'Failed to save');
			setForeverApe(parsed);
		} catch (err: unknown) {
			setForeverApeError(err instanceof Error ? err.message : 'Failed to save');
		} finally {
			setForeverApeSaving(false);
		}
	};

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
								<Link href="/profile" className="btn-primary px-4 py-2 text-sm">View my profile</Link>
							)}
							<button
								onClick={generateBadge}
								className="btn-secondary px-3 py-1.5 text-sm"
								disabled={!skills || badgeGenerating}
							>
								{badgeGenerating ? 'Building badge…' : 'Generate badge'}
							</button>
							{badgeUrl && (
								<>
									<a
										href={badgeUrl}
										download="aoa-studio-badge.png"
										className="btn-secondary px-3 py-1.5 text-sm"
									>
										Download
									</a>
									<button
										onClick={() => {
											const text = encodeURIComponent(
												`Check out @${displayHandle}'s AOA Studio badge!`
											);
											const url = encodeURIComponent(profileUrl || `${window.location.origin}/studio`);
											window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
										}}
										className="btn-primary px-3 py-1.5 text-sm"
									>
										Share on X
									</button>
								</>
							)}
						</div>
					</div>
					{skills && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
							{(['visual', 'sound', 'interactive', 'code'] as Array<keyof CreatorSkills>).map((skill) => {
								const data = skills[skill];
								const badges = getSkillBadges(skill, data.level);
								return (
									<div key={skill} className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-white/5 via-black/20 to-black/40 shadow-md shadow-black/30">
										<div className="flex items-center justify-between text-sm mb-2">
											<span className="font-semibold capitalize">{skill}</span>
											<span className="text-off-white/60">Level {data.level}</span>
										</div>
										<div className="w-full h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
											<div
												className="h-full bg-gradient-to-r from-hero-blue to-ape-gold"
												style={{ width: `${Math.min(100, Math.round(data.progress * 100))}%` }}
											/>
										</div>
										<div className="text-2xs text-off-white/60 mt-1">
											{data.xp} XP • {Math.round((data.progress || 0) * 100)}% of next level
										</div>
										{badges.length > 0 && (
											<div className="flex flex-wrap gap-2 mt-2">
												{badges.map((b) => (
													<span
														key={`${skill}-${b.level}`}
														className="px-2 py-1 rounded-full text-2xs bg-hero-blue/10 border border-hero-blue/30 text-hero-blue"
													>
														{b.title} (Lvl {b.level})
													</span>
												))}
											</div>
										)}
									</div>
								);
							})}
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
										{c.type === 'visual' && (
											<SafeImage src={toGatewayUri(c.artifactUrl)} alt={c.title} className="w-full h-full object-cover" fill />
										)}
										{c.type === 'sound' && (
											<div className="flex flex-col items-center justify-center h-full w-full gap-2 text-off-white/80 p-3">
												<div className="text-sm">Sound</div>
												<audio controls className="w-full">
													<source src={toGatewayUri(c.artifactUrl)} />
												</audio>
											</div>
										)}
										{c.type === 'interactive' && (
											<div className="flex flex-col items-center justify-center h-full w-full gap-2 text-off-white/80 p-3">
												<div className="text-sm">Interactive</div>
											</div>
										)}
										{c.type === 'code' && (
											<pre className="text-xs font-mono p-3 text-left whitespace-pre-wrap text-off-white/80">
												{c.codePreview || c.description || '// Code snippet'}
											</pre>
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
					{walletAddress && walletAddress === creatorAddress?.toLowerCase() && (
						<div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
							<div className="flex items-center gap-2 flex-wrap">
								<input
									value={foreverApeInput}
									onChange={(e) => setForeverApeInput(e.target.value)}
									className="rounded-md bg-black/40 border border-white/10 p-2 text-sm w-40"
									placeholder="Ape ID"
								/>
								<button
									onClick={saveForeverApe}
									className="btn-primary px-3 py-1.5 text-sm"
									disabled={foreverApeSaving}
								>
									{foreverApeSaving ? 'Saving…' : 'Save forever ape'}
								</button>
								{foreverApe !== null && (
									<span className="text-sm text-off-white/70">Current: #{foreverApe}</span>
								)}
							</div>
							{foreverApeError && <div className="text-red-300 text-xs mt-1">{foreverApeError}</div>}
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}

