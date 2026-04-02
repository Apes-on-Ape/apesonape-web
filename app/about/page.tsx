'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, ExternalLink, CheckCircle2, Zap, Music2,
  Palette, Gamepad2, Users, AlertTriangle, RefreshCw, Rocket, TrendingUp,
} from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

const CDN_THUMB = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

// ── Timeline data ──────────────────────────────────────────────────────────
const TIMELINE = [
  {
    date: 'April 2021',
    title: 'BAYC Goes Live',
    body: 'Bored Ape Yacht Club launches on Ethereum. 10,000 apes, commercial IP rights, a culture built on "Apes Together Strong." The blueprint is set.',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
  },
  {
    date: 'March 2022',
    title: 'ApeCoin Launches',
    body: '$APE drops via a major airdrop to BAYC, MAYC, and Kennel Club holders. Governance. Utility. A token tied to culture — not just speculation.',
    icon: Zap,
    color: 'text-hero-blue',
    bg: 'bg-hero-blue/10',
    border: 'border-hero-blue/25',
  },
  {
    date: 'October 2024',
    title: 'ApeChain Launches',
    body: 'Arbitrum Orbit Layer-3. Native $APE gas. Near-zero fees. Built for NFTs, gaming, and creators. The stage is set for a chain-native ape project.',
    icon: Zap,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/25',
  },
  {
    date: 'October 2024',
    title: 'Apes on Ape Launches',
    body: 'The moment ApeChain goes live, Apes on Ape is there. One of the very first NFT projects to deploy natively on the new chain. Early believers mint in — with placeholder art for now — trusting the team and the vision. The OG collection on ApeChain.',
    icon: Rocket,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/25',
  },
  {
    date: 'December 2024',
    title: 'The DMCA',
    body: 'Yuga Labs issues a DMCA takedown against the original collection. Art too close to BAYC. Platforms delist. The project goes dark. Many wrote it off. But within the Ape community, something different started — a rallying call.',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
  },
  {
    date: 'Late 2024 – Early 2025',
    title: 'The Rebirth',
    body: 'The community didn\'t scatter. BAYC holders, Ape ecosystem veterans, and true believers showed up. "Apes Together Strong" wasn\'t a slogan — it was a plan. The team scrapped every pixel of the original art and built a completely fresh 10,000-piece generative collection from scratch. Original traits. Original soul. Same rebellious energy.',
    icon: RefreshCw,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
  },
  {
    date: 'June 29, 2025',
    title: 'All-Time High',
    body: 'Floor hits ~$67.35 / 111 APE. The "only Apes on ApeChain" narrative peaks. Music plays climb into the millions. Arcade testing kicks off. The community that held through the DMCA and the rebuild reaps the moment.',
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
  },
  {
    date: 'October 2025',
    title: 'New Art Team',
    body: 'The original art team is out. SmokeThatDank and ApeProfessore step up and take over — two artists already deep in the AOA community who believe in the project. They commit to building the definitive generative collection from scratch: 10,000 fully original pieces, new traits, new soul. The art is no longer outsourced — it\'s made by the community, for the community.',
    icon: Palette,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/25',
  },
  {
    date: 'December 2025',
    title: 'New Art Delivered',
    body: 'The moment holders had been waiting for. Metadata is updated on-chain and every holder receives their fully original, generative Ape — replacing the placeholder that launched with the mint. apesonape.io goes live as a creator-first playground: SoundCloud integration, AI studio, AOA Arcade, 3D avatars for the Otherside. The real AOA era begins.',
    icon: Palette,
    color: 'text-hero-blue',
    bg: 'bg-hero-blue/10',
    border: 'border-hero-blue/25',
  },
  {
    date: 'Today',
    title: 'Creative Powerhouse',
    body: 'AOA doubles down on culture. NoTime, 2Real2x, SmokeThatDank, ApeProfessore — real artists releasing real music. 2M+ SoundCloud plays. Arcade games. Wardrobe drops. A community that ships daily and measures success in plays, not price. The DMCA story isn\'t baggage — it\'s the badge.',
    icon: Music2,
    color: 'text-hero-blue',
    bg: 'bg-hero-blue/10',
    border: 'border-hero-blue/25',
  },
];

const STATS = [
  { label: 'Unique Holders',     value: '1,500+' },
  { label: 'Total Supply',       value: '10,000' },
  { label: 'SoundCloud Plays',   value: '2M+' },
  { label: 'X Community',        value: '3,500+' },
];

const PERKS = [
  { icon: Music2,   title: 'AOA Records',      desc: 'Release music under the AOA label. SoundCloud integration for every holder. Drop singles, EPs, and albums with your Ape as the face.' },
  { icon: Palette,  title: 'Creative Studio',  desc: 'AI-powered art generation, PFP borders, custom banners, QR codes. Holder-only creative tools that actually ship product.' },
  { icon: Gamepad2, title: 'AOA Arcade',        desc: 'Browser-based games built by holder-devs on ApeChain. NFT incentives. New titles dropping as the community builds.' },
  { icon: Users,    title: '3D Avatars',        desc: 'Export your Ape as a 3D avatar for use in Otherside and metaverse experiences. Your NFT, your presence.' },
  { icon: Zap,      title: 'Rarity & Trading',  desc: 'Track your portfolio rarity, find rare trait combinations, and trade on OpenSea and Mintify — all on ApeChain.' },
];

const ECOSYSTEM_APPS = [
  { name: 'OpenSea',     href: 'https://opensea.io/collection/apes-on-apechain',        tag: 'Marketplace' },
  { name: 'Otherside',   href: 'https://apechain.com/apps/otherside',                   tag: 'Metaverse' },
  { name: 'Camelot DEX', href: 'https://apechain.com/apps/camelot',                     tag: 'DeFi' },
  { name: 'Ape Portal',  href: 'https://apechain.com/apps/ape-portal',                  tag: 'Bridge' },
];

const FAQS = [
  {
    q: 'What is the DMCA story?',
    a: 'The original collection was hit with a DMCA from Yuga Labs for art too similar to BAYC. Rather than fold, the community rallied, scrapped the old art entirely, and launched a brand-new original collection. That rebirth is now foundational lore — a badge of resilience worn with pride.',
  },
  {
    q: 'What is ApeChain?',
    a: 'ApeChain is a Layer-3 blockchain built on Arbitrum Orbit, with native $APE as gas. Launched October 2024, it\'s built for NFTs, gaming, and creator tools. Transactions cost fractions of a cent. It\'s the official chain of the BAYC ecosystem. Every gas fee burns $APE and is matched by ApeCoin.',
  },
  {
    q: 'What is ApeCoin ($APE)?',
    a: 'The official token of BAYC, Otherside, and ApeChain. Total supply: 1 billion APE (98.5% circulating). Governance token, cultural currency, and gas on ApeChain. apecoin.com for live tokenomics.',
  },
  {
    q: 'When did AOA mint?',
    a: 'AOA originally launched in October 2024 — the same month ApeChain went live — with placeholder art. After a DMCA in December 2024 and a full art rebuild, the collection minted out as 10,000 generative apes on January 8–9, 2025. In December 2025, the metadata was updated on-chain and every holder received their fully original, final artwork.',
  },
  {
    q: 'What is the contract address?',
    a: '0xa6babe18f2318d2880dd7da3126c19536048f8b0 on ApeChain (Chain ID: 33139). Verify on ApeScan.',
  },
  {
    q: 'Can I use my Ape commercially?',
    a: 'Yes. AOA holders have full commercial rights to their token\'s artwork for personal and commercial projects.',
  },
  {
    q: 'How do I get started?',
    a: 'Get $APE → bridge via the Ape Portal → pick up an Ape on OpenSea → sign in to apesonape.io → instant access to music tools, creative studio, and arcade.',
  },
];

// ── Page ───────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Nav />

      {/* ═══════════════════════════════════════════════
          HERO — Full bleed, two-panel
      ════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-end overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-hero-blue/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-cyan/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 w-full container-premium pt-32 pb-20"
        >
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hero-blue/10 border border-hero-blue/30 mb-8"
          >
            <Zap className="w-4 h-4 text-hero-blue" />
            <span className="text-sm font-semibold tracking-widest uppercase text-hero-blue">Our Story</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-end">
            {/* Left — text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-8">
                <span className="text-white">Born from</span>{' '}
                <span className="text-gradient">Chaos.</span>
                <br />
                <span className="text-white">Built for</span>{' '}
                <span className="text-gradient">Culture.</span>
              </h1>
              <p className="text-xl text-white/55 leading-relaxed max-w-lg mb-10">
                A DMCA takedown. A community that didn&apos;t quit. A full rebuild from scratch. 
                10,000 original apes minted natively on ApeChain — now a decentralized 
                creative collective for musicians, artists, builders, and game devs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/collection"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white font-bold transition-all shadow-lg shadow-hero-blue/30 hover:-translate-y-0.5"
                >
                  Explore Collection <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://opensea.io/collection/apes-on-apechain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-white/20 hover:border-hero-blue/50 text-white/80 hover:text-white font-medium transition-all hover:-translate-y-0.5"
                >
                  Buy on OpenSea <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            {/* Right — Before & After */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="flex gap-4 items-end"
            >
              {/* Original art — the DMCA one */}
              <div className="flex-1 group relative">
                <div className="relative rounded-2xl overflow-hidden border border-red-500/30 shadow-xl shadow-red-500/10">
                  <Image
                    src="/aoa-original-7650.png"
                    alt="AOA Original Art #7649 — Before DMCA"
                    width={400}
                    height={400}
                    className="w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    priority
                  />
                  {/* Red overlay to signal "removed" */}
                  <div className="absolute inset-0 bg-red-900/20 group-hover:bg-transparent transition-colors duration-700" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm">
                    <AlertTriangle className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">DMCA'd</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm">
                    <div className="text-xs font-bold text-red-400">Original Art #7649</div>
                    <div className="text-[10px] text-white/40 mt-0.5">The art that started it all — taken down in late 2024</div>
                  </div>
                </div>
              </div>

              {/* New art — from CDN */}
              <div className="flex-1 group relative">
                <div className="relative rounded-2xl overflow-hidden border border-hero-blue/40 shadow-xl shadow-hero-blue/15">
                  <Image
                    src={`${CDN_THUMB}/7649.webp`}
                    alt="AOA Reborn Art #7649 — After Rebirth"
                    width={400}
                    height={400}
                    className="w-full object-cover"
                    unoptimized
                    priority
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-hero-blue/90 backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Reborn</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm">
                    <div className="text-xs font-bold text-hero-blue">New Art #7649</div>
                    <div className="text-[10px] text-white/40 mt-0.5">100% original. Delivered to holders Dec 2025.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════ */}
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="container-premium">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex flex-col items-center gap-1 px-6 py-8 text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <span className="text-3xl md:text-4xl font-black text-white">{s.value}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-white/35 font-semibold">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          THE ORIGIN STORY — Editorial pull quote
      ════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-hero-blue/3 to-transparent pointer-events-none" />
        <div className="container-premium relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Section label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15 mb-8">
              <span className="text-xs uppercase tracking-widest text-white/50">The Origin</span>
            </div>

            {/* Pull quote */}
            <blockquote className="relative mb-10">
              <div className="absolute -left-4 -top-2 text-[120px] leading-none text-hero-blue/10 font-black select-none">&ldquo;</div>
              <p className="text-3xl md:text-4xl font-black text-white leading-tight relative z-10">
                The DMCA didn&apos;t kill Apes on Ape.<br />
                <span className="text-gradient">It created it.</span>
              </p>
            </blockquote>

            <div className="grid md:grid-cols-2 gap-8 text-white/60 leading-relaxed text-lg">
              <div className="space-y-5">
                <p>
                  It started with ambition: be the first NFT project to launch natively on ApeChain the moment it went live in October 2024. The timing was right. The vision was clear. Holders minted in with placeholder art, trusting the team to deliver. Then, in December 2024, Yuga Labs issued a DMCA takedown — the original art was too close to BAYC&apos;s DNA.
                </p>
                <p>
                  Platforms delisted. The project went dark. Most wrote it off. But within the Ape community, something different happened — a rallying call. BAYC holders and Ape ecosystem supporters showed up and said: <em className="text-white/85 not-italic font-semibold">"We don&apos;t abandon builders. We help them rebuild."</em>
                </p>
              </div>
              <div className="space-y-5">
                <p>
                  The team scrapped every pixel of the original art and started fresh. New traits. New palette. New soul. The same rebellious, loud, creative ape energy — now entirely original, entirely theirs. On January 8–9, 2025, Apes on Ape minted out as a 10,000-piece generative collection — the OG ape project on ApeChain.
                </p>
                <p>
                  In December 2025, the metadata was updated on-chain and every holder received their fully original generative Ape — replacing the placeholder from launch day. The DMCA story isn&apos;t a cautionary tale. It&apos;s the founding myth. <span className="text-white/85 font-semibold">Apes Together Strong wasn&apos;t just a slogan. It was what actually happened.</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          BEFORE & AFTER — Full width comparison
      ════════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/6">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-white mb-3">Before & After</h2>
            <p className="text-white/40 max-w-lg mx-auto">
              Same token ID. Different eras. The left is where it started — taken down. The right is where AOA lives now.
            </p>
          </motion.div>

          {/* Two images side by side with central divider */}
          <div className="relative max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Old */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative aspect-square"
              >
                <Image
                  src="/aoa-original-7650.png"
                  alt="Original AOA #7650"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/80 mb-2">
                    <AlertTriangle className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase">DMCA'd · Late 2024</span>
                  </div>
                  <div className="text-sm font-bold text-white">AOA #7650 — Original</div>
                  <div className="text-[11px] text-white/50">The art that started the story</div>
                </div>
              </motion.div>

              {/* New */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative aspect-square"
              >
                <Image
                  src={`${CDN_THUMB}/7649.webp`}
                  alt="Reborn AOA #7649"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-bl from-hero-blue/25 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-hero-blue/90 mb-2">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase">New Art · Dec 2025</span>
                  </div>
                  <div className="text-sm font-bold text-white">AOA #7649 — Reborn</div>
                  <div className="text-[11px] text-white/50">100% original art, delivered Dec 2025</div>
                </div>
              </motion.div>
            </div>

            {/* Centre divider line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 z-10 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-10 h-10 rounded-full bg-background border-2 border-white/20 flex items-center justify-center shadow-xl">
                <RefreshCw className="w-4 h-4 text-white/50" />
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-6 mt-8 text-sm">
              <Link href="/collection/7649" className="inline-flex items-center gap-1.5 text-hero-blue hover:text-hero-blue-light transition-colors font-medium">
              View Ape #7649 rarity <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/collection" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors">
              Browse full collection <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TIMELINE
      ════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15 mb-5">
              <span className="text-xs uppercase tracking-widest text-white/50">Timeline</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white">The Full Journey</h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent md:left-1/2 md:-translate-x-px" />

            <div className="space-y-10 md:space-y-0">
              {TIMELINE.map((item, i) => {
                const Icon = item.icon;
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`relative flex gap-6 md:gap-0 md:w-full ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} md:mb-10`}
                  >
                    {/* Card — desktop takes half width */}
                    <div className={`pl-10 md:pl-0 flex-1 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                      <div className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${item.bg} ${item.border}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center border ${item.border}`}>
                            <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                          </div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${item.color}`}>{item.date}</span>
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-white/55 leading-relaxed">{item.body}</p>
                      </div>
                    </div>

                    {/* Centre dot — desktop only */}
                    <div className="hidden md:flex absolute left-1/2 top-6 -translate-x-1/2 z-10 w-10 h-10 rounded-full items-center justify-center border-2 border-white/20 bg-background shadow-xl">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>

                    {/* Mobile dot */}
                    <div className={`absolute left-0 top-6 md:hidden w-10 h-10 rounded-full flex items-center justify-center border-2 ${item.border} ${item.bg} shadow-lg`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>

                    {/* Empty half on desktop */}
                    <div className="hidden md:block flex-1" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          APE TOKEN + CHAIN INFO
      ════════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/6">
        <div className="container-premium">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15 mb-5">
                <span className="text-xs uppercase tracking-widest text-white/50">The Chain</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-5">Built on ApeChain</h2>
              <div className="space-y-4 text-white/60 leading-relaxed">
                <p>
                  ApeChain is the official blockchain of the Bored Ape Yacht Club ecosystem — built on Arbitrum Orbit as a Layer-3 with <strong className="text-white/85">native $APE as gas</strong>. Launched October 2024, it was purpose-built for gaming, NFTs, and creator tools.
                </p>
                <p>
                  Every transaction burns its gas in $APE, and ApeCoin matches every burn — creating an economically self-reinforcing loop. With a total supply of <strong className="text-white/85">1 billion APE</strong>, it&apos;s the currency of Ape culture.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                {[
                  { label: 'Chain ID',      value: '33139' },
                  { label: 'Gas Token',     value: 'APE' },
                  { label: 'APE Supply',    value: '1 Billion' },
                  { label: 'Gas Model',     value: 'Burn + Match' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl bg-white/3 border border-white/10">
                    <div className="text-[10px] uppercase tracking-widest text-white/35 mb-1">{s.label}</div>
                    <div className="text-lg font-black text-hero-blue">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <a href="https://apecoin.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-hero-blue/40 transition-all text-sm">
                  apecoin.com <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href="https://apechain.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-hero-blue/40 transition-all text-sm">
                  apechain.com <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              {ECOSYSTEM_APPS.map((app, i) => (
                <a
                  key={app.name}
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-5 rounded-2xl bg-white/3 border border-white/10 hover:border-hero-blue/40 hover:bg-hero-blue/5 transition-all"
                >
                  <div className="text-[10px] uppercase tracking-widest text-hero-blue font-bold mb-2">{app.tag}</div>
                  <div className="font-bold text-white group-hover:text-hero-blue transition-colors">{app.name}</div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/15 mt-2 group-hover:text-hero-blue/50 transition-colors" />
                </a>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOLDER PERKS
      ════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">What Holding Unlocks</h2>
            <p className="text-white/40 max-w-lg mx-auto">Your Ape is your key. Holder benefits built for creators, not collectors.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="group p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-hero-blue/40 hover:bg-hero-blue/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-hero-blue/10 flex items-center justify-center mb-4 group-hover:bg-hero-blue/20 transition-colors">
                    <Icon className="w-6 h-6 text-hero-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{perk.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{perk.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-white/6">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-black text-white">FAQ</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-hero-blue/25 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-hero-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-white mb-2">{faq.q}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════ */}
      <section className="container-premium pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-hero-blue/30 p-12 md:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(0,84,249,0.12) 0%, rgba(0,217,255,0.06) 100%)' }}
        >
          <div className="absolute inset-0 bg-hero-blue/5 blur-3xl rounded-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/3 w-[400px] h-[200px] bg-hero-blue/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-[0.25em] text-hero-blue/70 font-bold mb-4">Still Building. Still Loud. Still Together.</div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-5">
              Apes on <span className="text-gradient">ApeChain.</span>
            </h2>
            <p className="text-white/50 mb-10 max-w-md mx-auto leading-relaxed">
              From DMCA to mint-out. From setback to 2M+ plays. 
              The story isn&apos;t over — it&apos;s just warming up.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://opensea.io/collection/apes-on-apechain"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white font-bold transition-all shadow-lg shadow-hero-blue/30 hover:-translate-y-0.5"
              >
                Buy on OpenSea
              </a>
              <Link
                href="/collection"
                className="px-8 py-4 rounded-xl border border-white/25 hover:border-hero-blue/50 text-white/80 hover:text-white font-medium transition-all hover:-translate-y-0.5"
              >
                Browse Collection
              </Link>
              <a
                href="https://discord.gg/gVmqW6SExU"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border border-white/25 hover:border-hero-blue/50 text-white/80 hover:text-white font-medium transition-all hover:-translate-y-0.5"
              >
                Join Discord
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
