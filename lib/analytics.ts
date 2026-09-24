/**
 * AOA Analytics — typed event definitions.
 *
 * All functions are no-ops unless a provider is wired in.
 * To add tracking, replace the TODO block inside `track()` with
 * your chosen analytics provider (Plausible, PostHog, Vercel Analytics, etc.).
 *
 * Event catalogue:
 *  - listen_click         User clicks Listen / play on homepage or nav
 *  - artist_view          Artist profile page viewed
 *  - release_view         A release / album is opened
 *  - session_view         An AOA Session page is viewed
 *  - join_click           User clicks "Join the movement" anywhere
 *  - open_mic_start       User opens the Open Mic submit flow
 *  - open_mic_submit      User attempts to submit (currently disabled)
 *  - discord_click        User clicks any Discord link
 *  - spotify_click        User clicks any Spotify link
 *  - soundcloud_click     User clicks any SoundCloud link
 *  - ape_collection_view  Collection page viewed
 *  - wallet_connect_start User initiates wallet connection
 *  - wallet_connect_success Wallet connection completed
 *  - story_view           Story / about page viewed
 */

export type AnalyticsEvent =
  | 'listen_click'
  | 'artist_view'
  | 'release_view'
  | 'session_view'
  | 'join_click'
  | 'open_mic_start'
  | 'open_mic_submit'
  | 'discord_click'
  | 'spotify_click'
  | 'soundcloud_click'
  | 'ape_collection_view'
  | 'wallet_connect_start'
  | 'wallet_connect_success'
  | 'story_view';

export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

/**
 * Track a named event with optional properties.
 * Currently a no-op — wire a provider here when ready.
 */
export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  // TODO: Replace with your analytics provider, e.g.:
  // if (typeof window !== 'undefined' && window.plausible) {
  //   window.plausible(event, { props: properties });
  // }
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, properties ?? '');
  }
}

/**
 * Convenience: fire an event on a link click without blocking navigation.
 * Wrap anchor onClick with this.
 */
export function trackClick(event: AnalyticsEvent, properties?: AnalyticsProperties) {
  return () => track(event, properties);
}
