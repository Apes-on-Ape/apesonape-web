'use client';

import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import { sameRadioUrl } from '@/lib/aoa-radio';
import SectionMarker from '@/app/components/signal/SectionMarker';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import { playCatalogueRelease } from './ReleaseShelf';
import type { RankedTrack } from './catalogue';

export default function TopSignals({ tracks }: { tracks: RankedTrack[] }) {
  const radio = useAoaRadioState();
  if (tracks.length === 0) return null;

  return (
    <section className="border-b border-[rgba(243,238,228,0.12)]">
      <div className="container-premium py-12 md:py-16">
        <SectionMarker index="05" title="Top signals" />
        <p className="aoa-meta mt-3">Ranked by SoundCloud play count.</p>
        <ol className="mt-8 grid gap-3 md:grid-cols-2">
          {tracks.map((track, index) => {
            const onAir = !!track.permalink_url && sameRadioUrl(radio.playlistUrl, track.permalink_url) && !!radio.playing;
            return (
              <li key={track.id} className="min-w-0">
                <article className="flex flex-wrap items-center gap-3 border border-[rgba(243,238,228,0.12)] bg-[var(--background-card)] p-3">
                  <span className="aoa-meta w-8 shrink-0 text-[var(--signal)]">{String(index + 1).padStart(2, '0')}</span>
                  <div className="h-14 w-14 shrink-0 bg-[var(--signal-dim)]">
                    {track.artwork_url ? (
                      <img
                        src={track.artwork_url.replace('-large', '-t300x300')}
                        alt=""
                        width={120}
                        height={120}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 break-words text-sm font-semibold text-[var(--ink)]">{track.title}</h3>
                    <p className="aoa-meta mt-1">{track.playback_count.toLocaleString('en-US')} plays</p>
                  </div>
                  {track.permalink_url ? (
                    <button
                      type="button"
                      className="aoa-home-cta aoa-home-cta-solid shrink-0"
                      onClick={() => playCatalogueRelease(track.permalink_url, track.title, radio.playlistUrl, radio.playing)}
                    >
                      {onAir ? 'Pause' : 'Play'}
                    </button>
                  ) : null}
                  {onAir ? <LiveIndicator label="ON AIR" /> : null}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
