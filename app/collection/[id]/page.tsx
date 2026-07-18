'use client';

import React, { useState, useEffect } from 'react';

type TierIcon = React.ComponentType<{ className?: string }>;
import { motion } from 'framer-motion';
import { Crown, Zap, Star, Shield, Circle, ArrowLeft, ExternalLink, Trophy, Layers, Wallet, Copy, Check } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

const CDN_THUMB = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';
const thumbUrl = (id: number) => `${CDN_THUMB}/${id}.webp`;
const CDN_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index';

type Tier = 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';

type RarityEntry = {
  id: number;
  rank: number;
  score: number;
  tier: Tier;
  traits: Array<{ name: string; value: string; count: number; rarity: number }>;
};

const TIER_CONFIG: Record<Tier, { icon: TierIcon; color: string; bg: string; border: string; label: string }> = {
  Legendary: { icon: Crown,  color: 'text-amber-400',   bg: 'bg-amber-500/10',  border: 'border-amber-500/40', label: 'Legendary' },
  Epic:      { icon: Zap,    color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/40',label: 'Epic'      },
  Rare:      { icon: Star,   color: 'text-hero-blue',   bg: 'bg-hero-blue/10',  border: 'border-hero-blue/40', label: 'Rare'      },
  Uncommon:  { icon: Shield, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10',border: 'border-accent-cyan/40',label: 'Uncommon' },
  Common:    { icon: Circle, color: 'text-white/50',    bg: 'bg-white/5',       border: 'border-white/15',     label: 'Common'   },
};

export default function ApeDetailPage() {
  const params = useParams();
  const id = parseInt(String(params.id));

  const [rarity, setRarity] = useState<RarityEntry | null>(null);
  const [total, setTotal] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [prevNext, setPrevNext] = useState<{ prev?: RarityEntry; next?: RarityEntry }>({});

  type OwnerData = { owner: string; apescanUrl: string; openseaProfileUrl: string };
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setImgLoaded(false);
    (async () => {
      try {
        const res = await fetch(`/api/rarity?id=${id}`);
        const data = await res.json();
        if (data.entry) {
          setRarity(data.entry);
          setTotal(data.total || 10000);
        }

        // Fetch neighbour ranks
        const rank = data.entry?.rank;
        if (rank) {
          const pageNum = Math.ceil(rank / 1);
          const [prevRes, nextRes] = await Promise.all([
            rank > 1 ? fetch(`/api/rarity?page=${Math.ceil((rank - 1) / 50)}&limit=50`) : Promise.resolve(null),
            rank < data.total ? fetch(`/api/rarity?page=${Math.ceil((rank + 1) / 50)}&limit=50`) : Promise.resolve(null),
          ]);
          const prevData = prevRes ? await prevRes.json() : null;
          const nextData = nextRes ? await nextRes.json() : null;
          const prevEntry = prevData?.entries?.find((e: RarityEntry) => e.rank === rank - 1);
          const nextEntry = nextData?.entries?.find((e: RarityEntry) => e.rank === rank + 1);
          setPrevNext({ prev: prevEntry, next: nextEntry });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fallback image sources: CDN thumb first, then IPFS gateway if needed
  const [imgSrc, setImgSrc] = useState<string>(thumbUrl(id));
  useEffect(() => {
    setImgSrc(thumbUrl(id));
    setImgLoaded(false);
  }, [id]);

  function handleImgError() {
    // Try fetching the IPFS URL from the CDN token index as a fallback
    fetch(`${CDN_BASE}/tokens.json`, { cache: 'force-cache' })
      .then(r => r.json())
      .then((tokens: Array<{ id: number; image?: string }>) => {
        const t = tokens.find(t => t.id === id);
        if (!t?.image) return;
        const raw = t.image;
        // Normalise ipfs:// and bare CIDs to an HTTP gateway URL
        const http = raw.startsWith('ipfs://')
          ? raw.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
          : /^https?:\/\//.test(raw)
            ? raw
            : `https://cloudflare-ipfs.com/ipfs/${raw}`;
        setImgSrc(http);
      })
      .catch(() => {});
  }

  // Fetch on-chain owner from Apechain RPC
  useEffect(() => {
    if (!id) return;
    setOwnerLoading(true);
    setOwnerData(null);
    fetch(`/api/nft/owner/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then((d) => { if (d?.owner) setOwnerData(d); })
      .catch(() => {})
      .finally(() => setOwnerLoading(false));
  }, [id]);

  function copyAddress() {
    if (!ownerData) return;
    navigator.clipboard.writeText(ownerData.owner).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shortAddr(addr: string) {
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  const cfg = rarity ? TIER_CONFIG[rarity.tier] : TIER_CONFIG['Common'];
  const TierIcon = cfg.icon;
  const osUrl = `https://opensea.io/assets/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0/${id}`;
  const mintifyUrl = `https://mintify.xyz/asset/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0/${id}`;

  // Sort traits by rarity desc (rarest first)
  const sortedTraits = rarity?.traits ? [...rarity.traits].sort((a, b) => b.rarity - a.rarity) : [];

  return (
    <div className="min-h-screen">
      <Nav />

      <div className="container-premium pt-28 pb-16">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/collection" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Collection
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" style={{ width: `${60 + i * 5}%` }} />
              ))}
            </div>
          </div>
        ) : !rarity ? (
          <div className="text-center py-24 text-white/40">Ape #{id} not found.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Image Column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`relative rounded-2xl overflow-hidden border-2 ${cfg.border} shadow-2xl`}>
                {/* Glow effect for rare+ */}
                {rarity.tier !== 'Common' && (
                  <div className={`absolute -inset-4 blur-xl opacity-30 ${cfg.bg} pointer-events-none`} />
                )}
                <div className="relative aspect-square">
                  <Image
                    src={imgSrc}
                    alt={`Ape #${id}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={`object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={handleImgError}
                    unoptimized
                    priority
                  />
                  {!imgLoaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                </div>
              </div>

              {/* Prev/Next Navigation */}
              <div className="flex gap-3 mt-4">
                {prevNext.prev ? (
                  <Link href={`/collection/${prevNext.prev.id}`} className="flex-1 group relative overflow-hidden rounded-xl border border-white/10 hover:border-hero-blue/40 transition-all p-2">
                    <div className="text-[10px] text-white/40 mb-1">← Higher Rank</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md overflow-hidden relative flex-shrink-0">
                        <Image src={thumbUrl(prevNext.prev.id)} alt="" fill unoptimized className="object-cover" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">#{prevNext.prev.id}</div>
                        <div className="text-[10px] text-white/40">Rank #{prevNext.prev.rank}</div>
                      </div>
                    </div>
                  </Link>
                ) : <div className="flex-1" />}
                {prevNext.next ? (
                  <Link href={`/collection/${prevNext.next.id}`} className="flex-1 group relative overflow-hidden rounded-xl border border-white/10 hover:border-hero-blue/40 transition-all p-2 text-right">
                    <div className="text-[10px] text-white/40 mb-1">Lower Rank →</div>
                    <div className="flex items-center justify-end gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">#{prevNext.next.id}</div>
                        <div className="text-[10px] text-white/40">Rank #{prevNext.next.rank}</div>
                      </div>
                      <div className="w-8 h-8 rounded-md overflow-hidden relative flex-shrink-0">
                        <Image src={thumbUrl(prevNext.next.id)} alt="" fill unoptimized className="object-cover" />
                      </div>
                    </div>
                  </Link>
                ) : <div className="flex-1" />}
              </div>
            </motion.div>

            {/* Info Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${cfg.bg} ${cfg.border} border ${cfg.color}`}>
                  <TierIcon className="w-3.5 h-3.5" />
                  {rarity.tier}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-1">Ape #{id}</h1>
                <p className="text-white/40">Apes On Ape Collection · Apechain</p>
              </div>

              {/* Rank + Score Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <Trophy className="w-5 h-5 text-hero-blue mx-auto mb-1" />
                  <div className="text-2xl font-black text-white">#{rarity.rank}</div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider">Rank</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <Star className="w-5 h-5 text-accent-cyan mx-auto mb-1" />
                  <div className="text-2xl font-black text-white">{rarity.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider">Rarity Score</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <Layers className="w-5 h-5 text-white/40 mx-auto mb-1" />
                  <div className="text-2xl font-black text-white">{rarity.traits.length}</div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider">Traits</div>
                </div>
              </div>

              {/* Owner Card */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-hero-blue" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">Current Owner</span>
                </div>
                {ownerLoading ? (
                  <div className="h-8 rounded-lg bg-white/10 animate-pulse w-48" />
                ) : ownerData ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-white font-semibold tracking-tight">
                      {shortAddr(ownerData.owner)}
                    </span>
                    <button
                      onClick={copyAddress}
                      title="Copy address"
                      className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={ownerData.apescanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-hero-blue hover:text-hero-blue-light transition-colors"
                    >
                      Apescan <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={ownerData.openseaProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      OpenSea <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-white/30">Could not load owner</span>
                )}
              </div>

              {/* Rarity percentile bar */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex justify-between text-xs text-white/40 mb-2">
                  <span>Rarity Percentile</span>
                  <span>Top {((rarity.rank / total) * 100).toFixed(2)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-hero-blue to-accent-cyan rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - (rarity.rank / total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                  <span>Rarest</span>
                  <span>Most Common</span>
                </div>
              </div>

              {/* Traits */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-3">Traits</h2>
                <div className="grid grid-cols-2 gap-2">
                  {sortedTraits.map((trait, i) => {
                    const pct = ((trait.count / total) * 100).toFixed(2);
                    const isRare = trait.rarity > 50;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        className={`p-3 rounded-xl border transition-colors
                          ${isRare ? 'bg-hero-blue/5 border-hero-blue/25' : 'bg-white/3 border-white/10'}`}
                      >
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">{trait.name}</div>
                        <div className="text-sm font-bold text-white truncate">{trait.value}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[10px] font-medium ${isRare ? 'text-hero-blue' : 'text-white/30'}`}>{pct}% have this</span>
                          {isRare && <Star className="w-3 h-3 text-hero-blue" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Buy CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={osUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
                    bg-hero-blue hover:bg-hero-blue-light text-white font-bold transition-all duration-300
                    shadow-lg shadow-hero-blue/30 hover:shadow-hero-blue/50 hover:-translate-y-0.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buy on OpenSea
                </a>
                <a
                  href={mintifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
                    border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-medium
                    transition-all duration-300 hover:-translate-y-0.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Mintify
                </a>
              </div>

              {/* Links */}
              <div className="flex gap-4 text-xs text-white/30">
                <Link href="/collection" className="hover:text-hero-blue transition-colors flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Rarity Rankings
                </Link>
                <Link href="/collection" className="hover:text-hero-blue transition-colors">
                  Full Collection
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
