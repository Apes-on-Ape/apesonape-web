export const AOA_RADIO_STATE_EVENT = 'aoa-radio-state';
export const AOA_RADIO_COMMAND_EVENT = 'aoa-radio-command';

/** Legacy toggle used by the homepage signal control. */
export const AOA_RADIO_PLAY_EVENT = 'aoa-radio-play';

export type AoaRadioTrack = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  duration: number;
  permalink: string;
};

export type AoaRadioStateDetail = {
  title: string;
  playing: boolean;
  artist?: string;
  artwork?: string;
  ready?: boolean;
  playlistUrl?: string;
  albumTitle?: string;
  currentTrackId?: string;
  tracks?: AoaRadioTrack[];
  source?: 'soundcloud';
};

export type AoaRadioCommand =
  | { type: 'toggle' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'load'; url: string; play?: boolean; title?: string; startTrack?: number }
  | { type: 'jump'; index: number }
  | { type: 'seek'; ratio: number }
  | { type: 'volume'; value: number };

const ARCADE_SHELL_SEGMENTS = new Set(['leaderboard', 'achievements', 'clubroom']);

export function isArcadeGamePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'arcade' || !parts[1]) return false;
  return !ARCADE_SHELL_SEGMENTS.has(parts[1]);
}

export function sameRadioUrl(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.replace(/\/+$/, '') === b.replace(/\/+$/, '');
}

export function dispatchRadioCommand(command: AoaRadioCommand) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AOA_RADIO_COMMAND_EVENT, { detail: command }));
}
