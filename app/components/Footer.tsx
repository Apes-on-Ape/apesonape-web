'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SiSoundcloud } from 'react-icons/si';

export default function Footer() {
  const currentYear = 2024;

  const socialLinks = [
    {
      name: 'Discord',
      href: 'https://discord.gg/gVmqW6SExU',
      icon: '/discord-white.png',
    },
    {
      name: 'X (Twitter)',
      href: 'https://x.com/apechainapes',
      icon: '/x-white.png',
    },
  ];

  const marketplaceLinks = [
    {
      name: 'Magic Eden',
      href: 'https://magiceden.io/collections/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0',
      icon: '/magiceden_icon.jpeg',
    },
    {
      name: 'Mintify',
      href: 'https://app.mintify.com/nft/apechain/0xa6babe18f2318d2880dd7da3126c19536048f8b0',
      icon: '/mintify_icon.jpeg',
    },
    {
      name: 'OpenSea',
      href: 'https://opensea.io/collection/apes-on-apechain',
      icon: '/opensea-logo.webp',
    },
  ];

  const creativeLinks = [
    {
      name: 'SoundCloud',
      href: 'https://soundcloud.com/apesonape',
      IconComponent: SiSoundcloud,
    },
  ];

  const internalLinks = [
    { name: 'Collection', href: '/collection' },
    { name: 'Sound', href: '/sound' },
    { name: 'Studio', href: '/studio' },
  ];

  return (
    <footer className="relative bg-background-surface border-t mt-20 grain-texture" style={{ borderTopColor: 'rgba(0, 84, 249, 0.3)' }}>
      <div className="relative container-premium py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="relative w-10 h-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Image
                  src="/apechain.png"
                  alt="Apechain Logo"
                  fill
                  className="object-contain transition-all duration-300"
                />
              </motion.div>
              <span className="text-xl font-bold text-gradient">
                Apes On Ape
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              A playground for musicians, artists, game devs, and builders. Make weird. Make loud. Make games.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 flex items-center justify-center rounded-xl glass hover:border-hero-blue/50 transition-all duration-300"
                  aria-label={link.name}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative w-5 h-5">
                    <Image
                      src={link.icon}
                      alt={link.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="text-hero-blue font-semibold mb-6 text-base">Navigate</h3>
            <ul className="space-y-3">
              {internalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-hero-blue transition-colors duration-300 text-sm block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplaces Column */}
          <div>
            <h3 className="text-hero-blue font-semibold mb-6 text-base">Marketplaces</h3>
            <ul className="space-y-3">
              {marketplaceLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-muted hover:text-hero-blue transition-colors duration-300 text-sm py-1 group"
                  >
                    <div className="relative w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Image
                        src={link.icon}
                        alt={link.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Creative Hub Column */}
          <div>
            <h3 className="text-hero-blue font-semibold mb-6 text-base">Creative Hub</h3>
            <ul className="space-y-3">
              {creativeLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-muted hover:text-hero-blue transition-colors duration-300 text-sm py-1"
                  >
                    <link.IconComponent className="w-4 h-4 flex-shrink-0" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTopColor: 'rgba(0, 84, 249, 0.3)' }}>
          <p className="text-muted text-sm">
            © {currentYear} Apes On Ape. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="https://apescan.io/address/0xa6babe18f2318d2880dd7da3126c19536048f8b0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-hero-blue transition-colors duration-300"
            >
              Contract
            </a>
            <span className="text-muted/30">•</span>
            <span className="text-muted">Built on Apechain</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

