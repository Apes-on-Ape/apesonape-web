import { NextRequest, NextResponse } from 'next/server';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export async function GET(req: NextRequest) {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 });
	}
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
	const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/drive/callback`;
	const state = req.nextUrl.searchParams.get('state') || 'profile';
	const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	authUrl.searchParams.set('client_id', clientId);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', SCOPES.join(' '));
	authUrl.searchParams.set('access_type', 'offline');
	authUrl.searchParams.set('prompt', 'consent');
	authUrl.searchParams.set('state', state);
	return NextResponse.redirect(authUrl.toString());
}
