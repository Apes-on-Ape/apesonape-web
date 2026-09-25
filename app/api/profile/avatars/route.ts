import { NextRequest, NextResponse } from 'next/server';
import { apeThumb } from '@/lib/profile/avatar';
import { getSupabaseServiceClient } from '@/lib/supabase';

/** Public avatar images for known handles. No wallets or account secrets. */
export async function GET(req: NextRequest) {
	const names = [...new Set(
		(req.nextUrl.searchParams.get('usernames') || '')
			.split(',')
			.map((value) => value.trim().replace(/^@/, ''))
			.filter((value) => /^[A-Za-z0-9_]{1,20}$/.test(value)),
	)].slice(0, 40);
	if (!names.length) return NextResponse.json({ avatars: {} });

	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ avatars: {} });

	const filter = names.map((name) => `x_username.ilike.${name}`).join(',');
	const withAvatar = await supabase
		.from('user_profiles')
		.select('x_username, forever_ape_id, avatar_token_id')
		.or(filter);
	const fallback = withAvatar.error && /avatar_token_id/i.test(withAvatar.error.message)
		? await supabase.from('user_profiles').select('x_username, forever_ape_id').or(filter)
		: null;
	const people = (fallback ? fallback.data : withAvatar.data) ?? [];
	const avatars: Record<string, string | null> = {};
	for (const row of people) {
		const handle = String(row.x_username || '').replace(/^@/, '');
		const token = row.forever_ape_id != null ? Number(row.forever_ape_id) : null;
		if (handle) avatars[handle.toLowerCase()] = token != null ? apeThumb(token) : null;
	}
	return NextResponse.json({ avatars });
}
