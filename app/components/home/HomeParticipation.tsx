'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BRAND } from '@/app/data/site';

const LINES = [
  'Make the song.',
  'Make the artwork.',
  'Build the game.',
  'Tell the story.',
  'Find your place.',
];

export default function HomeParticipation() {
  return (
    <section
      aria-labelledby="participation-heading"
      className="border-t border-white/8 py-28 md:py-36 relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, var(--background-surface), var(--background))',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,84,249,0.09) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <div className="container-premium relative max-w-4xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <h2
            id="participation-heading"
            className="font-black text-white leading-[0.88] tracking-tight mb-10"
            style={{ fontSize: 'var(--text-display-xl)' }}
          >
            <span className="block">Don't watch</span>
            <span className="block">the culture.</span>
            <span className="block text-hero-blue">Make it.</span>
          </h2>

          {/* Stagger-animated participation lines */}
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 mb-14">
            {LINES.map((line, i) => (
              <motion.p
                key={line}
                className="text-base font-semibold"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              >
                {line}
              </motion.p>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/join" className="btn-primary btn-lg group">
              Join AOA
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link href="/open-mic" className="btn-secondary btn-lg">
              Open Mic
            </Link>
          </div>

          <p
            className="mt-8 text-sm font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            {BRAND.apesTogether}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
