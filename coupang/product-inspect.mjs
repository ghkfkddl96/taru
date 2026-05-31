// 상품 페이지를 열어 가격/옵션/구매버튼 구조를 덤프한다.
// 사용법: node coupang/product-inspect.mjs <productId>
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(__dirname, '..', '.cache', 'coupang-profile');
const pid = process.argv[2];
if (!pid) { console.error('NO_PID'); process.exit(2); }

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false, viewport: { width: 1280, height: 1000 }, locale: 'ko-KR',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://www.coupang.com/vp/products/' + pid, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3500);

const info = await page.evaluate(() => {
  const txt = (el) => el?.textContent?.trim().replace(/\s+/g, ' ') || '';
  // candidate buy buttons
  const btns = [...document.querySelectorAll('button, a')].filter((b) => /구매|장바구니|바로/i.test(b.textContent || ''))
    .map((b) => ({ tag: b.tagName, cls: b.className, id: b.id, text: txt(b).slice(0, 30) }));
  // price-ish elements
  const priceEls = [...document.querySelectorAll('[class*="price" i], [class*="Price"]')].slice(0, 25)
    .map((e) => ({ cls: e.className, text: txt(e).slice(0, 40) })).filter((e) => /원|\d/.test(e.text));
  // login state
  const loggedIn = !/로그인/.test(document.querySelector('header, .gnb, #gnb')?.textContent || '') ||
    /마이쿠팡|로그아웃/.test(document.body.textContent.slice(0, 3000));
  return {
    title: document.title,
    h2: txt(document.querySelector('h1, h2.prod-buy-header__title, [class*="title" i]')),
    loggedIn,
    buyButtons: btns.slice(0, 12),
    priceEls,
    bodyHead: document.body.innerText.slice(0, 600),
  };
});
writeFileSync(join(__dirname, '..', '.cache', 'coupang-product.json'), JSON.stringify(info, null, 2));
await page.screenshot({ path: join(__dirname, '..', '.cache', 'coupang-product.png') }).catch(() => {});
console.log(JSON.stringify(info, null, 2).slice(0, 3500));
await ctx.close();
process.exit(0);
