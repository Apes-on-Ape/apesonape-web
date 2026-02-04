import { NextRequest, NextResponse } from 'next/server';
import { SoundCloudClient } from '@/lib/soundcloud-client';
import { cookies } from 'next/headers';

// Use Node.js runtime for cookie support
export const runtime = 'nodejs';

const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const SOUNDCLOUD_REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI || 'http://localhost:3000/api/auth/soundcloud/callback';

/**
 * Initiate SoundCloud OAuth flow
 * Documentation: https://developers.soundcloud.com/docs#authentication
 */
export async function GET(request: NextRequest) {
  try {
    if (!SOUNDCLOUD_CLIENT_ID) {
      return NextResponse.redirect(
        new URL('/music?auth=error&reason=missing_client_id', request.url)
      );
    }

    // Generate PKCE challenge (OAuth 2.1 requirement)
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Generate state for CSRF protection
    const state = generateRandomString(32);

    // Store code verifier and state in httpOnly cookies
    const cookieStore = await cookies();
    cookieStore.set('sc_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    cookieStore.set('sc_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    // Verify credentials look valid (basic check)
    if (SOUNDCLOUD_CLIENT_ID.length < 20) {
      return NextResponse.redirect(
        new URL('/music?auth=error&reason=invalid_credentials', request.url)
      );
    }

    // Generate authorization URL
    const authUrl = SoundCloudClient.generateAuthUrl(
      SOUNDCLOUD_CLIENT_ID,
      SOUNDCLOUD_REDIRECT_URI,
      codeChallenge,
      state
    );

    // Redirect user to SoundCloud authorization page
    return NextResponse.redirect(authUrl);

  } catch (error) {
    return NextResponse.redirect(
      new URL('/music?auth=error&reason=server_error', request.url)
    );
  }
}

// Helper functions for PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(hash);
}

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
