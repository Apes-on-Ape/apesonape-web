import { NextRequest, NextResponse } from 'next/server';

const GATEWAYS = [
	'https://ipfs.io/ipfs/',
	'https://cloudflare-ipfs.com/ipfs/',
	'https://gateway.pinata.cloud/ipfs/',
	'https://moccasin-brilliant-silkworm-382.mypinata.cloud/ipfs/',
];

const CID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{20,})$/;

function cidFrom(raw: string): string | null {
	const value = raw.trim();
	if (CID.test(value)) return value;
	if (value.startsWith('ipfs://')) {
		const cid = value.slice('ipfs://'.length).replace(/^ipfs\//, '').split('/')[0] || '';
		return CID.test(cid) ? cid : null;
	}
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:') return null;
	const allowed = GATEWAYS.some((gateway) => value.startsWith(gateway));
	if (!allowed) return null;
	const match = url.pathname.match(/\/ipfs\/([^/]+)/);
	const cid = match?.[1] || '';
	return CID.test(cid) ? cid : null;
}

export async function GET(req: NextRequest) {
	const raw = new URL(req.url).searchParams.get('url') || new URL(req.url).searchParams.get('cid') || '';
	const cid = cidFrom(raw);
	if (!cid) {
		return NextResponse.json({ error: 'Only an IPFS CID or an approved gateway URL is allowed.' }, { status: 400 });
	}

	let lastStatus = 502;
	for (const gateway of GATEWAYS) {
		try {
			const res = await fetch(`${gateway}${cid}`, { cache: 'no-store', redirect: 'error' });
			if (!res.ok) {
				lastStatus = res.status;
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
	return NextResponse.json({ error: 'Could not load that IPFS file.' }, { status: lastStatus });
}
