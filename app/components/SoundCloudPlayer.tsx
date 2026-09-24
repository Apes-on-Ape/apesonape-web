'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronUp, ExternalLink, Music2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX,
} from 'lucide-react';
import { updateMediaSession } from '@/app/components/PWAManager';
import {
  AOA_RADIO_COMMAND_EVENT,
  AOA_RADIO_PLAY_EVENT,
  AOA_RADIO_STATE_EVENT,
  isArcadeGamePath,
  type AoaRadioCommand,
  type AoaRadioStateDetail,
  type AoaRadioTrack,
} from '@/lib/aoa-radio';
import BroadcastLabel from './signal/BroadcastLabel';
import LiveIndicator from './signal/LiveIndicator';
import SignalTicker from './signal/SignalTicker';

type SCTrack = {
  id?: number;
  title?: string;
  artwork_url?: string;
  permalink_url?: string;
  duration?: number;
  user?: { username?: string };
};

interface SCWidget {
  bind(event: string, listener: () => void): void;
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  isPaused(cb: (paused: boolean) => void): void;
  setVolume(vol: number): void;
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
    Events: { READY: string; PLAY: string; PAUSE: string; FINISH: string };
  };
}

declare global {
  interface Window { SC?: SC }
}

const FALLBACK_URL = 'https://soundcloud.com/apesonape';

function fmt(ms: number) {
  if (!ms || ms < 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function artworkUrl(url?: string) {
  if (!url) return '';
  return url.replace('-large', '-t300x300');
}

function toTrack(sound: SCTrack, index: number): AoaRadioTrack {
  const title = sound.title?.trim() || `Track ${index + 1}`;
  return {
    id: sound.id != null ? String(sound.id) : `idx-${index}`,
    title,
    artist: sound.user?.username?.trim() || 'AOA Records',
    artwork: artworkUrl(sound.artwork_url),
    duration: Math.floor((sound.duration || 0) / 1000),
    permalink: sound.permalink_url || '',
  };
}

export default function SoundCloudPlayer() {
  const pathname = usePathname();
  const inGame = isArcadeGamePath(pathname);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const boundRef = useRef(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playOnReadyRef = useRef(false);
  const userStartedRef = useRef(false);
  const playlistUrlRef = useRef('');
  const volumeRef = useRef(70);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const lastTrackSigRef = useRef('');

  const [playlistUrl, setPlaylistUrl] = useState('');
  const [albumTitle, setAlbumTitle] = useState('AOA Radio');
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentArtist, setCurrentArtist] = useState('AOA Records');
  const [currentTrackId, setCurrentTrackId] = useState('');
  const [artwork, setArtwork] = useState('');
  const [tracks, setTracks] = useState<AoaRadioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [expanded, setExpanded] = useState(false);

  playlistUrlRef.current = playlistUrl;
  volumeRef.current = volume;

  const playerSrc = useMemo(() => {
    if (!playlistUrl) return '';
    const params = new URLSearchParams({
      url: playlistUrl,
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'false',
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, [playlistUrl]);

  function stopPoll() {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }

  function startPoll() {
    stopPoll();
    progressRef.current = setInterval(() => {
      const widget = widgetRef.current;
      if (!widget) return;
      widget.getPosition((pos) => {
        widget.getDuration((dur) => {
          setPosition(pos);
          setDuration(dur);
          setProgress(dur > 0 ? (pos / dur) * 100 : 0);
        });
      });
      widget.getCurrentSoundIndex((idx) => {
        setCurrentIndex((prev) => (prev === idx ? prev : idx));
      });
    }, 1000);
  }

  function rememberTracks(sounds: SCTrack[]) {
    if (!Array.isArray(sounds)) return;
    const next = sounds.map(toTrack);
    const sig = next.map((track) => `${track.id}:${track.title}`).join('|');
    if (sig === lastTrackSigRef.current) return;
    lastTrackSigRef.current = sig;
    setTracks(next);
  }

  function beginAudiblePlayback(widget: SCWidget) {
    userStartedRef.current = true;
    setIsMuted(false);
    const level = volumeRef.current || 70;
    setVolume(level);
    try {
      widget.setVolume(level);
      widget.play();
    } catch {
      /* gesture may have expired */
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/soundcloud/latest-playlist')
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setPlaylistUrl((current) => current || data.url || FALLBACK_URL);
        if (data.title) setAlbumTitle((current) => (current === 'AOA Radio' ? data.title : current));
      })
      .catch(() => {
        if (!cancelled) setPlaylistUrl((current) => current || FALLBACK_URL);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const node = dockRef.current;
    if (!node) return;
    const apply = () => {
      document.documentElement.style.setProperty('--aoa-dock-offset', `${node.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [inGame, expanded, isReady]);

  useEffect(() => {
    if (!playerSrc) return;
    let cancelled = false;

    function initWidget() {
      if (cancelled || !iframeRef.current || !window.SC?.Widget) return;
      const Widget = window.SC.Widget;
      const widget = Widget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(Widget.Events.READY, () => {
        if (cancelled) return;
        setIsReady(true);
        queueMicrotask(() => {
          if (!cancelled) widget.getSounds((sounds) => rememberTracks(sounds));
        });
        if (boundRef.current) {
          if (playOnReadyRef.current) {
            playOnReadyRef.current = false;
            beginAudiblePlayback(widget);
          }
          return;
        }
        boundRef.current = true;
        widget.setVolume(0);

        widget.bind(Widget.Events.PLAY, () => {
          if (cancelled) return;
          setIsPlaying(true);
          startPoll();
          widget.getCurrentSoundIndex((idx) => {
            setCurrentIndex(idx);
            widget.getCurrentSound((sound) => {
              const track = toTrack(sound || {}, idx);
              setCurrentTitle(track.title);
              setCurrentArtist(track.artist);
              setCurrentTrackId(track.id);
              if (track.artwork) setArtwork(track.artwork);
            });
          });
          widget.getSounds((sounds) => rememberTracks(sounds));
        });

        widget.bind(Widget.Events.PAUSE, () => {
          if (cancelled) return;
          setIsPlaying(false);
          stopPoll();
        });

        widget.bind(Widget.Events.FINISH, () => {
          if (cancelled || !userStartedRef.current) return;
          window.setTimeout(() => {
            try {
              widget.isPaused((paused) => {
                if (paused && userStartedRef.current) widget.play();
              });
            } catch {
              /* ignore */
            }
          }, 600);
        });

        if (playOnReadyRef.current) {
          playOnReadyRef.current = false;
          beginAudiblePlayback(widget);
        }
      });
    }

    if (window.SC && typeof window.SC.Widget === 'function') {
      initWidget();
    } else {
      const existing = document.querySelector('script[data-sc-widget]') as HTMLScriptElement | null;
      if (existing) existing.addEventListener('load', initWidget);
      else {
        const script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-sc-widget', 'true');
        script.addEventListener('load', initWidget);
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      stopPoll();
      boundRef.current = false;
      widgetRef.current = null;
      lastTrackSigRef.current = '';
      setIsReady(false);
      setIsPlaying(false);
    };
    // rememberTracks/startPoll close over latest setters; re-init only when the iframe source changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerSrc]);

  useEffect(() => {
    const playWidget = () => {
      const widget = widgetRef.current;
      if (!widget) {
        playOnReadyRef.current = true;
        return;
      }
      beginAudiblePlayback(widget);
    };
    const pauseWidget = () => {
      try { widgetRef.current?.pause(); } catch { /* ignore */ }
    };
    const onCommand = (event: Event) => {
      const command = (event as CustomEvent<AoaRadioCommand>).detail;
      if (!command) return;
      const widget = widgetRef.current;
      if (command.type === 'load') {
        const url = command.url?.trim();
        if (command.title) setAlbumTitle(command.title);
        if (!url) return;
        const same = url.replace(/\/+$/, '') === playlistUrlRef.current.replace(/\/+$/, '');
        if (!same) {
          playOnReadyRef.current = !!command.play;
          setPlaylistUrl(url);
          return;
        }
        if (command.play) playWidget();
        return;
      }
      if (command.type === 'toggle' || command.type === 'play') {
        if (!widget) {
          playOnReadyRef.current = true;
          return;
        }
        if (command.type === 'play') {
          playWidget();
          return;
        }
        widget.isPaused((paused) => (paused ? playWidget() : pauseWidget()));
        return;
      }
      if (!widget) return;
      if (command.type === 'pause') pauseWidget();
      if (command.type === 'next') widget.next();
      if (command.type === 'prev') widget.prev();
      if (command.type === 'volume') {
        volumeRef.current = command.value;
        setVolume(command.value);
        setIsMuted(command.value === 0);
        widget.setVolume(command.value);
      }
      if (command.type === 'seek') {
        widget.getDuration((dur) => {
          if (dur > 0) widget.seekTo(Math.max(0, Math.min(1, command.ratio)) * dur);
        });
      }
      if (command.type === 'jump') {
        const url = playlistUrlRef.current;
        if (!url) return;
        userStartedRef.current = true;
        widget.load(url, {
          auto_play: true,
          visual: false,
          show_comments: false,
          hide_related: true,
          show_reposts: false,
          show_user: true,
          show_teaser: false,
          start_track: command.index,
        });
      }
    };
    const onLegacyPlay = () => onCommand(new CustomEvent(AOA_RADIO_COMMAND_EVENT, { detail: { type: 'toggle' } }));
    window.addEventListener(AOA_RADIO_COMMAND_EVENT, onCommand);
    window.addEventListener(AOA_RADIO_PLAY_EVENT, onLegacyPlay);
    return () => {
      window.removeEventListener(AOA_RADIO_COMMAND_EVENT, onCommand);
      window.removeEventListener(AOA_RADIO_PLAY_EVENT, onLegacyPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const call = (type: AoaRadioCommand['type']) => {
      window.dispatchEvent(new CustomEvent(AOA_RADIO_COMMAND_EVENT, { detail: { type } }));
    };
    try {
      navigator.mediaSession.setActionHandler('play', () => call('play'));
      navigator.mediaSession.setActionHandler('pause', () => call('pause'));
      navigator.mediaSession.setActionHandler('nexttrack', () => call('next'));
      navigator.mediaSession.setActionHandler('previoustrack', () => call('prev'));
    } catch {
      /* ignore unsupported actions */
    }
  }, []);

  const displayTitle = currentTitle || albumTitle;
  useEffect(() => {
    const detail: AoaRadioStateDetail = {
      title: displayTitle,
      playing: isPlaying,
      artist: currentArtist,
      artwork,
      ready: isReady,
      playlistUrl,
      albumTitle,
      currentTrackId,
      tracks,
      source: 'soundcloud',
    };
    window.dispatchEvent(new CustomEvent(AOA_RADIO_STATE_EVENT, { detail }));
    if (displayTitle) {
      updateMediaSession({
        title: displayTitle,
        artist: currentArtist || 'AOA Records',
        album: albumTitle,
        artwork: artwork || undefined,
        isPlaying,
      });
    }
  }, [displayTitle, isPlaying, currentArtist, artwork, isReady, playlistUrl, albumTitle, currentTrackId, tracks]);

  function togglePlay() {
    const widget = widgetRef.current;
    if (!widget) return;
    widget.isPaused((paused) => {
      if (paused) beginAudiblePlayback(widget);
      else widget.pause();
    });
  }

  function handleSeek(ratio: number) {
    if (!widgetRef.current || !duration) return;
    widgetRef.current.seekTo(Math.max(0, Math.min(1, ratio)) * duration);
  }

  const showList = expanded && !inGame;
  const statusLabel = isPlaying ? 'ON AIR' : undefined;

  return (
    <>
      {playerSrc ? (
        <iframe
          ref={iframeRef}
          title="AOA Radio audio"
          src={playerSrc}
          tabIndex={-1}
          aria-hidden="true"
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      ) : null}

      <section
        ref={dockRef}
        className="aoa-deck"
        aria-label="AOA Radio"
        data-compact={inGame ? 'true' : 'false'}
      >
        <div
          className="aoa-deck-progress"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            handleSeek((event.clientX - rect.left) / rect.width);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            event.stopPropagation();
            const delta = event.key === 'ArrowRight' ? 5 : -5;
            handleSeek((progress + delta) / 100);
          }}
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        {showList && tracks.length > 0 ? (
          <div className="max-h-40 overflow-y-auto border-b border-[rgba(243,238,228,0.08)] px-4 py-2">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                type="button"
                className="flex w-full items-center gap-3 px-1 py-1.5 text-left text-sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent(AOA_RADIO_COMMAND_EVENT, {
                    detail: { type: 'jump', index } satisfies AoaRadioCommand,
                  }));
                  setExpanded(false);
                }}
              >
                <span className="aoa-meta w-8">{String(index + 1).padStart(2, '0')}</span>
                <span className={index === currentIndex ? 'text-[var(--signal)]' : 'text-[var(--ink)]'}>{track.title}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="container-premium flex items-center gap-3 py-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-[var(--background-card)]">
            {artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artwork} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[var(--signal)]">
                <Music2 className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              {statusLabel ? <LiveIndicator label={statusLabel} /> : <BroadcastLabel>AOA Radio</BroadcastLabel>}
              <span className="aoa-meta hidden sm:inline">SoundCloud</span>
            </div>
            {displayTitle.length > 42 && !inGame ? (
              <SignalTicker items={[displayTitle]} />
            ) : (
              <p className="truncate text-sm font-semibold text-[var(--ink)]" title={displayTitle}>{displayTitle}</p>
            )}
            <p className="truncate text-xs text-[var(--ink-dim)]">
              {currentArtist}
              {duration > 0 ? ` · ${fmt(position)} / ${fmt(duration)}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center" aria-label="Previous" disabled={!isReady} onClick={() => widgetRef.current?.prev()}>
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center bg-[var(--signal)] text-[var(--signal-ink)] disabled:opacity-40"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={!isReady}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center" aria-label="Next" disabled={!isReady} onClick={() => widgetRef.current?.next()}>
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              onClick={() => {
                const widget = widgetRef.current;
                if (!widget) return;
                if (isMuted) {
                  const level = volume || 70;
                  setIsMuted(false);
                  setVolume(level);
                  widget.setVolume(level);
                } else {
                  setIsMuted(true);
                  widget.setVolume(0);
                }
              }}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              aria-label="Volume"
              className="w-20 accent-[var(--signal)]"
              onChange={(event) => {
                const value = Number(event.target.value);
                setVolume(value);
                setIsMuted(value === 0);
                volumeRef.current = value;
                widgetRef.current?.setVolume(value);
              }}
            />
          </div>

          {inGame ? null : (
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center md:hidden"
              aria-label={expanded ? 'Hide track list' : 'Show track list and volume'}
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              <ChevronUp className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}

          <Link href="/music" className="aoa-meta hidden items-center gap-1 lg:inline-flex" aria-label="Open radio page">
            Radio <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        {expanded && !inGame ? (
          <div className="flex items-center gap-3 border-t border-[rgba(243,238,228,0.08)] px-4 py-3 md:hidden">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              onClick={() => {
                if (isMuted) {
                  const level = volume || 70;
                  setIsMuted(false);
                  setVolume(level);
                  widgetRef.current?.setVolume(level);
                } else {
                  setIsMuted(true);
                  widgetRef.current?.setVolume(0);
                }
              }}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              aria-label="Volume"
              className="min-w-0 flex-1 accent-[var(--signal)]"
              onChange={(event) => {
                const value = Number(event.target.value);
                setVolume(value);
                setIsMuted(value === 0);
                volumeRef.current = value;
                widgetRef.current?.setVolume(value);
              }}
            />
            <button type="button" className="h-11 px-2 text-sm" aria-label="Previous" onClick={() => widgetRef.current?.prev()}>Prev</button>
            <button type="button" className="h-11 px-2 text-sm" aria-label="Next" onClick={() => widgetRef.current?.next()}>Next</button>
          </div>
        ) : null}
      </section>
    </>
  );
}
