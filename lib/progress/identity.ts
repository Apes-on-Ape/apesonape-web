import { getSupabaseServiceClient } from '@/lib/supabase';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';

/**
 * Resolves the Ape's canonical glyph_user_id.
 * A linked wallet uses the profile that already owns that address, not a second user id.
 */
export async function resolveCanonicalUserId(input: { claimedIds: string[]; creatorAddress: string }): Promise<string | null> {
	const supabase = getSupabaseServiceClient();
	const claimed = [...new Set(input.claimedIds.map((id) => id.trim()).filter(Boolean))];
	const wallet = normalizeAliasWallet(input.creatorAddress);
	if (!supabase) return claimed[0] ?? null;

	let walletOwner = '';
	if (isEvmAddress(wallet)) {
		const { data } = await supabase
			.from('user_profiles')
			.select('glyph_user_id')
			.ilike('wallet_address', wallet)
			.maybeSingle();
		walletOwner = String(data?.glyph_user_id ?? '').trim();
	}

	let claimedOwner = '';
	if (claimed.length) {
		const { data } = await supabase
			.from('user_profiles')
			.select('glyph_user_id')
			.in('glyph_user_id', claimed)
			.limit(1);
		claimedOwner = String(data?.[0]?.glyph_user_id ?? '').trim();
	}

	if (walletOwner && claimedOwner && walletOwner !== claimedOwner) {
		console.error(JSON.stringify({
			scope: 'studio-identity',
			event: 'wallet_profile_mismatch',
			walletOwner,
			claimedOwner,
		}));
		return walletOwner;
	}

	return walletOwner || claimedOwner || claimed[0] || null;
}
