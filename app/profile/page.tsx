'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import SafeImage from '../components/SafeImage';
import { ProfileBadges } from '../components/ProfileBadges';
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
	const twitterAvatarUrl: string | null = twitter?.profilePictureUrl || null;
	const displayName = name;
	const displayHandle = username;
	const userId = user?.id || '';

	// Fetch custom avatar from Supabase (priority over Twitter avatar)
	const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const avatarUrl = customAvatarUrl || twitterAvatarUrl;

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
	const [ownedBadges, setOwnedBadges] = useState<Array<{ slug: string; asset?: string; title?: string }>>([]);

	// All wallets from Glyph (primary + linked) for badge and creation lookup
	const walletAddresses = useMemo(() => {
		const primary = glyph?.user?.evmWallet || glyph?.user?.smartWallet || '';
		const linked = glyph?.user?.linkedWallets?.map((w) => (w?.address || '').trim()).filter(Boolean) || [];
		const set = new Set<string>([primary, ...linked].map((a) => a.toLowerCase()).filter(Boolean));
		return Array.from(set);
	}, [glyph?.user?.evmWallet, glyph?.user?.smartWallet, glyph?.user?.linkedWallets]);
	const walletAddress = walletAddresses[0] ?? '';

	// Fetch custom avatar from Supabase
	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/profile/summary?userId=${encodeURIComponent(userId)}`);
				if (res.ok) {
					const json = await res.json();
					if (!cancelled && json?.profile?.avatar_url) {
						setCustomAvatarUrl(json.profile.avatar_url);
					}
				}
			} catch {
				// ignore
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	// Fetch owned badges for badge generation
	useEffect(() => {
		if (!walletAddresses.length) return;
		let cancelled = false;
		(async () => {
			try {
				const query = walletAddresses.length === 1
					? `address=${encodeURIComponent(walletAddresses[0])}`
					: walletAddresses.map((a) => `addresses=${encodeURIComponent(a)}`).join('&');
				const res = await fetch(`/api/profile/badges?${query}`, { cache: 'no-store' });
				if (res.ok) {
					const json = await res.json();
					if (!cancelled && Array.isArray(json.badges)) {
						setOwnedBadges(json.badges);
					}
				}
			} catch {
				// ignore
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [walletAddresses.join(',')]);

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

	const profileUrl =
		typeof window !== 'undefined'
			? `${window.location.origin}/profile/${username || ''}`
			: '';

	const avatarInputRef = useRef<HTMLInputElement>(null);
	
	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !userId) return;
		setAvatarUploading(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('userId', userId);
			const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
			const json = await res.json();
			if (res.ok && json.url) {
				setCustomAvatarUrl(json.url);
				// Refresh nav avatar by triggering a re-fetch
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new Event('avatar-updated'));
				}
			} else {
				alert(json.error || 'Failed to upload avatar');
			}
		} catch (err) {
			alert('Failed to upload avatar');
		} finally {
			setAvatarUploading(false);
			// Reset input so same file can be selected again
			if (avatarInputRef.current) {
				avatarInputRef.current.value = '';
			}
		}
	};

	const generateBadge = async () => {
		if (!skills) return;
		setBadgeGenerating(true);
		try {
			const top = creations[0];
			const creationPreview = top ? toGatewayUri(top.artifactUrl) : null;
			const foreverImg = foreverApeImg ? toGatewayUri(foreverApeImg) : null;
			// Use Forever Ape as profile image, fallback to avatar
			const profileImgUrl = foreverImg || avatarUrl || null;
			const loadImage = (url: string) =>
				new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = url;
				});

			const canvas = document.createElement('canvas');
			canvas.width = 1200;
			canvas.height = 800;
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

			// Profile image display (Forever Ape or avatar, top left, next to header)
			if (profileImgUrl) {
				try {
					const profileImg = await loadImage(profileImgUrl);
					ctx.save();
					// Draw rounded square for Forever Ape, circle for avatar
					if (foreverImg) {
						const size = 60;
						const x = 200 - size / 2;
						const y = 80 - size / 2;
						const radius = 8;
						ctx.beginPath();
						ctx.moveTo(x + radius, y);
						ctx.lineTo(x + size - radius, y);
						ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
						ctx.lineTo(x + size, y + size - radius);
						ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
						ctx.lineTo(x + radius, y + size);
						ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
						ctx.lineTo(x, y + radius);
						ctx.quadraticCurveTo(x, y, x + radius, y);
						ctx.closePath();
						ctx.clip();
						ctx.drawImage(profileImg, x, y, size, size);
						ctx.restore();
						ctx.strokeStyle = 'rgba(255,215,0,0.9)';
						ctx.lineWidth = 3;
						ctx.beginPath();
						ctx.moveTo(x - 1 + radius, y - 1);
						ctx.lineTo(x - 1 + size - radius, y - 1);
						ctx.quadraticCurveTo(x - 1 + size, y - 1, x - 1 + size, y - 1 + radius);
						ctx.lineTo(x - 1 + size, y - 1 + size - radius);
						ctx.quadraticCurveTo(x - 1 + size, y - 1 + size, x - 1 + size - radius, y - 1 + size);
						ctx.lineTo(x - 1 + radius, y - 1 + size);
						ctx.quadraticCurveTo(x - 1, y - 1 + size, x - 1, y - 1 + size - radius);
						ctx.lineTo(x - 1, y - 1 + radius);
						ctx.quadraticCurveTo(x - 1, y - 1, x - 1 + radius, y - 1);
						ctx.closePath();
						ctx.stroke();
					} else {
						ctx.beginPath();
						ctx.arc(200, 80, 35, 0, Math.PI * 2);
						ctx.closePath();
						ctx.clip();
						ctx.drawImage(profileImg, 165, 45, 70, 70);
						ctx.restore();
						ctx.strokeStyle = 'rgba(123,176,255,0.8)';
						ctx.lineWidth = 3;
						ctx.beginPath();
						ctx.arc(200, 80, 37, 0, Math.PI * 2);
						ctx.stroke();
					}
				} catch {
					// ignore
				}
			}

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
					ctx.arc(1000, 120, 70, 0, Math.PI * 2);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(ape, 930, 50, 140, 140);
					ctx.restore();
					ctx.strokeStyle = 'rgba(255,215,0,0.9)';
					ctx.lineWidth = 4;
					ctx.beginPath();
					ctx.arc(1000, 120, 72, 0, Math.PI * 2);
					ctx.stroke();

					// Ape ID under the image
					ctx.fillStyle = '#ffd700';
					ctx.font = 'bold 16px Raleway, sans-serif';
					ctx.textAlign = 'center';
					ctx.fillText(`#${foreverApe}`, 1000, 220);
					ctx.textAlign = 'left';
				} catch {
					// ignore
				}
			}

			// Skill levels section (middle)
			ctx.fillStyle = 'rgba(255,255,255,0.08)';
			ctx.fillRect(50, 250, 1100, 100);
			ctx.strokeStyle = 'rgba(255,255,255,0.15)';
			ctx.lineWidth = 1;
			ctx.strokeRect(50, 250, 1100, 100);

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 24px Raleway, sans-serif';
			ctx.fillText('Skill Levels', 70, 280);

			ctx.font = '18px Raleway, sans-serif';
			const skillsText = `AI Image: L${skills.visual.level}`;
			ctx.fillText(skillsText, 70, 320);

			// Recent creation section (bottom)
			if (top) {
				ctx.fillStyle = '#9ad5ff';
				ctx.font = 'bold 22px Raleway, sans-serif';
				ctx.fillText('Latest Creation', 60, 390);

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 24px Raleway, sans-serif';
			ctx.fillText('AI Image', 60, 420);

				// Creation preview box
				const boxX = 60;
				const boxY = 440;
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
					ctx.fillText('Preview unavailable', boxX + 12, boxY + 35);
				}
			}

			// Owned Badges section
			if (ownedBadges.length > 0) {
				ctx.fillStyle = '#9ad5ff';
				ctx.font = 'bold 20px Raleway, sans-serif';
				ctx.fillText('Earned Badges', 60, 640);
				
				const badgeSize = 60;
				const badgeSpacing = 70;
				const badgesPerRow = Math.floor((canvas.width - 120) / badgeSpacing);
				const maxBadgesToShow = Math.min(ownedBadges.length, badgesPerRow * 2);
				
				for (let i = 0; i < maxBadgesToShow; i++) {
					const badge = ownedBadges[i];
					if (!badge?.asset) continue;
					
					const row = Math.floor(i / badgesPerRow);
					const col = i % badgesPerRow;
					const x = 60 + col * badgeSpacing;
					const y = 670 + row * badgeSpacing;
					
					try {
						const badgeImg = await loadImage(`/badges/${badge.asset}`);
						ctx.save();
						ctx.fillStyle = 'rgba(0,0,0,0.6)';
						ctx.fillRect(x - 3, y - 3, badgeSize + 6, badgeSize + 6);
						ctx.drawImage(badgeImg, x, y, badgeSize, badgeSize);
						ctx.restore();
					} catch {
						// ignore
					}
				}
				
				if (ownedBadges.length > maxBadgesToShow) {
					ctx.fillStyle = '#7bb0ff';
					ctx.font = '14px Raleway, sans-serif';
					ctx.fillText(`+${ownedBadges.length - maxBadgesToShow} more`, 60, 670 + badgeSpacing * 2 + 20);
				}
			}

			// Footer
			ctx.fillStyle = '#7bb0ff';
			ctx.font = '16px Raleway, sans-serif';
			ctx.fillText('apesonape.io/studio', 60, canvas.height - 20);

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

				{/* Skill Progress */}
				<div className="relative overflow-hidden glass-dark rounded-3xl p-6 sm:p-8 border-2 border-white/10 mt-10 shadow-xl shadow-black/40 bg-gradient-to-br from-hero-blue/15 via-black/40 to-purple-900/15 backdrop-blur-xl">
					<div className="absolute top-0 right-0 w-80 h-80 bg-hero-blue/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
					<div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
					<div className="relative">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-hero-blue via-purple-400 to-ape-gold bg-clip-text text-transparent">
							Studio Skill Progress
						</h2>
						<div className="flex items-center gap-3 flex-wrap">
							<button
								onClick={generateBadge}
								className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-hero-blue/20 to-purple-500/20 border-2 border-hero-blue/40 hover:border-hero-blue/60 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
								disabled={!skills || badgeGenerating}
							>
								{badgeGenerating ? (
									<span className="flex items-center gap-2">
										<span className="animate-spin">⏳</span>
										<span>Building badge…</span>
									</span>
								) : (
									<span className="flex items-center gap-2">
										<span>🎨</span>
										<span>Generate badge</span>
									</span>
								)}
							</button>
							{badgeUrl && (
								<>
									<a
										href={badgeUrl}
										download="aoa-studio-badge.png"
										className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-hero-blue/20 to-purple-500/20 border-2 border-hero-blue/40 hover:border-hero-blue/60 transition-all hover:scale-105 shadow-lg"
									>
										⬇️ Download
									</a>
									<button
										onClick={() => {
											const text = encodeURIComponent(
												`My AOA Studio badge — come check my creations!`,
											);
											const url = encodeURIComponent(profileUrl || `${window.location.origin}/studio`);
											window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
										}}
										className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-hero-blue to-purple-500 hover:from-hero-blue/90 hover:to-purple-500/90 transition-all hover:scale-105 shadow-lg text-white"
									>
										🐦 Share on X
									</button>
								</>
							)}
						</div>
					</div>
					{!walletAddress && <p className="text-off-white/70 text-sm">Connect your wallet to track experience.</p>}
					{walletAddress && skills && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							{(['visual'] as Array<keyof CreatorSkills>).map((skill) => {
								const data = skills[skill];
								const badges = getSkillBadges(skill, data.level);
								return (
									<div key={skill} className="relative overflow-hidden border border-white/10 rounded-2xl p-5 bg-gradient-to-br from-white/5 via-black/30 to-hero-blue/10 shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-hero-blue/20 transition-all hover:scale-[1.02]">
										<div className="absolute top-0 right-0 w-32 h-32 bg-hero-blue/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
										<div className="relative">
											<div className="flex items-center justify-between mb-3">
												<span className="font-bold text-lg text-hero-blue">AI Image</span>
												<span className="px-3 py-1 rounded-full bg-hero-blue/20 border border-hero-blue/40 text-hero-blue font-bold">
													Level {data.level}
												</span>
											</div>
											<div className="w-full h-4 rounded-full bg-black/50 overflow-hidden border-2 border-white/10 shadow-inner">
												<div
													className="h-full bg-gradient-to-r from-hero-blue via-purple-500 to-ape-gold transition-all duration-500 shadow-lg"
													style={{ width: `${Math.min(100, Math.round(data.progress * 100))}%` }}
												/>
											</div>
											<div className="flex items-center justify-between text-xs text-off-white/70 mt-2">
												<span className="font-semibold">{data.xp} XP</span>
												<span>{Math.round((data.progress || 0) * 100)}% to next level</span>
											</div>
											{badges.length > 0 && (
												<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
													{badges.map((b) => (
														<span
															key={`${skill}-${b.level}`}
															className="px-3 py-1 rounded-lg text-xs bg-hero-blue/20 border border-hero-blue/40 text-hero-blue font-semibold shadow-md"
														>
															{b.title} (Lvl {b.level})
														</span>
													))}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
					{walletAddress && !skills && (
						<p className="text-off-white/70 text-sm">No XP yet. Publish in Studio to start leveling up.</p>
					)}
					</div>
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
