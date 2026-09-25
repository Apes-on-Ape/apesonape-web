import { getSupabaseServiceClient } from '@/lib/supabase';
import { magicEdenAPI } from '@/lib/magic-eden';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';

/** Wallets this Ape may manage: profile wallet, saved linked wallets, and session wallets not owned by another profile. */
export async function allowedWallets(userId: string, connected: string[], linked: string[] = []) {
	const supabase = getSupabaseServiceClient();
	if (!supabase) return [];
	const session = [...new Set(connected.map(normalizeAliasWallet).filter(isEvmAddress))];
	const linkedWallets = [...new Set(linked.map(normalizeAliasWallet).filter(isEvmAddress))];
	const { data: profile } = await supabase.from('user_profiles').select('wallet_address').eq('glyph_user_id', userId).maybeSingle();
	const profileWallet = normalizeAliasWallet(String(profile?.wallet_address ?? ''));
	const extrasAllowed = !profileWallet || session.includes(profileWallet);
	const candidates = [...new Set([
		...(profileWallet && isEvmAddress(profileWallet) ? [profileWallet] : []),
		...linkedWallets,
		...(extrasAllowed ? session : []),
	])];
	const allowed: string[] = [];
	for (const wallet of candidates) {
		const { data: owner } = await supabase.from('user_profiles').select('glyph_user_id').ilike('wallet_address', wallet).maybeSingle();
		const ownerId = String(owner?.glyph_user_id ?? '').trim();
		if (ownerId && ownerId !== userId) continue;
		allowed.push(wallet);
	}
	return allowed;
}

export async function ownedApeIds(wallets: string[]) {
	const ids = new Set<number>();
	await Promise.all(wallets.map(async (wallet) => {
		try {
			for (const id of await magicEdenAPI.getWalletTokenIds(wallet)) ids.add(id);
		} catch {
			/* one wallet failing does not clear the others */
		}
	}));
	return [...ids].sort((a, b) => a - b);
}
