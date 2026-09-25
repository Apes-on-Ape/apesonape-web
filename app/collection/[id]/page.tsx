'use client';

import React, { useState, useEffect } from 'react';

type TierIcon = React.ComponentType<{ className?: string }>;
import { Crown, Zap, Star, Shield, Circle } from 'lucide-react';
import Footer from '@/app/components/Footer';
import BroadcastLabel from '@/app/components/signal/BroadcastLabel';
import TraitRecord from '@/app/components/collection/TraitRecord';
import { APECHAIN_CHAIN_ID } from '@/lib/constants';
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
  const prevToken = Number.isFinite(id) && id > 0 ? id - 1 : null;
  const nextToken = Number.isFinite(id) && id < total - 1 ? id + 1 : null;

  // Sort traits by rarity desc (rarest first)
  const sortedTraits = rarity?.traits ? [...rarity.traits].sort((a, b) => b.rarity - a.rarity) : [];

  return (
    <div className="min-h-screen text-[var(--ink)]">
      <div className="container-premium pb-[calc(var(--aoa-dock-offset)+2rem)] pt-[calc(var(--aoa-header-h)+1.5rem)]">
        <Link href="/collection" className="aoa-meta text-[var(--signal)]">Return to the archive</Link>

        {loading ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <p className="aoa-meta mb-3">Scanning archive...</p>
              <div className="aspect-square animate-pulse bg-white/5" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-white/5" />
              ))}
            </div>
          </div>
        ) : !rarity ? (
          <p className="type-section mt-16">Ape #{id} is not in the archive.</p>
        ) : (
          <div className="mt-8 grid items-start gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <div className="relative aspect-square overflow-hidden border border-[rgba(243,238,228,0.12)]">
                <Image
                  src={imgSrc}
                  alt={`Ape ${id}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={handleImgError}
                  unoptimized
                  priority
                />
                {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {prevToken !== null ? (
                  <Link href={`/collection/${prevToken}`} className="aoa-home-cta aoa-home-cta-ghost">← Ape {String(prevToken).padStart(4, '0')}</Link>
                ) : null}
                {nextToken !== null ? (
                  <Link href={`/collection/${nextToken}`} className="aoa-home-cta aoa-home-cta-ghost">Ape {String(nextToken).padStart(4, '0')} →</Link>
                ) : null}
              </div>
              {(prevNext.prev || prevNext.next) && (
                <p className="aoa-meta mt-3">
                  {prevNext.prev ? <Link href={`/collection/${prevNext.prev.id}`} className="mr-4">Higher rank // #{prevNext.prev.id}</Link> : null}
                  {prevNext.next ? <Link href={`/collection/${prevNext.next.id}`}>Lower rank // #{prevNext.next.id}</Link> : null}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-6">
              <div>
                <BroadcastLabel>Ape record</BroadcastLabel>
                <h1 className="type-hero-home mt-3 max-w-[8ch] text-[var(--ink)]">Ape #{id}</h1>
                <p className={`aoa-meta mt-4 inline-flex items-center gap-2 ${cfg.color}`}>
                  <TierIcon className="h-3.5 w-3.5" />
                  Tier // {rarity.tier}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="border border-[rgba(243,238,228,0.12)] p-3">
                  <dt className="aoa-meta">Rank</dt>
                  <dd className="mt-1 text-lg font-semibold">#{rarity.rank}</dd>
                </div>
                <div className="border border-[rgba(243,238,228,0.12)] p-3">
                  <dt className="aoa-meta">Rarity</dt>
                  <dd className="mt-1 text-lg font-semibold">{rarity.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}</dd>
                </div>
                <div className="border border-[rgba(243,238,228,0.12)] p-3">
                  <dt className="aoa-meta">Traits</dt>
                  <dd className="mt-1 text-lg font-semibold">{rarity.traits.length}</dd>
                </div>
              </dl>

              <p className="aoa-meta">
                Network // ApeChain · Chain // {APECHAIN_CHAIN_ID} · Rank {rarity.rank} of {total.toLocaleString()} · Top {((rarity.rank / total) * 100).toFixed(2)}%
              </p>

              <div className="border border-[rgba(243,238,228,0.12)] p-4">
                <p className="aoa-meta">Owner</p>
                {ownerLoading ? (
                  <p className="aoa-meta mt-3">Looking up owner...</p>
                ) : ownerData ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="break-all font-mono text-sm text-[var(--ink)]">{shortAddr(ownerData.owner)}</span>
                    <button type="button" onClick={copyAddress} className="aoa-meta min-h-11 text-[var(--ink)]">
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <a href={ownerData.apescanUrl} target="_blank" rel="noopener noreferrer" className="aoa-meta text-[var(--signal)]">Apescan ↗</a>
                    <a href={ownerData.openseaProfileUrl} target="_blank" rel="noopener noreferrer" className="aoa-meta text-[var(--ink)]">OpenSea ↗</a>
                  </div>
                ) : (
                  <p className="aoa-meta mt-3">Owner unavailable</p>
                )}
              </div>

              <div>
                <h2 className="aoa-meta mb-3 text-[var(--ink)]">Trait record</h2>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {sortedTraits.map((trait, i) => {
                    const pct = ((trait.count / total) * 100).toFixed(2);
                    return (
                      <TraitRecord key={`${trait.name}-${trait.value}-${i}`} name={trait.name} value={trait.value} note={`${pct}% have this`} />
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
                <a href={osUrl} target="_blank" rel="noopener noreferrer" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">OpenSea ↗</a>
                <Link href="/studio" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">Open Studio</Link>
                <Link href="/wardrobe" className="aoa-home-cta aoa-home-cta-ghost w-full min-[420px]:w-auto">Open Wardrobe</Link>
              </div>

              <p className="aoa-meta">Part of {total.toLocaleString()}. <Link href="/collection" className="text-[var(--signal)]">Return to the archive</Link></p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
