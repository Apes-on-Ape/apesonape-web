'use client';

import React from 'react';
import Link from 'next/link';
import { SOCIALS } from '@/app/data/site';

const WAYS = [
  { label: 'Listen', href: '/music', body: 'Turn your volume up' },
  { label: 'See the apes', href: '/collection', body: '10,000 characters. This is where it started.' },
  { label: 'Hang out', href: 'https://discord.gg/gVmqW6SExU', external: true, body: 'The people are in Discord.' },
  { label: 'Make something', href: '/open-mic', body: 'If you have something to say.' },
  { label: 'Own one', href: 'https://opensea.io/collection/apes-on-apechain', external: true, body: 'Then there is more inside.' },
];

export default function JoinClient() {
  return (
    <main className="bg-black text-white">
      <section className="pt-32 pb-20 container-premium max-w-3xl">
        <h1 className="font-black leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(3rem, 9vw, 6.5rem)' }}>
          Don&apos;t watch.
          <br />
          Make it.
        </h1>
        <p className="mt-8 text-white/45 text-xl">You can be here before you own anything.</p>
      </section>

      <section className="border-t border-white/10">
        <ul className="container-premium max-w-3xl divide-y divide-white/10">
          {WAYS.map((way) => (
            <li key={way.label} className="py-8">
              {way.external ? (
                <a href={way.href} target="_blank" rel="noopener noreferrer" className="block group">
                  <p className="text-2xl md:text-4xl font-black group-hover:text-hero-blue">{way.label}</p>
                  <p className="mt-2 text-white/40">{way.body}</p>
                </a>
              ) : (
                <Link href={way.href} className="block group">
                  <p className="text-2xl md:text-4xl font-black group-hover:text-hero-blue">{way.label}</p>
                  <p className="mt-2 text-white/40">{way.body}</p>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-white/10 py-16">
        <div className="container-premium flex flex-wrap gap-6">
          {SOCIALS.map((social) => (
            <a key={social.platform} href={social.href} target="_blank" rel="noopener noreferrer" className="text-sm tracking-[0.2em] uppercase text-white/40 hover:text-white">
              {social.platform}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
