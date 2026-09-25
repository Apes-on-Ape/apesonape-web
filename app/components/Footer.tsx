'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SiSoundcloud, SiDiscord, SiX, SiSpotify } from 'react-icons/si';
import { BRAND, FOOTER_SECTIONS, FOOTER_WHISPERS, SOCIALS, CONTRACT_APESCAN } from '@/app/data/site';

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  x: SiX,
  discord: SiDiscord,
  soundcloud: SiSoundcloud,
  spotify: SiSpotify,
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative border-t mt-20 grain-texture"
      style={{
        borderTopColor: 'rgba(0, 84, 249, 0.2)',
        background: 'linear-gradient(to top, rgba(0,84,249,0.04) 0%, transparent 60%), var(--background-surface)',
      }}
    >
      <div className="relative container-premium py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12">

          {/* Brand Column — spans 2 cols on large */}
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 group" aria-label="Apes On Ape — home">
              <motion.div
                className="relative w-9 h-9 flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Image src="/apechain.png" alt="" fill className="object-contain" aria-hidden="true" />
              </motion.div>
              <span className="text-lg font-bold text-gradient">{BRAND.name}</span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-sub)' }}>
              {BRAND.tagline}
            </p>

            <p className="text-sm leading-relaxed max-w-xs font-semibold tracking-wide" style={{ color: 'var(--text-dim)' }} suppressHydrationWarning>
              {FOOTER_WHISPERS[new Date().getUTCDate() % FOOTER_WHISPERS.length]}
            </p>

            {/* Social icons */}
            <div className="flex gap-2 flex-wrap">
              {SOCIALS.map(({ label, href, platform }) => {
                const Icon = SOCIAL_ICONS[platform];
                if (!Icon) return null;
                return (
                  <motion.a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 flex items-center justify-center rounded-xl glass text-muted hover:text-hero-blue hover:border-hero-blue/40 transition-all duration-200"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Content Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="type-label text-hero-blue mb-5">{section.heading}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm transition-colors duration-200 hover:text-white flex items-center gap-1"
                        style={{ color: 'var(--text-sub)' }}
                      >
                        {link.label}
                        <span className="opacity-40 text-xs">↗</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm transition-colors duration-200 hover:text-white"
                        style={{ color: 'var(--text-sub)' }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom marquee statement */}
        <div className="mt-14 pt-8 border-t" style={{ borderTopColor: 'rgba(0, 84, 249, 0.12)' }}>
          <p
            className="text-center text-xs font-bold tracking-[0.2em] uppercase mb-6"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          >
            {BRAND.participationCall}
          </p>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs" style={{ color: 'var(--text-dim)' }} suppressHydrationWarning>
              © {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
              <a
                href={CONTRACT_APESCAN}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-hero-blue transition-colors duration-200"
              >
                Contract
              </a>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
              <span>Built on ApeChain</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
