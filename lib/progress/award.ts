import { getSupabaseServiceClient } from '@/lib/supabase';
import { getLevelFromAoa } from './levels';

export type AwardAoaInput = {
	userId: string;
	source: 'studio' | 'arcade' | 'achievement' | 'streak' | 'activity' | 'legacy';
	action: string;
	referenceId?: string | null;
	amount: number;
	dedupeKey: string;
	metadata?: Record<string, unknown> | null;
	dailyCap?: number | null;
};

export type AwardAoaResult = {
	awarded: boolean;
	duplicate?: boolean;
	capped?: boolean;
	totalAoa?: number;
	level?: number;
	reason?: string;
};

/**
 * One server-side grant. Amount and dedupe key are chosen by the caller
 * from server config, never from a client body field named aoa.
 */
export async function awardAoa(input: AwardAoaInput): Promise<AwardAoaResult> {
	const userId = input.userId.trim();
	const amount = Math.floor(input.amount);
	const dedupeKey = input.dedupeKey.trim();
	if (!userId || !dedupeKey || !input.action.trim() || amount <= 0) {
		return { awarded: false, reason: 'invalid' };
	}

	const supabase = getSupabaseServiceClient();
	if (!supabase) return { awarded: false, reason: 'not_configured' };

	const { data, error } = await supabase.rpc('award_aoa', {
		p_user_id: userId,
		p_source: input.source,
		p_action: input.action,
		p_reference_id: input.referenceId ?? null,
		p_amount: amount,
		p_dedupe_key: dedupeKey,
		p_metadata: input.metadata ?? {},
		p_daily_cap: input.dailyCap ?? null,
	});

	if (error) {
		console.error('[awardAoa]', error.message);
		return { awarded: false, reason: error.message };
	}

	const row = (data ?? {}) as { awarded?: boolean; duplicate?: boolean; capped?: boolean; total_aoa?: number };
	const total = typeof row.total_aoa === 'number' ? row.total_aoa : undefined;
	return {
		awarded: !!row.awarded,
		duplicate: !!row.duplicate,
		capped: !!row.capped,
		totalAoa: total,
		level: typeof total === 'number' ? getLevelFromAoa(total) : undefined,
	};
}
