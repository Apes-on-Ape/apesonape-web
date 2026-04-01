'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const CDN_THUMB = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

type SaleEvent = {
  tokenId: number;
  price: string;
  priceRaw: number;
  buyer: string;
  seller: string;
  marketplace: string;
  txHash: string;
  timestamp: number;
};

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RecentSalesFeed({ compact = false }: { compact?: boolean }) {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(data.sales || []);
    } catch {
      // silent fail — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    intervalRef.current = setInterval(fetchSales, 60_000); // refresh every minute
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (compact) {
    // Horizontal ticker strip
    return (
      <div className="relative overflow-hidden bg-hero-blue/5 border-y border-hero-blue/15 py-3">
        {loading ? (
          <div className="flex items-center gap-3 px-4">
            <TrendingUp className="w-4 h-4 text-hero-blue flex-shrink-0" />
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
          </div>
        ) : sales.length === 0 ? null : (
          <div className="flex items-center gap-2 px-4 overflow-x-auto scrollbar-none">
            <TrendingUp className="w-4 h-4 text-hero-blue flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest text-hero-blue mr-2 flex-shrink-0">Live Sales</span>
            <div className="flex items-center gap-4">
              {sales.slice(0, 10).map((sale, i) => (
                <motion.div
                  key={`${sale.tokenId}-${sale.timestamp}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Link href={`/collection/${sale.tokenId}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <div className="w-6 h-6 rounded overflow-hidden relative flex-shrink-0">
                      <Image src={`${CDN_THUMB}/${sale.tokenId}.webp`} alt="" fill unoptimized className="object-cover" />
                    </div>
                    <span className="text-xs font-bold text-white">#{sale.tokenId}</span>
                  </Link>
                  <span className="text-xs text-accent-cyan font-medium">{sale.price}</span>
                  <span className="text-[10px] text-white/30">{timeAgo(sale.timestamp)}</span>
                  <span className="text-white/15 text-xs">·</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full list view
  return (
    <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-bold text-white">Recent Sales</span>
        </div>
        <span className="text-xs text-white/30">Live • refreshes every 60s</span>
      </div>

      {loading ? (
        <div className="space-y-0 divide-y divide-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="py-16 text-center text-white/30 text-sm">No recent sales data available.</div>
      ) : (
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {sales.map((sale, i) => (
              <motion.div
                key={`${sale.tokenId}-${sale.timestamp}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
              >
                <Link href={`/collection/${sale.tokenId}`} className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-white/10 hover:border-hero-blue/40 transition-colors">
                    <Image src={`${CDN_THUMB}/${sale.tokenId}.webp`} alt={`#${sale.tokenId}`} fill unoptimized className="object-cover" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/collection/${sale.tokenId}`}>
                    <div className="font-bold text-white hover:text-hero-blue transition-colors">Ape #{sale.tokenId}</div>
                  </Link>
                  <div className="text-xs text-white/40 truncate">
                    <span className="text-white/30">{shortAddr(sale.seller)}</span>
                    <span className="mx-1.5 text-white/15">→</span>
                    <span className="text-white/30">{shortAddr(sale.buyer)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-accent-cyan">{sale.price}</div>
                  <div className="text-[11px] text-white/30">{timeAgo(sale.timestamp)}</div>
                </div>
                <div className="flex-shrink-0">
                  {sale.txHash && (
                    <a
                      href={`https://explorer.apechain.com/tx/${sale.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white/25 hover:text-white/60" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
