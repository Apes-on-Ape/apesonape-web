import { NextResponse } from 'next/server';

/**
 * General Shop catalog (Arcade hub).
 * Reserved for future: dynamic items, prices, and stock from Supabase.
 * Client currently uses a placeholder shop UI in the Next.js arcade hub.
 */
export async function GET() {
  return NextResponse.json({
    comingSoon: true,
    message: 'General Shop catalog — purchases not enabled yet',
    currency: 'arcade_coins',
    categories: [
      { id: 'wardrobe', label: 'Wardrobe', description: 'Cosmetics & frames' },
      { id: 'tools', label: 'Tools', description: 'Studio / utility unlocks' },
      { id: 'boosts', label: 'Boosts', description: 'Temporary multipliers & shields' },
      { id: 'vault', label: 'Vault', description: 'Rare & limited items' },
    ],
    items: [] as unknown[],
  });
}
