/** OpenSea profile for a wallet. Same host shape as the collection owner link. */
export function getOpenSeaProfileUrl(address: string) {
	const wallet = address.trim();
	return `https://opensea.io/${wallet}`;
}
