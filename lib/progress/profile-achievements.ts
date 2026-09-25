import { ARCADE_LEADERBOARD_GAMES } from '@/app/arcade/arcade-games';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { arcadeAchievementAoa, PROFILE_ACHIEVEMENT_AOA } from './rewards';

export type ProfileAchievementCategory = 'collection' | 'creator' | 'activity' | 'community' | 'explorer';

export type ProfileCriteriaType =
	| 'apes_owned'
	| 'studio_publishes'
	| 'total_runs'
	| 'game_runs'
	| 'game_variety'
	| 'single_score'
	| 'any_score'
	| 'total_points'
	| 'manual';

export type ProfileAchievementDef = {
	id: string;
	name: string;
	description: string;
	category: ProfileAchievementCategory;
	criteriaType: ProfileCriteriaType;
	criteriaValue: number;
	gameId?: string;
	aoaReward: number;
	hidden: boolean;
	displayOrder: number;
};

/** Studio milestones are not in the arcade `achievements` table. */
const CREATOR_ACHIEVEMENTS: ProfileAchievementDef[] = [
	{ id: 'first_transmission', name: 'First Transmission', description: 'Publish a Studio transmission', category: 'creator', criteriaType: 'studio_publishes', criteriaValue: 1, aoaReward: PROFILE_ACHIEVEMENT_AOA.firstTransmission, hidden: false, displayOrder: 110 },
	{ id: 'signal_builder', name: 'Signal Builder', description: 'Publish 5 Studio transmissions', category: 'creator', criteriaType: 'studio_publishes', criteriaValue: 5, aoaReward: PROFILE_ACHIEVEMENT_AOA.signalBuilder, hidden: false, displayOrder: 120 },
	{ id: 'transmitter', name: 'Transmitter', description: 'Publish 10 Studio transmissions', category: 'creator', criteriaType: 'studio_publishes', criteriaValue: 10, aoaReward: PROFILE_ACHIEVEMENT_AOA.transmitter, hidden: false, displayOrder: 130 },
	{ id: 'prolific_ape', name: 'Prolific Ape', description: 'Publish 25 Studio transmissions', category: 'creator', criteriaType: 'studio_publishes', criteriaValue: 25, aoaReward: PROFILE_ACHIEVEMENT_AOA.prolificApe, hidden: false, displayOrder: 140 },
];

const CATEGORY_ORDER: Record<ProfileAchievementCategory, number> = {
	collection: 0,
	creator: 100,
	activity: 200,
	community: 300,
	explorer: 400,
};

type AchievementRow = {
	id: string;
	name: string;
	description: string | null;
	category: string | null;
	requirements: Record<string, unknown> | null;
	reward_xp: number | null;
	is_hidden: boolean | null;
};

function mapCategory(raw: string | null): ProfileAchievementCategory {
	const value = (raw || '').toLowerCase();
	if (value === 'collection') return 'collection';
	if (value === 'community') return 'community';
	if (value === 'secrets' || value === 'general') return 'explorer';
	return 'activity';
}

function asNumber(value: unknown) {
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function parseCriteria(requirements: Record<string, unknown> | null): Pick<ProfileAchievementDef, 'criteriaType' | 'criteriaValue' | 'gameId'> {
	const req = requirements ?? {};
	const apeCount = asNumber(req.ape_count);
	if (apeCount != null) return { criteriaType: 'apes_owned', criteriaValue: apeCount };
	const totalGames = asNumber(req.total_games_played);
	if (totalGames != null) return { criteriaType: 'total_runs', criteriaValue: totalGames };
	const variety = asNumber(req.game_variety);
	if (variety != null) return { criteriaType: 'game_variety', criteriaValue: variety };
	const single = asNumber(req.single_game_score);
	if (single != null) return { criteriaType: 'single_score', criteriaValue: single };
	const anyScore = asNumber(req.any_score);
	if (anyScore != null) return { criteriaType: 'any_score', criteriaValue: anyScore };
	const points = asNumber(req.total_points);
	if (points != null) return { criteriaType: 'total_points', criteriaValue: points };
	if (req.action === 'join_arcade') return { criteriaType: 'total_runs', criteriaValue: 1 };
	const gameKey = Object.keys(req).find((key) => key.endsWith('_games') && asNumber(req[key]) != null);
	if (gameKey) {
		return { criteriaType: 'game_runs', criteriaValue: asNumber(req[gameKey]) ?? 1, gameId: gameKey.slice(0, -'_games'.length) };
	}
	return { criteriaType: 'manual', criteriaValue: 1 };
}

function fromTable(row: AchievementRow): ProfileAchievementDef {
	const category = mapCategory(row.category);
	const criteria = parseCriteria(row.requirements);
	return {
		id: row.id,
		name: row.name,
		description: row.description ?? '',
		category,
		...criteria,
		aoaReward: arcadeAchievementAoa(Number(row.reward_xp ?? 0)),
		hidden: Boolean(row.is_hidden),
		displayOrder: CATEGORY_ORDER[category],
	};
}

let cached: ProfileAchievementDef[] | null = null;

/** Definitions from `achievements`, plus Studio milestones that are not in that table. */
export async function loadProfileAchievements(): Promise<ProfileAchievementDef[]> {
	if (cached) return cached;
	const supabase = getSupabaseServiceClient();
	let tableDefs: ProfileAchievementDef[] = [];
	if (supabase) {
		const { data, error } = await supabase
			.from('achievements')
			.select('id, name, description, category, requirements, reward_xp, is_hidden')
			.order('id');
		if (error || !data) return [...CREATOR_ACHIEVEMENTS];
		const activeGames = new Set(ARCADE_LEADERBOARD_GAMES.map((game) => game.gameId));
		tableDefs = (data as AchievementRow[])
			.map((row) => fromTable(row))
			.filter((def) => def.criteriaType !== 'manual')
			.filter((def) => !def.gameId || activeGames.has(def.gameId));
	}
	cached = [...tableDefs, ...CREATOR_ACHIEVEMENTS].sort((a, b) => a.displayOrder - b.displayOrder || a.criteriaValue - b.criteriaValue || a.name.localeCompare(b.name));
	return cached;
}
