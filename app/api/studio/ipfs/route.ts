import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_GATEWAYS = [
	'https://ipfs.io/ipfs/',
	'https://cloudflare-ipfs.com/ipfs/',
	'https://gateway.pinata.cloud/ipfs/',
];

function extractCid(input: string): string | null {
	if (input.startsWith('ipfs://')) {
		return input.replace('ipfs://', '').replace(/^ipfs\//, '');
	}
	const match = input.match(/\/ipfs\/([a-zA-Z0-9]+)(\/.*)?$/);
	return match ? match[1] : null;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const raw = searchParams.get('url');
		if (!raw) {
			return NextResponse.json({ error: 'Missing url' }, { status: 400 });
		}
		const url = new URL(raw);
		if (!['http:', 'https:', 'ipfs:'].includes(url.protocol)) {
			return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
		}

		const cid = extractCid(raw);
		const gateways = cid ? DEFAULT_GATEWAYS.map((g) => `${g}${cid}`) : [url.toString()];
		let lastStatus = 500;
		let lastText = 'Fetch failed';

		for (const gatewayUrl of gateways) {
			try {
				const res = await fetch(gatewayUrl, { cache: 'no-store' });
				if (!res.ok) {
					lastStatus = res.status;
					lastText = await res.text().catch(() => 'Fetch failed');
					continue;
				}
				const contentType = res.headers.get('content-type') || 'application/octet-stream';
				const buffer = Buffer.from(await res.arrayBuffer());
				return new NextResponse(buffer, {
					headers: {
						'Content-Type': contentType,
						'Cache-Control': 's-maxage=120, stale-while-revalidate=60',
					},
				});
			} catch {
				continue;
			}
		}

		return NextResponse.json({ error: lastText }, { status: lastStatus });
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : 'Failed to fetch';
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
