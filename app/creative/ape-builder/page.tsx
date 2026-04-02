'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Download, Lock, RefreshCw, CheckCircle2,
  Layers, Sparkles, Info,
} from 'lucide-react';
import Nav from '@/app/components/Nav';
import Footer from '@/app/components/Footer';
import { useGlyph } from '@use-glyph/sdk-react';

// ── CDN & canvas constants ────────────────────────────────────────────────────
const CDN_INDEX = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-index';
const OUTPUT_SIZE = 2048;

// ── Trait categories in render order ─────────────────────────────────────────
const LAYER_ORDER = ['Background', 'Fur', 'Clothes', 'Eyes', 'Hat', 'Mouth', 'Earring'] as const;
type TraitCat = typeof LAYER_ORDER[number];

const OPTIONAL = new Set<TraitCat>(['Clothes', 'Hat', 'Earring']);
const REQUIRED: TraitCat[] = ['Background', 'Fur', 'Eyes', 'Mouth'];

const CATEGORY_LABELS: Record<TraitCat, string> = {
  Background: 'Background',
  Fur: 'Fur',
  Clothes: 'Clothes',
  Eyes: 'Eyes',
  Hat: 'Hat',
  Mouth: 'Mouth',
  Earring: 'Earring',
};

// ── Trait → local asset path (matches /public/traits/**) ─────────────────────
const ASSET: Record<string, Record<string, string>> = {
  Background: {
    Ape: '/traits/Background/background.png',
  },
  Clothes: {
    'Admirals Coat': '/traits/Clothes/admiral-coat.png',
    Bandolier: '/traits/Clothes/bandolier.png',
    'Biker Vest': '/traits/Clothes/biker-vest.png',
    'Black Holes T': '/traits/Clothes/black-holes-t.png',
    'Black Suit': '/traits/Clothes/black-suit.png',
    'Black T': '/traits/Clothes/black-t.png',
    'Blue Dress': '/traits/Clothes/blue-dress.png',
    'Bone Necklace': '/traits/Clothes/bone-necklace.png',
    'Bone Tee': '/traits/Clothes/bone-tee.png',
    'Caveman Pelt': '/traits/Clothes/caveman-pelt.png',
    'Cowboy Shirt': '/traits/Clothes/cowboy-shirt.png',
    Guayabera: '/traits/Clothes/guayabera.png',
    Hawaiian: '/traits/Clothes/hawaiian.png',
    'Hip Hop': '/traits/Clothes/hip-hop.png',
    "King's Robe": '/traits/Clothes/kings-robe.png',
    'Lab Coat': '/traits/Clothes/lab-coat.png',
    'Leather Jacket': '/traits/Clothes/leather-jacket.png',
    'Leather Punk Jacket': '/traits/Clothes/leather-punk-jacket.png',
    'Lumberjack Shirt': '/traits/Clothes/lumberjack-shirt.png',
    'Navy Striped T': '/traits/Clothes/navy-striped-t.png',
    'Pimp Coat': '/traits/Clothes/pimp-coat.png',
    'Prison Jumpsuit': '/traits/Clothes/prison-jumpsuit.png',
    'Prom Dress': '/traits/Clothes/prom-dress.png',
    'Puffy Vest': '/traits/Clothes/puffy-vest.png',
    'Rainbow Suspender': '/traits/Clothes/rainbow-suspenders.png',
    'Rainbow Suspenders': '/traits/Clothes/rainbow-suspenders.png',
    'Sailor Shirt': '/traits/Clothes/sailor-shirt.png',
    'Sleeveless T': '/traits/Clothes/sleeveless-t.png',
    'Smoking Jacket': '/traits/Clothes/smoking-jacket.png',
    'Space Suit': '/traits/Clothes/space-suit.png',
    'Striped Tee': '/traits/Clothes/striped-tee.png',
    'Stunt Jacket': '/traits/Clothes/stunt-jacket.png',
    Tanktop: '/traits/Clothes/tanktop.png',
    'Tie Dye': '/traits/Clothes/tie-dye.png',
    Toga: '/traits/Clothes/toga.png',
    'Tuxedo Tee': '/traits/Clothes/tuxedo-tee.png',
    'Tweed Suit': '/traits/Clothes/tweed-suit.png',
    'Vietnam Jacket': '/traits/Clothes/vietnam-jacket.png',
    'Wool Turtleneck': '/traits/Clothes/wool-turtleneck.png',
    'Work Vest': '/traits/Clothes/work-vest.png',
  },
  Earring: {
    Cross: '/traits/Earring/cross.png',
    'Diamond Stud': '/traits/Earring/diamond-earring.png',
    'Gold Hoop': '/traits/Earring/gold-hoop.png',
    'Gold Stud': '/traits/Earring/gold-stud.png',
    'Silver Hoop': '/traits/Earring/silver-hoop.png',
    'Silver Stud': '/traits/Earring/silver-stud.png',
  },
  Eyes: {
    Angry: '/traits/Eyes/angry.png',
    Blindfold: '/traits/Eyes/blindfold.png',
    Bloodshot: '/traits/Eyes/bloodshot.png',
    'Blue Beams': '/traits/Eyes/blue-beams.png',
    Bored: '/traits/Eyes/bored.png',
    Closed: '/traits/Eyes/closed.png',
    Coins: '/traits/Eyes/coins.png',
    Crazy: '/traits/Eyes/crazy.png',
    Cyborg: '/traits/Eyes/cyborg.png',
    Eyepatch: '/traits/Eyes/eyepatch.png',
    Heart: '/traits/Eyes/heart.png',
    Holographic: '/traits/Eyes/holographic.png',
    Hypnotized: '/traits/Eyes/hypnotized.png',
    Laser: '/traits/Eyes/Laser.png',
    'Laser Eyes': '/traits/Eyes/laser-eyes.png',
    'NOT A CULT glasses': '/traits/Eyes/3d-glasses.png',
    Robot: '/traits/Eyes/robot.png',
    Sad: '/traits/Eyes/sad.png',
    Scumbag: '/traits/Eyes/scumbag.png',
    Sleepy: '/traits/Eyes/sleepy.png',
    Sunglasses: '/traits/Eyes/sunglasses.png',
    'Wide Eyed': '/traits/Eyes/wide-eyed.png',
    'X Eyes': '/traits/Eyes/x-eyes.png',
    Zombie: '/traits/Eyes/zombie.png',
  },
  Fur: {
    Black: '/traits/Fur/black-fur.png',
    Blue: '/traits/Fur/blue-fur.png',
    Brown: '/traits/Fur/brown-fur.png',
    Cheetah: '/traits/Fur/cheetah-fur.png',
    Cream: '/traits/Fur/cream-fur.png',
    'Dark Brown': '/traits/Fur/dark-brown-fur.png',
    'Death Bot': '/traits/Fur/deathbot-fur.png',
    Dmt: '/traits/Fur/dmt-fur.png',
    'Golden Brown': '/traits/Fur/golden-brown-fur.png',
    Gray: '/traits/Fur/gray-fur.png',
    Noise: '/traits/Fur/noise-fur.png',
    Pink: '/traits/Fur/pink-fur.png',
    Red: '/traits/Fur/red-fur.png',
    Robot: '/traits/Fur/robot-fur.png',
    'Solid Gold': '/traits/Fur/solid-gold-fur.png',
    Tan: '/traits/Fur/tan-fur.png',
    Trippy: '/traits/Fur/trippy-fur.png',
    White: '/traits/Fur/white-fur.png',
    Zombie: '/traits/Fur/zombie-fur.png',
  },
  Hat: {
    'Army Hat': '/traits/Hat/army-hat.png',
    "Baby's Bonnet": '/traits/Hat/baby-bonnet.png',
    'Bandana Blue': '/traits/Hat/bandana-blue.png',
    Beanie: '/traits/Hat/beanie.png',
    Bowler: '/traits/Hat/bowler.png',
    'Bunny Ears': '/traits/Hat/bunny-ears.png',
    'Commie Hat': '/traits/Hat/commie-hat.png',
    'Cowboy Hat': '/traits/Hat/cowboy-hat.png',
    Fez: '/traits/Hat/fez.png',
    "Fisherman's Hat": '/traits/Hat/fisherman-hat.png',
    'Flipped Brim': '/traits/Hat/flipped-brim.png',
    "Girl's Hair Pink": '/traits/Hat/girl-hair-pink.png',
    "Girl's Hair Short": '/traits/Hat/girls-hair-short.png',
    Halo: '/traits/Hat/halo.png',
    Horns: '/traits/Hat/horns.png',
    'Irish Boho': '/traits/Hat/irish-boho.png',
    "King's Crown": '/traits/Hat/kings-crown.png',
    'Laurels Wreath': '/traits/Hat/laurels-wreath.png',
    'Party Hat 1': '/traits/Hat/party-hat-1.png',
    'Party Hat 2': '/traits/Hat/party-hat-2.png',
    'Prussian Helmet': '/traits/Hat/prussian-helmet.png',
    'S&m Hat': '/traits/Hat/s&m-hat.png',
    Safari: '/traits/Hat/safari.png',
    "Sea Captain's Hat": '/traits/Hat/sea-captain-hat.png',
    "Seaman's Hat": '/traits/Hat/seaman-hat.png',
    'Spinner Hat': '/traits/Hat/spinner-hat.png',
    'Sushi Chef Headband': '/traits/Hat/sushi-chef-headband.png',
    "Trippy Captain's Hat": '/traits/Hat/trippy-captain-hat.png',
    'Vietnam Era Helmet': '/traits/Hat/vietnam-era-helmet.png',
  },
  Mouth: {
    Bored: '/traits/Mouth/bored.png',
    'Bored Bubblegum': '/traits/Mouth/bored-bubblegum.png',
    'Bored Cigar': '/traits/Mouth/bored-cigar.png',
    'Bored Cigarette': '/traits/Mouth/bored-cigarette.png',
    'Bored Dagger': '/traits/Mouth/bored-dagger.png',
    'Bored Kazoo': '/traits/Mouth/bored-kazoo.png',
    'Bored Party Horn': '/traits/Mouth/bored-party-horn.png',
    'Bored Pipe': '/traits/Mouth/bored-pipe.png',
    'Bored Pizza': '/traits/Mouth/bored-pizza.png',
    'Bored Unshaven': '/traits/Mouth/bored-unshaven.png',
    'Bored Unshaven Bubblegum': '/traits/Mouth/bored-unshaven-bubblegum.png',
    'Bored Unshaven Cigar': '/traits/Mouth/bored-unshaven-cigar.png',
    'Bored Unshaven Cigarette': '/traits/Mouth/bored-unshaven-cigarette.png',
    'Bored Unshaven Dagger': '/traits/Mouth/bored-unshaven-dagger.png',
    'Bored Unshaven Kazoo': '/traits/Mouth/bored-unshaven-kazoo.png',
    'Bored Unshaven Party Horn': '/traits/Mouth/bored-unshaven-partyhorn.png',
    'Bored Unshaven Pipe': '/traits/Mouth/bored-unshaven-pipe.png',
    'Bored Unshaven Pizza': '/traits/Mouth/bored-unshaven-pizza.png',
    Discomfort: '/traits/Mouth/discomfort.png',
    Dumbfounded: '/traits/Mouth/dumbfounded.png',
    Grin: '/traits/Mouth/grin.png',
    'Grin Diamond Grill': '/traits/Mouth/diamond-grill.png',
    'Grin Gold Grill': '/traits/Mouth/gold-grill.png',
    'Grin Multicolored': '/traits/Mouth/rainbow-grill.png',
    'Grin Multicolored Grill': '/traits/Mouth/rainbow-grill.png',
    Jovial: '/traits/Mouth/jovial.png',
    'Phoneme L': '/traits/Mouth/phoneme-l.png',
    'Phoneme Oh': '/traits/Mouth/phoneme-oh.png',
    'Phoneme Ooo': '/traits/Mouth/phoneme-ooo.png',
    'Phoneme Vuh': '/traits/Mouth/phoneme-vuh.png',
    'Phoneme Wah': '/traits/Mouth/phoneme-wah.png',
    Rage: '/traits/Mouth/rage.png',
    'Small Grin': '/traits/Mouth/small-grin.png',
    'Tongue Out': '/traits/Mouth/tongue-out.png',
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Selection = Partial<Record<TraitCat, string>>;
type OwnedTraits = Record<TraitCat, Map<string, number>>;
type TokenRecord = {
  id: number;
  attributes: Array<{ trait_type?: string; type?: string; value: string }>;
};

function initOwned(): OwnedTraits {
  return Object.fromEntries(LAYER_ORDER.map(c => [c, new Map<string, number>()])) as OwnedTraits;
}

// ── Canvas composition ────────────────────────────────────────────────────────
async function composeCanvas(sel: Selection): Promise<string | null> {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

  for (const cat of LAYER_ORDER) {
    const value = sel[cat];
    if (!value) {
      if (!OPTIONAL.has(cat)) return null;
      continue;
    }
    const path = ASSET[cat]?.[value];
    if (!path) {
      if (!OPTIONAL.has(cat)) return null;
      continue;
    }
    try {
      const img = await loadImg(path);
      ctx.drawImage(img, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    } catch {
      if (!OPTIONAL.has(cat)) return null;
    }
  }
  return canvas.toDataURL('image/png');
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApeBuilderPage() {
  const glyphHook = useGlyph();
  // useGlyph may return { glyph } or the object itself — handle both shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glyph = (glyphHook as any)?.glyph ?? glyphHook;

  // glyphReady: true once we've given Glyph enough time to hydrate
  const [glyphReady, setGlyphReady] = useState(false);
  useEffect(() => {
    // If wallet data is already present, mark ready immediately
    const hasWallet = !!(
      glyph?.user?.evmWallet ||
      glyph?.user?.smartWallet ||
      glyph?.address ||
      glyph?.user?.linkedWallets?.length
    );
    if (hasWallet) { setGlyphReady(true); return; }
    // Otherwise give Glyph up to 2.5 seconds to populate
    const t = setTimeout(() => setGlyphReady(true), 2500);
    return () => clearTimeout(t);
  }, [glyph?.user?.evmWallet, glyph?.user?.smartWallet, glyph?.address, glyph?.user?.linkedWallets]); // eslint-disable-line react-hooks/exhaustive-deps

  const allAddresses = useMemo<string[]>(() => {
    const primary = glyph?.user?.evmWallet ?? glyph?.user?.smartWallet ?? glyph?.address ?? '';
    const linked  = glyph?.user?.linkedWallets?.map((w: { address?: string }) => (w?.address ?? '').trim()).filter(Boolean) ?? [];
    return Array.from(new Set([primary, ...linked].map((a: string) => a.toLowerCase()).filter(Boolean)));
  }, [glyph?.user?.evmWallet, glyph?.user?.smartWallet, glyph?.user?.linkedWallets, glyph?.address]);  // eslint-disable-line react-hooks/exhaustive-deps

  const walletAddress = allAddresses[0] ?? '';

  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [ownedTraits, setOwnedTraits] = useState<OwnedTraits | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingTraits, setLoadingTraits] = useState(false);
  const [portfolioError, setPortfolioError] = useState(false);

  const [activeCategory, setActiveCategory] = useState<TraitCat>('Fur');
  const [selection, setSelection] = useState<Selection>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  // ── Fetch owned token IDs ────────────────────────────────────────────────
  const fetchPortfolio = useCallback(async () => {
    if (!allAddresses.length) return;
    setLoadingPortfolio(true);
    setPortfolioError(false);
    try {
      const params = new URLSearchParams();
      allAddresses.forEach(a => params.append('addresses', a));
      const res = await fetch(`/api/portfolio?${params}`);
      const data = await res.json();
      setOwnedIds(data.tokenIds || []);
    } catch {
      setPortfolioError(true);
    } finally {
      setLoadingPortfolio(false);
    }
  }, [allAddresses.join(',')]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  // ── Fetch traits from CDN for owned tokens ───────────────────────────────
  useEffect(() => {
    if (!ownedIds.length) return;
    setLoadingTraits(true);
    const ownedSet = new Set(ownedIds);

    fetch(`${CDN_INDEX}/tokens.json`)
      .then(r => r.json())
      .then((tokens: TokenRecord[]) => {
        const owned = initOwned();
        for (const token of tokens) {
          if (!ownedSet.has(token.id)) continue;
          for (const attr of token.attributes || []) {
            const cat = (attr.trait_type || attr.type || '') as TraitCat;
            if (!LAYER_ORDER.includes(cat)) continue;
            const val = attr.value;
            owned[cat].set(val, (owned[cat].get(val) ?? 0) + 1);
          }
        }
        setOwnedTraits(owned);
      })
      .catch(console.error)
      .finally(() => setLoadingTraits(false));
  }, [ownedIds.join(',')]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live canvas preview ──────────────────────────────────────────────────
  useEffect(() => {
    const hasRequired = REQUIRED.every(c => selection[c]);
    if (!hasRequired) { setPreviewUrl(null); return; }

    let cancelled = false;
    setComposing(true);
    composeCanvas(selection).then(url => {
      if (!cancelled) { setPreviewUrl(url); setComposing(false); }
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(selection)]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (cat: TraitCat, value: string) => {
    setSelection(prev => ({
      ...prev,
      [cat]: prev[cat] === value ? undefined : value,
    }));
  };

  const handleReset = () => { setSelection({}); setPreviewUrl(null); };

  const handleDownload = async () => {
    const url = previewUrl || await composeCanvas(selection);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-custom-ape.png';
    a.click();
  };

  const completedRequired = REQUIRED.filter(c => selection[c]).length;
  const isReady = completedRequired === REQUIRED.length;

  // ── Spinner while Glyph is still hydrating ───────────────────────────────
  if (!glyphReady) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-hero-blue/30 border-t-hero-blue animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Gated: confirmed not connected ───────────────────────────────────────
  if (!walletAddress) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-6 max-w-md"
          >
            <div className="w-20 h-20 rounded-2xl bg-hero-blue/10 border border-hero-blue/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-hero-blue/60" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Connect Your Wallet</h2>
            <p className="text-white/40 leading-relaxed">
              Connect your wallet to see the traits from your Apes and build your custom combination.
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  const isLoading = loadingPortfolio || loadingTraits;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 pt-24 pb-16">
        <div className="container-premium">

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hero-blue/10 border border-hero-blue/30 mb-4">
              <Wand2 className="w-4 h-4 text-hero-blue" />
              <span className="text-sm font-bold uppercase tracking-widest text-hero-blue">Ape Builder</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-3">
              Build Your Ape
            </h1>
            <p className="text-white/45 text-lg max-w-xl">
              Mix and match traits from the Apes you own. Only your traits. Your combinations.
            </p>
          </motion.div>

          {/* ── Error / loading guards ── */}
          {portfolioError && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3">
              <Info className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">Couldn&apos;t reach the blockchain. </span>
              <button onClick={fetchPortfolio} className="text-sm text-hero-blue hover:text-hero-blue-light flex items-center gap-1 ml-auto">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-hero-blue/30 border-t-hero-blue animate-spin" />
              <p className="text-white/40 text-sm">
                {loadingPortfolio ? 'Loading your Apes…' : 'Reading your traits…'}
              </p>
            </div>
          )}

          {!isLoading && ownedIds.length === 0 && !portfolioError && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Layers className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Apes Found</h3>
              <p className="text-white/35 max-w-sm">
                This wallet doesn&apos;t hold any Apes on Ape. Pick one up on OpenSea to unlock the builder.
              </p>
              <a
                href="https://opensea.io/collection/apes-on-apechain"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 px-6 py-3 rounded-xl bg-hero-blue text-white font-bold hover:bg-hero-blue-light transition-colors"
              >
                Buy on OpenSea
              </a>
            </div>
          )}

          {/* ── Main builder UI ── */}
          {!isLoading && ownedTraits && ownedIds.length > 0 && (
            <div className="grid lg:grid-cols-5 gap-6">

              {/* ── Left: Category tabs + trait grid ── */}
              <div className="lg:col-span-3 flex flex-col gap-5">

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm text-white/40">
                  <span className="font-semibold text-white">{ownedIds.length}</span> Apes owned
                  <span>·</span>
                  <span className="font-semibold text-white">
                    {LAYER_ORDER.reduce((acc, c) => acc + ownedTraits[c].size, 0)}
                  </span> unique traits unlocked
                  <button
                    onClick={handleReset}
                    className="ml-auto flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Category tabs */}
                <div className="flex flex-wrap gap-2">
                  {LAYER_ORDER.map(cat => {
                    const count = ownedTraits[cat].size;
                    const selected = selection[cat];
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          isActive
                            ? 'bg-hero-blue text-white border-hero-blue shadow-lg shadow-hero-blue/25'
                            : 'bg-white/3 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white/8 text-white/40'
                        }`}>{count}</span>
                        {selected && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-hero-blue border-2 border-background" />
                        )}
                        {!OPTIONAL.has(cat) && !selected && count > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400/80 border-2 border-background" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Trait selection note */}
                {!OPTIONAL.has(activeCategory) && !selection[activeCategory] && (
                  <div className="flex items-center gap-2 text-xs text-amber-400/70 bg-amber-400/5 border border-amber-400/15 rounded-lg px-3 py-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    Required — select a {activeCategory} to preview your Ape
                  </div>
                )}

                {/* Trait grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {ownedTraits[activeCategory].size === 0 ? (
                      <div className="py-12 text-center text-white/25 text-sm">
                        None of your Apes have a {activeCategory} trait.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {Array.from(ownedTraits[activeCategory].entries())
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([value, count]) => {
                            const assetPath = ASSET[activeCategory]?.[value];
                            const isSelected = selection[activeCategory] === value;
                            return (
                              <button
                                key={value}
                                onClick={() => handleSelect(activeCategory, value)}
                                className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-200 ${
                                  isSelected
                                    ? 'border-hero-blue shadow-lg shadow-hero-blue/30 ring-2 ring-hero-blue/40 scale-[1.03]'
                                    : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
                                }`}
                              >
                                {/* Trait preview image */}
                                <div className={`aspect-square relative overflow-hidden ${
                                  isSelected ? 'bg-hero-blue/10' : 'bg-white/3'
                                }`}>
                                  {assetPath ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={assetPath}
                                      alt={value}
                                      className="w-full h-full object-contain p-1.5"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Sparkles className="w-6 h-6 text-white/15" />
                                    </div>
                                  )}

                                  {/* Selected checkmark */}
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-hero-blue drop-shadow" />
                                    </div>
                                  )}

                                  {/* Count badge */}
                                  {count > 1 && (
                                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-white/70">
                                      ×{count}
                                    </div>
                                  )}
                                </div>

                                {/* Label */}
                                <div className={`px-2 py-1.5 text-center ${
                                  isSelected ? 'bg-hero-blue/15' : 'bg-white/[0.03]'
                                }`}>
                                  <span className={`text-[11px] font-semibold leading-tight line-clamp-2 ${
                                    isSelected ? 'text-hero-blue' : 'text-white/55'
                                  }`}>
                                    {value}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Required traits progress */}
                <div className="mt-2 p-4 rounded-xl bg-white/3 border border-white/8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Required traits</span>
                    <span className={`text-xs font-bold ${isReady ? 'text-green-400' : 'text-white/30'}`}>
                      {completedRequired}/{REQUIRED.length}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {REQUIRED.map(cat => {
                      const val = selection[cat];
                      return (
                        <div
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                            val
                              ? 'bg-hero-blue/15 border-hero-blue/40 text-hero-blue'
                              : 'bg-white/3 border-white/10 text-white/30 hover:border-white/20'
                          }`}
                        >
                          {val ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-white/20" />
                          )}
                          <span>{cat}</span>
                          {val && <span className="text-white/40 text-[10px]">— {val}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Right: Preview panel ── */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="sticky top-24 flex flex-col gap-4">

                  {/* Canvas preview */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/3">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Your custom Ape"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                        <Wand2 className={`w-12 h-12 ${isReady ? 'text-hero-blue animate-pulse' : 'text-white/10'}`} />
                        <p className="text-white/30 text-sm">
                          {isReady
                            ? 'Composing your Ape…'
                            : `Select ${REQUIRED.filter(c => !selection[c]).join(', ')} to preview`}
                        </p>
                      </div>
                    )}

                    {composing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-full border-2 border-hero-blue/30 border-t-hero-blue animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    disabled={!previewUrl}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-hero-blue hover:bg-hero-blue-light disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-hero-blue/25 hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>

                  {/* Current selection summary */}
                  {Object.values(selection).some(Boolean) && (
                    <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-white/35 mb-3">
                        Your Selection
                      </div>
                      {LAYER_ORDER.map(cat => {
                        const val = selection[cat];
                        if (!val) return null;
                        return (
                          <div key={cat} className="flex items-center justify-between text-xs">
                            <span className="text-white/35">{cat}</span>
                            <span className="text-white/70 font-medium">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hint */}
                  <div className="flex items-start gap-2 text-xs text-white/25">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Only traits from your Apes are shown. Each badge shows how many of your Apes share that trait.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
