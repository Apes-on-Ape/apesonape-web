'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music, Heart, Disc3, Trophy, ExternalLink, ChevronRight, Download, Smartphone } from 'lucide-react';
import { SiSoundcloud } from 'react-icons/si';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Image from 'next/image';
import { ARTISTS } from '@/app/data/artists';
import { updateMediaSession } from '@/app/components/PWAManager';

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  duration: number;
  permalink: string;
  mood?: string;
  season?: string;
  streamUrl?: string;
}

interface TopTrack {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url: string;
  playback_count: number;
  likes_count: number;
  reposts_count: number;
  duration: number;
  score: number;
}

interface SoundCloudStats {
  followers: number;
  tracks: number;
  playlists: number;
  likes: number;
  reposts: number;
  totalPlays: number;
  topTracks?: TopTrack[];
}

interface Playlist {
  id: string;
  title: string;
  url: string;
  trackCount: number;
  artwork?: string;
}

type SoundCloudTrack = {
  id: number;
  title?: string;
  user?: { username?: string };
  artwork_url?: string;
  duration?: number;
  permalink_url?: string;
  description?: string;
  stream_url?: string;
};

interface SoundCloudWidget {
  bind(event: string, listener: () => void): void;
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  isPaused(callback: (paused: boolean) => void): void;
  setVolume(volumePercent: number): void;
  getCurrentSound(callback: (sound: SoundCloudTrack | null) => void): void;
  getSounds(callback: (sounds: SoundCloudTrack[]) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
  load(url: string, options?: Record<string, unknown>): void;
}

interface SoundCloud {
  Widget: {
    (iframe: HTMLIFrameElement): SoundCloudWidget;
    Events: {
      READY: string;
      PLAY: string;
      PAUSE: string;
      FINISH: string;
    };
  };
}

const AVAILABLE_PLAYLISTS: Playlist[] = [
  // SmokeThatDank
  { id: 'saint-dank',      title: 'Saint Dank by smokethatdank',             url: 'https://soundcloud.com/apesonape/sets/saint-dank-by-smokethatdank',             trackCount: 8 },
  { id: 'fubar',           title: 'FUBAR by smokethatdank',                  url: 'https://soundcloud.com/apesonape/sets/fubar-by-smokethatdank',                  trackCount: 5 },
  { id: 'visionary',       title: 'Visionary by smokethatdank',              url: 'https://soundcloud.com/apesonape/sets/visionary-by-smokethatdank',              trackCount: 8 },
  { id: 'notorious',       title: 'NOTORIOUS by smokethatdank',              url: 'https://soundcloud.com/apesonape/sets/notorious-by-smokethatdank',              trackCount: 0 },
  { id: 'g-funk-summer',   title: 'G-Funk Summer by smokethatdank',          url: 'https://soundcloud.com/apesonape/sets/g-funk-summer-by-smokethatdank',          trackCount: 0 },
  { id: 'shaolin',         title: 'Shaolin Chamber Manuscripts by smokethatdank', url: 'https://soundcloud.com/apesonape/sets/shaolin-chamber-manuscripts-by-smokethatdank', trackCount: 0 },
  { id: 'raw',             title: 'Raw by smokethatdank',                    url: 'https://soundcloud.com/apesonape/sets/raw-by-smokethatdank',                    trackCount: 0 },
  { id: 'straight-outta',  title: 'Straight Outta ApeChain by smokethatdank',url: 'https://soundcloud.com/apesonape/sets/straight-outta-apechain-by-smokethatdank',trackCount: 0 },
  // 2Real2x
  { id: 'unwrapped',       title: 'Unwrapped But Not Finished by 2Real2x',   url: 'https://soundcloud.com/apesonape/sets/unwrapped-but-not-finished-by-2real2x',  trackCount: 8 },
  { id: 'press-start',     title: 'Press Start by 2Real2x',                  url: 'https://soundcloud.com/apesonape/sets/press-start-by-2real2x',                  trackCount: 7 },
  // AlexNoTime
  { id: 'teeth-in-the-vines', title: 'Teeth In The Vines by NoTime',        url: 'https://soundcloud.com/apesonape/sets/teeth-in-the-vines-by-notime',           trackCount: 6 },
  // DIBS
  { id: 'dibsify',         title: 'Dibsify by Dr. Dibs',                     url: 'https://soundcloud.com/apesonape/sets/dibsify-by-dr-dibs',                     trackCount: 0 },
  { id: 'sinatra-season-2',title: 'Sinatra Season 2 by Dr. Dibs',            url: 'https://soundcloud.com/apesonape/sets/sinatra-season-2-by-dr-dibs',            trackCount: 12 },
  // Dudeman22 / Simian Maw
  { id: 'brutal-dynasty',  title: 'Brutal Dynasty by Simian Maw',            url: 'https://soundcloud.com/apesonape/sets/brutal-dynasty-by-simian-maw',           trackCount: 9 },
  // SurfingPunk / ZEN (will resolve once API loads)
  { id: 'warm-up-vol-i',   title: 'Warm Up Vol. I by ZEN',                   url: 'https://soundcloud.com/apesonape/sets/warm-up-vol-i-by-zen',                   trackCount: 10 },
  { id: 'el-juego',        title: 'El Juego by ZEN',                         url: 'https://soundcloud.com/apesonape/sets/el-juego-by-zen',                        trackCount: 6 },
];


function getAlbumArtwork(playlistId: string): string {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-blue-500 to-cyan-500',
    'from-red-500 to-orange-500',
    'from-gray-700 to-gray-900',
    'from-yellow-500 to-amber-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-rose-500 to-pink-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-green-500',
    'from-violet-500 to-fuchsia-500',
  ];
  const hash = Array.from(playlistId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

const DEFAULT_PLAYLIST_URL = AVAILABLE_PLAYLISTS[3].url;

// Seed map: confirmed latest playlist per artist slug (pinned regardless of API order).
const ARTIST_PLAYLIST_SEED: Record<string, string> = {
  'smokethatdank1': 'https://soundcloud.com/apesonape/sets/saint-dank-by-smokethatdank',
  '2real2x':        'https://soundcloud.com/apesonape/sets/unwrapped-but-not-finished-by-2real2x',
  'alexnotime':     'https://soundcloud.com/apesonape/sets/teeth-in-the-vines-by-notime',
  'doinitbettersan':'https://soundcloud.com/apesonape/sets/dibsify-by-dr-dibs',
  'dudeman22':      'https://soundcloud.com/apesonape/sets/brutal-dynasty-by-simian-maw',
};

// SoundCloud credited names that differ from the artist's display name / handle.
// Key = artist slug, values = lowercase stripped aliases to match against playlist titles.
const ARTIST_SC_ALIASES: Record<string, string[]> = {
  'dudeman22':   ['simianmaw', 'simiamaw'],
  'surfingpunk': ['surfer', 'surfingpunk', 'surfpunk'],
};

// Artists featured on the page who release singles (no full playlist).
// Clicking them opens their Twitter/X profile.
const SINGLES_ARTIST_SLUGS = new Set(['rabidartwork']);

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-black text-white tabular-nums">{value}</span>
      <span className="text-xs uppercase tracking-[0.15em] text-white/35 font-semibold">{label}</span>
    </div>
  );
}

export default function RadioPage() {
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(70);
  const [isReady, setIsReady] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<SoundCloudStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_PLAYLIST_URL);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>(AVAILABLE_PLAYLISTS[3]);
  const [playlistsWithArtwork, setPlaylistsWithArtwork] = useState<Playlist[]>([]);
  const [isInsertingDisc, setIsInsertingDisc] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<(typeof ARTISTS)[0] | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'releases' | 'queue'>('releases');

  // PWA install prompt (Android/Chrome/Edge)
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) { setPwaInstalled(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setPwaInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const hasAutoTriedRef = useRef(false);
  const unmuteOnFirstInteractionRef = useRef(true);

  // ── Spotify / SoundCloud mutual exclusion ─────────────────────────────────
  const spotifyIframeRef = useRef<HTMLIFrameElement | null>(null);
  // Always-current helper so widget callbacks (captured in closures) can call it
  const pauseSpotifyRef = useRef<() => void>(() => {});
  pauseSpotifyRef.current = () => {
    try {
      spotifyIframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ command: 'pause' }), '*'
      );
    } catch { /* cross-origin guard */ }
  };

  // Listen for Spotify postMessage events and pause SoundCloud when Spotify plays
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Spotify embed fires playback_update with isPaused:false when it starts
        if (data?.type === 'playback_update' && data?.payload?.isPaused === false) {
          widgetRef.current?.pause();
        }
      } catch { /* ignore malformed messages */ }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const playerSrc = React.useMemo(() => {
    const params = new URLSearchParams({
      url: playlistUrl,
      color: '0054F9',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'true',
      show_artwork: 'true',
      buying: 'false',
      sharing: 'true',
      download: 'true',
      show_playcount: 'true',
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, [playlistUrl]);

  const convertTrack = (scTrack: SoundCloudTrack): Track => ({
    id: String(scTrack.id),
    title: scTrack.title || 'Untitled',
    artist: scTrack.user?.username || 'Apes On Ape',
    artwork: scTrack.artwork_url || '/AoA-placeholder-apecoinblue.jpg',
    duration: Math.floor((scTrack.duration || 0) / 1000),
    permalink: scTrack.permalink_url || '',
    mood: scTrack.description?.match(/mood:\s*(\w+)/i)?.[1] || 'Vibes',
    season: scTrack.description?.match(/season:\s*(\w+)/i)?.[1] || 'Season 1',
    streamUrl: scTrack.stream_url,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        const baseRes = await fetch('/api/soundcloud/stats');
        if (!baseRes.ok) return;
        const base = await baseRes.json();
        if (base.error) return;

        const trackById = new Map<number, { id: number; title: string; permalink_url: string; artwork_url: string; playback_count: number; likes_count: number; reposts_count: number; duration: number }>();
        for (const t of base.tracks || []) {
          const existing = trackById.get(t.id);
          if (!existing || (t.playback_count ?? 0) > (existing.playback_count ?? 0)) trackById.set(t.id, t);
        }

        const chunks = base.playlistChunks;
        const totalChunks = chunks?.total ?? 1;
        const allRemainingCompactIds = new Set<number>();
        for (const id of base.remainingCompactIds || []) {
          if (!trackById.has(id)) allRemainingCompactIds.add(id);
        }
        for (let i = 1; i < totalChunks; i++) {
          const chunkRes = await fetch(`/api/soundcloud/stats?playlistChunk=${i}`);
          if (!chunkRes.ok) continue;
          const chunk = await chunkRes.json();
          for (const t of chunk.tracks || []) {
            const existing = trackById.get(t.id);
            if (!existing || (t.playback_count ?? 0) > (existing.playback_count ?? 0)) trackById.set(t.id, t);
          }
          for (const id of chunk.remainingCompactIds || []) {
            if (!trackById.has(id)) allRemainingCompactIds.add(id);
          }
        }
        const idsToFetch = Array.from(allRemainingCompactIds);
        for (let i = 0; i < idsToFetch.length; i += 100) {
          const batch = idsToFetch.slice(i, i + 100);
          const res = await fetch(`/api/soundcloud/stats?fetchTrackIds=${batch.join(',')}`);
          if (!res.ok) continue;
          const data = await res.json();
          for (const t of data.tracks || []) {
            const existing = trackById.get(t.id);
            if (!existing || (t.playback_count ?? 0) > (existing.playback_count ?? 0)) trackById.set(t.id, t);
          }
        }

        let totalPlays = 0;
        let totalLikes = 0;
        let totalReposts = 0;
        for (const [, t] of trackById) {
          totalPlays += t.playback_count || 0;
          totalLikes += t.likes_count || 0;
          totalReposts += t.reposts_count || 0;
        }
        if (base.directTotalPlays != null && base.directTotalPlays > totalPlays) totalPlays = base.directTotalPlays;
        const topTracks = Array.from(trackById.values())
          .map((t) => ({ ...t, score: (t.playback_count || 0) + (t.likes_count || 0) * 2 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        setStats({
          followers: base.stats?.followers ?? base.user?.followers_count ?? 0,
          tracks: base.stats?.tracks ?? base.user?.track_count ?? 0,
          playlists: base.stats?.playlists ?? base.user?.playlist_count ?? 0,
          likes: totalLikes,
          reposts: totalReposts,
          totalPlays,
          topTracks,
        });
      } catch {
        // silent
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const response = await fetch('/api/soundcloud/playlists');
        if (response.ok) {
          const data = await response.json();
          if (data.playlists && Array.isArray(data.playlists)) {
            const fetchedPlaylists: Playlist[] = data.playlists.map((p: { id: string | number; title?: string; permalink?: string; permalink_url?: string; trackCount?: number; track_count?: number; artwork?: string }) => ({
              id: String(p.id),
              title: p.title || 'Untitled Album',
              url: p.permalink || p.permalink_url || '',
              trackCount: p.trackCount || p.track_count || 0,
              artwork: p.artwork || undefined,
            }));
            setPlaylistsWithArtwork(fetchedPlaylists);
            const fubar = fetchedPlaylists.find(p => p.url.includes('fubar') || p.title.toLowerCase().includes('fubar'));
            if (fubar) {
              setSelectedPlaylist(fubar);
              setPlaylistUrl(fubar.url);
            } else if (fetchedPlaylists.length > 0) {
              setSelectedPlaylist(fetchedPlaylists[0]);
              setPlaylistUrl(fetchedPlaylists[0].url);
            }
          }
        }
      } catch {
        // silent
      }
    }
    fetchPlaylists();
  }, []);

  const trackAllSounds = (sounds: SoundCloudTrack[]) => {
    setAllTracks(sounds.map(convertTrack));
  };

  useEffect(() => {
    let cancelled = false;

    function initWidget() {
      if (!iframeRef.current || !window.SC || !window.SC.Widget) return;
      const widget = window.SC.Widget(iframeRef.current) as unknown as SoundCloudWidget;
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        if (cancelled) return;
        setIsReady(true);
        widget.setVolume(0);
        widget.getSounds((sounds: SoundCloudTrack[]) => {
          if (!Array.isArray(sounds) || sounds.length === 0) return;
          const randomIndex = Math.floor(Math.random() * sounds.length);
          widget.load(playlistUrl, {
            auto_play: true,
            visual: false,
            show_comments: false,
            hide_related: true,
            show_reposts: false,
            show_user: false,
            show_teaser: false,
            start_track: randomIndex,
          });
          trackAllSounds(sounds);
        });
        if (!hasAutoTriedRef.current) {
          hasAutoTriedRef.current = true;
          setTimeout(() => {
            widget.isPaused((paused: boolean) => {
              if (paused) { try { widget.play(); } catch { /* silent */ } }
            });
          }, 600);
        }
      });

      widget.bind(window.SC.Widget.Events.PLAY, () => {
        if (cancelled) return;
        pauseSpotifyRef.current();
        setIsPlaying(true);
        setSidebarTab('queue');
        widget.getCurrentSound((sound: SoundCloudTrack | null) => {
          if (sound) setNowPlaying(convertTrack(sound));
        });
        widget.getSounds((sounds: SoundCloudTrack[]) => {
          if (Array.isArray(sounds) && sounds.length > 0) trackAllSounds(sounds);
        });
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        if (cancelled) return;
        setIsPlaying(false);
      });

      const resumeFromGesture = () => {
        if (!unmuteOnFirstInteractionRef.current) return;
        unmuteOnFirstInteractionRef.current = false;
        try {
          widget.setVolume(volume);
          widget.isPaused((paused: boolean) => { if (paused) widget.play(); });
        } catch { /* silent */ }
        window.removeEventListener('pointerdown', resumeFromGesture);
        window.removeEventListener('keydown', resumeFromGesture);
        window.removeEventListener('touchstart', resumeFromGesture);
      };
      window.addEventListener('pointerdown', resumeFromGesture, { once: true });
      window.addEventListener('keydown', resumeFromGesture, { once: true });
      window.addEventListener('touchstart', resumeFromGesture, { once: true });
    }

    function ensureScript() {
      const sc = window.SC;
      if (sc && typeof sc.Widget === 'function') { initWidget(); return; }
      const existing = document.querySelector('script[data-sc-widget]') as HTMLScriptElement | null;
      if (existing) { existing.addEventListener('load', initWidget); return; }
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-sc-widget', 'true');
      script.addEventListener('load', initWidget);
      document.body.appendChild(script);
    }

    ensureScript();
    return () => { cancelled = true; };
  }, [volume, playlistUrl]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const displayPlaylists = playlistsWithArtwork.length > 0 ? playlistsWithArtwork : AVAILABLE_PLAYLISTS;

  // Media Session API — updates lock screen / car display when the track changes
  useEffect(() => {
    if (!nowPlaying) return;
    updateMediaSession({
      title: nowPlaying.title,
      artist: selectedArtist?.name ?? 'AOA Records',
      album: selectedPlaylist.title.replace(/\s+by\s+.+$/i, '').trim(),
      artwork: nowPlaying.artwork ?? selectedPlaylist.artwork,
      onPlay:  () => widgetRef.current?.play(),
      onPause: () => widgetRef.current?.pause(),
      onNext:  () => widgetRef.current?.next(),
      onPrev:  () => widgetRef.current?.prev(),
    });
  }, [nowPlaying, selectedArtist, selectedPlaylist]);

  // Collect ALL releases per artist (SoundCloud playlists + Spotify albums).
  // Parses "by [Name]" from SoundCloud playlist titles, fuzzy-matches artist names/aliases,
  // then appends any known Spotify-only releases at the end.
  const artistAlbumsMap = useMemo<Record<string, Playlist[]>>(() => {
    const map: Record<string, Playlist[]> = {};

    // SoundCloud playlists via dynamic title matching
    for (const playlist of displayPlaylists) {
      if (!playlist.url) continue;
      const byMatch = playlist.title.match(/\bby\s+(.+)$/i);
      if (!byMatch) continue;
      const credited = byMatch[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      for (const artist of ARTISTS) {
        const nameKey = artist.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const handleKey = artist.handle.toLowerCase().replace(/[^a-z0-9]/g, '');
        const aliases = ARTIST_SC_ALIASES[artist.slug] ?? [];
        if ([nameKey, handleKey, ...aliases].some(k =>
          k.length > 2 && (k === credited || credited.includes(k) || k.includes(credited))
        )) {
          if (!map[artist.slug]) map[artist.slug] = [];
          if (!map[artist.slug].find(p => p.url === playlist.url)) {
            map[artist.slug].push(playlist);
          }
        }
      }
    }

    // Ensure every seed artist appears even before the API loads
    for (const slug of Object.keys(ARTIST_PLAYLIST_SEED)) {
      if (!map[slug]) map[slug] = [];
    }

    return map;
  }, [displayPlaylists]);

  // Latest playlist URL per artist (seed = confirmed latest; API first entry as fallback).
  const artistPlaylistMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [slug, albums] of Object.entries(artistAlbumsMap)) {
      map[slug] = ARTIST_PLAYLIST_SEED[slug] || albums[0]?.url || '';
    }
    return map;
  }, [artistAlbumsMap]);

  // Show artists with playlists + singles-only artists (who link to their X profile)
  const musicArtists = ARTISTS.filter(a => !!artistPlaylistMap[a.slug] || SINGLES_ARTIST_SLUGS.has(a.slug));

  const handleArtistClick = useCallback((artist: (typeof ARTISTS)[0]) => {
    const latestUrl = artistPlaylistMap[artist.slug];
    if (!latestUrl) {
      const social = artist.twitterUrl || `https://x.com/${artist.handle}`;
      window.open(social, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedArtist(artist);
    if (latestUrl === playlistUrl) return;
    setIsInsertingDisc(true);
    setTimeout(() => {
      setPlaylistUrl(latestUrl);
      setIsReady(false);
      setIsInsertingDisc(false);
      const match = displayPlaylists.find(p => p.url === latestUrl);
      if (match) setSelectedPlaylist(match);
    }, 500);
  }, [artistPlaylistMap, playlistUrl, displayPlaylists]);

  const ArtistAvatar = ({ src, name }: { src: string; name: string }) => {
    const [errored, setErrored] = React.useState(false);
    if (errored) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className="w-10 h-10 text-hero-blue/30" />
        </div>
      );
    }
    return (
      <Image
        src={src}
        alt={name}
        fill
        unoptimized
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setErrored(true)}
      />
    );
  };

  return (
    <div className="min-h-screen" style={{ color: '#f5f5f5' }}>
      <Nav />

      {/* ── COMPACT HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-hero-blue/6 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 border border-hero-blue/30 bg-hero-blue/5 rounded-full px-3 py-1 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-hero-blue animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-blue">AOA Records</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-[0.95] tracking-tight text-white">
                The Sound of<br />
                <span className="text-hero-blue">Apechain.</span>
              </h1>
              <p className="text-white/40 mt-3 text-sm max-w-md">
                Music made by Ape holders — tap an artist to play their catalogue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:flex-shrink-0">
              <a href="https://soundcloud.com/apesonape" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-hero-blue text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-hero-blue-light transition-colors">
                <SiSoundcloud className="w-4 h-4" />
                Listen on SoundCloud
              </a>
              <a href="https://open.spotify.com/artist/5jWLGE3ZNCyau37PWs20AP" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/15 text-white/60 px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:border-[#1DB954]/40 hover:text-[#1DB954] transition-colors font-semibold">
                <svg className="w-3.5 h-3.5 fill-current" style={{ color: '#1DB954' }} viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Spotify
              </a>
              {/* Install PWA button — only shown when browser supports it and not yet installed */}
              {installPrompt && !pwaInstalled && (
                <button
                  onClick={async () => {
                    await installPrompt.prompt();
                    const { outcome } = await installPrompt.userChoice;
                    if (outcome === 'accepted') setPwaInstalled(true);
                    setInstallPrompt(null);
                  }}
                  className="inline-flex items-center gap-2 border border-hero-blue/40 text-hero-blue px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-hero-blue/10 hover:border-hero-blue transition-colors font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-8 md:gap-14">
            {statsLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-6 w-14 bg-white/10 rounded animate-pulse" />
                  <div className="h-2.5 w-10 bg-white/5 rounded animate-pulse mt-1" />
                </div>
              ))
            ) : stats ? (
              <>
                <StatItem value={formatNumber(stats.followers)} label="Followers" />
                <StatItem value={formatNumber(stats.tracks)} label="Tracks" />
                <StatItem value={formatNumber(stats.playlists)} label="Releases" />
                <StatItem value={formatNumber(stats.totalPlays)} label="Total Plays" />
              </>
            ) : (
              <StatItem value={String(displayPlaylists.length)} label="Releases" />
            )}
            <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-white/25 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live on SoundCloud
            </div>
          </div>
        </div>
      </section>

      {/* ── ARTISTS — click to play ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-1">AOA Records</p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Artists</h2>
          </div>
          <span className="text-xs text-white/25 font-semibold">{musicArtists.length} artists</span>
        </div>

        <div
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {musicArtists.map((artist) => {
            const isActive = selectedArtist?.slug === artist.slug;
            const isSinglesOnly = SINGLES_ARTIST_SLUGS.has(artist.slug);
            const albumCount = artistAlbumsMap[artist.slug]?.length ?? 0;
            return (
              <motion.button
                key={artist.slug}
                onClick={() => handleArtistClick(artist)}
                title={isSinglesOnly ? `View ${artist.name} on X` : `Play ${artist.name}'s playlist`}
                className="flex flex-col items-center gap-2.5 flex-shrink-0 group outline-none"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Avatar */}
                <div className={`relative w-[72px] h-[72px] rounded-2xl overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'ring-2 ring-hero-blue ring-offset-2 ring-offset-black shadow-xl shadow-hero-blue/30 scale-105'
                    : isSinglesOnly
                      ? 'ring-1 ring-white/8 hover:ring-white/20 opacity-75 hover:opacity-100'
                      : 'ring-1 ring-white/10 hover:ring-hero-blue/40'
                }`}>
                  <ArtistAvatar src={artist.avatar} name={artist.name} />
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 bg-hero-blue/30 flex items-center justify-center">
                      <Disc3 className="w-6 h-6 text-white vinyl-spin drop-shadow-lg" />
                    </div>
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-hero-blue/10 transition-colors duration-200" />
                  )}
                  {/* Singles-only badge */}
                  {isSinglesOnly && (
                    <div className="absolute bottom-1 right-1 bg-black/70 rounded-md px-1 py-0.5">
                      <span className="text-[8px] font-bold text-white/50 uppercase tracking-wide">singles</span>
                    </div>
                  )}
                </div>
                {/* Name + label */}
                <div className="text-center w-[72px]">
                  <p className={`text-[11px] font-bold truncate leading-tight transition-colors ${
                    isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                  }`}>
                    {artist.name}
                  </p>
                  <p className={`text-[10px] font-semibold mt-0.5 transition-colors ${
                    isActive ? 'text-hero-blue'
                    : isSinglesOnly ? 'text-white/20 group-hover:text-white/35'
                    : 'text-white/20 group-hover:text-white/35'
                  }`}>
                    {isActive && isPlaying ? '▶ playing'
                      : isSinglesOnly ? 'on X ↗'
                      : `${albumCount} album${albumCount !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── DISCOGRAPHY — appears when an artist is selected ───────── */}
      <AnimatePresence mode="wait">
        {selectedArtist && (artistAlbumsMap[selectedArtist.slug]?.length ?? 0) > 0 && (
          <motion.section
            key={selectedArtist.slug}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="max-w-6xl mx-auto px-6 pb-8"
          >
            {/* Header row */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-hero-blue/40">
                <ArtistAvatar src={selectedArtist.avatar} name={selectedArtist.name} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-hero-blue/70 font-semibold">Discography</p>
                <p className="text-base font-black text-white leading-tight">{selectedArtist.name}</p>
              </div>
              <span className="text-xs text-white/25 font-semibold tabular-nums">
                {artistAlbumsMap[selectedArtist.slug].length} album{artistAlbumsMap[selectedArtist.slug].length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Horizontal scrolling album row */}
            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {(artistAlbumsMap[selectedArtist.slug] ?? []).map((album, idx) => {
                const isActive = selectedPlaylist.url === album.url;
                const isLatest = idx === 0;
                const cleanTitle = album.title.replace(/\s+by\s+.+$/i, '').trim();
                return (
                  <motion.button
                    key={album.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.22 }}
                    onClick={() => {
                      if (isActive) return;
                      setIsInsertingDisc(true);
                      setTimeout(() => {
                        setPlaylistUrl(album.url);
                        setSelectedPlaylist(album);
                        setIsReady(false);
                        setIsInsertingDisc(false);
                      }, 400);
                    }}
                    className="group flex-shrink-0 w-[148px] text-left outline-none"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {/* Artwork square */}
                    <div className={`relative w-full aspect-square rounded-xl overflow-hidden mb-2.5 transition-all duration-300 ${
                      isActive
                        ? 'ring-2 ring-hero-blue ring-offset-2 ring-offset-black shadow-xl shadow-hero-blue/30'
                        : 'ring-1 ring-white/10 group-hover:ring-hero-blue/50'
                    }`}>
                      {album.artwork ? (
                        <Image
                          src={album.artwork}
                          alt={cleanTitle}
                          fill
                          sizes="148px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(album.id)}`} />
                      )}

                      {/* Active tint */}
                      {isActive && (
                        <div className="absolute inset-0 bg-hero-blue/20" />
                      )}

                      {/* Playing indicator */}
                      {isActive && isPlaying && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 backdrop-blur-sm">
                          <Disc3 className="w-4 h-4 text-hero-blue vinyl-spin" />
                        </div>
                      )}

                      {/* Hover play overlay */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="w-12 h-12 rounded-full bg-hero-blue shadow-xl flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Latest badge */}
                      {isLatest && (
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-hero-blue text-white px-1.5 py-0.5 rounded-md shadow">
                            Latest
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text below artwork */}
                    <p className={`text-xs font-bold leading-tight line-clamp-2 mb-0.5 transition-colors ${
                      isActive ? 'text-hero-blue' : 'text-white/90 group-hover:text-white'
                    }`}>
                      {cleanTitle}
                    </p>
                    <p className="text-[10px] text-white/30 tabular-nums">
                      {isActive && isPlaying
                        ? '▶ Now Playing'
                        : album.trackCount > 0
                          ? `${album.trackCount} tracks`
                          : 'Album'}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── PLAYER + CATALOGUE ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* Player column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Now Playing header */}
            <div className="flex items-center gap-3 mb-4 min-w-0">
              {/* Album art thumbnail */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                {selectedPlaylist.artwork ? (
                  <Image src={selectedPlaylist.artwork} alt={selectedPlaylist.title} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)} flex items-center justify-center`}>
                    <Music className="w-5 h-5 text-white/30" />
                  </div>
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {selectedArtist && (
                    <span className="text-[11px] font-bold text-hero-blue uppercase tracking-wider truncate">
                      {selectedArtist.name}
                    </span>
                  )}
                  {!selectedArtist && (
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">AOA Records</span>
                  )}
                  {isPlaying && (
                    <Disc3 className="w-3 h-3 text-hero-blue vinyl-spin flex-shrink-0" />
                  )}
                </div>
                <p className="text-base font-black text-white leading-tight truncate">
                  {selectedPlaylist.title.replace(/\s+by\s+.+$/i, '').trim()}
                </p>
                {nowPlaying && (
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    ♪ {nowPlaying.title}
                  </p>
                )}
              </div>

              {/* Open on SoundCloud */}
              <a
                href={selectedPlaylist.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open on SoundCloud"
                className="flex-shrink-0 flex items-center gap-1.5 text-orange-400 hover:text-orange-300 transition-colors text-xs font-semibold"
              >
                <SiSoundcloud className="w-5 h-5" />
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Player card */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/8">
              {selectedPlaylist.artwork ? (
                <div className="absolute inset-0">
                  <Image src={selectedPlaylist.artwork} alt="" fill className="object-cover scale-110" />
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
                </div>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)}`}>
                  <div className="absolute inset-0 bg-black/75" />
                </div>
              )}

              {/* Vinyl insertion overlay */}
              <AnimatePresence>
                {isInsertingDisc && (
                  <motion.div
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="relative w-24 h-24">
                      <div className="w-full h-full rounded-full border-4 border-hero-blue bg-black vinyl-groove vinyl-spin flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black border-2 border-hero-blue" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-hero-blue pulse-glow" />
                    </div>
                    <p className="text-xs text-hero-blue font-semibold uppercase tracking-widest">
                      {selectedArtist ? `Loading ${selectedArtist.name}` : 'Loading…'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SoundCloud iframe — full height, no redundant info bar */}
              <div className="relative z-10 p-3" style={{ height: '420px' }}>
                <iframe
                  ref={iframeRef}
                  title="SoundCloud Player"
                  width="100%"
                  height="100%"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={playerSrc}
                  className="w-full h-full rounded-xl overflow-hidden"
                />
              </div>
            </div>
          </motion.div>

          {/* Sidebar — Tracks / Releases tabs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-4 bg-white/4 rounded-xl p-1">
              <button
                onClick={() => setSidebarTab('queue')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  sidebarTab === 'queue'
                    ? 'bg-hero-blue text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Tracks
                {allTracks.length > 0 && (
                  <span className={`text-[10px] font-mono tabular-nums ${sidebarTab === 'queue' ? 'text-white/70' : 'text-white/25'}`}>
                    {allTracks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('releases')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  sidebarTab === 'releases'
                    ? 'bg-hero-blue text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Disc3 className="w-3.5 h-3.5" />
                Releases
                <span className={`text-[10px] font-mono tabular-nums ${sidebarTab === 'releases' ? 'text-white/70' : 'text-white/25'}`}>
                  {displayPlaylists.length}
                </span>
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {sidebarTab === 'queue' ? (
                <motion.div
                  key="queue"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {allTracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <Disc3 className="w-8 h-8 text-white/15" />
                      <p className="text-sm text-white/30 font-semibold">Tap play to load tracks</p>
                      <p className="text-xs text-white/20">Tracks appear here once the player starts</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                      {allTracks.map((track, idx) => {
                        const isCurrent = nowPlaying?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className={`group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 ${
                              isCurrent
                                ? 'bg-hero-blue/10 border border-hero-blue/20'
                                : 'border border-transparent hover:bg-white/4'
                            }`}
                          >
                            <div className="w-6 flex-shrink-0 text-center">
                              {isCurrent ? (
                                <Disc3 className="w-3.5 h-3.5 text-hero-blue vinyl-spin mx-auto" />
                              ) : (
                                <span className="text-[10px] text-white/20 font-mono tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                              )}
                            </div>
                            {/* Track art */}
                            {track.artwork && (
                              <div className="relative w-8 h-8 rounded flex-shrink-0 overflow-hidden">
                                <Image src={track.artwork} alt={track.title} fill sizes="32px" className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate leading-tight ${isCurrent ? 'text-hero-blue' : 'text-white/80'}`}>
                                {track.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="releases"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-1 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                    {displayPlaylists.map((playlist, index) => {
                      const isSelected = selectedPlaylist.id === playlist.id;
                      const cleanTitle = playlist.title.replace(/\s+by\s+.+$/i, '').trim();
                      const byArtist = playlist.title.match(/\bby\s+(.+)$/i)?.[1] ?? '';
                      return (
                        <button
                          key={playlist.id}
                          onClick={() => {
                            if (isSelected) return;
                            setSelectedArtist(null);
                            setIsInsertingDisc(true);
                            setTimeout(() => {
                              setSelectedPlaylist(playlist);
                              setPlaylistUrl(playlist.url);
                              setIsReady(false);
                              setIsInsertingDisc(false);
                            }, 500);
                          }}
                          className={`group w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-200 text-left ${
                            isSelected
                              ? 'bg-hero-blue/10 border border-hero-blue/25'
                              : 'border border-transparent hover:bg-white/4 hover:border-white/8'
                          }`}
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            {playlist.artwork ? (
                              <Image src={playlist.artwork} alt={cleanTitle} fill sizes="40px" className="object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${getAlbumArtwork(playlist.id)}`} />
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Disc3 className="w-3.5 h-3.5 text-hero-blue vinyl-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate leading-tight ${isSelected ? 'text-hero-blue' : 'text-white/90'}`}>
                              {cleanTitle}
                            </p>
                            <p className="text-[11px] text-white/30 truncate mt-0.5">
                              {byArtist || (playlist.trackCount > 0 ? `${playlist.trackCount} tracks` : 'AOA Records')}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <span className="text-xs font-black text-hero-blue">▶</span>
                            ) : (
                              <span className="text-[10px] text-white/20 group-hover:text-white/40 font-mono tabular-nums">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ── TOP HITS ─────────────────────────────────────────────── */}
      {stats?.topTracks && stats.topTracks.length > 0 && (
        <section className="border-t border-white/8 py-14">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">Charts</p>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase">Top Hits</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {stats.topTracks.map((track, index) => (
                  <a key={track.id} href={track.permalink_url} target="_blank" rel="noopener noreferrer" className="group relative">
                    <div className={`absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${
                      index === 0 ? 'bg-hero-blue text-white' : index === 1 ? 'bg-white/80 text-black' : index === 2 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 border border-white/20'
                    }`}>
                      {index < 3 ? <Trophy className="w-3 h-3" /> : index + 1}
                    </div>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-white/25 transition-colors mb-2">
                      {track.artwork_url ? (
                        <Image src={track.artwork_url.replace('-large', '-t500x500')} alt={track.title} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-400" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><Music className="w-8 h-8 text-white/20" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-hero-blue transition-colors mb-1">{track.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                      <span className="flex items-center gap-1"><Play className="w-2 h-2" />{formatNumber(track.playback_count)}</span>
                      <span className="flex items-center gap-1"><Heart className="w-2 h-2" />{formatNumber(track.likes_count)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── SPOTIFY ─────────────────────────────────────────────── */}
      <section className="border-t border-white/8 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-1">Streaming</p>
                <h2 className="text-2xl font-black text-white">Also on <span style={{ color: '#1DB954' }}>Spotify</span></h2>
              </div>
              <a
                href="https://open.spotify.com/artist/5jWLGE3ZNCyau37PWs20AP?si=oQJnFe1vTGubcBK7_1K1zg"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold px-4 py-2.5 rounded-full text-sm text-black flex-shrink-0 hover:scale-105 transition-transform"
                style={{ backgroundColor: '#1DB954' }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Follow on Spotify
              </a>
            </div>
            <iframe ref={spotifyIframeRef} style={{ borderRadius: '12px' }} src="https://open.spotify.com/embed/artist/5jWLGE3ZNCyau37PWs20AP?utm_source=generator&si=1db3da1165cb4d14" width="100%" height="352" frameBorder="0" allowFullScreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
          </motion.div>
        </div>
      </section>

      {/* ── JOIN THE LABEL ────────────────────────────────────────── */}
      <section className="border-t border-white/8 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-3">For Ape Holders</p>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase leading-tight mb-4">
                  Drop a Record <span className="text-hero-blue">On AOA.</span>
                </h2>
                <p className="text-white/45 max-w-lg text-sm leading-relaxed mb-8">
                  Any Apes On Ape holder can publish under AOA Records. Release singles, EPs, and albums with your Ape as the face of the project.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { step: '01', title: 'Verify your Ape', body: 'Connect the wallet holding your AOA NFT to access Studio.' },
                    { step: '02', title: 'Release on SoundCloud', body: 'Upload your project to the AOA account or your own profile.' },
                    { step: '03', title: 'Submit to the label', body: 'Use the Submit Track form to send your SoundCloud link for review.' },
                  ].map(({ step, title, body }) => (
                    <div key={step} className="border border-white/8 rounded-xl p-4 bg-white/[0.02] hover:border-white/15 transition-colors">
                      <div className="text-xs font-mono text-hero-blue/50 mb-2 tracking-widest">{step}</div>
                      <div className="text-sm font-bold text-white mb-1">{title}</div>
                      <p className="text-xs text-white/35 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 md:w-52 md:pt-12">
                <a href="/music/create" className="flex items-center justify-between gap-2 bg-hero-blue text-white font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-hero-blue-light transition-colors group">
                  <span>Start Session</span><ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a href="/music/submit" className="flex items-center justify-between gap-2 border border-hero-blue/40 text-hero-blue font-semibold px-5 py-3.5 rounded-xl text-xs uppercase tracking-widest hover:border-hero-blue hover:bg-hero-blue/10 transition-colors group">
                  <span>Submit Track</span><ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a href="https://discord.gg/gVmqW6SExU" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 border border-white/12 text-white/50 font-semibold px-5 py-3.5 rounded-xl text-xs uppercase tracking-widest hover:border-white/25 hover:text-white transition-colors group">
                  <span>Discord</span><ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
