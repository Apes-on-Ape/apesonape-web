'use client';

import React, { useEffect, useState } from 'react';
import { useGlyphTokenGate } from '@use-glyph/sdk-react';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';

const APE_COLLECTION = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';

export default function HolderOnly({
	children,
	requiredQuantity = 1,
	includeDelegates = true,
}: {
	children: React.ReactNode;
	requiredQuantity?: number;
	includeDelegates?: boolean;
}) {
	const { signedIn, addresses, login } = useSessionWallets();
	const addressKey = addresses.join(',');
	const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
	const [allowed, setAllowed] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!signedIn) {
				setAllowed(false);
				setError(null);
				return;
			}
			const res = await checkTokenGate({
				contractAddress: APE_COLLECTION,
				chainId: 33139,
				quantity: requiredQuantity,
				includeDelegates,
			});
			if (cancelled) return;
			if (res.result === true) {
				setAllowed(true);
				setError(null);
				return;
			}
			if (!addresses.length) {
				setAllowed(false);
				setError(res.error && res.error !== 'User not authenticated' ? res.error : null);
				return;
			}
			try {
				const params = new URLSearchParams();
				addresses.forEach((address) => params.append('addresses', address));
				const portfolioRes = await fetch(`/api/portfolio?${params.toString()}`, { cache: 'no-store' });
				const data = await portfolioRes.json();
				const total = typeof data.total === 'number' ? data.total : (data.tokenIds?.length ?? 0);
				if (cancelled) return;
				setAllowed(total >= requiredQuantity);
				setError(null);
			} catch {
				if (!cancelled) {
					setAllowed(false);
					setError(res.error && res.error !== 'User not authenticated' ? res.error : null);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [signedIn, addressKey, checkTokenGate, requiredQuantity, includeDelegates, addresses]);

	if (allowed === null || (isTokenGateLoading && !addresses.length)) {
		return <div className="px-4 py-6 text-sm text-off-white/80">Checking holder access…</div>;
	}
	if (!allowed) {
		return (
			<div className="px-4 py-6 border border-white/10 rounded-lg glass-dark">
				<div className="mb-2 text-off-white/90 font-semibold">
					{signedIn ? 'Holders only' : 'Sign in to verify access'}
				</div>
				<p className="text-sm text-off-white/70 mb-3">
					{signedIn
						? `You need an Ape from the collection to access this page. ${error ? `(${error})` : ''}`
						: 'Connect and sign in to verify your holder status.'}
				</p>
				<div className="flex gap-3">
					{!signedIn && (
						<button
							onClick={() => { void login?.(); }}
							className="px-4 py-2 rounded-lg bg-hero-blue text-black font-semibold hover:bg-hero-blue/90 transition-colors"
						>
							Sign in
						</button>
					)}
					<a
						href="https://opensea.io/collection/apes-on-apechain"
						target="_blank"
						rel="noopener noreferrer"
						className="px-4 py-2 rounded-lg border border-white/20 text-off-white/90 hover:bg-white/10 transition-colors"
					>
						View collection
					</a>
				</div>
			</div>
		);
	}
	return <>{children}</>;
}


