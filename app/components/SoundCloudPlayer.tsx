'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Music2, ChevronDown, ChevronUp, Shuffle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── SoundCloud Widget API types ──────────────────────────────────────────────
type SCTrack = { title?: string };

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
        setPosition(pos);
        w.getDuration(dur => {
          setDuration(dur);
          setProgress(dur > 0 ? (pos / dur) * 100 : 0);
        });
      });
      w.getCurrentSoundIndex(idx => setCurrentIndex(idx));
    }, 1000);
  }

  function stopPoll() {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
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

        // Refresh track list every time READY fires (including after widget.load() calls)
        widget.getSounds((sounds: SCTrack[]) => {
          if (!Array.isArray(sounds)) return;
          setTotalTracks(sounds.length);
          setTrackList(sounds.map(s => s.title || 'Unknown Track'));
        });

        // ⚠ Only run first-time setup once — calling widget.load() inside READY
        //   would re-fire READY and create an infinite loop.
        if (boundRef.current) return;
        boundRef.current = true;

        widget.setVolume(0); // start muted; user unmutes on first interaction

        widget.bind(Events.PLAY, () => {
          if (cancelled) return;
          setIsPlaying(true);
          widget.getCurrentSound(s => setCurrentTitle(s?.title || ''));
          widget.getCurrentSoundIndex(idx => setCurrentIndex(idx));
          startPoll();
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

    return () => { cancelled = true; stopPoll(); };
  }, [playerSrc]);

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
      {/* Hidden iframe — only mounted once we have a playlist URL */}
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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-4 right-4 z-50"
        style={{ maxWidth: expanded ? '340px' : '320px' }}
      >
        <div
          className="rounded-2xl border border-hero-blue/25 shadow-2xl shadow-hero-blue/10 overflow-hidden"
          style={{ background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(20px)' }}
        >
          {/* Playlist panel */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-white/10 overflow-hidden"
              >
                <div className="p-3 max-h-52 overflow-y-auto">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold px-2 mb-1">
                    {albumTitle}
                  </div>
                  {trackList.length === 0 && (
                    <p className="text-[11px] text-white/30 px-2 py-2">Loading tracks…</p>
                  )}
                  {trackList.map((track, i) => (
                    <button
                      key={i}
                      onClick={() => jumpToTrack(i)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2
                        ${i === currentIndex
                          ? 'bg-hero-blue/20 text-hero-blue font-bold'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      {i === currentIndex && isPlaying
                        ? <span className="w-3 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-hero-blue animate-pulse" /></span>
                        : <span className="w-3 text-white/25 text-[10px]">{i + 1}</span>
                      }
                      <span className="truncate">{track}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seek bar */}
          <div className="h-1 bg-white/10 cursor-pointer relative group" onClick={handleSeek}>
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-hero-blue to-accent-cyan"
              style={{ width: `${progress}%`, transition: 'width 0.5s linear' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 pointer-events-none"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Main controls row */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hero-blue/15 flex items-center justify-center flex-shrink-0 relative">
              <Music2 className="w-5 h-5 text-hero-blue" />
              {isPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate leading-tight">{displayTitle}</div>
              <div className="text-[10px] text-white/35 mt-0.5">
                {duration > 0
                  ? `${fmt(position)} / ${fmt(duration)}`
                  : `AOA Records · Track ${currentIndex + 1}${totalTracks ? ` of ${totalTracks}` : ''}`
                }
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={prevTrack}
                disabled={!isReady}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <SkipBack className="w-3.5 h-3.5 text-white/60" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!isReady}
                className="w-9 h-9 rounded-xl bg-hero-blue hover:bg-hero-blue-light transition-colors flex items-center justify-center disabled:opacity-40 shadow-lg shadow-hero-blue/30"
              >
                {isPlaying
                  ? <Pause className="w-4 h-4 text-white" />
                  : <Play  className="w-4 h-4 text-white ml-0.5" />
                }
              </button>
              <button
                onClick={nextTrack}
                disabled={!isReady}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <SkipForward className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Volume + shuffle + expand */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <button onClick={toggleMute} className="p-1 text-white/40 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range" min={0} max={100} value={isMuted ? 0 : volume}
              onChange={e => handleVolume(parseInt(e.target.value))}
              className="flex-1 h-1 accent-hero-blue cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            />
            <button
              onClick={shuffle}
              disabled={!isReady || !totalTracks}
              className="p-1 text-white/30 hover:text-hero-blue transition-colors disabled:opacity-20"
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 text-white/30 hover:text-hero-blue transition-colors"
              title={expanded ? 'Collapse' : 'Show playlist'}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
