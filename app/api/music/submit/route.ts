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
  } catch {
    return false;
  }
}

async function supabaseInsert(table: string, row: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert failed: ${err}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, apeId, title, soundcloudUrl, genre, description } = body;

    if (!wallet || !title || !soundcloudUrl) {
      return NextResponse.json({ error: 'wallet, title and soundcloudUrl are required' }, { status: 400 });
    }

    // Validate SoundCloud URL
    if (!soundcloudUrl.includes('soundcloud.com/')) {
      return NextResponse.json({ error: 'Please provide a valid SoundCloud URL' }, { status: 400 });
    }

    // Verify holder
    const isHolder = await verifyHolder(wallet);
    if (!isHolder) {
      return NextResponse.json({ error: 'Only Apes On Ape holders can submit music.' }, { status: 403 });
    }

    // Insert into Supabase
    await supabaseInsert('music_submissions', {
      wallet_address: wallet.toLowerCase(),
      ape_id: apeId ? parseInt(apeId) : null,
      title: title.trim().slice(0, 120),
      soundcloud_url: soundcloudUrl.trim(),
      genre: genre?.trim() || null,
      description: description?.trim().slice(0, 500) || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Track submitted for review!' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // If Supabase table doesn't exist yet, return a friendly error
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json({ 
        error: 'Submissions are being set up. Please try again shortly.',
        debug: msg 
      }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/music_submissions?status=eq.${status}&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Supabase error ${res.status}`);
    const submissions = await res.json();
    return NextResponse.json({ submissions });
  } catch {
    return NextResponse.json({ submissions: [] });
  }
}
