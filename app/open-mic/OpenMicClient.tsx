'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mic } from 'lucide-react';

const WHAT_WE_ACCEPT = [
  'Original music (any genre)',
  'Beats and instrumentals',
  'Works in progress — rough mixes welcome',
  'Collabs with other AOA artists',
  'Remixes of AOA Records tracks',
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Hold an Ape', body: 'Open Mic is for Apes On Ape holders. Verify in Discord.' },
  { step: '02', title: 'Post in #open-mic', body: 'Drop your SoundCloud link in the #open-mic Discord channel with a short description.' },
  { step: '03', title: 'Get feedback', body: 'The community listens and gives real feedback. No gatekeeping, no judgment.' },
  { step: '04', title: 'Graduate to AOA Records', body: 'If your track is ready, submit it for consideration on the official AOA Records label.' },
];

export default function OpenMicClient() {
  return (
    <main>
      {/* Header */}
      <section
        className="pt-28 pb-20 border-b border-white/8 relative overflow-hidden"
        aria-labelledby="open-mic-heading"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(0,84,249,0.12) 0%, transparent 65%)' }} />

        <div className="container-premium relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="type-label text-hero-blue mb-6">AOA Records</p>
            <h1
              id="open-mic-heading"
              className="font-black text-white leading-[0.9] tracking-tight mb-6 max-w-2xl"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              Open Mic.<br />
              <span className="text-hero-blue">No filter.</span>
            </h1>
            <p className="text-xl max-w-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Drop your track, rough or finished. Get real feedback from other artists.
              No algorithm. No gatekeepers.
            </p>
            <button
              type="button"
              disabled
              className="btn-primary btn-lg inline-flex opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              Submissions are not open yet
            </button>
            <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Hang in Discord while the public mic is being built.{' '}
              <a href="https://discord.gg/gVmqW6SExU" target="_blank" rel="noopener noreferrer" className="text-hero-blue hover:underline">
                Join the server
              </a>
              .
            </p>
          </motion.div>
        </div>
      </section>

      {/* What we accept */}
      <section className="border-t border-white/8 py-20" aria-labelledby="accepts-heading">
        <div className="container-premium">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="type-label text-hero-blue mb-6">What counts</p>
              <h2 id="accepts-heading" className="font-black text-white mb-8 leading-[0.92]"
                style={{ fontSize: 'var(--text-display)' }}>
                Anything you make.
              </h2>
              <ul className="space-y-3" role="list">
                {WHAT_WE_ACCEPT.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-hero-blue flex-shrink-0" aria-hidden="true" />
                    <span className="text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="rounded-2xl p-8 border border-white/8"
              style={{ background: 'var(--background-card)' }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Mic className="w-10 h-10 text-hero-blue mb-6" aria-hidden="true" />
              <h3 className="text-xl font-black text-white mb-3">This is a community, not a label</h3>
              <p className="leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                The Open Mic is a place to share what you&rsquo;re working on — rough, finished, experimental, whatever.
                The AOA community shows up, listens, and gives real feedback. If something is ready for the label,
                we help you get it there.
              </p>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                AOA Records — for when you&rsquo;re ready to release officially.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/8 py-20" aria-labelledby="how-heading">
        <div className="container-premium max-w-3xl mx-auto">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 id="how-heading" className="font-black text-white" style={{ fontSize: 'var(--text-h1)' }}>
              How it works.
            </h2>
          </motion.div>

          <div className="space-y-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} className="flex gap-7 items-start"
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-hero-blue text-xs"
                  style={{ background: 'rgba(0,84,249,0.1)', border: '1px solid rgba(0,84,249,0.2)' }}>
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-1.5">{step.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)' }}>{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/8 py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,84,249,0.08) 0%, transparent 60%)' }} />
        <div className="container-premium relative text-center max-w-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-black text-white mb-6" style={{ fontSize: 'var(--text-h1)' }}>
              Ready to drop something?
            </h2>
            <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Join the Discord, verify your Ape, and post in #open-mic.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="https://discord.gg/gVmqW6SExU" target="_blank" rel="noopener noreferrer"
                className="btn-primary btn-lg group">
                Join Discord
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </a>
              <Link href="/music" className="btn-secondary btn-lg">
                AOA Records
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
