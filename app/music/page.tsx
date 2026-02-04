'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Play, Music, Heart, Repeat2, ListMusic, Disc3, Trophy } from 'lucide-react';
import { SiSoundcloud } from 'react-icons/si';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Image from 'next/image';

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

declare global {
  interface Window {
    SC?: SoundCloud;
  }
}

// Featured albums from apesonape SoundCloud
const AVAILABLE_PLAYLISTS: Playlist[] = [
  {
    id: 'visionary',
    title: 'Visionary',
    url: 'https://soundcloud.com/apesonape/sets/visionary-by-smokethatdank',
    trackCount: 8,
  },
  {
    id: 'teeth-in-the-vines',
    title: 'Teeth In The Vines',
    url: 'https://soundcloud.com/apesonape/sets/teeth-in-the-vines-by-notime',
    trackCount: 6,
  },
  {
    id: 'press-start',
    title: 'Press Start',
    url: 'https://soundcloud.com/apesonape/sets/press-start-by-2real2x',
    trackCount: 7,
  },
  {
    id: 'fubar',
    title: 'FUBAR',
    url: 'https://soundcloud.com/apesonape/sets/fubar-by-smokethatdank',
    trackCount: 5,
  },
  {
    id: 'brutal-dynasty',
    title: 'Brutal Dynasty',
    url: 'https://soundcloud.com/apesonape/sets/brutal-dynasty-by-simian-maw',
    trackCount: 9,
  },
  {
    id: 'unwrapped',
    title: 'Unwrapped But Not Finished',
    url: 'https://soundcloud.com/apesonape/sets/unwrapped-but-not-finished-by-2real2x',
    trackCount: 8,
  },
  {
    id: 'warm-up-vol-i',
    title: 'Warm Up Vol. I',
    url: 'https://soundcloud.com/apesonape/sets/warm-up-vol-i-by-zen',
    trackCount: 10,
  },
  {
    id: 'el-juego',
    title: 'El Juego',
    url: 'https://soundcloud.com/apesonape/sets/el-juego-by-zen',
    trackCount: 6,
  },
  {
    id: 'sinatra-season-2',
    title: 'Sinatra Season 2',
    url: 'https://soundcloud.com/apesonape/sets/sinatra-season-2-by-dr-dibs',
    trackCount: 12,
  },
  {
    id: 'saint-dank',
    title: 'Saint Dank',
    url: 'https://soundcloud.com/apesonape/sets/saint-dank-by-smokethatdank',
    trackCount: 8,
  },
];

// Generate album artwork gradient fallback from playlist ID
function getAlbumArtwork(playlistId: string): string {
  // Generate a consistent gradient based on playlist ID
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
  
  // Use hash of playlistId to get consistent gradient
  const hash = Array.from(playlistId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

const DEFAULT_PLAYLIST_URL = AVAILABLE_PLAYLISTS[3].url; // FUBAR by smokethatdank - fallback

export default function RadioPage() {
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<SoundCloudStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_PLAYLIST_URL);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>(AVAILABLE_PLAYLISTS[3]);
  const [playlistsWithArtwork, setPlaylistsWithArtwork] = useState<Playlist[]>([]);
  const [isInsertingDisc, setIsInsertingDisc] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const hasAutoTriedRef = useRef(false);
  const unmuteOnFirstInteractionRef = useRef(true);

  // Build iframe src with Widget parameters
  const playerSrc = React.useMemo(() => {
    const params = new URLSearchParams({
      url: playlistUrl,
      color: 'ff5500',
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

  // Convert SoundCloud track to our Track format
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


  // Fetch SoundCloud stats
  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        const response = await fetch('/api/soundcloud/stats');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setStatsError(`Failed to load stats (${response.status})`);
        }
      } catch (error) {
        setStatsError('Network error loading stats');
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch albums dynamically from SoundCloud API
  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const response = await fetch('/api/soundcloud/playlists');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.playlists && Array.isArray(data.playlists)) {
            // Convert API playlists to our Playlist format
            const fetchedPlaylists: Playlist[] = data.playlists.map((p: any) => ({
              id: String(p.id),
              title: p.title || 'Untitled Album',
              url: p.permalink || p.permalink_url || '',
              trackCount: p.trackCount || p.track_count || 0,
              artwork: p.artwork || undefined,
            }));
            
            setPlaylistsWithArtwork(fetchedPlaylists);
            
            // Update selected playlist if it's the default (FUBAR)
            const fubarPlaylist = fetchedPlaylists.find(p => 
              p.url.includes('fubar') || p.title.toLowerCase().includes('fubar')
            );
            if (fubarPlaylist) {
              setSelectedPlaylist(fubarPlaylist);
              setPlaylistUrl(fubarPlaylist.url);
            } else if (fetchedPlaylists.length > 0) {
              // Fallback to first playlist
              setSelectedPlaylist(fetchedPlaylists[0]);
              setPlaylistUrl(fetchedPlaylists[0].url);
            }
          }
        }
      } catch (error) {
        // Error fetching playlists
      }
    }
    fetchPlaylists();
  }, []);

  // Track all available tracks from the playlist
  const trackAllSounds = (sounds: SoundCloudTrack[]) => {
    const tracks = sounds.map(convertTrack);
    setAllTracks(tracks);
  };

  // Initialize SoundCloud Widget
  useEffect(() => {
    let cancelled = false;

    function initWidget() {
      if (!iframeRef.current || !window.SC || !window.SC.Widget) return;
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        if (cancelled) return;
        setIsReady(true);
        widget.setVolume(0); // Start muted for autoplay

        // Load all tracks and build queue
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

        // Fallback autoplay attempt
        if (!hasAutoTriedRef.current) {
          hasAutoTriedRef.current = true;
          setTimeout(() => {
            widget.isPaused((paused: boolean) => {
              if (paused) {
                try { widget.play(); } catch {}
              }
            });
          }, 600);
        }
      });

      widget.bind(window.SC.Widget.Events.PLAY, () => {
        if (cancelled) return;
        setIsPlaying(true);
        
        // Update now playing
        widget.getCurrentSound((sound: SoundCloudTrack | null) => {
          if (sound) {
            setNowPlaying(convertTrack(sound));
          }
        });

        // Update available tracks
        widget.getSounds((sounds: SoundCloudTrack[]) => {
          if (Array.isArray(sounds) && sounds.length > 0) {
            trackAllSounds(sounds);
          }
        });
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        if (cancelled) return;
        setIsPlaying(false);
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        if (cancelled) return;
        // Auto-advance handled by SoundCloud widget
      });

      // Unmute on first interaction
      const resumeFromGesture = () => {
        if (!unmuteOnFirstInteractionRef.current) return;
        unmuteOnFirstInteractionRef.current = false;
        try {
          widget.setVolume(volume);
          widget.isPaused((paused: boolean) => {
            if (paused) widget.play();
          });
        } catch {}
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
      if (sc && typeof sc.Widget === 'function') {
        initWidget();
        return;
      }
      const existing = document.querySelector('script[data-sc-widget]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', initWidget);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-sc-widget', 'true');
      script.addEventListener('load', initWidget);
      document.body.appendChild(script);
    }

    ensureScript();
    return () => {
      cancelled = true;
    };
  }, [volume, playlistUrl]);


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen jukebox-bg" style={{ color: 'var(--foreground)' }}>
      <Nav />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-ape-gold/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-hero-blue/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ape-gold/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="relative">
                <Disc3 className="w-16 h-16 text-ape-gold vinyl-spin" />
                <div className="absolute inset-0 w-16 h-16 rounded-full pulse-glow"></div>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold neon-text text-ape-gold">
                JUKEBOX
              </h1>
              <div className="flex items-center gap-2 text-sm tracking-widest text-ape-gold/80">
                <span className="w-8 h-0.5 bg-ape-gold/50"></span>
                <span>APES ON APE MUSIC</span>
                <span className="w-8 h-0.5 bg-ape-gold/50"></span>
              </div>
            </div>
            <p className="text-lg max-w-3xl mx-auto text-center leading-relaxed" style={{ color: 'var(--ape-gray)' }}>
              Select an album to insert into the jukebox
            </p>
          </motion.div>

          {/* SoundCloud Stats */}
          {statsLoading && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-8 neon-border">
                <div className="flex flex-col items-center gap-4">
                  <Disc3 className="w-12 h-12 text-ape-gold vinyl-spin" />
                  <div className="text-center">
                    <div className="text-lg font-black text-ape-gold uppercase tracking-wider animate-pulse">Loading Stats...</div>
                    <div className="text-xs text-ape-gold/60 mt-2 uppercase tracking-widest">Syncing with SoundCloud</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {statsError && !stats && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-6 border-2 border-red-500/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400 mb-2">⚠️ {statsError}</div>
                  <div className="text-sm text-gray-400">Check browser console for details</div>
                </div>
              </div>
            </motion.div>
          )}
          
          {stats && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-6 neon-border relative overflow-hidden">
                {/* Animated background lines */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-ape-gold to-transparent"></div>
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-ape-gold to-transparent"></div>
                </div>
                
                <div className="relative flex items-center justify-center gap-2 mb-6">
                  <SiSoundcloud className="w-6 h-6 text-orange-500 animate-pulse" />
                  <h3 className="text-xl font-bold neon-text text-ape-gold tracking-wider">
                    LIVE STATS
                  </h3>
                </div>
                <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="group bg-gradient-to-br from-black/40 to-black/20 rounded-lg p-4 text-center border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105">
                    <Heart className="w-7 h-7 mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stats.followers)}
                    </div>
                    <div className="text-xs font-semibold tracking-wide text-ape-gold/70 uppercase">
                      Followers
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-black/40 to-black/20 rounded-lg p-4 text-center border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105">
                    <Music className="w-7 h-7 mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stats.tracks)}
                    </div>
                    <div className="text-xs font-semibold tracking-wide text-ape-gold/70 uppercase">
                      Tracks
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-black/40 to-black/20 rounded-lg p-4 text-center border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105">
                    <ListMusic className="w-7 h-7 mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stats.playlists)}
                    </div>
                    <div className="text-xs font-semibold tracking-wide text-ape-gold/70 uppercase">
                      Playlists
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-black/40 to-black/20 rounded-lg p-4 text-center border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105">
                    <Heart className="w-7 h-7 mx-auto mb-2 text-red-400 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stats.likes)}
                    </div>
                    <div className="text-xs font-semibold tracking-wide text-ape-gold/70 uppercase">
                      Likes
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-black/40 to-black/20 rounded-lg p-4 text-center border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105">
                    <Repeat2 className="w-7 h-7 mx-auto mb-2 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stats.reposts)}
                    </div>
                    <div className="text-xs font-semibold tracking-wide text-ape-gold/70 uppercase">
                      Reposts
                    </div>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-black/40 to-black/20 rounded-lg p-4 text-center border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105">
                    <Disc3 className="w-7 h-7 mx-auto mb-2 text-ape-gold group-hover:rotate-180 transition-transform duration-500" />
                    <div className="text-3xl font-black text-white mb-1">
                      {formatNumber(stats.totalPlays)}
                    </div>
                    <div className="text-xs font-semibold tracking-wide text-ape-gold/70 uppercase">
                      Total Plays
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[minmax(400px,_2fr)_3fr] gap-8">
            {/* Album Selector - Left Column (wider) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-5 neon-border sticky top-24 h-[700px] flex flex-col relative overflow-hidden">
                {/* Jukebox Panel Accent Lines */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ape-gold to-transparent opacity-50"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ape-gold to-transparent opacity-50"></div>
                
                <div className="flex items-center justify-between mb-5 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Disc3 className="w-5 h-5 text-ape-gold" />
                      <h3 className="font-black text-ape-gold uppercase tracking-wider text-sm">Select Disc</h3>
                    </div>
                    <div className="text-xs text-ape-gold/60 uppercase tracking-widest">Choose Album</div>
                  </div>
                  <a
                    href="https://soundcloud.com/apesonape"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 transition-all hover:scale-110 transform"
                  >
                    <SiSoundcloud className="w-6 h-6" />
                  </a>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  {playlistsWithArtwork.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Disc3 className="w-16 h-16 text-ape-gold/30 vinyl-spin" />
                      <p className="text-sm text-ape-gold/60 uppercase tracking-widest">Loading Albums...</p>
                    </div>
                  ) : (
                    playlistsWithArtwork.map((playlist, index) => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        setIsInsertingDisc(true);
                        setTimeout(() => {
                          setSelectedPlaylist(playlist);
                          setPlaylistUrl(playlist.url);
                          setIsReady(false);
                          setIsInsertingDisc(false);
                        }, 800);
                      }}
                      className={`group relative rounded-xl overflow-hidden transition-all duration-300 w-full text-left ${
                        selectedPlaylist.id === playlist.id
                          ? 'ring-2 ring-ape-gold shadow-lg shadow-ape-gold/30'
                          : 'hover:ring-1 hover:ring-ape-gold/50 hover:shadow-md hover:shadow-ape-gold/10'
                      }`}
                    >
                      {/* Selection Number Badge */}
                      <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        selectedPlaylist.id === playlist.id
                          ? 'bg-ape-gold text-black'
                          : 'bg-black/70 text-ape-gold border border-ape-gold/30'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className={`flex gap-4 p-3 ${
                        selectedPlaylist.id === playlist.id 
                          ? 'bg-gradient-to-r from-ape-gold/20 to-transparent' 
                          : 'bg-black/30'
                      }`}>
                        {/* Vinyl Disc Visual - Back to larger size */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-full overflow-hidden bg-black border-2 border-ape-gold/30 group-hover:border-ape-gold/60 transition-all">
                          {/* Vinyl grooves effect */}
                          <div className="absolute inset-0 vinyl-groove"></div>
                          
                          {/* Album artwork in center */}
                          <div className="absolute inset-3 rounded-full overflow-hidden">
                            {playlist.artwork ? (
                              <Image
                                src={playlist.artwork}
                                alt={playlist.title}
                                fill
                                sizes="56px"
                                className={`object-cover ${selectedPlaylist.id === playlist.id ? 'vinyl-spin' : ''}`}
                              />
                            ) : (
                              <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(playlist.id)}`}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Music className="w-4 h-4 text-white/50" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Center hole */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-black border-2 border-ape-gold/50"></div>
                          </div>
                          
                          {/* Playing indicator */}
                          {selectedPlaylist.id === playlist.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-full rounded-full border-2 border-ape-gold pulse-glow"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Album Info - Allow text wrapping */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
                          <h4 className={`font-black text-sm uppercase tracking-wide transition-colors leading-snug break-words ${
                            selectedPlaylist.id === playlist.id ? 'text-ape-gold' : 'text-white group-hover:text-ape-gold'
                          }`}>
                            {playlist.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-ape-gold/60 uppercase tracking-widest">
                              {selectedPlaylist.id === playlist.id ? 'Now Playing' : 'Available'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-ape-gold/20 flex-shrink-0">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs text-ape-gold/60 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-ape-gold animate-pulse"></span>
                      <span>Jukebox Active</span>
                    </div>
                    <p className="text-xs text-center" style={{ color: 'var(--ape-gray)' }}>
                      Powered by{' '}
                      <a
                        href="https://soundcloud.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                      >
                        SoundCloud
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Now Playing Section - Right Column */}
            <div>
              <div className="h-[700px]">
              <motion.div
                className="rounded-2xl overflow-hidden neon-border relative h-full flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {/* Album Artwork Background */}
                {selectedPlaylist.artwork && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={selectedPlaylist.artwork}
                      alt={selectedPlaylist.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* Blur and darken overlay with animated gradient */}
                    <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ape-gold/10 via-transparent to-transparent opacity-50"></div>
                  </div>
                )}
                {!selectedPlaylist.artwork && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)}`}>
                    <div className="absolute inset-0 backdrop-blur-3xl bg-black/80"></div>
                  </div>
                )}
                
                <div className="relative z-10 p-8 flex flex-col h-full">
                  {/* Jukebox Display Header */}
                  <div className="flex items-center justify-between mb-8 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Disc3 className={`w-8 h-8 text-ape-gold ${isPlaying ? 'vinyl-spin' : ''}`} />
                        {isPlaying && <div className="absolute inset-0 rounded-full pulse-glow"></div>}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-ape-gold neon-text uppercase tracking-wider">Now Playing</h2>
                        <div className="text-xs text-ape-gold/60 uppercase tracking-widest mt-1">Jukebox Active</div>
                      </div>
                    </div>
                  </div>

                  {/* Vinyl Disc Insertion Animation */}
                  {isInsertingDisc && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                      <div className="disc-insert">
                        <div className="relative w-48 h-48">
                          {/* Spinning vinyl */}
                          <div className="absolute inset-0 rounded-full bg-black border-4 border-ape-gold vinyl-groove vinyl-spin">
                            <div className="absolute inset-8 rounded-full overflow-hidden">
                              {selectedPlaylist.artwork ? (
                                <Image
                                  src={selectedPlaylist.artwork}
                                  alt={selectedPlaylist.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)}`}></div>
                              )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-black border-2 border-ape-gold"></div>
                            </div>
                          </div>
                          <div className="absolute inset-0 rounded-full border-4 border-ape-gold pulse-glow"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Album Info */}
                  <div className="mb-8 text-center flex-shrink-0">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">{selectedPlaylist.title}</h3>
                    <p className="text-sm font-semibold text-ape-gold/80 uppercase tracking-widest">
                      Apes On Ape Records
                    </p>
                  </div>

                  {/* SoundCloud Widget Player */}
                  <div className="rounded-2xl overflow-hidden border-2 border-ape-gold/40 shadow-2xl flex-1 min-h-0 relative">
                    {/* Decorative corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ape-gold z-10"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ape-gold z-10"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ape-gold z-10"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ape-gold z-10"></div>
                    
                    <iframe
                      ref={iframeRef}
                      title="SoundCloud Player"
                      width="100%"
                      height="100%"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={playerSrc}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Jukebox-styled SoundCloud Link */}
                  <div className="flex-shrink-0 mt-6">
                    <a
                      href={selectedPlaylist.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl transition-all duration-300 w-full font-black uppercase tracking-wider text-sm overflow-hidden transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50"
                    >
                      {/* Animated background shine */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <SiSoundcloud className="w-6 h-6 relative z-10" />
                      <span className="relative z-10">Listen on SoundCloud</span>
                    </a>
                  </div>
                </div>
              </motion.div>
              </div>
            </div>
          </div>

          {/* Top Tracks Ranking */}
          {stats && stats.topTracks && stats.topTracks.length > 0 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-6 neon-border relative overflow-hidden">
                {/* Decorative accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ape-gold to-transparent opacity-50"></div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <Music className="w-7 h-7 text-ape-gold" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-ape-gold uppercase tracking-wider neon-text">Top Hits</h3>
                    <p className="text-xs text-ape-gold/60 uppercase tracking-widest">Most played tracks</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {stats.topTracks.slice(0, 10).map((track, index) => (
                    <a
                      key={track.id}
                      href={track.permalink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-gradient-to-br from-black/40 to-black/20 rounded-xl p-4 border border-ape-gold/20 hover:border-ape-gold hover:shadow-lg hover:shadow-ape-gold/20 transition-all duration-300 transform hover:scale-105"
                    >
                      {/* Rank Badge with Trophy for Top 3 */}
                      <div className="absolute -top-2 -left-2 z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-ape-gold'
                        }`}>
                          {index < 3 ? (
                            <Trophy className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-black">{index + 1}</span>
                          )}
                        </div>
                        {index < 3 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border border-ape-gold flex items-center justify-center">
                            <span className="text-[10px] font-black text-ape-gold">{index + 1}</span>
                          </div>
                        )}
                      </div>

                      {/* Track Artwork */}
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-black">
                        {track.artwork_url ? (
                          <Image
                            src={track.artwork_url.replace('-large', '-t500x500')}
                            alt={track.title}
                            fill
                            sizes="200px"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <Music className="w-12 h-12 text-white/30" />
                          </div>
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                          <Play className="w-10 h-10 text-ape-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-ape-gold" />
                        </div>
                      </div>

                      {/* Track Info */}
                      <h4 className="font-black text-sm text-white mb-2 line-clamp-2 group-hover:text-ape-gold transition-colors leading-tight">
                        {track.title}
                      </h4>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-blue-400">
                          <Play className="w-3 h-3" />
                          <span className="font-semibold">{formatNumber(track.playback_count)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <Heart className="w-3 h-3" />
                          <span className="font-semibold">{formatNumber(track.likes_count)}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
