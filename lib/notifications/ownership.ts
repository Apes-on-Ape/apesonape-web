import { magicEdenAPI } from '@/lib/magic-eden';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { createNotification } from './create';
import { tokenIdsToAnnounce } from './rules';

const APE_CONTRACT = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';

function shortWallet(address: string) {
	if (address.length < 10) return address;
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function missingTable(error: { code?: string; message?: string } | null) {
	const message = error?.message ?? '';
	return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('Could not find the table');
}

/**
 * Records current AOA ownership for one Ape.
 * The first successful scan is a baseline and creates no notifications.
 * A token already observed for this Ape is not announced again, including
 * when it moves between that Ape's linked wallets.
 * Selling and later buying the same token does not send a second "new Ape" notice.
 */
export async function observeOwnedApes(userId: string, wallets: string[]) {
	try {
		await observeOwnedApesInner(userId, wallets);
	} catch (error) {
		console.error(JSON.stringify({ scope: 'notifications', event: 'ownership_failed', reason: error instanceof Error ? error.message : 'unknown' }));
	}
}

async function observeOwnedApesInner(userId: string, wallets: string[]) {
	const id = userId.trim();
	const unique = [...new Set(wallets.map(normalizeAliasWallet).filter(isEvmAddress))];
	if (!id || unique.length === 0) return;

	const supabase = getSupabaseServiceClient();
	if (!supabase) return;

	const scans = await Promise.all(unique.map(async (wallet) => {
		try {
			const ids = await magicEdenAPI.getWalletTokenIds(wallet);
			return { wallet, ids, ok: true as const };
		} catch {
			return { wallet, ids: [] as number[], ok: false as const };
		}
	}));
	if (scans.some((scan) => !scan.ok)) return;

	const current = new Map<number, string>();
	for (const scan of scans) {
		for (const tokenId of scan.ids) {
			if (!Number.isInteger(tokenId) || tokenId < 0) continue;
			if (!current.has(tokenId)) current.set(tokenId, scan.wallet);
		}
	}

	const baseline = await supabase.from('user_ownership_baselines').select('user_id').eq('user_id', id).maybeSingle();
	if (baseline.error) {
		if (!missingTable(baseline.error)) {
			console.error(JSON.stringify({ scope: 'notifications', event: 'baseline_read_failed', userId: id, reason: baseline.error.message }));
		}
		return;
	}

	const known = await supabase.from('user_owned_ape_observations').select('token_id, wallet_address').eq('user_id', id);
	if (known.error) {
		if (!missingTable(known.error)) {
			console.error(JSON.stringify({ scope: 'notifications', event: 'observation_read_failed', userId: id, reason: known.error.message }));
		}
		return;
	}
	const seen = new Map((known.data ?? []).map((row) => [Number(row.token_id), String(row.wallet_address)]));

	if (!baseline.data) {
		const rows = [...current.entries()].map(([tokenId, wallet]) => ({
			user_id: id,
			token_id: tokenId,
			wallet_address: wallet,
		}));
		for (let index = 0; index < rows.length; index += 200) {
			const { error } = await supabase.from('user_owned_ape_observations').upsert(rows.slice(index, index + 200), { onConflict: 'user_id,token_id', ignoreDuplicates: true });
			if (error) {
				console.error(JSON.stringify({ scope: 'notifications', event: 'baseline_insert_failed', userId: id, reason: error.message }));
				return;
			}
		}
		const { error } = await supabase.from('user_ownership_baselines').insert({ user_id: id });
		if (error && error.code !== '23505') {
			console.error(JSON.stringify({ scope: 'notifications', event: 'baseline_insert_failed', userId: id, reason: error.message }));
		}
		return;
	}

	const [{ data: profile }, { data: aliases }] = await Promise.all([
		supabase.from('user_profiles').select('wallet_address').eq('glyph_user_id', id).maybeSingle(),
		supabase.from('user_wallet_aliases').select('wallet_address_normalized, alias').eq('user_id', id),
	]);
	const profileWallet = normalizeAliasWallet(String(profile?.wallet_address ?? ''));
	const aliasByWallet = new Map((aliases ?? []).map((row) => [normalizeAliasWallet(String(row.wallet_address_normalized)), String(row.alias)]));

	const announce = new Set(tokenIdsToAnnounce(true, [...seen.keys()], [...current.keys()]));
	for (const [tokenId, wallet] of current) {
		const previousWallet = seen.get(tokenId);
		if (previousWallet) {
			if (normalizeAliasWallet(previousWallet) !== wallet) {
				await supabase
					.from('user_owned_ape_observations')
					.update({ wallet_address: wallet, last_seen_at: new Date().toISOString() })
					.eq('user_id', id)
					.eq('token_id', tokenId);
			}
			continue;
		}
		const { error } = await supabase.from('user_owned_ape_observations').insert({
			user_id: id,
			token_id: tokenId,
			wallet_address: wallet,
		});
		if (error) {
			if (error.code !== '23505') {
				console.error(JSON.stringify({ scope: 'notifications', event: 'observation_insert_failed', userId: id, tokenId, reason: error.message }));
			}
			continue;
		}
		if (!announce.has(tokenId)) continue;
		const alias = aliasByWallet.get(wallet);
		const where = alias || (wallet === profileWallet ? 'Main wallet' : shortWallet(wallet));
		await createNotification({
			userId: id,
			type: 'ape_detected',
			category: 'collection',
			title: 'New Ape detected',
			message: `Ape #${tokenId} was detected in ${where}.`,
			actionLabel: 'View Ape',
			actionUrl: `/collection/${tokenId}/`,
			referenceType: 'ape',
			referenceId: String(tokenId),
			metadata: { tokenId, walletAddress: wallet, walletLabel: where },
			dedupeKey: `ape-detected:${APE_CONTRACT}:${tokenId}:${id}`,
		});
	}
}
