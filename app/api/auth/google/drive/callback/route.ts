import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'drive_oauth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get('code');
	const state = req.nextUrl.searchParams.get('state') || 'profile';

	if (!code) {
		return NextResponse.redirect(
			new URL('/profile?drive_error=no_code', req.url)
		);
	}

	const clientId = process.env.GOOGLE_CLIENT_ID;
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return NextResponse.redirect(
			new URL('/profile?drive_error=config', req.url)
		);
	}

	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
	const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/drive/callback`;

	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code',
		}),
	});

	if (!tokenRes.ok) {
		const err = await tokenRes.text();
		console.error('Drive OAuth token error:', err);
		return NextResponse.redirect(
			new URL('/profile?drive_error=token', req.url)
		);
	}

	const tokenData = (await tokenRes.json()) as {
		access_token?: string;
		refresh_token?: string;
		expires_in?: number;
	};

	if (!tokenData.access_token) {
		return NextResponse.redirect(
			new URL('/profile?drive_error=token', req.url)
		);
	}

	const expiry = Date.now() + (tokenData.expires_in || 3600) * 1000 - 60000;
	const payload = JSON.stringify({
		access_token: tokenData.access_token,
		refresh_token: tokenData.refresh_token || '',
		expiry,
	});

	const response = NextResponse.redirect(new URL(`/${state}`, req.url));
	response.cookies.set(COOKIE_NAME, payload, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: COOKIE_MAX_AGE,
		path: '/',
	});

	return response;
}
