import { awardAoa } from './award';
import { AOA_DAILY_CAPS, AOA_REWARDS, arcadeAchievementAoa } from './rewards';

function utcDay() {
	return new Date().toISOString().slice(0, 10);
}

function utcMinute() {
	return new Date().toISOString().slice(0, 16);
}

export function arcadeRunDedupe(userId: string, gameId: string, score: number) {
	return `arcade:run:${gameId}:${userId}:${utcMinute()}:${score}`;
}

export function arcadePersonalBestDedupe(userId: string, gameId: string, score: number) {
	return `arcade:personal-best:${gameId}:${userId}:${score}`;
}

export async function awardArcadeRun(userId: string, gameId: string, score: number) {
	return awardAoa({
		userId,
		source: 'arcade',
		action: 'run',
		referenceId: gameId,
		amount: AOA_REWARDS.arcadeRun,
		dedupeKey: arcadeRunDedupe(userId, gameId, score),
		metadata: { gameId, score },
		dailyCap: AOA_DAILY_CAPS.arcadeRun,
	});
}

export async function awardArcadePersonalBest(userId: string, gameId: string, score: number) {
	return awardAoa({
		userId,
		source: 'arcade',
		action: 'personal-best',
		referenceId: gameId,
		amount: AOA_REWARDS.arcadePersonalBest,
		dedupeKey: arcadePersonalBestDedupe(userId, gameId, score),
		metadata: { gameId, score },
	});
}

export async function awardArcadeAchievement(userId: string, achievementId: string, rewardXp: number) {
	const amount = arcadeAchievementAoa(rewardXp);
	if (amount <= 0) return { awarded: false, reason: 'no_reward' };
	return awardAoa({
		userId,
		source: 'achievement',
		action: 'arcade',
		referenceId: achievementId,
		amount,
		dedupeKey: `achievement:${achievementId}:${userId}`,
		metadata: { achievementId },
	});
}

export async function awardStudioPublish(userId: string, creationId: string) {
	return awardAoa({
		userId,
		source: 'studio',
		action: 'publish',
		referenceId: creationId,
		amount: AOA_REWARDS.studioPublish,
		dedupeKey: `studio:publish:${creationId}`,
		dailyCap: AOA_DAILY_CAPS.studioPublish,
	});
}

export async function awardDailyActivity(userId: string) {
	return awardAoa({
		userId,
		source: 'streak',
		action: 'day',
		referenceId: utcDay(),
		amount: AOA_REWARDS.dailyActivity,
		dedupeKey: `streak:${utcDay()}:${userId}`,
	});
}
