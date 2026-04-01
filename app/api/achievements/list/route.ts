import { NextResponse } from 'next/server';
import { getArcadeSupabase } from '@/lib/arcade-db';

function isTransientFetchError(error: unknown): boolean {
  const e = error as { message?: string; details?: string } | null;
  const msg = `${e?.message ?? ''} ${e?.details ?? ''}`.toLowerCase();
  return msg.includes('fetch failed') || msg.includes('econnreset');
}

async function queryAchievementsWithRetry(maxAttempts = 2) {
  const supabase = getArcadeSupabase();
  let lastError: unknown = null;
  for (let i = 0; i < maxAttempts; i += 1) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true });
    if (!error) return { data, error: null };
    lastError = error;
    if (!isTransientFetchError(error) || i === maxAttempts - 1) {
      return { data: null, error };
    }
    await new Promise((r) => setTimeout(r, 150 * (i + 1)));
  }
  return { data: null, error: lastError };
}

export async function GET() {
  try {
    const { data, error } = await queryAchievementsWithRetry(2);

    if (error) {
      console.error('[achievements/list]', error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error('[achievements/list]', e);
    return NextResponse.json([]);
  }
}
