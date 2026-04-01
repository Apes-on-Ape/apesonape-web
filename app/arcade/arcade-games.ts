export type ArcadeGame = {
  slug: string;
  title: string;
  description: string;
  path: string;
};

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    slug: 'block-dodger',
    title: 'Block Dodger',
    description: 'Fast reflexes, clean movement, survive the storm.',
    path: '/arcade/block-dodger/index.html',
  },
  {
    slug: 'neon-racer',
    title: 'Neon Racer',
    description: 'Retro speed runs with arcade chaos.',
    path: '/arcade/neon-racer/index.html',
  },
  {
    slug: 'galaxy-ape',
    title: 'Galaxy Ape',
    description: 'Space run with endless hazards and score grind.',
    path: '/arcade/galaxy-ape/index.html',
  },
  {
    slug: 'ape-man',
    title: 'Ape Man',
    description: 'Classic platform challenge with Ape twist.',
    path: '/arcade/ape-man/index.html',
  },
  {
    slug: 'flappy-ape',
    title: 'Flappy Ape',
    description: 'Simple controls, brutal timing.',
    path: '/arcade/flappy-ape/index.html',
  },
  {
    slug: 'tailstrike-arena',
    title: 'Tailstrike Arena',
    description: 'Arcade arena combat and movement mastery.',
    path: '/arcade/tailstrike-arena/dist/index.html',
  },
];

export function getArcadeGame(slug: string) {
  return ARCADE_GAMES.find((game) => game.slug === slug);
}

/** `game_scores.game_id` values (see each game’s config / database). */
export const ARCADE_LEADERBOARD_GAMES: { slug: string; title: string; gameId: string }[] = [
  { slug: 'block-dodger', title: 'Block Dodger', gameId: 'block_dodger' },
  { slug: 'neon-racer', title: 'Neon Racer', gameId: 'neon_racer' },
  { slug: 'galaxy-ape', title: 'Galaxy Ape', gameId: 'galaxy_ape' },
  { slug: 'ape-man', title: 'Ape Man', gameId: 'ape_man' },
  { slug: 'flappy-ape', title: 'Flappy Ape', gameId: 'flappy_ape' },
  { slug: 'tailstrike-arena', title: 'Tailstrike Arena', gameId: 'tailstrike_arena' },
];
