'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGlyph, useGlyphTokenGate } from '@use-glyph/sdk-react';

export default function ExtraLinks() {
	// Client-only add-ons for nav: show Tools + Arcade for holders/signed-in
	const glyph = (useGlyph() as unknown) as {
		user?: unknown;
		address?: string;
		isAuthenticated?: boolean;
	};
	const isSignedIn = !!(
		glyph &&
		((glyph.user) ||
			(glyph.address) ||
			(glyph.isAuthenticated))
	);

	const { checkTokenGate } = useGlyphTokenGate();
	const [hasAccess, setHasAccess] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!isSignedIn) { setHasAccess(false); return; }
			// Hardcoded per request (was env NEXT_PUBLIC_APECHAIN_CHAIN_ID)
			const chainId = 33139;
			const res = await checkTokenGate({
				contractAddress: '0xa6babe18f2318d2880dd7da3126c19536048f8b0',
				includeDelegates: true,
				...(chainId ? { chainId } : {}),
			});
			if (!cancelled) setHasAccess(!!res?.result);
		})();
		return () => { cancelled = true; };
	}, [isSignedIn, checkTokenGate]);

	const pathname = usePathname();
	
	const isActive = (href: string) => {
		if (href === '/') {
			return pathname === '/';
		}
		return pathname?.startsWith(href);
	};

	if (!isSignedIn || !hasAccess) return null;
	
	return (
		<>
			<Link 
				href="/creative" 
				className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:text-hero-blue"
				style={!isActive('/creative') ? { color: 'rgba(245, 245, 245, 1)' } : undefined}
			>
				Tools
				{isActive('/creative') && (
					<motion.div
						className="absolute -bottom-1 left-2 right-2 h-0.5 bg-hero-blue rounded-full"
						layoutId="activeIndicator"
						initial={false}
						transition={{ type: 'spring', stiffness: 380, damping: 30 }}
					/>
				)}
			</Link>
			<a
				href="https://arcade.apesonape.io"
				target="_blank"
				rel="noopener noreferrer"
				className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:text-hero-blue"
				style={{ color: 'rgba(245, 245, 245, 1)' }}
			>
				Arcade
			</a>
		</>
	);
}
