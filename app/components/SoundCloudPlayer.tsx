'use client';

import React, { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import {
  Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Music2, ChevronDown, ChevronUp, Shuffle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── SoundCloud Widget API types ──────────────────────────────────────────────
/** SoundCloud may omit `title` for tail tracks until metadata resolves */
type SCTrack = {
  title?: string;
  artwork_url?: string;
  user?: { username?: string; permalink?: string };
  permalink_url?: string;
};

interface SCWidget {
  bind(event: string, listener: () => void): void;
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  isPaused(cb: (paused: boolean) => void): void;
  setVolume(vol: number): void;
  getVolume(cb: (vol: number) => void): void;
  getCurrentSound(cb: (sound: SCTrack | null) => void): void;
  getSounds(cb: (sounds: SCTrack[]) => void): void;
  getCurrentSoundIndex(cb: (idx: number) => void): void;
  load(url: string, opts?: object): void;
  getPosition(cb: (pos: number) => void): void;
  getDuration(cb: (dur: number) => void): void;
  seekTo(ms: number): void;
}

interface SC {
  Widget: {
    (iframe: HTMLIFrameElement): SCWidget;
    Events: { READY: string; PLAY: string; PAUSE: string; FINISH: string; PLAY_PROGRESS: string };
  };
}

declare global { interface Window { SC?: SC } }

// ─── Constants ────────────────────────────────────────────────────────────────
const FALLBACK_URL = 'https://soundcloud.com/apesonape';

// ─── Component ────────────────────────────────────────────────────────────────
export default function SoundCloudPlayer() {
  const iframeRef   = useRef<HTMLIFrameElement | null>(null);
  const widgetRef   = useRef<SCWidget | null>(null);
  // Ensures PLAY/PAUSE/FINISH are only bound once even when widget.load() re-fires READY
  const boundRef    = useRef(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmuteRef   = useRef(true);
  /** Avoid infinite re-render loops if SoundCloud fires READY / getSounds many times in one tick */
  const lastTrackListSigRef = useRef<string>('');
  const lastPollSigRef = useRef<string>('');

  const [playlistUrl,   setPlaylistUrl]   = useState('');
  const [albumTitle,    setAlbumTitle]    = useState('AOA Radio');
  const [isReady,       setIsReady]       = useState(false);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTitle,  setCurrentTitle]  = useState('');
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [totalTracks,   setTotalTracks]   = useState(0);
  const [volume,        setVolume]        = useState(50);
  const [isMuted,       setIsMuted]       = useState(true);
  const [progress,      setProgress]      = useState(0);
  const [duration,      setDuration]      = useState(0);
  const [position,      setPosition]      = useState(0);
  const [expanded,      setExpanded]      = useState(false);
  const [trackList,     setTrackList]     = useState<string[]>([]);
  const [artwork,       setArtwork]       = useState<string>('');

  // ── Step 1: fetch latest playlist URL from our API ────────────────────────
  useEffect(() => {
    fetch('/api/soundcloud/latest-playlist')
      .then(r => r.json())
      .then(data => {
        setPlaylistUrl(data.url  || FALLBACK_URL);
        setAlbumTitle(data.title || 'AOA Radio');
      })
      .catch(() => setPlaylistUrl(FALLBACK_URL));
  }, []);

  // ── Step 2: build iframe src once URL is known ────────────────────────────
  // URLSearchParams will correctly encode the url param (no manual encodeURIComponent needed)
  const playerSrc = useMemo(() => {
    if (!playlistUrl) return '';
    const p = new URLSearchParams({
      url:           playlistUrl,
      auto_play:     'true',
      hide_related:  'true',
      show_comments: 'false',
      show_user:     'true',
      show_reposts:  'false',
      show_teaser:   'false',
      visual:        'false',
    });
    return `https://w.soundcloud.com/player/?${p.toString()}`;
  }, [playlistUrl]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function fmt(ms: number) {
    if (!ms) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function startPoll() {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const w = widgetRef.current;
      if (!w) return;
      w.getPosition(pos => {
        w.getDuration(dur => {
          const progressPct = dur > 0 ? (pos / dur) * 100 : 0;
          const sig = `${pos}|${dur}|${progressPct}`;
          if (sig === lastPollSigRef.current) return;
          lastPollSigRef.current = sig;
          // Defer to next macrotask so nested widget callbacks can't synchronously exceed React's update depth
          queueMicrotask(() => {
            setPosition(pos);
            setDuration(dur);
            setProgress(progressPct);
          });
        });
      });
      w.getCurrentSoundIndex(idx => {
        queueMicrotask(() => {
          setCurrentIndex(prev => (prev === idx ? prev : idx));
        });
      });
    }, 1000);
  }

  function stopPoll() {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }

  function formatTrackLabel(sound: SCTrack, index: number): string {
    const raw = sound.title?.trim();
    if (raw) return raw;
    const artist = sound.user?.username?.trim();
    if (artist) return `${artist} (track ${index + 1})`;
    try {
      if (sound.permalink_url) {
        const seg = sound.permalink_url.split('/').filter(Boolean).pop();
        if (seg && /^[a-z0-9_-]+$/i.test(seg)) {
          return seg.replace(/-/g, ' ');
        }
      }
    } catch {
      /* ignore */
    }
    return `Track ${index + 1}`;
  }

  function refreshTrackListFromWidget() {
    const widget = widgetRef.current;
    if (!widget) return;
    widget.getSounds((sounds: SCTrack[]) => {
      if (!Array.isArray(sounds)) return;
      const labels = sounds.map((s, i) => formatTrackLabel(s, i));
      const sig = `${sounds.length}\0${labels.join('\0')}`;
      if (sig === lastTrackListSigRef.current) return;
      lastTrackListSigRef.current = sig;
      startTransition(() => {
        setTotalTracks(sounds.length);
        setTrackList(labels);
      });
    });
  }

  // ── Step 3: initialise widget once playerSrc is ready ────────────────────
  useEffect(() => {
    if (!playerSrc) return;
    let cancelled = false;

    function initWidget() {
      if (!iframeRef.current || !window.SC?.Widget) return;
      // Capture Events locally so TypeScript knows it's non-null inside callbacks
      const SCWidget = window.SC.Widget;
      const Events = SCWidget.Events;
      const widget = SCWidget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(Events.READY, () => {
        if (cancelled) return;
        setIsReady(true);

        // Defer list refresh so bursts of READY events don't synchronously stack setState past React's limit
        queueMicrotask(() => {
          if (cancelled) return;
          refreshTrackListFromWidget();
        });

        // ⚠ Only run first-time setup once — calling widget.load() inside READY
        //   would re-fire READY and create an infinite loop.
        if (boundRef.current) return;
        boundRef.current = true;

        widget.setVolume(0); // start muted; user unmutes on first interaction

        widget.bind(Events.PLAY, () => {
          if (cancelled) return;
          setIsPlaying(true);
          widget.getCurrentSoundIndex((idx) => {
            setCurrentIndex(idx);
            widget.getCurrentSound((s) => {
              const t = s?.title?.trim();
              setCurrentTitle(t || formatTrackLabel(s || {}, idx));
              if (s?.artwork_url) {
                setArtwork(s.artwork_url.replace('-large', '-t200x200'));
              }
            });
          });
          startPoll();
          // Titles for later playlist items often populate after playback touches them
          setTimeout(() => {
            if (!cancelled) refreshTrackListFromWidget();
          }, 350);
        });

        widget.bind(Events.PAUSE, () => {
          if (cancelled) return;
          setIsPlaying(false);
          stopPoll();
        });

        widget.bind(Events.FINISH, () => {
          if (cancelled) return;
          // SoundCloud auto-advances in a playlist; nothing extra needed
        });

        // Try to autoplay (browsers may block, but worth trying)
        setTimeout(() => {
          widget.isPaused(paused => { if (paused) { try { widget.play(); } catch { /* blocked */ } } });
        }, 800);

        // Unmute + play on first user interaction (bypasses autoplay block)
        const resumeOnInteraction = () => {
          if (!unmuteRef.current) return;
          unmuteRef.current = false;
          setIsMuted(false);
          try {
            widget.setVolume(50);
            widget.isPaused(paused => { if (paused) widget.play(); });
          } catch { /* ignore */ }
        };
        window.addEventListener('pointerdown', resumeOnInteraction, { once: true });
        window.addEventListener('keydown',     resumeOnInteraction, { once: true });
        window.addEventListener('touchstart',  resumeOnInteraction, { once: true });
      });
    }

    // Load the SoundCloud Widget API script (once)
    if (window.SC && typeof window.SC.Widget === 'function') {
      initWidget();
    } else {
      const existing = document.querySelector('script[data-sc-widget]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', initWidget);
      } else {
        const s = document.createElement('script');
        s.src = 'https://w.soundcloud.com/player/api.js';
        s.async = true;
        s.defer = true;
        s.setAttribute('data-sc-widget', 'true');
        s.addEventListener('load', initWidget);
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      stopPoll();
      boundRef.current = false;
      widgetRef.current = null;
      lastTrackListSigRef.current = '';
      lastPollSigRef.current = '';
    };
  }, [playerSrc]);

  // Re-fetch track metadata when opening the list — SoundCloud lazy-loads titles for long playlists
  useEffect(() => {
    if (!expanded || !isReady) return;
    refreshTrackListFromWidget();
    const delays = [200, 600, 1500, 3000];
    const timers = delays.map((ms) =>
      setTimeout(() => {
        refreshTrackListFromWidget();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [expanded, isReady]);

  // ── Controls ──────────────────────────────────────────────────────────────
  function togglePlay() {
    const w = widgetRef.current;
    if (!w) return;
    // Unmute on first manual play
    if (unmuteRef.current) {
      unmuteRef.current = false;
      setIsMuted(false);
      w.setVolume(volume || 50);
    }
    w.isPaused(paused => paused ? w.play() : w.pause());
  }

  function nextTrack() {
    const w = widgetRef.current;
    if (!w) return;
    w.next();
    setTimeout(() => w.getCurrentSound(s => setCurrentTitle(s?.title || '')), 400);
  }

  function prevTrack() {
    const w = widgetRef.current;
    if (!w) return;
    w.prev();
    setTimeout(() => w.getCurrentSound(s => setCurrentTitle(s?.title || '')), 400);
  }

  function shuffle() {
    const w = widgetRef.current;
    if (!w || !totalTracks) return;
    const idx = Math.floor(Math.random() * totalTracks);
    w.load(playlistUrl, {
      auto_play: true, visual: false, show_comments: false,
      hide_related: true, show_reposts: false, show_user: true,
      show_teaser: false, start_track: idx,
    });
  }

  function jumpToTrack(idx: number) {
    const w = widgetRef.current;
    if (!w) return;
    w.load(playlistUrl, {
      auto_play: true, visual: false, show_comments: false,
      hide_related: true, show_reposts: false, show_user: true,
      show_teaser: false, start_track: idx,
    });
    setExpanded(false);
  }

  function handleVolume(val: number) {
    setVolume(val);
    setIsMuted(val === 0);
    widgetRef.current?.setVolume(val);
    if (val > 0 && unmuteRef.current) { unmuteRef.current = false; }
  }

  function toggleMute() {
    const w = widgetRef.current;
    if (!w) return;
    if (isMuted) {
      const v = volume || 50;
      setIsMuted(false); setVolume(v); w.setVolume(v);
    } else {
      setIsMuted(true); w.setVolume(0);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!widgetRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    widgetRef.current.seekTo(ratio * duration);
  }

  const displayTitle = currentTitle || albumTitle;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden iframe */}
      {playerSrc && (
        <iframe
          ref={iframeRef}
          title="AOA Radio"
          src={playerSrc}
          allow="autoplay; encrypted-media"
          style={{ width: 0, height: 0, opacity: 0, pointerEvents: 'none', position: 'absolute', zIndex: -1 }}
        />
      )}

      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-4 right-4 z-50"
        style={{ width: 'min(340px, calc(100vw - 32px))' }}
      >
        <div
          className={`rounded-2xl overflow-hidden transition-shadow duration-500 ${
            isPlaying
              ? 'shadow-[0_8px_40px_rgba(0,84,249,0.35),0_2px_12px_rgba(0,0,0,0.6)]'
              : 'shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
          }`}
          style={{
            background: 'linear-gradient(160deg, rgba(10,14,30,0.97) 0%, rgba(6,8,20,0.97) 100%)',
            backdropFilter: 'blur(24px)',
            border: isPlaying ? '1px solid rgba(0,84,249,0.45)' : '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {/* ── Playlist drawer ──────────────────────────────────── */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-3 pt-3 pb-2 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {/* Playlist header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold truncate">{albumTitle}</span>
                    {totalTracks > 0 && (
                      <span className="text-[10px] text-white/20 font-mono tabular-nums ml-2 flex-shrink-0">{totalTracks} tracks</span>
                    )}
                  </div>
                  {trackList.length === 0 ? (
                    <div className="flex items-center gap-2 px-2 py-3">
                      <div className="w-3 h-3 rounded-full border-2 border-hero-blue/40 border-t-hero-blue animate-spin" />
                      <p className="text-[11px] text-white/30">Loading tracks…</p>
                    </div>
                  ) : (
                    trackList.map((track, i) => (
                      <button
                        key={i}
                        onClick={() => jumpToTrack(i)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 group ${
                          i === currentIndex
                            ? 'bg-hero-blue/18 text-hero-blue'
                            : 'text-white/45 hover:bg-white/6 hover:text-white'
                        }`}
                      >
                        <div className="w-4 flex-shrink-0 flex items-center justify-center">
                          {i === currentIndex && isPlaying ? (
                            <span className="flex gap-[2px] items-end h-3">
                              <span className="w-[3px] bg-hero-blue rounded-sm animate-[musicBar1_0.8s_ease-in-out_infinite]" style={{ height: '50%' }} />
                              <span className="w-[3px] bg-hero-blue rounded-sm animate-[musicBar2_0.8s_ease-in-out_infinite_0.2s]" style={{ height: '100%' }} />
                              <span className="w-[3px] bg-hero-blue rounded-sm animate-[musicBar1_0.8s_ease-in-out_infinite_0.4s]" style={{ height: '70%' }} />
                            </span>
                          ) : (
                            <span className={`text-[10px] font-mono tabular-nums ${i === currentIndex ? 'text-hero-blue' : 'text-white/20'}`}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <span className="truncate font-semibold">{track}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Volume + shuffle row */}
                <div className="px-3 py-2 flex items-center gap-2 border-t border-white/8">
                  <button onClick={toggleMute} className="p-1 text-white/35 hover:text-white transition-colors flex-shrink-0">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range" min={0} max={100} value={isMuted ? 0 : volume}
                    onChange={e => handleVolume(parseInt(e.target.value))}
                    className="flex-1 h-1 accent-hero-blue cursor-pointer"
                  />
                  <button
                    onClick={shuffle}
                    disabled={!isReady || !totalTracks}
                    className="p-1 text-white/30 hover:text-hero-blue transition-colors disabled:opacity-20 flex-shrink-0"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Progress bar ─────────────────────────────────────── */}
          <div
            className="relative h-[3px] bg-white/8 cursor-pointer group"
            onClick={handleSeek}
          >
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-hero-blue to-hero-blue-light"
              style={{ width: `${progress}%`, transition: 'width 0.5s linear' }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* ── Main bar ─────────────────────────────────────────── */}
          <div className="px-3 py-2.5 flex items-center gap-3">
            {/* Album art / icon */}
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isPlaying ? 'ring-1 ring-hero-blue/60 shadow-lg shadow-hero-blue/25' : 'ring-1 ring-white/10'
              }`}>
                {artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artwork} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-hero-blue/20 flex items-center justify-center">
                    <Music2 className={`w-4 h-4 text-hero-blue ${isPlaying ? 'animate-pulse' : ''}`} />
                  </div>
                )}
              </div>
              {/* Live dot */}
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0a0e1e]" />
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-snug">
                {displayTitle}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-white/35 font-mono tabular-nums">
                  {duration > 0 ? `${fmt(position)} / ${fmt(duration)}` : isReady ? 'Ready' : 'Loading…'}
                </span>
                {totalTracks > 0 && (
                  <>
                    <span className="text-white/15 text-[10px]">·</span>
                    <span className="text-[10px] text-white/25 tabular-nums">{currentIndex + 1}/{totalTracks}</span>
                  </>
                )}
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={prevTrack}
                disabled={!isReady}
                className="p-1.5 rounded-lg hover:bg-white/8 transition-colors disabled:opacity-25 text-white/50 hover:text-white"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!isReady}
                className="w-9 h-9 rounded-xl bg-hero-blue hover:bg-hero-blue-light active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 shadow-lg shadow-hero-blue/30"
              >
                {isPlaying
                  ? <Pause className="w-4 h-4 text-white" />
                  : <Play className="w-4 h-4 text-white ml-0.5" />
                }
              </button>
              <button
                onClick={nextTrack}
                disabled={!isReady}
                className="p-1.5 rounded-lg hover:bg-white/8 transition-colors disabled:opacity-25 text-white/50 hover:text-white"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Volume (desktop only) + expand */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-0.5">
                <button onClick={toggleMute} className="p-1.5 text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/8">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range" min={0} max={100} value={isMuted ? 0 : volume}
                  onChange={e => handleVolume(parseInt(e.target.value))}
                  className="w-14 h-1 accent-hero-blue cursor-pointer"
                />
              </div>
              <button
                onClick={() => setExpanded(e => !e)}
                className={`p-1.5 rounded-lg transition-all ${
                  expanded
                    ? 'bg-hero-blue/20 text-hero-blue'
                    : 'text-white/25 hover:text-white hover:bg-white/8'
                }`}
                title={expanded ? 'Collapse' : 'Show playlist'}
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Keyframes for the music bar equaliser animation */}
      <style>{`
        @keyframes musicBar1 {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes musicBar2 {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }
      `}</style>
    </>
  );
}
