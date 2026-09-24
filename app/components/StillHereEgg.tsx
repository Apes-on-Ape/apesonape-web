'use client';

import { useEffect } from 'react';

export default function StillHereEgg() {
  useEffect(() => {
    let buffer = '';
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-9);
      if (!buffer.endsWith('aoa') && !buffer.endsWith('stillhere')) return;
      document.documentElement.dataset.aoa = '1';
      window.setTimeout(() => {
        delete document.documentElement.dataset.aoa;
      }, 1400);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
