'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGlyph } from '@use-glyph/sdk-react';
import { ChevronDown, ChevronLeft, ExternalLink, Trophy } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import { ARCADE_WALLET_SYNC_EVENT, getGlyphPrimaryAddress } from '@/lib/arcade-wallet';
import { ARCADE_LEADERBOARD_GAMES } from '../arcade-games';

type PointsRow = {
  rank: number;
  wallet_address: string;
  username: string | null;
  /** Resolved label: site / X / clubroom; falls back in UI */
  display_name: string | null;
  total_points: number;
  level: number;
  experience: number;
  avatar_url: string | null;
  profile_slug: string | null;
};

type GameRow = {
  rank: number;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  score: number;
  created_at: string | null;
  avatar_url: string | null;
  profile_slug: string | null;
};

const SLUG_TO_GAME_ID = Object.fromEntries(ARCADE_LEADERBOARD_GAMES.map((g) => [g.slug, g.gameId]));

function LeaderboardPlayer({
  displayName,
  username,
  walletAddress,
  avatarUrl,
  profileSlug,
}: {
  displayName: string | null | undefined;
  username: string | null | undefined;
  walletAddress: string;
  avatarUrl: string | null | undefined;
  profileSlug: string | null | undefined;
}) {
  const name = (displayName && displayName.trim()) || username?.trim();
  const addr = walletAddress?.toLowerCase() || '—';
  const profileHref = profileSlug ? `/profile/${encodeURIComponent(profileSlug)}` : null;

  const textBlock = (
    <div className="min-w-0 flex-1 text-left">
      <p className="flex items-center gap-1.5 truncate font-semibold text-white">
        {name ? (
          name
        ) : (
          <span className="font-medium text-zinc-400">No display name</span>
        )}
        {profileHref && (
          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-70" aria-hidden />
        )}
      </p>
      <p
        className="mt-1 max-w-[min(100%,28rem)] break-all font-mono text-[11px] leading-snug text-zinc-400/95 sm:text-xs"
        title={addr}
      >
        {addr}
      </p>
    </div>
  );

  const avatar = (
    <div
      className={`relative h-11 w-11 shrink-0 overflow-hidden border border-white/15 bg-black/40 sm:h-12 sm:w-12 ${
        avatarUrl ? 'rounded-xl' : 'rounded-full'
      }`}
    >
      <SafeImage
        src={avatarUrl || undefined}
        alt=""
        width={48}
        height={48}
        className="h-full w-full object-cover"
        unoptimized
      />
    </div>
  );

  const inner = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {avatar}
      {textBlock}
    </div>
  );

  if (profileHref) {
    return (
      <Link
        href={profileHref}
        className="group -m-2 min-w-0 flex-1 rounded-xl p-2 outline-none ring-offset-2 transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[var(--arcade-cyan)]"
        aria-label={name ? `Open profile: ${name}` : `Open profile for ${addr}`}
      >
        {inner}
      </Link>
    );
  }

  return <div className="min-w-0 flex-1 p-2">{inner}</div>;
}

type RowIdentity = {
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_slug: string | null;
  username?: string | null;
};

function ArcadeLeaderboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const glyph = (useGlyph() as unknown) as {
    /** Some Glyph builds expose the active wallet here */
    address?: string;
    user?: {
      id?: string;
      evmWallet?: string;
      smartWallet?: string;
      linkedWallets?: Array<{ address?: string }>;
    };
  };
  const glyphUserId = glyph?.user?.id?.trim() ?? '';

  /** Glyph canonical wallet mirrored for static arcade consumers. */
  const [arcadeConnectedWallet, setArcadeConnectedWallet] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = () => {
      const raw = localStorage.getItem('glyphEvmWallet') || localStorage.getItem('connectedWallet');
      setArcadeConnectedWallet(raw ? raw.toLowerCase().trim() : null);
    };
    read();
    const onSync = () => read();
    window.addEventListener(ARCADE_WALLET_SYNC_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(ARCADE_WALLET_SYNC_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  /** All wallet addresses that should receive the Glyph site profile on leaderboard rows */
  const leaderboardIdentityWalletSet = useMemo(() => {
    const u = glyph?.user;
    const addrs: string[] = [];
    if (u) {
      addrs.push(
        ...[u.evmWallet, u.smartWallet, ...(u.linkedWallets ?? []).map((x) => x?.address)]
          .filter((a): a is string => typeof a === 'string' && a.length > 0)
          .map((a) => a.toLowerCase().trim())
      );
    }
    const topLevel = (glyph.address ?? '').trim();
    if (topLevel) addrs.push(topLevel.toLowerCase());
    const primary = getGlyphPrimaryAddress(u ?? undefined).trim();
    if (primary) addrs.push(primary.toLowerCase());
    if (arcadeConnectedWallet) addrs.push(arcadeConnectedWallet);
    return new Set(addrs);
  }, [glyph?.user, glyph.address, arcadeConnectedWallet]);

  const [glyphSiteProfile, setGlyphSiteProfile] = useState<{
    displayName: string | null;
    avatarUrl: string | null;
    profileSlug: string | null;
  } | null>(null);

  useEffect(() => {
    if (!glyphUserId) {
      setGlyphSiteProfile(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/profile/summary?userId=${encodeURIComponent(glyphUserId)}`, { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (json: {
          profile?: { display_name?: string | null; avatar_url?: string | null; x_username?: string | null };
        } | null) => {
          if (cancelled || !json?.profile) {
            if (!cancelled) setGlyphSiteProfile(null);
            return;
          }
          const p = json.profile;
          const dn = (p.display_name || '').trim();
          const xu = (p.x_username || '').trim().replace(/^@/, '');
          const displayName = dn || (xu ? `@${xu}` : '') || null;
          setGlyphSiteProfile({
            displayName,
            avatarUrl: p.avatar_url?.trim() || null,
            profileSlug: xu ? xu.toLowerCase() : null,
          });
        }
      )
      .catch(() => {
        if (!cancelled) setGlyphSiteProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [glyphUserId]);

  const mergeGlyphProfile = useCallback(
    <T extends RowIdentity>(row: T): T => {
      const w = row.wallet_address.toLowerCase().trim();
      if (!leaderboardIdentityWalletSet.has(w) || !glyphSiteProfile) return row;
      return {
        ...row,
        display_name: glyphSiteProfile.displayName || row.display_name,
        avatar_url: glyphSiteProfile.avatarUrl || row.avatar_url,
        profile_slug: glyphSiteProfile.profileSlug || row.profile_slug,
      };
    },
    [leaderboardIdentityWalletSet, glyphSiteProfile]
  );

  const mode = searchParams.get('mode') === 'points' ? 'points' : 'game';
  const gameSlug = searchParams.get('game') || 'neon-racer';
  const gameId = SLUG_TO_GAME_ID[gameSlug] ?? 'neon_racer';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsRows, setPointsRows] = useState<PointsRow[]>([]);
  const [gameRows, setGameRows] = useState<GameRow[]>([]);

  useEffect(() => {
    const m = searchParams.get('mode');
    const g = searchParams.get('game');
    if (m === null && g === null) {
      router.replace('/arcade/leaderboard?mode=game&game=neon-racer', { scroll: false });
    }
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'points') {
        const res = await fetch('/api/arcade/leaderboard?mode=points&limit=50');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setPointsRows(json.rows ?? []);
        setGameRows([]);
      } else {
        const res = await fetch(
          `/api/arcade/leaderboard?mode=game&gameId=${encodeURIComponent(gameId)}&limit=50`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setGameRows(json.rows ?? []);
        setPointsRows([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [mode, gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  const goMode = (next: 'points' | 'game') => {
    const p = new URLSearchParams();
    p.set('mode', next);
    if (next === 'game') p.set('game', gameSlug);
    router.push(`/arcade/leaderboard?${p.toString()}`);
  };

  const goGameSlug = (slug: string) => {
    const p = new URLSearchParams();
    p.set('mode', 'game');
    p.set('game', slug);
    router.push(`/arcade/leaderboard?${p.toString()}`);
  };

  return (
    <section className="section-spacing pt-24 md:pt-32">
      <div className="container-premium">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="arcade-subline mb-2">/// HIGH SCORES ///</p>
            <h1 className="arcade-title-pixel text-xl sm:text-2xl md:text-3xl flex items-center gap-3">
              <Trophy className="h-8 w-8 text-[var(--arcade-amber)] shrink-0" aria-hidden />
              Arcade leaderboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-sub)]">
              See who&apos;s king of each cabinet, or who&apos;s hoarding the most arcade points across every game. Your name and
              picture on the board come from your{' '}
              <Link href="/profile" className="text-cyan-300/90 underline underline-offset-2 hover:text-cyan-200">
                site profile
              </Link>{' '}
              when the wallet you play with matches — same apes, same bragging rights.
            </p>
          </div>
          <Link href="/arcade" className="arcade-btn-ghost inline-flex items-center gap-2 self-start">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            LOBBY
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex rounded-xl border border-[rgba(0,240,255,0.25)] bg-black/30 p-1">
            <button
              type="button"
              onClick={() => goMode('game')}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                mode === 'game'
                  ? 'bg-[var(--blue)]/90 text-white shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              By game
            </button>
            <button
              type="button"
              onClick={() => goMode('points')}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                mode === 'points'
                  ? 'bg-[var(--blue)]/90 text-white shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Total points
            </button>
          </div>

          {mode === 'game' && (
            <div className="arcade-lb-game-picker w-full sm:w-auto sm:min-w-[260px]">
              <label htmlFor="arcade-lb-game-select" className="mb-1.5 block">
                <span className="arcade-subline text-[0.5rem] tracking-[0.22em] text-[var(--arcade-cyan)]/95">
                  /// GAME CABINET ///
                </span>
                <span className="sr-only">Choose which game leaderboard to show</span>
              </label>
              <div className="arcade-lb-select-wrap">
                <select
                  id="arcade-lb-game-select"
                  value={gameSlug}
                  onChange={(e) => goGameSlug(e.target.value)}
                  className="arcade-lb-select"
                  aria-describedby="arcade-lb-game-hint"
                >
                  {ARCADE_LEADERBOARD_GAMES.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="arcade-lb-select-chevron h-4 w-4" strokeWidth={2.4} aria-hidden />
              </div>
              <p id="arcade-lb-game-hint" className="mt-1.5 text-[11px] leading-snug text-zinc-500 sm:text-xs">
                Top runs for whichever cabinet you pick — climb past the other apes one score at a time.
              </p>
            </div>
          )}
        </div>

        <div className="arcade-cabinet">
          <div className="arcade-cabinet-inner overflow-hidden">
            {loading && (
              <div className="space-y-3 p-6">
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-cyan-200 sm:text-sm">
                  {mode === 'points'
                    ? 'Loading total points leaderboard...'
                    : 'Loading game leaderboard...'}
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="p-8 text-center text-red-300 text-sm">{error}</div>
            )}

            {!loading && !error && mode === 'points' && pointsRows.length === 0 && (
              <div className="p-12 text-center text-[var(--text-sub)] text-sm">No points data yet.</div>
            )}

            {!loading && !error && mode === 'game' && gameRows.length === 0 && (
              <div className="p-12 text-center text-[var(--text-sub)] text-sm">No scores for this game yet.</div>
            )}

            {!loading && !error && mode === 'points' && pointsRows.length > 0 && (
              <ul className="divide-y divide-white/8">
                {pointsRows.map((row) => {
                  const r = mergeGlyphProfile(row);
                  return (
                  <li
                    key={r.wallet_address}
                    className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 ${
                      r.rank === 1
                        ? 'bg-yellow-500/10'
                        : r.rank === 2
                          ? 'bg-white/5'
                          : r.rank === 3
                            ? 'bg-orange-600/10'
                            : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span className="w-10 shrink-0 pt-0.5 text-center font-black text-lg leading-none text-[var(--arcade-cyan)] tabular-nums">
                        {r.rank <= 3 ? (r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉') : `#${r.rank}`}
                      </span>
                      <LeaderboardPlayer
                        displayName={r.display_name}
                        username={r.username}
                        walletAddress={r.wallet_address}
                        avatarUrl={r.avatar_url}
                        profileSlug={r.profile_slug}
                      />
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-4 self-center text-sm sm:gap-6">
                      <span className="text-white/40">
                        Lv <span className="text-amber-400 font-bold">{r.level}</span>
                      </span>
                      <span className="text-white/40">
                        XP <span className="text-purple-300 font-mono tabular-nums">{r.experience.toLocaleString()}</span>
                      </span>
                      <span className="arcade-insert text-[var(--arcade-amber)] tabular-nums">
                        {r.total_points.toLocaleString()} pts
                      </span>
                    </div>
                  </li>
                );
                })}
              </ul>
            )}

            {!loading && !error && mode === 'game' && gameRows.length > 0 && (
              <ul className="divide-y divide-white/8">
                {gameRows.map((row) => {
                  const r = mergeGlyphProfile(row);
                  return (
                  <li
                    key={`${r.wallet_address}-${r.rank}`}
                    className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 ${
                      r.rank === 1
                        ? 'bg-yellow-500/10'
                        : r.rank === 2
                          ? 'bg-white/5'
                          : r.rank === 3
                            ? 'bg-orange-600/10'
                            : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span className="w-10 shrink-0 pt-0.5 text-center font-black text-lg leading-none text-[var(--arcade-cyan)] tabular-nums">
                        {r.rank <= 3 ? (r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉') : `#${r.rank}`}
                      </span>
                      <LeaderboardPlayer
                        displayName={r.display_name}
                        username={r.username}
                        walletAddress={r.wallet_address}
                        avatarUrl={r.avatar_url}
                        profileSlug={r.profile_slug}
                      />
                    </div>
                    <span className="shrink-0 self-center text-xl font-black tabular-nums text-hero-blue">
                      {r.score.toLocaleString()}
                    </span>
                  </li>
                );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ArcadeLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="section-spacing pt-32 text-center text-[var(--text-sub)]">Loading leaderboard…</div>
      }
    >
      <ArcadeLeaderboardContent />
    </Suspense>
  );
}
