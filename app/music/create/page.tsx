'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Music2, Sparkles, ChevronRight, Disc3, Clock } from 'lucide-react';

// Flip to true once the feature is live
const FEATURE_ENABLED = false;
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import HolderOnly from '@/app/components/HolderOnly';
import { useGlyph } from '@use-glyph/sdk-react';

const STYLES = [
  { value: 'electronic', label: 'Electronic / EDM' },
  { value: 'hiphop', label: 'Hip-hop / Trap' },
  { value: 'lofi', label: 'Lo-fi / Chill' },
  { value: 'rock', label: 'Rock / Alt' },
  { value: 'cinematic', label: 'Cinematic / Score' },
];

const PROMPT_EXAMPLES = [
  'High-energy jungle drum & bass for Ape #123 in an arcade.',
  'Lo-fi boom bap for a late-night builder session on Apechain.',
  'Dark cinematic score for an Ape on a neon-lit street.',
];

export default function MusicCreatePage() {
  const glyph = (useGlyph() as unknown) as {
    user?: {
      evmWallet?: string;
      smartWallet?: string;
      linkedWallets?: Array<{ address?: string }>;
    };
  };
  const walletAddress =
    glyph?.user?.evmWallet ||
    glyph?.user?.smartWallet ||
    glyph?.user?.linkedWallets?.[0]?.address ||
    '';

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('electronic');
  const [length, setLength] = useState('60');
  const [apeId, setApeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!prompt.trim() || !apeId.trim()) {
      setError('Please add a prompt and your Ape ID.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/suno/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          lengthSeconds: Number(length) || 60,
          apeId: apeId.trim(),
          walletAddress,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to start generation.');
      } else {
        setJobId(json.jobId || null);
        setJobMessage(json.message || null);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-hero-blue/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-hero-blue/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 border border-hero-blue/30 bg-hero-blue/5 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-hero-blue animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-blue">AOA Records — Holders Only</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white mb-6">
              Generate<br />
              <span className="text-hero-blue">Your</span> Track.
            </h1>

            <p className="text-lg text-white/50 max-w-lg leading-relaxed font-light">
              Describe the sound, pick a style, and SUNO handles the rest.
              Every track is tied to your Ape NFT and released under AOA Records.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <HolderOnly>
          <motion.div
            className="grid lg:grid-cols-[280px_1fr] gap-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* ── Sidebar ── */}
            <div className="space-y-4">
              {/* How it works */}
              <div className="border border-white/8 rounded-2xl p-5 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                  <Music2 className="w-4 h-4 text-hero-blue flex-shrink-0" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">How it works</h2>
                </div>
                <ol className="space-y-3">
                  {[
                    'Connect the wallet holding your Ape.',
                    'Describe the track — mood, instruments, tempo.',
                    'Pick a style and length.',
                    'We call SUNO and link the result to your Ape ID.',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-xs font-mono text-hero-blue/60 mt-0.5 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-white/45 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Prompt ideas */}
              <div className="border border-white/8 rounded-2xl p-5 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-accent-purple flex-shrink-0" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">Prompt ideas</h3>
                </div>
                <div className="space-y-2.5">
                  {PROMPT_EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="w-full text-left text-xs text-white/35 hover:text-white/70 leading-relaxed border border-transparent hover:border-white/10 rounded-lg px-2 py-1.5 transition-colors group"
                    >
                      <span className="text-hero-blue/40 group-hover:text-hero-blue mr-1.5">"</span>
                      {ex}
                      <span className="text-hero-blue/40 group-hover:text-hero-blue ml-0.5">"</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/20 mt-3">Click any example to use it.</p>
              </div>
            </div>

            {/* ── Form ── */}
            <div className="border border-white/8 rounded-2xl p-7 bg-white/[0.02]">
              {jobId ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-16 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-hero-blue/10 border border-hero-blue/30 flex items-center justify-center mb-6">
                    <Disc3 className="w-8 h-8 text-hero-blue vinyl-spin" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Generation started</h3>
                  {jobMessage ? (
                    <p className="text-xs text-hero-blue/70 bg-hero-blue/5 border border-hero-blue/20 rounded-lg px-4 py-3 max-w-sm leading-relaxed text-center">
                      {jobMessage}
                    </p>
                  ) : (
                    <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                      Your request is in the queue. Check your AOA Records listing once generation completes.
                    </p>
                  )}
                  <button
                    onClick={() => { setJobId(null); setJobMessage(null); setPrompt(''); setApeId(''); }}
                    className="mt-8 inline-flex items-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/30 px-5 py-3 rounded-xl text-sm font-semibold uppercase tracking-widest transition-colors"
                  >
                    Generate another
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className={`space-y-6 ${!FEATURE_ENABLED ? 'pointer-events-none' : ''}`}>
                  {/* Prompt */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                      <Wand2 className="w-3.5 h-3.5" />
                      Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-black/40 text-sm p-4 resize-none focus:outline-none focus:border-hero-blue/50 focus:ring-1 focus:ring-hero-blue/20 text-white placeholder:text-white/20 transition-colors"
                      placeholder="Describe the track you want — mood, instruments, tempo, vibe…"
                    />
                  </div>

                  {/* Style + Length + Ape ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Style</label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 text-sm px-3 py-2.5 focus:outline-none focus:border-hero-blue/50 focus:ring-1 focus:ring-hero-blue/20 text-white transition-colors appearance-none cursor-pointer"
                      >
                        {STYLES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Length (sec)</label>
                      <input
                        type="number"
                        min={15}
                        max={180}
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 text-sm px-3 py-2.5 focus:outline-none focus:border-hero-blue/50 focus:ring-1 focus:ring-hero-blue/20 text-white transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Ape ID</label>
                      <input
                        type="text"
                        value={apeId}
                        onChange={(e) => setApeId(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 text-sm px-3 py-2.5 focus:outline-none focus:border-hero-blue/50 focus:ring-1 focus:ring-hero-blue/20 text-white placeholder:text-white/25 transition-colors"
                        placeholder="e.g. 1234"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3">
                      {error}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 gap-4">
                    {FEATURE_ENABLED ? (
                      <>
                        <p className="text-[11px] text-white/20 max-w-xs leading-relaxed">
                          Generation runs server-side via SUNO. Each request produces 2 tracks tied to your Ape.
                        </p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center gap-2.5 bg-hero-blue text-white font-bold px-6 py-3.5 rounded-xl text-sm uppercase tracking-widest hover:bg-hero-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed group flex-shrink-0"
                        >
                          {submitting ? (
                            <>
                              <Disc3 className="w-4 h-4 vinyl-spin" />
                              Submitting…
                            </>
                          ) : (
                            <>
                              Generate with SUNO
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-white/20 max-w-xs leading-relaxed">
                          Fill in your details now. Generation will be available once we flip the switch.
                        </p>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="inline-flex items-center gap-2 border border-hero-blue/25 bg-hero-blue/5 px-5 py-3.5 rounded-xl cursor-not-allowed">
                            <Clock className="w-4 h-4 text-hero-blue/60" />
                            <span className="text-sm font-bold uppercase tracking-widest text-hero-blue/60">Coming Soon</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </HolderOnly>
      </section>

      <Footer />
    </div>
  );
}
