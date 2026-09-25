import { expect, test } from '@playwright/test';

test('scan finds an ape by token id', async ({ page }) => {
	await page.goto('/collection/');
	await page.locator('#archive-scan').fill('7650');
	await page.getByRole('button', { name: 'Scan' }).click();
	await expect(page.getByRole('link', { name: 'Signal located // Ape 7650' })).toBeVisible({ timeout: 20000 });
	await expect(page.getByRole('link', { name: /Ape 7650/ }).first()).toBeVisible();
});

test('story pairs the dagger ape with token 7649', async ({ page }) => {
	await page.goto('/story/');
	await expect(page.getByText('Current collection thumbnail · Ape 7649')).toBeVisible();
	await expect(page.locator('img[alt="Current collection thumbnail for Ape 7649"]')).toHaveAttribute('src', /7649\.webp/);
	await expect(page.getByRole('link', { name: 'Open Ape 7649' })).toHaveAttribute('href', '/collection/7649/');
});

test('studio metadata uses the site file instead of the IPFS proxy', async ({ page }) => {
	const ipfs: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/api/studio/ipfs')) ipfs.push(request.url());
	});
	const response = await page.goto('/studio/53dea9d3-9e39-4076-8529-91eb26a56df4/');
	expect(response?.status()).toBeLessThan(500);
	await page.waitForTimeout(1500);
	expect(ipfs).toEqual([]);
});
