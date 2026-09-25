'use client';

import { dispatchRadioCommand } from '@/lib/aoa-radio';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import SectionMarker from '@/app/components/signal/SectionMarker';

export default function NowTransmitting() {
  const radio = useAoaRadioState();
  const playing = !!radio.playing && !!radio.title;
  const tracks = radio.tracks ?? [];

  return (
    <section className="border-b border-[rgba(243,238,228,0.12)]" aria-label="Now transmitting">
      <div className="container-premium py-12 md:py-16">
        <SectionMarker index="01" title="Now transmitting" />
        {playing ? (
          <div className="mt-8 grid items-end gap-6 md:grid-cols-[minmax(0,16rem)_1fr]">
            <div className={`aoa-sleeve aoa-sleeve-live relative aspect-square bg-[var(--background-card)] ${radio.playing ? 'is-playing' : ''}`}>
              {radio.artwork ? (
                <img src={radio.artwork} alt="" width={500} height={500} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="aoa-meta text-[var(--signal)]">AOA</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <LiveIndicator label="ON AIR" />
              <h3 className="type-section mt-4 break-words text-[var(--ink)]">{radio.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-dim)]">{radio.artist || 'AOA Records'}</p>
              {radio.albumTitle ? (
                <p className="aoa-meta mt-3 break-words">{radio.albumTitle}</p>
              ) : null}
              <div className={`aoa-meter mt-6 ${radio.playing ? 'is-on' : ''}`} aria-hidden="true">
                <span /><span /><span /><span /><span /><span /><span />
              </div>
              {tracks.length > 0 ? (
                <ol className="mt-6 max-h-64 space-y-1 overflow-y-auto">
                  {tracks.map((track, index) => {
                    const current = track.id === radio.currentTrackId;
                    return (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => dispatchRadioCommand({ type: 'jump', index })}
                          className={`flex min-h-11 w-full items-center gap-3 px-2 text-left ${current ? 'text-[var(--signal)]' : 'text-[var(--ink)]'}`}
                        >
                          <span className="aoa-meta w-8 shrink-0">{String(index + 1).padStart(2, '0')}</span>
                          <span className="min-w-0 flex-1 truncate text-sm">{track.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-8 max-w-xl">
            <p className="type-section text-[var(--ink)]">No active transmission.</p>
            <p className="mt-3 text-[var(--ink-dim)]">Select a record below.</p>
          </div>
        )}
      </div>
    </section>
  );
}
