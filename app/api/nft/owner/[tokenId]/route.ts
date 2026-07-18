import { NextResponse } from 'next/server';

const APECHAIN_RPCS = [
  'https://rpc.apechain.com/http',
  'https://apechain.calderachain.xyz/http',
];

const CONTRACT = '0xa6babe18f2318d2880dd7da3126c19536048f8b0';

/** Encode ownerOf(uint256 tokenId) calldata */
function encodeOwnerOf(tokenId: number): string {
  // ownerOf selector: keccak256("ownerOf(uint256)") = 0x6352211e
  const selector = '6352211e';
  const paddedId = tokenId.toString(16).padStart(64, '0');
  return `0x${selector}${paddedId}`;
}

/** Decode a 32-byte padded address result from eth_call */
function decodeAddress(result: string): string {
  // result is "0x" + 64 hex chars (32 bytes), address is the last 20 bytes
  return '0x' + result.slice(-40);
}

async function callRpc(rpc: string, tokenId: number): Promise<string> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: CONTRACT, data: encodeOwnerOf(tokenId) }, 'latest'],
      id: 1,
    }),
    // Short timeout so we fail fast to the next RPC
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'RPC error');
  if (!json.result || json.result === '0x') throw new Error('Empty result');

  return decodeAddress(json.result);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId } = await params;
  const id = parseInt(tokenId, 10);

  if (isNaN(id) || id < 1 || id > 10000) {
    return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
  }

  let lastError: unknown;
  for (const rpc of APECHAIN_RPCS) {
    try {
      const owner = await callRpc(rpc, id);
      return NextResponse.json(
        {
          tokenId: id,
          owner,
          apescanUrl: `https://apescan.io/address/${owner}`,
          openseaProfileUrl: `https://opensea.io/${owner}`,
          openseaNftUrl: `https://opensea.io/assets/apechain/${CONTRACT}/${id}`,
        },
        {
          headers: {
            // Cache owner for 2 min — NFTs trade infrequently
            'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
          },
        },
      );
    } catch (err) {
      lastError = err;
    }
  }

  console.error('[nft/owner] All RPCs failed:', lastError);
  return NextResponse.json({ error: 'Failed to fetch owner from blockchain' }, { status: 502 });
}
