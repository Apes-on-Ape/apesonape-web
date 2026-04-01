'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ARCADE_WALLET_SYNC_EVENT } from '@/lib/arcade-wallet';

type Props = {
  title: string;
  src: string;
};

function buildArcadeIframeSrc(base: string): string {
  if (typeof window === 'undefined') return base;
  try {
    const u = new URL(base, window.location.origin);
    const g = localStorage.getItem('glyphUserId');
    const e = localStorage.getItem('glyphEvmWallet') || localStorage.getItem('connectedWallet');
    if (g?.trim()) u.searchParams.set('aoa_glyph_uid', g.trim());
    if (e?.trim()) u.searchParams.set('aoa_glyph_evm', e.trim().toLowerCase());
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return base;
  }
}

export default function ArcadeGameFrame({ title, src }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(src);

  useLayoutEffect(() => {
    setIframeSrc(buildArcadeIframeSrc(src));
  }, [src]);

  useEffect(() => {
    const bump = () => setIframeSrc(buildArcadeIframeSrc(src));
    window.addEventListener('aoa-glyph-user-id-sync', bump);
    window.addEventListener('aoa-glyph-arcade-sync', bump);
    window.addEventListener(ARCADE_WALLET_SYNC_EVENT, bump);
    return () => {
      window.removeEventListener('aoa-glyph-user-id-sync', bump);
      window.removeEventListener('aoa-glyph-arcade-sync', bump);
      window.removeEventListener(ARCADE_WALLET_SYNC_EVENT, bump);
    };
  }, [src]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setLoadError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setLoadError(true);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[calc(1rem-3px)] bg-black"
      style={{ aspectRatio: '16 / 10', minHeight: '65dvh' }}
    >
      <iframe
        title={title}
        src={iframeSrc}
        className="absolute inset-0 h-full w-full border-0"
        allow="fullscreen; gamepad; autoplay; clipboard-read; clipboard-write"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Loading overlay */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[#050508] transition-opacity duration-500 ease-out ${
          loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!loading}
        aria-busy={loading}
      >
        <div className="arcade-scanlines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,84,249,0.25), transparent 60%)',
          }}
          aria-hidden
        />

        <p className="arcade-subline relative z-[1]">/// {title.toUpperCase()} ///</p>

        <div className="relative z-[1] flex flex-col items-center gap-4">
          <div
            className="h-14 w-14 rounded-full border-2 border-[rgba(0,240,255,0.25)] border-t-[var(--arcade-cyan)] motion-safe:animate-spin motion-reduce:border-[var(--arcade-cyan)] motion-reduce:opacity-80"
            style={{ animationDuration: '0.85s' }}
            role="status"
            aria-label="Loading game"
          />
          <p className="arcade-title-pixel text-center text-sm sm:text-base">LOADING…</p>
          <p className="max-w-xs text-center text-xs text-[var(--text-sub)]">
            Preparing the cabinet. Large games may take a few seconds.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/90 p-6 text-center text-sm text-red-300">
          Could not load this game. Try refreshing the page or return to the lobby.
        </div>
      )}
    </div>
  );
}
