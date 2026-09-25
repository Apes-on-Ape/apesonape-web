/**
 * Factual record copied from the previous /story timeline and FAQ.
 * Chapter layout may shorten a label. It does not add events.
 */

export const STORY_TIMELINE = [
  {
    date: 'April 2021',
    title: 'BAYC Goes Live',
    body: 'Bored Ape Yacht Club launches on Ethereum. 10,000 apes, commercial IP rights, a culture built on "Apes Together Strong." The blueprint is set.',
  },
  {
    date: 'March 2022',
    title: 'ApeCoin Launches',
    body: '$APE drops via a major airdrop to BAYC, MAYC, and Kennel Club holders. Governance. Utility. A token tied to culture — not just speculation.',
  },
  {
    date: 'October 2024',
    title: 'ApeChain Launches',
    body: 'Arbitrum Orbit Layer-3. Native $APE gas. Near-zero fees. Built for NFTs, gaming, and creators. The stage is set for a chain-native ape project.',
  },
  {
    date: 'October 2024',
    title: 'Apes on Ape Launches',
    body: 'The moment ApeChain goes live, Apes on Ape is there. One of the very first NFT projects to deploy natively on the new chain. Early believers mint in — with placeholder art for now — trusting the team and the vision. The OG collection on ApeChain.',
  },
  {
    date: 'December 2024',
    title: 'The DMCA',
    body: 'Yuga Labs issues a DMCA takedown against the original collection. Art too close to BAYC. Platforms delist. The project goes dark. Many wrote it off. But within the Ape community, something different started — a rallying call.',
  },
  {
    date: 'Late 2024 – Early 2025',
    title: 'The Rebirth',
    body: 'The community didn\'t scatter. BAYC holders, Ape ecosystem veterans, and true believers showed up. "Apes Together Strong" wasn\'t a slogan — it was a plan. The team scrapped every pixel of the original art and built a completely fresh 10,000-piece generative collection from scratch. Original traits. Original soul. Same rebellious energy.',
  },
  {
    date: 'June 29, 2025',
    title: 'All-Time High',
    body: 'Floor hits ~$67.35 / 111 APE. The "only Apes on ApeChain" narrative peaks. Music plays climb into the millions. Arcade testing kicks off. The community that held through the DMCA and the rebuild reaps the moment.',
  },
  {
    date: 'October 2025',
    title: 'New Art Team',
    body: 'The original art team is out. SmokeThatDank and ApeProfessore step up and take over — two artists already deep in the AOA community who believe in the project. They commit to building the definitive generative collection from scratch: 10,000 fully original pieces, new traits, new soul. The art is no longer outsourced — it\'s made by the community, for the community.',
  },
  {
    date: 'December 2025',
    title: 'New Art Delivered',
    body: 'The moment holders had been waiting for. Metadata is updated on-chain and every holder receives their fully original, generative Ape — replacing the placeholder that launched with the mint. apesonape.io goes live as a creator-first playground: SoundCloud integration, AI studio, AOA Arcade, 3D avatars for the Otherside. The real AOA era begins.',
  },
  {
    date: 'Today',
    title: 'Creative Powerhouse',
    body: 'AOA doubles down on culture. NoTime, 2Real2x, SmokeThatDank, ApeProfessore — real artists releasing real music. 2M+ SoundCloud plays. Arcade games. Wardrobe drops. A community that ships daily and measures success in plays, not price. The DMCA story isn\'t baggage — it\'s the badge.',
  },
] as const;

export const STORY_FAQS = [
  {
    q: 'What is the DMCA story?',
    a: 'The original collection was hit with a DMCA from Yuga Labs for art too similar to BAYC. Rather than fold, the community rallied, scrapped the old art entirely, and launched a brand-new original collection. That rebirth is now foundational lore — a badge of resilience worn with pride.',
  },
  {
    q: 'What is ApeChain?',
    a: 'ApeChain is a Layer-3 blockchain built on Arbitrum Orbit, with native $APE as gas. Launched October 2024, it\'s built for NFTs, gaming, and creator tools. Transactions cost fractions of a cent. It\'s the official chain of the BAYC ecosystem. Every gas fee burns $APE and is matched by ApeCoin.',
  },
  {
    q: 'What is ApeCoin ($APE)?',
    a: 'The official token of BAYC, Otherside, and ApeChain. Total supply: 1 billion APE (98.5% circulating). Governance token, cultural currency, and gas on ApeChain. apecoin.com for live tokenomics.',
  },
  {
    q: 'When did AOA mint?',
    a: 'AOA originally launched in October 2024 — the same month ApeChain went live — with placeholder art. After a DMCA in December 2024 and a full art rebuild, the collection minted out as 10,000 generative apes on January 8–9, 2025. In December 2025, the metadata was updated on-chain and every holder received their fully original, final artwork.',
  },
  {
    q: 'What is the contract address?',
    a: '0xa6babe18f2318d2880dd7da3126c19536048f8b0 on ApeChain (Chain ID: 33139). Verify on ApeScan.',
  },
  {
    q: 'Can I use my Ape commercially?',
    a: 'Yes. AOA holders have full commercial rights to their token\'s artwork for personal and commercial projects.',
  },
  {
    q: 'How do I get started?',
    a: 'Get $APE → bridge via the Ape Portal → pick up an Ape on OpenSea → sign in to apesonape.io → instant access to music tools, creative studio, and arcade.',
  },
] as const;

export function storyEntry(title: string) {
  const entry = STORY_TIMELINE.find((item) => item.title === title);
  if (!entry) throw new Error(`Missing story entry: ${title}`);
  return entry;
}

export const ORIGINAL_ART = '/aoa-original-7650.png';
export const CURRENT_ART =
  'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs/7650.webp';
