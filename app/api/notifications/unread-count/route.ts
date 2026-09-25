import { NextRequest, NextResponse } from 'next/server';
import { notificationUser } from '@/lib/notifications/access';
import { unreadNotificationCount } from '@/lib/notifications/read';

export async function GET(req: NextRequest) {
	const auth = await notificationUser(req);
	if ('error' in auth) return auth.error;
	const count = await unreadNotificationCount(auth.userId);
	return NextResponse.json({ count });
}
