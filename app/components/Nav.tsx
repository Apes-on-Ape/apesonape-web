'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { PRIMARY_NAV } from '@/app/data/site';
import { useAoaRadioState } from '@/app/hooks/useAoaRadioState';
import BrandLogo from './BrandLogo';
import LiveIndicator from './signal/LiveIndicator';
import NoiseOverlay from './signal/NoiseOverlay';

const AuthNavControls = dynamic(() => import('./AuthNavControls'), { ssr: false });
const NotificationBell = dynamic(() => import('./NotificationBell'), { ssr: false });

function normalizePath(path: string) {
  const base = path.split('#')[0].split('?')[0] || '/';
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1);
  return base || '/';
}

export default function Nav() {
  const pathname = usePathname() || '/';
  const current = normalizePath(pathname);
  const radio = useAoaRadioState();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    firstLinkRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) => {
    const target = normalizePath(href);
    if (target === '/') return current === '/';
    if (target === '/music' && current.startsWith('/artist')) return true;
    return current === target || current.startsWith(`${target}/`);
  };

  return (
    <header className="aoa-header fixed top-0 left-0 right-0 z-[70]">
      <a href="#aoa-main" className="aoa-skip">
        Skip to content
      </a>
      <div className="container-premium flex h-full items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center" aria-label="Apes On Ape — home">
          <BrandLogo className="h-8 w-[4.75rem] shrink-0" priority />
        </Link>

        <nav className="mx-auto hidden items-center xl:flex" aria-label="Main navigation">
          {PRIMARY_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={isActive(link.href) ? 'true' : 'false'}
              className="aoa-nav-link"
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {radio.playing ? <LiveIndicator label="ON AIR" className="hidden sm:inline-flex" /> : null}
          <NotificationBell />
          <AuthNavControls />
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-[var(--ink)] xl:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  id="mobile-menu"
                  className="fixed inset-x-0 bottom-0 z-[90] overflow-y-auto bg-[var(--bg)] xl:hidden"
                  style={{ top: 'var(--aoa-header-h)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <NoiseOverlay />
                  <nav className="relative flex min-h-full flex-col px-6 py-8" aria-label="Mobile navigation">
                    {PRIMARY_NAV.map((link, index) => (
                      <Link
                        key={link.href}
                        ref={index === 0 ? firstLinkRef : undefined}
                        href={link.href}
                        className="flex items-baseline justify-between border-b border-[rgba(243,238,228,0.1)] py-4"
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <span className={`font-display text-4xl uppercase tracking-wide ${isActive(link.href) ? 'text-[var(--signal)]' : 'text-[var(--ink)]'}`}>{link.label}</span>
                        <span className="aoa-meta">{String(index + 1).padStart(2, '0')}</span>
                      </Link>
                    ))}
                    <div className="mt-8 pb-[var(--aoa-dock-offset)]">
                      {radio.playing ? <LiveIndicator label="ON AIR" /> : <p className="aoa-meta">AOA Radio</p>}
                    </div>
                  </nav>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </header>
  );
}
