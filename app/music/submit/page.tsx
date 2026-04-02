'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Upload, CheckCircle2, AlertCircle, Mic, ArrowLeft, Headphones, Star } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import { useGlyph } from '@use-glyph/sdk-react';

const GENRES = ['Hip-Hop', 'Electronic', 'Ambient', 'Lo-Fi', 'House', 'Trap', 'Jazz', 'Rock', 'Pop', 'Other'];

export default function MusicSubmitPage() {
  const glyph = (useGlyph() as unknown) as { user?: { evmWallet?: string; smartWallet?: string; linkedWallets?: Array<{ address?: string }> }; address?: string };
  const walletAddress = glyph?.user?.evmWallet || glyph?.user?.smartWallet || glyph?.user?.linkedWallets?.[0]?.address || glyph?.address;
  const isSignedIn = !!walletAddress;

  const [form, setForm] = useState({ title: '', soundcloudUrl: '', genre: '', apeId: '', description: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) { setMessage('Please sign in first.'); setStatus('error'); return; }
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/music/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, ...form }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Track submitted!');
        setForm({ title: '', soundcloudUrl: '', genre: '', apeId: '', description: '' });
      } else {
        setStatus('error');
        setMessage(data.error || 'Submission failed.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <Nav />

      <div className="container-premium pt-28 pb-24">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/music" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Music
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hero-blue/10 border border-hero-blue/30 mb-6">
              <Music2 className="w-4 h-4 text-hero-blue" />
              <span className="text-sm font-semibold tracking-widest uppercase text-hero-blue">AOA Records</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
              Submit Your <span className="text-gradient">Track</span>
            </h1>
            <p className="text-lg text-white/55 leading-relaxed mb-8">
              Are you an Apes On Ape holder who makes music? Submit your SoundCloud track to be featured in the AOA Records library and shared with the community.
            </p>

            <div className="space-y-4">
              {[
                { icon: Headphones, title: 'Holders Only', desc: 'You must hold at least one Apes On Ape NFT to submit.' },
                { icon: CheckCircle2, title: 'Curated Review', desc: 'Every submission is reviewed by the AOA team before going live.' },
                { icon: Star, title: 'Get Featured', desc: 'Top tracks may be featured on the music page and community channels.' },
                { icon: Mic, title: 'Keep Your Rights', desc: 'You retain full ownership of your music. We just share the love.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/3 border border-white/8"
                >
                  <div className="w-10 h-10 rounded-xl bg-hero-blue/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-hero-blue" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{title}</div>
                    <div className="text-sm text-white/40 mt-0.5">{desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="rounded-2xl bg-white/3 border border-white/10 p-8">
              {!isSignedIn ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-hero-blue/10 flex items-center justify-center mx-auto mb-5">
                    <Music2 className="w-8 h-8 text-hero-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Sign In to Submit</h3>
                  <p className="text-white/40 text-sm mb-6">Connect your wallet to verify your holder status and submit a track.</p>
                  <p className="text-white/30 text-xs">Use the Sign In button in the top navigation.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-6">Track Details</h2>

                  <AnimatePresence>
                    {status === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-green-400 text-sm">Submitted!</div>
                          <div className="text-green-400/70 text-sm mt-0.5">{message}</div>
                        </div>
                      </motion.div>
                    )}
                    {status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-red-400 text-sm">{message}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                        Track Title <span className="text-hero-blue">*</span>
                      </label>
                      <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                        placeholder="My Awesome Track"
                        maxLength={120}
                        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25
                          focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                        SoundCloud URL <span className="text-hero-blue">*</span>
                      </label>
                      <input
                        name="soundcloudUrl"
                        value={form.soundcloudUrl}
                        onChange={handleChange}
                        required
                        placeholder="https://soundcloud.com/yourname/your-track"
                        type="url"
                        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25
                          focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Genre</label>
                        <select
                          name="genre"
                          value={form.genre}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white
                            focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all"
                        >
                          <option value="">Select genre</option>
                          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Ape ID (optional)</label>
                        <input
                          name="apeId"
                          value={form.apeId}
                          onChange={handleChange}
                          placeholder="e.g. 4201"
                          type="number"
                          min={1}
                          max={10000}
                          className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25
                            focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Description (optional)</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        maxLength={500}
                        placeholder="Tell us about your track…"
                        className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25
                          focus:outline-none focus:border-hero-blue/50 focus:ring-2 focus:ring-hero-blue/20 transition-all resize-none"
                      />
                      <div className="text-right text-[11px] text-white/25 mt-1">{form.description.length}/500</div>
                    </div>

                    <div className="pt-2 text-xs text-white/30 border-t border-white/8">
                      Submitting as: <span className="text-hero-blue font-mono">{walletAddress?.slice(0, 8)}…{walletAddress?.slice(-6)}</span>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={status === 'submitting'}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-4 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white font-bold text-lg
                        transition-all duration-300 shadow-lg shadow-hero-blue/30 disabled:opacity-50 disabled:pointer-events-none
                        flex items-center justify-center gap-3"
                    >
                      {status === 'submitting' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Submit Track
                        </>
                      )}
                    </motion.button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
