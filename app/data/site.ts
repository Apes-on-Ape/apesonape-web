/**
 * Single source of truth for site-level content:
 * slogans, navigation, social links, CTAs.
 * Import here instead of scattering strings across components.
 */

export const BRAND = {
  name: 'Apes On Ape',
  shortName: 'AOA',
  tagline: 'Still here.',
  musicCall: 'Turn your volume up',
  participationCall: 'Apes together strong.',
  apesTogether: 'Apes together strong.',
  believe: 'Believe in something.',
  subline: '10,000 apes started something.',
  sublineAlt: 'Believe in something.',
  storyTeaser: "The art disappeared. The community didn't.",
  url: 'https://apesonape.io',
} as const;

/** Flip these without editing components. */
export const SITE_MODE = {
  announcement: {
    enabled: false,
    text: 'Still here.',
  },
  event: {
    enabled: false,
    title: '11:11',
    message: 'Turn it up.',
    href: '/music',
  },
} as const;

export const FOOTER_WHISPERS = [
  'Believe in something.',
  'Apes together strong.',
  'Still here.',
  '10,000.',
] as const;

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

/** Primary desktop nav links (order matters). Href values stay on existing routes. */
export const PRIMARY_NAV: NavLink[] = [
  { label: 'Signal', href: '/' },
  { label: 'Collection', href: '/collection' },
  { label: 'Radio', href: '/music' },
  { label: 'Studio', href: '/studio' },
  { label: 'Arcade', href: '/arcade' },
  { label: 'Wardrobe', href: '/wardrobe' },
  { label: 'Story', href: '/story' },
];

/** Right-side nav. Connect stays in AuthNavControls. */
export const NAV_CTAS: NavLink[] = [];

export interface SocialLink {
  label: string;
  href: string;
  platform: 'x' | 'discord' | 'soundcloud' | 'spotify' | 'youtube';
}

export const SOCIALS: SocialLink[] = [
  { label: 'X (Twitter)', href: 'https://x.com/apesonape', platform: 'x' },
  { label: 'Discord', href: 'https://discord.gg/gVmqW6SExU', platform: 'discord' },
  { label: 'SoundCloud', href: 'https://soundcloud.com/apesonape', platform: 'soundcloud' },
  { label: 'Spotify', href: 'https://open.spotify.com/artist/5jWLGE3ZNCyau37PWs20AP', platform: 'spotify' },
];

export interface FooterSection {
  heading: string;
  links: NavLink[];
}

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    heading: 'Music',
    links: [
      { label: 'Radio', href: '/music' },
      { label: 'Artists', href: '/music#artists' },
    ],
  },
  {
    heading: 'Make',
    links: [
      { label: 'Studio', href: '/studio' },
      { label: 'Toolbox', href: '/creative' },
      { label: 'Arcade', href: '/arcade' },
    ],
  },
  {
    heading: 'Network',
    links: [
      { label: 'Story', href: '/story' },
      { label: 'Join', href: '/join' },
      { label: 'Collection', href: '/collection' },
      { label: 'Wardrobe', href: '/wardrobe' },
      { label: 'OpenSea', href: 'https://opensea.io/collection/apes-on-apechain', external: true },
    ],
  },
];

/** Contract for Apescan link in footer bottom bar */
export const CONTRACT_APESCAN = 'https://apescan.io/address/0xa6babe18f2318d2880dd7da3126c19536048f8b0';

/** Homepage CTA buttons */
export const HOME_CTAS = {
  primary: { label: 'Listen', href: '/music' },
  secondary: { label: 'Join', href: '/join' },
  tertiary: { label: 'The long version', href: '/story' },
} as const;
