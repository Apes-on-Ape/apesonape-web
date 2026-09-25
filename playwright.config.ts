import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 90_000,
	retries: 0,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
		trace: 'off',
	},
	projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
