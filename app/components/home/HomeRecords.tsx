'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SectionMarker from '@/app/components/signal/SectionMarker';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import { artistsWithReleases } from '@/app/data/artists';
import { HOMEPAGE_STATS, readHomepageStat, type SoundcloudStatsPayload } from '@/app/data/stats';
import { dispatchRadioCommand, sameRadioUrl } from '@/lib/aoa-radio';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';

type Playlist = {
  id: string;
  title: string;
  permalink: string;
  artwork: string;
  trackCount: number;
};

type ScStats = SoundcloudStatsPayload;

export default function HomeRecords() {
  const radio = useAoaRadioState();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<ScStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/soundcloud/playlists')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { playlists?: Playlist[] } | null) => {
        if (cancelled || !data?.playlists) return;
        const rows = data.playlists
          .filter((playlist) => playlist.title?.trim())
          .slice(0, 3);
        setPlaylists(rows);
      })
      .catch(() => {
        /* leave the shelf empty */
      });

    fetch('/api/soundcloud/stats')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ScStats | null) => {
        if (!cancelled && data && !('error' in data)) setStats(data);
      })
      .catch(() => {
        /* omit the numbers */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const artists = artistsWithReleases(playlists.map((playlist) => ({ title: playlist.title }))).slice(0, 6);
  const figures = HOMEPAGE_STATS.map((def) => ({
    id: def.id,
    label: def.label,
    value: readHomepageStat(def, stats),
  })).filter((figure) => figure.value);

  return (
    <section className="scroll-mt-[var(--aoa-header-h)] border-t border-[rgba(243,238,228,0.12)]">
      <div className="container-premium section-spacing">
        <SectionMarker index="02" title="AOA Records" />
        <p className="aoa-meta mt-3">The sound of ApeChain.</p>

        {radio.playing && radio.title ? (
          <div className="mt-8 flex flex-wrap items-center gap-3 border border-[rgba(0,84,250,0.35)] bg-[var(--signal-dim)] px-4 py-3">
            <LiveIndicator label="ON AIR" />
            <p className="min-w-0 flex-1 text-sm text-[var(--ink)]">
              <span className="line-clamp-2 break-words">{radio.title}</span>
            </p>
          </div>
        ) : null}

        {figures.length > 0 ? (
          <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.id} className="min-w-0">
                <dd className="type-section text-[var(--ink)]">{figure.value}</dd>
                <dt className="aoa-meta mt-1">{figure.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}

        {playlists.length > 0 ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {playlists.map((playlist) => {
              const onAir = radio.playing && sameRadioUrl(radio.playlistUrl, playlist.permalink);
              return (
                <li key={playlist.id} className="min-w-0">
                  <article className="flex h-full flex-col border border-[rgba(243,238,228,0.12)] bg-[var(--background-card)]">
                    <div className="relative aspect-square bg-[var(--signal-dim)]">
                      {playlist.artwork ? (
                        <img
                          src={playlist.artwork}
                          alt=""
                          width={500}
                          height={500}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="aoa-meta text-[var(--signal)]">AOA</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="line-clamp-2 break-words text-base font-semibold text-[var(--ink)]">
                        {playlist.title}
                      </h3>
                      {playlist.trackCount > 0 ? (
                        <p className="aoa-meta">{playlist.trackCount} tracks</p>
                      ) : null}
                      <div className="mt-auto flex flex-wrap gap-2">
                        {playlist.permalink ? (
                          <button
                            type="button"
                            className="aoa-home-cta aoa-home-cta-solid"
                            onClick={() =>
                              dispatchRadioCommand(
                                onAir
                                  ? { type: 'pause' }
                                  : {
                                      type: 'load',
                                      url: playlist.permalink,
                                      play: true,
                                      title: playlist.title,
                                    },
                              )
                            }
                          >
                            {onAir ? 'Pause' : 'Play'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : null}

        {artists.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
            {artists.map((artist) => (
              <li key={artist.slug}>
                <Link href={`/artist/${artist.slug}`} className="aoa-meta text-[var(--ink)] hover:text-[var(--signal)]">
                  {artist.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-10">
          <Link href="/music" className="aoa-home-cta aoa-home-cta-solid">
            Enter AOA Radio
          </Link>
        </div>
      </div>
    </section>
  );
}
