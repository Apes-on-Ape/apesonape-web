'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const HISTORY = [
  'October 2024. 10,000 apes.',
  'December 2024. DMCA.',
  'The art disappears.',
  'Most projects die here.',
  'AOA rebuilds.',
  '10,000 new characters.',
  'Music starts.',
  'The catalogue grows.',
  'The radio goes live.',
  'Games.',
  'Artists.',
  'Still building.',
];

const WHISPERS = [
  'Believe in something.',
  'Apes together strong.',
  '10,000 apes started something.',
];

export default function HomeSignal() {
  const [latest, setLatest] = useState('AOA Radio');
  const [playing, setPlaying] = useState(false);
  const [apeId, setApeId] = useState<number | null>(null);
  const [whisper, setWhisper] = useState('');

  useEffect(() => {
    setApeId(1 + Math.floor(Math.random() * 9999));
    setWhisper(WHISPERS[Math.floor(Math.random() * WHISPERS.length)]);
    let cancelled = false;
    fetch('/api/soundcloud/latest-playlist')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.title) setLatest(String(data.title));
      })
      .catch(() => {});
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; playing?: boolean }>).detail;
      if (detail?.title) setLatest(detail.title);
      if (typeof detail?.playing === 'boolean') setPlaying(detail.playing);
    };
    window.addEventListener('aoa-radio-state', onState);
    return () => {
      cancelled = true;
      window.removeEventListener('aoa-radio-state', onState);
    };
  }, []);

  return (
    <>
      <section className="border-t border-white/10 bg-black py-16 md:py-24">
        <div className="container-premium flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-hero-blue">
              {playing ? '● Live' : '● AOA Radio'}
            </p>
            <p className="mt-4 text-3xl md:text-5xl font-black text-white max-w-3xl leading-tight">{latest}</p>
            <p className="mt-4 text-white/40">The radio never stops.</p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('aoa-radio-play'))}
            className="self-start text-sm font-bold tracking-[0.25em] uppercase border-b border-white pb-1"
          >
            {playing ? 'Playing' : 'Play'}
          </button>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black py-28 md:py-40">
        <div className="container-premium">
          <h2 className="font-black text-white leading-[0.9] tracking-tight max-w-4xl" style={{ fontSize: 'clamp(2.6rem, 7vw, 6rem)' }}>
            10,000 apes started it.
          </h2>
          <p className="mt-6 text-white/40 text-xl md:text-2xl">Nobody knows where it ends.</p>
          <p className="mt-10 text-white/25 text-sm">{whisper}</p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black py-20 md:py-28" aria-labelledby="just-happened">
        <div className="container-premium grid md:grid-cols-[0.7fr_1.3fr] gap-12">
          <h2 id="just-happened" className="text-[11px] tracking-[0.35em] uppercase text-white/40">
            Just happened
          </h2>
          <ul className="space-y-8">
            <li>
              <p className="text-[11px] tracking-[0.25em] uppercase text-hero-blue">Now</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold text-white">{latest}</p>
              <Link href="/live" className="mt-3 inline-block text-sm text-white/40 hover:text-white">Hear it</Link>
            </li>
            <li>
              <p className="text-[11px] tracking-[0.25em] uppercase text-white/30">December 2025</p>
              <p className="mt-2 text-xl text-white/80">The art came back.</p>
            </li>
            {apeId !== null && (
              <li>
                <p className="text-[11px] tracking-[0.25em] uppercase text-white/30">One of them</p>
                <Link href={`/collection/${apeId}`} className="mt-3 flex items-center gap-4 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs/${apeId}.webp`}
                    alt=""
                    className="w-16 h-16 object-cover"
                  />
                  <span className="text-xl text-white group-hover:text-hero-blue">Ape #{apeId}</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black py-24 md:py-36">
        <div className="container-premium max-w-3xl">
          <h2 className="font-black text-white leading-[0.9] mb-12" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}>
            The art disappeared.
            <br />
            The community didn&apos;t.
          </h2>
          <ol className="space-y-4">
            {HISTORY.map((line) => (
              <li key={line} className="text-2xl md:text-4xl font-black text-white/85 leading-tight">
                {line}
              </li>
            ))}
          </ol>
          <Link href="/story" className="mt-12 inline-block text-sm tracking-[0.2em] uppercase text-white/40 hover:text-white">
            The long version
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black py-28 md:py-40">
        <div className="container-premium">
          <p className="font-black text-white leading-[0.85]" style={{ fontSize: 'clamp(4rem, 14vw, 10rem)' }}>
            Still here.
          </p>
        </div>
      </section>
    </>
  );
}
