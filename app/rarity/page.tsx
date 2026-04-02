'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Crown, Zap, Star, Shield, Circle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

type TierIcon = React.ComponentType<{ className?: string }>;

const CDN_THUMB = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';
const thumbUrl = (id: number) => `${CDN_THUMB}/${id}.webp`;

type Tier = 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';

type RarityEntry = {
  id: number;
  rank: number;
  score: number;
  tier: Tier;
  traits: Array<{ name: string; value: string; count: number; rarity: number }>;
};

const TIER_CONFIG: Record<Tier, { icon: TierIcon; color: string; bg: string; border: string; glow: string }> = {
  Legendary: { icon: Crown,  color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/40', glow: 'shadow-amber-500/20'  },
  Epic:      { icon: Zap,    color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/40',glow: 'shadow-purple-500/20' },
  Rare:      { icon: Star,   color: 'text-hero-blue',   bg: 'bg-hero-blue/10',  border: 'border-hero-blue/40', glow: 'shadow-hero-blue/20'  },
  Uncommon:  { icon: Shield, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10',border: 'border-accent-cyan/40',glow: 'shadow-accent-cyan/20' },
  Common:    { icon: Circle, color: 'text-white/50',    bg: 'bg-white/5',       border: 'border-white/15',     glow: ''                     },
};

const TIERS: Tier[] = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export default function RarityPage() {
  const [entries, setEntries] = useState<RarityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTier, setActiveTier] = useState<Tier | ''>('');
  const [tierCounts, setTierCounts] = useState<Record<Tier, number>>({} as Record<Tier, number>);
  const LIMIT = 24;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRarity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeTier) params.set('tier', activeTier);
      const res = await fetch(`/api/rarity?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.tierCounts) setTierCounts(data.tierCounts);
    } finally {
      setLoading(false);
    }
  }, [page, activeTier]);

  useEffect(() => { fetchRarity(); }, [fetchRarity]);

  // Client-side search within loaded entries
  const displayed = debouncedSearch
    ? entries.filter(e => String(e.id).includes(debouncedSearch) ||
        e.traits.some(t => t.value.toLowerCase().includes(debouncedSearch.toLowerCase())))
    : entries;

  const handleTierChange = (tier: Tier | '') => {
    setActiveTier(tier);
    setPage(1);
  };

  return (
    <div className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-hero-blue/8 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-hero-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container-premium relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hero-blue/10 border border-hero-blue/30 mb-6">
              <Trophy className="w-4 h-4 text-hero-blue" />
              <span className="text-sm font-semibold tracking-widest uppercase text-hero-blue">Rarity Explorer</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              <span className="text-gradient">Ape Rankings</span>
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Every Ape ranked by trait rarity. Discover Legendary, Epic, and Rare Apes in the collection.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tier Stats Bar */}
      <section className="container-premium pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TIERS.map((tier, i) => {
            const cfg = TIER_CONFIG[tier];
            const Icon = cfg.icon;
            const count = tierCounts[tier] || 0;
            return (
              <motion.button
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleTierChange(activeTier === tier ? '' : tier)}
                className={`relative p-4 rounded-xl border transition-all duration-300 text-left cursor-pointer
                  ${activeTier === tier
                    ? `${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow}`
                    : 'bg-white/3 border-white/10 hover:border-white/25'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{tier}</span>
                </div>
                <div className="text-2xl font-black text-white">{count.toLocaleString()}</div>
                <div className="text-xs text-white/40">{total ? ((count / total) * 100).toFixed(1) : '—'}%</div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Search + Filter Bar */}
      <section className="container-premium pb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Ape ID or trait value…"
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/30
                focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all"
            />
          </div>
          {activeTier && (
            <button
              onClick={() => handleTierChange('')}
              className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
            >
              Clear filter
            </button>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="container-premium pb-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24 text-white/40">No Apes found.</div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            <AnimatePresence>
              {displayed.map((entry, i) => {
                const cfg = TIER_CONFIG[entry.tier];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                  >
                    <Link href={`/collection/${entry.id}`}>
                      <div className={`relative group rounded-xl border overflow-hidden cursor-pointer transition-all duration-300
                        hover:-translate-y-1 hover:shadow-xl
                        ${entry.tier !== 'Common' ? `${cfg.border} ${cfg.bg}` : 'border-white/10 bg-white/3'}`}>
                        {/* Image */}
                        <div className="aspect-square relative overflow-hidden">
                          <Image
                            src={thumbUrl(entry.id)}
                            alt={`Ape #${entry.id}`}
                            fill
                            sizes="(max-width: 768px) 50vw, 16vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            unoptimized
                          />
                          {/* Tier badge overlay */}
                          <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md
                            text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} backdrop-blur-sm border ${cfg.border}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {entry.tier}
                          </div>
                          {/* Rank badge */}
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-white/80 backdrop-blur-sm">
                            #{entry.rank}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">#{entry.id}</span>
                            <span className="text-[10px] text-white/40">{entry.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">{entry.traits.length} traits</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {!debouncedSearch && pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/15
                hover:border-hero-blue/40 hover:bg-hero-blue/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-white/50">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/15
                hover:border-hero-blue/40 hover:bg-hero-blue/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
