import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { profileHref } from './identity.ts';
import { getOpenSeaProfileUrl } from '../opensea.ts';

describe('public profile links', () => {
	it('builds a profile path from a handle', () => {
		assert.equal(profileHref('@SmokeThatDank'), '/profile/SmokeThatDank/');
	});

	it('does not use a wallet as a profile url', () => {
		assert.equal(profileHref('0x70b10bf7da6c470cbbfdcd9eed0f850cac8b45a9'), null);
	});

	it('builds one OpenSea profile url', () => {
		assert.equal(getOpenSeaProfileUrl('0xabc'), 'https://opensea.io/0xabc');
	});
});
