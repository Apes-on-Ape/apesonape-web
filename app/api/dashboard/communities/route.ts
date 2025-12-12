import { NextRequest, NextResponse } from 'next/server';
import { getDashboardCommunities } from '@/lib/dashboard/service';
import type { Period } from '@/lib/dashboard/types';

const VALID_PERIODS: Period[] = ['7d', '24h'];
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

function parsePeriod(input: string | null): Period {
  if (input && VALID_PERIODS.includes(input as Period)) {
    return input as Period;
  }
  return '7d';
}

function parseLimit(input: string | null): number {
  const parsed = Number.parseInt(input || '', 10);
  if (Number.isFinite(parsed)) {
    return Math.min(Math.max(parsed, 1), MAX_LIMIT);
  }
  return DEFAULT_LIMIT;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = parsePeriod(searchParams.get('period'));
  const limit = parseLimit(searchParams.get('limit'));

  try {
    const snapshot = await getDashboardCommunities({ period, limit });
    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('dashboard communities error', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


