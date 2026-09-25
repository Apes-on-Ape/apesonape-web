import { NextRequest, NextResponse } from 'next/server';
import { notificationUser } from '@/lib/notifications/access';
import { getSupabaseServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const auth = await notificationUser(req);
	if ('error' in auth) return auth.error;
	const { id } = await context.params;
	if (!id) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
	const supabase = getSupabaseServiceClient();
	if (!supabase) return NextResponse.json({ error: 'Notifications are unavailable.' }, { status: 503 });
	const { data, error } = await supabase.from('user_notifications').select('id, user_id, read_at').eq('id', id).maybeSingle();
	if (error || !data || String(data.user_id) !== auth.userId) {
		return NextResponse.json({ error: 'Not found.' }, { status: 404 });
	}
	if (!data.read_at) {
		const update = await supabase.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', auth.userId);
		if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
	}
	return NextResponse.json({ ok: true });
}
