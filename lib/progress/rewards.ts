/**
 * Server-owned AOA amounts. Clients never send these.
 * Arcade achievement XP is a different scale (about 150–6000) from bananas (about 2–200).
 * Dividing by 7.5 lands "First Game" (375 XP) at 50 AOA, which matches the ecosystem scale.
 */
export const AOA_REWARDS = {
	arcadeRun: 5,
	arcadePersonalBest: 25,
	studioPublish: 100,
	studioFirstTransmission: 100,
	studioTenTransmissions: 500,
	dailyActivity: 5,
} as const;

/** Studio Profile Achievements. Collection and Arcade rows use reward_xp from `achievements`, converted by arcadeAchievementAoa. */
export const PROFILE_ACHIEVEMENT_AOA = {
	firstTransmission: 100,
	signalBuilder: 200,
	transmitter: 500,
	prolificApe: 750,
} as const;

export const AOA_DAILY_CAPS = {
	arcadeRun: 10,
	/** AOA for Studio publishes, and the hard limit on creations per UTC day. */
	studioPublish: 5,
} as const;

export function arcadeAchievementAoa(rewardXp: number): number {
	if (!Number.isFinite(rewardXp) || rewardXp <= 0) return 0;
	return Math.max(25, Math.round(rewardXp / 7.5));
}

export type EcosystemCategory = 'arcade' | 'studio' | 'collection' | 'community' | 'legacy';

export function ecosystemCategory(raw: string | null | undefined): EcosystemCategory {
	const value = (raw || '').toLowerCase();
	if (value === 'collection') return 'collection';
	if (value === 'community') return 'community';
	if (value === 'studio' || value === 'gallery' || value === 'creative') return 'studio';
	if (value === 'legacy' || value === 'milestone') return 'legacy';
	if (value === 'social') return 'community';
	return 'arcade';
}
