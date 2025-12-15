'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import SafeImage from '../components/SafeImage';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';
import type { CreatorSkills } from '@/lib/studio/xp';
import { getSkillBadges } from '@/lib/studio/xp-client';

const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/';

type PrivyTwitter = { name?: string; username?: string; profilePictureUrl?: string };
type PrivyUser = { id?: string; twitter?: PrivyTwitter };
export default function ProfilePage() {
	const { user, linkTwitter } = (usePrivy() as unknown) as { user?: PrivyUser; linkTwitter?: () => Promise<void> };
	const glyph = (useGlyph() as unknown) as {
		logout?: () => Promise<void>;
		user?: { evmWallet?: string; smartWallet?: string };
	};

	// Read from Privy user (populated by the automatic sessions call)
	const twitter = useMemo(() => user?.twitter || null, [user]);

	const name: string = twitter?.name || '';
	const username: string = twitter?.username || '';
	const twitterAvatarUrl: string | null = twitter?.profilePictureUrl || null;
	const displayName = name;
	const displayHandle = username;

	const [creations, setCreations] = useState<CreationRecord[]>([]);
	const [loadingCreations, setLoadingCreations] = useState(false);
	const [creationsError, setCreationsError] = useState<string | null>(null);
	const [skills, setSkills] = useState<CreatorSkills | null>(null);
	const [badgeUrl, setBadgeUrl] = useState<string | null>(null);
	const [badgeGenerating, setBadgeGenerating] = useState(false);
	const [foreverApe, setForeverApe] = useState<number | null>(null);
	const [foreverApeInput, setForeverApeInput] = useState('');
	const [foreverApeSaving, setForeverApeSaving] = useState(false);
	const [foreverApeError, setForeverApeError] = useState<string | null>(null);
	const [apeImgMap, setApeImgMap] = useState<Record<string, string> | null>(null);
	const [foreverApeImg, setForeverApeImg] = useState<string | null>(null);

	const walletAddress = useMemo(
		() => (glyph?.user?.evmWallet || glyph?.user?.smartWallet || '').toLowerCase(),
		[glyph?.user?.evmWallet, glyph?.user?.smartWallet],
	);

	useEffect(() => {
		if (!walletAddress) return;
		let cancelled = false;
		(async () => {
			try {
				setLoadingCreations(true);
				setCreationsError(null);
				const res = await fetch(`/api/studio/creations?creator=${encodeURIComponent(walletAddress)}&limit=50`, {
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
		if (!foreverApe || !apeImgMap) return;
		const img = apeImgMap[String(foreverApe)];
		setForeverApeImg(img || null);
	}, [foreverApe, apeImgMap]);

	const profileUrl =
		typeof window !== 'undefined'
			? `${window.location.origin}/profile/${username || ''}`
			: '';

	const generateBadge = async () => {
		if (!skills) return;
		setBadgeGenerating(true);
		try {
			const top = creations[0];
			const creationPreview = top ? toGatewayUri(top.artifactUrl) : null;
			const foreverImg = foreverApeImg ? toGatewayUri(foreverApeImg) : null;
			const loadImage = (url: string) =>
				new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = url;
				});

			const canvas = document.createElement('canvas');
			canvas.width = 1000;
			canvas.height = 600;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas unavailable');

			// Ape-inspired background with "Apes On Ape"
			const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
			grad.addColorStop(0, '#070d1f');
			grad.addColorStop(0.5, '#0d1f3d');
			grad.addColorStop(1, '#070d1f');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Background text "Apes On Ape"
			ctx.save();
			ctx.fillStyle = 'rgba(255,255,255,0.03)';
			ctx.font = 'bold 120px Raleway, sans-serif';
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate(-0.3);
			ctx.textAlign = 'center';
			ctx.fillText('APES ON APE', 0, 0);
			ctx.restore();

			// Decorative circles
			ctx.fillStyle = 'rgba(0,84,249,0.08)';
			ctx.beginPath();
			ctx.arc(150, 120, 100, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = 'rgba(255,215,0,0.06)';
			ctx.beginPath();
			ctx.arc(canvas.width - 150, canvas.height - 120, 120, 0, Math.PI * 2);
			ctx.fill();

			// Main header
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 42px Raleway, sans-serif';
			ctx.textAlign = 'left';
			ctx.fillText('AOA Studio Badge', 60, 80);

			// User info section (left side)
			ctx.fillStyle = '#7bb0ff';
			ctx.font = 'bold 28px Raleway, sans-serif';
			ctx.fillText(`@${username || 'unknown'}`, 60, 130);

			// Forever Ape display (top right area)
			if (foreverApe !== null && foreverImg) {
				try {
					const ape = await loadImage(foreverImg);
					ctx.save();
					ctx.beginPath();
					ctx.arc(800, 120, 70, 0, Math.PI * 2);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(ape, 730, 50, 140, 140);
					ctx.restore();
					ctx.strokeStyle = 'rgba(255,215,0,0.9)';
					ctx.lineWidth = 4;
					ctx.beginPath();
					ctx.arc(800, 120, 72, 0, Math.PI * 2);
					ctx.stroke();

					// Ape ID under the image
					ctx.fillStyle = '#ffd700';
					ctx.font = 'bold 16px Raleway, sans-serif';
					ctx.textAlign = 'center';
					ctx.fillText(`#${foreverApe}`, 800, 220);
					ctx.textAlign = 'left';
				} catch {
					// ignore
				}
			}

			// Skill levels section (middle)
			ctx.fillStyle = 'rgba(255,255,255,0.08)';
			ctx.fillRect(50, 180, 900, 100);
			ctx.strokeStyle = 'rgba(255,255,255,0.15)';
			ctx.lineWidth = 1;
			ctx.strokeRect(50, 180, 900, 100);

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 24px Raleway, sans-serif';
			ctx.fillText('Skill Levels', 70, 210);

			ctx.font = '18px Raleway, sans-serif';
			const skillsText = `Visual: L${skills.visual.level}   •   Sound: L${skills.sound.level}   •   Interactive: L${skills.interactive.level}   •   Code: L${skills.code.level}`;
			ctx.fillText(skillsText, 70, 250);

			// Recent creation section (bottom)
			if (top) {
				ctx.fillStyle = '#9ad5ff';
				ctx.font = 'bold 22px Raleway, sans-serif';
				ctx.fillText('Latest Creation', 60, 320);

				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 24px Raleway, sans-serif';
				ctx.fillText(`${top.type.charAt(0).toUpperCase() + top.type.slice(1)}`, 60, 350);

				// Creation preview box
				const boxX = 60;
				const boxY = 370;
				const boxW = 420;
				const boxH = 160;
				ctx.fillStyle = 'rgba(255,255,255,0.08)';
				ctx.fillRect(boxX, boxY, boxW, boxH);
				ctx.strokeStyle = 'rgba(255,255,255,0.15)';
				ctx.strokeRect(boxX, boxY, boxW, boxH);

				if (top.type === 'visual' && creationPreview) {
					try {
						const img = await loadImage(creationPreview);
						const aspect = img.width / img.height;
						let drawW = boxW - 20;
						let drawH = drawW / aspect;
						if (drawH > boxH - 20) {
							drawH = boxH - 20;
							drawW = drawH * aspect;
						}
						const dx = boxX + (boxW - drawW) / 2;
						const dy = boxY + (boxH - drawH) / 2;
						ctx.drawImage(img, dx, dy, drawW, drawH);
					} catch {
						ctx.fillStyle = '#7bb0ff';
						ctx.font = '16px Raleway, sans-serif';
						ctx.fillText('Preview image unavailable', boxX + 12, boxY + 40);
					}
				} else {
					ctx.fillStyle = '#7bb0ff';
					ctx.font = '18px Raleway, sans-serif';
					if (top.type === 'sound') {
						const url = top.artifact?.externalUrl || top.artifactUrl || '';
						const isAlbum = url.includes('/set') || url.includes('playlist') || url.includes('/album') || url.includes('/sets/');
						const label = isAlbum ? 'Album' : 'Track';

						ctx.fillText(`${label}: ${top.title || 'Unknown'}`, boxX + 12, boxY + 35);

						// Try to extract name from URL if no title
						let displayName = top.title;
						if (!displayName) {
							try {
								const urlObj = new URL(url);
								const pathParts = urlObj.pathname.split('/').filter(Boolean);
								displayName = decodeURIComponent(pathParts[pathParts.length - 1] || 'Unknown');
							} catch {
								displayName = 'Unknown';
							}
						}

						ctx.fillStyle = '#9ad5ff';
						ctx.font = '14px Raleway, sans-serif';
						ctx.fillText(displayName.slice(0, 50) + (displayName.length > 50 ? '…' : ''), boxX + 12, boxY + 65);

						// Add platform indicator
						const isSoundCloud = url.includes('soundcloud.com');
						const isSpotify = url.includes('spotify.com');
						if (isSoundCloud) {
							ctx.fillText('via SoundCloud', boxX + 12, boxY + 95);
						} else if (isSpotify) {
							ctx.fillText('via Spotify', boxX + 12, boxY + 95);
						}
					} else if (top.type === 'interactive') {
						ctx.fillText('Interactive Experience', boxX + 12, boxY + 35);
						ctx.fillStyle = '#9ad5ff';
						ctx.font = '14px Raleway, sans-serif';
						ctx.fillText('Click to open sandbox', boxX + 12, boxY + 65);
					} else if (top.type === 'code') {
						ctx.fillText('Code Snippet', boxX + 12, boxY + 35);
						ctx.fillStyle = '#9ad5ff';
						ctx.font = '14px Raleway, sans-serif';
						const snippet = top.codePreview || top.description || '// code';
						ctx.fillText(snippet.slice(0, 60) + (snippet.length > 60 ? '…' : ''), boxX + 12, boxY + 65);
					}
				}
			}

			// Footer
			ctx.fillStyle = '#7bb0ff';
			ctx.font = '16px Raleway, sans-serif';
			ctx.fillText('apesonape.io/studio', 60, 570);

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
				body: JSON.stringify({ address: walletAddress, apeId: parsed }),
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

	useEffect(() => {
		if (!walletAddress) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/studio/profile/xp?address=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' });
				const json = await res.json();
				if (!res.ok) throw new Error(json?.error || 'Failed to load XP');
				if (!cancelled) setSkills(json.skills || null);
			} catch {
				if (!cancelled) setSkills(null);
			}
		})();
		return () => { cancelled = true; };
	}, [walletAddress]);

	return (
		<div className="min-h-screen relative">
			<Nav />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
				{/* PROFILE HEADER */}
				<div className="glass-dark rounded-2xl p-6 border border-white/10 mb-6 shadow-2xl shadow-black/40 bg-gradient-to-br from-hero-blue/10 via-white/5 to-transparent">
					<div className="flex flex-col items-center gap-4 text-center">
						{/* Avatar */}
						<div className="w-32 h-32 rounded-full overflow-hidden border-2 border-hero-blue/50 bg-black/40 flex items-center justify-center relative">
							{twitterAvatarUrl ? (
								<SafeImage src={twitterAvatarUrl} alt="Avatar" className="w-full h-full object-cover" width={256} height={256} />
							) : (
								<div className="text-xs text-off-white/60 text-center p-2">No avatar</div>
							)}
						</div>

						{/* Name */}
						{displayName && (
							<div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
								{displayName}
							</div>
						)}

						{/* Username */}
						{displayHandle && (
							<div className="text-lg text-off-white/80">
								@{displayHandle}
							</div>
						)}
						{foreverApe !== null && (
							<div className="flex flex-col items-center gap-2">
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

						{/* X Account Link */}
						<div className="mt-2">
							{!twitter ? (
								<button
									className="btn-secondary px-3 py-1.5 text-sm"
									onClick={async () => { try { await linkTwitter?.(); } catch {} }}
								>
									🐦 Link X account
								</button>
							) : (
								<span className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-green-600/20 text-green-400 border border-green-500/30">
									✓ X Account Linked
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Gamification sections removed */}

				{/* Sign Out */}
				{/* Skill Progress */}
				<div className="glass-dark rounded-2xl p-6 border border-white/10 mt-10 shadow-xl shadow-black/40">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
							Studio Skill Progress
						</h2>
						<div className="flex items-center gap-2 text-sm">
							<button
								onClick={generateBadge}
								className="btn-secondary px-3 py-1.5"
								disabled={!skills || badgeGenerating}
							>
								{badgeGenerating ? 'Building badge…' : 'Generate badge'}
							</button>
							{badgeUrl && (
								<>
									<a
										href={badgeUrl}
										download="aoa-studio-badge.png"
										className="btn-secondary px-3 py-1.5"
									>
										Download
									</a>
									<button
										onClick={() => {
											const text = encodeURIComponent(
												`My AOA Studio badge — come check my creations!`,
											);
											const url = encodeURIComponent(profileUrl || `${window.location.origin}/studio`);
											window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
										}}
										className="btn-primary px-3 py-1.5"
									>
										Share on X
									</button>
								</>
							)}
						</div>
					</div>
					{!walletAddress && <p className="text-off-white/70 text-sm">Connect your wallet to track experience.</p>}
					{walletAddress && skills && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
					{walletAddress && !skills && (
						<p className="text-off-white/70 text-sm">No XP yet. Publish in Studio to start leveling up.</p>
					)}
				</div>

				{/* Studio Creations */}
				<div className="glass-dark rounded-xl p-6 border border-white/10 mt-10">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
							My Studio Creations
						</h2>
						{walletAddress && (
							<a href="/studio/new" className="btn-primary px-3 py-1.5 text-sm">
								Publish new
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
