'use client';

import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 shadow-lg transition-all hover:border-[var(--signal)] hover:bg-black/80"
      style={{ bottom: 'calc(var(--aoa-dock-offset) + 0.75rem)' }}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-hero-blue" />
    </button>
  );
}

