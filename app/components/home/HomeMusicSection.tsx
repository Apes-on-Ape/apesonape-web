'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { artistsWithReleases, type Artist } from '@/app/data/artists';
import { track } from '@/lib/analytics';

export default function HomeMusicSection() {
  const [artists, setArtists] = useState<Artist[]>(() => artistsWithReleases([]));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/soundcloud/playlists')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.playlists) return;
        const playlists = (data.playlists as Array<{ title?: string; permalink?: string; permalink_url?: string }>).map((p) => ({
          title: p.title,
          url: p.permalink || p.permalink_url || '',
        }));
        setArtists(artistsWithReleases(playlists));
      })
      .catch(() => { /* keep the seeded releasers */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      aria-labelledby="music-heading"
      className="border-t border-white/8 py-24 md:py-32 relative overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,84,249,0.1) 0%, transparent 65%)',
          transform: 'translate(-30%, -30%)',
        }}
        aria-hidden="true"
      />

      <div className="container-premium relative">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {artists.map((artist) => (
                <Link
                  key={artist.slug}
                  href={`/artist/${artist.slug}`}
                  aria-label={`${artist.name} — ${artist.role}`}
                  onClick={() => track('artist_view', { artist: artist.slug, source: 'home_records' })}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group-hover:border-hero-blue/50 transition-all duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                    <p className="absolute bottom-2 left-2 right-2 text-[10px] sm:text-[11px] font-bold text-white leading-tight truncate">
                      {artist.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="min-w-0 @container"
          >
            <p className="type-label text-white/40 mb-6">AOA Records</p>
            <h2
              id="music-heading"
              className="font-black text-white leading-none tracking-tighter mb-8 whitespace-nowrap"
              style={{ fontSize: 'clamp(1rem, 6.2cqi, 4.5rem)' }}
            >
              Turn your volume up
            </h2>
            <p className="type-body-lg mb-10 max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              This community built a record label.
              <br />
              Apes together strong.
            </p>

            <div className="flex flex-wrap gap-6">
              <Link href="/music" className="text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1">
                Play
              </Link>
              <Link href="/music#artists" className="text-sm font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white">
                Artists
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
