import { NextResponse } from 'next/server';
import { BADGE_DEFS } from '@/lib/badges/types';

/**
 * GET /api/badges/all
 * Returns all badge definitions (for displaying all badges including unowned)
 */
export async function GET() {
  const badges = BADGE_DEFS.map((def) => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    asset: def.asset,
    category: def.category,
  }));

  return NextResponse.json({ badges });
}
