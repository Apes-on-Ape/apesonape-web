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
      className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center rounded-full bg-black/70 border border-white/20 shadow-lg hover:border-hero-blue/60 hover:bg-black/80 transition-all w-11 h-11"
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 text-hero-blue" />
    </button>
  );
}

