'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/app/components/Footer';
import { useParams } from 'next/navigation';
import { ARTISTS, getArtist } from '@/app/data/artists';
import { profileHref } from '@/lib/profile/identity';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import { sameRadioUrl } from '@/lib/aoa-radio';
import {
  FALLBACK_PLAYLISTS,
  albumsByArtist,
  releaseTitle,
  withShelf,
  type StationPlaylist,
} from '@/app/components/music/catalogue';
import { playCatalogueRelease } from '@/app/components/music/ReleaseShelf';

const CDN_THUMB = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

export default function ArtistPage() {
  const params = useParams();
  const slug = String(params.slug);
  const artist = getArtist(slug);
  const radio = useAoaRadioState();
  const [releases, setReleases] = useState<StationPlaylist[]>([]);

  useEffect(() => {
    if (!artist) return;
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
        const source = withShelf(rows.length > 0 ? rows : FALLBACK_PLAYLISTS);
        setReleases(albumsByArtist(source)[artist.slug] ?? []);
      })
      .catch(() => {
        if (!cancelled) setReleases(albumsByArtist(withShelf(FALLBACK_PLAYLISTS))[artist.slug] ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [artist]);

  if (!artist) {
    return (
      <div className="min-h-screen text-[var(--ink)]">
        <main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+2rem)]">
          <p className="aoa-meta">AOA Records</p>
          <h1 className="mt-4 font-[family-name:var(--font-signal-display)] text-4xl font-bold uppercase sm:text-6xl">
            Artist not found
          </h1>
          <Link href="/music" className="aoa-home-cta aoa-home-cta-ghost mt-8">Back to the station</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const others = ARTISTS.filter((item) => item.slug !== artist.slug).slice(0, 6);
  const links = [
    artist.soundcloudUrl ? { label: 'SoundCloud', href: artist.soundcloudUrl } : null,
    artist.twitterUrl ? { label: 'X', href: artist.twitterUrl } : null,
    artist.instagramUrl ? { label: 'Instagram', href: artist.instagramUrl } : null,
    artist.spotifyUrl ? { label: 'Spotify', href: artist.spotifyUrl } : null,
  ].filter((item): item is { label: string; href: string } => !!item);

  return (
    <div className="min-h-screen text-[var(--ink)]">
      <main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
        <p className="aoa-meta">AOA Records</p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden bg-black sm:h-48 sm:w-48">
            {artist.avatar ? (
              <img src={artist.avatar} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <h1 className="break-words font-[family-name:var(--font-signal-display)] text-4xl font-bold uppercase leading-none sm:text-6xl">
              Artist // {artist.name}
            </h1>
            <p className="aoa-meta mt-4">{artist.role}</p>
            {profileHref(artist.profileUsername || artist.handle) ? (
              <Link href={profileHref(artist.profileUsername || artist.handle) || '/profile/'} className="aoa-meta mt-3 inline-block text-[var(--ink)]">
                View Ape profile
              </Link>
            ) : null}
            {artist.genres.length > 0 ? (
              <p className="mt-3 text-sm text-[var(--ink-mute)]">{artist.genres.join(' · ')}</p>
            ) : null}
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[var(--ink-dim)] sm:text-base">{artist.bio}</p>

        {links.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="aoa-meta hover:text-[var(--ink)]">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="aoa-meta">Releases</h2>
          {releases.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-mute)]">No station releases matched this artist.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {releases.map((release) => {
                const onAir = sameRadioUrl(radio.playlistUrl, release.url) && !!radio.playing;
                return (
                  <li key={release.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{releaseTitle(release.title)}</p>
                      {release.trackCount > 0 ? (
                        <p className="aoa-meta mt-1">{release.trackCount} tracks</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="aoa-home-cta aoa-home-cta-solid"
                      onClick={() => playCatalogueRelease(release.url, releaseTitle(release.title), radio.playlistUrl, radio.playing)}
                    >
                      {onAir ? 'Pause' : 'Play'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {artist.apeId ? (
          <section className="mt-12 border-t border-white/10 pt-8">
            <h2 className="aoa-meta">Ape</h2>
            <Link href={`/collection/${artist.apeId}`} className="mt-4 flex max-w-xs items-center gap-4">
              <img
                src={`${CDN_THUMB}/${artist.apeId}.webp`}
                alt={`Ape ${artist.apeId}`}
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
              />
              <span className="font-semibold">Ape #{artist.apeId}</span>
            </Link>
          </section>
        ) : null}

        {others.length > 0 ? (
          <section className="mt-12 border-t border-white/10 pt-8">
            <h2 className="aoa-meta">More on the label</h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link href={`/artist/${item.slug}`} className="text-sm hover:text-[var(--signal)]">{item.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-12">
          <Link href="/music" className="aoa-meta hover:text-[var(--ink)]">Back to the station</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
