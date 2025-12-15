export function toGatewayUri(uri: string): string {
	if (!uri) return '';
	try {
		const u = new URL(uri);
		// If artifact was saved with production hostname but path is /studio/*, map to relative for local dev
		if (u.hostname.includes('apesonape.io') && u.pathname.startsWith('/studio/')) {
			return u.pathname;
		}
	} catch {
		// not a full URL, continue
	}
	if (uri.startsWith('ipfs://')) {
		const cid = uri.replace('ipfs://', '');
		return `${preferredGatewayBase()}${cid}`;
	}
	return uri;
}

const DEFAULT_GATEWAYS = [
	'https://gateway.pinata.cloud/ipfs/',
	'https://ipfs.io/ipfs/',
	'https://cloudflare-ipfs.com/ipfs/',
];

function preferredGatewayBase() {
	const envGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || process.env.NEXT_PUBLIC_IPFS_GATEWAY;
	if (envGateway) {
		const trimmed = envGateway.endsWith('/') ? envGateway : `${envGateway}/`;
		return trimmed;
	}
	return DEFAULT_GATEWAYS[0];
}

export function gatewayCandidates(uri: string): string[] {
	if (!uri || !uri.startsWith('ipfs://')) return [toGatewayUri(uri)];
	const cid = uri.replace('ipfs://', '');
	const envGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || process.env.NEXT_PUBLIC_IPFS_GATEWAY;
	const bases = envGateway ? [envGateway] : DEFAULT_GATEWAYS;
	return bases.map((b) => {
		const base = b.endsWith('/') ? b : `${b}/`;
		return `${base}${cid}`;
	});
}

