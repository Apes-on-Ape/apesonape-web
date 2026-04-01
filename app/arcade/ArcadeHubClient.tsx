'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useGlyph } from '@use-glyph/sdk-react';
import type { LucideIcon } from 'lucide-react';
import {
  ARCADE_WALLET_SYNC_EVENT,
  getGlyphEvmWalletAddress,
  getGlyphPrimaryAddress,
} from '@/lib/arcade-wallet';
import {
  Award,
  Bird,
  Car,
  Gamepad2,
  LayoutGrid,
  Rocket,
  Swords,
  Trophy,
  User,
  Wrench,
} from 'lucide-react';
import { ARCADE_GAMES } from './arcade-games';

/** One glance at genre / vibe — matches game slug from arcade-games */
const GAME_PREVIEW_ICON: Record<string, LucideIcon> = {
  'block-dodger': LayoutGrid,
  'neon-racer': Car,
  'galaxy-ape': Rocket,
  'ape-man': Gamepad2,
  'flappy-ape': Bird,
  'tailstrike-arena': Swords,
};

/** RGB triple for CSS var + inner accents aligned to each game’s look */
const GAME_TILE_ACCENT: Record<
  string,
  {
    rgb: string;
    iconPanel: string;
    icon: string;
    iconHover: string;
    slot: string;
    titleHover: string;
    openHover: string;
  }
> = {
  'block-dodger': {
    rgb: '125, 211, 252',
    iconPanel:
      'border-sky-400/45 bg-[linear-gradient(145deg,rgba(8,20,36,0.96)_0%,rgba(12,32,48,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(56,189,248,0.16)] transition duration-300 group-hover:border-sky-300/60 group-hover:shadow-[0_0_36px_rgba(56,189,248,0.28)]',
    icon: 'text-sky-300',
    iconHover: 'group-hover:scale-105 group-hover:text-sky-100',
    slot: 'border-sky-400/45 bg-sky-500/15 text-sky-100/95',
    titleHover: 'group-hover:text-sky-200',
    openHover: 'group-hover:text-sky-300',
  },
  'neon-racer': {
    rgb: '167, 139, 250',
    iconPanel:
      'border-violet-400/45 bg-[linear-gradient(145deg,rgba(24,12,40,0.96)_0%,rgba(36,18,56,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(139,92,246,0.2)] transition duration-300 group-hover:border-fuchsia-400/50 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]',
    icon: 'text-violet-300',
    iconHover: 'group-hover:scale-105 group-hover:text-fuchsia-200',
    slot: 'border-violet-400/45 bg-violet-500/15 text-violet-100/95',
    titleHover: 'group-hover:text-violet-200',
    openHover: 'group-hover:text-violet-200',
  },
  'galaxy-ape': {
    rgb: '248, 113, 113',
    iconPanel:
      'border-red-400/45 bg-[linear-gradient(145deg,rgba(40,8,12,0.96)_0%,rgba(48,12,16,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(239,68,68,0.22)] transition duration-300 group-hover:border-orange-400/50 group-hover:shadow-[0_0_40px_rgba(248,113,113,0.28)]',
    icon: 'text-red-400',
    iconHover: 'group-hover:scale-105 group-hover:text-orange-300',
    slot: 'border-red-400/45 bg-red-500/15 text-red-100/95',
    titleHover: 'group-hover:text-red-200',
    openHover: 'group-hover:text-red-300',
  },
  'ape-man': {
    rgb: '250, 204, 21',
    iconPanel:
      'border-amber-400/50 bg-[linear-gradient(145deg,rgba(36,28,6,0.96)_0%,rgba(48,40,8,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(234,179,8,0.2)] transition duration-300 group-hover:border-yellow-300/55 group-hover:shadow-[0_0_38px_rgba(250,204,21,0.3)]',
    icon: 'text-amber-300',
    iconHover: 'group-hover:scale-105 group-hover:text-yellow-200',
    slot: 'border-amber-400/45 bg-amber-500/15 text-amber-100/95',
    titleHover: 'group-hover:text-amber-200',
    openHover: 'group-hover:text-amber-200',
  },
  'flappy-ape': {
    rgb: '52, 211, 153',
    iconPanel:
      'border-emerald-400/45 bg-[linear-gradient(145deg,rgba(6,28,20,0.96)_0%,rgba(8,40,28,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(16,185,129,0.18)] transition duration-300 group-hover:border-lime-400/45 group-hover:shadow-[0_0_36px_rgba(52,211,153,0.26)]',
    icon: 'text-emerald-300',
    iconHover: 'group-hover:scale-105 group-hover:text-lime-200',
    slot: 'border-emerald-400/45 bg-emerald-500/15 text-emerald-100/95',
    titleHover: 'group-hover:text-emerald-200',
    openHover: 'group-hover:text-emerald-300',
  },
  'tailstrike-arena': {
    rgb: '249, 115, 22',
    iconPanel:
      'border-orange-400/45 bg-[linear-gradient(145deg,rgba(36,16,6,0.96)_0%,rgba(48,20,8,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(234,88,12,0.2)] transition duration-300 group-hover:border-amber-400/55 group-hover:shadow-[0_0_38px_rgba(249,115,22,0.28)]',
    icon: 'text-orange-400',
    iconHover: 'group-hover:scale-105 group-hover:text-amber-300',
    slot: 'border-orange-400/45 bg-orange-500/15 text-orange-100/95',
    titleHover: 'group-hover:text-orange-200',
    openHover: 'group-hover:text-orange-300',
  },
};

const TICKER =
  'HOLDER ARCADE  •  APECHAIN  •  HIGH SCORES  •  MAINTENANCE — SOCIAL LOUNGE CLOSED  •  PLAY ANYWHERE  •  ';

export default function ArcadeHubClient() {
  const glyph = (useGlyph() as unknown) as {
    login?: () => void | Promise<void>;
    user?: {
      id?: string;
      evmWallet?: string;
      smartWallet?: string;
      linkedWallets?: Array<{ address?: string }>;
    };
  };
  const hasGlyphSession = !!glyph?.user;
  const glyphUserId = glyph?.user?.id?.trim() ?? '';

  const [wallet, setWallet] = useState<string | null>(null);
  /** Same `user_profiles` row as /profile (display name, PFP, X handle) */
  const [siteProfile, setSiteProfile] = useState<{
    avatarUrl: string | null;
    displayName: string | null;
    xUsername: string | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!glyphUserId) {
      setSiteProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    fetch(`/api/profile/summary?userId=${encodeURIComponent(glyphUserId)}`, { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { profile?: { avatar_url?: string | null; display_name?: string | null; x_username?: string | null } } | null) => {
        if (cancelled) return;
        const p = json?.profile;
        if (!p) {
          setSiteProfile(null);
          return;
        }
        setSiteProfile({
          avatarUrl: p.avatar_url?.trim() || null,
          displayName: p.display_name?.trim() || null,
          xUsername: p.x_username?.trim() || null,
        });
      })
      .catch(() => {
        if (!cancelled) setSiteProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [glyphUserId]);

  const primaryGlyphWallet = getGlyphPrimaryAddress(glyph?.user);
  const shortPrimaryWallet = primaryGlyphWallet
    ? `${primaryGlyphWallet.slice(0, 6)}…${primaryGlyphWallet.slice(-4)}`
    : '';
  const arcadeDisplayName =
    siteProfile?.displayName ||
    (siteProfile?.xUsername ? `@${siteProfile.xUsername}` : '') ||
    shortPrimaryWallet ||
    'Player';

  const [pfpError, setPfpError] = useState(false);
  useEffect(() => {
    setPfpError(false);
  }, [siteProfile?.avatarUrl]);

  useEffect(() => {
    const readStored = () => {
      if (typeof window === 'undefined') return;
      const glyphEvm = localStorage.getItem('glyphEvmWallet');
      const w = (glyphEvm && glyphEvm.trim()) || null;
      if (w) setWallet(w);
    };
    readStored();

    const onSync = (ev: Event) => {
      const detail = (ev as CustomEvent<{ address?: string }>).detail;
      if (detail?.address) {
        setWallet(detail.address);
      } else {
        readStored();
      }
    };
    window.addEventListener(ARCADE_WALLET_SYNC_EVENT, onSync);
    return () => window.removeEventListener(ARCADE_WALLET_SYNC_EVENT, onSync);
  }, []);

  useEffect(() => {
    const glyphEvm = getGlyphEvmWalletAddress(glyph?.user)?.trim();
    if (glyphEvm) {
      setWallet(glyphEvm);
    }
  }, [glyph?.user]);

  return (
    <section className="section-spacing pt-24 md:pt-32">
      <div className="container-premium">
        {/* Hero */}
        <div className="mb-10 text-center md:mb-14">
          <p className="arcade-subline mb-4">/// INSERT COIN ///</p>
          <h1 className="arcade-title-pixel arcade-flicker text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            Apes On Ape
            <br />
            <span className="bg-gradient-to-r from-[var(--arcade-cyan)] via-white to-[var(--arcade-magenta)] bg-clip-text text-transparent">
              ARCADE
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[var(--text-sub)] md:text-base">
            Insert coin, pick a cabinet, chase high scores on your phone or desktop. Sign in with Glyph — we unlock the floor
            for verified holders and sync your runs to the leaderboard.
          </p>
        </div>

        {/* Ticker */}
        <div className="arcade-marquee mb-10 md:mb-12">
          <div className="arcade-marquee-inner" aria-hidden="true">
            <span>{TICKER}</span>
            <span>{TICKER}</span>
          </div>
        </div>

        {/* Glyph / site profile (same data as Profile page in Supabase) */}
        {hasGlyphSession && glyphUserId ? (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[rgba(8,10,18,0.85)] px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[rgba(0,240,255,0.35)] bg-zinc-900 shadow-[0_0_24px_rgba(0,240,255,0.12)]">
              {siteProfile?.avatarUrl && !pfpError ? (
                <img
                  src={siteProfile.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setPfpError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                  <User className="h-8 w-8" strokeWidth={1.25} aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="arcade-subline mb-1 text-[0.65rem] opacity-90">/// YOUR PROFILE ///</p>
              <p className="truncate font-[family-name:var(--font-raleway)] text-lg font-bold text-white sm:text-xl">
                {profileLoading ? 'Loading…' : arcadeDisplayName}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {profileLoading
                  ? '\u00a0'
                  : siteProfile?.displayName && siteProfile?.xUsername
                    ? `@${siteProfile.xUsername}`
                    : 'Picture and name follow your Profile page settings.'}
              </p>
            </div>
            <Link
              href="/profile"
              className="arcade-btn-ghost shrink-0 self-start sm:self-center"
            >
              EDIT PROFILE
            </Link>
          </div>
        ) : null}

        {/* Wallet cabinet */}
        <div className="arcade-cabinet mb-10 md:mb-14">
          <div className="arcade-cabinet-inner p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="arcade-insert">PLAYER 1 — WALLET</p>
                <h2 className="font-[family-name:var(--font-raleway)] text-xl font-bold text-white md:text-2xl">
                  {!hasGlyphSession
                    ? 'Sign in with Glyph'
                    : wallet
                      ? 'Access granted'
                      : 'Checking holder wallet…'}
                </h2>
                <p className="max-w-md text-sm text-[var(--text-sub)]">
                  {!hasGlyphSession
                    ? 'Arcade access uses your Glyph account and the wallets linked in it. Apes On Ape NFTs must be in a linked wallet.'
                    : wallet
                      ? `Holder wallet for games: ${wallet.slice(0, 6)}…${wallet.slice(-4)} (from your Glyph session).`
                      : 'Linking your verified Glyph wallet for games — if this takes long, confirm you hold Apes and refresh.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/profile"
                  className="arcade-btn-ghost inline-flex items-center justify-center gap-2 text-center"
                >
                  <User className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  PROFILE
                </Link>
                {wallet ? (
                  <Link
                    href="/arcade/achievements"
                    className="arcade-btn-ghost inline-flex items-center justify-center gap-2 text-center"
                  >
                    <Award className="h-3.5 w-3.5 text-[var(--arcade-amber)] opacity-90" aria-hidden />
                    ACHIEVEMENTS
                  </Link>
                ) : null}
                {!hasGlyphSession ? (
                  <button
                    type="button"
                    className="arcade-btn-neon shrink-0"
                    onClick={() => {
                      void glyph?.login?.();
                    }}
                  >
                    SIGN IN WITH GLYPH
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Game library */}
        <div className="arcade-game-library p-5 sm:p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8 pb-8 mb-8 border-b border-white/10">
            <div className="min-w-0 flex-1">
              <p className="arcade-subline mb-2">/// GAME LIBRARY ///</p>
              <h2 className="arcade-title-pixel text-base sm:text-lg md:text-xl">SELECT GAME</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                Choose a cabinet below. Everything runs in-page; your high scores can show up on{' '}
                <Link href="/profile" className="text-cyan-300/95 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-200">
                  Profile → Arcade
                </Link>{' '}
                when you use the same wallet.
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
              <Link
                href="/arcade/leaderboard"
                className="arcade-btn-ghost inline-flex items-center gap-2 text-xs sm:text-[0.65rem]"
              >
                <Trophy className="h-3.5 w-3.5 text-[var(--arcade-amber)]" aria-hidden />
                LEADERBOARD
              </Link>
              <span className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 font-[family-name:var(--font-raleway)] text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100/95">
                {ARCADE_GAMES.length} games
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {ARCADE_GAMES.map((game, i) => {
              const PreviewIcon = GAME_PREVIEW_ICON[game.slug] ?? Car;
              const accent = GAME_TILE_ACCENT[game.slug] ?? GAME_TILE_ACCENT['block-dodger'];
              return (
              <Link
                key={game.slug}
                href={`/arcade/${game.slug}`}
                className="arcade-game-tile group relative z-0 flex min-h-[200px] flex-col p-5 sm:min-h-[220px] sm:p-6"
                style={{ ['--arcade-tile-accent-rgb' as string]: accent.rgb }}
              >
                <span className="arcade-corner-bracket tl" />
                <span className="arcade-corner-bracket tr" />
                <span className="arcade-corner-bracket bl" />
                <span className="arcade-corner-bracket br" />
                <div className="relative z-[1] flex flex-1 flex-col gap-3 sm:flex-row sm:gap-4">
                  <div
                    className={`flex h-[4.5rem] w-full shrink-0 items-center justify-center rounded-xl border sm:h-[5.25rem] sm:w-[5.25rem] sm:max-w-[5.25rem] ${accent.iconPanel}`}
                    aria-hidden
                  >
                    <PreviewIcon
                      className={`h-9 w-9 opacity-[0.92] transition duration-300 sm:h-10 sm:w-10 ${accent.icon} ${accent.iconHover}`}
                      strokeWidth={1.35}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-[family-name:var(--font-arcade-display)] text-[0.5rem] uppercase tracking-[0.18em] ${accent.slot}`}
                      >
                        Slot {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">ApeChain</span>
                    </div>
                    <h3
                      className={`mb-2 font-[family-name:var(--font-raleway)] text-lg font-bold leading-snug text-white transition sm:text-xl ${accent.titleHover}`}
                    >
                      {game.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-300/95 sm:text-[15px]">{game.description}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-white/8 pt-4">
                      <span className="arcade-insert-themed">▶ START</span>
                      <span
                        className={`text-[11px] font-semibold text-zinc-500 transition ${accent.openHover} group-hover:text-zinc-200`}
                      >
                        Open →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
            })}
          </div>

          <div className="mt-10 border-t border-white/10 pt-10">
            <div className="flex flex-col gap-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <div className="flex min-w-0 flex-1 gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-amber-400/35 bg-black/40"
                  aria-hidden
                >
                  <Wrench className="h-7 w-7 text-amber-200/90" strokeWidth={1.35} />
                </div>
                <div className="min-w-0">
                  <p className="arcade-subline mb-2 text-amber-200/90">/// MAINTENANCE ///</p>
                  <h3 className="font-[family-name:var(--font-raleway)] text-lg font-bold text-white sm:text-xl">
                    Social lounge offline
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
                    The former clubroom area is closed for maintenance. There is no entry — check back later.
                  </p>
                </div>
              </div>
              <p
                className="shrink-0 rounded-lg border border-zinc-600/60 bg-zinc-900/80 px-4 py-3 text-center font-[family-name:var(--font-raleway)] text-xs font-semibold uppercase tracking-widest text-zinc-400 sm:text-[11px]"
                role="status"
              >
                Access denied
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
