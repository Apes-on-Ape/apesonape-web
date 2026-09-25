'use client';

import { useMemo, useState } from 'react';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import SectionMarker from '@/app/components/signal/SectionMarker';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import { sameRadioUrl } from '@/lib/aoa-radio';
import { artistsForPlaylist, creditedArtist, releaseTitle, type StationPlaylist } from './catalogue';
import { playCatalogueRelease } from './ReleaseShelf';

const PAGE_SIZE = 10;

export default function RecordArchive({ playlists }: { playlists: StationPlaylist[] }) {
  const radio = useAoaRadioState();
  const [artist, setArtist] = useState('all');
  const [page, setPage] = useState(1);

  const filters = useMemo(() => {
    const names = new Map<string, string>();
    for (const playlist of playlists) {
      for (const match of artistsForPlaylist(playlist)) {
        names.set(match.slug, match.name);
      }
    }
    return Array.from(names, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [playlists]);

  const visible = artist === 'all'
    ? playlists
    : playlists.filter((playlist) => artistsForPlaylist(playlist).some((match) => match.slug === artist));
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (playlists.length === 0) return null;

  return (
    <section className="border-b border-[rgba(243,238,228,0.12)]">
      <div className="container-premium py-12 md:py-16">
        <SectionMarker index="04" title="Record archive" />
        <p className="aoa-meta mt-3">Shelf labels mark the list. They are not release dates.</p>
        {filters.length > 0 ? (
          <label className="mt-6 flex flex-col gap-2 text-sm text-[var(--ink)]">
            <span className="aoa-meta">Artist</span>
            <select
              value={artist}
              onChange={(event) => {
                setArtist(event.target.value);
                setPage(1);
              }}
              className="min-h-11 max-w-xs border border-[rgba(243,238,228,0.24)] bg-[var(--bg)] px-3 text-[var(--ink)]"
            >
              <option value="all">All</option>
              {filters.map((filter) => (
                <option key={filter.slug} value={filter.slug}>{filter.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <ul className="mt-6 divide-y divide-[rgba(243,238,228,0.12)] border-y border-[rgba(243,238,228,0.12)]">
          {pageItems.map((playlist) => {
            const active = sameRadioUrl(radio.playlistUrl, playlist.url);
            const onAir = active && !!radio.playing;
            const title = releaseTitle(playlist.title);
            const credit = creditedArtist(playlist.title);
            return (
              <li key={playlist.id} className="flex flex-wrap items-center gap-3 py-3 sm:gap-4">
                <div className="relative h-14 w-14 shrink-0 bg-[var(--signal-dim)] sm:h-16 sm:w-16">
                  {playlist.artwork ? (
                    <img src={playlist.artwork} alt="" width={128} height={128} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="aoa-meta text-[var(--signal)]">Tape {String(playlist.shelf).padStart(3, '0')}</p>
                  <h3 className="truncate text-sm font-semibold text-[var(--ink)] sm:text-base">{title}</h3>
                  <p className="truncate text-xs text-[var(--ink-dim)] sm:text-sm">
                    {credit || 'AOA Records'}
                    {playlist.trackCount > 0 ? ` · ${playlist.trackCount} tracks` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {onAir ? <LiveIndicator label="ON AIR" /> : null}
                  <button
                    type="button"
                    className="aoa-home-cta aoa-home-cta-solid"
                    onClick={() => playCatalogueRelease(playlist.url, title, radio.playlistUrl, radio.playing)}
                  >
                    {onAir ? 'Pause' : 'Play'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {pageCount > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="aoa-home-cta aoa-home-cta-ghost disabled:opacity-40"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </button>
            <p className="aoa-meta">Page {current} of {pageCount}</p>
            <button
              type="button"
              className="aoa-home-cta aoa-home-cta-ghost disabled:opacity-40"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
