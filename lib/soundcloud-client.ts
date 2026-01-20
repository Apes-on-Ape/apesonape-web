/**
 * SoundCloud API Client
 * Official API integration following OAuth 2.1 with PKCE
 * Documentation: https://developers.soundcloud.com/docs
 */

const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';
const SOUNDCLOUD_API_V2_BASE = 'https://api-v2.soundcloud.com';
const SOUNDCLOUD_AUTH_BASE = 'https://api.soundcloud.com/oauth2';

export interface SoundCloudUser {
  id: number;
  username: string;
  permalink: string;
  avatar_url: string;
  followers_count: number;
  followings_count: number;
  track_count: number;
  playlist_count: number;
  public_favorites_count: number;
  reposts_count?: number;
}

export interface SoundCloudTrack {
  id: number;
  title: string;
  description: string;
  duration: number;
  permalink_url: string;
  artwork_url: string;
  playback_count: number;
  likes_count: number;
  reposts_count: number;
  user: {
    id: number;
    username: string;
  };
  stream_url: string;
  waveform_url: string;
}

export interface SoundCloudPlaylist {
  id: number;
  title: string;
  description: string;
  permalink_url: string;
  artwork_url: string;
  track_count: number;
  tracks: SoundCloudTrack[];
  duration: number;
}

export class SoundCloudClient {
  private clientId: string;
  private clientSecret?: string;

  constructor(clientId: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get user by username (public endpoint)
   */
  async getUserByUsername(username: string): Promise<SoundCloudUser | null> {
    try {
      // First resolve the username to get user ID
      const resolveUrl = `${SOUNDCLOUD_API_BASE}/resolve?url=https://soundcloud.com/${username}&client_id=${this.clientId}`;
      const resolveResponse = await fetch(resolveUrl);
      
      if (!resolveResponse.ok) {
        console.error('Failed to resolve SoundCloud user:', resolveResponse.statusText);
        return null;
      }

      const user: SoundCloudUser = await resolveResponse.json();
      return user;
    } catch (error) {
      console.error('Error fetching SoundCloud user:', error);
      return null;
    }
  }

  /**
   * Get user's tracks
   */
  async getUserTracks(userId: number, limit = 50): Promise<SoundCloudTrack[]> {
    try {
      const url = `${SOUNDCLOUD_API_BASE}/users/${userId}/tracks?client_id=${this.clientId}&limit=${limit}`;
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        console.error('Failed to fetch tracks:', response.statusText);
        return [];
      }

      const tracks: SoundCloudTrack[] = await response.json();
      return tracks;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(userId: number, limit = 20): Promise<SoundCloudPlaylist[]> {
    try {
      const url = `${SOUNDCLOUD_API_BASE}/users/${userId}/playlists?client_id=${this.clientId}&limit=${limit}`;
      const response = await fetch(url, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.error('Failed to fetch playlists:', response.statusText);
        return [];
      }

      const playlists: SoundCloudPlaylist[] = await response.json();
      return playlists;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  }

  /**
   * Get comprehensive stats for a user
   */
  async getUserStats(username: string) {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) return null;

      const tracks = await this.getUserTracks(user.id, 200);
      const playlists = await this.getUserPlaylists(user.id);

      // Calculate aggregate stats
      const totalPlays = tracks.reduce((sum, track) => sum + (track.playback_count || 0), 0);
      const totalLikes = tracks.reduce((sum, track) => sum + (track.likes_count || 0), 0);
      const totalReposts = tracks.reduce((sum, track) => sum + (track.reposts_count || 0), 0);

      return {
        followers: user.followers_count,
        tracks: user.track_count,
        playlists: user.playlist_count,
        likes: totalLikes,
        reposts: totalReposts,
        totalPlays: totalPlays,
        user,
        recentTracks: tracks.slice(0, 10),
        featuredPlaylists: playlists.slice(0, 5),
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Generate OAuth authorization URL
   * Follows OAuth 2.1 with PKCE
   */
  static generateAuthUrl(
    clientId: string,
    redirectUri: string,
    codeChallenge: string,
    state: string
  ): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'non-expiring', // Basic scope for user info
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    return `${SOUNDCLOUD_AUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{ access_token: string; refresh_token?: string } | null> {
    if (!this.clientSecret) {
      console.error('Client secret required for token exchange');
      return null;
    }

    try {
      const response = await fetch(`${SOUNDCLOUD_AUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
          code,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        console.error('Token exchange failed:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  }

  /**
   * Get authenticated user's profile
   */
  async getAuthenticatedUser(accessToken: string): Promise<SoundCloudUser | null> {
    try {
      const response = await fetch(`${SOUNDCLOUD_API_BASE}/me?oauth_token=${accessToken}`);
      
      if (!response.ok) {
        console.error('Failed to fetch authenticated user:', response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      return null;
    }
  }
}

/**
 * Helper to generate PKCE code verifier and challenge
 */
export function generatePKCE() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  
  return { codeVerifier, codeChallenge };
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function sha256(plain: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
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
