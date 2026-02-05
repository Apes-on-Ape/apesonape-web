'use client';

import React, { useEffect, useState, useMemo } from 'react';
import SafeImage from '@/app/components/SafeImage';

export type BadgeItem = {
  slug: string;
  title?: string;
  description?: string;
  asset?: string;
  category?: string;
};

type ProfileBadgesProps = {
  /** Single address (e.g. when viewing another user's profile) */
  address?: string | null;
  /** All wallets from Glyph (evm + smart + linked) for own profile */
  addresses?: string[];
  /** Show refresh button (e.g. only for own profile) */
  showRefresh?: boolean;
  className?: string;
};

export function ProfileBadges({ address, addresses, showRefresh = false, className = '' }: ProfileBadgesProps) {
  const effectiveAddresses = addresses?.length ? addresses : (address ? [address] : []);
  const [earnedBadges, setEarnedBadges] = useState<BadgeItem[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeItem[]>([]);
  const [totalApes, setTotalApes] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!effectiveAddresses.length);
  const [refreshing, setRefreshing] = useState(false);
  
  const earnedSlugs = useMemo(() => new Set(earnedBadges.map(b => b.slug)), [earnedBadges]);

  // Fetch all badge definitions
  useEffect(() => {
    let cancelled = false;
    fetch('/api/badges/all', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAllBadges(Array.isArray(data.badges) ? data.badges : []);
      })
      .catch(() => {
        if (!cancelled) setAllBadges([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch earned badges
  useEffect(() => {
    if (!effectiveAddresses.length) {
      setEarnedBadges([]);
      setTotalApes(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const query = effectiveAddresses.length === 1
      ? `address=${encodeURIComponent(effectiveAddresses[0])}`
      : effectiveAddresses.map((a) => `addresses=${encodeURIComponent(a)}`).join('&');
    fetch(`/api/profile/badges?${query}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setEarnedBadges(Array.isArray(data.badges) ? data.badges : []);
        setTotalApes(typeof data.totalApes === 'number' ? data.totalApes : null);
      })
      .catch(() => {
        if (!cancelled) setEarnedBadges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveAddresses.join(',')]);

  const refresh = async () => {
    if (!effectiveAddresses.length) return;
    setRefreshing(true);
    try {
      const query = effectiveAddresses.length === 1
        ? `address=${encodeURIComponent(effectiveAddresses[0])}&refresh=1`
        : effectiveAddresses.map((a) => `addresses=${encodeURIComponent(a)}`).join('&') + '&refresh=1';
      const res = await fetch(`/api/profile/badges?${query}`, { cache: 'no-store' });
      const data = await res.json();
      setEarnedBadges(Array.isArray(data.badges) ? data.badges : []);
      setTotalApes(typeof data.totalApes === 'number' ? data.totalApes : null);
    } finally {
      setRefreshing(false);
    }
  };

  if (!effectiveAddresses.length) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-hero-blue via-purple-400 to-ape-gold bg-clip-text text-transparent">
          Ape Badges
        </h2>
        {showRefresh && (
          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-hero-blue/20 to-purple-500/20 border-2 border-hero-blue/40 hover:border-hero-blue/60 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Refreshing…</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🔄</span>
                <span>Refresh</span>
              </span>
            )}
          </button>
        )}
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-black border-2 border-white/10 p-6 sm:p-8 shadow-xl shadow-black/40 bg-gradient-to-br from-black via-black/95 to-black">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-off-white/70 text-sm">Loading badges…</p>
          </div>
        )}
        {!loading && allBadges.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-off-white/70 text-sm text-center">
              Loading badges…
            </p>
          </div>
        )}
        {!loading && allBadges.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6">
              {allBadges.map((b) => {
                const isEarned = earnedSlugs.has(b.slug);
                return (
                  <div
                    key={b.slug}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 shadow-lg ${
                      isEarned
                        ? 'bg-gradient-to-br from-black/60 via-black/40 to-black/60 border-hero-blue/30 hover:border-hero-blue/60 hover:bg-black/80 hover:shadow-xl hover:shadow-hero-blue/20 hover:scale-105'
                        : 'bg-black/30 border-white/5 opacity-60'
                    }`}
                    title={b.description || b.title}
                  >
                    <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-black border-2 flex items-center justify-center relative shadow-inner transition-all ${
                      isEarned ? 'border-hero-blue/40 shadow-hero-blue/20' : 'border-white/5'
                    }`}>
                      <SafeImage
                        src={b.asset ? `/badges/${b.asset}` : ''}
                        alt={b.title || b.slug}
                        width={128}
                        height={128}
                        className={`object-contain w-full h-full p-1 transition-all ${
                          isEarned ? 'hover:scale-110' : 'grayscale brightness-[0.25] contrast-50'
                        }`}
                      />
                      {!isEarned && (
                        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/90 to-black/85 flex items-center justify-center backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-xl opacity-70">🔒</span>
                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Locked</span>
                          </div>
                        </div>
                      )}
                      {isEarned && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-ape-gold rounded-full border-2 border-black shadow-lg flex items-center justify-center">
                          <span className="text-[8px]">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <div className={`text-sm sm:text-base font-bold leading-tight mb-1 ${
                        isEarned ? 'text-white' : 'text-off-white/40'
                      }`}>
                        {b.title}
                      </div>
                      {b.description && (
                        <div className={`text-xs leading-tight px-1 ${
                          isEarned ? 'text-off-white/80' : 'text-off-white/30'
                        }`}>
                          {b.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {totalApes !== null && totalApes > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-white/10">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-2xl">🦍</div>
                  <p className="text-base font-bold text-center">
                    <span className="text-hero-blue text-xl">{totalApes}</span>
                    <span className="text-off-white/80 ml-2">Ape{totalApes !== 1 ? 's' : ''} in wallet</span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
