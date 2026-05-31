import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(__dirname, '..', '.cache', 'coupang-profile');
const pid = process.argv[2];
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false, viewport: { width: 1280, height: 1100 }, locale: 'ko-KR',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://www.coupang.com/vp/products/' + pid, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3500);
const info = await page.evaluate(() => {
  // find price-text "4,000원" element, walk up to clickable option tile
  const priceTexts = [...document.querySelectorAll('.price-text')];
  const target = priceTexts.find((p) => /4,000원/.test(p.textContent));
  let tileChain = [];
  if (target) {
    let el = target;
    for (let i = 0; i < 6 && el; i++) {
      tileChain.push({ tag: el.tagName, cls: el.className, role: el.getAttribute('role') || '', dataAttrs: [...el.attributes].filter(a=>a.name.startsWith('data')).map(a=>a.name+'='+a.value).join(',') });
      el = el.parentElement;
    }
  }
  // the option list container: parent of all price-text tiles
  const firstTile = target ? target.closest('li, [role="option"], [class*="option" i], [class*="item" i]') : null;
  return {
    priceTextCount: priceTexts.length,
    found4000: !!target,
    tileChain,
    firstTileOuter: (firstTile?.outerHTML || '').slice(0, 800),
    listContainerCls: firstTile?.parentElement?.className || '',
    listContainerTag: firstTile?.parentElement?.tagName || '',
  };
});
writeFileSync(join(__dirname, '..', '.cache', 'coupang-opt.json'), JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2).slice(0, 3500));
await ctx.close();
process.exit(0);
