'use client';
export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Footer from '../components/Footer';
import { Download, Shirt, Sparkles } from 'lucide-react';
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
type WardrobeSlot = 'Head' | 'Eyes' | 'Body' | 'Accessories';
const WARDROBE_FILTERS: Array<'All' | WardrobeSlot> = ['All', 'Head', 'Eyes', 'Body', 'Accessories'];

function wardrobeSlot(item: ClothingItem): WardrobeSlot {
  const name = `${item.name} ${item.id}`.toLowerCase();
  if (item.category === 'Hats' && /glass|eye|visor|sunglass|blindfold/.test(name)) return 'Eyes';
  if (item.category === 'Hats') return 'Head';
  if (item.category === 'Clothes' || item.category === 'Suits') return 'Body';
  return 'Accessories';
}

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
  const [filter, setFilter] = useState<'All' | WardrobeSlot>('All');
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
  const [backgroundColor, setBackgroundColor] = useState<string>(''); // Empty = use original background
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
      build('twin-glocks', 'Twin Glocks', 'twin-glocks', undefined, { strength: 16, agility: 10 }),
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
    opts: { includeHat?: boolean; includeClothes?: boolean; includeEyes?: boolean; includeMouth?: boolean; bgColor?: string } = {}
  ) => {
    const {
      includeHat = true,
      includeClothes = true,
      includeEyes = true,
      includeMouth = true,
      bgColor = '',
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

    // If custom background color is set, fill it first
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    }

    const layers = TRAIT_LAYERS.filter((l) => {
      // Skip background layer if custom color is set
      if (l.name === 'Background' && bgColor) return false;
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

  const loadApe = useCallback(async (rawId?: string, source?: 'aoa' | 'bayc' | 'mayc') => {
    const id = (rawId ?? tokenId).trim();
    const which = source ?? collection;
    if (!id || loadingNft) return;
    setTokenId(id);
    setLoadingNft(true);
    setNote(null);
    setSelectedIds(new Set());
    setPreviewUrl(null);
    setLoadedTraits(null);
    try {
      if (!/^\d+$/.test(id)) {
        setNote('Enter a numeric token ID.');
        return;
      }
      const nft = which === 'bayc'
        ? await baycAPI.getNFTByTokenId(id)
        : which === 'mayc'
        ? await maycAPI.getNFTByTokenId(id)
        : await magicEdenAPI.getNFTByTokenId(id);
      
      if (!nft) {
        setNote('Token not found. Check the ID and try again.');
        return;
      }
      
      // For MAYC, extract mutant type from trait prefixes (most reliable method)
      let detectedMutantType: 'm1' | 'm2' = 'm1';
      if (which === 'mayc') {
        // MAYC traits include M1/M2 prefix in values (e.g., "M1 Dark Brown", "M2 Blue")
        // Check any trait for M1/M2 prefix
        const anyTraitWithPrefix = nft.traits.find(t => 
          t.value.startsWith('M1 ') || t.value.startsWith('M2 ')
        );
        if (anyTraitWithPrefix) {
          detectedMutantType = anyTraitWithPrefix.value.startsWith('M1 ') ? 'm1' : 'm2';
          console.log(`Detected MAYC mutant type from trait prefix: ${detectedMutantType}`);
        }
        setMaycMutantType(detectedMutantType);
      }
      
      // Extract fur color, handling MAYC's "M1 " or "M2 " prefix
      const furTrait = nft.traits.find((t) => t.name.toLowerCase() === 'fur');
      if (furTrait) {
        let furValue = furTrait.value;
        
        // For MAYC, strip "M1 " or "M2 " prefix from fur value
        if (which === 'mayc') {
          furValue = furValue.replace(/^M[12]\s+/, '');
        }
        
        if (furColors.includes(furValue as FurColor)) {
          setFurColor(furValue as FurColor);
        }
      }
      
      setLoadedTraits(nft.traits);
      
      const calculatedStats = calculateBaseStats(id, nft.traits);
      setBaseStats(calculatedStats);
      
      if (which === 'bayc' || which === 'mayc') {
        // Build a base image from traits for BAYC/MAYC
        const composed = await composeBaseFromTraits(nft.traits, {
          includeHat: keepHat,
          includeClothes: keepClothes,
          includeEyes: keepEyes,
          includeMouth: keepMouth,
          bgColor: backgroundColor,
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
          bgColor: backgroundColor,
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
  }, [tokenId, loadingNft, collection, furColors, composeBaseFromTraits, keepHat, keepClothes, keepEyes, keepMouth, backgroundColor]);

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
      const path = `/wardrobe/hands/mayc-mugs/MAYC MUG ${maycMutantType} ${furName} fur.png`;
      console.log(`getMugPath for MAYC: mutantType=${maycMutantType}, fur=${fur}, path=${path}`);
      return path;
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
    
    console.log(`Loading mug: ${url}`);
    
    const img = new window.Image();
    img.onload = () => {
      console.log(`✅ Mug loaded successfully: ${url}`);
      setGmMugPreviewOk(true);
      setActualMugPath(url);
    };
    img.onerror = () => {
      console.error(`❌ Mug failed to load: ${url}`);
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
    setPreviewUrl(null);
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
        bgColor: backgroundColor,
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

  const handleShare = useCallback(async () => {
    if (!baseSrc) return;
    const url = previewUrl || (await compose());
    if (!url) return;

    // Try native share (works great on mobile, supports file sharing)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'my-ape.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Custom Ape',
            text: 'Check out my custom Ape on @apesonape! 🐒 #ApesOnApe #ApeChain',
          });
          return;
        }
      } catch {
        // user cancelled or not supported — fall through
      }
    }

    // Desktop fallback: open X/Twitter intent
    const text = encodeURIComponent('Check out my custom Ape on @apesonape! 🐒\n\n#ApesOnApe #ApeChain\nhttps://apesonape.io/wardrobe');
    window.open(`https://x.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  }, [baseSrc, previewUrl, compose]);

  // Filter by active category for both collections
  const filtered = filter === 'All'
    ? clothesAvailable
    : clothesAvailable.filter((item) => wardrobeSlot(item) === filter);

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
        bgColor: backgroundColor,
      });
      if (rebuilt && !cancelled) {
        setBaseSrc(rebuilt);
        setPreviewUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [loadedTraits, keepHat, keepClothes, keepEyes, keepMouth, backgroundColor, composeBaseFromTraits]);

  const chooseCollection = (next: 'aoa' | 'bayc' | 'mayc') => {
    if (next === collection) return;
    setCollection(next);
    setActiveCategory(next === 'aoa' ? 'Hats' : 'Hands');
    setFilter(next === 'aoa' ? 'All' : 'Accessories');
    setBackgroundColor('');
    setSelectedIds(new Set());
    setPreviewUrl(null);
    setBaseSrc('');
    setLoadedTraits(null);
    setNote(null);
    setBaseStats({ strength: 0, intelligence: 0, agility: 0, vitality: 0, luck: 0, charisma: 0 });
    setMaycMutantType('m1');
    setActualMugPath('');
    setKeepHat(false);
    setKeepClothes(false);
    setKeepEyes(true);
    setKeepMouth(true);
    if (next === 'aoa' && bootId) {
      setTokenId(bootId);
      loadedFor.current = bootId;
      void loadApe(bootId, 'aoa');
      return;
    }
    setTokenId('');
    loadedFor.current = '';
  };

  // When background color is changed from original to custom, uncheck hat and clothes
  useEffect(() => {
    if (backgroundColor && collection === 'aoa') {
      // Custom background color is set, uncheck hat and clothes to show clean background
      setKeepHat(false);
      setKeepClothes(false);
    }
  }, [backgroundColor, collection]);

  const [bootId, setBootId] = useState('');
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const fromQuery = new URLSearchParams(window.location.search).get('ape');
    if (fromQuery && /^\d+$/.test(fromQuery)) {
      setBootId(fromQuery);
      return;
    }
    let cancelled = false;
    fetch('/api/profile/identity?lite=1', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { foreverApeId?: number } | null) => {
        if (!cancelled && typeof json?.foreverApeId === 'number') setBootId(String(json.foreverApeId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (bootId) setTokenId(bootId);
  }, [bootId]);

  const loadedFor = useRef('');
  useEffect(() => {
    if (!bootId || tokenId !== bootId || loadedFor.current === bootId || loadingNft) return;
    loadedFor.current = bootId;
    void loadApe(bootId, 'aoa');
  }, [bootId, tokenId, loadingNft, loadApe]);

  const traitValue = (name: string) => loadedTraits?.find((trait) => trait.name.toLowerCase() === name.toLowerCase())?.value || null;
  const itemsInSlot = (slot: WardrobeSlot) => clothesAvailable.filter((item) => selectedIds.has(item.id) && wardrobeSlot(item) === slot);
  const slotState = (slot: WardrobeSlot) => {
    const worn = itemsInSlot(slot);
    if (worn.length) return { name: worn.map((item) => item.name).join(', '), removable: true };
    if (slot === 'Head' && keepHat && traitValue('Hat')) return { name: traitValue('Hat') as string, removable: true };
    if (slot === 'Eyes' && keepEyes && traitValue('Eyes')) return { name: traitValue('Eyes') as string, removable: true };
    if (slot === 'Body' && keepClothes && traitValue('Clothes')) return { name: traitValue('Clothes') as string, removable: true };
    return { name: 'None', removable: false };
  };
  const equippedLines: Array<[WardrobeSlot, string, boolean]> = (['Head', 'Eyes', 'Body', 'Accessories'] as WardrobeSlot[]).map((slot) => {
    const state = slotState(slot);
    return [slot, state.name, state.removable];
  });

  const removeSlot = (slot: WardrobeSlot) => {
    setPreviewUrl(null);
    const worn = itemsInSlot(slot);
    if (worn.length) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const item of worn) next.delete(item.id);
        return next;
      });
      return;
    }
    if (slot === 'Head') setKeepHat(false);
    if (slot === 'Eyes') setKeepEyes(false);
    if (slot === 'Body') setKeepClothes(false);
  };

  const clearAll = () => {
    setPreviewUrl(null);
    setSelectedIds(new Set());
    setKeepHat(false);
    setKeepClothes(false);
    setKeepEyes(false);
  };

  const resetLook = () => {
    setPreviewUrl(null);
    setSelectedIds(new Set());
    setKeepHat(false);
    setKeepClothes(false);
    setKeepEyes(true);
    setKeepMouth(true);
    setBackgroundColor('');
  };

  return (
    <div className="min-h-screen relative">
      {/* Wardrobe ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1200px 600px at 20% 10%, rgba(0, 84, 249, 0.12), transparent 60%), radial-gradient(1000px 500px at 80% 20%, rgba(0, 180, 255, 0.08), transparent 60%), radial-gradient(800px 400px at 50% 80%, rgba(0, 84, 249, 0.07), transparent 60%), linear-gradient(180deg, #030a1e 0%, #050d22 50%, #070f26 100%)'
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        <div className="mb-4">
          <h1 className="font-[family-name:var(--font-signal-display)] text-3xl font-bold uppercase leading-none sm:text-4xl">Wardrobe</h1>
          <p className="mt-2 text-lg text-[var(--ink)]">
            {tokenId
              ? `${collection === 'bayc' ? 'Bored Ape' : collection === 'mayc' ? 'Mutant Ape' : 'Ape'} #${tokenId}`
              : collection === 'bayc' ? 'Bored Ape' : collection === 'mayc' ? 'Mutant Ape' : 'Ape'}
          </p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-mute)]">Dress any of these</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  ['aoa', 'Apes On Ape'],
                  ['bayc', 'Bored Apes'],
                  ['mayc', 'Mutant Apes'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => chooseCollection(id)}
                    className={`min-h-11 border px-3 text-[12px] font-semibold uppercase tracking-[0.12em] ${collection === id ? 'border-[var(--signal)] bg-[var(--signal)] text-white' : 'border-white/20 text-[var(--ink)] hover:border-[var(--signal)]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
              <input
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') { loadedFor.current = ''; void loadApe(); } }}
                placeholder={collection === 'bayc' ? 'Bored Ape ID, 0–9999' : collection === 'mayc' ? 'Mutant Ape ID, 0–19999' : 'Ape ID'}
                aria-label="Ape ID"
                className="min-w-0 flex-1 border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--signal)]"
              />
              <button type="button" className="rpg-button-small min-h-11" onClick={() => { loadedFor.current = ''; void loadApe(); }} disabled={!tokenId.trim() || loadingNft}>
                {loadingNft ? 'Loading' : 'Load'}
              </button>
              {collection !== 'aoa' ? (
                <button type="button" className="min-h-11 shrink-0 border border-white/20 px-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:border-[var(--signal)]" onClick={() => { loadedFor.current = ''; void loadApe('1', collection); }}>
                  Try #1
                </button>
              ) : null}
            </div>
          </div>
          {note ? <p className="mt-3 text-sm text-red-300">{note}</p> : null}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:items-stretch">
          <div className="wardrobe-side order-2 flex min-h-0 flex-col lg:order-none lg:col-span-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border border-white/10 bg-black/40 p-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-mute)]">Equipped</p>
            <ul className="mt-2">
              {equippedLines.map(([slot, name, removable]) => (
                <li key={slot} className="flex items-center justify-between gap-3 border-t border-white/10 py-2.5 first:border-t-0">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-mute)]">{slot}</p>
                    <p className="mt-0.5 truncate text-sm text-[var(--ink)]">{name}</p>
                  </div>
                  {removable ? (
                    <button type="button" onClick={() => removeSlot(slot)} className="inline-flex h-11 shrink-0 items-center border border-white/20 px-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:border-[var(--signal)]">
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-mute)]">The preview updates now. Download keeps a copy on this device. This look is not stored on your profile.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" className="rpg-button-primary min-h-11" onClick={handleGeneratePreview} disabled={isGenerating || !baseSrc}>
                <Sparkles className="mr-2 inline h-4 w-4" />
                Export look
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="rpg-button min-h-11" onClick={resetLook} disabled={!baseSrc}>Reset</button>
                <button type="button" className="rpg-button min-h-11" onClick={clearAll} disabled={!baseSrc}>Clear all</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="rpg-button flex min-h-11 items-center justify-center gap-2" onClick={handleDownload} disabled={!baseSrc}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button type="button" className="rpg-button min-h-11" onClick={handleShare} disabled={!baseSrc}>Share</button>
              </div>
            </div>
          {collection === 'aoa' && baseSrc ? (
            <details className="mt-3 border border-white/10 px-4 py-3">
              <summary className="cursor-pointer text-[13px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">Original traits and background</summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([
                  ['Hat', keepHat, setKeepHat],
                  ['Clothes', keepClothes, setKeepClothes],
                  ['Eyes', keepEyes, setKeepEyes],
                  ['Mouth', keepMouth, setKeepMouth],
                ] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, setter]) => (
                  <label key={label} className="rpg-checkbox-label">
                    <input type="checkbox" checked={val} onChange={() => setter((v) => !v)} className="rpg-checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                <button type="button" onClick={() => setBackgroundColor('')} className={`aspect-square border-2 ${backgroundColor === '' ? 'border-[var(--signal)]' : 'border-white/15'}`} style={{ background: 'linear-gradient(135deg,#a0522d,#654321)' }} title="Original" />
                {['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DFE6E9','#2D3436','#6C5CE7','#FD79A8'].map((color) => (
                  <button key={color} type="button" onClick={() => setBackgroundColor(color)} className={`aspect-square border-2 ${backgroundColor === color ? 'border-[var(--signal)]' : 'border-white/15'}`} style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
            </details>
          ) : null}
          </div>
          </div>

          <div className="order-1 lg:order-none lg:col-span-6">
          <div className="character-preview-frame w-full">
            <div className="character-preview-corner character-preview-corner-tl" />
            <div className="character-preview-corner character-preview-corner-tr" />
            <div className="character-preview-corner character-preview-corner-bl" />
            <div className="character-preview-corner character-preview-corner-br" />
            {baseSrc ? (
              previewUrl ? (
                <img src={previewUrl} alt="Wardrobe preview" className="wardrobe-layer" />
              ) : (
                <>
                  <img src={baseSrc} alt="Base Ape" className="wardrobe-layer" />
                  {clothesAvailable.filter((c) => selectedIds.has(c.id)).map((item) => (
                    <img key={item.id} src={item.src} alt={item.name} className="wardrobe-layer wardrobe-layer-item" />
                  ))}
                </>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <Shirt className="mb-3 h-8 w-8 text-white/25" />
                <p className="text-sm text-[var(--ink)]">{loadingNft ? 'Loading' : collection === 'bayc' ? 'Load a Bored Ape' : collection === 'mayc' ? 'Load a Mutant Ape' : 'Load an Ape'}</p>
                <p className="mt-1 max-w-[220px] text-[13px] text-[var(--ink-mute)]">{loadingNft ? `${collection === 'bayc' ? 'Bored Ape' : collection === 'mayc' ? 'Mutant Ape' : 'Ape'} #${tokenId}` : 'Apes On Ape, Bored Apes, and Mutant Apes can all be dressed here.'}</p>
              </div>
            )}
            {loadingNft ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                <p className="text-sm uppercase tracking-widest text-white">Loading {collection === 'bayc' ? 'Bored Ape' : collection === 'mayc' ? 'Mutant Ape' : 'Ape'} #{tokenId}</p>
              </div>
            ) : null}
            {isGenerating ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75">
                <p className="text-sm uppercase tracking-widest text-white">Applying</p>
              </div>
            ) : null}
            {flashOn ? <div className="pointer-events-none absolute inset-0 z-30 bg-hero-blue/30" style={{ animation: 'flashPop 300ms ease-out forwards' }} /> : null}
          </div>
          </div>

          <div className="wardrobe-side order-3 flex min-h-0 flex-col border border-white/10 bg-black/40 p-4 lg:order-none lg:col-span-3">
          <h2 className="font-[family-name:var(--font-signal-display)] text-xl uppercase leading-none">{collection === 'bayc' ? 'Bored Ape wardrobe' : collection === 'mayc' ? 'Mutant Ape wardrobe' : 'Your wardrobe'}</h2>
          <p className="mt-1 text-[12px] text-[var(--ink-mute)]">{collection === 'aoa' ? 'Switch to Bored Apes or Mutant Apes to dress those collections.' : 'Pieces for this collection.'}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {WARDROBE_FILTERS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setFilter(slot)}
                className={`shrink-0 border px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] ${filter === slot ? 'border-[var(--signal)] bg-[var(--signal)] text-white' : 'border-white/15 text-[var(--ink-mute)]'}`}
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 lg:max-h-none">
            {filtered.length === 0 ? (
              <p className="py-8 text-sm text-[var(--ink-mute)]">No items in this category.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((item) => {
                  const isOn = selectedIds.has(item.id);
                  return (
                    <div key={item.id} className={`inventory-item ${isOn ? 'inventory-item-selected' : ''}`}>
                      <button type="button" className="w-full text-left" onClick={() => toggleSelect(item.id)} title={item.name}>
                        <SafeImage src={item.previewSrc || item.src} alt={item.name} className="aspect-square w-full object-contain" width={80} height={80} unoptimized />
                        <div className="inventory-item-name">{item.name}</div>
                      </button>
                      {isOn ? (
                        <button type="button" onClick={() => toggleSelect(item.id)} className="inline-flex h-11 w-full items-center justify-center border border-white/20 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
                          Remove
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
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
          background: linear-gradient(135deg, rgba(8, 16, 44, 0.92), rgba(6, 12, 36, 0.88));
          border: 2px solid;
          border-image: linear-gradient(135deg, #0054F9 0%, #2266ff 50%, #0054F9 100%) 1;
          border-radius: 8px;
          box-shadow: 
            0 4px 24px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(0, 84, 249, 0.35),
            0 0 48px rgba(0, 84, 249, 0.15);
          position: relative;
        }
        
        :global(.rpg-card)::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 6px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.3), transparent 50%, rgba(0, 84, 249, 0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        
        :global(.rpg-card-header) {
          background: linear-gradient(180deg, rgba(0, 84, 249, 0.50), rgba(0, 55, 200, 0.32));
          padding: 16px 20px;
          border-bottom: 2px solid rgba(0, 84, 249, 0.7);
          position: relative;
        }
        
        :global(.rpg-card-header):before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
        
        :global(.rpg-card-header):after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 84, 249, 1), transparent);
          box-shadow: 0 0 10px rgba(0, 84, 249, 0.8);
        }
        
        :global(.rpg-card-header h3) {
          color: #c8d8ff;
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(0, 84, 249, 0.3);
        }
        
        /* RPG Buttons */
        :global(.rpg-button) {
          padding: 12px 18px;
          background: linear-gradient(135deg, rgba(8, 18, 52, 0.88), rgba(6, 14, 44, 0.92));
          border: 2px solid rgba(0, 84, 249, 0.55);
          border-radius: 8px;
          color: #6699ff;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }
        
        :global(.rpg-button):before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 84, 249, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        :global(.rpg-button):hover:not(:disabled):before {
          left: 100%;
        }
        
        :global(.rpg-button):hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(12, 24, 64, 0.95), rgba(8, 18, 52, 1));
          border-color: rgba(0, 84, 249, 0.9);
          box-shadow: 
            0 6px 16px rgba(0, 84, 249, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          color: #c8d8ff;
        }
        
        :global(.rpg-button-active) {
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.35), rgba(0, 55, 200, 0.4));
          border-color: #0054F9;
          color: #fff;
          box-shadow: 
            0 0 25px rgba(0, 84, 249, 0.5),
            0 4px 12px rgba(0, 84, 249, 0.3),
            inset 0 2px 0 rgba(255, 255, 255, 0.2),
            inset 0 -2px 8px rgba(0, 84, 249, 0.3);
          transform: translateY(-1px);
        }
        
        :global(.rpg-button):disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        
        :global(.rpg-button-small) {
          padding: 10px 16px;
          background: linear-gradient(135deg, rgba(8, 18, 52, 0.88), rgba(6, 14, 44, 0.92));
          border: 2px solid rgba(0, 84, 249, 0.55);
          border-radius: 6px;
          color: #6699ff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        
        :global(.rpg-button-small):hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(12, 24, 64, 0.95), rgba(8, 18, 52, 1));
          border-color: rgba(0, 84, 249, 0.9);
          box-shadow: 0 4px 12px rgba(0, 84, 249, 0.35);
          transform: translateY(-1px);
          color: #c8d8ff;
        }
        
        :global(.rpg-button-primary) {
          padding: 14px 28px;
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.9), rgba(0, 55, 200, 0.95));
          border: 2px solid #0054F9;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 6px 20px rgba(0, 84, 249, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        :global(.rpg-button-primary):before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        :global(.rpg-button-primary):hover:not(:disabled):before {
          left: 100%;
        }
        
        :global(.rpg-button-primary):hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(40, 110, 255, 1), rgba(0, 68, 220, 1));
          box-shadow: 
            0 8px 30px rgba(0, 84, 249, 0.7),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 0 40px rgba(0, 84, 249, 0.4);
          transform: translateY(-3px);
          border-color: #c8d8ff;
        }
        
        :global(.rpg-button-primary):active:not(:disabled) {
          transform: translateY(-1px);
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
          background: linear-gradient(135deg, rgba(4, 8, 20, 0.6), rgba(2, 5, 15, 0.8));
          border: 2px solid rgba(0, 55, 200, 0.4);
          border-radius: 8px;
          padding: 10px;
          min-height: 52px;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.4),
            0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        :global(.equipment-slot):hover {
          border-color: rgba(0, 55, 200, 0.6);
        }
        
        :global(.equipment-slot-filled) {
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.15), rgba(0, 55, 200, 0.15));
          border-color: rgba(0, 84, 249, 0.6);
          box-shadow: 
            inset 0 0 15px rgba(0, 84, 249, 0.15),
            0 0 15px rgba(0, 84, 249, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.4);
        }
        
        /* Character Preview Frame */
        @media (min-width: 1024px) {
          :global(.wardrobe-side) {
            height: 0;
            min-height: 100%;
            overflow: hidden;
          }
        }

        :global(.wardrobe-layer) {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          user-select: none;
        }

        :global(.wardrobe-layer-item) {
          z-index: 2;
        }

        :global(.character-preview-frame) {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: 
            radial-gradient(ellipse at 30% 30%, rgba(0, 84, 249, 0.18), transparent 55%),
            radial-gradient(ellipse at 70% 80%, rgba(0, 150, 255, 0.10), transparent 50%),
            radial-gradient(ellipse at center, rgba(6, 12, 36, 0.85), rgba(4, 8, 28, 0.95));
          border: 4px solid transparent;
          background-clip: padding-box;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            0 12px 48px rgba(0, 0, 0, 0.6),
            0 0 0 2px rgba(0, 84, 249, 0.7),
            0 0 50px rgba(0, 84, 249, 0.35),
            inset 0 0 60px rgba(0, 0, 0, 0.3),
            inset 0 4px 20px rgba(0, 84, 249, 0.15);
          position: relative;
        }
        
        :global(.character-preview-frame):before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #0054F9 0%, #0041C4 25%, #0054F9 50%, #0041C4 75%, #0054F9 100%);
          border-radius: 12px;
          z-index: -1;
          animation: borderRotate 8s linear infinite;
        }
        
        @keyframes borderRotate {
          0% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(15deg) brightness(1.2);
          }
          100% {
            filter: hue-rotate(0deg) brightness(1);
          }
        }
        
        :global(.character-preview-corner) {
          position: absolute;
          width: 32px;
          height: 32px;
          border-color: #0054F9;
          border-style: solid;
          z-index: 10;
          filter: drop-shadow(0 0 8px rgba(0, 84, 249, 0.8));
        }
        
        :global(.character-preview-corner-tl) {
          top: 4px;
          left: 4px;
          border-width: 4px 0 0 4px;
          border-top-left-radius: 8px;
          animation: cornerPulse 2s ease-in-out infinite;
        }
        
        :global(.character-preview-corner-tr) {
          top: 4px;
          right: 4px;
          border-width: 4px 4px 0 0;
          border-top-right-radius: 8px;
          animation: cornerPulse 2s ease-in-out infinite 0.5s;
        }
        
        :global(.character-preview-corner-bl) {
          bottom: 4px;
          left: 4px;
          border-width: 0 0 4px 4px;
          border-bottom-left-radius: 8px;
          animation: cornerPulse 2s ease-in-out infinite 1s;
        }
        
        :global(.character-preview-corner-br) {
          bottom: 4px;
          right: 4px;
          border-width: 0 4px 4px 0;
          border-bottom-right-radius: 8px;
          animation: cornerPulse 2s ease-in-out infinite 1.5s;
        }
        
        @keyframes cornerPulse {
          0%, 100% {
            opacity: 0.6;
            filter: drop-shadow(0 0 4px rgba(0, 84, 249, 0.6));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(0, 84, 249, 1));
          }
        }
        
        @keyframes titleGlow {
          0%, 100% {
            filter: drop-shadow(0 0 30px rgba(0,84,249,0.6)) drop-shadow(0 0 15px rgba(0,84,249,0.4));
          }
          50% {
            filter: drop-shadow(0 0 40px rgba(0,84,249,0.8)) drop-shadow(0 0 20px rgba(0,84,249,0.6));
          }
        }
        
        /* Inventory Items */
        :global(.inventory-item) {
          position: relative;
          background: linear-gradient(135deg, rgba(4, 8, 22, 0.8), rgba(4, 8, 20, 0.9));
          border: 2px solid rgba(0, 55, 200, 0.4);
          border-radius: 10px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
        }
        
        :global(.inventory-item):before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 84, 249, 0.3), transparent);
          pointer-events: none;
        }
        
        :global(.inventory-item):hover {
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.15), rgba(0, 55, 200, 0.2));
          border-color: rgba(0, 84, 249, 0.7);
          transform: translateY(-4px) scale(1.05);
          box-shadow: 
            0 8px 24px rgba(0, 84, 249, 0.4),
            0 0 0 1px rgba(0, 84, 249, 0.3) inset;
        }
        
        :global(.inventory-item-selected) {
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.3), rgba(0, 55, 200, 0.3));
          border-color: #0054F9;
          transform: translateY(-2px);
          box-shadow: 
            0 0 30px rgba(0, 84, 249, 0.6),
            0 8px 20px rgba(0, 84, 249, 0.4),
            0 0 0 2px rgba(0, 84, 249, 0.4) inset,
            inset 0 2px 0 rgba(255, 255, 255, 0.2);
          animation: selectedGlow 2s ease-in-out infinite;
        }
        
        @keyframes selectedGlow {
          0%, 100% {
            box-shadow: 
              0 0 30px rgba(0, 84, 249, 0.6),
              0 8px 20px rgba(0, 84, 249, 0.4),
              0 0 0 2px rgba(0, 84, 249, 0.4) inset,
              inset 0 2px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 
              0 0 40px rgba(0, 84, 249, 0.8),
              0 8px 20px rgba(0, 84, 249, 0.5),
              0 0 0 2px rgba(0, 84, 249, 0.6) inset,
              inset 0 2px 0 rgba(255, 255, 255, 0.3);
          }
        }
        
        :global(.inventory-item-name) {
          font-size: 11px;
          color: #c8d8ff;
          text-align: center;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        :global(.inventory-item-badge) {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #0054F9, #0041C4);
          border: 2px solid #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: #000;
          box-shadow: 
            0 4px 12px rgba(0, 84, 249, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          z-index: 10;
        }
        
        /* Category Tab Styles */
        :global(.rpg-tab) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          background: linear-gradient(135deg, rgba(5, 8, 20, 0.9), rgba(4, 8, 20, 0.95));
          border: 2px solid rgba(0, 55, 200, 0.5);
          border-radius: 8px;
          color: #0054F9;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(0, 84, 249, 0.1) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        :global(.rpg-tab > span) {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        :global(.rpg-tab svg) {
          width: 14px;
          height: 14px;
        }
        
        :global(.rpg-tab):before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 84, 249, 0.2), transparent);
          transition: left 0.5s ease;
          z-index: 0;
        }
        
        :global(.rpg-tab-active):before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80%;
          height: 80%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(0, 84, 249, 0.2), transparent 70%);
          animation: radialPulse 3s ease-in-out infinite;
          z-index: 0;
        }
        
        @keyframes radialPulse {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(0.9);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        
        :global(.rpg-tab):hover:not(.rpg-tab-active):before {
          left: 100%;
        }
        
        :global(.rpg-tab):hover:not(.rpg-tab-active) {
          background: linear-gradient(135deg, rgba(8, 12, 28, 0.95), rgba(5, 8, 20, 1));
          border-color: rgba(0, 84, 249, 0.7);
          color: #c8d8ff;
          box-shadow: 
            0 6px 16px rgba(0, 84, 249, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        :global(.rpg-tab):hover:not(.rpg-tab-active) svg {
          animation: iconBounce 0.6s ease-in-out;
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        :global(.rpg-tab-active) {
          background: linear-gradient(135deg, rgba(0, 84, 249, 0.45), rgba(0, 55, 200, 0.5));
          border-color: #0054F9;
          color: #fff;
          box-shadow: 
            0 0 30px rgba(0, 84, 249, 0.7),
            0 6px 20px rgba(0, 84, 249, 0.5),
            0 0 0 1px rgba(0, 84, 249, 0.3) inset,
            inset 0 2px 0 rgba(255, 255, 255, 0.25),
            inset 0 -2px 12px rgba(0, 84, 249, 0.4);
          transform: translateY(-2px) scale(1.02);
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(0, 84, 249, 0.6);
          font-weight: 800;
        }
        
        :global(.rpg-tab-active):before {
          display: none;
        }
        
        :global(.rpg-tab-active):after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c8d8ff, transparent);
          box-shadow: 0 0 10px rgba(180, 210, 255, 0.8);
          animation: activeGlow 2s ease-in-out infinite;
        }
        
        @keyframes activeGlow {
          0%, 100% {
            opacity: 0.7;
            box-shadow: 0 0 10px rgba(180, 210, 255, 0.8);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 15px rgba(180, 210, 255, 1);
          }
        }
        
        :global(.rpg-tab-active svg) {
          animation: iconPulse 2s ease-in-out infinite;
          filter: drop-shadow(0 0 4px rgba(180, 210, 255, 0.8));
        }
        
        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 4px rgba(180, 210, 255, 0.8));
          }
          50% {
            transform: scale(1.15);
            filter: drop-shadow(0 0 8px rgba(180, 210, 255, 1));
          }
        }
        
        /* Checkbox Styles */
        :global(.rpg-checkbox-label) {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0054F9;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 6px 8px;
          border-radius: 6px;
        }
        
        :global(.rpg-checkbox-label):hover {
          color: #c8d8ff;
          background: rgba(0, 84, 249, 0.05);
        }
        
        :global(.rpg-checkbox) {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 55, 200, 0.6);
          border-radius: 5px;
          background: linear-gradient(135deg, rgba(4, 8, 20, 0.9), rgba(10, 5, 0, 0.95));
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.4),
            inset 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        :global(.rpg-checkbox):hover {
          border-color: rgba(0, 84, 249, 0.8);
          box-shadow: 
            0 2px 8px rgba(0, 84, 249, 0.2),
            inset 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        
        :global(.rpg-checkbox):checked {
          background: linear-gradient(135deg, #0054F9, #0041C4);
          border-color: #0054F9;
          box-shadow: 
            0 0 15px rgba(0, 84, 249, 0.6),
            0 4px 10px rgba(0, 84, 249, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        :global(.rpg-checkbox):checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #000;
          font-size: 14px;
          font-weight: 900;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
        }
        
        /* Stat Display */
        :global(.stat-row) {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 55, 200, 0.3);
          border-radius: 4px;
          padding: 6px 8px;
        }
        
        :global(.stat-bar) {
          height: 6px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 55, 200, 0.4);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        :global(.stat-bar-fill) {
          height: 100%;
          background: linear-gradient(90deg, #0041C4 0%, #0054F9 50%, #c8d8ff 100%);
          border-radius: 2px;
          transition: width 0.3s ease;
          box-shadow: 
            0 0 10px rgba(0, 84, 249, 0.6),
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
          background: rgba(4, 8, 20, 0.9);
          border: 2px solid #0054F9;
          border-radius: 8px;
          padding: 20px 40px;
          box-shadow: 0 8px 32px rgba(0, 84, 249, 0.5);
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        :global(.inventory-item):after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(0, 84, 249, 0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 10px;
          pointer-events: none;
        }
        
        :global(.inventory-item):hover:after {
          opacity: 1;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
