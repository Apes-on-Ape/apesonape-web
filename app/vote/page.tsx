'use client';

import { motion } from 'framer-motion';
import { Vote } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';

export default function VotePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center px-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-hero-blue/10 border border-hero-blue/20 mb-8">
            <Vote className="w-10 h-10 text-hero-blue" />
          </div>

          <div className="overline-tag mx-auto mb-6">Community Governance</div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight mb-6">
            COMING<br />
            <span className="text-hero-blue">SOON</span>
          </h1>

          <p className="text-white/40 text-lg max-w-md mx-auto">
            Holder voting and community governance is on the way.
            Ape holders will shape the future of AOA.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
