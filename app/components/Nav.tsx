'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const AuthNavControls = dynamic(() => import('./AuthNavControls'), { ssr: false });
const ExtraLinks = dynamic(() => import('./ExtraLinks'), { ssr: false });
const NotificationBell = dynamic(() => import('./NotificationBell'), { ssr: false });

export default function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/collection', label: 'Collection' },
    { href: '/music', label: 'Music' },
    { href: '/wardrobe', label: 'Wardrobe' },
  ];
  
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <motion.nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled 
          ? 'shadow-xl border-b' 
          : 'bg-transparent'
      )}
      style={isScrolled ? { 
        borderBottomColor: 'rgba(0, 84, 249, 0.3)',
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      } : undefined}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="container-premium">
        <div className="flex items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group relative">
            <motion.div 
              className="relative w-10 h-10 md:w-14 md:h-14"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              style={{ opacity: 1 }}
            >
              <Image
                src="/apechain.png"
                alt="Apechain Logo"
                fill
                className="object-contain transition-all duration-300"
                style={{ opacity: 1 }}
              />
            </motion.div>
            <span className="text-xl md:text-2xl font-bold text-hero-blue group-hover:text-hero-blue-light transition-colors" style={{ opacity: 1 }}>
              Apes On Ape
            </span>
          </Link>

          {/* Desktop Navigation - Right Aligned */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 rounded-lg font-medium transition-all duration-300',
                    'hover:text-hero-blue',
                    active && 'text-hero-blue'
                  )}
                  style={!active ? { color: 'rgba(245, 245, 245, 1)' } : undefined}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      className="absolute -bottom-1 left-2 right-2 h-0.5 bg-hero-blue rounded-full"
                      layoutId="activeIndicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            <ExtraLinks />
            <NotificationBell />
            <AuthNavControls />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl glass transition-colors"
              style={{ color: 'var(--foreground)' }}
              aria-label="Toggle menu"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden border-t"
            style={{ 
              borderTopColor: 'rgba(0, 84, 249, 0.3)',
              backgroundColor: 'rgba(10, 10, 15, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block px-4 py-3 rounded-xl font-medium transition-all duration-300',
                      active
                        ? 'text-hero-blue bg-hero-blue/10 border border-hero-blue/30'
                        : 'hover:text-hero-blue hover:bg-hero-blue/5'
                    )}
                    style={!active ? { color: 'rgba(245, 245, 245, 1)' } : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderTopColor: 'rgba(0, 84, 249, 0.3)' }}>
                <ExtraLinks />
                <div className="flex justify-center">
                  <AuthNavControls />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

