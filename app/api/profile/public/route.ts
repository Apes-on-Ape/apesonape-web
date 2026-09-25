import { NextRequest, NextResponse } from 'next/server';
import { ARTISTS } from '@/app/data/artists';
import { magicEdenAPI } from '@/lib/magic-eden';
import { getOpenSeaProfileUrl } from '@/lib/opensea';
import { apeThumb, resolveAvatarToken } from '@/lib/profile/avatar';
import { xProfileUrl } from '@/lib/profile/identity';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';
import { getSupabaseServiceClient } from '@/lib/supabase';

function artistForHandle(handle: string) {
	const key = handle.replace(/^@/, '').trim().toLowerCase();
	return ARTISTS.find((artist) => (artist.profileUsername || artist.handle).replace(/^@/, '').trim().toLowerCase() === key) ?? null;
}

export async function GET(req: NextRequest) {
	const username = new URL(req.url).searchParams.get('username')?.trim().replace(/^@/, '') || '';
	if (!/^[A-Za-z0-9_]{1,20}$/.test(username)) {
		return NextResponse.json({ error: 'Ape not found.' }, { status: 404 });
	}
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Profile is unavailable.' }, { status: 503 });

	let profileQuery = await supabase
		.from('user_profiles')
		.select('glyph_user_id, display_name, x_username, forever_ape_id, wallet_address, avatar_token_id')
		.ilike('x_username', username)
		.maybeSingle();
	if (profileQuery.error && /avatar_token_id/i.test(profileQuery.error.message)) {
		profileQuery = await supabase
			.from('user_profiles')
			.select('glyph_user_id, display_name, x_username, forever_ape_id, wallet_address')
			.ilike('x_username', username)
			.maybeSingle();
	}
	const { data: profile, error } = profileQuery;
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	if (!profile?.glyph_user_id) return NextResponse.json({ error: 'Ape not found.' }, { status: 404 });

	const userId = String(profile.glyph_user_id);
	const handle = String(profile.x_username || username).replace(/^@/, '').trim();
	const [{ data: visibility }, { data: publicWallets }, { data: aliases }, { data: namedWallets }, studio] = await Promise.all([
		supabase.from('user_profile_public_links').select('show_x').eq('user_id', userId).maybeSingle(),
		supabase.from('user_public_wallets').select('wallet_address_normalized').eq('user_id', userId),
		supabase.from('user_wallet_aliases').select('wallet_address_normalized, alias').eq('user_id', userId),
		supabase.from('user_wallet_aliases').select('wallet_address_normalized').eq('user_id', userId),
		supabase.from('studio_creations').select('id', { count: 'exact', head: true }).filter('glyph_profile->>xHandle', 'ilike', handle),
	]);

	const aliasByWallet = new Map((aliases ?? []).map((row) => [normalizeAliasWallet(String(row.wallet_address_normalized)), String(row.alias)]));
	const opensea = (publicWallets ?? [])
		.map((row) => normalizeAliasWallet(String(row.wallet_address_normalized)))
		.filter(isEvmAddress)
		.map((address) => ({
			alias: aliasByWallet.get(address) ?? null,
			address,
			url: getOpenSeaProfileUrl(address),
		}));

	const aggregate = new Set<string>();
	const primary = normalizeAliasWallet(String(profile.wallet_address ?? ''));
	if (isEvmAddress(primary)) aggregate.add(primary);
	for (const row of namedWallets ?? []) {
		const wallet = normalizeAliasWallet(String(row.wallet_address_normalized));
		if (isEvmAddress(wallet)) aggregate.add(wallet);
	}
	const publicSet = new Set(opensea.map((wallet) => wallet.address));

	async function tokensFor(wallets: string[]) {
		const ids = new Set<number>();
		await Promise.all(wallets.map(async (wallet) => {
			try {
				for (const id of await magicEdenAPI.getWalletTokenIds(wallet)) ids.add(id);
			} catch {
				/* one wallet failing does not hide the rest */
			}
		}));
		return ids;
	}

	const [allTokens, publicTokens] = await Promise.all([
		tokensFor([...aggregate]),
		tokensFor([...publicSet]),
	]);
	const tokenIds = publicTokens;

	const artist = artistForHandle(handle);
	const showX = Boolean(visibility?.show_x);
	const storedAvatar = profile && 'avatar_token_id' in profile && profile.avatar_token_id != null ? Number(profile.avatar_token_id) : null;
	const foreverApe = profile.forever_ape_id != null ? Number(profile.forever_ape_id) : null;
	const avatarToken = resolveAvatarToken(storedAvatar, foreverApe, tokenIds);
	const hasStudio = (studio.count ?? 0) > 0 || (studio.data?.length ?? 0) > 0;

	return NextResponse.json({
		username: handle,
		displayName: profile.display_name?.trim() || handle,
		foreverApe,
		avatarToken,
		avatarUrl: avatarToken != null ? apeThumb(avatarToken) : null,
		apeCount: allTokens.size,
		tokenIds: [...tokenIds].sort((a, b) => a - b).slice(0, 240),
		publicLinks: {
			x: showX ? { handle, url: xProfileUrl(handle) } : null,
			opensea,
			studio: hasStudio ? `/studio/creator/${encodeURIComponent(handle)}/` : null,
			artist: artist ? { name: artist.name, url: `/artist/${artist.slug}/` } : null,
		},
	});
}
