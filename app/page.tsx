'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, ExternalLink, ArrowRight, Music, Palette, Gamepad2, Wand2, Users, Zap, Shield } from 'lucide-react';
import Nav from './components/Nav';
import Footer from './components/Footer';
import HeroParticles from './components/HeroParticles';
import RecentSalesFeed from './components/RecentSalesFeed';
import EngagementHomeSection from './components/engagement/EngagementHomeSection';
import Image from 'next/image';
import Link from 'next/link';
import { ARTISTS } from './data/artists';

const THUMBS_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

// Deterministic set of showcase token IDs (never changes on re-render)
const SHOWCASE_IDS = [
  42, 188, 337, 512, 701, 888, 1024, 1337, 1500, 1776,
  2048, 2222, 3001, 3456, 3999, 4200, 4567, 4800, 5050, 5500,
  6000, 6543, 7000, 7391, 7777, 8001, 8500, 8888, 9100, 9500,
  99, 256, 404, 600, 750, 1111, 1600, 2500, 3333, 4040,
];

const STATS = [
  { value: '10,000', label: 'Total Supply' },
  { value: '1,500+', label: 'Unique Holders' },
  { value: 'APE', label: 'Chain' },
  { value: 'OG', label: 'Collection on Apechain' },
];

const ECOSYSTEM = [
  {
    icon: Music,
    title: 'AOA Records',
    description: 'A label for Ape holders. Drop tracks, build albums, and join the AOA catalogue on SoundCloud.',
    href: '/music',
    tag: 'Live',
  },
  {
    icon: Wand2,
    title: 'AI Studio',
    description: 'Holder-only AI creation tools. Generate art, stories, and media with your Ape NFT as the artist.',
    href: '/studio',
    tag: 'Holder Only',
  },
  {
    icon: Palette,
    title: 'Creative Hub',
    description: 'Build PFP borders, banners, stickers, and QR codes branded with your Ape.',
    href: '/creative',
    tag: 'Free',
  },
  {
    icon: Gamepad2,
    title: 'AOA Arcade',
    description: 'Community-built games, on-chain leaderboards, and rewards for the most competitive Apes.',
    href: '/arcade',
    tag: 'External',
    external: true,
  },
];

const PERKS = [
  { icon: Users, title: 'Elite Community', desc: 'Access a tight-knit network of artists, musicians, and builders on Apechain.' },
  { icon: Music, title: 'SoundCloud Access', desc: 'Upload under AOA Records — the only NFT label native to Apechain.' },
  { icon: Wand2, title: 'AI Creator Studio', desc: 'Holder-only tools to create with your Ape. Art, music, stories — all on-chain.' },
  { icon: Zap, title: '3D Avatar', desc: 'An exclusive animated 3D avatar fully compatible with Otherside by Yuga Labs.' },
  { icon: Gamepad2, title: 'AOA Arcade', desc: 'Play, compete, and earn in games built by and for the Apes community.' },
  { icon: Shield, title: 'Creative Tools', desc: 'PFP borders, banners, stickers, QR codes — a full brand kit for every Ape.' },
];

// Infinite horizontal scroll strip
function ApeStrip({ ids, speed = 40, reverse = false }: { ids: number[]; speed?: number; reverse?: boolean }) {
  const doubled = [...ids, ...ids];
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-3"
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ width: 'max-content' }}
      >
        {doubled.map((id, i) => (
          <div
            key={`${id}-${i}`}
            className="relative w-28 h-28 md:w-36 md:h-36 flex-shrink-0 rounded-xl overflow-hidden border border-white/8 group"
          >
            <Image
              src={`${THUMBS_BASE}/${id}.webp`}
              alt={`Ape #${id}`}
              fill
              sizes="144px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-hero-blue/0 group-hover:bg-hero-blue/15 transition-colors" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Animated counter
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const inc = target / steps;
          let cur = 0;
          const interval = setInterval(() => {
            cur += inc;
            if (cur >= target) { setCount(target); clearInterval(interval); }
            else setCount(Math.floor(cur));
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const strip1 = SHOWCASE_IDS.slice(0, 20);
  const strip2 = SHOWCASE_IDS.slice(20, 40);

  return (
    <div className="min-h-screen" style={{ color: 'var(--foreground)' }}>
      <Nav />

      {/* ═══════════════════════════════════════════════
          HERO — fullscreen interactive
      ════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-[#080808]">
        {/* Interactive particle background */}
        <div className="absolute inset-0 z-0">
          <HeroParticles />
          {/* Radial vignette corners */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 80% at 10% 90%, rgba(0,84,249,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 90% 10%, rgba(0,217,255,0.04) 0%, transparent 55%)'
          }} />
          {/* Bottom fade into next section */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#080808] pointer-events-none" />
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 container-premium w-full pt-24"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl"
          >
            {/* Overline badge */}
            <motion.div
              className="overline-tag mb-8 w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-hero-blue animate-pulse inline-block" />
              10,000 Apes · Built on Apechain
            </motion.div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black leading-[0.9] tracking-tight text-white mb-8">
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.9, ease: [0.16,1,0.3,1] }}
                className="block"
              >
                Apes On
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.9, ease: [0.16,1,0.3,1] }}
                className="block text-hero-blue"
              >
                Apechain.
              </motion.span>
            </h1>

            <motion.p
              className="text-xl md:text-2xl text-white/65 max-w-2xl mb-12 leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.8 }}
            >
              A collection of 10,000 unique Apes — the cornerstone of a creative
              ecosystem built for musicians, artists, builders, and visionaries.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7 }}
            >
              <Link href="/collection" className="btn-primary btn-lg">
                Explore Collection
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://opensea.io/collection/apes-on-apechain"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-lg"
              >
                Buy on OpenSea
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/30" />
          <span className="text-xs uppercase tracking-[0.25em] text-white/30">Scroll</span>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════ */}
      <section className="border-y border-white/8 bg-white/[0.025]">
        <div className="container-premium py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col items-center gap-1 px-6 py-4 text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <span className="text-3xl md:text-4xl font-black text-white tabular-nums">{s.value}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-white/35 font-semibold">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          LIVE SALES TICKER
      ════════════════════════════════════════════════ */}
      <RecentSalesFeed compact />

      <EngagementHomeSection />

      {/* ═══════════════════════════════════════════════
          NFT SHOWCASE STRIPS
      ════════════════════════════════════════════════ */}
      <section className="py-20 overflow-hidden">
        <div className="container-premium mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
          >
            <div>
              <div className="overline-tag mb-4">The Collection</div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                10,000 Unique<br />
                <span className="text-hero-blue">Apes.</span>
              </h2>
            </div>
            <div className="max-w-sm">
              <p className="text-white/50 text-base leading-relaxed mb-6">
                Every Ape is procedurally generated from hundreds of traits — no two are the same.
                Deployed on Apechain, forever.
              </p>
              <Link
                href="/collection"
                className="inline-flex items-center gap-2 text-hero-blue font-semibold text-sm hover:gap-3 transition-all"
              >
                Browse all 10,000 →
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Animated strips */}
        <div className="space-y-3">
          <ApeStrip ids={strip1} speed={55} />
          <ApeStrip ids={strip2} speed={45} reverse />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          THE COLLECTION — editorial two-col
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-24 md:py-32">
        <div className="container-premium">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: stacked ape grid */}
            <motion.div
              className="grid grid-cols-3 gap-3"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {[42, 337, 888, 1337, 2048, 3456, 4567, 7777, 9500].map((id, i) => (
                <motion.div
                  key={id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/8 group"
                  whileHover={{ scale: 1.04, zIndex: 10 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                >
                  <Image
                    src={`${THUMBS_BASE}/${id}.webp`}
                    alt={`Ape #${id}`}
                    fill
                    sizes="200px"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 text-xs font-mono text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    #{id}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right: copy */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="overline-tag mb-6">About the Project</div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
                More than an NFT.<br />
                <span className="text-hero-blue">A movement.</span>
              </h2>
              <div className="space-y-5 text-white/55 leading-relaxed text-lg">
                <p>
                  Apes on Ape is a collection of 10,000 original characters living on Apechain — 
                  the blockchain purpose-built for the ape community. Each NFT is a passport 
                  to an expanding creative universe.
                </p>
                <p>
                  Holders gain access to AOA Records, the AI Creator Studio, an exclusive 3D 
                  avatar compatible with Otherside, and a growing suite of creative tools.
                </p>
                <p>
                  Built by creators, for creators. No roadmap theatre — just real utility 
                  shipped on chain.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/collection" className="btn-primary">
                  View Collection
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://discord.gg/gVmqW6SExU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Join Discord
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WHAT YOUR APE UNLOCKS — perk grid
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-24 md:py-32 overflow-hidden relative">
        {/* Ambient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-hero-blue/6 rounded-full blur-3xl pointer-events-none" />

        <div className="container-premium relative">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="overline-tag mx-auto mb-6">Holder Benefits</div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              What Your Ape<br />
              <span className="text-hero-blue">Unlocks.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto leading-relaxed">
              Owning an Ape isn't just flexing a PFP — it's a key to a real
              creative economy on Apechain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map((perk, i) => (
              <motion.div
                key={perk.title}
                className="group relative rounded-2xl p-7 border border-white/8 bg-white/[0.025] hover:border-hero-blue/35 transition-all duration-400 overflow-hidden"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-hero-blue/0 to-hero-blue/8 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-hero-blue/10 border border-hero-blue/20 flex items-center justify-center mb-5 group-hover:bg-hero-blue/20 group-hover:border-hero-blue/40 transition-colors">
                    <perk.icon className="w-5 h-5 text-hero-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{perk.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ECOSYSTEM FEATURE CARDS
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-24 md:py-32">
        <div className="container-premium">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <div className="overline-tag mb-4">Ecosystem</div>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">
                Built for<br />
                <span className="text-hero-blue">Creators.</span>
              </h2>
            </div>
            <p className="text-white/45 max-w-xs leading-relaxed text-base">
              Every tool in the AOA ecosystem was built for Ape holders — 
              to create, publish, and own their work on-chain.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {ECOSYSTEM.map((item, i) => (
              <motion.a
                key={item.title}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="group relative rounded-2xl p-8 border border-white/8 bg-white/[0.025] overflow-hidden hover:border-hero-blue/40 transition-all duration-300 nft-card-shine"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -3 }}
              >
                {/* Corner glow */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-hero-blue/12 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-hero-blue/10 border border-hero-blue/20 flex items-center justify-center group-hover:bg-hero-blue group-hover:border-hero-blue transition-all duration-300">
                    <item.icon className="w-6 h-6 text-hero-blue group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border border-white/12 bg-white/5 text-white/45 group-hover:border-hero-blue/35 group-hover:text-hero-blue transition-colors">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white mb-3 group-hover:text-hero-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-white/45 leading-relaxed text-sm mb-6">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/30 group-hover:text-hero-blue transition-colors">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SPOTIFY — artist profile embed
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-[#1DB954]/5 rounded-full blur-[120px]" />
        </div>
        <div className="container-premium relative">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="overline-tag mb-6">Music</div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Listen on<br />
                <span style={{ color: '#1DB954' }}>Spotify.</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">
                Apes on Ape drops original music straight from the AOA community. 
                Follow us on Spotify and never miss a release.
              </p>
              <a
                href="https://open.spotify.com/artist/5jWLGE3ZNCyau37PWs20AP?si=oQJnFe1vTGubcBK7_1K1zg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-bold text-sm text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: '#1DB954', boxShadow: '0 0 30px rgba(29,185,84,0.3)' }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Follow on Spotify
              </a>
            </motion.div>

            {/* Right: embed */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full"
            >
              <iframe
                style={{ borderRadius: '12px' }}
                src="https://open.spotify.com/embed/artist/5jWLGE3ZNCyau37PWs20AP?utm_source=generator&si=1db3da1165cb4d14"
                width="100%"
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COMMUNITY MEMBERS — real holder spotlight
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-24 md:py-28 overflow-hidden">
        <div className="container-premium mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="overline-tag mb-4">Community</div>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Meet the Apes
            </h2>
            <p className="text-white/40 mt-3 text-lg">The holders building the culture.</p>
          </motion.div>
        </div>

        <div className="container-premium">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {ARTISTS.map((artist, i) => (
              <motion.div
                key={artist.slug}
                className="group"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.45 }}
              >
                <a
                  href={artist.twitterUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/8 group-hover:border-hero-blue/50 transition-all duration-300 shadow-lg group-hover:shadow-hero-blue/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-[11px] font-bold text-white leading-tight truncate">{artist.name}</p>
                      <p className="text-[10px] text-hero-blue font-semibold truncate">@{artist.handle}</p>
                    </div>
                    {/* Twitter bird on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.732-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Name below card - always visible */}
                  <div className="mt-2 px-0.5">
                    <p className="text-[11px] font-semibold text-white/70 group-hover:text-white truncate transition-colors">{artist.name}</p>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          COMMUNITY / DISCORD CTA
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-24 md:py-32 relative overflow-hidden">
        {/* BG treatment */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-[700px] h-[400px] bg-hero-blue/8 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-hero-blue/5 rounded-full blur-[80px]" />
        </div>

        <div className="container-premium relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="overline-tag mx-auto mb-8">Community</div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] mb-8">
                Apes Together<br />
                <span className="text-hero-blue">Strong.</span>
              </h2>
              <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-12">
                Join thousands of Ape holders building the future of on-chain creativity.
                Musicians. Artists. Builders. All under one roof.
              </p>

              {/* Social stats row */}
              <div className="flex flex-wrap justify-center gap-10 mb-14">
                {[
                  { value: '5K+', label: 'Discord Members' },
                  { value: '10K', label: 'Apes Minted' },
                  { value: '2,000+', label: 'Tracks on SoundCloud' },
                  { value: '3,500+', label: 'X Community' },
                  { value: '251', label: 'Spotify Listeners' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <div className="text-4xl font-black text-hero-blue mb-1">{s.value}</div>
                    <div className="text-xs uppercase tracking-[0.15em] text-white/35">{s.label}</div>
                  </motion.div>
                ))}
      </div>

              <div className="flex flex-wrap justify-center gap-4">
                <motion.a
                  href="https://discord.gg/gVmqW6SExU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-lg"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Image src="/discord-white.png" alt="Discord" width={20} height={20} className="w-5 h-5 object-contain" />
                  Join Discord
                </motion.a>
                <motion.a
                  href="https://x.com/apesonape"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-lg"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Image src="/x-white.png" alt="X" width={18} height={18} className="w-4.5 h-4.5 object-contain opacity-80" />
                  Follow on X
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MARKETPLACE CTA
      ════════════════════════════════════════════════ */}
      <section className="border-t border-white/8 py-16">
        <div className="container-premium">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">Available on</p>
              <h3 className="text-3xl font-black text-white">Trade Your Ape</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                {
                  name: 'OpenSea',
                  icon: '/opensea-logo.webp',
                  href: 'https://opensea.io/collection/apes-on-apechain',
                },
                {
                  name: 'Mintify',
                  icon: '/mintify_icon.jpeg',
                  href: 'https://app.mintify.com/nft/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0',
                },
              ].map((m) => (
                <a
                  key={m.name}
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-hero-blue/40 hover:bg-hero-blue/5 transition-all duration-300 group"
                >
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={m.icon} alt={m.name} fill sizes="28px" className="object-contain" />
                  </div>
                  <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                    {m.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-hero-blue transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
