import { expect, test } from '@playwright/test';

const publicPages = ['/', '/music/', '/story/', '/join/', '/collection/', '/studio/', '/arcade/', '/wardrobe/', '/leaderboard/'];

test.describe('signed-out public pages', () => {
	for (const path of publicPages) {
		test(`${path} loads`, async ({ page }) => {
			const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
			expect(response?.status()).toBeLessThan(400);
			await expect(page.locator('body')).toBeVisible();
		});
	}
});

test('unknown route is the 404 page', async ({ page }) => {
	const response = await page.goto('/this-route-does-not-exist/');
	expect(response?.status()).toBe(404);
	await expect(page.getByText('Signal lost')).toBeVisible();
});

test('retired arcade achievements redirect toward profile', async ({ page }) => {
	await page.goto('/arcade/achievements/');
	await expect(page).toHaveURL(/\/profile\/?/);
});

test('retired live and wtf routes redirect', async ({ request }) => {
	const live = await request.get('/live/', { maxRedirects: 0 });
	expect(live.status()).toBe(308);
	expect(live.headers().location || '').toContain('/music');
	const wtf = await request.get('/wtf/', { maxRedirects: 0 });
	expect(wtf.status()).toBe(308);
	expect(wtf.headers().location || '').toContain('/story');
});

test('owner APIs reject a missing session', async ({ request }) => {
	expect((await request.get('/api/profile/identity/')).status()).toBe(401);
	expect((await request.get('/api/notifications/inbox/')).status()).toBe(401);
	expect((await request.get('/api/notifications/unread-count/')).status()).toBe(401);
	expect((await request.get('/api/profile/public-links/')).status()).toBe(401);
	expect((await request.put('/api/profile/wallet-alias/', { data: { alias: 'x' } })).status()).toBe(401);
});

test('debug achievement route stays closed', async ({ request }) => {
	expect((await request.get('/api/debug/check-achievements/?userId=audit')).status()).toBe(404);
	expect((await request.post('/api/debug/check-achievements/', { data: { userId: 'audit', achievementCode: 'x' } })).status()).toBe(404);
});

test('signed-out mutations are rejected', async ({ request }) => {
	expect((await request.post('/api/profile/forever-ape/', { data: { tokenId: 1, userId: 'did:privy:someone-else', address: '0x0000000000000000000000000000000000000001' } })).status()).toBe(401);
	expect((await request.post('/api/auth/init-user/', { data: { userId: 'did:privy:someone-else', xUsername: 'stolen' } })).status()).toBe(401);
	expect((await request.post('/api/studio/creations/', { multipart: { title: 'x', prompt: 'y', creatorAddress: '0x0000000000000000000000000000000000000001' } })).status()).toBe(401);
	expect((await request.delete('/api/studio/creations/does-not-exist/', { data: { creatorAddress: '0x0000000000000000000000000000000000000001', handle: 'apeprofessore' } })).status()).toBe(401);
	expect((await request.post('/api/achievements/save_game_stats/', { data: { wallet_address: '0x0000000000000000000000000000000000000001', game_id: 'block_dodger', score: 10, glyph_user_id: 'did:privy:someone-else' } })).status()).toBe(401);
	expect((await request.post('/api/gamify/award/', { data: { userId: 'did:privy:someone-else', achievementCode: 'first_sign_in' } })).status()).toBe(410);
	expect((await request.post('/api/achievements/unlock/', { data: { achievement_id: 'welcome', glyph_user_id: 'did:privy:someone-else' } })).status()).toBe(410);
	expect((await request.post('/api/achievements/add_experience/', { data: { experience: 1000, glyph_user_id: 'did:privy:someone-else' } })).status()).toBe(410);
	expect((await request.get('/api/notifications/?userId=did:privy:someone-else')).status()).toBe(401);
	expect((await request.patch('/api/notifications/', { data: { notificationIds: ['00000000-0000-0000-0000-000000000000'] } })).status()).toBe(401);
	expect((await request.post('/api/achievements/update_clubroom_visits/', { data: { wallet_address: '0x0000000000000000000000000000000000000001', glyph_user_id: 'did:privy:someone-else', clubroom_visits: 99 } })).status()).toBe(410);
	expect((await request.post('/api/achievements/save_chat_message/', { data: { wallet_address: '0x0000000000000000000000000000000000000001', glyph_user_id: 'did:privy:someone-else', messages_sent: 99 } })).status()).toBe(410);
	expect((await request.post('/api/arcade/shop/state/', { data: { action: 'set_points', wallet_address: '0x0000000000000000000000000000000000000001', game_id: 'block_dodger', points: 1000, glyph_user_id: 'did:privy:someone-else' } })).status()).toBe(401);
});

test('ipfs proxy rejects private and unknown hosts', async ({ request }) => {
	expect((await request.get('/api/studio/ipfs/?url=http://127.0.0.1/')).status()).toBe(400);
	expect((await request.get('/api/studio/ipfs/?url=http://169.254.169.254/latest/meta-data')).status()).toBe(400);
	expect((await request.get('/api/studio/ipfs/?url=http://192.168.1.1/')).status()).toBe(400);
	expect((await request.get('/api/studio/ipfs/?url=https://example.com/secret')).status()).toBe(400);
	expect((await request.get('/api/studio/ipfs/?cid=not-a-cid')).status()).toBe(400);
});
