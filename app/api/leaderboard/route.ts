import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase';
import { getLevelFromAoa } from '@/lib/progress/levels';
import { toGatewayUri } from '@/lib/studio/urls';

const APE_THUMB = 'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

function apeName(raw: unknown): string | null {
	if (!raw || typeof raw !== 'object') return null;
	const name = (raw as { name?: unknown }).name;
	return typeof name === 'string' && name.trim() ? name.trim() : null;
}

function apeImage(raw: unknown): string | null {
	if (!raw || typeof raw !== 'object') return null;
	const image = (raw as { image?: unknown; imageUrl?: unknown }).image ?? (raw as { imageUrl?: unknown }).imageUrl;
	if (typeof image !== 'string' || !image.trim() || image.includes('placehold.co')) return null;
	return toGatewayUri(image.trim());
}

/**
 * GET /api/leaderboard
 * Ape Board. Ranks only users who have earned AOA since the new ledger.
 * Old bananas balances are not used.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const supabase = getSupabaseServiceClient() ?? getSupabaseServerClient();

    const { data: progressRows, error } = await supabase
      .from('user_progress')
      .select('user_id, total_aoa')
      .gt('total_aoa', 0)
      .order('total_aoa', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json({ leaderboard: [] });
    }

    const ids = (progressRows || []).map((row) => row.user_id).filter(Boolean);
    const profiles = new Map<string, { display_name: string | null; x_username: string | null; avatar_url: string | null; forever_ape_id: number | null; selected_ape: unknown }>();
    if (ids.length) {
      const { data: people, error: profileError } = await supabase
        .from('user_profiles')
        .select('glyph_user_id, display_name, x_username, avatar_url, forever_ape_id, selected_ape')
        .in('glyph_user_id', ids);
      if (profileError) console.error('[leaderboard] profiles', profileError.message);
      for (const person of people ?? []) {
        profiles.set(String(person.glyph_user_id), person);
      }
    }

    const leaderboard = (progressRows || []).map((row, index) => {
      const profile = profiles.get(String(row.user_id));
      const aoa = Number(row.total_aoa ?? 0);
      const handle = profile?.x_username?.replace(/^@/, '').trim() || null;
      const foreverId = profile?.forever_ape_id != null ? Number(profile.forever_ape_id) : null;
      const displayName = profile?.display_name?.trim() || handle || apeName(profile?.selected_ape) || (foreverId != null ? `Ape #${foreverId}` : 'Anonymous');
      const avatarUrl = foreverId != null && Number.isFinite(foreverId)
        ? `${APE_THUMB}/${foreverId}.webp`
        : profile?.avatar_url?.trim() || apeImage(profile?.selected_ape) || null;
      return {
        rank: index + 1,
        displayName,
        username: handle,
        avatarUrl,
        aoa,
        level: getLevelFromAoa(aoa),
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in leaderboard endpoint:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
