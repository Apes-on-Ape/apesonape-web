'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Upload, X, CheckCircle2, AlertCircle, Filter, Palette, Layers } from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { useGlyph } from '@use-glyph/sdk-react';

const TOOLS = ['All', 'pfp-border', 'banner', 'qr', 'ai-studio'];
const TOOL_LABELS: Record<string, string> = {
  'All': 'All',
  'pfp-border': 'PFP Borders',
  'banner': 'Banners',
  'qr': 'QR Codes',
  'ai-studio': 'AI Studio',
};

type GalleryItem = {
  id: string;
  wallet_address: string;
  ape_id?: number;
  title: string;
  image_url: string;
  tool_used?: string;
  created_at: string;
  likes?: number;
};

// Placeholder items to show when the gallery is empty or loading
const PLACEHOLDER_ITEMS: GalleryItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: `placeholder-${i}`,
  wallet_address: '',
  title: '',
  image_url: '',
  created_at: '',
}));

function GalleryCard({ item, isPlaceholder }: { item: GalleryItem; isPlaceholder?: boolean }) {
  const [imgError, setImgError] = useState(false);

  if (isPlaceholder) {
    return <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-hero-blue/40 transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="aspect-square relative bg-white/5">
        {item.image_url && !imgError ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-white/15" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <div className="font-bold text-white text-sm truncate">{item.title}</div>
          {item.ape_id && (
            <Link href={`/collection/${item.ape_id}`} onClick={e => e.stopPropagation()}>
              <span className="text-xs text-hero-blue hover:text-hero-blue-light transition-colors">Ape #{item.ape_id}</span>
            </Link>
          )}
          {item.tool_used && (
            <span className="text-[10px] text-white/40 mt-0.5">{TOOL_LABELS[item.tool_used] || item.tool_used}</span>
          )}
        </div>
      </div>

      {/* Tool badge */}
      {item.tool_used && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-white/60 backdrop-blur-sm">
          {TOOL_LABELS[item.tool_used] || item.tool_used}
        </div>
      )}
    </motion.div>
  );
}

function UploadModal({ onClose, wallet }: { onClose: () => void; wallet: string }) {
  const [form, setForm] = useState({ title: '', tool: '', apeId: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !form.title) return;
    setStatus('submitting');
    try {
      const fd = new FormData();
      fd.append('wallet', wallet);
      fd.append('title', form.title);
      fd.append('tool', form.tool);
      fd.append('apeId', form.apeId);
      fd.append('image', file);
      const res = await fetch('/api/gallery', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Submitted for review!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Upload failed.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/15 p-8"
        style={{ background: 'rgba(10, 10, 20, 0.98)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Submit to Gallery</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Submitted!</h3>
            <p className="text-white/40 text-sm">{message}</p>
            <p className="text-white/25 text-xs mt-2">Your item will appear once reviewed.</p>
            <button onClick={onClose} className="mt-6 px-6 py-3 rounded-xl bg-hero-blue text-white font-bold hover:bg-hero-blue-light transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${preview ? 'border-hero-blue/40' : 'border-white/15 hover:border-hero-blue/40'} overflow-hidden`}
            >
              {preview ? (
                <Image src={preview} alt="Preview" fill className="object-contain" unoptimized />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">PNG, JPG, GIF up to 10MB</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              placeholder="Give your creation a title…"
              maxLength={100}
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25
                focus:outline-none focus:border-hero-blue/50 transition-all"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.tool}
                onChange={e => setForm(f => ({ ...f, tool: e.target.value }))}
                className="px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-hero-blue/50 transition-all"
              >
                <option value="">Tool used</option>
                {TOOLS.filter(t => t !== 'All').map(t => (
                  <option key={t} value={t}>{TOOL_LABELS[t]}</option>
                ))}
              </select>
              <input
                value={form.apeId}
                onChange={e => setForm(f => ({ ...f, apeId: e.target.value }))}
                type="number" min={1} max={10000}
                placeholder="Ape ID (optional)"
                className="px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25
                  focus:outline-none focus:border-hero-blue/50 transition-all"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !form.title || status === 'submitting'}
              className="w-full py-3.5 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white font-bold transition-all
                shadow-lg shadow-hero-blue/30 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-4 h-4" /> Submit to Gallery</>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const glyph = (useGlyph() as unknown) as { user?: { evmWallet?: string; smartWallet?: string; linkedWallets?: Array<{ address?: string }> }; address?: string };
  const walletAddress = glyph?.user?.evmWallet || glyph?.user?.smartWallet || glyph?.user?.linkedWallets?.[0]?.address || glyph?.address;

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1' });
    if (activeTool !== 'All') params.set('tool', activeTool);
    fetch(`/api/gallery?${params}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setTotal(d.total || 0); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeTool]);

  return (
    <div className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-hero-blue/8 via-transparent to-transparent" />
        <div className="container-premium relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hero-blue/10 border border-hero-blue/30 mb-6">
              <Palette className="w-4 h-4 text-hero-blue" />
              <span className="text-sm font-semibold tracking-widest uppercase text-hero-blue">Community Gallery</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              <span className="text-gradient">Made by Apes</span>
            </h1>
            <p className="text-lg text-white/55 max-w-xl mx-auto mb-8">
              Creations built with AOA tools by the community. PFP borders, banners, AI art, and more.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {walletAddress ? (
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-hero-blue hover:bg-hero-blue-light text-white font-bold transition-all shadow-lg shadow-hero-blue/30 hover:-translate-y-0.5"
                >
                  <Upload className="w-4 h-4" /> Submit Your Creation
                </button>
              ) : (
                <span className="text-sm text-white/30 px-6 py-3.5">Sign in to submit your creations</span>
              )}
              <Link href="/creative" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 hover:border-hero-blue/40 text-white/70 hover:text-white font-medium transition-all">
                <Layers className="w-4 h-4" /> AOA Creative Tools
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container-premium pb-20">
        {/* Filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <Filter className="w-4 h-4 text-white/30" />
          {TOOLS.map(tool => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTool === tool
                  ? 'bg-hero-blue/20 border border-hero-blue/50 text-hero-blue'
                  : 'bg-white/3 border border-white/10 text-white/50 hover:text-white hover:border-white/25'
                }`}
            >
              {TOOL_LABELS[tool]}
            </button>
          ))}
        </div>

        {/* Stats */}
        {!loading && total > 0 && (
          <div className="text-sm text-white/30 mb-6">{total.toLocaleString()} community creations</div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {PLACEHOLDER_ITEMS.map((item, i) => <GalleryCard key={item.id} item={item} isPlaceholder />)}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 border border-white/8 rounded-2xl"
          >
            <ImageIcon className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/30 mb-2">Gallery is empty</h3>
            <p className="text-sm text-white/20 mb-6">Be the first to submit a creation!</p>
            {walletAddress && (
              <button
                onClick={() => setShowUpload(true)}
                className="px-6 py-3 rounded-xl bg-hero-blue text-white font-bold hover:bg-hero-blue-light transition-colors"
              >
                Submit Now
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {items.map(item => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && walletAddress && (
          <UploadModal onClose={() => setShowUpload(false)} wallet={walletAddress} />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
