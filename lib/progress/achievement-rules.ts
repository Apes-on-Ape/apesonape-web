/** Pure unlock rules. Amounts and dedupe keys are chosen here, never by the client. */

export function meetsAchievementThreshold(current: number, target: number) {
	return Number.isFinite(current) && Number.isFinite(target) && current >= target;
}

export function shouldInsertUnlock(input: { current: number; target: number; alreadyUnlocked: boolean; aoaReward: number }) {
	if (input.alreadyUnlocked) return false;
	if (!Number.isFinite(input.aoaReward) || input.aoaReward <= 0) return false;
	return meetsAchievementThreshold(input.current, input.target);
}

export function profileAchievementDedupeKey(achievementId: string, userId: string) {
	return `profile-achievement:${achievementId}:${userId}`;
}
