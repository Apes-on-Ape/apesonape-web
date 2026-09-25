import { NextResponse } from 'next/server';

/**
 * Legacy gamify_notifications inbox. The active inbox is /api/notifications/inbox,
 * which is scoped to the signed-in Ape. This route no longer accepts a user id.
 */
export function GET() {
	return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
}

export function PATCH() {
	return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
}
