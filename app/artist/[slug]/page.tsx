'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music2, ExternalLink, ArrowLeft, Mic, Play, Twitter, Instagram, Disc3 } from 'lucide-react';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getArtist, ARTISTS } from '@/app/data/artists';

function ArtistAvatar({ src, alt, fallback }: { src: string; alt: string; fallback?: React.ReactNode }) {
  const [errored, setErrored] = React.useState(false);
  if (errored) {
    return (
      <div className="absolute inset-0 bg-hero-blue/20 flex items-center justify-center">
        {fallback}
      </div>
    );
  }
  return <Image src={src} alt={alt} fill unoptimized className="object-cover" onError={() => setErrored(true)} />;
}

export default function ArtistPage() {
  const params = useParams();
  const slug = String(params.slug);
  const artist = getArtist(slug);
  const [playerExpanded, setPlayerExpanded] = useState(false);

  if (!artist) {
    return (
      <div className="min-h-screen">
        <div className="container-premium pt-32 text-center">
          <h1 className="text-4xl font-black text-white mb-4">Artist not found</h1>
          <Link href="/music" className="text-hero-blue hover:text-hero-blue-light transition-colors">← Back to Music</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const otherArtists = ARTISTS.filter(a => a.slug !== slug);

  return (
    <div className="min-h-screen">

      {/* Hero — editorial full-bleed */}
      <div className="relative overflow-hidden min-h-[55vh] flex flex-col justify-end" style={{ background: '#080808' }}>
        {/* Cover art or colour fill — behind all content */}
        {artist.coverImage ? (
          <div className="absolute inset-0">
            <Image src={artist.coverImage} alt="" fill className="object-cover" priority />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.6) 55%, #080808 100%)' }} />
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(0,84,249,0.18) 0%, transparent 65%)' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080b18] via-transparent to-[#080808]" />
          </div>
        )}

        <div className="container-premium relative z-10 pt-28 pb-14">
          {/* Back link */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
            <Link href="/music" className="inline-flex items-center gap-2 type-label transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> AOA Records
            </Link>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-10 items-end">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex-shrink-0"
            >
              <div className="relative w-44 h-44 md:w-60 md:h-60 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {artist.avatar ? (
                  <ArtistAvatar src={artist.avatar} alt={artist.name} fallback={<Mic className="w-16 h-16 text-hero-blue/50" />} />
                ) : (
                  <div className="absolute inset-0 bg-hero-blue/20 flex items-center justify-center">
                    <Mic className="w-16 h-16 text-hero-blue/50" />
                  </div>
                )}
                {artist.apeId && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/80 text-[11px] font-bold text-hero-blue backdrop-blur-sm">
                    #{artist.apeId}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex-1"
            >
              <div className="inline-flex items-center gap-2 mb-5">
                <Music2 className="w-3.5 h-3.5 text-hero-blue" />
                <span className="type-label text-hero-blue">AOA Records Artist</span>
              </div>
              <h1 className="font-black text-white tracking-tight mb-3 leading-[0.9]"
                style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
                {artist.name}
              </h1>
              <p className="text-lg mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>{artist.role}</p>
              <div className="flex flex-wrap gap-2 mb-7">
                {artist.genres.map(g => (
                  <span key={g} className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ background: 'rgba(0,84,249,0.1)', color: 'var(--blue-light)', border: '1px solid rgba(0,84,249,0.22)' }}>
                    {g}
                  </span>
                ))}
              </div>
              {/* Social links */}
              <div className="flex items-center gap-3 flex-wrap">
                {artist.soundcloudUrl && (
                  <a href={artist.soundcloudUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-hero-blue text-white hover:bg-hero-blue-light shadow-lg shadow-hero-blue/30">
                    <Disc3 className="w-4 h-4" /> Listen on SoundCloud
                  </a>
                )}
                {artist.twitterUrl && (
                  <a href={artist.twitterUrl} target="_blank" rel="noopener noreferrer"
                    className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Twitter className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  </a>
                )}
                {artist.instagramUrl && (
                  <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <Instagram className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container-premium pb-20">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/3 border border-white/10"
            >
              <h2 className="text-sm uppercase tracking-widest font-bold text-white/40 mb-4">About</h2>
              <p className="text-white/70 leading-relaxed text-lg">{artist.bio}</p>
            </motion.div>

            {/* Featured Track */}
            {artist.featuredTrackUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-white/3 border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm uppercase tracking-widest font-bold text-white/40">Featured Music</h2>
                  <button
                    onClick={() => setPlayerExpanded(e => !e)}
                    className="flex items-center gap-2 text-xs text-hero-blue hover:text-hero-blue-light transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {playerExpanded ? 'Hide Player' : 'Show Player'}
                  </button>
                </div>
                {playerExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <iframe
                      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.featuredTrackUrl)}&auto_play=false&visual=true&show_comments=false`}
                      className="w-full rounded-xl"
                      height="300"
                      allow="autoplay; encrypted-media"
                    />
                  </motion.div>
                )}
                {!playerExpanded && (
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl bg-hero-blue/5 border border-hero-blue/20 cursor-pointer hover:bg-hero-blue/10 transition-colors"
                    onClick={() => setPlayerExpanded(true)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-hero-blue/20 flex items-center justify-center">
                      <Play className="w-6 h-6 text-hero-blue ml-0.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{artist.name} — Featured Tracks</div>
                      <div className="text-xs text-white/40">Click to load SoundCloud player</div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Top Tracks */}
            {artist.topTracks && artist.topTracks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-2xl bg-white/3 border border-white/10"
              >
                <h2 className="text-sm uppercase tracking-widest font-bold text-white/40 mb-4">Tracks</h2>
                <div className="space-y-2">
                  {artist.topTracks.map((track, i) => (
                    <a
                      key={i}
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-hero-blue/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-hero-blue/60">{i + 1}</span>
                      </div>
                      <div className="flex-1 font-medium text-white/80 group-hover:text-white transition-colors truncate">{track.title}</div>
                      {track.plays && <div className="text-xs text-white/30">{track.plays.toLocaleString()} plays</div>}
                      <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-hero-blue transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ape Card */}
            {artist.apeId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl overflow-hidden border border-hero-blue/25"
              >
                <div className="aspect-square relative">
                  <Image src={`https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs/${artist.apeId}.webp`}
                    alt={`Ape #${artist.apeId}`} fill unoptimized className="object-cover" />
                </div>
                <div className="p-4 bg-white/3 border-t border-white/8">
                  <div className="text-xs text-white/40 mb-0.5">Artist&apos;s Ape</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Ape #{artist.apeId}</span>
                    <Link href={`/collection/${artist.apeId}`} className="text-xs text-hero-blue hover:text-hero-blue-light transition-colors">
                      View →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other Artists */}
            {otherArtists.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="p-5 rounded-2xl bg-white/3 border border-white/10"
              >
                <h2 className="text-xs uppercase tracking-widest font-bold text-white/40 mb-4">More Artists</h2>
                <div className="space-y-3">
                  {otherArtists.slice(0, 4).map(a => (
                    <Link key={a.slug} href={`/artist/${a.slug}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-xl overflow-hidden relative flex-shrink-0 border border-white/10 bg-white/5">
                        {a.avatar && <ArtistAvatar src={a.avatar} alt={a.name} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white group-hover:text-hero-blue transition-colors truncate">{a.name}</div>
                        <div className="text-xs text-white/35 truncate">{a.role}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
