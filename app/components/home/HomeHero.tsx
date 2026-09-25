'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { SITE_MODE } from '@/app/data/site';
import { dispatchRadioCommand } from '@/lib/aoa-radio';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import LiveIndicator from '@/app/components/signal/LiveIndicator';
import BroadcastLabel from '@/app/components/signal/BroadcastLabel';
import NoiseOverlay from '@/app/components/signal/NoiseOverlay';
import SignalTicker from '@/app/components/signal/SignalTicker';
import { HERO_APE_IDS, apeCode, apeHero } from './apes';

export default function HomeHero() {
  const radio = useAoaRadioState();
  const reduce = useReducedMotion();
  const [apeId, setApeId] = useState<number>(HERO_APE_IDS[0]);

  useEffect(() => {
    if (reduce !== false) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % HERO_APE_IDS.length;
      const next = HERO_APE_IDS[index];
      const preload = new Image();
      preload.onload = () => setApeId(next);
      preload.src = apeHero(next);
    }, 14000);
    return () => window.clearInterval(timer);
  }, [reduce]);

  const ticker = ['APECHAIN // 33139', 'AOA RADIO'];
  if (radio.playing && radio.title) ticker.push(radio.title);

  const listen = () => {
    dispatchRadioCommand({ type: radio.playing ? 'pause' : 'play' });
  };

  return (
    <section aria-label="Hero" className="relative min-h-[100dvh] overflow-hidden bg-[var(--bg)]">
      <div className="absolute inset-0">
        <img
          src={apeHero(apeId)}
          alt={`Ape ${apeCode(apeId)}`}
          width={4096}
          height={4096}
          fetchPriority="high"
          className="aoa-hero-drift h-full w-full object-cover object-[center_18%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/55 to-[#050505]/15 md:bg-gradient-to-r md:from-[#050505] md:via-[#050505]/72 md:to-[#050505]/10" />
        <NoiseOverlay />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-4 pb-[calc(var(--aoa-dock-offset)+1.25rem)] pt-[calc(var(--aoa-header-h)+1.25rem)] sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          {SITE_MODE.announcement.enabled ? (
            <p className="aoa-meta mb-4 text-[var(--signal)]">{SITE_MODE.announcement.text}</p>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <BroadcastLabel>AOA</BroadcastLabel>
            {radio.playing ? <LiveIndicator label="ON AIR" /> : null}
            {!radio.playing && radio.ready && (radio.title || radio.albumTitle) ? (
              <span className="aoa-meta text-[var(--ink-dim)]">AOA RADIO</span>
            ) : null}
          </div>

          <motion.h1
            className="type-hero-home max-w-[16ch] text-[var(--ink)]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Turn your
            <br />
            volume up.
          </motion.h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink)] sm:text-lg">
            An on-chain creative network broadcasting from ApeChain.
          </p>

          {radio.playing && radio.title ? (
            <p className="mt-4 max-w-md text-sm leading-snug text-[var(--signal)]">
              <span className="line-clamp-2 break-words">{radio.title}</span>
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            <a href="#the-signal" className="aoa-home-cta aoa-home-cta-solid w-full min-[420px]:w-auto">
              Enter the signal
            </a>
            <button
              type="button"
              onClick={listen}
              className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto"
            >
              {radio.playing ? 'Pause' : 'Listen now'}
            </button>
          </div>

          {SITE_MODE.event.enabled ? (
            <Link href={SITE_MODE.event.href} className="mt-8 block max-w-sm">
              <p className="aoa-meta text-[var(--signal)]">{SITE_MODE.event.title}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--ink)]">{SITE_MODE.event.message}</p>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 border-t border-[rgba(243,238,228,0.12)]">
        <SignalTicker items={ticker} />
      </div>
    </section>
  );
}
