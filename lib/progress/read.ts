import { getSupabaseServiceClient } from '@/lib/supabase';
import { getLevelProgress } from './levels';
import { loadProfileAchievements } from './profile-achievements';

export type ProgressEventView = {
	source: string;
	action: string;
	amount: number;
	label: string;
	createdAt: string;
	referenceId: string | null;
};

export type SourceBreakdown = {
	studio: number;
	arcade: number;
	achievements: number;
	activity: number;
};

export type ProgressView = {
	totalAoa: number;
	level: number;
	currentLevelAoa: number;
	nextLevelAoa: number;
	progressPercent: number;
	networkRank: number | null;
	sourceBreakdown: SourceBreakdown;
	recentEvents: ProgressEventView[];
	achievements: { unlocked: number; total: number };
};

const EMPTY_BREAKDOWN: SourceBreakdown = {
	studio: 0,
	arcade: 0,
	achievements: 0,
	activity: 0,
};

function emptyProgress(): ProgressView {
	return {
		totalAoa: 0,
		...getLevelProgress(0),
		networkRank: null,
		sourceBreakdown: { ...EMPTY_BREAKDOWN },
		recentEvents: [],
		achievements: { unlocked: 0, total: 0 },
	};
}

function eventLabel(source: string, action: string): string {
	if (source === 'studio' && (action === 'transmission_published' || action === 'publish')) return 'Transmission published';
	if (source === 'studio' && (action === 'transmission_remixed' || action === 'remix')) return 'Transmission remixed';
	if (source === 'arcade' && (action === 'run_completed' || action === 'run')) return 'Arcade run';
	if (source === 'arcade' && (action === 'personal_best' || action === 'personal-best')) return 'New personal best';
	if (source === 'achievement') return 'Achievement unlocked';
	if (source === 'streak') return 'Daily activity';
	if (source === 'activity') return 'Activity';
	return 'Progress';
}

function recentActivity(
	rewards: Array<{ source: string; action: string; reference_id: string | null; aoa_amount: number; created_at: string; dedupe_key: string }>,
	activities: Array<{ source: string; action: string; reference_id: string | null; dedupe_key: string; occurred_at: string }>,
): ProgressEventView[] {
	const rewardByKey = new Map(rewards.map((row) => [String(row.dedupe_key), row]));
	const seen = new Set<string>();
	const feed: ProgressEventView[] = [];
	for (const row of activities) {
		const key = String(row.dedupe_key);
		seen.add(key);
		const reward = rewardByKey.get(key);
		feed.push({
			source: String(row.source),
			action: String(row.action),
			amount: reward ? Number(reward.aoa_amount ?? 0) : 0,
			label: eventLabel(String(row.source), String(row.action)),
			createdAt: String(row.occurred_at),
			referenceId: row.reference_id ? String(row.reference_id) : null,
		});
	}
	for (const row of rewards) {
		const key = String(row.dedupe_key);
		if (seen.has(key)) continue;
		feed.push({
			source: String(row.source),
			action: String(row.action),
			amount: Number(row.aoa_amount ?? 0),
			label: eventLabel(String(row.source), String(row.action)),
			createdAt: String(row.created_at),
			referenceId: row.reference_id ? String(row.reference_id) : null,
		});
	}
	return feed
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 30);
}

function bucketFor(source: string): keyof SourceBreakdown {
	if (source === 'studio') return 'studio';
	if (source === 'arcade') return 'arcade';
	if (source === 'achievement') return 'achievements';
	return 'activity';
}

export async function readProgress(userId: string): Promise<ProgressView | null> {
	const id = userId.trim();
	if (!id) return null;
	const supabase = getSupabaseServiceClient();
	if (!supabase) return emptyProgress();

	const { data: events, error: eventError } = await supabase
		.from('user_progress_events')
		.select('source, action, reference_id, aoa_amount, created_at, dedupe_key')
		.eq('user_id', id)
		.neq('source', 'legacy')
		.order('created_at', { ascending: false })
		.limit(1000);

	const rows = eventError ? [] : (events ?? []);
	const ledger = await supabase.from('user_progress').select('total_aoa').eq('user_id', id).maybeSingle();
	const ledgerTotal = Number(ledger.data?.total_aoa ?? 0);
	const activityResult = await supabase
		.from('user_activity_events')
		.select('source, action, reference_id, dedupe_key, occurred_at')
		.eq('user_id', id)
		.order('occurred_at', { ascending: false })
		.limit(30);
	if (activityResult.error) {
		console.error(JSON.stringify({
			scope: 'user-activity',
			event: 'read_failed',
			userId: id,
			reason: activityResult.error.message,
		}));
	}
	const activities = activityResult.data;
	const breakdown = { ...EMPTY_BREAKDOWN };
	for (const row of rows) {
		breakdown[bucketFor(String(row.source))] += Number(row.aoa_amount ?? 0);
	}
	const eventTotal = rows.reduce((sum, row) => sum + Number(row.aoa_amount ?? 0), 0);
	const totalAoa = Math.max(eventTotal, ledgerTotal);
	const level = getLevelProgress(totalAoa);

	let networkRank: number | null = null;
	if (totalAoa > 0) {
		const { count: higher } = await supabase
			.from('user_progress')
			.select('user_id', { count: 'exact', head: true })
			.gt('total_aoa', totalAoa);
		networkRank = typeof higher === 'number' ? higher + 1 : null;
	}

	const { count: unlocked } = await supabase
		.from('user_profile_achievements')
		.select('achievement_id', { count: 'exact', head: true })
		.eq('user_id', id);
	const catalog = await loadProfileAchievements();

	return {
		totalAoa,
		...level,
		networkRank,
		sourceBreakdown: breakdown,
		recentEvents: recentActivity(rows, activities ?? []),
		achievements: {
			unlocked: unlocked ?? 0,
			total: catalog.length,
		},
	};
}

export async function readProgressByUsername(username: string): Promise<ProgressView | null> {
	const handle = username.trim().replace(/^@/, '');
	if (!handle) return null;
	const supabase = getSupabaseServiceClient();
	if (!supabase) return emptyProgress();
	const { data } = await supabase
		.from('user_profiles')
		.select('glyph_user_id')
		.ilike('x_username', handle)
		.maybeSingle();
	const userId = String(data?.glyph_user_id ?? '').trim();
	if (!userId) return emptyProgress();
	return readProgress(userId);
}
