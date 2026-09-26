import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.getByRole('button', { name: 'Open menu' }).click();
const menu = page.locator('#mobile-menu');
await menu.waitFor({ state: 'visible', timeout: 5000 });
const info = await menu.evaluate((el) => {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return {
    parent: el.parentElement?.tagName ?? '',
    top: rect.top,
    height: rect.height,
    opacity: style.opacity,
    text: el.innerText.slice(0, 120),
  };
});
console.log(JSON.stringify(info));
await browser.close();
