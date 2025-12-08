'use client';

import React, { useEffect, useState } from 'react';
import { useGlyph, useGlyphTokenGate } from '@use-glyph/sdk-react';

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
	const glyph = (useGlyph() as unknown) as {
		user?: unknown;
		address?: string;
		isAuthenticated?: boolean;
		login?: () => Promise<void>;
	};
	const isSignedIn = !!(
		glyph &&
		(glyph.user || glyph.address || glyph.isAuthenticated)
	);
	const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
	const [allowed, setAllowed] = useState<boolean | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			// Require sign-in before checking; skip call if not authenticated
			if (!isSignedIn) {
				setAllowed(false);
				setError(null);
				return;
			}
			const res = await checkTokenGate({
				contractAddress: APE_COLLECTION,
				// Hardcoded per request (was env NEXT_PUBLIC_APECHAIN_CHAIN_ID)
				chainId: 33139,
				quantity: requiredQuantity,
				includeDelegates,
			});
			if (cancelled) return;
			if (res.error) {
				setError(res.error);
				setAllowed(false);
			} else {
				setAllowed(res.result === true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isSignedIn, checkTokenGate, requiredQuantity, includeDelegates]);

	if (allowed === null || isTokenGateLoading) {
		return <div className="px-4 py-6 text-sm text-off-white/80">Checking holder access…</div>;
	}
	if (!allowed) {
		return (
			<div className="px-4 py-6 border border-white/10 rounded-lg glass-dark">
				<div className="mb-2 text-off-white/90 font-semibold">
					{isSignedIn ? 'Holders only' : 'Sign in to verify access'}
				</div>
				<p className="text-sm text-off-white/70 mb-3">
					{isSignedIn
						? `You need an Ape from the collection to access this page. ${error ? `(${error})` : ''}`
						: 'Connect and sign in to verify your holder status.'}
				</p>
				<div className="flex gap-3">
					{!isSignedIn && (
						<button
							onClick={() => { void glyph?.login?.(); }}
							className="px-4 py-2 rounded-lg bg-hero-blue text-black font-semibold hover:bg-hero-blue/90 transition-colors"
						>
							Sign in
						</button>
					)}
					<a
						href={`https://opensea.io/assets/ethereum/${APE_COLLECTION}`}
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


