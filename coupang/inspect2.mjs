import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(__dirname, '..', '.cache', 'coupang-profile');
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false, viewport: { width: 1280, height: 1000 }, locale: 'ko-KR',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://www.coupang.com/np/search?q=' + encodeURIComponent('롤휴지') + '&channel=user', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('li[class*="ProductUnit_productUnit"]', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2500);
const out = await page.evaluate(() => {
  const title = document.title;
  const lis = document.querySelectorAll('li[class*="ProductUnit_productUnit"]');
  let pick = [];
  for (const li of lis) { pick.push(li.outerHTML); if (pick.length >= 2) break; }
  return { title, count: lis.length, html: pick.join('\n\n========\n\n') };
});
writeFileSync(join(__dirname, '..', '.cache', 'coupang-li.html'), out.html);
console.log('title=', out.title, 'count=', out.count, 'wrote=', out.html.length);
await ctx.close();
process.exit(0);
