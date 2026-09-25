import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { meetsAchievementThreshold, profileAchievementDedupeKey, shouldInsertUnlock } from './achievement-rules.ts';

describe('profile achievement thresholds', () => {
	it('stays locked below the threshold', () => {
		assert.equal(meetsAchievementThreshold(9, 10), false);
		assert.equal(shouldInsertUnlock({ current: 9, target: 10, alreadyUnlocked: false, aoaReward: 100 }), false);
	});

	it('unlocks when the count exactly meets the threshold', () => {
		assert.equal(meetsAchievementThreshold(10, 10), true);
		assert.equal(shouldInsertUnlock({ current: 10, target: 10, alreadyUnlocked: false, aoaReward: 100 }), true);
	});

	it('unlocks when the count exceeds the threshold', () => {
		assert.equal(shouldInsertUnlock({ current: 11, target: 10, alreadyUnlocked: false, aoaReward: 100 }), true);
	});

	it('does not insert again after the achievement is unlocked', () => {
		assert.equal(shouldInsertUnlock({ current: 25, target: 10, alreadyUnlocked: true, aoaReward: 100 }), false);
	});

	it('does not insert a zero reward', () => {
		assert.equal(shouldInsertUnlock({ current: 10, target: 10, alreadyUnlocked: false, aoaReward: 0 }), false);
	});

	it('keeps one stable AOA dedupe key per ape and achievement', () => {
		const key = profileAchievementDedupeKey('first_transmission', 'did:privy:ape');
		assert.equal(key, 'profile-achievement:first_transmission:did:privy:ape');
		assert.equal(profileAchievementDedupeKey('first_transmission', 'did:privy:ape'), key);
	});
});
