'use client';

import { useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';

type GlyphUser = {
	id?: string;
	evmWallet?: string;
	smartWallet?: string;
	linkedWallets?: Array<{ address?: string }>;
};

type LinkedAccount = { type?: string; address?: string; chainType?: string };

function addAddress(set: Set<string>, value?: string | null) {
	const normalized = (value || '').trim().toLowerCase();
	if (normalized.startsWith('0x') && normalized.length === 42) set.add(normalized);
}

/** Wallets from a Glyph session or a direct wallet sign-in. */
export function useSessionWallets() {
	const glyph = useGlyph();
	const privy = usePrivy();
	const { wallets } = useWallets();
	const glyphUser = (glyph.user ?? null) as GlyphUser | null;

	const addresses = useMemo(() => {
		const set = new Set<string>();
		addAddress(set, glyphUser?.evmWallet);
		addAddress(set, glyphUser?.smartWallet);
		for (const wallet of glyphUser?.linkedWallets ?? []) addAddress(set, wallet?.address);

		const linked = (privy.user?.linkedAccounts ?? []) as LinkedAccount[];
		for (const account of linked) {
			if (account.type === 'wallet' && account.chainType !== 'solana') addAddress(set, account.address);
		}
		for (const wallet of wallets) addAddress(set, wallet.address);

		return Array.from(set);
	}, [glyphUser, privy.user, wallets]);

	const userId = (privy.user?.id || glyphUser?.id || '').trim();
	const signedIn = !!glyphUser || glyph.authenticated || privy.authenticated;

	return {
		signedIn,
		userId,
		addresses,
		primaryAddress: addresses[0] ?? '',
		login: glyph.login,
		logout: glyph.logout,
	};
}
