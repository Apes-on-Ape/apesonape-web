'use client';
export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import { Download, Shirt } from 'lucide-react';
import { useToolTracking } from '@/app/hooks/useToolTracking';
import { magicEdenAPI } from '@/lib/magic-eden';
import SafeImage from '@/app/components/SafeImage';

type ClothingItem = {
  id: string;
  name: string;
  src: string; // overlay asset used on canvas
  category: 'Hats' | 'Tops' | 'Accessories';
  previewSrc?: string; // thumbnail shown in picker
};

type TraitLayer = {
  name: 'Background' | 'Fur' | 'Clothes' | 'Eyes' | 'Hat' | 'Mouth' | 'Earring';
  folder: string;
  optional?: boolean;
};

const TRAIT_LAYERS: TraitLayer[] = [
  { name: 'Background', folder: 'Background' },
  { name: 'Fur', folder: 'Fur' },
  { name: 'Clothes', folder: 'Clothes', optional: true },
  { name: 'Eyes', folder: 'Eyes' },
  { name: 'Hat', folder: 'Hat', optional: true },
  { name: 'Mouth', folder: 'Mouth' },
  { name: 'Earring', folder: 'Earring', optional: true },
];

// Map collection traits to corresponding assets in /public/traits
const TRAIT_ASSET_MAP: Record<string, Record<string, string>> = {
  Background: {
    Ape: 'traits/Background/background.png',
  },
  Clothes: {
    'Admirals Coat': 'traits/Clothes/admiral-coat.png',
    Bandolier: 'traits/Clothes/bandolier.png',
    'Biker Vest': 'traits/Clothes/biker-vest.png',
    'Black Holes T': 'traits/Clothes/black-holes-t.png',
    'Black Suit': 'traits/Clothes/black-suit.png',
    'Black T': 'traits/Clothes/black-t.png',
    'Blue Dress': 'traits/Clothes/blue-dress.png',
    'Bone Necklace': 'traits/Clothes/bone-necklace.png',
    'Bone Tee': 'traits/Clothes/bone-tee.png',
    'Caveman Pelt': 'traits/Clothes/caveman-pelt.png',
    'Cowboy Shirt': 'traits/Clothes/cowboy-shirt.png',
    Guayabera: 'traits/Clothes/guayabera.png',
    Hawaiian: 'traits/Clothes/hawaiian.png',
    'Hip Hop': 'traits/Clothes/hip-hop.png',
    "King's Robe": 'traits/Clothes/kings-robe.png',
    'Lab Coat': 'traits/Clothes/lab-coat.png',
    'Leather Jacket': 'traits/Clothes/leather-jacket.png',
    'Leather Punk Jacket': 'traits/Clothes/leather-punk-jacket.png',
    'Lumberjack Shirt': 'traits/Clothes/lumberjack-shirt.png',
    'Navy Striped T': 'traits/Clothes/navy-striped-t.png',
    'Pimp Coat': 'traits/Clothes/pimp-coat.png',
    'Prison Jumpsuit': 'traits/Clothes/prison-jumpsuit.png',
    'Prom Dress': 'traits/Clothes/prom-dress.png',
    'Puffy Vest': 'traits/Clothes/puffy-vest.png',
    'Rainbow Suspender': 'traits/Clothes/rainbow-suspenders.png',
    'Rainbow Suspenders': 'traits/Clothes/rainbow-suspenders.png',
    'Sailor Shirt': 'traits/Clothes/sailor-shirt.png',
    'Sleeveless T': 'traits/Clothes/sleeveless-t.png',
    'Smoking Jacket': 'traits/Clothes/smoking-jacket.png',
    'Space Suit': 'traits/Clothes/space-suit.png',
    'Striped Tee': 'traits/Clothes/striped-tee.png',
    'Stunt Jacket': 'traits/Clothes/stunt-jacket.png',
    Tanktop: 'traits/Clothes/tanktop.png',
    'Tie Dye': 'traits/Clothes/tie-dye.png',
    Toga: 'traits/Clothes/toga.png',
    'Tuxedo Tee': 'traits/Clothes/tuxedo-tee.png',
    'Tweed Suit': 'traits/Clothes/tweed-suit.png',
    'Vietnam Jacket': 'traits/Clothes/vietnam-jacket.png',
    'Wool Turtleneck': 'traits/Clothes/wool-turtleneck.png',
    'Work Vest': 'traits/Clothes/work-vest.png',
  },
  Earring: {
    Cross: 'traits/Earring/cross.png',
    'Diamond Stud': 'traits/Earring/diamond-earring.png',
    'Gold Hoop': 'traits/Earring/gold-hoop.png',
    'Gold Stud': 'traits/Earring/gold-stud.png',
    'Silver Hoop': 'traits/Earring/silver-hoop.png',
    'Silver Stud': 'traits/Earring/silver-stud.png',
  },
  Eyes: {
    Angry: 'traits/Eyes/angry.png',
    Blindfold: 'traits/Eyes/blindfold.png',
    Bloodshot: 'traits/Eyes/bloodshot.png',
    'Blue Beams': 'traits/Eyes/blue-beams.png',
    Bored: 'traits/Eyes/bored.png',
    Closed: 'traits/Eyes/closed.png',
    Coins: 'traits/Eyes/coins.png',
    Crazy: 'traits/Eyes/crazy.png',
    Cyborg: 'traits/Eyes/cyborg.png',
    Eyepatch: 'traits/Eyes/eyepatch.png',
    Heart: 'traits/Eyes/heart.png',
    Holographic: 'traits/Eyes/holographic.png',
    Hypnotized: 'traits/Eyes/hypnotized.png',
    Laser: 'traits/Eyes/Laser.png',
    'Laser Eyes': 'traits/Eyes/laser-eyes.png',
    'NOT A CULT glasses': 'traits/Eyes/3d-glasses.png',
    Robot: 'traits/Eyes/robot.png',
    Sad: 'traits/Eyes/sad.png',
    Scumbag: 'traits/Eyes/scumbag.png',
    Sleepy: 'traits/Eyes/sleepy.png',
    Sunglasses: 'traits/Eyes/sunglasses.png',
    'Wide Eyed': 'traits/Eyes/wide-eyed.png',
    'X Eyes': 'traits/Eyes/x-eyes.png',
    Zombie: 'traits/Eyes/zombie.png',
  },
  Fur: {
    Black: 'traits/Fur/black-fur.png',
    Blue: 'traits/Fur/blue-fur.png',
    Brown: 'traits/Fur/brown-fur.png',
    Cheetah: 'traits/Fur/cheetah-fur.png',
    Cream: 'traits/Fur/cream-fur.png',
    'Dark Brown': 'traits/Fur/dark-brown-fur.png',
    'Death Bot': 'traits/Fur/deathbot-fur.png',
    Dmt: 'traits/Fur/dmt-fur.png',
    'Golden Brown': 'traits/Fur/golden-brown-fur.png',
    Gray: 'traits/Fur/gray-fur.png',
    Noise: 'traits/Fur/noise-fur.png',
    Pink: 'traits/Fur/pink-fur.png',
    Red: 'traits/Fur/red-fur.png',
    Robot: 'traits/Fur/robot-fur.png',
    'Solid Gold': 'traits/Fur/solid-gold-fur.png',
    Tan: 'traits/Fur/tan-fur.png',
    Trippy: 'traits/Fur/trippy-fur.png',
    White: 'traits/Fur/white-fur.png',
    Zombie: 'traits/Fur/zombie-fur.png',
  },
  Hat: {
    'Army Hat': 'traits/Hat/army-hat.png',
    "Baby's Bonnet": 'traits/Hat/baby-bonnet.png',
    'Bandana Blue': 'traits/Hat/bandana-blue.png',
    Beanie: 'traits/Hat/beanie.png',
    Bowler: 'traits/Hat/bowler.png',
    'Bunny Ears': 'traits/Hat/bunny-ears.png',
    'Commie Hat': 'traits/Hat/commie-hat.png',
    'Cowboy Hat': 'traits/Hat/cowboy-hat.png',
    Fez: 'traits/Hat/fez.png',
    "Fisherman's Hat": 'traits/Hat/fisherman-hat.png',
    'Flipped Brim': 'traits/Hat/flipped-brim.png',
    "Girl's Hair Pink": 'traits/Hat/girl-hair-pink.png',
    "Girl's Hair Short": 'traits/Hat/girls-hair-short.png',
    Halo: 'traits/Hat/halo.png',
    Horns: 'traits/Hat/horns.png',
    'Irish Boho': 'traits/Hat/irish-boho.png',
    "King's Crown": 'traits/Hat/kings-crown.png',
    'Laurels Wreath': 'traits/Hat/laurels-wreath.png',
    'Party Hat 1': 'traits/Hat/party-hat-1.png',
    'Party Hat 2': 'traits/Hat/party-hat-2.png',
    'Prussian Helmet': 'traits/Hat/prussian-helmet.png',
    'S&m Hat': 'traits/Hat/s&m-hat.png',
    Safari: 'traits/Hat/safari.png',
    "Sea Captain's Hat": 'traits/Hat/sea-captain-hat.png',
    "Seaman's Hat": 'traits/Hat/seaman-hat.png',
    'Spinner Hat': 'traits/Hat/spinner-hat.png',
    'Sushi Chef Headband': 'traits/Hat/sushi-chef-headband.png',
    "Trippy Captain's Hat": 'traits/Hat/trippy-captain-hat.png',
    'Vietnam Era Helmet': 'traits/Hat/vietnam-era-helmet.png',
  },
  Mouth: {
    Bored: 'traits/Mouth/bored.png',
    'Bored Bubblegum': 'traits/Mouth/bored-bubblegum.png',
    'Bored Cigar': 'traits/Mouth/bored-cigar.png',
    'Bored Cigarette': 'traits/Mouth/bored-cigarette.png',
    'Bored Dagger': 'traits/Mouth/bored-dagger.png',
    'Bored Kazoo': 'traits/Mouth/bored-kazoo.png',
    'Bored Party Horn': 'traits/Mouth/bored-party-horn.png',
    'Bored Pipe': 'traits/Mouth/bored-pipe.png',
    'Bored Pizza': 'traits/Mouth/bored-pizza.png',
    'Bored Unshaven': 'traits/Mouth/bored-unshaven.png',
    'Bored Unshaven Bubblegum': 'traits/Mouth/bored-unshaven-bubblegum.png',
    'Bored Unshaven Cigar': 'traits/Mouth/bored-unshaven-cigar.png',
    'Bored Unshaven Cigarette': 'traits/Mouth/bored-unshaven-cigarette.png',
    'Bored Unshaven Dagger': 'traits/Mouth/bored-unshaven-dagger.png',
    'Bored Unshaven Kazoo': 'traits/Mouth/bored-unshaven-kazoo.png',
    'Bored Unshaven Party Horn': 'traits/Mouth/bored-unshaven-partyhorn.png',
    'Bored Unshaven Pipe': 'traits/Mouth/bored-unshaven-pipe.png',
    'Bored Unshaven Pizza': 'traits/Mouth/bored-unshaven-pizza.png',
    Discomfort: 'traits/Mouth/discomfort.png',
    Dumbfounded: 'traits/Mouth/dumbfounded.png',
    Grin: 'traits/Mouth/grin.png',
    'Grin Diamond Grill': 'traits/Mouth/diamond-grill.png',
    'Grin Gold Grill': 'traits/Mouth/gold-grill.png',
    'Grin Multicolored': 'traits/Mouth/rainbow-grill.png',
    'Grin Multicolored Grill': 'traits/Mouth/rainbow-grill.png',
    Jovial: 'traits/Mouth/jovial.png',
    'Phoneme L': 'traits/Mouth/phoneme-l.png',
    'Phoneme Oh': 'traits/Mouth/phoneme-oh.png',
    'Phoneme Ooo': 'traits/Mouth/phoneme-ooo.png',
    'Phoneme Vuh': 'traits/Mouth/phoneme-vuh.png',
    'Phoneme Wah': 'traits/Mouth/phoneme-wah.png',
    Rage: 'traits/Mouth/rage.png',
    'Small Grin': 'traits/Mouth/small-grin.png',
    'Tongue Out': 'traits/Mouth/tongue-out.png',
  },
};

const resolveTraitAsset = (traitType: string, value: string | undefined | null) => {
  if (!value) return null;
  const byType = TRAIT_ASSET_MAP[traitType];
  if (!byType) return null;
  const rel = byType[value];
  if (!rel) return null;
  return rel.startsWith('/') ? rel : `/${rel}`;
};

const CLOTHES: ClothingItem[] = [
  // Hats
  { id: 'santa-hat', name: 'Santa Hat', src: '/wardrobe/hats/santa-hat.png', previewSrc: '/wardrobe/hats-preview/santa-hat.png', category: 'Hats' },
  // Tops (reflect current files in public/wardrobe/tops)
  { id: 'santavest', name: 'Santa Vest', src: '/wardrobe/tops/santavest.png', previewSrc: '/wardrobe/tops-preview/santavest-preview.png', category: 'Tops' },
  { id: 'apesuit', name: 'Apesuit', src: '/wardrobe/tops/apesuit.png', previewSrc: '/wardrobe/tops-preview/apesuit.png', category: 'Tops' },
  { id: 'survived-apesuit', name: 'Survived Apesuit', src: '/wardrobe/tops/survived-apesuit.png', previewSrc: '/wardrobe/tops-preview/survived-apesuit.png', category: 'Tops' },
  { id: 'sweater', name: 'Sweater', src: '/wardrobe/tops/sweater.png', previewSrc: '/wardrobe/tops-preview/sweater.png', category: 'Tops' },
];

const CATEGORIES: Array<ClothingItem['category']> = ['Hats', 'Tops', 'Accessories'];

const OUTPUT_SIZE = 4096;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const furToMugSlug = (fur: string) => {
  switch (fur) {
    case 'Dark Brown': return 'darkbrown';
    case 'Death Bot': return 'deathbot';
    case 'Golden Brown': return 'golden-brown';
    case 'Solid Gold': return 'solid-gold';
    default: return slugify(fur);
  }
};
const furToAccessorySlug = (fur: string) => {
  switch (fur) {
    case 'Death Bot': return 'deathbot';
    default: return slugify(fur);
  }
};

export default function WardrobePage() {
  // Track tool usage for gamification
  useToolTracking('wardrobe');

  const [tokenId, setTokenId] = useState<string>('');
  const [loadingNft, setLoadingNft] = useState(false);
  const [baseSrc, setBaseSrc] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ClothingItem['category']>('Hats');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loadedTraits, setLoadedTraits] = useState<Array<{ name: string; value: string }> | null>(null);
  const [keepHat, setKeepHat] = useState<boolean>(false);
  const [keepEyes, setKeepEyes] = useState<boolean>(true);
  const [keepMouth, setKeepMouth] = useState<boolean>(true);
  const [keepClothes, setKeepClothes] = useState<boolean>(false);
  const furColors = useMemo(() => (
    ['Black','Blue','Brown','Cheetah','Cream','Dark Brown','Death Bot','Dmt','Golden Brown','Gray','Noise','Pink','Red','Robot','Solid Gold','Tan','Trippy','White','Zombie'] as const
  ), []);
  type FurColor = typeof furColors[number];
  const [furColor, setFurColor] = useState<FurColor>('Brown');
  const furAccessories = useMemo<ClothingItem[]>(() => {
    const slug = furToAccessorySlug(furColor);
    const build = (
      id: string,
      name: string,
      folder: string,
      slugOverrides?: Partial<Record<FurColor, string>>
    ): ClothingItem => {
      const effectiveSlug = slugOverrides?.[furColor] || slug;
      const path = `/wardrobe/accessories/${folder}/${effectiveSlug}-fur-${folder}.png`;
      return {
        id,
        name,
        src: path,
        previewSrc: path,
        category: 'Accessories',
      };
    };
    return [
      build('bananas', 'Bananas', 'bananas'),
      build('gn1', 'GN1', 'gn1'),
      build('graffiti', 'Graffiti', 'graffiti', { 'Dark Brown': 'dark-brow' }),
      build('kaboom', 'Kaboom', 'kaboom'),
      build('shotgun', 'Shotgun', 'shotgun'),
    ];
  }, [furColor]);

  // Build a base image from on-chain traits, optionally excluding hat
  const composeBaseFromTraits = useCallback(async (
    traits: { name: string; value: string }[],
    opts: { includeHat?: boolean; includeClothes?: boolean; includeEyes?: boolean; includeMouth?: boolean } = {}
  ) => {
    const {
      includeHat = true,
      includeClothes = true,
      includeEyes = true,
      includeMouth = true,
    } = opts;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const load = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    const layers = TRAIT_LAYERS.filter((l) => {
      if (!includeHat && l.name === 'Hat') return false;
      if (!includeClothes && l.name === 'Clothes') return false;
      if (!includeEyes && l.name === 'Eyes') return false;
      if (!includeMouth && l.name === 'Mouth') return false;
      return true;
    });
    for (const layer of layers) {
      const traitValue = traits.find((t) => t.name.toLowerCase() === layer.name.toLowerCase())?.value;
      if (!traitValue) {
        if (!layer.optional) {
          // Required layer missing: abort early
          return null;
        }
        continue;
      }
      const asset = resolveTraitAsset(layer.name, traitValue);
      if (!asset) {
        if (!layer.optional) return null;
        continue;
      }
      try {
        const img = await load(asset);
        ctx.drawImage(img, 0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      } catch (err) {
        console.warn('Missing trait asset', layer.name, traitValue, err);
        if (!layer.optional) return null;
      }
    }
    return canvas.toDataURL('image/png');
  }, []);

  const handleLoadById = useCallback(async () => {
    if (!tokenId.trim() || loadingNft) return;
    setLoadingNft(true);
    setNote(null);
    setSelectedIds(new Set());
    setPreviewUrl(null);
    setLoadedTraits(null);
    try {
      if (!/^\d+$/.test(tokenId.trim())) {
        setNote('Please enter a numeric token ID (e.g., 1234).');
        return;
      }
      const nft = await magicEdenAPI.getNFTByTokenId(tokenId.trim());
      if (!nft) {
        setNote('Token not found. Check the ID and try again.');
        return;
      }
      const furTrait = nft.traits.find((t) => t.name.toLowerCase() === 'fur');
      if (furTrait && furColors.includes(furTrait.value as FurColor)) {
        setFurColor(furTrait.value as FurColor);
      }
      setLoadedTraits(nft.traits);
      // Build a base image from traits, omitting the hat layer so hats can be swapped
      const composed = await composeBaseFromTraits(nft.traits, {
        includeHat: keepHat,
        includeClothes: keepClothes,
        includeEyes: keepEyes,
        includeMouth: keepMouth,
      });
      if (composed) {
        setBaseSrc(composed);
      } else {
        setBaseSrc(nft.image);
        setNote('Could not build from traits, fell back to token image.');
      }
    } catch (err) {
      console.error('Load NFT error:', err);
      setNote('Failed to load NFT. Try again.');
    } finally {
      setLoadingNft(false);
    }
  }, [tokenId, loadingNft, furColors, composeBaseFromTraits, keepHat, keepClothes, keepEyes, keepMouth]);

  // Attempt to prime audio on first interaction to avoid autoplay restrictions
  useEffect(() => {
    function prime() {
      if (!audioRef.current) return;
      audioRef.current.muted = true;
      audioRef.current.play().catch(() => {});
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.muted = false;
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    }
    window.addEventListener('pointerdown', prime);
    window.addEventListener('keydown', prime);
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);

  const getGmMugPath = useCallback((fur: FurColor) => `/wardrobe/accessories/mugs/${furToMugSlug(fur)}-fur-mug.png`, []);
  const [gmMugPreviewOk, setGmMugPreviewOk] = useState(false);
  useEffect(() => {
    const url = getGmMugPath(furColor);
    const img = new window.Image();
    img.onload = () => setGmMugPreviewOk(true);
    img.onerror = () => setGmMugPreviewOk(false);
    img.src = url;
  }, [furColor, getGmMugPath]);

  const gmMugItem = useMemo<ClothingItem | null>(() => (
    gmMugPreviewOk ? {
      id: 'gm-mug',
      name: `GM Mug (${furColor})`,
      src: getGmMugPath(furColor),
      previewSrc: getGmMugPath(furColor),
      category: 'Accessories',
    } : null
  ), [gmMugPreviewOk, getGmMugPath, furColor]);

  const clothesAvailable = useMemo(() => {
    const base = [...CLOTHES, ...furAccessories];
    return gmMugItem ? [...base, gmMugItem] : base;
  }, [gmMugItem, furAccessories]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const item = clothesAvailable.find((c) => c.id === id);
      if (!item) return prev;
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      // allow only one per category: remove others in the same category
      for (const selId of Array.from(next)) {
        const selItem = clothesAvailable.find((c) => c.id === selId);
        if (selItem && selItem.category === item.category) {
          next.delete(selId);
        }
      }
      next.add(id);
      return next;
    });
  }, [clothesAvailable]);

  const compose = useCallback(async (): Promise<string | null> => {
    if (!baseSrc) return null;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const load = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    let base: HTMLImageElement | null = null;
    if (loadedTraits) {
      // Rebuild base on the fly according to selected keep flags
      const rebuilt = await composeBaseFromTraits(loadedTraits, {
        includeHat: keepHat,
        includeClothes: keepClothes,
        includeEyes: keepEyes,
        includeMouth: keepMouth,
      });
      if (rebuilt) {
        base = await load(rebuilt);
      }
    }
    if (!base) {
      base = await load(baseSrc);
    }
    ctx.drawImage(base, 0, 0, base.naturalWidth || base.width, base.naturalHeight || base.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const selected = clothesAvailable.filter((c) => selectedIds.has(c.id));
    for (const item of selected) {
      const overlay = await load(item.src);
      ctx.drawImage(overlay, 0, 0, overlay.naturalWidth || overlay.width, overlay.naturalHeight || overlay.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    }
    return canvas.toDataURL('image/png');
  }, [baseSrc, selectedIds, furColor, clothesAvailable]);

  const handleGeneratePreview = useCallback(async () => {
    if (!baseSrc || isGenerating) return;
    setIsGenerating(true);
    setFlashOn(false);
    try {
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        } catch {}
      }
      // Compose while "mechanic" runs
      const url = await compose();
      // small delay to let the sound breathe
      await new Promise((r) => setTimeout(r, 350));
      setPreviewUrl(url);
      setFlashOn(true);
      setTimeout(() => setFlashOn(false), 300);
    } finally {
      setIsGenerating(false);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    }
  }, [baseSrc, compose, isGenerating]);

  const handleDownload = useCallback(async () => {
    if (!baseSrc) return;
    const url = previewUrl || (await compose());
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ape-wardrobe.png';
    a.click();
  }, [baseSrc, previewUrl, compose]);

  const filtered = clothesAvailable.filter((c) => c.category === activeCategory);

  // When keep toggles change, rebuild base from traits (if present) to reflect selection
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!loadedTraits) return;
      const rebuilt = await composeBaseFromTraits(loadedTraits, {
        includeHat: keepHat,
        includeClothes: keepClothes,
        includeEyes: keepEyes,
        includeMouth: keepMouth,
      });
      if (rebuilt && !cancelled) {
        setBaseSrc(rebuilt);
        setPreviewUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [loadedTraits, keepHat, keepClothes, keepEyes, keepMouth, composeBaseFromTraits]);

  return (
    <div className="min-h-screen relative">
      {/* Lab ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1200px 600px at 20% 10%, rgba(0,255,200,0.08), transparent 60%), radial-gradient(1000px 500px at 80% 20%, rgba(0,200,255,0.06), transparent 60%), linear-gradient(180deg, #02060B 0%, #070B12 50%, #0B0F17 100%)'
        }}
      />
      {/* Subtle moving smoke layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -inset-x-1/4 top-0 h-1/2 opacity-30 blur-2xl" style={{ animation: 'smokeDrift 22s linear infinite' , background: 'radial-gradient(60% 60% at 50% 50%, rgba(180,200,210,0.12), transparent 70%)' }} />
        <div className="absolute -inset-x-1/4 bottom-0 h-1/2 opacity-25 blur-2xl" style={{ animation: 'smokeDrift 28s linear infinite reverse' , background: 'radial-gradient(60% 60% at 50% 50%, rgba(200,220,230,0.10), transparent 70%)' }} />
      </div>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hero-blue/10 border border-hero-blue/30 mb-3">
            <Shirt className="w-4 h-4 text-hero-blue" />
            <span className="text-xs text-hero-blue">Wardrobe</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
            Ape Wardrobe
          </h1>
          <p className="text-off-white/80 mt-2 max-w-2xl">
            Step into the scientist’s workshop. Upload a 4096×4096 Ape, select overlays, then generate with a flash of chaotic genius.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-dark rounded-xl p-4 border border-white/10 space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--foreground)' }}>Ape Token ID</label>
              <div className="flex gap-2">
                <input
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="e.g. 1234"
                  className="flex-1 rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-hero-blue/40"
                />
                <button className="btn-secondary whitespace-nowrap" onClick={handleLoadById} disabled={!tokenId.trim() || loadingNft}>
                  {loadingNft ? 'Loading…' : 'Load NFT'}
                </button>
              </div>
              <div className="text-xs text-off-white/60 mt-2">Loads image and traits from IPFS via tokenURI.</div>
              {note && <div className="text-xs text-red-400 mt-2">{note}</div>}
            </div>
              {/* GM Arm configuration removed; use Accessories tile to toggle */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center gap-2 mb-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`px-3 py-1.5 rounded-md text-sm border ${activeCategory === cat ? 'border-hero-blue/50 bg-hero-blue/10' : 'border-white/10 hover:bg-white/10'}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Trait keep toggles */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <label className="flex items-center gap-2 text-xs text-off-white/80">
                  <input type="checkbox" checked={keepHat} onChange={() => setKeepHat((v) => !v)} className="accent-hero-blue" />
                  Keep Hat
                </label>
                <label className="flex items-center gap-2 text-xs text-off-white/80">
                  <input type="checkbox" checked={keepClothes} onChange={() => setKeepClothes((v) => !v)} className="accent-hero-blue" />
                  Keep Clothes
                </label>
                <label className="flex items-center gap-2 text-xs text-off-white/80">
                  <input type="checkbox" checked={keepEyes} onChange={() => setKeepEyes((v) => !v)} className="accent-hero-blue" />
                  Keep Eyes
                </label>
                <label className="flex items-center gap-2 text-xs text-off-white/80">
                  <input type="checkbox" checked={keepMouth} onChange={() => setKeepMouth((v) => !v)} className="accent-hero-blue" />
                  Keep Mouth
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filtered.length === 0 && (
                  <div className="text-sm text-off-white/60 col-span-2">No items yet.</div>
                )}
                {filtered.map((item) => {
                  const isOn = selectedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      className={`relative rounded-lg border p-2 text-left transition-colors ${isOn ? 'border-hero-blue/60 bg-hero-blue/10' : 'border-white/10 hover:bg-white/10'}`}
                      onClick={() => toggleSelect(item.id)}
                      title={item.name}
                    >
                      <SafeImage src={item.previewSrc || item.src} alt={item.name} className="w-full aspect-square object-contain rounded-md bg-black/30" width={512} height={512} unoptimized />
                      <div className="mt-2 text-xs" style={{ color: 'var(--foreground)' }}>{item.name}</div>
                      {isOn && <div className="absolute top-2 right-2 text-hero-blue text-xs">Selected</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleGeneratePreview}
                disabled={!baseSrc || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Preview'}
              </button>
              <button
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleDownload}
                disabled={!baseSrc}
              >
                <Download className="w-5 h-5" /> Download PNG
              </button>
            </div>

            <button
              className="w-full inline-flex items-center justify-center gap-2 text-xs opacity-60 hover:opacity-100 transition"
              onClick={() => setPreviewUrl(null)}
              disabled={!previewUrl}
            >
              Reset preview
            </button>
          </div>

          <div className="lg:col-span-2">
            <div
              className="relative rounded-xl border border-white/10 overflow-hidden"
              style={{ width: '100%', aspectRatio: '1 / 1' }}
            >
              {/* Lab backdrop inside the stage */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(65% 65% at 50% 40%, rgba(10,30,45,0.9), rgba(6,12,20,0.95) 60%, rgba(2,6,11,1) 100%)'
                }}
              />
              <div className="absolute inset-0 pointer-events-none">
                {/* subtle grid */}
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                  }}
                />
                {/* neon frame */}
                <div className="absolute inset-2 rounded-xl" style={{ boxShadow: 'inset 0 0 80px rgba(0,255,220,0.08), 0 0 40px rgba(0,200,255,0.06)' }} />
                {/* smoke wisps over stage */}
                <div className="absolute -inset-x-1/3 -top-4 h-1/2 opacity-25 blur-2xl" style={{ animation: 'smokeDrift 18s linear infinite', background: 'radial-gradient(50% 50% at 50% 50%, rgba(210,230,240,0.10), transparent 70%)' }} />
                <div className="absolute -inset-x-1/3 -bottom-4 h-1/2 opacity-2 blur-2xl" style={{ animation: 'smokeDrift 26s linear infinite reverse', background: 'radial-gradient(50% 50% at 50% 50%, rgba(210,230,240,0.08), transparent 70%)' }} />
              </div>

              {/* Preview or live composition */}
              {baseSrc ? (
                <>
                  {previewUrl ? (
                    <SafeImage src={previewUrl} alt="Generated Preview" className="absolute inset-0 w-full h-full object-contain" fill unoptimized />
                  ) : (
                    <>
                      {/* Live layered preview before generation */}
                      <SafeImage src={baseSrc} alt="Base Ape" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" fill unoptimized />
                      {clothesAvailable.filter((c) => selectedIds.has(c.id)).map((item) => (
                        <SafeImage
                          key={item.id}
                          src={item.src}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                          fill
                          unoptimized
                          sizes="100vw"
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-off-white/60 text-sm p-4">
                  Enter a token ID or upload your Ape image to start.
                </div>
              )}

              {/* Loading overlay */}
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="px-4 py-2 rounded-md border border-white/10 bg-black/60 text-off-white/90 text-sm">
                    Assembling in the workshop...
                  </div>
                </div>
              )}

              {/* Flash effect */}
              {flashOn && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.95)', animation: 'flashPop 300ms ease-out forwards' }} />
              )}
            </div>
            <div className="text-xs text-off-white/60 mt-2">
              The lab composes selected clothes as full-size overlays aligned to the base image.
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/creative" className="btn-secondary">Back to Creative Hub</Link>
        </div>
      </div>
      <Footer />
      {/* Hidden audio element for mechanic workshop sound; place a file at /public/mechanic-workshop.mp3 */}
      <audio ref={audioRef} src="/mechanic-workshop.mp3" preload="auto" />
      {/* Local keyframes for smoke and flash */}
      <style jsx>{`
        @keyframes smokeDrift {
          0% { transform: translateX(-10%) translateY(0%); }
          50% { transform: translateX(10%) translateY(-2%); }
          100% { transform: translateX(-10%) translateY(0%); }
        }
        @keyframes flashPop {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
