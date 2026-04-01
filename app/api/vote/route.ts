import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://bqcrbcpmimfojnjdhvrz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
const CONTRACT = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';
const ME_API_KEY = process.env.MAGIC_EDEN_API_KEY || '';

async function verifyHolder(wallet: string): Promise<boolean> {
  try {
    const url = `https://api-mainnet.magiceden.dev/v3/rtp/apechain/users/${wallet}/tokens/v10?collection=${CONTRACT}&limit=1`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${ME_API_KEY}` } });
    if (!res.ok) return false;
    const data = await res.json();
    return (data.tokens || []).length > 0;
  } catch { return false; }
}

async function sbFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string,string> || {}),
    },
  });
  return res;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pollId = searchParams.get('pollId');
  if (!pollId) return NextResponse.json({ error: 'pollId required' }, { status: 400 });

  try {
    const res = await sbFetch(`votes?poll_id=eq.${encodeURIComponent(pollId)}&select=option_id`);
    if (!res.ok) return NextResponse.json({ votes: {} });
    const rows: Array<{ option_id: string }> = await res.json();
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.option_id] = (counts[row.option_id] || 0) + 1;
    }
    return NextResponse.json({ votes: counts, total: rows.length });
  } catch {
    return NextResponse.json({ votes: {}, total: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { wallet, pollId, optionId } = await req.json();
    if (!wallet || !pollId || !optionId) {
      return NextResponse.json({ error: 'wallet, pollId, optionId required' }, { status: 400 });
    }

    const isHolder = await verifyHolder(wallet);
    if (!isHolder) {
      return NextResponse.json({ error: 'Only Apes On Ape holders can vote.' }, { status: 403 });
    }

    // Check for duplicate vote
    const checkRes = await sbFetch(`votes?poll_id=eq.${encodeURIComponent(pollId)}&wallet_address=eq.${wallet.toLowerCase()}&select=id`);
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({ error: 'You have already voted on this poll.' }, { status: 409 });
      }
    }

    const insertRes = await sbFetch('votes', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        poll_id: pollId,
        wallet_address: wallet.toLowerCase(),
        option_id: optionId,
        created_at: new Date().toISOString(),
      }),
    });
    if (!insertRes.ok) {
      const err = await insertRes.text();
      if (err.includes('does not exist') || err.includes('relation')) {
        return NextResponse.json({ error: 'Voting is being set up. Please try again shortly.' }, { status: 503 });
      }
      throw new Error(err);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
