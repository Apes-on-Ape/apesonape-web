'use client';
export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Footer from '../components/Footer';
import { usePrivy } from '@privy-io/react-auth';
import { useGlyph } from '@use-glyph/sdk-react';
import { useSessionWallets } from '@/app/hooks/useSessionWallets';
import SafeImage from '../components/SafeImage';
import { ArcadeAchievementsPanel } from '../components/ArcadeAchievementsPanel';
import { CreationRecord } from '@/lib/studio/types';
import { toGatewayUri } from '@/lib/studio/urls';
import Link from 'next/link';

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
    <section className="mt-12">
      <div className="h-4 w-24 bg-white/10 animate-pulse mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 animate-pulse" />
        ))}
      </div>
    </section>
  );

  if (fetchError) return (
    <section className="mt-12">
      <p className="text-white/50">Couldn&apos;t load your Apes.</p>
      <button
        onClick={loadPortfolio}
        className="mt-4 text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1"
      >
        Try again
      </button>
    </section>
  );

  if (!allIds.length) return (
    <section className="mt-12">
      <p className="text-white/50">No Apes in this wallet.</p>
      <a
        href="https://opensea.io/collection/apes-on-apechain"
        target="_blank" rel="noopener noreferrer"
        className="mt-4 inline-block text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1"
      >
        See them
      </a>
    </section>
  );

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-[11px] tracking-[0.35em] uppercase text-white/40">Your apes</h2>
          <p className="mt-2 text-white/35 text-sm">
            {allIds.length} · {page + 1} / {totalPages}
          </p>
        </div>
        <Link
          href="/collection"
          className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white"
        >
          See them
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {pageIds.map((tokenId) => (
          <Link key={tokenId} href={`/collection/${tokenId}`} className="group block">
            <div className="relative aspect-square overflow-hidden bg-white/5">
              <img
                src={`${CDN_THUMB_BASE}/${tokenId}.webp`}
                alt={`Ape #${tokenId}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-[10px] text-white/80 opacity-0 group-hover:opacity-100">
                #{tokenId}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-sm font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Prev
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
                  className={`text-xs font-bold px-1 ${
                    isActive ? 'text-white' : 'text-white/30 hover:text-white'
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
            className="text-sm font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Next
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
		user?: { id?: string };
	};
  const session = useSessionWallets();
  const glyphUserId = useMemo(
    () => glyph?.user?.id?.trim() || session.userId,
    [glyph?.user?.id, session.userId],
  );
  /** Stored in `user_profiles.glyph_user_id` by `/api/auth/init-user` — same column name as Glyph id */
  const privyUserId = useMemo(() => user?.id?.trim() ?? '', [user?.id]);

  const twitter      = useMemo(() => user?.twitter ?? null, [user]);
  const displayName  = twitter?.name  ?? '';
  const displayHandle= twitter?.username ?? '';

	const walletAddresses = session.addresses;
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
  const [engagementStrip, setEngagementStrip] = useState<{ streak: number; best: number } | null>(null);

  useEffect(() => {
    if (!privyUserId) {
      setEngagementStrip(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/profile/summary?userId=${encodeURIComponent(privyUserId)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: { engagement?: { streak_current?: number; streak_best?: number } }) => {
        if (cancelled) return;
        const streak = json?.engagement?.streak_current ?? 0;
        const best = json?.engagement?.streak_best ?? 0;
        setEngagementStrip({ streak, best });
      })
      .catch(() => {
        if (!cancelled) setEngagementStrip(null);
      });
    return () => {
      cancelled = true;
    };
  }, [privyUserId]);

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
    <div className="min-h-screen bg-black text-white">

      <main className="container-premium pt-32 pb-28">
        <p className="text-[11px] tracking-[0.35em] uppercase text-white/35">Profile</p>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-end gap-8">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 overflow-hidden bg-white/5">
            {avatarSrc ? (
              <SafeImage src={avatarSrc} alt="Forever Ape" fill sizes="144px" className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-white/5" />
            )}
          </div>
          <div>
            <h1 className="font-black leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}>
              {displayName || 'Your apes'}
            </h1>
            {displayHandle && (
              <a
                href={`https://x.com/${displayHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-white/50 hover:text-white"
              >
                @{displayHandle}
              </a>
            )}
            {foreverApe !== null && (
              <p className="mt-2 text-white/40 text-sm">Ape #{foreverApe}</p>
            )}
            {walletAddress && (
              <button
                onClick={copyWallet}
                className="mt-3 block text-xs font-mono text-white/35 hover:text-white"
              >
                {copied ? 'Copied' : shortWallet}
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {!twitter ? (
            <button
              onClick={() => linkTwitter?.().catch(() => {})}
              className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white"
            >
              Link X
            </button>
          ) : (
            <span className="text-sm tracking-[0.2em] uppercase text-white/30">X linked</span>
          )}
          <Link
            href={foreverApe !== null ? `/wardrobe?ape=${foreverApe}` : '/wardrobe'}
            className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white"
          >
            Wardrobe
          </Link>
          <Link href="/studio" className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white">
            Studio
          </Link>
          <button
            type="button"
            onClick={() => setActiveTab('arcade')}
            className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white"
          >
            Arcade
          </button>
          {walletAddress && (
            <a
              href={`https://opensea.io/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white"
            >
              OpenSea
            </a>
          )}
        </div>

        {walletAddress && (
          <div className="mt-14 border-t border-white/10 pt-8 flex flex-wrap items-end gap-4">
            <div>
              <p className="text-[11px] tracking-[0.35em] uppercase text-white/40">Forever Ape</p>
              <p className="mt-2 text-white/40 text-sm">The one that shows up here.</p>
            </div>
            <input
              value={foreverApeInput}
              onChange={e => setForeverApeInput(e.target.value)}
              placeholder="ID"
              maxLength={5}
              className="w-24 bg-transparent border-b border-white/20 px-1 py-2 text-sm font-mono text-white focus:border-white focus:outline-none"
            />
            <button
              onClick={saveForeverApe}
              disabled={foreverApeSaving}
              className="text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1 disabled:opacity-40"
            >
              {foreverApeSaving ? '…' : foreverApe !== null ? 'Update' : 'Set'}
            </button>
            {foreverApeError && <p className="text-red-400 text-xs">{foreverApeError}</p>}
          </div>
        )}

        {privyUserId && engagementStrip !== null && engagementStrip.streak > 0 && (
          <p className="mt-8 text-sm text-white/40">
            {engagementStrip.streak} day streak
            {engagementStrip.best > engagementStrip.streak ? ` · best ${engagementStrip.best}` : ''}
          </p>
        )}

        {walletAddress && (
          <div className="mt-14 flex flex-wrap gap-8 border-t border-white/10 pt-6" role="tablist" aria-label="Profile sections">
            {([
              { id: 'apes', label: 'Apes' },
              { id: 'creations', label: 'Studio' },
              { id: 'arcade', label: 'Arcade' },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`text-sm font-bold tracking-[0.2em] uppercase ${
                  activeTab === id ? 'text-white border-b border-white pb-1' : 'text-white/35 hover:text-white'
                }`}
              >
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
              <p className="mt-12 text-white/40">Connect a wallet to see your Apes.</p>
            )
          }
        </div>

        {/* Tab: Arcade */}
        {activeTab === 'arcade' && walletAddress && (
          <div className="mt-12">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[11px] tracking-[0.35em] uppercase text-white/40">Arcade</h2>
                <p className="mt-2 text-white/40 text-sm">Scores from the wallets on this profile.</p>
              </div>
              <div className="flex flex-wrap gap-6">
                <button
                  type="button"
                  onClick={refreshArcadeStats}
                  disabled={arcadeLoading}
                  className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white disabled:opacity-40"
                >
                  {arcadeLoading ? '…' : 'Refresh'}
                </button>
                <Link href="/arcade/leaderboard" className="text-sm font-bold tracking-[0.2em] uppercase text-white/45 hover:text-white">
                  Leaderboard
                </Link>
                <Link href="/arcade" className="text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1">
                  Play
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
              <div className="py-8">
                <p className="text-white/50">No scores yet.</p>
                <Link href="/arcade" className="mt-4 inline-block text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1">
                  Play
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
                  <p className="text-sm text-white/40">
                    Combined across {m.walletCount} wallets.
                  </p>
                )}

                <div>
                  <p className="mb-4 text-[11px] tracking-[0.35em] uppercase text-white/40">Overview</p>
                  <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                    {[
                      { label: 'Points', value: m.total_points },
                      { label: 'Level', value: m.level },
                      { label: 'XP', value: m.experience },
                      { label: 'Runs', value: m.total_games_played },
                    ].map((row) => (
                      <div key={row.label}>
                        <p className="text-[11px] tracking-[0.25em] uppercase text-white/35">{row.label}</p>
                        <p className="mt-1 text-3xl font-black tabular-nums text-white">
                          {row.value.toLocaleString()}
                        </p>
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

                  <div className="overflow-x-auto border-t border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
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
                          {perGame.map((g) => (
                            <tr key={g.name} className="border-b border-white/10">
                              <td className="px-0 py-4 text-white">{g.name}</td>
                              <td className="px-4 py-4 text-right font-mono tabular-nums text-white">
                                {g.score.toLocaleString()}
                              </td>
                              <td className="px-0 py-4 text-right font-mono tabular-nums text-white/60">
                                {g.runs.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <p className="text-white/50">
                  Clubroom · {m.clubroom_visits.toLocaleString()} visits
                </p>
              </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'creations' && walletAddress && (
            <div className="mt-12">
              <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
                <div>
                  <h2 className="text-[11px] tracking-[0.35em] uppercase text-white/40">Studio</h2>
                  <p className="mt-2 text-white/35 text-sm">{creations.length} published</p>
                </div>
                <a href="/studio/new" className="text-sm font-bold tracking-[0.2em] uppercase border-b border-white pb-1">
                  Make something
                </a>
              </div>

              {loadingCreations && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-video bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {!loadingCreations && creations.length === 0 && (
                <p className="text-white/40">Nothing here yet.</p>
              )}

              {!loadingCreations && creations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {creations.map((c) => (
                    <a key={c.id} href={`/studio/${c.id}`} className="group block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                        {c.type === 'visual' ? (
                          <SafeImage src={toGatewayUri(c.artifactUrl)} alt={c.title} fill className="object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-white/30 text-sm">No preview</div>
                        )}
                      </div>
                      <p className="mt-3 font-bold text-white group-hover:text-hero-blue truncate">{c.title}</p>
                      <p className="text-xs text-white/35 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

        {session.signedIn && (
          <button
            onClick={() => { void session.logout?.(); }}
            className="mt-20 text-sm tracking-[0.2em] uppercase text-white/30 hover:text-white"
          >
            Sign out
          </button>
        )}
      </main>

			<Footer />
		</div>
	);
}
