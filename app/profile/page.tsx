'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import SafeImage from '../components/SafeImage';
import { ProfileBadges } from '../components/ProfileBadges';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Layers, ExternalLink, Twitter, Sparkles, ChevronRight, LogOut,
  Copy, Check, ArrowUpRight, Palette, Shirt, ChevronLeft, RefreshCw,
} from 'lucide-react';

const CDN_THUMB_BASE = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';
const CDN_BASE       = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index/';

const PAGE_SIZE = 24;

// ─── Portfolio Component ───────────────────────────────────────────────────────
function ApePortfolio({ walletAddresses }: { walletAddresses: string[] }) {
  const [allIds,     setAllIds]     = useState<number[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [page,       setPage]       = useState(0);

  const totalPages = Math.ceil(allIds.length / PAGE_SIZE);
  const pageIds    = allIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Stable key so the callback only rebuilds when the actual address list changes
  const addressKey = walletAddresses.join(',');

  const loadPortfolio = React.useCallback(async () => {
    if (!walletAddresses.length) return;
    setLoading(true);
    setFetchError(false);
    try {
      // Pass all wallets — mirrors the badges API (?addresses=0x1&addresses=0x2)
      const params = new URLSearchParams();
      walletAddresses.forEach(a => params.append('addresses', a));
      const res  = await fetch(`/api/portfolio?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setAllIds(data.tokenIds ?? []);   // API already deduplicates & sorts
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressKey]);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  if (loading) return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-hero-blue/20 animate-pulse" />
          <div className="h-5 w-32 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="h-8 w-24 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </section>
  );

  if (fetchError) return (
    <section className="mt-8">
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/8 bg-white/3">
        <span className="text-5xl mb-4">🦍</span>
        <p className="text-white/50 font-semibold mb-1">Couldn&apos;t load your Apes</p>
        <p className="text-white/25 text-sm mb-5">There was a problem reaching the blockchain</p>
        <button
          onClick={loadPortfolio}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hero-blue/10 border border-hero-blue/25 text-sm font-semibold text-hero-blue hover:bg-hero-blue/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    </section>
  );

  if (!allIds.length) return (
    <section className="mt-8">
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/8 bg-white/3">
        <span className="text-5xl mb-4">🦍</span>
        <p className="text-white/50 font-semibold mb-1">No Apes in this wallet</p>
        <p className="text-white/25 text-sm mb-5">This wallet doesn&apos;t hold any AOA NFTs yet</p>
        <a
          href="https://opensea.io/collection/apes-on-apechain"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hero-blue/10 border border-hero-blue/25 text-sm font-semibold text-hero-blue hover:bg-hero-blue/20 transition-all"
        >
          Get an Ape on OpenSea <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-hero-blue/15 border border-hero-blue/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-hero-blue" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">My Apes</h2>
            <p className="text-xs text-white/35">
              {allIds.length} in wallet · page {page + 1} of {totalPages}
            </p>
          </div>
        </div>
        <Link
          href="/collection"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/60 hover:text-white hover:border-hero-blue/40 transition-all"
        >
          Browse collection <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Ape Grid — pure CDN images, no external API */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {pageIds.map((tokenId, i) => (
          <motion.div
            key={tokenId}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.25 }}
          >
            <Link href={`/collection/${tokenId}`}>
              <div className="group relative rounded-xl overflow-hidden border border-white/8 bg-white/3 hover:-translate-y-1 hover:shadow-lg hover:border-hero-blue/30 transition-all duration-300 cursor-pointer">
                <div className="aspect-square">
                  <img
                    src={`${CDN_THUMB_BASE}/${tokenId}.webp`}
                    alt={`Ape #${tokenId}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-1 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-white">#{tokenId}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => {
              const isActive = i === page;
              const isNear   = Math.abs(i - page) <= 2;
              const isEdge   = i === 0 || i === totalPages - 1;
              if (!isNear && !isEdge) {
                if (i === 1 || i === totalPages - 2) return <span key={i} className="text-white/20 text-xs px-1">…</span>;
                return null;
              }
              return (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-hero-blue text-white shadow-lg shadow-hero-blue/30'
                      : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type PrivyTwitter = { name?: string; username?: string; profilePictureUrl?: string };
type PrivyUser    = { id?: string; twitter?: PrivyTwitter };

export default function ProfilePage() {
  const { user, linkTwitter } = (usePrivy() as unknown) as { user?: PrivyUser; linkTwitter?: () => Promise<void> };
  const glyph = (useGlyph() as unknown) as {
    logout?: () => Promise<void>;
    user?: { evmWallet?: string; smartWallet?: string; linkedWallets?: Array<{ address?: string }> };
  };

  const twitter      = useMemo(() => user?.twitter ?? null, [user]);
  const displayName  = twitter?.name  ?? '';
  const displayHandle= twitter?.username ?? '';

  const walletAddresses = useMemo(() => {
    const primary = glyph?.user?.evmWallet ?? glyph?.user?.smartWallet ?? '';
    const linked  = glyph?.user?.linkedWallets?.map(w => (w?.address ?? '').trim()).filter(Boolean) ?? [];
    return Array.from(new Set([primary, ...linked].map(a => a.toLowerCase()).filter(Boolean)));
  }, [glyph?.user?.evmWallet, glyph?.user?.smartWallet, glyph?.user?.linkedWallets]);
  const walletAddress = walletAddresses[0] ?? '';

  const [creations,        setCreations]        = useState<CreationRecord[]>([]);
  const [loadingCreations, setLoadingCreations]  = useState(false);
  const [foreverApe,       setForeverApe]        = useState<number | null>(null);
  const [foreverApeInput,  setForeverApeInput]   = useState('');
  const [foreverApeSaving, setForeverApeSaving]  = useState(false);
  const [foreverApeError,  setForeverApeError]   = useState<string | null>(null);
  const [apeImgMap,        setApeImgMap]         = useState<Record<string, string> | null>(null);
  const [foreverApeImg,    setForeverApeImg]      = useState<string | null>(null);
  const [copied,           setCopied]            = useState(false);
  const [activeTab,        setActiveTab]         = useState<'apes' | 'creations'>('apes');

  // Load creations
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    setLoadingCreations(true);
    fetch(`/api/studio/creations?creator=${encodeURIComponent(walletAddress)}&limit=50&type=visual`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => { if (!cancelled) setCreations(json.items ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCreations(false); });
    return () => { cancelled = true; };
  }, [walletAddress]);

  // Load forever ape
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    fetch(`/api/profile/forever-ape?address=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        if (!cancelled) {
          const id = typeof json.apeId === 'number' ? json.apeId : null;
          setForeverApe(id);
          setForeverApeInput(id !== null ? String(id) : '');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [walletAddress]);

  // Load CDN token image map
  useEffect(() => {
    if (apeImgMap) return;
    let cancelled = false;
    fetch(`${CDN_BASE.replace(/\/+$/, '')}/tokens.json`, { cache: 'force-cache' })
      .then(r => r.json())
      .then((tokens: Array<{ id: number; image: string }>) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const t of tokens) map[String(t.id)] = t.image ?? '';
        setApeImgMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apeImgMap]);

  // Resolve forever ape image
  useEffect(() => {
    if (!foreverApe || !apeImgMap) { setForeverApeImg(null); return; }
    setForeverApeImg(apeImgMap[String(foreverApe)] ?? null);
    window.dispatchEvent(new Event('forever-ape-updated'));
  }, [foreverApe, apeImgMap]);

  const saveForeverApe = async () => {
    setForeverApeError(null);
    const parsed = Number(foreverApeInput);
    if (!Number.isFinite(parsed) || parsed < 0) { setForeverApeError('Enter a valid Ape ID'); return; }
    try {
      setForeverApeSaving(true);
      const res  = await fetch('/api/profile/forever-ape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, apeId: parsed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to save');
      setForeverApe(parsed);
      window.dispatchEvent(new Event('forever-ape-updated'));
    } catch (err) {
      setForeverApeError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setForeverApeSaving(false); }
  };

  const copyWallet = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarSrc  = foreverApeImg ? toGatewayUri(foreverApeImg) : null;
  const shortWallet = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : '';

  return (
    <div className="min-h-screen">
      <Nav />

      {/* ── HERO BANNER ──────────────────────────────────────────────── */}
      <div className="relative pt-16 overflow-hidden">
        {/* Blurred backdrop from Forever Ape */}
        {avatarSrc && (
          <div className="absolute inset-0 pointer-events-none">
            <img src={avatarSrc} alt="" className="w-full h-full object-cover opacity-15 blur-3xl scale-110" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
          </div>
        )}
        {!avatarSrc && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-hero-blue/12 rounded-full blur-[100px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-purple-500/8 rounded-full blur-[80px]" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8">

            {/* Avatar */}
            <div className="relative flex-shrink-0 group/avatar">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-hero-blue/60 ring-4 ring-hero-blue/20 ring-offset-4 ring-offset-black shadow-2xl shadow-hero-blue/30 bg-gradient-to-br from-hero-blue/30 to-purple-900/30 flex items-center justify-center">
                {avatarSrc ? (
                  <SafeImage src={avatarSrc} alt="Forever Ape" fill sizes="160px" className="object-cover" unoptimized />
                ) : (
                  <span className="text-5xl">🦍</span>
                )}
                {/* Dress up overlay on hover */}
                <Link
                  href={foreverApe !== null ? `/wardrobe?ape=${foreverApe}` : '/wardrobe'}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 backdrop-blur-sm opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 rounded-3xl"
                >
                  <Shirt className="w-7 h-7 text-white" />
                  <span className="text-white text-xs font-black uppercase tracking-wider">Dress Up</span>
                </Link>
              </div>
              {foreverApe !== null && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-hero-blue text-white text-xs font-black shadow-lg border-2 border-black/30 whitespace-nowrap">
                  #{foreverApe}
                </div>
              )}
            </div>

            {/* Name / identity */}
            <div className="flex-1 text-center sm:text-left pb-1">
              {displayName ? (
                <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                  {displayName}
                </h1>
              ) : (
                <h1 className="text-3xl sm:text-4xl font-black text-white/40 leading-tight">Unnamed Ape</h1>
              )}
              {displayHandle && (
                <a
                  href={`https://x.com/${displayHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 text-hero-blue hover:text-hero-blue-light transition-colors font-semibold text-lg"
                >
                  <Twitter className="w-4 h-4" />@{displayHandle}
                </a>
              )}
              {walletAddress && (
                <button
                  onClick={copyWallet}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/6 border border-white/10 text-xs font-mono text-white/50 hover:text-white hover:border-white/20 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {shortWallet}
                  {copied && <span className="text-green-400">Copied!</span>}
                </button>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 pb-1">
              {!twitter ? (
                <button
                  onClick={() => linkTwitter?.().catch(() => {})}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-sm font-semibold text-white/70 hover:text-white hover:border-white/25 transition-all"
                >
                  <Twitter className="w-4 h-4" /> Link X
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/25 text-sm font-semibold text-green-400">
                  <Check className="w-3.5 h-3.5" /> X Linked
                </span>
              )}
              <Link
                href={foreverApe !== null ? `/wardrobe?ape=${foreverApe}` : '/wardrobe'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-sm font-semibold text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                <Shirt className="w-3.5 h-3.5" /> Wardrobe
              </Link>
              <a
                href={`https://opensea.io/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hero-blue/10 border border-hero-blue/25 text-sm font-semibold text-hero-blue hover:bg-hero-blue/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> OpenSea
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* Set Forever Ape */}
        {walletAddress && (
          <div className="mb-8 flex items-center gap-3 p-4 rounded-2xl bg-white/4 border border-white/8">
            <div className="w-9 h-9 rounded-xl bg-hero-blue/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-hero-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Forever Ape</p>
              <p className="text-xs text-white/40">Your signature Ape — shown everywhere on your profile</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                value={foreverApeInput}
                onChange={e => setForeverApeInput(e.target.value)}
                placeholder="Ape ID"
                maxLength={5}
                className="w-24 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-sm text-center font-mono text-white focus:border-hero-blue/60 focus:outline-none transition-colors"
              />
              <button
                onClick={saveForeverApe}
                disabled={foreverApeSaving}
                className="px-4 py-2 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white text-sm font-bold transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {foreverApeSaving ? '…' : foreverApe !== null ? 'Update' : 'Set'}
              </button>
            </div>
            {foreverApeError && <p className="text-red-400 text-xs ml-2">{foreverApeError}</p>}
          </div>
        )}

        {/* Badges */}
        <div className="mb-8">
          <ProfileBadges addresses={walletAddresses} showRefresh />
        </div>

        {/* Tab switcher */}
        {walletAddress && (
          <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/8 mb-6 w-fit">
            {([
              { id: 'apes',      label: 'My Apes',     icon: Layers  },
              { id: 'creations', label: 'Creations',   icon: Palette },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-hero-blue text-white shadow-lg shadow-hero-blue/30'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        )}

        {/* Tab: Apes — always mounted so data isn't lost on tab switch */}
        <div className={activeTab === 'apes' || !walletAddress ? 'block' : 'hidden'}>
          {walletAddress
            ? <ApePortfolio walletAddresses={walletAddresses} />
            : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🦍</div>
                <p className="text-white/40 text-lg font-semibold">Connect your wallet to see your Apes</p>
              </div>
            )
          }
        </div>

        {/* Tab: Creations */}
        {activeTab === 'creations' && walletAddress && (
            <motion.div key="creations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                    <Palette className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">My Creations</h2>
                    <p className="text-xs text-white/35">{creations.length} published</p>
                  </div>
                </div>
                <a
                  href="/studio/new"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-sm font-bold text-purple-400 hover:bg-purple-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" /> New Creation
                </a>
              </div>

              {loadingCreations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {!loadingCreations && creations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                    <Palette className="w-8 h-8 text-purple-400/50" />
                  </div>
                  <p className="text-white/40 font-semibold mb-3">No creations yet</p>
                  <a href="/studio/new" className="text-sm text-hero-blue hover:underline">Publish your first experiment →</a>
                </div>
              )}

              {!loadingCreations && creations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creations.map((c, i) => (
                    <motion.a
                      key={c.id}
                      href={`/studio/${c.id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:border-hero-blue/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-hero-blue/10 flex flex-col"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-black/30">
                        {c.type === 'visual' ? (
                          <SafeImage src={toGatewayUri(c.artifactUrl)} alt={c.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/30 text-sm">Preview unavailable</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-4">
                        <div className="font-bold text-sm text-white group-hover:text-hero-blue transition-colors truncate">{c.title}</div>
                        <div className="text-xs text-white/40 mt-1 line-clamp-1">{c.description}</div>
                        <div className="text-[10px] text-white/25 mt-2">{new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        {/* Sign out */}
        {walletAddress && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => glyph.logout?.()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white/40 hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
