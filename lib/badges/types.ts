/**
 * Apes on Ape badge system: trait, outfit, holder milestones, AI Studio.
 * Badge assets live in /badges/ with black background.
 */

export type BadgeCategory = 'trait' | 'outfit' | 'milestone' | 'creator';

export interface BadgeDef {
  slug: string;
  title: string;
  description: string;
  /** Asset path under /badges/ (e.g. dmt-badge.png) */
  asset: string;
  category: BadgeCategory;
  /** Trait badges: Fur value, need 5 */
  trait?: { type: string; value: string; minCount: number };
  /** Outfit badges: Clothes value, need 1 */
  outfit?: { value: string; minCount: number };
  /** Holder milestone: total ape count >= threshold */
  milestone?: number;
  /** Creator: min AI Studio publishes */
  minPublishes?: number;
}

export const BADGE_DEFS: BadgeDef[] = [
  // —— Trait / Variant (hold 5+ with trait) ——
  { slug: 'dmt-traveler', title: 'DMT Traveler', description: 'Hold 5 DMT Apes', asset: 'dmt-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Dmt', minCount: 5 } },
  { slug: 'mech-unit', title: 'Mech Unit', description: 'Hold 5 Robot Apes', asset: 'robot-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Robot', minCount: 5 } },
  { slug: 'death-protocol', title: 'Death Protocol', description: 'Hold 5 Death Bot Apes', asset: 'death-bot-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Death Bot', minCount: 5 } },
  { slug: 'undead-ape', title: 'Undead Ape', description: 'Hold 5 Zombie Apes', asset: 'zombie-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Zombie', minCount: 5 } },
  { slug: 'mind-melter', title: 'Mind Melter', description: 'Hold 5 Trippy Apes', asset: 'trippy-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Trippy', minCount: 5 } },
  { slug: 'noise-breaker', title: 'Noise Breaker', description: 'Hold 5 Noise Apes', asset: 'noise-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Noise', minCount: 5 } },
  { slug: 'golden-blood', title: 'Golden Blood', description: 'Hold 5 Gold Fur Apes', asset: 'golden-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Solid Gold', minCount: 5 } },
  { slug: 'speed-runner', title: 'Speed Runner', description: 'Hold 5 Cheetah Apes', asset: 'cheetah-badge.png', category: 'trait', trait: { type: 'Fur', value: 'Cheetah', minCount: 5 } },
  // —— Outfit / Identity (own 1+ with outfit) ——
  { slug: 'space-explorer', title: 'Space Explorer', description: 'Own at least 1 Ape wearing a Space Suit', asset: 'space-badge.png', category: 'outfit', outfit: { value: 'Space Suit', minCount: 1 } },
  { slug: 'black-suit-operator', title: 'Black Suit Operator', description: 'Own at least 1 Ape wearing a Black Suit', asset: 'suit-badge.png', category: 'outfit', outfit: { value: 'Black Suit', minCount: 1 } },
  { slug: 'crown-bearer', title: 'Crown Bearer', description: "Own at least 1 Ape wearing the King's Robe", asset: 'king-badge.png', category: 'outfit', outfit: { value: "King's Robe", minCount: 1 } },
  // —— Holder milestones ——
  { slug: 'holder-10', title: '10 Ape Holder', description: 'Hold 10 Apes', asset: '10-ape-holder-badge.png', category: 'milestone', milestone: 10 },
  { slug: 'holder-25', title: '25 Ape Holder', description: 'Hold 25 Apes', asset: '25-ape-holder-badge.png', category: 'milestone', milestone: 25 },
  { slug: 'holder-50', title: '50 Ape Holder', description: 'Hold 50 Apes', asset: '50-ape-holder-badge.png', category: 'milestone', milestone: 50 },
  { slug: 'holder-100', title: '100 Ape Holder', description: 'Hold 100 Apes', asset: '100-ape-holder-badge.png', category: 'milestone', milestone: 100 },
  { slug: 'holder-200', title: '200 Ape Holder', description: 'Hold 200 Apes', asset: '200-ape-holder-badge.png', category: 'milestone', milestone: 200 },
  // —— Creator ——
  { slug: 'ai-studio-publisher', title: 'AI Studio Publisher', description: 'Publish 5 creations via AOA AI Studio', asset: 'ai-studio-badge.png', category: 'creator', minPublishes: 5 },
];

export const BADGE_SLUGS = BADGE_DEFS.map((b) => b.slug);
export const BADGE_BY_SLUG = new Map(BADGE_DEFS.map((b) => [b.slug, b]));
