export function toGatewayUri(uri: string): string {
	if (!uri) return '';
	if (uri.startsWith('ipfs://')) {
		const cid = uri.replace('ipfs://', '');
		return `https://ipfs.io/ipfs/${cid}`;
	}
	return uri;
}

