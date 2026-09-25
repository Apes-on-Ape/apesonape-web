'use client';

import { dispatchRadioCommand, sameRadioUrl } from '@/lib/aoa-radio';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import SectionMarker from '@/app/components/signal/SectionMarker';
import { releaseTitle, creditedArtist, type StationPlaylist } from './catalogue';

export function playCatalogueRelease(url: string, title: string, currentUrl?: string, playing?: boolean) {
  if (!url) return;
  if (sameRadioUrl(url, currentUrl)) {
    dispatchRadioCommand({ type: playing ? 'pause' : 'play' });
    return;
  }
  dispatchRadioCommand({ type: 'load', url, play: true, title });
}

export default function ReleaseShelf({ playlists }: { playlists: StationPlaylist[] }) {
  const radio = useAoaRadioState();
  const shelf = playlists.slice(0, 4);
  if (shelf.length === 0) return null;

  return (
    <section className="border-b border-[rgba(243,238,228,0.12)]">
      <div className="container-premium py-12 md:py-16">
        <SectionMarker index="02" title="Latest releases" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shelf.map((playlist) => {
            const active = sameRadioUrl(radio.playlistUrl, playlist.url);
            const onAir = active && !!radio.playing;
            const title = releaseTitle(playlist.title);
            const artist = creditedArtist(playlist.title);
            return (
              <li key={playlist.id} className="min-w-0">
                <article className={`aoa-sleeve flex h-full flex-col border bg-[var(--background-card)] ${active ? 'border-[var(--signal)]' : 'border-[rgba(243,238,228,0.12)]'} ${onAir ? 'is-playing' : ''}`}>
                  <div className="relative aspect-square bg-[var(--signal-dim)]">
                    {playlist.artwork ? (
                      <img src={playlist.artwork} alt="" width={480} height={480} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="aoa-meta text-[var(--signal)]">AOA</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {onAir ? <LiveIndicator label="ON AIR" /> : null}
                    <h3 className="line-clamp-2 break-words text-base font-semibold text-[var(--ink)]">{title}</h3>
                    {artist ? <p className="text-sm text-[var(--ink-dim)]">{artist}</p> : null}
                    {playlist.trackCount > 0 ? <p className="aoa-meta">{playlist.trackCount} tracks</p> : null}
                    <button
                      type="button"
                      className="aoa-home-cta aoa-home-cta-solid mt-auto"
                      onClick={() => playCatalogueRelease(playlist.url, title, radio.playlistUrl, radio.playing)}
                    >
                      {onAir ? 'Pause' : 'Play'}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
