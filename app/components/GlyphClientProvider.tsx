'use client';

import React from 'react';
import { GLYPH_APP_LOGIN_METHOD, GlyphPrivyProvider } from '@use-glyph/sdk-react';
import { Chain } from 'viem';
import { apeChain, mainnet } from 'viem/chains';

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
						'wallet_connect',
					],
				},
			}}
		>
			{children}
		</GlyphPrivyProvider>
	);
}
