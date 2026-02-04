// SoundCloud Widget API Type Definitions

export type SoundCloudTrack = {
  id: number;
  title?: string;
  user?: { username?: string };
  artwork_url?: string;
  duration?: number;
  permalink_url?: string;
  description?: string;
  stream_url?: string;
};

export interface SoundCloudWidgetOptions {
  auto_play?: boolean;
  visual?: boolean;
  show_comments?: boolean;
  hide_related?: boolean;
  show_reposts?: boolean;
  show_user?: boolean;
  show_teaser?: boolean;
  start_track?: number;
}

export interface SoundCloudWidget {
  bind(event: string, listener: () => void): void;
  play(): void;
  pause(): void;
  next(): void;
  isPaused(callback: (paused: boolean) => void): void;
  setVolume(volumePercent: number): void;
  getCurrentSound(callback: (sound: SoundCloudTrack | null) => void): void;
  getSounds(callback: (sounds: SoundCloudTrack[]) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
  load(url: string, options?: SoundCloudWidgetOptions): void;
}

export interface SoundCloud {
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
