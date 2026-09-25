import { getSupabaseServiceClient } from '@/lib/supabase';

export type NotificationCard = {
	id: string;
	type: string;
	category: string;
	title: string;
	message: string;
	actionLabel: string | null;
	actionUrl: string | null;
	aoa: number | null;
	readAt: string | null;
	createdAt: string;
};

type Row = {
	id: string;
	type: string;
	category: string;
	title: string;
	message: string;
	action_label: string | null;
	action_url: string | null;
	metadata: { aoa?: number } | null;
	read_at: string | null;
	created_at: string;
};

function missingTable(error: { code?: string; message?: string } | null) {
	const message = error?.message ?? '';
	return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('Could not find the table') || message.includes('user_notifications');
}

function toCard(row: Row): NotificationCard {
	const aoa = Math.floor(Number(row.metadata?.aoa ?? 0));
	return {
		id: String(row.id),
		type: row.type,
		category: row.category,
		title: row.title,
		message: row.message,
		actionLabel: row.action_label,
		actionUrl: row.action_url,
		aoa: aoa > 0 ? aoa : null,
		readAt: row.read_at,
		createdAt: row.created_at,
	};
}

export async function unreadNotificationCount(userId: string) {
	const supabase = getSupabaseServiceClient();
	if (!supabase || !userId) return 0;
	const { count, error } = await supabase
		.from('user_notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('read_at', null);
	if (error) {
		if (!missingTable(error)) console.error(JSON.stringify({ scope: 'notifications', event: 'count_failed', reason: error.message }));
		return 0;
	}
	return count ?? 0;
}

export async function listNotifications(userId: string, options: { limit: number; cursor?: string | null; unreadOnly?: boolean; category?: string | null }) {
	const supabase = getSupabaseServiceClient();
	const limit = Math.min(50, Math.max(1, options.limit));
	if (!supabase || !userId) return { notifications: [] as NotificationCard[], nextCursor: null as string | null };
	let query = supabase
		.from('user_notifications')
		.select('id, type, category, title, message, action_label, action_url, metadata, read_at, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(limit + 1);
	if (options.unreadOnly) query = query.is('read_at', null);
	if (options.category) query = query.eq('category', options.category);
	if (options.cursor) {
		const [createdAt, id] = options.cursor.split('|');
		if (/^\d{4}-\d{2}-\d{2}T/.test(createdAt) && /^[0-9a-f-]{36}$/i.test(id)) {
			query = query.or(`created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt.${id})`);
		}
	}
	const { data, error } = await query;
	if (error) {
		if (!missingTable(error)) console.error(JSON.stringify({ scope: 'notifications', event: 'list_failed', reason: error.message }));
		return { notifications: [], nextCursor: null };
	}
	const rows = (data ?? []) as Row[];
	const page = rows.slice(0, limit).map(toCard);
	const last = page[page.length - 1];
	const nextCursor = rows.length > limit && last ? `${last.createdAt}|${last.id}` : null;
	return { notifications: page, nextCursor };
}
