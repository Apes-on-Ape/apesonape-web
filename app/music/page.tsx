'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Play, Music, Heart, Repeat2, ListMusic, Disc3 } from 'lucide-react';
import { SiSoundcloud } from 'react-icons/si';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

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

interface SoundCloudStats {
  followers: number;
  tracks: number;
  playlists: number;
  likes: number;
  reposts: number;
  totalPlays: number;
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

// Generate album artwork URL from SoundCloud playlist
function getAlbumArtwork(playlistId: string): string {
  // Using SoundCloud's visual player to extract artwork
  // Each album gets a unique color/gradient as fallback
  const colors: Record<string, string> = {
    'visionary': 'from-purple-500 to-pink-500',
    'teeth-in-the-vines': 'from-green-500 to-emerald-500',
    'press-start': 'from-blue-500 to-cyan-500',
    'fubar': 'from-red-500 to-orange-500',
    'brutal-dynasty': 'from-gray-700 to-gray-900',
    'unwrapped': 'from-yellow-500 to-amber-500',
    'warm-up-vol-i': 'from-orange-500 to-red-500',
    'el-juego': 'from-indigo-500 to-purple-500',
    'sinatra-season-2': 'from-rose-500 to-pink-500',
    'saint-dank': 'from-cyan-500 to-blue-500',
  };
  return colors[playlistId] || 'from-gray-600 to-gray-800';
}

const DEFAULT_PLAYLIST_URL = AVAILABLE_PLAYLISTS[0].url;

export default function RadioPage() {
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<SoundCloudStats | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_PLAYLIST_URL);
  const [selectedPlaylist, setSelectedPlaylist] = useState(AVAILABLE_PLAYLISTS[0]);
  const [scUser, setScUser] = useState<{ id: number; username: string; avatar: string; permalink: string } | null>(null);
  const [playlistsWithArtwork, setPlaylistsWithArtwork] = useState<Playlist[]>(AVAILABLE_PLAYLISTS);
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const hasAutoTriedRef = useRef(false);
  const unmuteOnFirstInteractionRef = useRef(true);
  
  const searchParams = useSearchParams();

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

  // Check for SoundCloud user in cookies
  useEffect(() => {
    const scUserCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sc_user='));
    
    if (scUserCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(scUserCookie.split('=')[1]));
        setScUser(userData);
      } catch (error) {
        console.error('Error parsing SoundCloud user cookie:', error);
      }
    }

    // Check for auth status in URL
    const authStatus = searchParams?.get('auth');
    if (authStatus === 'success') {
      // Refresh the page to load user data
      window.history.replaceState({}, '', '/music');
      window.location.reload();
    }
  }, [searchParams]);

  // Fetch SoundCloud stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/soundcloud/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching SoundCloud stats:', error);
      }
    }
    fetchStats();
  }, []);

  // Fetch album artwork from SoundCloud
  useEffect(() => {
    async function fetchPlaylistArtwork() {
      try {
        const response = await fetch('/api/soundcloud/playlists');
        if (response.ok) {
          const data = await response.json();
          if (data.playlists && Array.isArray(data.playlists)) {
            // Match fetched playlists with our AVAILABLE_PLAYLISTS
            const updatedPlaylists = AVAILABLE_PLAYLISTS.map(playlist => {
              const foundPlaylist = data.playlists.find((p: any) => 
                playlist.url.includes(p.id) || p.permalink?.includes(playlist.id)
              );
              return {
                ...playlist,
                artwork: foundPlaylist?.artwork || undefined,
              };
            });
            setPlaylistsWithArtwork(updatedPlaylists);
          }
        }
      } catch (error) {
        console.error('Error fetching playlist artwork:', error);
      }
    }
    fetchPlaylistArtwork();
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
    <div className="min-h-screen" style={{ color: 'var(--foreground)', background: 'var(--background)' }}>
      <Nav />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="w-10 h-10 text-ape-gold animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-ape-gold via-yellow-400 to-ape-gold bg-clip-text text-transparent">
                Radio
              </h1>
            </div>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--ape-gray)' }}>
              Featured albums from Apes On Ape artists on SoundCloud
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              {/* SoundCloud Sign In */}
              {scUser ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-ape-gold/10 rounded-lg border border-ape-gold/30">
                  {scUser.avatar && (
                    <div className="w-6 h-6 rounded-full overflow-hidden relative">
                      <Image src={scUser.avatar} alt={scUser.username} fill className="object-cover" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-ape-gold">
                    {scUser.username}
                  </span>
                </div>
              ) : (
                <a
                  href="/api/auth/soundcloud"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  <SiSoundcloud className="w-4 h-4" />
                  <span className="text-sm font-semibold">Connect with SoundCloud</span>
                </a>
              )}
            </div>
          </motion.div>

          {/* SoundCloud Stats */}
          {stats && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-6 border border-ape-gold/30">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <SiSoundcloud className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-ape-gold">
                    Apes On Ape on SoundCloud
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-black/30 rounded-lg p-4 text-center border border-white/5 hover:border-ape-gold/30 transition-all">
                    <Heart className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(stats.followers)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ape-gray)' }}>
                      Followers
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 text-center border border-white/5 hover:border-ape-gold/30 transition-all">
                    <Music className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(stats.tracks)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ape-gray)' }}>
                      Tracks
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 text-center border border-white/5 hover:border-ape-gold/30 transition-all">
                    <ListMusic className="w-6 h-6 mx-auto mb-2 text-green-400" />
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(stats.playlists)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ape-gray)' }}>
                      Playlists
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 text-center border border-white/5 hover:border-ape-gold/30 transition-all">
                    <Heart className="w-6 h-6 mx-auto mb-2 text-red-400" />
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(stats.likes)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ape-gray)' }}>
                      Likes
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 text-center border border-white/5 hover:border-ape-gold/30 transition-all">
                    <Repeat2 className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(stats.reposts)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ape-gray)' }}>
                      Reposts
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 text-center border border-white/5 hover:border-ape-gold/30 transition-all">
                    <Disc3 className="w-6 h-6 mx-auto mb-2 text-ape-gold" />
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(stats.totalPlays)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ape-gray)' }}>
                      Total Plays
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Album Selector - Left Column (1/3) */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <div className="glass-dark rounded-xl p-6 border border-white/10 sticky top-24 h-[700px] flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-5 h-5 text-ape-gold" />
                    <h3 className="font-semibold text-ape-gold">Featured Albums</h3>
                  </div>
                  <a
                    href="https://soundcloud.com/apesonape"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <SiSoundcloud className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {playlistsWithArtwork.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        setSelectedPlaylist(playlist);
                        setPlaylistUrl(playlist.url);
                        setIsReady(false);
                      }}
                      className={`group rounded-lg overflow-hidden transition-all duration-300 w-full text-left ${
                        selectedPlaylist.id === playlist.id
                          ? 'ring-2 ring-ape-gold shadow-lg shadow-ape-gold/20'
                          : 'hover:ring-1 hover:ring-ape-gold/50'
                      }`}
                    >
                      <div className="flex gap-3 p-2">
                        {/* Album Artwork - Smaller thumbnail */}
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                          {playlist.artwork ? (
                            <>
                              <Image
                                src={playlist.artwork}
                                alt={playlist.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </>
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(playlist.id)}`}>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Music className="w-6 h-6 text-white/30" />
                              </div>
                            </div>
                          )}
                          
                          {/* Play indicator */}
                          {selectedPlaylist.id === playlist.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Play className="w-4 h-4 text-ape-gold fill-ape-gold" />
                            </div>
                          )}
                        </div>
                        
                        {/* Album Title */}
                        <div className="flex-1 min-w-0 flex items-center">
                          <h4 className={`font-semibold text-sm line-clamp-2 ${
                            selectedPlaylist.id === playlist.id ? 'text-ape-gold' : 'text-white'
                          }`}>
                            {playlist.title}
                          </h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
                  <p className="text-xs text-center" style={{ color: 'var(--ape-gray)' }}>
                    Powered by{' '}
                    <a
                      href="https://soundcloud.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline"
                    >
                      SoundCloud
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Now Playing Section - Right Column (2/3) */}
            <div className="lg:col-span-2">
              <div className="h-[700px]">
              <motion.div
                className="rounded-2xl overflow-hidden border-2 border-ape-gold/50 relative h-full flex flex-col"
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
                    {/* Blur and darken overlay */}
                    <div className="absolute inset-0 backdrop-blur-3xl bg-black/70"></div>
                  </div>
                )}
                {!selectedPlaylist.artwork && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${getAlbumArtwork(selectedPlaylist.id)}`}>
                    <div className="absolute inset-0 backdrop-blur-3xl bg-black/70"></div>
                  </div>
                )}
                
                <div className="relative z-10 p-6 flex flex-col h-full">
                  {/* Section Title */}
                  <div className="flex items-center gap-2 mb-6 flex-shrink-0">
                    <Music className="w-6 h-6 text-ape-gold" />
                    <h2 className="text-2xl font-bold text-ape-gold">Now Playing</h2>
                  </div>

                  {/* Selected Album Info */}
                  <div className="mb-6 text-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-white mb-2">{selectedPlaylist.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--ape-gray)' }}>
                      From Apes On Ape
                    </p>
                  </div>

                  {/* SoundCloud Widget Player */}
                  <div className="rounded-xl overflow-hidden border border-ape-gold/30 mb-6 shadow-2xl flex-1 min-h-0">
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

                  {/* SoundCloud Link */}
                  <div className="flex-shrink-0">
                    <a
                      href={selectedPlaylist.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors w-full"
                    >
                      <SiSoundcloud className="w-5 h-5" />
                      <span>Open on SoundCloud</span>
                    </a>
                  </div>
                </div>
              </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
