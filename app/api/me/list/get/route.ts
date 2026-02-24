import { NextRequest, NextResponse } from 'next/server';

// Magic Eden Create Listings (Get Signing Data): https://docs.magiceden.io/reference/ixslistget
// Proxies POST to get listing signing data - caller must sign and submit to list creation API
const ME_EVM_API = 'https://api-mainnet.magiceden.dev/v4/evm-public';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.MAGIC_EDEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MAGIC_EDEN_API_KEY not configured' }, { status: 500 });
    }

    const body = await request.json();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const res = await fetch(`${ME_EVM_API}/ixs/list/get`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Magic Eden list/get error:', res.status, errText);
      return NextResponse.json(
        { error: 'Failed to get listing signing data' },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in list/get:', error);
    return NextResponse.json(
      { error: 'Failed to get listing signing data' },
      { status: 502 }
    );
  }
}
