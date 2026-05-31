// 쿠팡에서 검색 → 상위 결과를 JSON으로 출력.
// 사용법: HEADFUL=1 node coupang/search.mjs "롤휴지" [개수]
// 저장된 로그인 세션(프로필)을 그대로 사용한다. 쿠팡 봇차단 때문에 HEADFUL=1 권장.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(__dirname, '..', '.cache', 'coupang-profile');
const SHOT = join(__dirname, '..', '.cache', 'coupang-search.png');

const query = process.argv[2];
const limit = parseInt(process.argv[3] || '8', 10);
if (!query) { console.error('NO_QUERY'); process.exit(2); }

mkdirSync(PROFILE, { recursive: true });

const headless = process.env.HEADFUL ? false : true;
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless,
  viewport: { width: 1280, height: 1000 },
  locale: 'ko-KR',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  args: ['--disable-blink-features=AutomationControlled'],
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
const sorter = process.env.SORT || 'scoreDesc'; // scoreDesc(랭킹순), salePriceAsc(낮은가격순)
const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}&channel=user&sorter=${sorter}`;

let result = { ok: false, query, items: [], note: '' };
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const title = await page.title().catch(() => '');
  if (/Access Denied|차단|로봇|captcha|보안문자/i.test(title)) { result.note = 'BLOCKED:' + title; }

  await page.waitForSelector('li[class*="ProductUnit_productUnit"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const items = await page.evaluate((max) => {
    const num = (s) => Number(String(s || '').replace(/[^0-9]/g, '')) || null;
    const out = [];
    const lis = document.querySelectorAll('li[class*="ProductUnit_productUnit"]');
    for (const li of lis) {
      if (out.length >= max) break;
      const a = li.querySelector('a');
      const href = a?.getAttribute('href') || '';
      const name =
        li.querySelector('[class*="productNameV2"], [class*="productName"]')?.textContent?.trim() ||
        li.querySelector('img[alt]')?.getAttribute('alt')?.trim() || '';
      if (!name) continue;

      const priceArea = li.querySelector('[class*="PriceArea_priceArea"]');
      let salePrice = null, origPrice = null, unitPrice = '';
      if (priceArea) {
        const del = priceArea.querySelector('del');
        if (del) origPrice = num(del.textContent);
        const big = [...priceArea.querySelectorAll('div')].find(
          (d) => /fw-text-\[20px\]/.test(d.className) && /원/.test(d.textContent)
        );
        if (big) salePrice = num((big.textContent.match(/[\d,]+원/) || [''])[0]);
        const um = priceArea.textContent.match(/\(([^)]*당[^)]*)\)/);
        if (um) unitPrice = um[1].trim();
        if (!salePrice) {
          const clone = priceArea.cloneNode(true);
          clone.querySelectorAll('del').forEach((d) => d.remove());
          const m = clone.textContent.replace(/\([^)]*\)/g, '').match(/[\d,]+원/);
          if (m) salePrice = num(m[0]);
        }
      }
      if (!salePrice) continue; // 품절/가격없음 제외

      const ratingEl = li.querySelector('[class*="ProductRating"] [aria-label]');
      const rating = ratingEl ? parseFloat(ratingEl.getAttribute('aria-label')) : null;
      const rcMatch = li.querySelector('[class*="ProductRating"]')?.textContent?.match(/\(([\d,]+)\)/);
      const reviewCount = rcMatch ? num(rcMatch[1]) : null;

      const badges = [...li.querySelectorAll('img[data-badge-id]')].map((i) => i.getAttribute('data-badge-id'));
      const rocket = badges.some((b) => /ROCKET/.test(b));
      const isAd = /product_ads|sourceType=srp/.test(href) || /광고/.test(li.textContent.slice(-30));

      out.push({
        name,
        salePrice,
        origPrice,
        unitPrice,
        rating,
        reviewCount,
        rocket,
        isAd,
        productId: (href.match(/products\/(\d+)/) || [])[1] || '',
        vendorItemId: li.getAttribute('data-id') || '',
        url: href ? (href.startsWith('http') ? href.split('?')[0] : 'https://www.coupang.com' + href.split('?')[0]) : '',
      });
    }
    return out;
  }, limit);

  result.items = items;
  result.ok = items.length > 0;
  if (!items.length && !result.note) result.note = 'NO_ITEMS_PARSED';
  await page.screenshot({ path: SHOT }).catch(() => {});
} catch (e) {
  result.note = 'ERROR:' + (e?.message || String(e)).slice(0, 200);
} finally {
  await ctx.close();
}

console.log(JSON.stringify(result, null, 2));
process.exit(0);
