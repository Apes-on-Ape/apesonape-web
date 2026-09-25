import { getSupabaseServiceClient } from '@/lib/supabase';

export { aoaMetadata } from './rules';

export const NOTIFICATION_CATEGORIES = ['studio', 'aoa', 'achievement', 'collection', 'arcade', 'profile', 'system'] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationInput = {
	userId: string;
	type: string;
	category: NotificationCategory;
	title: string;
	message: string;
	actionLabel?: string | null;
	actionUrl?: string | null;
	referenceType?: string | null;
	referenceId?: string | null;
	metadata?: Record<string, unknown> | null;
	dedupeKey: string;
};

export type NotificationResult = {
	created: boolean;
	duplicate?: boolean;
	id?: string;
	reason?: string;
};

function missingTable(error: { code?: string; message?: string } | null) {
	const message = error?.message ?? '';
	return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('Could not find the table') || message.includes('user_notifications');
}

/**
 * Inserts one notification for the canonical Ape.
 * A repeated dedupe key is a no-op. Does not throw into the calling event.
 */
export async function createNotification(input: NotificationInput): Promise<NotificationResult> {
	const userId = input.userId.trim();
	const dedupeKey = input.dedupeKey.trim();
	const title = input.title.trim();
	const message = input.message.trim();
	if (!userId || !dedupeKey || !title || !message || !input.type.trim()) {
		return { created: false, reason: 'invalid' };
	}
	if (!NOTIFICATION_CATEGORIES.includes(input.category)) {
		return { created: false, reason: 'invalid' };
	}

	const supabase = getSupabaseServiceClient();
	if (!supabase) return { created: false, reason: 'not_configured' };

	const metadata = { ...(input.metadata ?? {}) };
	if ('aoa' in metadata && !(Number(metadata.aoa) > 0)) delete metadata.aoa;

	const { data, error } = await supabase
		.from('user_notifications')
		.insert({
			user_id: userId,
			type: input.type.trim(),
			category: input.category,
			title,
			message,
			action_label: input.actionLabel?.trim() || null,
			action_url: input.actionUrl?.trim() || null,
			reference_type: input.referenceType?.trim() || null,
			reference_id: input.referenceId?.trim() || null,
			metadata,
			dedupe_key: dedupeKey,
		})
		.select('id')
		.maybeSingle();

	if (error) {
		if (error.code === '23505') return { created: false, duplicate: true };
		if (!missingTable(error)) {
			console.error(JSON.stringify({ scope: 'notifications', event: 'insert_failed', userId, dedupeKey, reason: error.message }));
		}
		return { created: false, reason: error.message };
	}
	return { created: true, id: data?.id ? String(data.id) : undefined };
}
