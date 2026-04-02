'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, Lock } from 'lucide-react';

export type ArcadeAchievementRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  reward_xp: number;
  is_hidden: boolean;
  earned: boolean;
  unlocked_at: string | null;
};

type SummaryResponse = {
  earnedCount: number;
  total: number;
  achievements: ArcadeAchievementRow[];
};

type Props = {
  addresses: string[];
  className?: string;
  /** Tighter layout for the arcade lobby hero area */
  variant?: 'profile' | 'lobby';
};

function categoryLabel(cat: string) {
  if (!cat) return 'Other';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function ArcadeAchievementsPanel({ addresses, className = '', variant = 'profile' }: Props) {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const addrKey = addresses.join(',');

  useEffect(() => {
    if (!addresses.length) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    addresses.forEach((a) => params.append('addresses', a));
    fetch(`/api/achievements/summary?${params.toString()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('bad response');
        return r.json();
      })
      .then((json: SummaryResponse) => {
        if (cancelled) return;
        setData(
          json?.achievements
            ? json
            : { earnedCount: 0, total: 0, achievements: [] }
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addrKey]);

  const grouped = useMemo(() => {
    if (!data?.achievements?.length) return [];
    const m = new Map<string, ArcadeAchievementRow[]>();
    for (const a of data.achievements) {
      const c = a.category || 'other';
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(a);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  if (!addresses.length) return null;

  const isLobby = variant === 'lobby';
  const pad = isLobby ? 'p-4 sm:p-5' : 'p-5 sm:p-6';
  const gridCols = isLobby
    ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4'
    : 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm ${pad} ${className}`}
      aria-labelledby="arcade-achievements-heading"
    >
      <div className={`mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.12)] ${isLobby ? 'h-10 w-10' : 'h-11 w-11'}`}
          >
            <Award className={`text-amber-200 ${isLobby ? 'h-5 w-5' : 'h-5 w-5'}`} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              id="arcade-achievements-heading"
              className={`font-black tracking-tight text-white ${isLobby ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}
            >
              Arcade achievements
            </h2>
            <p className={`text-zinc-500 ${isLobby ? 'text-xs sm:text-sm' : 'text-sm'}`}>
              {loading
                ? 'Loading…'
                : error
                  ? 'Could not load achievements.'
                  : data
                    ? `${data.earnedCount} / ${data.total} unlocked`
                    : '—'}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className={gridCols}>
          {Array.from({ length: isLobby ? 8 : 10 }).map((_, i) => (
            <div
              key={i}
              className="h-[5.5rem] animate-pulse rounded-xl border border-white/10 bg-zinc-900/60 sm:h-[6rem]"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-sm text-zinc-500">Try again later.</p>
      )}

      {!loading && !error && data && grouped.length === 0 && (
        <p className="text-center text-sm text-zinc-500">No achievements in catalog.</p>
      )}

      {!loading && !error && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([cat, items]) => (
            <div key={cat}>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
                {categoryLabel(cat)}
              </p>
              <div className={gridCols}>
                {items.map((a) => (
                  <div
                    key={a.id}
                    title={a.description}
                    className={`flex flex-col rounded-xl border px-2.5 py-2.5 transition sm:px-3 sm:py-3 ${
                      a.earned
                        ? 'border-amber-400/25 bg-amber-500/[0.07] ring-1 ring-amber-500/10'
                        : 'border-white/[0.08] bg-zinc-950/50 opacity-[0.85]'
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-1">
                      <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                        {a.earned ? a.icon : '❔'}
                      </span>
                      {!a.earned && (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-label="Locked" />
                      )}
                    </div>
                    <p
                      className={`line-clamp-2 text-[11px] font-bold leading-snug sm:text-xs ${
                        a.earned ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                    >
                      {a.earned ? a.name : a.is_hidden ? '???' : a.name}
                    </p>
                    {a.earned && a.reward_xp > 0 && (
                      <p className="mt-1 text-[10px] font-semibold tabular-nums text-amber-200/80">
                        +{a.reward_xp} XP
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
