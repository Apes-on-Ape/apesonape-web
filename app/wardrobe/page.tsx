'use client';
export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { Download, Shirt } from 'lucide-react';
import { useToolTracking } from '@/app/hooks/useToolTracking';
import { magicEdenAPI } from '@/lib/magic-eden';
import { baycAPI } from '@/lib/bayc-api';
import { maycAPI } from '@/lib/mayc-api';
import SafeImage from '@/app/components/SafeImage';

type Stats = {
  strength: number;
  intelligence: number;
  agility: number;
  vitality: number;
  luck: number;
  charisma: number;
};

type ClothingItem = {
  id: string;
  name: string;
  src: string; // overlay asset used on canvas
  category: 'Hats' | 'Clothes' | 'Accessories' | 'Hands' | 'Suits';
  previewSrc?: string; // thumbnail shown in picker
  baycOnly?: boolean; // Only available for BAYC collection
  aoaOnly?: boolean; // Only available for AoA collection
  stats?: Partial<Stats>; // Stat modifiers for equipped items
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

// Calculate base stats from NFT traits and token ID
const calculateBaseStats = (tokenId: string, traits: Array<{ name: string; value: string }>): Stats => {
  // Use token ID as seed for reproducible "randomness"
  const seed = parseInt(tokenId) || 1;
  const rng = (index: number) => {
    const x = Math.sin(seed * (index + 1)) * 10000;
    return Math.floor((x - Math.floor(x)) * 20) + 40; // 40-59 base range
  };
  
  const stats: Stats = {
    strength: rng(0),
    intelligence: rng(1),
    agility: rng(2),
    vitality: rng(3),
    luck: rng(4),
    charisma: rng(5),
  };
  
  // Modify stats based on specific traits
  traits.forEach(trait => {
    const traitName = trait.name.toLowerCase();
    const traitValue = trait.value.toLowerCase();
    
    // Fur color modifiers
    if (traitName === 'fur') {
      if (traitValue.includes('gold')) stats.charisma += 10;
      if (traitValue.includes('robot') || traitValue.includes('cyborg')) stats.intelligence += 8;
      if (traitValue.includes('zombie')) stats.vitality += 12;
      if (traitValue.includes('trippy') || traitValue.includes('dmt')) stats.luck += 8;
      if (traitValue.includes('cheetah')) stats.agility += 10;
    }
    
    // Eyes modifiers
    if (traitName === 'eyes') {
      if (traitValue.includes('laser') || traitValue.includes('cyborg')) stats.intelligence += 5;
      if (traitValue.includes('angry') || traitValue.includes('crazy')) stats.strength += 5;
      if (traitValue.includes('heart')) stats.charisma += 5;
      if (traitValue.includes('coins')) stats.luck += 7;
    }
    
    // Mouth modifiers
    if (traitName === 'mouth') {
      if (traitValue.includes('grin')) stats.charisma += 3;
      if (traitValue.includes('rage')) stats.strength += 5;
      if (traitValue.includes('bored')) stats.intelligence += 3;
    }
    
    // Background modifiers
    if (traitName === 'background') {
      stats.luck += 2;
    }
  });
  
  return stats;
};

const CLOTHES: ClothingItem[] = [
  // Hats
  { id: 'santa-hat', name: 'Santa Hat', src: '/wardrobe/hats/santa-hat.png', previewSrc: '/wardrobe/hats-preview/santa-hat.png', category: 'Hats', stats: { charisma: 5, luck: 3 } },
  { id: 'touchgrass', name: 'Touchgrass', src: '/wardrobe/hats/touchgrass.png', previewSrc: '/wardrobe/hats-preview/touchgrass.png', category: 'Hats', stats: { vitality: 4, intelligence: -2 } },
  { id: 'when', name: 'When', src: '/wardrobe/hats/when.png', previewSrc: '/wardrobe/hats-preview/when.png', category: 'Hats', stats: { intelligence: 3, luck: 5 } },
  { id: 'apehat', name: 'Ape Hat', src: '/wardrobe/hats/apehat.png', previewSrc: '/wardrobe/hats-preview/apehat-preview.png', category: 'Hats', stats: { strength: 3, charisma: 2 } },
  { id: 'vikinghat', name: 'Viking Hat', src: '/wardrobe/hats/vikinghat.png', previewSrc: '/wardrobe/hats-preview/vikinghat-preview.png', category: 'Hats', stats: { strength: 8, vitality: 5 } },
  { id: 'boar', name: 'Boar', src: '/wardrobe/hats/boar.png', previewSrc: '/wardrobe/hats-preview/boar-preview.png', category: 'Hats', stats: { strength: 6, agility: -2 } },
  { id: 'grinch', name: 'Grinch', src: '/wardrobe/hats/grinch.png', previewSrc: '/wardrobe/hats-preview/grinch-preview.png', category: 'Hats', stats: { agility: 7, charisma: -5 } },
  { id: 'wutang', name: 'Wu-Tang', src: '/wardrobe/hats/wutang.png', previewSrc: '/wardrobe/hats-preview/wu-tang-preview.png', category: 'Hats', stats: { charisma: 10, intelligence: 3 } },
  { id: 'luigihat', name: 'Luigi Hat', src: '/wardrobe/hats/luigihat.png', previewSrc: '/wardrobe/hats/luigihat.png', category: 'Hats', stats: { agility: 5, luck: 8 } },
  { id: 'mariohat', name: 'Mario Hat', src: '/wardrobe/hats/mariohat.png', previewSrc: '/wardrobe/hats/mariohat.png', category: 'Hats', stats: { agility: 6, charisma: 4 } },
  { id: 'sparrowhat', name: 'Sparrow Hat', src: '/wardrobe/hats/sparrowhat.png', previewSrc: '/wardrobe/hats-preview/sparrowhat.png', category: 'Hats', stats: { agility: 8, charisma: 6 } },
  { id: 'visor-glasses', name: 'Visor Glasses', src: '/wardrobe/hats/visor glasses.png', previewSrc: '/wardrobe/hats-preview/visor glasses.png', category: 'Hats', stats: { intelligence: 12, agility: 3 } },
  // Clothes
  { id: 'santavest', name: 'Santa Vest', src: '/wardrobe/clothes/santavest.png', previewSrc: '/wardrobe/clothes-preview/santavest-preview.png', category: 'Clothes', stats: { charisma: 7, vitality: 3 } },
  { id: 'sweater', name: 'Sweater', src: '/wardrobe/clothes/sweater.png', previewSrc: '/wardrobe/clothes-preview/sweater.png', category: 'Clothes', stats: { vitality: 5, charisma: 2 } },
  { id: 'captain-ape', name: 'Captain Ape', src: '/wardrobe/clothes/captain-ape.png', previewSrc: '/wardrobe/clothes-preview/captain-ape-preview.png', category: 'Clothes', stats: { charisma: 10, intelligence: 5 } },
  { id: 'cyberpunk-jacket', name: 'Cyberpunk Jacket', src: '/wardrobe/clothes/cyberpunk-jacket.png', previewSrc: '/wardrobe/clothes-preview/cyberpunk-jacket-preview.png', category: 'Clothes', stats: { agility: 8, intelligence: 6 } },
  { id: 'cyberpunk-jacket-2', name: 'Cyberpunk Jacket 2', src: '/wardrobe/clothes/cyberpunk-jacket-2.png', previewSrc: '/wardrobe/clothes-preview/cyberpunk-jacket-2-preview.png', category: 'Clothes', stats: { agility: 7, intelligence: 7 } },
  { id: 'aoa-tshirt', name: 'AOA T-Shirt', src: '/wardrobe/clothes/aoa-tshirt.png', previewSrc: '/wardrobe/clothes-preview/aoa-tshirt-preview.png', category: 'Clothes', stats: { charisma: 6, luck: 4 } },
  { id: 'blastoise', name: 'Blastoise', src: '/wardrobe/clothes/blastoise.png', previewSrc: '/wardrobe/clothes-preview/blastoise.png', category: 'Clothes', stats: { strength: 10, vitality: 8 } },
  // Suits (full-body suits)
  { id: 'apesuit', name: 'Apesuit', src: '/wardrobe/clothes/apesuit.png', previewSrc: '/wardrobe/clothes-preview/apesuit.png', category: 'Suits', stats: { vitality: 15, charisma: -5 } },
  { id: 'survived-apesuit', name: 'Survived Apesuit', src: '/wardrobe/clothes/survived-apesuit.png', previewSrc: '/wardrobe/clothes-preview/survived-apesuit.png', category: 'Suits', stats: { vitality: 20, strength: 5, agility: -3 } },
  { id: 'samurai-armor', name: 'Samurai Armor', src: '/wardrobe/clothes/samurai-armor.png', previewSrc: '/wardrobe/clothes-preview/samurai-armor-preview.png', category: 'Suits', stats: { strength: 12, vitality: 10, agility: 5 } },
  { id: 'superman', name: 'Superman', src: '/wardrobe/suits/superman.png', previewSrc: '/wardrobe/suits-preview/superman-preview.png', category: 'Suits', stats: { strength: 20, charisma: 15 } },
  { id: 'batman', name: 'Batman', src: '/wardrobe/suits/batman.png', previewSrc: '/wardrobe/suits-preview/batman-preview.png', category: 'Suits', stats: { intelligence: 18, agility: 12 } },
  { id: 'hulk', name: 'Hulk', src: '/wardrobe/suits/hulk.PNG', previewSrc: '/wardrobe/suits-preview/hulk-preview.png', category: 'Suits', stats: { strength: 25, intelligence: -5, charisma: -3 } },
  { id: 'cyborg', name: 'Cyborg', src: '/wardrobe/suits/cyborg.png', previewSrc: '/wardrobe/suits-preview/cyborg-preview.png', category: 'Suits', stats: { intelligence: 15, strength: 10 } },
  { id: 'elf', name: 'Elf', src: '/wardrobe/suits/elf.png', previewSrc: '/wardrobe/suits-preview/elf-preview.png', category: 'Suits', stats: { agility: 15, luck: 8 } },
  { id: 'gold-cloak', name: 'Gold Cloak', src: '/wardrobe/suits/gold-cloak.png', previewSrc: '/wardrobe/suits-preview/gold-cloak-preview.png', category: 'Suits', stats: { charisma: 20, luck: 10 } },
  { id: 'jedi', name: 'Jedi', src: '/wardrobe/suits/jedi.png', previewSrc: '/wardrobe/suits-preview/jedi-preview.png', category: 'Suits', stats: { intelligence: 15, agility: 10, charisma: 8 } },
  { id: 'mcaoa', name: 'McAoA', src: '/wardrobe/suits/McAoA.png', previewSrc: '/wardrobe/suits-preview/McAoA-preview.png', category: 'Suits', stats: { charisma: 12, vitality: -3 } },
  { id: 'robotsuit', name: 'Robot Suit', src: '/wardrobe/suits/robotsuit.png', previewSrc: '/wardrobe/suits-preview/robotsuit-preview.png', category: 'Suits', stats: { intelligence: 18, strength: 12, agility: -4 } },
  { id: 'snowman', name: 'Snowman', src: '/wardrobe/suits/snowman.png', previewSrc: '/wardrobe/suits-preview/snowman-preview.png', category: 'Suits', stats: { vitality: 12, charisma: 8 } },
  { id: 'spawn-frog', name: 'Spawn Frog', src: '/wardrobe/suits/spawn-frog.png', previewSrc: '/wardrobe/suits-preview/spawn-frog-preview.png', category: 'Suits', stats: { agility: 14, strength: 8 } },
  { id: 'sparrowsuit', name: 'Sparrow Suit', src: '/wardrobe/clothes/sparrowsuit.png', previewSrc: '/wardrobe/clothes/sparrowsuit.png', category: 'Suits', stats: { agility: 12, charisma: 10, luck: 5 } },
  { id: 'bulbasaur', name: 'Bulbasaur', src: '/wardrobe/suits/Bulbasaur_with_blue.png', previewSrc: '/wardrobe/suits-preview/bulbasaur-preview.png', category: 'Suits', stats: { vitality: 15, intelligence: 8 } },
  { id: 'charizard', name: 'Charizard', src: '/wardrobe/suits/Charizard_with_blue.png', previewSrc: '/wardrobe/suits-preview/charizard-preview.png', category: 'Suits', stats: { strength: 18, agility: 10 } },
  { id: 'gengar', name: 'Gengar', src: '/wardrobe/suits/Gengar_with_blue.png', previewSrc: '/wardrobe/suits-preview/gengar-preview.png', category: 'Suits', stats: { intelligence: 16, agility: 12 } },
  { id: 'pikachu', name: 'Pikachu', src: '/wardrobe/suits/Pikachu_with_blue.png', previewSrc: '/wardrobe/suits-preview/Pikachu.png', category: 'Suits', stats: { agility: 20, charisma: 15 } },
  { id: 'king-baldwin', name: 'King Baldwin', src: '/wardrobe/suits/King Baldwin-preview.png', previewSrc: '/wardrobe/suits-preview/King Baldwin-preview.png', category: 'Suits', stats: { charisma: 18, intelligence: 12, strength: 10 } },
];

const CATEGORIES: Array<ClothingItem['category']> = ['Hats', 'Clothes', 'Hands', 'Accessories', 'Suits'];

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

  const [collection, setCollection] = useState<'aoa' | 'bayc' | 'mayc'>('aoa');
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
  const [baseStats, setBaseStats] = useState<Stats>({ strength: 0, intelligence: 0, agility: 0, vitality: 0, luck: 0, charisma: 0 });
  const furColors = useMemo(() => (
    ['Black','Blue','Brown','Cheetah','Cream','Dark Brown','Death Bot','Dmt','Golden Brown','Gray','Noise','Pink','Red','Robot','Solid Gold','Tan','Trippy','White','Zombie'] as const
  ), []);
  type FurColor = typeof furColors[number];
  const [furColor, setFurColor] = useState<FurColor>('Brown');
  const [maycMutantType, setMaycMutantType] = useState<'m1' | 'm2'>('m1');
  const furAccessories = useMemo<ClothingItem[]>(() => {
    const slug = furToAccessorySlug(furColor);
    const build = (
      id: string,
      name: string,
      folder: string,
      slugOverrides?: Partial<Record<FurColor, string>>,
      stats?: Partial<Stats>
    ): ClothingItem => {
      const effectiveSlug = slugOverrides?.[furColor] || slug;
      const path = `/wardrobe/hands/${folder}/${effectiveSlug}-fur-${folder}.png`;
      return {
        id,
        name,
        src: path,
        previewSrc: path,
        category: 'Hands',
        stats,
      };
    };
    const accessories: ClothingItem[] = [
      build('bananas', 'Bananas', 'bananas', undefined, { agility: 3, luck: 5 }),
      build('gn1', 'GN1', 'gn1', undefined, { charisma: 6, vitality: 3 }),
      build('graffiti', 'Graffiti', 'graffiti', { 'Dark Brown': 'dark-brow' }, { charisma: 8, agility: 4 }),
      build('kaboom', 'Kaboom', 'kaboom', undefined, { strength: 10, intelligence: -2 }),
      build('shotgun', 'Shotgun', 'shotgun', undefined, { strength: 12, agility: 6 }),
      build('samurai', 'Samurai', 'samurai', undefined, { strength: 14, agility: 8 }),
      build('dinner', 'Dinner', 'dinner', undefined, { vitality: 8, charisma: 4 }),
      {
        id: 'prophecy',
        name: 'Prophecy',
        src: '/wardrobe/hands/prophecy.png',
        previewSrc: '/wardrobe/hands/prophecy.png',
        category: 'Hands',
        stats: { intelligence: 15, luck: 8 },
      },
      {
        id: 'haterkiller',
        name: 'Haterkiller',
        src: '/wardrobe/hands/haterkiller.png',
        previewSrc: '/wardrobe/hands/haterkiller.png',
        category: 'Hands',
        stats: { strength: 12, agility: 5 },
      },
      {
        id: 'valhalla',
        name: 'Valhalla',
        src: '/wardrobe/hands/valhalla.png',
        previewSrc: '/wardrobe/hands/valhalla.png',
        category: 'Hands',
        stats: { strength: 10, vitality: 12, charisma: 8 },
      },
      {
        id: 'beardead',
        name: 'Bear Dead',
        src: '/wardrobe/hands/beardead.png',
        previewSrc: '/wardrobe/hands/beardead.png',
        category: 'Hands',
        stats: { strength: 15, vitality: 5 },
      },
      {
        id: 'bulldead',
        name: 'Bull Dead',
        src: '/wardrobe/hands/bulldead.png',
        previewSrc: '/wardrobe/hands/bulldead.png',
        category: 'Hands',
        stats: { strength: 18, agility: -3 },
      },
      {
        id: 'diamondhands',
        name: 'Diamond Hands',
        src: '/wardrobe/hands/diamondhands.png',
        previewSrc: '/wardrobe/hands/diamondhands.png',
        category: 'Hands',
        stats: { luck: 20, charisma: 10 },
      },
      {
        id: 'rentfree',
        name: 'Rent Free',
        src: '/wardrobe/hands/rentfree.png',
        previewSrc: '/wardrobe/hands/rentfree.png',
        category: 'Hands',
        stats: { intelligence: 10, charisma: 8 },
      },
      {
        id: 'studio-microphone',
        name: 'Studio Microphone',
        src: '/wardrobe/accessories/studio-microphone.png',
        previewSrc: '/wardrobe/accessories/studio-microphone.png',
        category: 'Accessories',
        stats: { charisma: 12, intelligence: 5 },
      },
      {
        id: 'boxing-gloves',
        name: 'Boxing Gloves',
        src: '/wardrobe/hands/boxing gloves.png',
        previewSrc: '/wardrobe/hands/boxing gloves.png',
        category: 'Hands',
        baycOnly: true,
        stats: { strength: 14, vitality: 8 },
      },
      {
        id: 'diamond-hands-acc',
        name: 'Diamond Hands',
        src: '/wardrobe/hands/diamond hands.png',
        previewSrc: '/wardrobe/hands/diamond hands.png',
        category: 'Hands',
        baycOnly: true,
        stats: { luck: 22, charisma: 12 },
      },
      {
        id: 'nachos-beer',
        name: 'Nachos Beer',
        src: '/wardrobe/hands/nachos beer.png',
        previewSrc: '/wardrobe/hands/nachos beer.png',
        category: 'Hands',
        baycOnly: true,
        stats: { charisma: 10, vitality: 5, intelligence: -2 },
      },
      {
        id: 'snowboard',
        name: 'Snowboard',
        src: '/wardrobe/hands/snowboard.png',
        previewSrc: '/wardrobe/hands/snowboard.png',
        category: 'Hands',
        baycOnly: true,
        stats: { agility: 16, luck: 6 },
      },
      // BAYC-only items
      {
        id: 'bayc-axe',
        name: 'Axe',
        src: '/wardrobe/hands/bayc-Axe.png',
        previewSrc: '/wardrobe/hands/bayc-Axe.png',
        category: 'Hands',
        baycOnly: true,
        stats: { strength: 16, agility: 4 },
      },
      {
        id: 'bayc-bear-hands',
        name: 'Bear Hands',
        src: '/wardrobe/hands/bayc-bear_hands.png',
        previewSrc: '/wardrobe/hands/bayc-bear_hands.png',
        category: 'Hands',
        baycOnly: true,
        stats: { strength: 20, vitality: 8 },
      },
      {
        id: 'bayc-cyborg-hands',
        name: 'Cyborg Hands',
        src: '/wardrobe/hands/bayc-cyborg_hands.png',
        previewSrc: '/wardrobe/hands/bayc-cyborg_hands.png',
        category: 'Hands',
        baycOnly: true,
        stats: { intelligence: 14, strength: 10 },
      },
      {
        id: 'bayc-experiments',
        name: 'Experiments',
        src: '/wardrobe/hands/bayc-experiments.png',
        previewSrc: '/wardrobe/hands/bayc-experiments.png',
        category: 'Hands',
        baycOnly: true,
        stats: { intelligence: 18, luck: -3 },
      },
      {
        id: 'bayc-glocks',
        name: 'Glocks',
        src: '/wardrobe/hands/bayc-glocks.png',
        previewSrc: '/wardrobe/hands/bayc-glocks.png',
        category: 'Hands',
        baycOnly: true,
        stats: { agility: 12, strength: 8 },
      },
      {
        id: 'bayc-kill-bear',
        name: 'Kill Bear',
        src: '/wardrobe/hands/bayc-kill_bear.png',
        previewSrc: '/wardrobe/hands/bayc-kill_bear.png',
        category: 'Hands',
        baycOnly: true,
        stats: { strength: 18, vitality: 10 },
      },
      {
        id: 'bayc-mad-scientist',
        name: 'Mad Scientist',
        src: '/wardrobe/hands/bayc-mad scientist.png',
        previewSrc: '/wardrobe/hands/bayc-mad scientist.png',
        category: 'Hands',
        baycOnly: true,
        stats: { intelligence: 20, charisma: -4 },
      },
      {
        id: 'bayc-walkie-talkie',
        name: 'Walkie Talkie',
        src: '/wardrobe/hands/bayc-walkie tolkie.png',
        previewSrc: '/wardrobe/hands/bayc-walkie tolkie.png',
        category: 'Hands',
        baycOnly: true,
        stats: { intelligence: 8, charisma: 6 },
      },
      // AoA-only items
      {
        id: 'aoa-axe-2',
        name: 'Axe 2',
        src: '/wardrobe/hands/aoa-Axe_2.png',
        previewSrc: '/wardrobe/hands/aoa-Axe_2.png',
        category: 'Hands',
        aoaOnly: true,
        stats: { strength: 14, agility: 5 },
      },
      {
        id: 'aoa-bear-killer',
        name: 'Bear Killer',
        src: '/wardrobe/hands/aoa-bear_killer.png',
        previewSrc: '/wardrobe/hands/aoa-bear_killer.png',
        category: 'Hands',
        aoaOnly: true,
        stats: { strength: 16, vitality: 8 },
      },
      {
        id: 'aoa-experiments',
        name: 'Experiments',
        src: '/wardrobe/hands/aoa-experiments.png',
        previewSrc: '/wardrobe/hands/aoa-experiments.png',
        category: 'Hands',
        aoaOnly: true,
        stats: { intelligence: 16, luck: -2 },
      },
      {
        id: 'aoa-nachos-beer',
        name: 'Nachos Beer',
        src: '/wardrobe/hands/aoa-nachos beer.png',
        previewSrc: '/wardrobe/hands/aoa-nachos beer.png',
        category: 'Hands',
        aoaOnly: true,
        stats: { charisma: 8, vitality: 4, intelligence: -1 },
      },
    ];
    
    return accessories;
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
      // Use different API based on collection selection
      const nft = collection === 'bayc' 
        ? await baycAPI.getNFTByTokenId(tokenId.trim())
        : collection === 'mayc'
        ? await maycAPI.getNFTByTokenId(tokenId.trim())
        : await magicEdenAPI.getNFTByTokenId(tokenId.trim());
      
      if (!nft) {
        setNote('Token not found. Check the ID and try again.');
        return;
      }
      const furTrait = nft.traits.find((t) => t.name.toLowerCase() === 'fur');
      if (furTrait && furColors.includes(furTrait.value as FurColor)) {
        setFurColor(furTrait.value as FurColor);
      }
      
      // Extract mutant type for MAYC (M1 or M2)
      if (collection === 'mayc') {
        const typeTrait = nft.traits.find((t) => t.name.toLowerCase() === 'type');
        if (typeTrait) {
          const typeValue = typeTrait.value.toLowerCase();
          if (typeValue.includes('m1')) {
            setMaycMutantType('m1');
          } else if (typeValue.includes('m2')) {
            setMaycMutantType('m2');
          }
        }
      }
      
      setLoadedTraits(nft.traits);
      
      // Calculate base stats from NFT traits
      const calculatedStats = calculateBaseStats(tokenId.trim(), nft.traits);
      setBaseStats(calculatedStats);
      
      // For BAYC/MAYC, only use traits if available; otherwise use image directly
      if (collection === 'bayc' || collection === 'mayc') {
        // Build a base image from traits for BAYC/MAYC
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
        }
      } else {
        // For AoA, build from traits
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
      }
    } catch (err) {
      console.error('Load NFT error:', err);
      setNote('Failed to load NFT. Try again.');
    } finally {
      setLoadingNft(false);
    }
  }, [tokenId, loadingNft, collection, furColors, composeBaseFromTraits, keepHat, keepClothes, keepEyes, keepMouth]);

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

  // Get mug path based on collection and fur color
  const getMugPath = useCallback((fur: FurColor, collectionType: 'aoa' | 'bayc' | 'mayc') => {
    if (collectionType === 'bayc') {
      // BAYC mugs use format: "BAYC mug [color] fur.png"
      const furName = fur.toLowerCase();
      return `/wardrobe/hands/bayc-mugs/BAYC mug ${furName} fur.png`;
    } else if (collectionType === 'mayc') {
      // MAYC mugs use format: "MAYC MUG m1/m2 [color] fur.png" (uppercase MUG)
      const furName = fur.toLowerCase();
      return `/wardrobe/hands/mayc-mugs/MAYC MUG ${maycMutantType} ${furName} fur.png`;
    } else {
      // AoA uses regular GM mugs
      return `/wardrobe/hands/mugs/${furToMugSlug(fur)}-fur-mug.png`;
    }
  }, [maycMutantType]);

  const [gmMugPreviewOk, setGmMugPreviewOk] = useState(false);
  const [actualMugPath, setActualMugPath] = useState<string>('');
  
  useEffect(() => {
    const url = getMugPath(furColor, collection);
    if (!url) {
      setGmMugPreviewOk(false);
      return;
    }
    
    const img = new window.Image();
    img.onload = () => {
      setGmMugPreviewOk(true);
      setActualMugPath(url);
    };
    img.onerror = () => {
      setGmMugPreviewOk(false);
      setActualMugPath('');
    };
    img.src = url;
  }, [furColor, collection, getMugPath]);

  const gmMugItem = useMemo<ClothingItem | null>(() => {
    if (!gmMugPreviewOk || !actualMugPath) return null;
    const mugName = collection === 'bayc' ? 'BAYC Mug' : collection === 'mayc' ? 'MAYC Mug' : 'GM Mug';
    return {
      id: 'gm-mug',
      name: `${mugName} (${furColor})`,
      src: actualMugPath,
      previewSrc: actualMugPath,
      category: 'Hands',
      stats: { charisma: 5, luck: 3 },
    };
  }, [gmMugPreviewOk, actualMugPath, furColor, collection]);

  const clothesAvailable = useMemo(() => {
    const base = [...CLOTHES, ...furAccessories];
    const allItems = gmMugItem ? [...base, gmMugItem] : base;
    
    // For BAYC/MAYC, only allow items with 'bayc-' prefix and specific whitelisted items
    if (collection === 'bayc' || collection === 'mayc') {
      const allowedItems = ['prophecy', 'rentfree', 'bulldead', 'beardead', 'valhalla', 'studio-microphone', 'gm-mug'];
      return allItems.filter(item => 
        item.id.startsWith('bayc-') || allowedItems.includes(item.id)
      );
    }
    
    // For AoA, allow all clothes except BAYC/MAYC-only items
    return allItems.filter(item => !item.baycOnly);
  }, [collection, gmMugItem, furAccessories]);
  
  // Calculate total stats with equipment bonuses
  const totalStats = useMemo(() => {
    const equipped = clothesAvailable.filter(item => selectedIds.has(item.id));
    const stats = { ...baseStats };
    
    equipped.forEach(item => {
      if (item.stats) {
        Object.entries(item.stats).forEach(([key, value]) => {
          stats[key as keyof Stats] += value;
        });
      }
    });
    
    return stats;
  }, [baseStats, selectedIds, clothesAvailable]);

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

  // Filter by active category for both collections
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

  // When collection changes, reset state and clear preview
  useEffect(() => {
    if (collection === 'bayc' || collection === 'mayc') {
      setActiveCategory('Hands');
    }
    // Clear selection, preview, base image, loaded traits, and stats when switching collections
    setSelectedIds(new Set());
    setPreviewUrl(null);
    setBaseSrc('');
    setLoadedTraits(null);
    setTokenId('');
    setNote(null);
    setBaseStats({ strength: 0, intelligence: 0, agility: 0, vitality: 0, luck: 0, charisma: 0 });
    setMaycMutantType('m1'); // Reset to M1 by default
    setActualMugPath(''); // Clear mug path
  }, [collection]);

  return (
    <div className="min-h-screen relative">
      {/* Wardrobe ambient background */}
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
            Step into the wardrobe. Load your Apes On Ape, Bored Ape Yacht Club, or Mutant Ape Yacht Club NFT, select overlays, then generate with a flash of chaotic genius.
          </p>
        </motion.div>

        {/* RPG-Style Character Dressing UI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
          
          {/* Left Side - Character Info & Equipment Slots */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Character Selection Card */}
            <div className="rpg-card">
              <div className="rpg-card-header">
                <h3 className="text-sm font-bold uppercase tracking-wider">Character</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className={`rpg-button ${collection === 'aoa' ? 'rpg-button-active' : ''}`}
                    onClick={() => setCollection('aoa')}
                  >
                    Apes On Ape
                  </button>
                  <button
                    className={`rpg-button ${collection === 'bayc' ? 'rpg-button-active' : ''}`}
                    onClick={() => setCollection('bayc')}
                  >
                    BAYC
                  </button>
                  <button
                    className={`rpg-button ${collection === 'mayc' ? 'rpg-button-active' : ''}`}
                    onClick={() => setCollection('mayc')}
                  >
                    MAYC
                  </button>
                </div>
                
                <div className="pt-2 border-t border-amber-900/30">
                  <label className="block text-xs font-medium text-amber-200/70 mb-2 uppercase tracking-wide">
                    {collection === 'bayc' ? 'BAYC Token' : collection === 'mayc' ? 'MAYC Token' : 'Token ID'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      placeholder="e.g. 1234"
                      className="flex-1 rounded bg-black/50 border border-amber-900/50 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-900/50 outline-none focus:border-amber-600/70 focus:ring-1 focus:ring-amber-600/50"
                    />
                    <button 
                      className="rpg-button-small" 
                      onClick={handleLoadById} 
                      disabled={!tokenId.trim() || loadingNft}
                    >
                      {loadingNft ? '...' : 'Load'}
                    </button>
                  </div>
                  {note && <div className="text-xs text-red-400 mt-2">{note}</div>}
                </div>
              </div>
            </div>

            {/* Equipped Items Card */}
            <div className="rpg-card">
              <div className="rpg-card-header">
                <h3 className="text-sm font-bold uppercase tracking-wider">Equipped</h3>
              </div>
              <div className="p-4">
                {CATEGORIES.map((cat) => {
                  // Filter by collection
                  if (collection === 'bayc' || collection === 'mayc') {
                    if (cat !== 'Hands' && cat !== 'Accessories') return null;
                  }
                  
                  const equippedItem = clothesAvailable.find(item => 
                    item.category === cat && selectedIds.has(item.id)
                  );
                  
                  return (
                    <div key={cat} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs font-medium text-amber-200/70 uppercase tracking-wide">{cat}</div>
                      </div>
                      <div className={`equipment-slot ${equippedItem ? 'equipment-slot-filled' : ''}`}>
                        {equippedItem ? (
                          <div className="flex items-center gap-2">
                            <SafeImage 
                              src={equippedItem.previewSrc || equippedItem.src} 
                              alt={equippedItem.name} 
                              className="w-8 h-8 object-contain" 
                              width={32} 
                              height={32} 
                              unoptimized 
                            />
                            <span className="text-xs text-amber-100 truncate flex-1">{equippedItem.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-900/50 italic">Empty</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trait Toggles - AoA Only */}
            {collection === 'aoa' && (
              <div className="rpg-card">
                <div className="rpg-card-header">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Keep Traits</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                  <label className="rpg-checkbox-label">
                    <input type="checkbox" checked={keepHat} onChange={() => setKeepHat((v) => !v)} className="rpg-checkbox" />
                    <span>Hat</span>
                  </label>
                  <label className="rpg-checkbox-label">
                    <input type="checkbox" checked={keepClothes} onChange={() => setKeepClothes((v) => !v)} className="rpg-checkbox" />
                    <span>Clothes</span>
                  </label>
                  <label className="rpg-checkbox-label">
                    <input type="checkbox" checked={keepEyes} onChange={() => setKeepEyes((v) => !v)} className="rpg-checkbox" />
                    <span>Eyes</span>
                  </label>
                  <label className="rpg-checkbox-label">
                    <input type="checkbox" checked={keepMouth} onChange={() => setKeepMouth((v) => !v)} className="rpg-checkbox" />
                    <span>Mouth</span>
                  </label>
                </div>
              </div>
            )}

            {/* Spacer to align bottom with other columns */}
            <div className="flex-grow"></div>
          </div>

          {/* Center - Character Preview */}
          <div className="lg:col-span-6">
            <div className="rpg-card h-full">
              <div className="rpg-card-header">
                <h3 className="text-sm font-bold uppercase tracking-wider">Character Preview</h3>
              </div>
              <div className="p-4">
                <div className="character-preview-frame">
                  {/* Decorative corners */}
                  <div className="character-preview-corner character-preview-corner-tl"></div>
                  <div className="character-preview-corner character-preview-corner-tr"></div>
                  <div className="character-preview-corner character-preview-corner-bl"></div>
                  <div className="character-preview-corner character-preview-corner-br"></div>
                  
                  {baseSrc ? (
                    <>
                      {previewUrl ? (
                        <SafeImage src={previewUrl} alt="Generated Preview" className="absolute inset-0 w-full h-full object-contain p-4" fill unoptimized />
                      ) : (
                        <>
                          <SafeImage src={baseSrc} alt="Base Ape" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-4" fill unoptimized />
                          {clothesAvailable.filter((c) => selectedIds.has(c.id)).map((item) => (
                            <SafeImage
                              key={item.id}
                              src={item.src}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-4"
                              fill
                              unoptimized
                              sizes="100vw"
                            />
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-amber-900/50 text-sm p-4 text-center">
                      Load a character to begin customization
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="rpg-loading">
                        <div className="text-amber-200 font-bold">Forging...</div>
                      </div>
                    </div>
                  )}

                  {flashOn && (
                    <div className="absolute inset-0 pointer-events-none bg-amber-200/90" style={{ animation: 'flashPop 300ms ease-out forwards' }} />
                  )}
                </div>

                {/* Character Stats */}
                {baseSrc && (
                  <div className="mt-4 rpg-card">
                    <div className="rpg-card-header">
                      <h3 className="text-xs font-bold uppercase tracking-wider">Character Stats</h3>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {(Object.entries(totalStats) as [keyof Stats, number][]).map(([stat, value]) => {
                        const baseStat = baseStats[stat];
                        const bonus = value - baseStat;
                        return (
                          <div key={stat} className="stat-row">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-amber-200/90 uppercase tracking-wide">
                                {stat}
                              </span>
                              <span className="text-sm font-bold text-amber-100">
                                {value}
                                {bonus !== 0 && (
                                  <span className={`text-xs ml-1 ${bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {bonus > 0 ? '+' : ''}{bonus}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill" 
                                style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                {baseSrc && (
                  <div className="mt-4">
                    <button
                      className="rpg-button-primary w-full"
                      onClick={handleDownload}
                      disabled={!baseSrc}
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Download Character
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Inventory */}
          <div className="lg:col-span-3">
            <div className="rpg-card h-full flex flex-col">
              <div className="rpg-card-header">
                <h3 className="text-sm font-bold uppercase tracking-wider">Inventory</h3>
              </div>
              
              {/* Category Tabs */}
              <div className="px-4 pt-4">
                <div className="flex flex-wrap gap-1">
                  {collection === 'aoa' ? (
                    CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        className={`rpg-tab ${activeCategory === cat ? 'rpg-tab-active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        className={`rpg-tab ${activeCategory === 'Hands' ? 'rpg-tab-active' : ''}`}
                        onClick={() => setActiveCategory('Hands')}
                      >
                        Hands
                      </button>
                      <button
                        className={`rpg-tab ${activeCategory === 'Accessories' ? 'rpg-tab-active' : ''}`}
                        onClick={() => setActiveCategory('Accessories')}
                      >
                        Accessories
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Items Grid */}
              <div className="p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: '850px' }}>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.length === 0 && (
                    <div className="text-xs text-amber-900/50 col-span-2 text-center py-8 italic">No items in this category</div>
                  )}
                  {filtered.map((item) => {
                    const isOn = selectedIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        className={`inventory-item ${isOn ? 'inventory-item-selected' : ''}`}
                        onClick={() => toggleSelect(item.id)}
                        title={item.name}
                      >
                        <SafeImage 
                          src={item.previewSrc || item.src} 
                          alt={item.name} 
                          className="w-full aspect-square object-contain" 
                          width={80} 
                          height={80} 
                          unoptimized 
                        />
                        <div className="inventory-item-name">{item.name}</div>
                        {isOn && (
                          <div className="inventory-item-badge">✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      {/* Hidden audio element for mechanic workshop sound; place a file at /public/mechanic-workshop.mp3 */}
      <audio ref={audioRef} src="/mechanic-workshop.mp3" preload="auto" />
      {/* RPG-themed styles */}
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
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        /* RPG Card Styles */
        :global(.rpg-card) {
          background: linear-gradient(135deg, rgba(20, 15, 10, 0.95), rgba(30, 20, 10, 0.9));
          border: 2px solid;
          border-image: linear-gradient(135deg, #d4af37 0%, #8b6914 50%, #d4af37 100%) 1;
          border-radius: 8px;
          box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(212, 175, 55, 0.2),
            0 0 40px rgba(212, 175, 55, 0.1);
          position: relative;
        }
        
        :global(.rpg-card)::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 6px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), transparent 50%, rgba(212, 175, 55, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        
        :global(.rpg-card-header) {
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.2), rgba(139, 105, 20, 0.1));
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          padding: 12px 16px;
          color: #f5deb3;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        /* RPG Buttons */
        :global(.rpg-button) {
          padding: 10px 16px;
          background: linear-gradient(180deg, rgba(60, 45, 30, 0.8), rgba(40, 30, 20, 0.9));
          border: 1px solid rgba(139, 105, 20, 0.5);
          border-radius: 4px;
          color: #d4af37;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        :global(.rpg-button):hover:not(:disabled) {
          background: linear-gradient(180deg, rgba(80, 60, 40, 0.9), rgba(50, 40, 25, 0.9));
          border-color: rgba(212, 175, 55, 0.7);
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.3);
          transform: translateY(-1px);
        }
        
        :global(.rpg-button-active) {
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.3), rgba(139, 105, 20, 0.4));
          border-color: #d4af37;
          box-shadow: 
            0 0 20px rgba(212, 175, 55, 0.4),
            inset 0 2px 8px rgba(212, 175, 55, 0.2);
        }
        
        :global(.rpg-button):disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        :global(.rpg-button-small) {
          padding: 8px 12px;
          background: linear-gradient(180deg, rgba(60, 45, 30, 0.8), rgba(40, 30, 20, 0.9));
          border: 1px solid rgba(139, 105, 20, 0.5);
          border-radius: 4px;
          color: #d4af37;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        :global(.rpg-button-small):hover:not(:disabled) {
          background: linear-gradient(180deg, rgba(80, 60, 40, 0.9), rgba(50, 40, 25, 0.9));
          border-color: rgba(212, 175, 55, 0.7);
        }
        
        :global(.rpg-button-primary) {
          padding: 12px 24px;
          background: linear-gradient(180deg, rgba(139, 105, 20, 0.9), rgba(101, 77, 15, 0.9));
          border: 2px solid #d4af37;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 4px 15px rgba(212, 175, 55, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        :global(.rpg-button-primary):hover:not(:disabled) {
          background: linear-gradient(180deg, rgba(160, 120, 25, 0.9), rgba(120, 90, 18, 0.9));
          box-shadow: 
            0 6px 25px rgba(212, 175, 55, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        :global(.rpg-button-secondary) {
          padding: 10px 20px;
          background: linear-gradient(180deg, rgba(40, 40, 50, 0.8), rgba(30, 30, 40, 0.9));
          border: 1px solid rgba(100, 100, 120, 0.5);
          border-radius: 6px;
          color: #c0c0d0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        :global(.rpg-button-secondary):hover:not(:disabled) {
          background: linear-gradient(180deg, rgba(50, 50, 60, 0.9), rgba(40, 40, 50, 0.9));
          border-color: rgba(150, 150, 170, 0.7);
          transform: translateY(-1px);
        }
        
        /* Equipment Slots */
        :global(.equipment-slot) {
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(139, 105, 20, 0.3);
          border-radius: 6px;
          padding: 8px;
          min-height: 48px;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        
        :global(.equipment-slot-filled) {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: inset 0 0 10px rgba(212, 175, 55, 0.1);
        }
        
        /* Character Preview Frame */
        :global(.character-preview-frame) {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: radial-gradient(ellipse at center, rgba(30, 20, 10, 0.6), rgba(10, 5, 0, 0.9));
          border: 3px solid;
          border-image: linear-gradient(135deg, #d4af37 0%, #8b6914 25%, #d4af37 50%, #8b6914 75%, #d4af37 100%) 1;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.6),
            inset 0 0 60px rgba(0, 0, 0, 0.4);
        }
        
        :global(.character-preview-corner) {
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: #d4af37;
          border-style: solid;
        }
        
        :global(.character-preview-corner-tl) {
          top: -3px;
          left: -3px;
          border-width: 3px 0 0 3px;
          border-top-left-radius: 8px;
        }
        
        :global(.character-preview-corner-tr) {
          top: -3px;
          right: -3px;
          border-width: 3px 3px 0 0;
          border-top-right-radius: 8px;
        }
        
        :global(.character-preview-corner-bl) {
          bottom: -3px;
          left: -3px;
          border-width: 0 0 3px 3px;
          border-bottom-left-radius: 8px;
        }
        
        :global(.character-preview-corner-br) {
          bottom: -3px;
          right: -3px;
          border-width: 0 3px 3px 0;
          border-bottom-right-radius: 8px;
        }
        
        /* Inventory Items */
        :global(.inventory-item) {
          position: relative;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(139, 105, 20, 0.3);
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        :global(.inventory-item):hover {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.6);
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
        }
        
        :global(.inventory-item-selected) {
          background: rgba(212, 175, 55, 0.2);
          border-color: #d4af37;
          box-shadow: 
            0 0 20px rgba(212, 175, 55, 0.5),
            inset 0 0 15px rgba(212, 175, 55, 0.2);
        }
        
        :global(.inventory-item-name) {
          font-size: 10px;
          color: #f5deb3;
          text-align: center;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        :global(.inventory-item-badge) {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #d4af37, #b8941f);
          border: 1px solid #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: #000;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.6);
        }
        
        /* RPG Tabs */
        :global(.rpg-tab) {
          padding: 6px 12px;
          background: rgba(40, 30, 20, 0.6);
          border: 1px solid rgba(139, 105, 20, 0.3);
          border-radius: 4px 4px 0 0;
          color: #b8941f;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        :global(.rpg-tab):hover {
          background: rgba(60, 45, 30, 0.7);
          border-color: rgba(212, 175, 55, 0.5);
        }
        
        :global(.rpg-tab-active) {
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.3), rgba(139, 105, 20, 0.2));
          border-color: #d4af37;
          color: #f5deb3;
          box-shadow: 0 -2px 10px rgba(212, 175, 55, 0.3);
        }
        
        /* Checkbox Styles */
        :global(.rpg-checkbox-label) {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #d4af37;
          font-size: 12px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        
        :global(.rpg-checkbox-label):hover {
          color: #f5deb3;
        }
        
        :global(.rpg-checkbox) {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(139, 105, 20, 0.5);
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        :global(.rpg-checkbox):checked {
          background: linear-gradient(135deg, #d4af37, #b8941f);
          border-color: #d4af37;
        }
        
        :global(.rpg-checkbox):checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #000;
          font-size: 12px;
          font-weight: bold;
        }
        
        /* Stat Display */
        :global(.stat-row) {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(139, 105, 20, 0.3);
          border-radius: 4px;
          padding: 6px 8px;
        }
        
        :global(.stat-bar) {
          height: 6px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(139, 105, 20, 0.4);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        :global(.stat-bar-fill) {
          height: 100%;
          background: linear-gradient(90deg, #b8941f 0%, #d4af37 50%, #f5deb3 100%);
          border-radius: 2px;
          transition: width 0.3s ease;
          box-shadow: 
            0 0 10px rgba(212, 175, 55, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          position: relative;
        }
        
        :global(.stat-bar-fill)::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent);
          border-radius: 2px 2px 0 0;
        }
        
        /* Loading Animation */
        :global(.rpg-loading) {
          background: rgba(20, 15, 10, 0.9);
          border: 2px solid #d4af37;
          border-radius: 8px;
          padding: 20px 40px;
          box-shadow: 0 8px 32px rgba(212, 175, 55, 0.5);
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
