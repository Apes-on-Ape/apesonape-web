import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'drive_oauth';

export async function GET() {
	const cookieStore = await cookies();
	const cookie = cookieStore.get(COOKIE_NAME);
	if (!cookie?.value) {
		return NextResponse.json({ connected: false });
	}
	try {
		const data = JSON.parse(cookie.value) as { refresh_token?: string };
		return NextResponse.json({ connected: !!data.refresh_token });
	} catch {
		return NextResponse.json({ connected: false });
	}
}
