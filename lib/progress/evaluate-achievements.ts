import { getSupabaseServiceClient } from '@/lib/supabase';
import { AOA_ERA_START } from './era-start';
import { magicEdenAPI } from '@/lib/magic-eden';
import { awardAoa } from './award';
import { isEvmAddress, normalizeAliasWallet } from '@/lib/profile/wallet-alias';
import { loadProfileAchievements, type ProfileAchievementDef } from './profile-achievements';
import { profileAchievementDedupeKey, shouldInsertUnlock } from './achievement-rules';
import { aoaMetadata, createNotification } from '@/lib/notifications/create';

export type AchievementGroup = 'collection' | 'creator' | 'activity' | 'community' | 'explorer';

export type AchievementStats = {
	apes: number;
	publishes: number;
	runsByGame: Record<string, number>;
	totalRuns: number;
	gamesPlayed: number;
	bestScore: number;
	points: number;
};

export type AchievementCard = {
	id: string;
	name: string;
	description: string;
	category: string;
	aoaReward: number;
	hidden: boolean;
	unlocked: boolean;
	unlockedAt: string | null;
	progress: number | null;
	target: number | null;
};

const LEGACY_DEDUPE: Record<string, string> = {
	first_transmission: 'achievement:first_studio_transmission:',
	transmitter: 'achievement:ten_transmissions:',
	first_game: 'achievement:first_game:',
};

const EMPTY_STATS: AchievementStats = {
	apes: 0,
	publishes: 0,
	runsByGame: {},
	totalRuns: 0,
	gamesPlayed: 0,
	bestScore: 0,
	points: 0,
};

function missingTable(error: { code?: string; message?: string } | null) {
	const message = error?.message ?? '';
	return error?.code === '42P01' || message.includes('user_profile_achievements');
}

async function countDistinctApes(wallets: string[]) {
	const unique = [...new Set(wallets.map(normalizeAliasWallet).filter(isEvmAddress))];
	if (!unique.length) return 0;
	const lists = await Promise.all(unique.map((wallet) => magicEdenAPI.getWalletTokenIds(wallet).catch(() => [] as number[])));
	return new Set(lists.flat()).size;
}

async function countPublishes(userId: string) {
	const supabase = getSupabaseServiceClient();
	if (!supabase) return 0;
	const { data: profile } = await supabase
		.from('user_profiles')
		.select('wallet_address')
		.eq('glyph_user_id', userId)
		.maybeSingle();
	const wallet = String(profile?.wallet_address ?? '').trim();
	const ids = new Set<string>();
	const byProfile = await supabase
		.from('studio_creations')
		.select('id')
		.gte('created_at', AOA_ERA_START)
		.filter('glyph_profile->>glyphId', 'eq', userId);
	if (byProfile.error) {
		console.error(JSON.stringify({ scope: 'studio-activity', event: 'creation_count_failed', userId, reason: byProfile.error.message }));
	}
	for (const row of byProfile.data ?? []) ids.add(String(row.id));
	if (wallet) {
		const byWallet = await supabase
			.from('studio_creations')
			.select('id')
			.gte('created_at', AOA_ERA_START)
			.ilike('creator_address', wallet);
		if (byWallet.error) {
			console.error(JSON.stringify({ scope: 'studio-activity', event: 'creation_count_failed', userId, reason: byWallet.error.message }));
		}
		for (const row of byWallet.data ?? []) ids.add(String(row.id));
	}
	const activity = await supabase
		.from('user_activity_events')
		.select('reference_id')
		.eq('user_id', userId)
		.eq('source', 'studio')
		.in('action', ['transmission_published', 'transmission_remixed'])
		.gte('occurred_at', AOA_ERA_START);
	if (activity.error) {
		const message = activity.error.message ?? '';
		if (activity.error.code !== '42P01' && !message.includes('user_activity_events')) {
			console.error(JSON.stringify({ scope: 'studio-activity', event: 'activity_count_failed', userId, reason: message }));
		}
	} else {
		for (const row of activity.data ?? []) {
			if (row.reference_id) ids.add(String(row.reference_id));
		}
	}
	return ids.size;
}

function scoreFromRunKey(dedupeKey: string) {
	const match = /:(\d+)$/.exec(dedupeKey);
	return match ? Number(match[1]) : 0;
}

type ArcadeLedger = {
	runsByGame: Record<string, number>;
	bestByGame: Record<string, number>;
	pointsByGame: Record<string, number>;
};

function summarizeLedger(ledger: ArcadeLedger) {
	const runs = Object.values(ledger.runsByGame);
	const bests = Object.values(ledger.bestByGame);
	const pointValues = Object.values(ledger.pointsByGame);
	return {
		runsByGame: ledger.runsByGame,
		totalRuns: runs.reduce((sum, count) => sum + count, 0),
		gamesPlayed: runs.filter((count) => count > 0).length,
		bestScore: bests.reduce((best, score) => Math.max(best, score), 0),
		points: pointValues.reduce((sum, score) => sum + score, 0),
	};
}

/** Completed runs already stored on user_activity_events. Score is in metadata, or the last segment of the dedupe key. */
export async function arcadeEraFromActivity(userId: string): Promise<ArcadeLedger> {
	const supabase = getSupabaseServiceClient();
	const empty = { runsByGame: {}, bestByGame: {}, pointsByGame: {} };
	if (!supabase) return empty;
	const { data, error } = await supabase
		.from('user_activity_events')
		.select('reference_id, dedupe_key, metadata')
		.eq('user_id', userId)
		.eq('source', 'arcade')
		.eq('action', 'run_completed')
		.gte('occurred_at', AOA_ERA_START);
	if (error || !data) return empty;
	const ledger: ArcadeLedger = { runsByGame: {}, bestByGame: {}, pointsByGame: {} };
	for (const row of data) {
		const gameId = String(row.reference_id ?? '').trim();
		if (!gameId) continue;
		const metadata = (row.metadata ?? {}) as { score?: number };
		const score = Number(metadata.score ?? scoreFromRunKey(String(row.dedupe_key ?? '')));
		const safeScore = Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
		ledger.runsByGame[gameId] = (ledger.runsByGame[gameId] ?? 0) + 1;
		ledger.bestByGame[gameId] = Math.max(ledger.bestByGame[gameId] ?? 0, safeScore);
		ledger.pointsByGame[gameId] = (ledger.pointsByGame[gameId] ?? 0) + safeScore;
	}
	return ledger;
}

function eraTableMissing(error: { code?: string; message?: string }) {
	const message = error.message ?? '';
	return error.code === '42P01' || error.code === 'PGRST205' || message.includes('Could not find the table');
}

async function arcadeEra(userId: string) {
	const activity = await arcadeEraFromActivity(userId);
	const supabase = getSupabaseServiceClient();
	if (!supabase) return summarizeLedger(activity);
	const withPoints = await supabase.from('aoa_arcade_era').select('game_id, runs, best_score, points_total').eq('user_id', userId);
	if (withPoints.error && eraTableMissing(withPoints.error)) return summarizeLedger(activity);
	const queried = withPoints.error
		? await supabase.from('aoa_arcade_era').select('game_id, runs, best_score').eq('user_id', userId)
		: withPoints;
	if (queried.error && eraTableMissing(queried.error)) return summarizeLedger(activity);
	const ledger: ArcadeLedger = {
		runsByGame: { ...activity.runsByGame },
		bestByGame: { ...activity.bestByGame },
		pointsByGame: { ...activity.pointsByGame },
	};
	for (const row of queried.data ?? []) {
		const gameId = String(row.game_id);
		const eraRuns = Number(row.runs ?? 0);
		const activityRuns = activity.runsByGame[gameId] ?? 0;
		ledger.runsByGame[gameId] = Math.max(eraRuns, activityRuns);
		ledger.bestByGame[gameId] = Math.max(Number(row.best_score ?? 0), activity.bestByGame[gameId] ?? 0);
		const eraPoints = Number((row as { points_total?: number }).points_total ?? 0);
		ledger.pointsByGame[gameId] = Math.max(eraPoints, activity.pointsByGame[gameId] ?? 0);
	}
	return summarizeLedger(ledger);
}

function progressFor(def: ProfileAchievementDef, stats: AchievementStats) {
	if (def.criteriaType === 'manual') return 0;
	if (def.criteriaType === 'apes_owned') return stats.apes;
	if (def.criteriaType === 'studio_publishes') return stats.publishes;
	if (def.criteriaType === 'total_runs') return stats.totalRuns;
	if (def.criteriaType === 'game_runs') return stats.runsByGame[def.gameId ?? ''] ?? 0;
	if (def.criteriaType === 'game_variety') return stats.gamesPlayed;
	if (def.criteriaType === 'single_score' || def.criteriaType === 'any_score') return stats.bestScore;
	if (def.criteriaType === 'total_points') return stats.points;
	return 0;
}

function groupFor(def: ProfileAchievementDef): AchievementGroup {
	if (def.category === 'collection') return 'collection';
	if (def.category === 'creator') return 'creator';
	if (def.category === 'community') return 'community';
	if (def.category === 'explorer') return 'explorer';
	return 'activity';
}

async function alreadyPaidLegacy(userId: string, achievementId: string) {
	const prefix = LEGACY_DEDUPE[achievementId];
	if (!prefix) return false;
	const supabase = getSupabaseServiceClient();
	if (!supabase) return false;
	const { data } = await supabase
		.from('user_progress_events')
		.select('id')
		.eq('dedupe_key', `${prefix}${userId}`)
		.maybeSingle();
	return Boolean(data);
}

/**
 * Unlocks Profile Achievements that the current stats already satisfy.
 * Collection uses current ownership. Studio and Arcade use new-era ledger counts only.
 * Does not throw into publish or score paths.
 */
export async function evaluateProfileAchievements(
	userId: string,
	options: { groups?: AchievementGroup[]; wallets?: string[] } = {},
) {
	const id = userId.trim();
	if (!id) return EMPTY_STATS;
	const supabase = getSupabaseServiceClient();
	if (!supabase) return EMPTY_STATS;
	const groups = new Set(options.groups ?? ['collection', 'creator', 'activity', 'community', 'explorer']);

	try {
		const needsArcade = groups.has('activity') || groups.has('explorer');
		const [publishes, era, apes, catalog] = await Promise.all([
			groups.has('creator') ? countPublishes(id) : Promise.resolve(0),
			needsArcade ? arcadeEra(id) : Promise.resolve({ runsByGame: {}, totalRuns: 0, gamesPlayed: 0, bestScore: 0, points: 0 }),
			groups.has('collection') ? countDistinctApes(options.wallets ?? []) : Promise.resolve(0),
			loadProfileAchievements(),
		]);
		const stats: AchievementStats = { apes, publishes, ...era };
		const { data: unlockedRows } = await supabase.from('user_profile_achievements').select('achievement_id').eq('user_id', id);
		const unlocked = new Set((unlockedRows ?? []).map((row) => String(row.achievement_id)));

		for (const def of catalog) {
			if (!groups.has(groupFor(def))) continue;
			if (def.criteriaType === 'manual') continue;
			const current = progressFor(def, stats);
			if (!shouldInsertUnlock({ current, target: def.criteriaValue, alreadyUnlocked: unlocked.has(def.id), aoaReward: def.aoaReward })) continue;

			const legacyPaid = await alreadyPaidLegacy(id, def.id);
			if (!legacyPaid) {
				const paid = await awardAoa({
					userId: id,
					source: 'achievement',
					action: 'profile',
					referenceId: def.id,
					amount: def.aoaReward,
					dedupeKey: profileAchievementDedupeKey(def.id, id),
				});
				if (!paid.awarded && !paid.duplicate) continue;
			}
			const { error } = await supabase.from('user_profile_achievements').insert({
				user_id: id,
				achievement_id: def.id,
				progress_value: current,
				rewarded_at: new Date().toISOString(),
			});
			if (error && !missingTable(error) && error.code !== '23505') {
				console.error('[profile achievements]', error.message);
			}
			if (!error) {
				await createNotification({
					userId: id,
					type: 'achievement_unlocked',
					category: 'achievement',
					title: def.name,
					message: def.description || 'Achievement unlocked.',
					actionLabel: 'View achievements',
					actionUrl: '/profile/?archive=achievements',
					referenceType: 'profile_achievement',
					referenceId: def.id,
					metadata: aoaMetadata(def.aoaReward),
					dedupeKey: `achievement:${def.id}:${id}`,
				});
			}
		}
		return stats;
	} catch (error) {
		console.error('[profile achievements]', error);
		return EMPTY_STATS;
	}
}

export async function readProfileAchievements(userId: string, stats?: AchievementStats, options?: { unlockedOnly?: boolean }): Promise<{ unlocked: number; total: number; achievements: AchievementCard[] }> {
	const supabase = getSupabaseServiceClient();
	const catalog = await loadProfileAchievements();
	const total = catalog.length;
	if (!supabase || !userId.trim()) {
		return { unlocked: 0, total, achievements: [] };
	}
	const { data, error } = await supabase
		.from('user_profile_achievements')
		.select('achievement_id, unlocked_at')
		.eq('user_id', userId.trim());
	if (error) return { unlocked: 0, total, achievements: [] };
	const unlockedAt = new Map((data ?? []).map((row) => [String(row.achievement_id), String(row.unlocked_at)]));
	const catalogIds = new Set(catalog.map((def) => def.id));
	const cards = catalog.map((def) => {
		const unlocked = unlockedAt.has(def.id);
		const current = stats && def.criteriaType !== 'manual' ? progressFor(def, stats) : null;
		const showProgress = def.criteriaValue > 1 && def.criteriaType !== 'manual' && def.criteriaType !== 'any_score';
		return {
			id: def.id,
			name: unlocked || !def.hidden ? def.name : 'Hidden',
			description: unlocked || !def.hidden ? def.description : '',
			category: def.category,
			aoaReward: def.aoaReward,
			hidden: def.hidden,
			unlocked,
			unlockedAt: unlockedAt.get(def.id) ?? null,
			progress: showProgress ? current : null,
			target: showProgress ? def.criteriaValue : null,
		};
	}).filter((card) => (options?.unlockedOnly ? card.unlocked : true));
	return { unlocked: [...unlockedAt.keys()].filter((id) => catalogIds.has(id)).length, total, achievements: cards };
}
