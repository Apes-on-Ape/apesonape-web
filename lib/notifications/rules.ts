export function aoaMetadata(amount: number | null | undefined) {
	const value = Math.floor(Number(amount ?? 0));
	if (!Number.isFinite(value) || value <= 0) return {};
	return { aoa: value };
}

/** Tokens that should raise a new-Ape notification. The first scan is a baseline. */
export function tokenIdsToAnnounce(hasBaseline: boolean, knownIds: number[], currentIds: number[]) {
	if (!hasBaseline) return [];
	const seen = new Set(knownIds);
	return currentIds.filter((id) => !seen.has(id));
}
