'use client';

import { useEffect } from 'react';

/**
 * PWAManager — client-only component that:
 *  1. Registers the service worker (/sw.js) for installability + offline caching
 *  2. Exposes a global helper so the music page can update the Media Session API
 *     (lock-screen / car-display controls)
 */
export default function PWAManager() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Never register the SW in development — it caches old JS bundles and
    // causes "module factory not available" HMR ghosts in the browser.
    if (process.env.NODE_ENV !== 'production') {
      // In dev, unregister any previously installed SW so stale caches are cleared.
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service worker registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
  }, []);

  return null;
}

// ── Media Session helper ──────────────────────────────────────────────────────
// Called by the music page whenever nowPlaying changes.
// Registers lock screen metadata + hardware button handlers.

export interface MediaSessionTrack {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function updateMediaSession(track: MediaSessionTrack) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist ?? 'AOA Records',
    album: track.album ?? 'Apes On Ape',
    artwork: [
      ...(track.artwork ? [{ src: track.artwork, sizes: '500x500', type: 'image/jpeg' }] : []),
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  });

  // Tell the OS whether we're playing or paused (shows correct icon on lock screen)
  navigator.mediaSession.playbackState = track.isPlaying === false ? 'paused' : 'playing';

  const noop = () => {};
  navigator.mediaSession.setActionHandler('play', track.onPlay ?? noop);
  navigator.mediaSession.setActionHandler('pause', track.onPause ?? noop);
  navigator.mediaSession.setActionHandler('nexttrack', track.onNext ?? noop);
  navigator.mediaSession.setActionHandler('previoustrack', track.onPrev ?? noop);
  // Explicitly set seekbackward/forward to null so the OS hides seek bars
  // (SoundCloud widget doesn't expose a seek API)
  try { navigator.mediaSession.setActionHandler('seekbackward', null); } catch { /* unsupported */ }
  try { navigator.mediaSession.setActionHandler('seekforward', null); } catch { /* unsupported */ }
}
