'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  ExternalLink,
  RefreshCcw,
  Search,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import SafeImage from '../components/SafeImage';
import type {
  CommunityDetail,
  CommunityRecord,
  DashboardSnapshot,
  Period,
  TimeseriesPoint,
} from '@/lib/dashboard/types';

type Props = {
  initialData?: DashboardSnapshot;
  initialError?: string;
};

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const wholeNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function formatNumber(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return compactNumber.format(value);
}

function formatWhole(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return wholeNumber.format(value);
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function mergeTimeseries(
  onchain: TimeseriesPoint[],
  social: CommunityDetail['social']['dailyMentions7d'] | undefined
) {
  return onchain.map((point, idx) => ({
    date: point.date,
    tx: point.txCount,
    wallets: point.uniqueWallets,
    mentions: social?.[idx]?.count ?? 0,
  }));
}

function MetricCard({
  title,
  value,
  icon,
  accent = 'from-hero-blue/20 to-ape-gold/10',
  hint,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="glass-dark border border-white/10 rounded-2xl p-4 md:p-5 flex items-start gap-3">
      <div
        className={classNames(
          'w-10 h-10 rounded-xl flex items-center justify-center text-hero-blue',
          'bg-gradient-to-br',
          accent
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-off-white/70">{title}</div>
        <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          {value}
        </div>
        {hint ? <div className="text-xs text-off-white/60 mt-1">{hint}</div> : null}
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-hero-blue to-ape-gold transition-all duration-300"
        style={{ width: `${Math.min(1, value) * 100}%` }}
      />
    </div>
  );
}

function MiniChart({
  points,
  color,
}: {
  points: Array<{ date: string; value: number }>;
  color: string;
}) {
  if (!points.length) return null;
  const width = 120;
  const height = 40;
  const padding = 6;
  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const step = (width - padding * 2) / Math.max(points.length - 1, 1);

  const path = points
    .map((p, idx) => {
      const x = padding + step * idx;
      const y =
        height - padding - (Math.min(p.value, maxValue) / Math.max(maxValue, 1)) * (height - padding * 2);
      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TimeseriesChart({
  series,
}: {
  series: Array<{ date: string; tx: number; wallets: number; mentions: number }>;
}) {
  if (!series.length) return <div className="text-sm text-off-white/60">No chart data yet.</div>;

  const width = 640;
  const height = 260;
  const padding = 28;
  const maxValue = Math.max(
    ...series.flatMap((p) => [p.tx, p.wallets, p.mentions]),
    1
  );
  const step = (width - padding * 2) / Math.max(series.length - 1, 1);

  const toPoint = (value: number, idx: number) => {
    const x = padding + step * idx;
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    return { x, y };
  };

  const buildPath = (accessor: (p: typeof series[number]) => number) =>
    series
      .map((point, idx) => {
        const { x, y } = toPoint(accessor(point), idx);
        return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');

  const txPath = buildPath((p) => p.tx);
  const walletsPath = buildPath((p) => p.wallets);
  const mentionsPath = buildPath((p) => p.mentions);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 text-xs text-off-white/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-hero-blue" />
          On-chain tx
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-ape-gold" />
          Unique wallets
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#1DA1F2]" />
          Social mentions
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full bg-white/5 rounded-xl p-2">
        <g>
          {series.map((point, idx) => {
            const { x } = toPoint(point.tx, idx);
            return (
              <line
                key={point.date}
                x1={x}
                x2={x}
                y1={padding}
                y2={height - padding}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}
        </g>
        <path d={txPath} fill="none" stroke="#38bdf8" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <path
          d={walletsPath}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={mentionsPath}
          fill="none"
          stroke="#1DA1F2"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((point, idx) => {
          const { x, y } = toPoint(point.tx, idx);
          return <circle key={`${point.date}-tx`} cx={x} cy={y} r={3} fill="#38bdf8" />;
        })}
        {series.map((point, idx) => {
          const { x, y } = toPoint(point.wallets, idx);
          return <circle key={`${point.date}-wallets`} cx={x} cy={y} r={3} fill="#fbbf24" />;
        })}
        {series.map((point, idx) => {
          const { x, y } = toPoint(point.mentions, idx);
          return <circle key={`${point.date}-mentions`} cx={x} cy={y} r={3} fill="#1DA1F2" />;
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-off-white/60 mt-2">
        {series.map((p) => (
          <span key={p.date}>{p.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

function DetailDrawer({
  record,
  detail,
  loading,
  onClose,
}: {
  record: CommunityRecord | null;
  detail: CommunityDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const mergedSeries = detail
    ? mergeTimeseries(detail.onchain.timeseriesDaily7d, detail.social.dailyMentions7d)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur">
      <div className="bg-[#0b0c10] border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {record?.collection.image ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40">
                <SafeImage
                  src={record.collection.image}
                  alt={record.collection.name}
                  className="w-full h-full object-cover"
                  width={96}
                  height={96}
                />
              </div>
            ) : null}
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {record?.collection.name || 'Community detail'}
              </div>
              <div className="text-xs text-off-white/60">
                {record?.collection.contractAddress
                  ? `${record.collection.contractAddress.slice(0, 6)}...${record.collection.contractAddress.slice(-4)}`
                  : ''}
              </div>
            </div>
          </div>
          <button
            className="text-off-white/60 hover:text-white transition-colors text-sm"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {loading && <div className="text-off-white/70 text-sm">Loading details...</div>}

          {!loading && detail && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  title="Tx (7d)"
                  value={formatWhole(detail.onchain.txCount7d)}
                  icon={<Activity className="w-5 h-5" />}
                  accent="from-hero-blue/20 to-hero-blue/5"
                />
                <MetricCard
                  title="Wallets (7d)"
                  value={formatWhole(detail.onchain.uniqueWallets7d)}
                  icon={<Users className="w-5 h-5" />}
                  accent="from-ape-gold/20 to-ape-gold/5"
                />
                <MetricCard
                  title="Mentions (7d)"
                  value={formatWhole(detail.social.mentions7d)}
                  icon={<Sparkles className="w-5 h-5" />}
                  accent="from-[#1DA1F2]/15 to-[#1DA1F2]/5"
                  hint={detail.social.isMock ? 'Mock data (no X token)' : 'Recent tweet counts'}
                />
                <MetricCard
                  title="On-chain provider"
                  value={<span className="uppercase text-sm">{detail.onchain.provider}</span>}
                  icon={<BarChart2 className="w-5 h-5" />}
                  accent="from-white/15 to-white/5"
                  hint={detail.onchain.provider === 'mock' ? 'Mocked activity' : undefined}
                />
              </div>

              <div className="glass-dark border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    Past 7 days
                  </div>
                  <div className="text-xs text-off-white/60">
                    Last updated {formatDateTime(detail.lastUpdated)}
                  </div>
                </div>
                <TimeseriesChart series={mergedSeries} />
              </div>

              <div className="glass-dark border border-white/10 rounded-xl p-4 space-y-2">
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Links
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {detail.links.magicEden && (
                    <Link
                      href={detail.links.magicEden}
                      className="inline-flex items-center gap-1 text-hero-blue hover:underline"
                      target="_blank"
                    >
                      Magic Eden <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  {detail.links.explorer && (
                    <Link
                      href={detail.links.explorer}
                      className="inline-flex items-center gap-1 text-hero-blue hover:underline"
                      target="_blank"
                    >
                      Explorer <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  {detail.links.website && (
                    <Link
                      href={detail.links.website}
                      className="inline-flex items-center gap-1 text-hero-blue hover:underline"
                      target="_blank"
                    >
                      Website <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  {detail.links.twitter && (
                    <Link
                      href={detail.links.twitter}
                      className="inline-flex items-center gap-1 text-hero-blue hover:underline"
                      target="_blank"
                    >
                      X / Twitter <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ initialData, initialError }: Props) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | undefined>(initialData);
  const [period, setPeriod] = useState<Period>(initialData?.period ?? '7d');
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string>(initialError || '');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CommunityRecord | null>(null);
  const [detail, setDetail] = useState<CommunityDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCache, setDetailCache] = useState<Record<string, CommunityDetail>>({});

  const shareCardRef = useRef<HTMLDivElement>(null);

  const pickOnchain = (record: CommunityRecord, field: 'tx' | 'wallets') =>
    period === '24h'
      ? field === 'tx'
        ? record.onchain.txCount24h
        : record.onchain.uniqueWallets24h
      : field === 'tx'
      ? record.onchain.txCount7d
      : record.onchain.uniqueWallets7d;

  useEffect(() => {
    if (!initialData) {
      void fetchSnapshot(period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSnapshot = async (nextPeriod: Period) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/dashboard/communities?period=${nextPeriod}&limit=100`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Failed to load dashboard (${res.status})`);
      }
      const json = (await res.json()) as DashboardSnapshot;
      setSnapshot(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      setSnapshot(undefined);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!snapshot?.items) return [];
    const term = search.toLowerCase().trim();
    const items = term
      ? snapshot.items.filter((item) => item.collection.name.toLowerCase().includes(term))
      : snapshot.items;
    return items.map((item, index) => ({ ...item, rank: index + 1 }));
  }, [snapshot, search]);

  const openDetail = async (record: CommunityRecord) => {
    setSelected(record);
    const key = record.collection.contractAddress.toLowerCase();
    const cached = detailCache[key];
    if (cached) {
      setDetail(cached);
      return;
    }
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/dashboard/community?contract=${record.collection.contractAddress}`);
      if (!res.ok) throw new Error('Unable to load detail');
      const json = (await res.json()) as CommunityDetail;
      setDetail(json);
      setDetailCache((prev) => ({ ...prev, [key]: json }));
    } catch (err) {
      console.error(err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current || !snapshot) return;
    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(shareCardRef.current, { cacheBust: true });
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `apechain-community-leaderboard-${snapshot.period}.png`;
      anchor.click();
    } catch (err) {
      console.error('share card failed', err);
      setError('Unable to generate share card right now.');
    }
  };

  const headline = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hero-blue/10 border border-hero-blue/30 text-hero-blue text-sm">
          ApeChain Culture Dashboard
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mt-3" style={{ color: 'var(--foreground)' }}>
          Community Leaderboard
        </h1>
        <p className="text-off-white/70 mt-1 text-sm md:text-base">
          Magic Eden collections + on-chain activity + X mentions. Cached, fast, mock-safe.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={classNames(
            'px-3 py-2 rounded-lg border transition-colors text-sm',
            period === '7d'
              ? 'bg-hero-blue text-white border-hero-blue'
              : 'border-white/20 text-off-white/80 hover:border-white/40'
          )}
          onClick={() => {
            setPeriod('7d');
            void fetchSnapshot('7d');
          }}
        >
          Last 7 days
        </button>
        <button
          className={classNames(
            'px-3 py-2 rounded-lg border transition-colors text-sm',
            period === '24h'
              ? 'bg-hero-blue text-white border-hero-blue'
              : 'border-white/20 text-off-white/80 hover:border-white/40'
          )}
          onClick={() => {
            setPeriod('24h');
            void fetchSnapshot('24h');
          }}
        >
          Last 24h
        </button>
        <button
          className="px-3 py-2 rounded-lg border border-white/20 hover:border-white/40 text-off-white/80 hover:text-white transition-colors text-sm inline-flex items-center gap-2"
          onClick={() => void fetchSnapshot(period)}
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  );

  const topCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total transactions"
        value={snapshot ? formatWhole(snapshot.totals.txCount) : '—'}
        icon={<Activity className="w-5 h-5" />}
        hint={snapshot?.topCollection ? `Top: ${snapshot.topCollection.name}` : undefined}
      />
      <MetricCard
        title="Unique active wallets"
        value={snapshot ? formatWhole(snapshot.totals.uniqueWallets) : '—'}
        icon={<Users className="w-5 h-5" />}
        accent="from-ape-gold/20 to-ape-gold/5"
        hint="De-duped across tracked contracts"
      />
      <MetricCard
        title="Top collection by on-chain tx"
        value={
          snapshot?.topCollection ? (
            <div className="flex items-center gap-2">
              {snapshot.topCollection.image ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/30">
                  <SafeImage
                    src={snapshot.topCollection.image}
                    alt={snapshot.topCollection.name}
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                  />
                </div>
              ) : null}
              <span>{snapshot.topCollection.name}</span>
            </div>
          ) : (
            '—'
          )
        }
        icon={<ArrowUpRight className="w-5 h-5" />}
        accent="from-white/15 to-white/5"
      />
      <MetricCard
        title="Total social mentions"
        value={snapshot ? formatWhole(snapshot.totals.socialMentions) : '—'}
        icon={<Sparkles className="w-5 h-5" />}
        accent="from-[#1DA1F2]/15 to-[#1DA1F2]/5"
        hint={snapshot?.isSocialMock ? 'Mock social data (no X token)' : 'Recent X counts'}
      />
    </div>
  );

  const toolbar = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 text-sm text-off-white/70">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
          <BarChart2 className="w-4 h-4" /> Ranked by composite score
        </span>
        {snapshot?.isSocialMock && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2]">
            <AlertTriangle className="w-4 h-4" /> Mock social data
          </span>
        )}
        {snapshot?.lastUpdated && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
            Last updated {formatDateTime(snapshot.lastUpdated)}
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-off-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-hero-blue/60"
            placeholder="Search collection"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-hero-blue to-ape-gold text-black font-semibold hover:brightness-110 transition"
          onClick={handleShare}
          disabled={!snapshot}
        >
          <Share2 className="w-4 h-4" /> Share top 10
        </button>
      </div>
    </div>
  );

  const table = (
    <div className="glass-dark border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-off-white/70">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Collection</th>
              <th className="px-4 py-3 text-left">Contract</th>
              <th className="px-4 py-3 text-left">ME Floor / Vol</th>
              <th className="px-4 py-3 text-right">On-chain tx ({period})</th>
              <th className="px-4 py-3 text-right">Wallets ({period})</th>
              <th className="px-4 py-3 text-right">Mentions (7d)</th>
              <th className="px-4 py-3 text-left">Composite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-off-white/70">
                  Loading dashboard...
                </td>
              </tr>
            )}
            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-off-white/70">
                  {error || 'No data yet. Try refreshing.'}
                </td>
              </tr>
            )}
            {!loading &&
              filteredItems.map((record) => (
                <tr
                  key={record.collection.contractAddress}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => void openDetail(record)}
                >
                  <td className="px-4 py-3 text-sm text-off-white/80 font-semibold">{record.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {record.collection.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
                          <SafeImage
                            src={record.collection.image}
                            alt={record.collection.name}
                            className="w-full h-full object-cover"
                            width={96}
                            height={96}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-off-white/50">
                          —
                        </div>
                      )}
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                          {record.collection.name}
                        </div>
                        <div className="text-xs text-off-white/60 flex items-center gap-2">
                          <span className="uppercase tracking-wide px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {record.onchain.provider}
                          </span>
                          {record.social.isMock && (
                            <span className="text-[#1DA1F2] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Mock social
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-off-white/70">
                    {record.collection.contractAddress ? (
                      <span className="font-mono">
                        {record.collection.contractAddress.slice(0, 6)}...
                        {record.collection.contractAddress.slice(-4)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-off-white/80">
                    <div>{record.collection.floorPrice ? `${formatNumber(record.collection.floorPrice)} Ξ` : '—'}</div>
                    <div className="text-xs text-off-white/60">
                      {record.collection.volume7d
                        ? `${formatNumber(record.collection.volume7d)} vol`
                        : record.collection.volume24h
                        ? `${formatNumber(record.collection.volume24h)} vol`
                        : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    <div className="flex items-center justify-end gap-2">
                      {formatWhole(pickOnchain(record, 'tx'))}
                      <MiniChart
                        points={record.onchain.timeseriesDaily7d.map((p) => ({ date: p.date, value: p.txCount }))}
                        color="#38bdf8"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    <div className="flex items-center justify-end gap-2">
                      {formatWhole(pickOnchain(record, 'wallets'))}
                      <MiniChart
                        points={record.onchain.timeseriesDaily7d.map((p) => ({
                          date: p.date,
                          value: p.uniqueWallets,
                        }))}
                        color="#fbbf24"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {formatWhole(record.social.mentions7d)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {record.score.toFixed(3)}
                    </div>
                    <ScoreBar value={record.score} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const shareCard = snapshot ? (
    <div className="mt-8">
      <div className="text-sm text-off-white/70 mb-2">Share-ready preview</div>
      <div
        ref={shareCardRef}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b1020] to-[#0e1a2d] p-4 shadow-xl max-w-3xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-hero-blue">ApeChain Culture</div>
            <div className="text-xl font-bold text-white">Community Leaderboard</div>
            <div className="text-[11px] text-off-white/70">
              Top 10 · {period === '7d' ? 'Last 7 days' : 'Last 24h'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-off-white/60">Total tx</div>
            <div className="text-lg font-bold text-white">{formatWhole(snapshot.totals.txCount)}</div>
            <div className="text-xs text-off-white/60">Social</div>
            <div className="text-sm font-semibold text-[#1DA1F2]">{formatWhole(snapshot.totals.socialMentions)}</div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {snapshot.items.slice(0, 10).map((item, idx) => (
            <div
              key={item.collection.contractAddress}
              className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/5"
            >
              <div className="w-6 text-center text-off-white/70">#{idx + 1}</div>
              {item.collection.image ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/30">
                  <SafeImage
                    src={item.collection.image}
                    alt={item.collection.name}
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/10" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{item.collection.name}</div>
                <div className="text-[11px] text-off-white/60 truncate">
                  Tx {formatWhole(pickOnchain(item, 'tx'))} · Wallets {formatWhole(pickOnchain(item, 'wallets'))} ·
                  Mentions {formatWhole(item.social.mentions7d)}
                </div>
              </div>
              <div className="text-sm font-semibold text-ape-gold">{item.score.toFixed(3)}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-off-white/60 mt-3">
          apesonape.io/dashboard · Magic Eden + on-chain + social
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div>
      {headline}
      {error && snapshot ? (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-100 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      ) : null}
      {topCards}
      {toolbar}
      {table}
      {shareCard}
      {selected ? (
        <DetailDrawer record={selected} detail={detail} loading={detailLoading} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}


