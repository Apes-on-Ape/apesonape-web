import { NextRequest, NextResponse } from 'next/server';
import { notificationUser } from '@/lib/notifications/access';
import { getSupabaseServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
	const auth = await notificationUser(req);
	if ('error' in auth) return auth.error;
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Notifications are unavailable.' }, { status: 503 });
	const { error } = await supabase
		.from('user_notifications')
		.update({ read_at: new Date().toISOString() })
		.eq('user_id', auth.userId)
		.is('read_at', null);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
}
