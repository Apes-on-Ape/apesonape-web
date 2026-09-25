'use client';

import { dispatchRadioCommand } from '@/lib/aoa-radio';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';

export default function StationClose() {
  const radio = useAoaRadioState();

  return (
    <section>
      <div className="container-premium py-16 md:py-24">
        <h2 className="type-section max-w-xl text-[var(--ink)]">
          AOA Records isn&apos;t background music. It&apos;s what the community sounds like.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--ink-dim)]">
          Holders, producers, and night-shift listeners. The station plays what they put on it.
        </p>
        <h2 className="type-hero-home mt-16 max-w-[10ch] text-[var(--ink)]">
          Keep the
          <br />
          signal moving.
        </h2>
        <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
          <button
            type="button"
            className="aoa-home-cta aoa-home-cta-solid w-full min-[420px]:w-auto"
            onClick={() => dispatchRadioCommand({ type: radio.playing ? 'pause' : 'play' })}
          >
            {radio.playing ? 'Pause transmission' : 'Turn the radio on'}
          </button>
          <a href="#artists" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">
            Meet the artists
          </a>
        </div>
      </div>
    </section>
  );
}
