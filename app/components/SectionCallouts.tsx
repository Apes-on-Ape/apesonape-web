'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Palette, Gamepad2, Hammer } from 'lucide-react';

export default function SectionCallouts() {
  const callouts = [
    {
      icon: Music,
      title: 'Musicians',
      description: 'Share your sound. Collaborate with fellow apes. Drop tracks on our SoundCloud.',
      cta: 'Explore Sound',
      href: '/sound',
      gradient: 'from-hero-blue to-blue-600',
      iconColor: 'text-hero-blue',
    },
    {
      icon: Palette,
      title: 'Artists',
      description: 'Showcase your work. Join a community that celebrates creativity and visual expression.',
      cta: 'View Collection',
      href: '/collection',
      gradient: 'from-hero-blue-light to-hero-blue',
      iconColor: 'text-hero-blue-light',
    },
    {
      icon: Gamepad2,
      title: 'Game Devs',
      description: 'Build experiences. Push boundaries. Play in our arcade and contribute your own games.',
      cta: 'Visit Arcade',
      href: '/arcade',
      gradient: 'from-purple-500 to-purple-700',
      iconColor: 'text-purple-500',
    },
    {
      icon: Hammer,
      title: 'Builders',
      description: 'Create tools. Ship projects. Connect with a community that values making things.',
      cta: 'Join Discord',
      href: 'https://discord.gg/gVmqW6SExU',
      gradient: 'from-green-500 to-green-700',
      iconColor: 'text-green-500',
    },
  ];

  return (
    <section className="section-spacing relative overflow-hidden">
      <div className="container-premium">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <h2 className="section-heading mb-6 text-gradient">
            Join the Studio
          </h2>
          <p className="section-description max-w-3xl mx-auto">
            An open creative space for everyone. Whether you make music, art, games, or tools—
            there&apos;s a place for you here.
          </p>
        </motion.div>

        {/* Callout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {callouts.map((callout, index) => (
            <motion.div
              key={callout.title}
              className="card-premium group relative overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              {/* Premium gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${callout.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon with premium styling */}
                <motion.div 
                  className={`inline-flex p-4 rounded-xl mb-6 shadow-lg ${
                    callout.iconColor === 'text-hero-blue' ? 'bg-hero-blue' : 
                    callout.iconColor === 'text-hero-blue-light' ? 'bg-hero-blue-light' : 
                    callout.iconColor === 'text-purple-500' ? 'bg-accent-purple' : 
                    'bg-accent-green'
                  }`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <callout.icon className="w-6 h-6 text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                  {callout.title}
                </h3>

                {/* Description */}
                <p className="text-muted mb-6 leading-relaxed text-sm">
                  {callout.description}
                </p>

                {/* CTA */}
                <a
                  href={callout.href}
                  target={callout.href.startsWith('http') ? '_blank' : undefined}
                  rel={callout.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${callout.iconColor} group-hover:gap-3 transition-all duration-300`}
                >
                  {callout.cta}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    →
                  </motion.span>
                </a>
              </div>

              {/* Premium decorative glow */}
              <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${callout.gradient} opacity-0 group-hover:opacity-20 rounded-full blur-3xl transition-opacity duration-500`} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="section-description mb-8">
            Make weird. Make loud. Make games.{' '}
            <span className="text-hero-blue font-bold">Apes Together Strong!</span>
          </p>
          <motion.a
            href="https://discord.gg/gVmqW6SExU"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-lg inline-flex"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Join Our Discord
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

