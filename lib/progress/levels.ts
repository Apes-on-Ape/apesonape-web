/** AOA required to *be* this level. Level 1 starts at 0. */
export function getAoaRequiredForLevel(level: number): number {
	if (level <= 1) return 0;
	return 50 * level * level + 100 * level - 150;
}

/** Highest level whose threshold is still <= totalAoa. Caps at 100. */
export function getLevelFromAoa(totalAoa: number): number {
	const aoa = Math.max(0, Math.floor(totalAoa));
	let level = 1;
	while (level < 100 && aoa >= getAoaRequiredForLevel(level + 1)) {
		level += 1;
	}
	return level;
}

export function getLevelProgress(totalAoa: number): {
	level: number;
	currentLevelAoa: number;
	nextLevelAoa: number;
	progressPercent: number;
} {
	const aoa = Math.max(0, Math.floor(totalAoa));
	const level = getLevelFromAoa(aoa);
	const currentLevelAoa = getAoaRequiredForLevel(level);
	const nextLevelAoa = level >= 100 ? currentLevelAoa : getAoaRequiredForLevel(level + 1);
	const span = Math.max(1, nextLevelAoa - currentLevelAoa);
	const progressPercent = level >= 100 ? 100 : Math.min(100, Math.round(((aoa - currentLevelAoa) / span) * 100));
	return { level, currentLevelAoa, nextLevelAoa, progressPercent };
}
