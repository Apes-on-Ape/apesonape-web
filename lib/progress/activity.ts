import { getSupabaseServiceClient } from '@/lib/supabase';

export type ActivityInput = {
	userId: string;
	source: string;
	action: string;
	referenceId?: string | null;
	dedupeKey: string;
	metadata?: Record<string, unknown>;
	occurredAt?: string;
};

export type ActivityResult = {
	recorded: boolean;
	duplicate?: boolean;
	reason?: string;
};

function logActivityFailure(input: ActivityInput, reason: string) {
	console.error(JSON.stringify({
		scope: 'user-activity',
		event: 'record_failed',
		userId: input.userId,
		source: input.source,
		action: input.action,
		referenceId: input.referenceId ?? null,
		dedupeKey: input.dedupeKey,
		reason,
	}));
}

/** Writes one verified action. Unique dedupe_key makes retries a no-op. Does not award AOA. */
export async function recordUserActivity(input: ActivityInput): Promise<ActivityResult> {
	const userId = input.userId.trim();
	const dedupeKey = input.dedupeKey.trim();
	if (!userId || !dedupeKey || !input.source.trim() || !input.action.trim()) {
		logActivityFailure(input, 'invalid');
		return { recorded: false, reason: 'invalid' };
	}

	const supabase = getSupabaseServiceClient();
	if (!supabase) {
		logActivityFailure(input, 'service_role_missing');
		return { recorded: false, reason: 'service_role_missing' };
	}

	const { error } = await supabase.from('user_activity_events').insert({
		user_id: userId,
		source: input.source,
		action: input.action,
		reference_id: input.referenceId ?? null,
		dedupe_key: dedupeKey,
		metadata: input.metadata ?? {},
		occurred_at: input.occurredAt ?? new Date().toISOString(),
	});

	if (!error) return { recorded: true };
	if (error.code === '23505') return { recorded: true, duplicate: true };
	logActivityFailure(input, error.message);
	return { recorded: false, reason: error.message };
}
