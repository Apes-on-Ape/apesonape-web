'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'aoa-signal-boot';

const LINES = [
  'SEARCHING FOR SIGNAL...',
  'APECHAIN // 33139',
  'FREQUENCY FOUND',
  'AOA TRANSMISSION ONLINE',
] as const;

/**
 * First visit in a browser session only. About 800ms.
 * Reduced motion skips it. sessionStorage is read after mount so SSR stays stable.
 */
export default function HomeBoot() {
  const [visible, setVisible] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      reduce = false;
    }

    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      seen = true;
    }

    const mark = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* private mode */
      }
    };

    if (reduce || seen) {
      mark();
      return;
    }

    setVisible(true);
    let step = 0;
    const tick = window.setInterval(() => {
      step += 1;
      if (step >= LINES.length) {
        window.clearInterval(tick);
        mark();
        setVisible(false);
        return;
      }
      setLine(step);
    }, 200);

    const kill = window.setTimeout(() => {
      window.clearInterval(tick);
      mark();
      setVisible(false);
    }, 900);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(kill);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--bg)] px-6"
      role="status"
      aria-live="polite"
    >
      <p className="aoa-meta text-center text-[var(--signal)]">{LINES[line]}</p>
    </div>
  );
}
