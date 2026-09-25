import { awardStudioPublish } from './hooks';
import { awardStudioMilestones } from './era';
import { recordUserActivity } from './activity';
import { resolveCanonicalUserId } from './identity';
import { aoaMetadata, createNotification } from '@/lib/notifications/create';
import { AOA_REWARDS } from './rewards';

/**
 * Logs the persisted Studio creation, then evaluates achievements, then awards AOA if eligible.
 * A reward cap or a failed award does not remove the activity event.
 * Does not throw: the artwork is already stored.
 */
export async function recordPersistedStudioCreation(input: {
	creationId: string;
	createdAt: string;
	creatorAddress: string;
	claimedIds: string[];
	type: string;
	title: string;
}) {
	const userId = await resolveCanonicalUserId({
		claimedIds: input.claimedIds,
		creatorAddress: input.creatorAddress,
	});
	if (!userId) {
		console.error(JSON.stringify({
			scope: 'studio-activity',
			event: 'unresolved_user',
			creationId: input.creationId,
			creatorAddress: input.creatorAddress,
		}));
		return null;
	}

	const dedupeKey = `studio:publish:${input.creationId}`;
	const activity = await recordUserActivity({
		userId,
		source: 'studio',
		action: 'transmission_published',
		referenceId: input.creationId,
		dedupeKey,
		occurredAt: input.createdAt,
		metadata: {
			type: input.type,
			title: input.title.slice(0, 80),
		},
	});
	if (!activity.recorded) {
		console.error(JSON.stringify({
			scope: 'studio-activity',
			event: 'activity_not_recorded',
			creationId: input.creationId,
			userId,
			reason: activity.reason ?? 'unknown',
		}));
	}

	try {
		await awardStudioMilestones(userId);
	} catch (error) {
		console.error(JSON.stringify({
			scope: 'studio-activity',
			event: 'achievement_eval_failed',
			creationId: input.creationId,
			userId,
			reason: error instanceof Error ? error.message : 'unknown',
		}));
	}

	const reward = await awardStudioPublish(userId, input.creationId);
	if (!reward.awarded && !reward.duplicate && !reward.capped) {
		console.error(JSON.stringify({
			scope: 'studio-activity',
			event: 'reward_not_awarded',
			creationId: input.creationId,
			userId,
			dedupeKey,
			reason: reward.reason ?? 'unknown',
		}));
	}
	const titleText = input.title.trim() || 'your transmission';
	await createNotification({
		userId,
		type: 'transmission_published',
		category: 'studio',
		title: 'Transmission published',
		message: `Your Studio creation "${titleText}" is live.`,
		actionLabel: 'View transmission',
		actionUrl: `/studio/${input.creationId}/`,
		referenceType: 'studio_creation',
		referenceId: input.creationId,
		metadata: aoaMetadata(reward.awarded ? AOA_REWARDS.studioPublish : 0),
		dedupeKey: `studio:published:${input.creationId}`,
	});
	return userId;
}
