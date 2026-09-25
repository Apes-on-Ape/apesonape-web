'use client';

import Link from 'next/link';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import SectionMarker from '@/app/components/signal/SectionMarker';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import { artistsWithReleases, type Artist } from '@/app/data/artists';
import { albumsByArtist, latestReleaseUrl, type StationPlaylist } from './catalogue';
import { playCatalogueRelease } from './ReleaseShelf';
import { sameRadioUrl } from '@/lib/aoa-radio';

function portrait(artist: Artist) {
  return artist.avatar;
}

export default function ArtistRoster({ playlists }: { playlists: StationPlaylist[] }) {
  const radio = useAoaRadioState();
  const albums = albumsByArtist(playlists);
  const roster = artistsWithReleases(playlists.map((playlist) => ({ title: playlist.title, url: playlist.url })));
  if (roster.length === 0) return null;

  const card = (artist: Artist) => {
    const url = latestReleaseUrl(artist.slug, albums[artist.slug] ?? []);
    const onAir = !!url && sameRadioUrl(radio.playlistUrl, url) && !!radio.playing;
    const count = albums[artist.slug]?.length ?? 0;
    return (
      <article className="flex h-full min-w-0 flex-col border border-[rgba(243,238,228,0.12)] bg-[var(--background-card)]">
        <Link href={`/artist/${artist.slug}`} className="block min-w-0">
          <div className="h-24 bg-[var(--background-elevated)] sm:h-28">
            {portrait(artist) ? (
              <img src={portrait(artist)} alt="" width={240} height={160} loading="lazy" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </Link>
        <div className="flex flex-1 flex-col gap-2 p-3">
          {onAir ? <LiveIndicator label="ON AIR" /> : null}
          <div>
            <Link href={`/artist/${artist.slug}`} className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--signal)]">
              {artist.name}
            </Link>
            <p className="aoa-meta mt-1">{artist.role}</p>
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--ink-dim)]">{artist.bio}</p>
          {count > 0 ? <p className="aoa-meta">{count} release{count === 1 ? '' : 's'}</p> : null}
          <div className="mt-auto flex flex-wrap gap-2">
            <Link href={`/artist/${artist.slug}`} className="aoa-home-cta aoa-home-cta-ghost">
              Dossier
            </Link>
            {url ? (
              <button
                type="button"
                className="aoa-home-cta aoa-home-cta-solid"
                onClick={() => playCatalogueRelease(url, artist.name, radio.playlistUrl, radio.playing)}
              >
                {onAir ? 'Pause' : 'Play'}
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section id="artists" className="scroll-mt-[var(--aoa-header-h)] border-b border-[rgba(243,238,228,0.12)]">
      <div className="container-premium py-12 md:py-16">
        <SectionMarker index="03" title="AOA artists" />
        <p className="aoa-meta mt-3">The people on the label.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {roster.map((artist) => (
            <div key={artist.slug}>{card(artist)}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
