import { NextRequest, NextResponse } from 'next/server';
import { notificationUser } from '@/lib/notifications/access';
import { listNotifications, unreadNotificationCount } from '@/lib/notifications/read';

const CATEGORIES = new Set(['studio', 'aoa', 'achievement', 'collection', 'arcade', 'profile', 'system']);

export async function GET(req: NextRequest) {
	const auth = await notificationUser(req);
	if ('error' in auth) return auth.error;
	const params = new URL(req.url).searchParams;
	const limit = Number(params.get('limit') ?? 8);
	const category = params.get('category')?.trim().toLowerCase() || '';
	const view = await listNotifications(auth.userId, {
		limit: Number.isFinite(limit) ? limit : 8,
		cursor: params.get('cursor'),
		unreadOnly: params.get('unread') === '1',
		category: CATEGORIES.has(category) ? category : null,
	});
	const unreadCount = await unreadNotificationCount(auth.userId);
	return NextResponse.json({ ...view, unreadCount });
}
