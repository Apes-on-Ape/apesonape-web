'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { when: string; line: string; href?: string };

const FIXED: Item[] = [
  { when: 'December 2025', line: 'The rebuilt art landed. 10,000 characters.', href: '/collection' },
  { when: 'Ongoing', line: 'AOA Records keeps adding music.', href: '/music' },
  { when: 'Open', line: 'Arcade is running.', href: '/arcade' },
  { when: 'Open', line: 'Studio is open if you hold an Ape.', href: '/studio' },
];

export default function LiveClient() {
  const [now, setNow] = useState<string>('AOA Radio');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/soundcloud/latest-playlist')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.title) setNow(String(data.title));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const feed: Item[] = [
    { when: 'Now', line: now, href: '/music' },
    ...FIXED,
  ];

  return (
    <main className="container-premium pt-32 pb-28 max-w-3xl">
      <p className="flex items-center gap-2 text-[11px] tracking-[0.35em] uppercase text-hero-blue">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-hero-blue" aria-hidden="true" />
        Live
      </p>
      <h1 className="mt-4 font-black leading-[0.9]" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
        Transmission.
      </h1>
      <p className="mt-6 text-white/40">Believe in something.</p>
      <ul className="mt-16 divide-y divide-white/10 border-y border-white/10">
        {feed.map((item) => (
          <li key={item.line} className="py-6">
            <p className="text-[11px] tracking-[0.25em] uppercase text-white/30">{item.when}</p>
            {item.href ? (
              <Link href={item.href} className="mt-2 block text-xl md:text-2xl text-white hover:text-hero-blue">
                {item.line}
              </Link>
            ) : (
              <p className="mt-2 text-xl md:text-2xl text-white">{item.line}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
