import { getSupabaseServiceClient } from '@/lib/supabase';
import { arcadeEraFromActivity, evaluateProfileAchievements } from './evaluate-achievements';

/**
 * Counts this validated run in the new era only.
 * Historical high scores are not copied in, so old records do not unlock achievements.
 * A gate opens only when this run, or the count of runs since launch, meets it.
 */
export async function recordEraRun(userId: string, gameId: string, score: number) {
	const supabase = getSupabaseServiceClient();
	if (!supabase) return;

	const withPoints = await supabase
		.from('aoa_arcade_era')
		.select('runs, best_score, points_total')
		.eq('user_id', userId)
		.eq('game_id', gameId)
		.maybeSingle();
	const tableMissing = Boolean(withPoints.error && (withPoints.error.code === '42P01' || withPoints.error.code === 'PGRST205' || withPoints.error.message.includes('Could not find the table')));
	const existing = tableMissing
		? null
		: withPoints.error
			? (await supabase.from('aoa_arcade_era').select('runs, best_score').eq('user_id', userId).eq('game_id', gameId).maybeSingle()).data
			: withPoints.data;
	const activity = existing ? null : await arcadeEraFromActivity(userId);
	const gameRuns = existing ? Number(existing.runs ?? 0) + 1 : Math.max(1, activity?.runsByGame[gameId] ?? 1);
	const eraBest = Math.max(Number(existing?.best_score ?? activity?.bestByGame[gameId] ?? 0), score);
	const row: { user_id: string; game_id: string; runs: number; best_score: number; points_total?: number } = {
		user_id: userId,
		game_id: gameId,
		runs: gameRuns,
		best_score: eraBest,
	};
	if (!withPoints.error) {
		const seededPoints = existing ? 0 : (activity?.pointsByGame[gameId] ?? 0);
		row.points_total = Math.max(Number(withPoints.data?.points_total ?? 0), seededPoints) + (existing ? Math.max(0, Math.floor(score)) : 0);
	}
	const { error } = tableMissing ? { error: withPoints.error } : await supabase.from('aoa_arcade_era').upsert(row, { onConflict: 'user_id,game_id' });
	if (error) {
		console.error('[aoa era]', error.message);
	}
	await evaluateProfileAchievements(userId, { groups: ['activity', 'explorer'] });
}

export async function awardStudioMilestones(userId: string) {
	await evaluateProfileAchievements(userId, { groups: ['creator'] });
}
