import { NextResponse } from 'next/server';
import { allowedWallets } from '@/lib/profile/linked-wallets';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';
import { getSupabaseServiceClient } from '@/lib/supabase';

export class ApeAuthError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export type AuthenticatedApe = {
	userId: string;
	wallets: string[];
	displayName: string | null;
	handle: string | null;
	primaryWallet: string | null;
};

/**
 * The signed-in Ape. `userId` comes only from the verified Privy access token.
 * Wallets are the profile wallet, saved aliases, and hinted session wallets that
 * are not already owned by a different Ape. A hinted wallet is never authority
 * for who the caller is.
 */
export async function requireAuthenticatedApe(req: Request, hintedWallets: string[] = [], linkedWallets: string[] = []): Promise<AuthenticatedApe> {
	let userId = '';
	try {
		userId = await verifyPrivyUserId(req.headers.get('authorization'));
	} catch {
		throw new ApeAuthError('Sign in again.', 401);
	}
	if (!userId) throw new ApeAuthError('Sign in again.', 401);

	const supabase = getSupabaseServiceClient();
	if (!supabase) throw new ApeAuthError('Profile is unavailable.', 503);

	const { data: profile, error } = await supabase
		.from('user_profiles')
		.select('display_name, x_username, wallet_address')
		.eq('glyph_user_id', userId)
		.maybeSingle();
	if (error) throw new ApeAuthError('Profile is unavailable.', 503);

	const stored: string[] = [];
	const aliasQuery = await supabase.from('user_wallet_aliases').select('wallet_address_normalized').eq('user_id', userId);
	if (!aliasQuery.error) {
		for (const row of aliasQuery.data ?? []) {
			const wallet = normalizeAliasWallet(String(row.wallet_address_normalized));
			if (isEvmAddress(wallet)) stored.push(wallet);
		}
	}

	const wallets = await allowedWallets(userId, hintedWallets, [...stored, ...linkedWallets]);
	const primary = normalizeAliasWallet(String(profile?.wallet_address ?? ''));
	return {
		userId,
		wallets,
		displayName: profile?.display_name?.trim() || null,
		handle: profile?.x_username ? String(profile.x_username).replace(/^@/, '') : null,
		primaryWallet: isEvmAddress(primary) ? primary : wallets[0] ?? null,
	};
}

export function authFailure(error: unknown) {
	if (error instanceof ApeAuthError) {
		return NextResponse.json({ error: error.message }, { status: error.status });
	}
	return null;
}

export function retiredRoute() {
	return NextResponse.json({ error: 'This endpoint is no longer available.' }, { status: 410 });
}

/** Creation belongs to this Ape. Historical rows may only have a creator address. */
export function creationOwnedBy(
	ape: AuthenticatedApe,
	creation: { creatorAddress?: string; glyphProfile?: { glyphId?: string } | null },
) {
	const storedUser = (creation.glyphProfile?.glyphId || '').trim();
	if (storedUser && storedUser === ape.userId) return true;
	if (storedUser && storedUser !== ape.userId) return false;
	const address = (creation.creatorAddress || '').toLowerCase();
	return Boolean(address) && ape.wallets.includes(address);
}
