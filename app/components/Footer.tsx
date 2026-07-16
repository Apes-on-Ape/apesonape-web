'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SiSoundcloud, SiDiscord, SiX, SiSpotify } from 'react-icons/si';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const exploreLinks = [
    { name: 'Collection', href: '/collection' },
    { name: 'Rarity Explorer', href: '/rarity' },
    { name: 'Music', href: '/music' },
    { name: 'About', href: '/about' },
  ];

  const createLinks = [
    { name: 'Studio', href: '/studio' },
    { name: 'Community Gallery', href: '/gallery' },
    { name: 'Submit Track', href: '/music/submit' },
    { name: 'Vote', href: '/vote' },
  ];

  return (
    <footer className="relative bg-background-surface border-t mt-20 grain-texture" style={{ borderTopColor: 'rgba(0, 84, 249, 0.2)' }}>
      <div className="relative container-premium py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">

          {/* Brand Column */}
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative w-9 h-9"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Image src="/apechain.png" alt="AOA Logo" fill className="object-contain" />
              </motion.div>
              <span className="text-lg font-bold text-gradient">Apes On Ape</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed">
              A creator-first playground for musicians, artists, and builders — native to ApeChain.
            </p>
            {/* Social icons */}
            <div className="flex gap-2">
              {[
                { label: 'X (Twitter)', href: 'https://x.com/apesonape', Icon: SiX },
                { label: 'Discord', href: 'https://discord.gg/gVmqW6SExU', Icon: SiDiscord },
                { label: 'SoundCloud', href: 'https://soundcloud.com/apesonape', Icon: SiSoundcloud },
                { label: 'Spotify', href: 'https://open.spotify.com/artist/5jWLGE3ZNCyau37PWs20AP', Icon: SiSpotify },
              ].map(({ label, href, Icon }) => (
                <motion.a
                  key={label}
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
              ))}
            </div>
          </div>

          {/* Explore Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-hero-blue mb-5">Explore</h3>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Create Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-hero-blue mb-5">Create</h3>
            <ul className="space-y-2.5">
              {createLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trade Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-hero-blue mb-5">Trade</h3>
            <ul className="space-y-3">
              {[
                { name: 'OpenSea', href: 'https://opensea.io/collection/apes-on-apechain', icon: '/opensea-logo.webp' },
                { name: 'Mintify', href: 'https://app.mintify.com/nft/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0', icon: '/mintify_icon.jpeg', rounded: true },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-muted hover:text-white transition-colors duration-200 text-sm group"
                  >
                    <div className={`relative w-4 h-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity ${link.rounded ? 'rounded' : ''}`}>
                      <Image src={link.icon} alt={link.name} fill className={`object-contain ${link.rounded ? 'rounded' : ''}`} />
                    </div>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-3" style={{ borderTopColor: 'rgba(0, 84, 249, 0.15)' }}>
          <p className="text-muted/60 text-xs">
            © {currentYear} Apes On Ape. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted/60">
            <a
              href="https://apescan.io/address/0xa6babe18f2318d2880dd7da3126c19536048f8b0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-hero-blue transition-colors duration-200"
            >
              Contract
            </a>
            <span className="text-muted/20">·</span>
            <span>Built on ApeChain</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

