'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useGlyph, useGlyphTokenGate } from '@use-glyph/sdk-react';
import { usePrivy } from '@privy-io/react-auth';
import SafeImage from './SafeImage';

type GlyphUser = { id?: string };
type PrivyTwitter = { name?: string; username?: string; profilePictureUrl?: string };
type PrivyUser = { id?: string; twitter?: PrivyTwitter };

export default function AuthNavControls() {
	const { login, logout, user, isAuthenticated } = (useGlyph() as unknown) as {
		login: () => Promise<void>;
		logout: () => Promise<void>;
		user?: GlyphUser;
		isAuthenticated?: boolean;
	};

	const privy = (usePrivy() as unknown) as { user?: PrivyUser };
	const privyUser = privy.user;

	const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
	const [checkingGate, setCheckingGate] = useState(false);

	const attemptGate = useCallback(async () => {
		setCheckingGate(true);
		try {
			// Hardcoded per request (was env NEXT_PUBLIC_APECHAIN_CHAIN_ID)
			const chainId = 33139;

			let allowed = false;
			for (let i = 0; i < 8; i++) {
				const res = await checkTokenGate({
					contractAddress: '0xa6babe18f2318d2880dd7da3126c19536048f8b0',
					includeDelegates: true,
					...(chainId ? { chainId } : {}),
				});
				if (res?.result) { allowed = true; break; }
				await new Promise((r) => setTimeout(r, 750));
			}
			return allowed;
		} finally {
			setCheckingGate(false);
		}
	}, [checkTokenGate]);

	const handleLogin = async () => {
		try {
			await login?.();
			// After social login, verify access via linked wallets (delegations allowed)
			const allowed = await attemptGate();
			if (!allowed) {
				// silently sign out if not a holder
				await logout?.();
			}
		} catch {
			// ignore
		}
	};

	const signedIn = !!user || !!isAuthenticated;

	// Initialize user profile on first sign-in
	useEffect(() => {
		if (!signedIn || !privyUser) return;

		const initUser = async () => {
			try {
				const userId = privyUser.id;
				const twitter = privyUser.twitter;
				
				if (!userId) return;

				// Call init-user API to create profile and award first_sign_in achievement
				await fetch('/api/auth/init-user', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId,
						displayName: twitter?.name || null,
						xUsername: twitter?.username || null,
						avatarUrl: twitter?.profilePictureUrl || null
					})
				});

				// If X account is linked, no additional gamification calls (removed)
			} catch (err) {
				console.error('Error initializing user:', err);
			}
		};

		initUser();
	}, [signedIn, privyUser]);

	// Fetch Forever Ape and avatar
	const [foreverApeId, setForeverApeId] = useState<number | null>(null);
	const [foreverApeImg, setForeverApeImg] = useState<string | null>(null);
	const [supabaseAvatar, setSupabaseAvatar] = useState<string | null>(null);
	const glyph = (useGlyph() as unknown) as {
		user?: { evmWallet?: string; smartWallet?: string };
	};
	const walletAddress = useMemo(
		() => (glyph?.user?.evmWallet || glyph?.user?.smartWallet || '').toLowerCase(),
		[glyph?.user?.evmWallet, glyph?.user?.smartWallet]
	);

	const fetchForeverApe = useCallback(async () => {
		if (!walletAddress) return;
		try {
			const res = await fetch(`/api/profile/forever-ape?address=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' });
			if (res.ok) {
				const json = await res.json();
				const apeId = typeof json.apeId === 'number' ? json.apeId : null;
				if (apeId !== null) {
					setForeverApeId(apeId);
					// Fetch ape image from CDN
					const cdnRes = await fetch(`https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/tokens.json`, { cache: 'force-cache' });
					if (cdnRes.ok) {
						const tokens = await cdnRes.json();
						const ape = tokens.find((t: { id: number }) => t.id === apeId);
						if (ape?.image) {
							setForeverApeImg(ape.image);
						}
					}
				}
			}
		} catch (err) {
			console.error('Error fetching forever ape:', err);
		}
	}, [walletAddress]);

	const fetchAvatar = useCallback(async () => {
		if (!signedIn || !privyUser) return;
		try {
			const userId = privyUser.id;
			if (!userId) return;

			const res = await fetch(`/api/profile/summary?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
			if (res.ok) {
				const json = await res.json();
				if (json?.profile?.avatar_url) {
					setSupabaseAvatar(json.profile.avatar_url);
				}
			}
		} catch (err) {
			console.error('Error fetching avatar:', err);
		}
	}, [signedIn, privyUser]);

	useEffect(() => {
		if (walletAddress) {
			fetchForeverApe();
		}
		fetchAvatar();
	}, [walletAddress, fetchForeverApe, fetchAvatar]);

	// Listen for updates
	useEffect(() => {
		if (!signedIn) return;
		const handleAvatarUpdate = () => fetchAvatar();
		const handleForeverApeUpdate = () => {
			if (walletAddress) fetchForeverApe();
		};
		window.addEventListener('avatar-updated', handleAvatarUpdate);
		window.addEventListener('forever-ape-updated', handleForeverApeUpdate);
		return () => {
			window.removeEventListener('avatar-updated', handleAvatarUpdate);
			window.removeEventListener('forever-ape-updated', handleForeverApeUpdate);
		};
	}, [signedIn, walletAddress, fetchAvatar, fetchForeverApe]);

	const profileImageUrl: string | null = useMemo(() => {
		// Priority: Forever Ape > Supabase custom avatar > Privy Twitter avatar
		if (foreverApeImg) {
			// Convert IPFS to gateway URL
			if (foreverApeImg.startsWith('ipfs://')) {
				const cid = foreverApeImg.replace('ipfs://', '');
				return `https://gateway.pinata.cloud/ipfs/${cid}`;
			}
			if (foreverApeImg.includes('/ipfs/')) {
				const idx = foreverApeImg.indexOf('/ipfs/');
				return `https://gateway.pinata.cloud${foreverApeImg.slice(idx)}`;
			}
			return foreverApeImg;
		}
		if (supabaseAvatar) return supabaseAvatar;
		const tw = privyUser?.twitter || null;
		return tw?.profilePictureUrl || null;
	}, [foreverApeImg, supabaseAvatar, privyUser]);

	if (signedIn) {
		return (
			<Link
				href={privyUser?.twitter?.username ? `/profile/${privyUser.twitter.username}` : '/profile'}
				className="inline-flex items-center justify-center"
			>
				{profileImageUrl ? (
					<SafeImage
						src={profileImageUrl}
						alt="Profile"
						width={64}
						height={64}
						className={`w-8 h-8 border-2 border-white/30 object-cover shadow-lg transition-all hover:scale-110 ${
							foreverApeImg ? 'rounded-lg' : 'rounded-full'
						}`}
						unoptimized={true}
					/>
				) : (
					<div className="w-8 h-8 rounded-full border-2 border-white/20 bg-black/30" />
				)}
			</Link>
		);
	}

	return (
		<button
			onClick={() => { void handleLogin(); }}
			className="btn-primary px-3 py-1.5 text-sm"
			disabled={isTokenGateLoading || checkingGate}
		>
			Sign in
		</button>
	);
}



