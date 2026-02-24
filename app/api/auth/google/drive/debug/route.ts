import { NextResponse } from 'next/server';

/**
 * Debug: shows the exact redirect_uri your app sends to Google.
 * Add this EXACT string to Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs
 * Delete this file when done debugging.
 */
export async function GET() {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
	const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/google/drive/callback`;
	return NextResponse.json({
		redirect_uri: redirectUri,
		instructions: 'Copy the redirect_uri above and add it EXACTLY to Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs',
	});
}
