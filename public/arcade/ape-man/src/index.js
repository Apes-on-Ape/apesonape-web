/**
 * Bootstrap asset roots for SoundManager + Animation (must run before gameplay, after bundle loads).
 * Inline script in index.html also sets these so paths work even if import order changes.
 */
(function initApeManAssetPaths() {
  if (typeof window === 'undefined') return;
  try {
    if (window.JSPACMAN_IMG_PATH) return;
    const u = new URL(window.location.href);
    let path = u.pathname;
    if (!path.endsWith('/')) {
      if (/\.html?$/i.test(path)) {
        path = path.replace(/\/[^/]*$/, '/') || '/';
      } else {
        path = `${path}/`;
      }
    }
    const base = `${u.origin}${path}dist/`;
    window.JSPACMAN_ASSETS_PATH = base;
    window.JSPACMAN_IMG_PATH = `${base}img/`;
    window.JSPACMAN_AUDIO_PATH = `${base}audio/`;
  } catch {
    /* ignore */
  }
})();

import './styles.css';

import JsPacman from './js/Game.js';

window.jsPacman = JsPacman;
