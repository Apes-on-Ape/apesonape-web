import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';
import { allowedWallets } from '@/lib/profile/linked-wallets';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';

export async function GET(req: NextRequest) {
	let userId = '';
	try {
		userId = await verifyPrivyUserId(req.headers.get('authorization'));
	} catch {
		return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
	}
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Public links are unavailable.' }, { status: 503 });
	const connected = new URL(req.url).searchParams.getAll('wallet');
	const wallets = await allowedWallets(userId, connected);
	const [{ data: profile }, { data: visibility }, { data: publicRows }, { data: aliases }] = await Promise.all([
		supabase.from('user_profiles').select('x_username').eq('glyph_user_id', userId).maybeSingle(),
		supabase.from('user_profile_public_links').select('show_x').eq('user_id', userId).maybeSingle(),
		supabase.from('user_public_wallets').select('wallet_address_normalized').eq('user_id', userId),
		supabase.from('user_wallet_aliases').select('wallet_address_normalized, alias').eq('user_id', userId),
	]);
	const publicSet = new Set((publicRows ?? []).map((row) => normalizeAliasWallet(String(row.wallet_address_normalized))));
	const aliasByWallet = new Map((aliases ?? []).map((row) => [normalizeAliasWallet(String(row.wallet_address_normalized)), String(row.alias)]));
	return NextResponse.json({
		xHandle: profile?.x_username ? String(profile.x_username).replace(/^@/, '') : null,
		showX: Boolean(visibility?.show_x),
		wallets: wallets.map((address) => ({
			address,
			alias: aliasByWallet.get(address) ?? null,
			isPublic: publicSet.has(address),
		})),
	});
}

export async function PUT(req: NextRequest) {
	let userId = '';
	try {
		userId = await verifyPrivyUserId(req.headers.get('authorization'));
	} catch {
		return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
	}
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Public links are unavailable.' }, { status: 503 });
	const body = (await req.json().catch(() => ({}))) as { showX?: boolean; publicWallets?: string[]; connectedWallets?: string[] };
	const allowed = new Set(await allowedWallets(userId, body.connectedWallets ?? []));
	const requested = [...new Set((body.publicWallets ?? []).map(normalizeAliasWallet).filter(isEvmAddress))];
	if (requested.some((wallet) => !allowed.has(wallet))) {
		return NextResponse.json({ error: 'That wallet is not linked to this ape.' }, { status: 403 });
	}

	const visibility = await supabase.from('user_profile_public_links').upsert({
		user_id: userId,
		show_x: Boolean(body.showX),
		updated_at: new Date().toISOString(),
	}, { onConflict: 'user_id' });
	if (visibility.error) return NextResponse.json({ error: visibility.error.message }, { status: 500 });

	const cleared = await supabase.from('user_public_wallets').delete().eq('user_id', userId);
	if (cleared.error) return NextResponse.json({ error: cleared.error.message }, { status: 500 });
	if (requested.length) {
		const inserted = await supabase.from('user_public_wallets').insert(requested.map((address) => ({
			user_id: userId,
			wallet_address_normalized: address,
		})));
		if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
	}
	return NextResponse.json({ ok: true });
}
