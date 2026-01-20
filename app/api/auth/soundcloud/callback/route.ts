import { NextRequest, NextResponse } from 'next/server';
import { SoundCloudClient } from '@/lib/soundcloud-client';
import { cookies } from 'next/headers';

const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SOUNDCLOUD_CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const SOUNDCLOUD_REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI || 'http://localhost:3000/api/auth/soundcloud/callback';

/**
 * Handle SoundCloud OAuth callback
 * Documentation: https://developers.soundcloud.com/docs#authentication
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle authorization errors
    if (error) {
      console.error('SoundCloud auth error:', error);
      return NextResponse.redirect(
        new URL(`/music?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/music?error=missing_code', request.url)
      );
    }

    // Verify state to prevent CSRF
    const cookieStore = cookies();
    const storedState = cookieStore.get('sc_state')?.value;
    const codeVerifier = cookieStore.get('sc_code_verifier')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/music?error=invalid_state', request.url)
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/music?error=missing_verifier', request.url)
      );
    }

    if (!SOUNDCLOUD_CLIENT_ID || !SOUNDCLOUD_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/music?error=server_config', request.url)
      );
    }

    // Exchange code for access token
    const client = new SoundCloudClient(SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET);
    const tokenData = await client.exchangeCodeForToken(
      code,
      codeVerifier,
      SOUNDCLOUD_REDIRECT_URI
    );

    if (!tokenData || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL('/music?error=token_exchange_failed', request.url)
      );
    }

    // Get user profile
    const user = await client.getAuthenticatedUser(tokenData.access_token);

    if (!user) {
      return NextResponse.redirect(
        new URL('/music?error=profile_fetch_failed', request.url)
      );
    }

    // Store access token in httpOnly cookie
    cookieStore.set('sc_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Store user info in a separate cookie (not httpOnly so client can read it)
    cookieStore.set('sc_user', JSON.stringify({
      id: user.id,
      username: user.username,
      avatar: user.avatar_url,
      permalink: user.permalink,
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Clear temporary cookies
    cookieStore.delete('sc_state');
    cookieStore.delete('sc_code_verifier');

    // Redirect back to music page with success
    return NextResponse.redirect(
      new URL('/music?auth=success', request.url)
    );

  } catch (error) {
    console.error('Error in SoundCloud callback:', error);
    return NextResponse.redirect(
      new URL('/music?error=callback_error', request.url)
    );
  }
}
