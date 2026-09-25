/** Stable public profile path. Wallet addresses are not profile URLs. */
export function profileHref(username: string | null | undefined) {
	const handle = (username || '').replace(/^@/, '').trim();
	if (!/^[A-Za-z0-9_]{1,20}$/.test(handle)) return null;
	return `/profile/${encodeURIComponent(handle)}/`;
}

export function xProfileUrl(username: string) {
	const handle = username.replace(/^@/, '').trim();
	return `https://x.com/${encodeURIComponent(handle)}`;
}
