'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HOMEPAGE_STATS, formatStat, COLLECTION_SUPPLY } from '@/app/data/stats';

interface LiveStats {
  totalPlayCount?: number;
  playlistCount?: number;
  trackCount?: number;
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return match;
}

function StatItem({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      className="text-center px-8 py-6 border-r last:border-r-0 border-white/8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
    >
      <div
        className="font-black mb-1.5 tabular-nums"
        style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: 'var(--foreground)' }}
      >
        {value}
      </div>
      <div className="type-label" style={{ color: 'var(--text-sub)' }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function HomeStats() {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch('/api/soundcloud/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setLiveStats(data); })
      .catch(() => {/* use fallbacks */});
  }, []);

  const resolveValue = (stat: typeof HOMEPAGE_STATS[0]): string => {
    if (stat.source === 'collection_constant') {
      return COLLECTION_SUPPLY.toLocaleString();
    }
    if (stat.apiField && liveStats) {
      const raw = liveStats[stat.apiField as keyof LiveStats];
      if (typeof raw === 'number' && raw > 0) {
        return formatStat(raw);
      }
    }
    return stat.fallback;
  };

  return (
    <section
      aria-label="Community statistics"
      className="border-t border-white/8"
      style={{
        background: 'linear-gradient(to right, var(--background-surface), rgba(0,84,249,0.04), var(--background-surface))',
      }}
    >
      <div className="container-premium">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/8 divide-y lg:divide-y-0">
          {HOMEPAGE_STATS.map((stat, i) => (
            <StatItem
              key={stat.id}
              label={stat.label}
              value={resolveValue(stat)}
              delay={prefersReducedMotion ? 0 : i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
