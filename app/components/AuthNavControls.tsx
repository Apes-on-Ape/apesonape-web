'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useGlyph, useGlyphTokenGate } from '@use-glyph/sdk-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, isAddress } from 'viem';
import { apeChain } from 'viem/chains';
import SafeImage from './SafeImage';

const APE_CONTRACT = '0xa6babe18f2318d2880dd7da3126c19536048f8b0' as const;

const apeClient = createPublicClient({ chain: apeChain, transport: http() });

const balanceOfAbi = [
	{
		type: 'function',
		name: 'balanceOf',
		stateMutability: 'view',
		inputs: [{ name: 'owner', type: 'address' }],
		outputs: [{ name: 'balance', type: 'uint256' }],
	},
] as const;

type GlyphUser = { id?: string; evmWallet?: string; smartWallet?: string };
type PrivyTwitter = { name?: string; username?: string; profilePictureUrl?: string };
type LinkedAccount = { type?: string; address?: string; chainType?: string };
type PrivyUser = { id?: string; twitter?: PrivyTwitter; linkedAccounts?: LinkedAccount[] };

async function addressHoldsApe(address: string): Promise<boolean> {
	if (!isAddress(address)) return false;
	try {
		const balance = await apeClient.readContract({
			address: APE_CONTRACT,
			abi: balanceOfAbi,
			functionName: 'balanceOf',
			args: [address],
		});
		return balance > BigInt(0);
	} catch {
		return false;
	}
}

export default function AuthNavControls() {
	const { login, logout, user, authenticated } = useGlyph();

	const privy = usePrivy();
	const privyUser = privy.user as PrivyUser | null | undefined;
	const { wallets } = useWallets();
	const sessionRef = useRef({ user: user as GlyphUser | null, privyUser, wallets });
	sessionRef.current = { user: user as GlyphUser | null, privyUser, wallets };

	const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
	const [checkingGate, setCheckingGate] = useState(false);

	const attemptGate = useCallback(async () => {
		setCheckingGate(true);
		try {
			const res = await checkTokenGate({
				contractAddress: APE_CONTRACT,
				includeDelegates: true,
				chainId: 33139,
			});
			return !!res?.result;
		} finally {
			setCheckingGate(false);
		}
	}, [checkTokenGate]);

	const connectedWalletHoldsApe = useCallback(async () => {
		const { user: glyphUser, privyUser: currentPrivyUser, wallets: currentWallets } = sessionRef.current;
		const addresses = new Set<string>();
		if (glyphUser?.evmWallet) addresses.add(glyphUser.evmWallet);
		if (glyphUser?.smartWallet) addresses.add(glyphUser.smartWallet);
		for (const account of currentPrivyUser?.linkedAccounts ?? []) {
			if (account.type === 'wallet' && account.address && account.chainType !== 'solana') {
				addresses.add(account.address);
			}
		}
		for (const wallet of currentWallets) {
			if (wallet.address) addresses.add(wallet.address);
		}
		for (const address of addresses) {
			if (await addressHoldsApe(address)) return true;
		}
		return false;
	}, []);

	const handleLogin = async () => {
		try {
			await login?.();
			const after = sessionRef.current;
			const signedInNow = !!after.user || !!after.privyUser;
			if (!signedInNow) return;

			let allowed = false;
			for (let i = 0; i < 12 && !allowed; i++) {
				allowed = (await attemptGate()) || (await connectedWalletHoldsApe());
				if (!allowed) await new Promise((r) => setTimeout(r, 1000));
			}
			if (allowed) return;

			const { user: glyphUser, privyUser: currentPrivyUser, wallets: currentWallets } = sessionRef.current;
			const hasWallet = Boolean(
				glyphUser?.evmWallet ||
				glyphUser?.smartWallet ||
				currentWallets.some((wallet) => wallet.address) ||
				currentPrivyUser?.linkedAccounts?.some((account) => account.type === 'wallet' && account.address && account.chainType !== 'solana')
			);
			// A PWA has no browser-extension wallet. Leave the session open so Rabby can be connected.
			if (!hasWallet) return;
			await logout?.();
		} catch {
			// ignore
		}
	};

	const signedIn = !!user || authenticated;

	// Initialize user profile on first sign-in
	useEffect(() => {
		if (!signedIn || !privyUser) return;

		const initUser = async () => {
			try {
				const userId = privyUser.id;
				const twitter = privyUser.twitter;
				
				if (!userId) return;

				// Call init-user API to create profile and award first_sign_in achievement
				const token = await privy.getAccessToken?.();
				await fetch('/api/auth/init-user', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify({
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
	const walletAddress = useMemo(() => {
		const glyphUser = user as GlyphUser | null;
		const fromGlyph = glyphUser?.evmWallet || glyphUser?.smartWallet;
		if (fromGlyph) return fromGlyph.toLowerCase();
		const linked = privyUser?.linkedAccounts?.find(
			(account) => account.type === 'wallet' && account.address && account.chainType !== 'solana'
		);
		if (linked?.address) return linked.address.toLowerCase();
		return (wallets[0]?.address || '').toLowerCase();
	}, [user, privyUser, wallets]);

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

	const [configuredAvatar, setConfiguredAvatar] = useState<string | null>(null);

	useEffect(() => {
		if (!signedIn || !privyUser?.id) return;
		let cancelled = false;
		(async () => {
			const token = await privy.getAccessToken?.();
			if (!token) return;
			const response = await fetch('/api/profile/identity?lite=1', {
				headers: { Authorization: `Bearer ${token}` },
				cache: 'no-store',
			});
			const json = await response.json().catch(() => ({}));
			if (!cancelled && response.ok) setConfiguredAvatar(json.avatarUrl || null);
		})();
		return () => {
			cancelled = true;
		};
	}, [signedIn, privyUser?.id, foreverApeId, supabaseAvatar]);

	const profileImageUrl: string | null = useMemo(() => {
		if (configuredAvatar) return configuredAvatar;
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
	}, [configuredAvatar, foreverApeImg, supabaseAvatar, privyUser]);

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
			className="aoa-connect"
			disabled={isTokenGateLoading || checkingGate}
		>
			Sign in
		</button>
	);
}



