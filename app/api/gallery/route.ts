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
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> || {}),
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 24;
  const offset = (page - 1) * limit;
  const tool = searchParams.get('tool');

  try {
    let path = `gallery_items?status=eq.approved&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (tool) path += `&tool_used=eq.${encodeURIComponent(tool)}`;

    const res = await sbFetch(path);
    if (!res.ok) return NextResponse.json({ items: [], total: 0 });
    const items = await res.json();

    const countRes = await sbFetch('gallery_items?status=eq.approved&select=count');
    const countData = countRes.ok ? await countRes.json() : [];
    const total = Array.isArray(countData) && countData[0]?.count ? parseInt(countData[0].count) : 0;

    return NextResponse.json({ items: Array.isArray(items) ? items : [], total });
  } catch {
    return NextResponse.json({ items: [], total: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const wallet = formData.get('wallet') as string;
    const title = formData.get('title') as string;
    const tool = formData.get('tool') as string;
    const apeId = formData.get('apeId') as string;
    const imageFile = formData.get('image') as File | null;

    if (!wallet || !title || !imageFile) {
      return NextResponse.json({ error: 'wallet, title and image are required' }, { status: 400 });
    }

    const isHolder = await verifyHolder(wallet);
    if (!isHolder) {
      return NextResponse.json({ error: 'Only Apes On Ape holders can submit to the gallery.' }, { status: 403 });
    }

    // Upload image to Supabase storage
    const ext = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${wallet.toLowerCase()}_${Date.now()}.${ext}`;
    const arrayBuffer = await imageFile.arrayBuffer();

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/gallery/${fileName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': imageFile.type || 'image/jpeg',
        'x-upsert': 'false',
      },
      body: arrayBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Image upload failed: ${err}`);
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/gallery/${fileName}`;

    const insertRes = await sbFetch('gallery_items', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        wallet_address: wallet.toLowerCase(),
        ape_id: apeId ? parseInt(apeId) : null,
        title: title.trim().slice(0, 100),
        image_url: imageUrl,
        tool_used: tool || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        likes: 0,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      if (err.includes('does not exist') || err.includes('relation')) {
        return NextResponse.json({ error: 'Gallery is being set up. Please try again shortly.' }, { status: 503 });
      }
      throw new Error(err);
    }

    return NextResponse.json({ success: true, message: 'Submitted for review!' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
