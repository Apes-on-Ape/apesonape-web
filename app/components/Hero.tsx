'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  title?: string;
  subtitle?: string;
  showCTAs?: boolean;
}

export default function Hero({ 
  title = "Apes On Ape",
  subtitle = "Apes on Ape is the wild frontier of creation — where sound, art, code, and vision collide. No rules. No limits. Just creators building the future together.",
  showCTAs = true 
}: HeroProps) {
  const ctaButtons = [
    {
      label: 'Join the Movement',
      href: '/collection',
      primary: true,
    },
    {
      label: 'Explore Sound',
      href: '/sound',
      primary: false,
    },
  ];

  return (
    <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden grain-texture">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          src="/home-video-landscape.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center' }}
        />
        {/* Lighter overlay */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Premium Background with cinematic effects */}
        <div className="absolute inset-0 z-[1]">
          {/* Animated gradient orbs */}
          <motion.div
            className="absolute inset-0 bg-gradient-radial from-hero-blue/30 via-hero-blue/10 to-transparent"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.6, 0.4],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-radial"
            style={{
              background: 'radial-gradient(circle, rgba(0, 217, 255, 0.2) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-radial"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 30, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Content Section - On Top of Video */}
      <div className="relative z-20 w-full">
        <div className="container-premium w-full">
          <div className="flex justify-center">
            <motion.div
              className="w-full md:w-4/5 lg:w-3/4 glass-premium rounded-2xl p-8 md:p-12 lg:p-16"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 3.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Title */}
              <motion.h1
                className="section-heading mb-6 text-gradient"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 3.7, ease: [0.4, 0, 0.2, 1] }}
              >
                {title}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="section-description mb-10 leading-relaxed"
                style={{ color: 'var(--foreground)' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 3.9, ease: [0.4, 0, 0.2, 1] }}
              >
                {subtitle}
              </motion.p>

              {/* CTAs */}
              {showCTAs && (
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 4.1, ease: [0.4, 0, 0.2, 1] }}
                >
                  {ctaButtons.map((button, index) => (
                    <motion.a
                      key={button.label}
                      href={button.href}
                      target={button.href.startsWith('http') ? '_blank' : undefined}
                      rel={button.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={button.primary ? 'btn-primary btn-lg' : 'btn-secondary btn-lg'}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 4.3 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {button.label}
                    </motion.a>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

