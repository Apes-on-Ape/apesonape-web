import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { isEvmAddress, normalizeAliasWallet, parseWalletAlias } from '@/lib/profile/wallet-alias';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';
import { createNotification } from '@/lib/notifications/create';

function missingTable(error: { code?: string; message?: string } | null) {
	const message = error?.message ?? '';
	return error?.code === '42P01' || message.includes('user_wallet_aliases');
}

async function authorizedUser(req: NextRequest) {
	try {
		return await verifyPrivyUserId(req.headers.get('authorization'));
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Sign in again to name this wallet.';
		return { error: message };
	}
}

async function walletAllowed(userId: string, wallet: string, connected: string[]) {
	const supabase = getSupabaseServiceClient();
	if (!supabase) return { ok: false as const, status: 500, error: 'supabase missing' };

	const { data: profile, error: profileError } = await supabase
		.from('user_profiles')
		.select('wallet_address')
		.eq('glyph_user_id', userId)
		.maybeSingle();
	if (profileError) return { ok: false as const, status: 500, error: profileError.message };
	if (!profile) return { ok: false as const, status: 403, error: 'Profile not found for this session.' };

	const profileWallet = normalizeAliasWallet(String(profile.wallet_address ?? ''));
	const session = connected.map(normalizeAliasWallet).filter(isEvmAddress);
	const ownsProfileWallet = profileWallet === wallet;
	const sessionIncludesProfile = !profileWallet || session.includes(profileWallet);
	const sessionIncludesTarget = session.includes(wallet);

	if (!ownsProfileWallet && !(sessionIncludesTarget && sessionIncludesProfile)) {
		return { ok: false as const, status: 403, error: 'That wallet is not connected to this profile.' };
	}

	const { data: owner } = await supabase
		.from('user_profiles')
		.select('glyph_user_id')
		.ilike('wallet_address', wallet)
		.maybeSingle();
	const ownerId = String(owner?.glyph_user_id ?? '').trim();
	if (ownerId && ownerId !== userId) {
		return { ok: false as const, status: 403, error: 'That wallet belongs to another ape.' };
	}

	return { ok: true as const, supabase, walletAddress: profile.wallet_address ? String(profile.wallet_address) : wallet };
}

export async function GET(req: NextRequest) {
	const address = normalizeAliasWallet(new URL(req.url).searchParams.get('address') || '');
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'supabase missing' }, { status: 500 });

	if (address && !req.headers.get('authorization')) {
		if (!isEvmAddress(address)) return NextResponse.json({ alias: null });
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('glyph_user_id')
			.ilike('wallet_address', address)
			.maybeSingle();
		const userId = String(profile?.glyph_user_id ?? '').trim();
		if (!userId) return NextResponse.json({ alias: null });
		const { data, error } = await supabase
			.from('user_wallet_aliases')
			.select('alias')
			.eq('user_id', userId)
			.eq('wallet_address_normalized', address)
			.maybeSingle();
		if (error) {
			if (missingTable(error)) return NextResponse.json({ alias: null });
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ alias: data?.alias ?? null });
	}

	const user = await authorizedUser(req);
	if (typeof user !== 'string') return NextResponse.json({ error: user.error }, { status: 401 });

	const { data, error } = await supabase
		.from('user_wallet_aliases')
		.select('wallet_address_normalized, alias')
		.eq('user_id', user);
	if (error) {
		if (missingTable(error)) return NextResponse.json({ aliases: [] });
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	return NextResponse.json({
		aliases: (data ?? []).map((row) => ({
			walletAddress: String(row.wallet_address_normalized),
			alias: String(row.alias),
		})),
	});
}

export async function PUT(req: NextRequest) {
	const user = await authorizedUser(req);
	if (typeof user !== 'string') return NextResponse.json({ error: user.error }, { status: 401 });

	const body = (await req.json().catch(() => ({}))) as {
		walletAddress?: string;
		alias?: string | null;
		connectedWallets?: string[];
	};
	const wallet = normalizeAliasWallet(body.walletAddress || '');
	if (!isEvmAddress(wallet)) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
	if (body.alias == null || body.alias === '') {
		return clearAlias(user, wallet, body.connectedWallets ?? []);
	}

	const parsed = parseWalletAlias(body.alias);
	if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

	const allowed = await walletAllowed(user, wallet, body.connectedWallets ?? []);
	if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status });

	const existing = await allowed.supabase
		.from('user_wallet_aliases')
		.select('wallet_address_normalized')
		.eq('user_id', user)
		.eq('wallet_address_normalized', wallet)
		.maybeSingle();
	const now = new Date().toISOString();
	const { error } = await allowed.supabase.from('user_wallet_aliases').upsert(
		{
			user_id: user,
			wallet_address: wallet,
			wallet_address_normalized: wallet,
			alias: parsed.alias,
			updated_at: now,
		},
		{ onConflict: 'user_id,wallet_address_normalized' },
	);
	if (error) {
		if (missingTable(error)) {
			return NextResponse.json({ error: 'Wallet names are not available until the alias table is created.' }, { status: 503 });
		}
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	if (!existing.error && !existing.data) {
		const short = `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
		await createNotification({
			userId: user,
			type: 'wallet_linked',
			category: 'profile',
			title: 'Wallet linked',
			message: `${parsed.alias} · ${short}`,
			actionLabel: 'View profile',
			actionUrl: '/profile/',
			referenceType: 'wallet',
			referenceId: wallet,
			dedupeKey: `wallet-linked:${wallet}:${user}`,
		});
	}
	return NextResponse.json({ walletAddress: wallet, alias: parsed.alias });
}

export async function DELETE(req: NextRequest) {
	const user = await authorizedUser(req);
	if (typeof user !== 'string') return NextResponse.json({ error: user.error }, { status: 401 });
	const body = (await req.json().catch(() => ({}))) as { walletAddress?: string; connectedWallets?: string[] };
	const wallet = normalizeAliasWallet(body.walletAddress || '');
	if (!isEvmAddress(wallet)) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
	return clearAlias(user, wallet, body.connectedWallets ?? []);
}

async function clearAlias(userId: string, wallet: string, connected: string[]) {
	const allowed = await walletAllowed(userId, wallet, connected);
	if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status });
	const { error } = await allowed.supabase
		.from('user_wallet_aliases')
		.delete()
		.eq('user_id', userId)
		.eq('wallet_address_normalized', wallet);
	if (error) {
		if (missingTable(error)) return NextResponse.json({ walletAddress: wallet, alias: null });
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	return NextResponse.json({ walletAddress: wallet, alias: null });
}
