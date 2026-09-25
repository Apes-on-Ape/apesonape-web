'use client';

import Link from 'next/link';
import { SOCIALS } from '@/app/data/site';

const WAYS = [
  { label: 'AOA Records', href: '/music', body: 'The station.' },
  { label: 'Collection', href: '/collection', body: 'The archive.' },
  { label: 'Studio', href: '/studio', body: 'The lab.' },
  { label: 'Arcade', href: '/arcade', body: 'The game room.' },
];

export default function JoinClient() {
  const discord = SOCIALS.find((item) => item.platform === 'discord');
  const x = SOCIALS.find((item) => item.platform === 'x');
  const outside = [discord, x].filter((item): item is NonNullable<typeof item> => !!item);

  return (
    <main className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)] text-[var(--ink)]">
      <p className="aoa-meta">Community</p>
      <h1 className="mt-4 max-w-[12ch] font-[family-name:var(--font-signal-display)] text-5xl font-bold uppercase leading-[0.9] sm:text-7xl">
        Join the signal.
      </h1>
      <ul className="mt-12 max-w-2xl divide-y divide-white/10 border-y border-white/10">
        {WAYS.map((way) => (
          <li key={way.href}>
            <Link href={way.href} className="block py-6 hover:text-[var(--signal)]">
              <p className="text-2xl font-semibold uppercase tracking-wide sm:text-3xl">{way.label}</p>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">{way.body}</p>
            </Link>
          </li>
        ))}
        {outside.map((item) => (
          <li key={item.platform}>
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="block py-6 hover:text-[var(--signal)]">
              <p className="text-2xl font-semibold uppercase tracking-wide sm:text-3xl">{item.platform === 'x' ? 'X' : item.label}</p>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">Outside the site.</p>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
