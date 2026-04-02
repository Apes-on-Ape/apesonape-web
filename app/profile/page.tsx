'use client';
export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import SafeImage from '../components/SafeImage';
import { ProfileBadges } from '../components/ProfileBadges';
import { ArcadeAchievementsPanel } from '../components/ArcadeAchievementsPanel';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Layers, ExternalLink, Twitter, Sparkles, ChevronRight, LogOut,
  Copy, Check, ArrowUpRight, Palette, Shirt, ChevronLeft, RefreshCw,
  Gamepad2, Trophy, DoorOpen,
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
type PrivyUser = { id?: string; twitter?: PrivyTwitter };

export default function ProfilePage() {
	const { user, linkTwitter } = (usePrivy() as unknown) as { user?: PrivyUser; linkTwitter?: () => Promise<void> };
	const glyph = (useGlyph() as unknown) as {
		logout?: () => Promise<void>;
		user?: {
      id?: string;
			evmWallet?: string;
			smartWallet?: string;
			linkedWallets?: Array<{ address?: string }>;
		};
	};
  const glyphUserId = useMemo(() => glyph?.user?.id?.trim() ?? '', [glyph?.user?.id]);
  /** Stored in `user_profiles.glyph_user_id` by `/api/auth/init-user` — same column name as Glyph id */
  const privyUserId = useMemo(() => user?.id?.trim() ?? '', [user?.id]);

  const twitter      = useMemo(() => user?.twitter ?? null, [user]);
  const displayName  = twitter?.name  ?? '';
  const displayHandle= twitter?.username ?? '';

	const walletAddresses = useMemo(() => {
    const primary = glyph?.user?.evmWallet ?? glyph?.user?.smartWallet ?? '';
    const linked  = glyph?.user?.linkedWallets?.map(w => (w?.address ?? '').trim()).filter(Boolean) ?? [];
    return Array.from(new Set([primary, ...linked].map(a => a.toLowerCase()).filter(Boolean)));
	}, [glyph?.user?.evmWallet, glyph?.user?.smartWallet, glyph?.user?.linkedWallets]);
	const walletAddress = walletAddresses[0] ?? '';
  const arcadeFetchKey = walletAddresses.join(',');

  const [creations,        setCreations]        = useState<CreationRecord[]>([]);
  const [loadingCreations, setLoadingCreations]  = useState(false);
  const [foreverApe,       setForeverApe]        = useState<number | null>(null);
  const [foreverApeInput,  setForeverApeInput]   = useState('');
  const [foreverApeSaving, setForeverApeSaving]  = useState(false);
  const [foreverApeError,  setForeverApeError]   = useState<string | null>(null);
  const [apeImgMap,        setApeImgMap]         = useState<Record<string, string> | null>(null);
  const [foreverApeImg,    setForeverApeImg]      = useState<string | null>(null);
  const [copied,           setCopied]            = useState(false);
  const [activeTab,        setActiveTab]         = useState<'apes' | 'creations' | 'arcade'>('apes');

  type ArcadeMerged = {
    total_points: number;
    level: number;
    experience: number;
    total_games_played: number;
    block_dodger_score: number;
    neon_racer_score: number;
    ape_man_score: number;
    flappy_ape_score: number;
    galaxy_ape_score: number;
    tailstrike_arena_score: number;
    block_dodger_games: number;
    neon_racer_games: number;
    ape_man_games: number;
    flappy_ape_games: number;
    galaxy_ape_games: number;
    tailstrike_arena_games: number;
    clubroom_visits: number;
    walletCount: number;
  };
  const [arcadePayload, setArcadePayload] = useState<{ found: boolean; merged: ArcadeMerged | null } | null>(null);
  const [arcadeLoading, setArcadeLoading] = useState(false);
  const [arcadeRefreshNonce, setArcadeRefreshNonce] = useState(0);

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

  // Load forever ape (wallet row, else profile row by Privy / Glyph id when wallet not linked yet)
	useEffect(() => {
    if (!walletAddress && !privyUserId) return;
		let cancelled = false;
    const qs = new URLSearchParams();
    if (walletAddress) qs.set('address', walletAddress);
    if (privyUserId) qs.set('userId', privyUserId);
    fetch(`/api/profile/forever-ape?${qs.toString()}`, { cache: 'no-store' })
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
  }, [walletAddress, privyUserId]);

  const refreshArcadeStats = useCallback(() => {
    setArcadeRefreshNonce((n) => n + 1);
  }, []);

  // Arcade stats — refetch when opening the tab, wallets change, or user hits Refresh
  useEffect(() => {
    if (activeTab !== 'arcade' || !walletAddresses.length) return;
    let cancelled = false;
    setArcadeLoading(true);
    const params = new URLSearchParams();
    walletAddresses.forEach((a) => params.append('addresses', a));
    fetch(`/api/profile/arcade-stats?${params.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: { found?: boolean; merged?: ArcadeMerged | null }) => {
				if (!cancelled) {
          setArcadePayload({
            found: !!json.found,
            merged: json.merged ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setArcadePayload(null);
      })
      .finally(() => {
        if (!cancelled) setArcadeLoading(false);
      });
		return () => {
			cancelled = true;
		};
  }, [activeTab, arcadeFetchKey, arcadeRefreshNonce]);

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
      let gid = glyphUserId;
      if (!gid && typeof window !== 'undefined') {
        try {
          gid = localStorage.getItem('glyphUserId')?.trim() ?? '';
        } catch {
          /* ignore */
        }
      }
			const res = await fetch('/api/profile/forever-ape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          apeId: parsed,
          ...(gid ? { glyphUserId: gid } : {}),
          ...(privyUserId ? { privyUserId } : {}),
        }),
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

        {/* Tab switcher — higher contrast on dark bg */}
							{walletAddress && (
          <div
            className="mb-6 flex w-fit max-w-full flex-wrap gap-1.5 rounded-2xl border border-white/15 bg-zinc-900/85 p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)] ring-1 ring-white/5 backdrop-blur-sm"
            role="tablist"
            aria-label="Profile sections"
          >
            {([
              { id: 'apes',      label: 'My Apes',     icon: Layers  },
              { id: 'creations', label: 'Creations',   icon: Palette },
              { id: 'arcade',    label: 'Arcade',      icon: Gamepad2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 ${
                  activeTab === id
                    ? 'bg-hero-blue text-white shadow-lg shadow-hero-blue/35 ring-1 ring-white/15'
                    : 'border border-transparent text-zinc-200 hover:border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
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

        {/* Tab: Arcade */}
        {activeTab === 'arcade' && walletAddress && (
          <motion.div
            key="arcade"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:p-7"
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/20 shadow-[0_0_28px_rgba(34,211,238,0.15)]">
                  <Gamepad2 className="h-6 w-6 text-cyan-200" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Arcade stats</h2>
                  <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
                    High scores, run counts, and XP from the holder arcade. Linked wallets are combined: best score per
                    game, points and runs added together.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={refreshArcadeStats}
                  disabled={arcadeLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-900/90 px-3.5 py-2 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Refresh stats from the server"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${arcadeLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <Link
                  href="/arcade/leaderboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-900/90 px-3.5 py-2 text-sm font-semibold text-zinc-100 transition hover:border-white/25 hover:bg-zinc-800"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-400/90" />
                  Leaderboard
                </Link>
                <Link
                  href="/arcade"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/25"
                >
                  Open arcade
                  <ChevronRight className="h-3.5 w-3.5 opacity-90" />
                </Link>
              </div>
						</div>

            <ArcadeAchievementsPanel addresses={walletAddresses} variant="profile" className="mb-8" />

            {arcadeLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-zinc-900/70" />
                  ))}
                </div>
                <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-zinc-900/50" />
              </div>
            )}

            {!arcadeLoading && (!arcadePayload || !arcadePayload.found || !arcadePayload.merged) && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-900/30 py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
                  <Gamepad2 className="h-8 w-8 text-cyan-300" />
                </div>
                <p className="mb-2 text-lg font-semibold text-zinc-100">No arcade stats yet</p>
                <p className="mb-8 max-w-md text-sm leading-relaxed text-zinc-500">
                  Play a few games with this wallet — scores and run counts sync when you finish a session. Open the
                  Arcade tab again or tap Refresh to load the latest.
                </p>
                <Link
                  href="/arcade"
                  className="inline-flex items-center gap-2 rounded-xl border border-hero-blue/45 bg-hero-blue/20 px-6 py-3 text-sm font-bold text-sky-100 transition hover:bg-hero-blue/30"
                >
                  Go to arcade <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {!arcadeLoading && arcadePayload?.found && arcadePayload.merged && (() => {
              const m = arcadePayload.merged;
              const perGame = [
                { name: 'Block Dodger', score: m.block_dodger_score, runs: m.block_dodger_games },
                { name: 'Neon Racer', score: m.neon_racer_score, runs: m.neon_racer_games },
                { name: 'Ape Man', score: m.ape_man_score, runs: m.ape_man_games },
                { name: 'Flappy Ape', score: m.flappy_ape_score, runs: m.flappy_ape_games },
                { name: 'Galaxy Ape', score: m.galaxy_ape_score, runs: m.galaxy_ape_games },
                { name: 'Tailstrike Arena', score: m.tailstrike_arena_score, runs: m.tailstrike_arena_games },
              ];
              return (
              <div className="space-y-8">
                {m.walletCount > 1 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
                    <span className="font-semibold text-amber-200/95">Multiple wallets linked.</span>{' '}
                    Showing combined totals across {m.walletCount} addresses (highest score per title wins; runs and
                    points sum).
                  </div>
                )}

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Overview</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Total points', sub: 'Arcade XP economy', value: m.total_points, accent: 'text-sky-300' },
                      { label: 'Level', sub: 'Profile level', value: m.level, accent: 'text-amber-200' },
                      { label: 'Experience', sub: 'XP earned', value: m.experience, accent: 'text-violet-200' },
                      { label: 'Total runs', sub: 'All games started', value: m.total_games_played, accent: 'text-cyan-200' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-4 ring-1 ring-white/5"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{row.label}</p>
                        <p className={`mt-1 text-2xl font-black tabular-nums tracking-tight sm:text-3xl ${row.accent}`}>
                          {row.value.toLocaleString()}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">{row.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Per game</p>
                      <h3 className="text-base font-bold text-white sm:text-lg">High scores &amp; runs</h3>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-zinc-900/90">
                            <th scope="col" className="px-4 py-3.5 font-semibold text-zinc-300 sm:px-5">
                              Game
                            </th>
                            <th scope="col" className="px-4 py-3.5 text-right font-semibold text-zinc-300 sm:px-5">
                              High score
                            </th>
                            <th scope="col" className="px-4 py-3.5 text-right font-semibold text-zinc-300 sm:px-5">
                              Runs
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {perGame.map((g, idx) => (
                            <tr
                              key={g.name}
                              className={idx % 2 === 0 ? 'bg-zinc-950/40' : 'bg-zinc-900/25'}
                            >
                              <td className="px-4 py-4 font-medium text-zinc-100 sm:px-5">{g.name}</td>
                              <td className="px-4 py-4 text-right font-mono text-base font-bold tabular-nums text-sky-300 sm:px-5 sm:text-lg">
                                {g.score.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-base font-semibold tabular-nums text-zinc-200 sm:px-5 sm:text-lg">
                                {g.runs.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-fuchsia-500/15 bg-fuchsia-950/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/15">
                      <DoorOpen className="h-5 w-5 text-fuchsia-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Clubroom</p>
                      <p className="text-xs text-zinc-500">Visits logged in the arcade social room</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-fuchsia-200 sm:text-3xl">
                    {m.clubroom_visits.toLocaleString()}
                    <span className="ml-2 text-sm font-semibold text-zinc-500">visits</span>
                  </p>
                </div>
              </div>
              );
            })()}
          </motion.div>
        )}

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
