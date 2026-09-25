import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';
import { evaluateProfileAchievements, readProfileAchievements } from '@/lib/progress/evaluate-achievements';
import { observeOwnedApes } from '@/lib/notifications/ownership';

async function allowedWallets(userId: string, connected: string[]) {
	const supabase = getSupabaseServiceClient();
	if (!supabase) return [];
	const session = [...new Set(connected.map(normalizeAliasWallet).filter(isEvmAddress))];
	const { data: profile } = await supabase
		.from('user_profiles')
		.select('wallet_address')
		.eq('glyph_user_id', userId)
		.maybeSingle();
	const profileWallet = normalizeAliasWallet(String(profile?.wallet_address ?? ''));
	const extrasAllowed = !profileWallet || session.includes(profileWallet);
	const candidates = [...new Set([...(profileWallet && isEvmAddress(profileWallet) ? [profileWallet] : []), ...(extrasAllowed ? session : [])])];
	const allowed: string[] = [];
	for (const wallet of candidates) {
		const { data: owner } = await supabase
			.from('user_profiles')
			.select('glyph_user_id')
			.ilike('wallet_address', wallet)
			.maybeSingle();
		const ownerId = String(owner?.glyph_user_id ?? '').trim();
		if (ownerId && ownerId !== userId) continue;
		allowed.push(wallet);
	}
	return allowed;
}

export async function GET(req: NextRequest) {
	const username = new URL(req.url).searchParams.get('username')?.trim().replace(/^@/, '') || '';
	if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ unlocked: 0, total: 0, achievements: [] });
	const { data } = await supabase.from('user_profiles').select('glyph_user_id').ilike('x_username', username).maybeSingle();
	const userId = String(data?.glyph_user_id ?? '').trim();
	if (!userId) return NextResponse.json({ unlocked: 0, total: 0, achievements: [] });
	const view = await readProfileAchievements(userId, undefined, { unlockedOnly: true });
	return NextResponse.json(view);
}

export async function POST(req: NextRequest) {
	let userId = '';
	try {
		userId = await verifyPrivyUserId(req.headers.get('authorization'));
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Sign in again.';
		return NextResponse.json({ error: message }, { status: 401 });
	}
	const body = (await req.json().catch(() => ({}))) as { connectedWallets?: string[] };
	const wallets = await allowedWallets(userId, body.connectedWallets ?? []);
	const [stats] = await Promise.all([
		evaluateProfileAchievements(userId, { wallets }),
		observeOwnedApes(userId, wallets),
	]);
	const view = await readProfileAchievements(userId, stats);
	return NextResponse.json(view);
}
