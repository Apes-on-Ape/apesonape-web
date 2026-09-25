import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';

function shortAddress(address: string) {
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function maskDid(did: string) {
	const id = did.replace(/^did:privy:/, '');
	if (id.length < 10) return 'did:privy:…';
	return `did:privy:${id.slice(0, 4)}…${id.slice(-4)}`;
}

/** Read-only check: which stored Privy profile owns each wallet the signed-in Ape is looking at. */
export async function GET(req: NextRequest) {
	let userId = '';
	try {
		userId = await verifyPrivyUserId(req.headers.get('authorization'));
	} catch {
		return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
	}

	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Profile store is unavailable.' }, { status: 500 });

	const requested = (req.nextUrl.searchParams.get('wallets') || '')
		.split(',')
		.map((value) => value.trim().toLowerCase())
		.filter((value) => /^0x[a-f0-9]{40}$/.test(value))
		.slice(0, 8);

	const { data: self } = await supabase
		.from('user_profiles')
		.select('wallet_address, x_username')
		.eq('glyph_user_id', userId)
		.maybeSingle();

	const wallets = new Set(requested);
	if (self?.wallet_address) wallets.add(String(self.wallet_address).toLowerCase());

	const results = [];
	for (const address of wallets) {
		const { data: owner } = await supabase
			.from('user_profiles')
			.select('glyph_user_id, x_username')
			.ilike('wallet_address', address)
			.maybeSingle();
		const ownerId = owner?.glyph_user_id ? String(owner.glyph_user_id) : '';
		const handle = owner?.x_username ? String(owner.x_username).replace(/^@/, '') : null;
		const sameUser = ownerId === userId;
		results.push({
			address,
			shortAddress: shortAddress(address),
			maskedDid: ownerId ? maskDid(ownerId) : null,
			hasX: Boolean(handle),
			xUsername: handle,
			sameUser,
			separateIdentity: Boolean(ownerId) && !sameUser,
			relation: !ownerId ? 'no stored identity' : sameUser ? 'this identity' : 'separate identity',
		});
	}

	const currentHandle = self?.x_username ? String(self.x_username).replace(/^@/, '') : null;
	const otherX = results.find((row) => row.separateIdentity && row.hasX);
	return NextResponse.json({
		currentPrivyDidMasked: maskDid(userId),
		currentStoredX: currentHandle,
		conflict: results.some((row) => row.separateIdentity),
		xOnOtherIdentity: otherX ? { handle: otherX.xUsername, shortAddress: otherX.shortAddress } : null,
		note: 'AOA profile records only. Privy remains the authority for which wallets are actually linked. Nothing was unlinked or merged.',
		wallets: results,
	});
}
