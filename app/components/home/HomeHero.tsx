'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND, HOME_CTAS, SITE_MODE } from '@/app/data/site';

export default function HomeHero() {
  return (
    <section aria-label="Hero" className="relative bg-black">
      <div className="container-premium pt-24 md:pt-28 pb-16 md:pb-24">
        {SITE_MODE.announcement.enabled && (
          <p className="mb-8 text-[11px] tracking-[0.35em] uppercase text-white/40">
            {SITE_MODE.announcement.text}
          </p>
        )}
        <p className="text-[11px] tracking-[0.4em] uppercase text-white/35 mb-6">AOA</p>
        <h1 className="font-black text-white leading-[0.85] tracking-tight" style={{ fontSize: 'clamp(4.5rem, 16vw, 11rem)' }}>
          {BRAND.tagline}
        </h1>
        <p className="mt-8 font-black text-white leading-tight max-w-3xl" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.75rem)' }}>
          {BRAND.sublineAlt}
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Link href={HOME_CTAS.primary.href} className="text-sm font-bold tracking-[0.2em] uppercase text-white border-b border-white pb-1 hover:text-hero-blue hover:border-hero-blue transition-colors">
            {HOME_CTAS.primary.label}
          </Link>
          <Link href={HOME_CTAS.secondary.href} className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white transition-colors">
            {HOME_CTAS.secondary.label}
          </Link>
        </div>

        {SITE_MODE.event.enabled && (
          <Link href={SITE_MODE.event.href} className="mt-16 block max-w-sm">
            <p className="text-[11px] tracking-[0.3em] uppercase text-hero-blue">{SITE_MODE.event.title}</p>
            <p className="mt-2 text-white text-2xl font-bold">{SITE_MODE.event.message}</p>
          </Link>
        )}
      </div>
    </section>
  );
}
