import 'server-only';
import { getSupabaseServiceClient } from '@/lib/supabase';

export async function getStoredBadges(address: string): Promise<{ badges: string[]; analyzedAt: string | null; totalApes: number }> {
	const svc = getSupabaseServiceClient();
	if (!svc) return { badges: [], analyzedAt: null, totalApes: 0 };

	const addr = address.toLowerCase().trim();
	const { data: rows } = await svc
		.from('user_ape_badges')
		.select('badge_slug')
		.eq('address', addr);
	const badges = (rows ?? []).map((r) => r.badge_slug).filter(Boolean);

	const { data: meta } = await svc
		.from('user_ape_badges_meta')
		.select('analyzed_at, total_apes')
		.eq('address', addr)
		.maybeSingle();

	return {
		badges,
		analyzedAt: meta?.analyzed_at ?? null,
		totalApes: meta?.total_apes ?? 0,
	};
}

export async function setStoredBadges(
	address: string,
	badges: string[],
	totalApes: number
): Promise<void> {
	const svc = getSupabaseServiceClient();
	if (!svc) return;

	const addr = address.toLowerCase().trim();

	await svc.from('user_ape_badges').delete().eq('address', addr);
	if (badges.length > 0) {
		await svc.from('user_ape_badges').insert(
			badges.map((badge_slug) => ({ address: addr, badge_slug }))
		);
	}

	await svc
		.from('user_ape_badges_meta')
		.upsert(
			{ address: addr, total_apes: totalApes, analyzed_at: new Date().toISOString() },
			{ onConflict: 'address' }
		);
}
