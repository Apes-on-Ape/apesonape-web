import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/profile/privy-access-token';

export async function notificationUser(req: NextRequest) {
	try {
		const userId = await verifyPrivyUserId(req.headers.get('authorization'));
		return { userId };
	} catch (error) {
		const raw = error instanceof Error ? error.message : '';
		const message = raw.includes('name this wallet') || !raw ? 'Sign in again.' : raw;
		return { error: NextResponse.json({ error: message }, { status: 401 }) };
	}
}
