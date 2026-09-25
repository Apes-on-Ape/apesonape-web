'use client';

import { SOCIALS } from '@/app/data/site';
import { HOMEPAGE_STATS, readHomepageStat, type SoundcloudStatsPayload } from '@/app/data/stats';
import { dispatchRadioCommand } from '@/lib/aoa-radio';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import BroadcastLabel from '@/app/components/signal/BroadcastLabel';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import NoiseOverlay from '@/app/components/signal/NoiseOverlay';

export default function StationHeader({
  payload,
  completePlays,
  artistCount,
}: {
  payload: SoundcloudStatsPayload | null;
  completePlays: number | null;
  artistCount: number;
}) {
  const radio = useAoaRadioState();
  const figures = HOMEPAGE_STATS
    .filter((def) => def.id !== 'apes')
    .map((def) => ({
      id: def.id,
      label: def.label,
      value: readHomepageStat(def, payload, completePlays),
    }))
    .filter((figure) => figure.value);

  if (artistCount > 0) {
    figures.push({ id: 'artists', label: 'Artists', value: String(artistCount) });
  }

  const spotify = SOCIALS.find((item) => item.platform === 'spotify');
  const soundcloud = SOCIALS.find((item) => item.platform === 'soundcloud');

  const toggle = () => {
    dispatchRadioCommand({ type: radio.playing ? 'pause' : 'play' });
  };

  return (
    <header className="relative overflow-hidden border-b border-[rgba(243,238,228,0.12)]">
      <NoiseOverlay />
      <div className="container-premium relative z-10 pb-12 pt-[calc(var(--aoa-header-h)+1.5rem)]">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <BroadcastLabel>AOA Records</BroadcastLabel>
          {radio.playing ? <LiveIndicator label="ON AIR" /> : <span className="aoa-meta">Standby</span>}
        </div>
        <h1 className="type-hero-home max-w-[12ch] text-[var(--ink)]">
          The sound of
          <br />
          ApeChain.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink-dim)] sm:text-lg">
          Independent sounds. Community frequencies. Broadcast from ApeChain.
        </p>
        <p className="aoa-meta mt-6 flex flex-wrap gap-x-4 gap-y-2">
          <span>AOA Radio</span>
          <span>ApeChain // 33139</span>
          <span>{radio.playing ? 'Signal status: on air' : 'Signal status: standby'}</span>
        </p>
        <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
          <button type="button" onClick={toggle} className="aoa-home-cta aoa-home-cta-solid w-full min-[420px]:w-auto">
            {radio.playing ? 'Pause transmission' : 'Turn the radio on'}
          </button>
        </div>
        <p className="aoa-meta mt-5 flex flex-wrap gap-x-4 gap-y-2">
          {soundcloud ? (
            <a href={soundcloud.href} target="_blank" rel="noreferrer" className="text-[var(--ink-dim)] hover:text-[var(--ink)]">
              SoundCloud ↗
            </a>
          ) : null}
          {spotify ? (
            <a href={spotify.href} target="_blank" rel="noreferrer" className="text-[var(--ink-dim)] hover:text-[var(--ink)]">
              Listen on Spotify ↗
            </a>
          ) : null}
        </p>
        {figures.length > 0 ? (
          <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.id} className="min-w-0">
                <dd className="type-section text-[var(--ink)]">{figure.value}</dd>
                <dt className="aoa-meta mt-1">{figure.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </header>
  );
}
