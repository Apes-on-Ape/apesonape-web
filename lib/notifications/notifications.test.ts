import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aoaMetadata, tokenIdsToAnnounce } from './rules.ts';

describe('notification rules', () => {
	it('omits a zero AOA amount so a capped reward is not shown as +0', () => {
		assert.deepEqual(aoaMetadata(0), {});
		assert.deepEqual(aoaMetadata(100), { aoa: 100 });
	});

	it('does not announce holdings on the first ownership baseline', () => {
		assert.deepEqual(tokenIdsToAnnounce(false, [], [1, 2, 6909]), []);
	});

	it('announces only a token the Ape did not already own', () => {
		assert.deepEqual(tokenIdsToAnnounce(true, [1, 2], [1, 2, 6909]), [6909]);
	});

	it('does not announce a token moving between the same Ape wallets', () => {
		assert.deepEqual(tokenIdsToAnnounce(true, [6909], [6909]), []);
	});
});
