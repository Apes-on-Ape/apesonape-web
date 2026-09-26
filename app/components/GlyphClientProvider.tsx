'use client';

import React from 'react';
import { GLYPH_APP_LOGIN_METHOD, GlyphPrivyProvider } from '@use-glyph/sdk-react';
import { Chain } from 'viem';
import { apeChain, mainnet } from 'viem/chains';

const GLYPH_WALLET_LOG = '__aoaGlyphWalletLog';

/**
 * Glyph's Privy strategy logs this with console.error when a signed-in
 * session has no embedded wallet yet. Next's dev overlay treats that as a crash.
 * Login and the holder gate are unchanged.
 */
if (typeof window !== 'undefined') {
	const current = console.error as typeof console.error & { [GLYPH_WALLET_LOG]?: boolean };
	if (!current[GLYPH_WALLET_LOG]) {
		const original = console.error.bind(console);
		const wrapped = ((...args: unknown[]) => {
			const text = args.map((arg) => (typeof arg === 'string' ? arg : '')).join(' ');
			if (text.includes('GlyphWidget/PrivyStrategy') && text.includes('user has no wallet')) return;
			original(...args);
		}) as typeof console.error & { [GLYPH_WALLET_LOG]?: boolean };
		wrapped[GLYPH_WALLET_LOG] = true;
		console.error = wrapped;
	}
}

export default function GlyphClientProvider({ children }: { children: React.ReactNode }) {
	// Hardcoded per request (was env NEXT_PUBLIC_GLYPH_PRIVY_APP_ID)
	const appId = 'cmit1t84p00nllb0c3yzjz8d8';
	const supportedChains: [Chain, ...Chain[]] = [apeChain, mainnet];

	// Glyph replaces a missing loginMethodsAndOrder with Glyph-only.
	// Set it here so the Sign in modal also offers email, social, and wallets.
	return (
		<GlyphPrivyProvider
			appId={appId}
			chains={supportedChains}
			config={{
				embeddedWallets: {
					ethereum: { createOnLogin: 'off' },
					solana: { createOnLogin: 'off' },
				},
				supportedChains,
				defaultChain: apeChain,
				appearance: {
					theme: 'dark',
					accentColor: '#0054F9',
					landingHeader: 'Sign in',
					walletChainType: 'ethereum-only',
					walletList: [
						'detected_ethereum_wallets',
						'rabby_wallet',
						'metamask',
						'coinbase_wallet',
						'rainbow',
						'wallet_connect',
					],
				},
				loginMethods: [
					GLYPH_APP_LOGIN_METHOD as `privy:${string}`,
					'wallet',
					'email',
					'google',
					'twitter',
					'discord',
				],
				loginMethodsAndOrder: {
					primary: [
						'detected_ethereum_wallets',
						'rabby_wallet',
						'wallet_connect',
						GLYPH_APP_LOGIN_METHOD,
						'email',
						'google',
					],
					overflow: [
						'twitter',
						'discord',
						'metamask',
						'coinbase_wallet',
						'rainbow',
					],
				},
			}}
		>
			{children}
		</GlyphPrivyProvider>
	);
}
