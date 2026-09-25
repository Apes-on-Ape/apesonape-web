'use client';

import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import StationHeader from '@/app/components/music/StationHeader';
import NowTransmitting from '@/app/components/music/NowTransmitting';
import ReleaseShelf from '@/app/components/music/ReleaseShelf';
import ArtistRoster from '@/app/components/music/ArtistRoster';
import RecordArchive from '@/app/components/music/RecordArchive';
import TopSignals from '@/app/components/music/TopSignals';
import StationClose from '@/app/components/music/StationClose';
import {
  FALLBACK_PLAYLISTS,
  loadStationStats,
  withShelf,
  type RankedTrack,
  type StationPlaylist,
} from '@/app/components/music/catalogue';
import { artistsWithReleases } from '@/app/data/artists';
import { sameRadioUrl } from '@/lib/aoa-radio';
import type { SoundcloudStatsPayload } from '@/app/data/stats';

export default function RadioPage() {
  const [playlists, setPlaylists] = useState<StationPlaylist[]>([]);
  const [catalogueReady, setCatalogueReady] = useState(false);
  const [payload, setPayload] = useState<SoundcloudStatsPayload | null>(null);
  const [completePlays, setCompletePlays] = useState<number | null>(null);
  const [topTracks, setTopTracks] = useState<RankedTrack[]>([]);
  const [offline, setOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/soundcloud/playlists')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { playlists?: Array<{ id: string | number; title?: string; permalink?: string; permalink_url?: string; trackCount?: number; track_count?: number; artwork?: string }> } | null) => {
        if (cancelled) return;
        const rows = data?.playlists?.map((playlist) => ({
          id: String(playlist.id),
          title: playlist.title || 'Untitled',
          url: playlist.permalink || playlist.permalink_url || '',
          trackCount: playlist.trackCount || playlist.track_count || 0,
          artwork: playlist.artwork || undefined,
        })) ?? [];
        const source = rows.length > 0 ? rows : FALLBACK_PLAYLISTS;
        fetch('/api/soundcloud/latest-playlist')
          .then((response) => (response.ok ? response.json() : null))
          .then((latest: { url?: string; title?: string; trackCount?: number } | null) => {
            if (cancelled) return;
            const next = [...source];
            if (latest?.url) {
              const index = next.findIndex((playlist) => sameRadioUrl(playlist.url, latest.url));
              if (index > 0) {
                const [item] = next.splice(index, 1);
                next.unshift(item);
              } else if (index < 0 && latest.title) {
                next.unshift({
                  id: 'latest',
                  title: latest.title,
                  url: latest.url,
                  trackCount: latest.trackCount || 0,
                });
              }
            }
            setPlaylists(withShelf(next));
            setCatalogueReady(true);
          })
          .catch(() => {
            if (!cancelled) {
              setPlaylists(withShelf(source));
              setCatalogueReady(true);
            }
          });
      })
      .catch(() => {
        if (!cancelled) {
          setPlaylists(withShelf(FALLBACK_PLAYLISTS));
          setCatalogueReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadStationStats().then((result) => {
      if (cancelled) return;
      setPayload(result.payload);
      setCompletePlays(result.completePlays);
      setTopTracks(result.topTracks);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const artistCount = artistsWithReleases(playlists.map((playlist) => ({ title: playlist.title, url: playlist.url }))).length;

  return (
    <div className="overflow-x-clip text-[var(--ink)]">
      {offline ? (
        <p className="aoa-meta border-b border-[rgba(225,6,0,0.4)] bg-[var(--live-dim)] px-4 py-3 text-center text-[var(--ink)]">
          You&apos;re offline. Playback needs a connection.
        </p>
      ) : null}
      {installPrompt ? (
        <div className="border-b border-[rgba(243,238,228,0.12)] px-4 py-3 text-center">
          <button
            type="button"
            className="aoa-meta text-[var(--signal)]"
            onClick={async () => {
              await installPrompt.prompt();
              setInstallPrompt(null);
            }}
          >
            Install the station
          </button>
        </div>
      ) : null}
      <StationHeader payload={payload} completePlays={completePlays} artistCount={artistCount} />
      <NowTransmitting />
      {catalogueReady ? (
        <>
          <ReleaseShelf playlists={playlists} />
          <ArtistRoster playlists={playlists} />
          <RecordArchive playlists={playlists} />
        </>
      ) : (
        <p className="aoa-meta container-premium py-10">Tuning the catalogue.</p>
      )}
      <TopSignals tracks={topTracks} />
      <StationClose />
      <Footer />
    </div>
  );
}
