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
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  // find the list container with most repeated children
  const lists = [...document.querySelectorAll('ul, ol')].map(ul => ({ ul, n: ul.children.length }));
  lists.sort((a, b) => b.n - a.n);
  const top = lists.slice(0, 3).map(({ ul, n }) => ({
    listTag: ul.tagName, listId: ul.id, listClass: ul.className, childCount: n,
    firstChildClass: ul.children[0]?.className || '',
    sampleHTML: (ul.children[0]?.outerHTML || '').slice(0, 1500),
  }));
  return top;
});
writeFileSync(join(__dirname, '..', '.cache', 'coupang-dom.json'), JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2).slice(0, 4000));
await ctx.close();
process.exit(0);
