'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music, Heart, Disc3, Trophy, ExternalLink, ChevronRight, Users } from 'lucide-react';
import { SiSoundcloud } from 'react-icons/si';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { ARTISTS } from '@/app/data/artists';

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
  { id: 'visionary', title: 'Visionary', url: 'https://soundcloud.com/apesonape/sets/visionary-by-smokethatdank', trackCount: 8 },
  { id: 'teeth-in-the-vines', title: 'Teeth In The Vines', url: 'https://soundcloud.com/apesonape/sets/teeth-in-the-vines-by-notime', trackCount: 6 },
  { id: 'press-start', title: 'Press Start', url: 'https://soundcloud.com/apesonape/sets/press-start-by-2real2x', trackCount: 7 },
  { id: 'fubar', title: 'FUBAR', url: 'https://soundcloud.com/apesonape/sets/fubar-by-smokethatdank', trackCount: 5 },
  { id: 'brutal-dynasty', title: 'Brutal Dynasty', url: 'https://soundcloud.com/apesonape/sets/brutal-dynasty-by-simian-maw', trackCount: 9 },
  { id: 'unwrapped', title: 'Unwrapped But Not Finished', url: 'https://soundcloud.com/apesonape/sets/unwrapped-but-not-finished-by-2real2x', trackCount: 8 },
  { id: 'warm-up-vol-i', title: 'Warm Up Vol. I', url: 'https://soundcloud.com/apesonape/sets/warm-up-vol-i-by-zen', trackCount: 10 },
  { id: 'el-juego', title: 'El Juego', url: 'https://soundcloud.com/apesonape/sets/el-juego-by-zen', trackCount: 6 },
  { id: 'sinatra-season-2', title: 'Sinatra Season 2', url: 'https://soundcloud.com/apesonape/sets/sinatra-season-2-by-dr-dibs', trackCount: 12 },
  { id: 'saint-dank', title: 'Saint Dank', url: 'https://soundcloud.com/apesonape/sets/saint-dank-by-smokethatdank', trackCount: 8 },
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

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const hasAutoTriedRef = useRef(false);
  const unmuteOnFirstInteractionRef = useRef(true);

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
        setIsPlaying(true);
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24">
        {/* Blurred background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-hero-blue/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-hero-blue/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Label tag */}
            <div className="inline-flex items-center gap-2 border border-hero-blue/30 bg-hero-blue/5 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-hero-blue animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-blue">AOA Records</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.9] tracking-tight text-white mb-8">
              Make Music<br />
              <span className="text-hero-blue">With Your</span><br />
              Ape.
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-xl mb-10 leading-relaxed font-light">
              A label for Apes on Apechain. Hold an Ape, drop a record,
              and plug your sound into the AOA catalogue.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/music/create"
                className="inline-flex items-center gap-2.5 bg-hero-blue text-white font-bold px-7 py-4 rounded-xl text-sm uppercase tracking-widest hover:bg-hero-blue-light transition-colors"
              >
                <Music className="w-4 h-4" />
                Start a Session
              </a>
              <a
                href="https://soundcloud.com/apesonape"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 border border-white/15 text-white/70 font-semibold px-7 py-4 rounded-xl text-sm uppercase tracking-widest hover:border-white/40 hover:text-white transition-colors"
              >
                <SiSoundcloud className="w-4 h-4 text-orange-400" />
                SoundCloud
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-8 md:gap-16">
            {statsLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-white/5 rounded animate-pulse mt-1" />
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
              <>
                <StatItem value={String(displayPlaylists.length)} label="Releases" />
                <StatItem value="—" label="Followers" />
              </>
            )}

            {/* SC live dot */}
            <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-white/30 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live on SoundCloud
            </div>
          </div>
        </div>
      </section>

      {/* ── PLAYER + CATALOGUE ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* Player Column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Now Playing header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-1">Now Playing</p>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {selectedPlaylist.title}
                </h2>
              </div>
              <a
                href={selectedPlaylist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-semibold"
              >
                <SiSoundcloud className="w-5 h-5" />
                <span className="hidden sm:inline">Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Album art + player */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/8 group">
              {/* Artwork blur bg */}
              {selectedPlaylist.artwork && (
                <div className="absolute inset-0">
                  <Image src={selectedPlaylist.artwork} alt="" fill className="object-cover scale-110" />
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
                </div>
              )}
              {!selectedPlaylist.artwork && (
                <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)}`}>
                  <div className="absolute inset-0 bg-black/75" />
                </div>
              )}

              {/* Vinyl insertion overlay */}
              <AnimatePresence>
                {isInsertingDisc && (
                  <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="relative w-32 h-32">
                      <div className="w-full h-full rounded-full border-4 border-hero-blue bg-black vinyl-groove vinyl-spin flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black border-2 border-hero-blue" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-hero-blue pulse-glow" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Album art thumbnail + playing indicator */}
              <div className="relative z-10 p-6 pb-0 flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                  {selectedPlaylist.artwork ? (
                    <Image src={selectedPlaylist.artwork} alt={selectedPlaylist.title} fill className="object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)} flex items-center justify-center`}>
                      <Music className="w-6 h-6 text-white/40" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Disc3 className={`w-4 h-4 text-hero-blue ${isPlaying ? 'vinyl-spin' : ''}`} />
                    <span className="text-xs text-hero-blue uppercase tracking-widest font-semibold">
                      {isPlaying ? 'Playing' : 'Paused'}
                    </span>
                  </div>
                  {nowPlaying && (
                    <p className="text-sm text-white/70 mt-0.5 truncate max-w-[240px]">{nowPlaying.title}</p>
                  )}
                </div>
              </div>

              {/* SoundCloud iframe */}
              <div className="relative z-10 p-4 pt-4" style={{ height: '400px' }}>
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

          {/* Catalogue sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-1">Catalogue</p>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">All Releases</h2>
              </div>
              <span className="text-xs text-white/30 font-semibold">{displayPlaylists.length} albums</span>
            </div>

            <div className="space-y-1.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {displayPlaylists.map((playlist, index) => {
                const isSelected = selectedPlaylist.id === playlist.id;
                return (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      if (isSelected) return;
                      setIsInsertingDisc(true);
                      setTimeout(() => {
                        setSelectedPlaylist(playlist);
                        setPlaylistUrl(playlist.url);
                        setIsReady(false);
                        setIsInsertingDisc(false);
                      }, 600);
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
                      isSelected
                        ? 'bg-hero-blue/10 border border-hero-blue/30'
                        : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Artwork */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-white/10">
                      {playlist.artwork ? (
                        <Image src={playlist.artwork} alt={playlist.title} fill sizes="44px" className="object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getAlbumArtwork(playlist.id)} flex items-center justify-center`}>
                          <Music className="w-3 h-3 text-white/40" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-hero-blue/20 flex items-center justify-center">
                          <Disc3 className="w-4 h-4 text-hero-blue vinyl-spin" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate leading-tight ${isSelected ? 'text-hero-blue' : 'text-white group-hover:text-white'}`}>
                        {playlist.title}
                      </p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {playlist.trackCount > 0 ? `${playlist.trackCount} tracks` : 'AOA Records'}
                      </p>
                    </div>

                    {/* Index / play icon */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <span className="text-xs font-black text-hero-blue">▶</span>
                      ) : (
                        <span className="text-xs text-white/20 group-hover:text-white/40 font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TOP HITS ─────────────────────────────────────────────── */}
      {stats?.topTracks && stats.topTracks.length > 0 && (
        <section className="border-t border-white/8 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">Charts</p>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight">
                  Top Hits
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {stats.topTracks.map((track, index) => (
                  <a
                    key={track.id}
                    href={track.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                  >
                    {/* Rank badge */}
                    <div className={`absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${
                      index === 0 ? 'bg-hero-blue text-white' :
                      index === 1 ? 'bg-white/80 text-black' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-white/10 text-white/60 border border-white/20'
                    }`}>
                      {index < 3 ? <Trophy className="w-3.5 h-3.5" /> : index + 1}
                    </div>

                    {/* Artwork */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-white/25 transition-colors mb-3">
                      {track.artwork_url ? (
                        <Image
                          src={track.artwork_url.replace('-large', '-t500x500')}
                          alt={track.title}
                          fill
                          sizes="200px"
                          className="object-cover group-hover:scale-105 transition-transform duration-400"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center">
                          <Music className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <Play className="w-9 h-9 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-hero-blue transition-colors mb-1.5">
                      {track.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-white/35">
                      <span className="flex items-center gap-1">
                        <Play className="w-2.5 h-2.5" />
                        {formatNumber(track.playback_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" />
                        {formatNumber(track.likes_count)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── JOIN THE LABEL ────────────────────────────────────────── */}
      <section className="border-t border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid md:grid-cols-[1fr_auto] gap-10 items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-3">For Ape Holders</p>
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight mb-6">
                  Drop a Record<br />
                  <span className="text-hero-blue">On AOA.</span>
                </h2>
                <p className="text-white/50 max-w-lg leading-relaxed mb-10">
                  Any Apes On Ape holder can publish under AOA Records.
                  Release singles, EPs, and albums with your Ape as the face of the project.
                </p>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      step: '01',
                      title: 'Verify your Ape',
                      body: 'Connect the wallet holding your AOA NFT to access Studio and Wardrobe.',
                    },
                    {
                      step: '02',
                      title: 'Release on SoundCloud',
                      body: 'Upload your project to the AOA account or share from your own profile.',
                    },
                    {
                      step: '03',
                      title: 'Submit to the label',
                      body: 'Use the Submit Track form to send your SoundCloud link directly for review.',
                    },
                  ].map(({ step, title, body }) => (
                    <div key={step} className="border border-white/8 rounded-2xl p-5 bg-white/[0.02] hover:border-white/15 transition-colors">
                      <div className="text-xs font-mono text-hero-blue/60 mb-3 tracking-widest">{step}</div>
                      <div className="text-sm font-bold text-white mb-2">{title}</div>
                      <p className="text-xs text-white/40 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA block */}
              <div className="flex flex-col gap-3 md:w-56 md:pt-16">
                <a
                  href="/music/create"
                  className="flex items-center justify-between gap-2 bg-hero-blue text-white font-bold px-5 py-4 rounded-xl text-sm uppercase tracking-widest hover:bg-hero-blue-light transition-colors group"
                >
                  <span>Start Session</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="/music/submit"
                  className="flex items-center justify-between gap-2 border border-hero-blue/40 text-hero-blue font-semibold px-5 py-4 rounded-xl text-sm uppercase tracking-widest hover:border-hero-blue hover:bg-hero-blue/10 transition-colors group"
                >
                  <span>Submit Track</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="https://discord.gg/gVmqW6SExU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 border border-white/15 text-white/60 font-semibold px-5 py-4 rounded-xl text-sm uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors group"
                >
                  <span>Discord</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MEET THE ARTISTS ──────────────────────────────────────── */}
      <section className="py-20 border-t border-white/8">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 border border-hero-blue/30 bg-hero-blue/5 rounded-full px-4 py-1.5 mb-5">
              <Users className="w-3.5 h-3.5 text-hero-blue" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-blue">The Community</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Meet the Apes
            </h2>
            <p className="text-white/40 mt-3 max-w-xl">
              The artists, creators, and builders making noise on Apechain.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ARTISTS.map((artist, i) => (
              <motion.div
                key={artist.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link
                  href={`/artist/${artist.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02] hover:border-hero-blue/40 hover:bg-hero-blue/5 transition-all duration-300"
                >
                  {/* Avatar */}
                  <div className="relative aspect-square overflow-hidden bg-white/5">
                    {artist.avatar ? (
                      <ArtistAvatar src={artist.avatar} name={artist.name} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Music className="w-10 h-10 text-hero-blue/30" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-hero-blue/0 group-hover:bg-hero-blue/10 transition-colors duration-300" />
                    {/* Ape ID badge */}
                    {artist.apeId && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-hero-blue">
                        #{artist.apeId}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <div className="font-bold text-white text-sm truncate group-hover:text-hero-blue transition-colors">
                      {artist.name}
                    </div>
                    <div className="text-[11px] text-white/40 truncate mt-0.5">{artist.role}</div>
                    {artist.twitterUrl && (
                      <div className="text-[10px] text-white/25 mt-1 truncate">
                        @{artist.twitterUrl.split('/').pop()}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
