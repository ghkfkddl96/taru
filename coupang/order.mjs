// 쿠팡 상품 주문 플로우 (안전장치 포함).
// 사용법: MODE=preview node coupang/order.mjs <productId> <vendorItemId> <qty>
//   MODE=preview : 주문서까지 가서 총액만 확인하고 결제 안 함 (기본)
//   MODE=pay     : 결제하기까지 누름 (실제 결제)
// vendorItemId : 살 정확한 옵션 SKU. 체크아웃 URL이 이 id가 아니면 결제 중단(안전장치).
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE = join(__dirname, '..', '.cache', 'coupang-profile');
const CACHE = join(__dirname, '..', '.cache');
const pid = process.argv[2];
const expectVendorItem = process.argv[3] || '';
const qty = process.argv[4] || '1';
const MODE = process.env.MODE || 'preview';
if (!pid || !expectVendorItem) { console.error('USAGE: order.mjs <productId> <vendorItemId> <qty>'); process.exit(2); }

const shot = async (p, name) => { try { await p.screenshot({ path: join(CACHE, name) }); } catch {} };

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false, viewport: { width: 1280, height: 1000 }, locale: 'ko-KR',
  args: ['--disable-blink-features=AutomationControlled'],
});
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
const result = { mode: MODE, pid, expectVendorItem, qty, steps: [], summary: {}, ok: false, aborted: false, note: '' };

try {
  // 옵션을 URL로 직접 지정 → 해당 SKU가 미리 선택됨
  const purl = `https://www.coupang.com/vp/products/${pid}?vendorItemId=${expectVendorItem}&q=`;
  let title = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(purl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    title = await page.title();
    if (!/Access Denied|차단/i.test(title)) break;
    result.steps.push('blocked-attempt-' + attempt);
    await page.waitForTimeout(attempt * 8000);
  }
  if (/Access Denied|차단/i.test(title)) { result.note = 'BLOCKED'; throw new Error('BLOCKED'); }
  result.steps.push('product-loaded:' + title);
  await shot(page, 'order-1-product.png');

  // 바로구매 (새 탭 가능성 대비)
  const popupP = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
  await page.click('button.prod-buy-btn', { timeout: 8000 }).catch(async () => {
    await page.evaluate(() => document.querySelector('button.prod-buy-btn')?.click());
  });
  const popup = await popupP;
  const order = popup || page;
  await order.waitForLoadState('domcontentloaded').catch(() => {});
  await order.waitForTimeout(4000);
  const ourl = order.url();
  result.steps.push('after-buy-url:' + ourl);

  // 로그인 튕김 체크
  if (/login\.coupang\.com/.test(ourl)) { result.note = 'NOT_LOGGED_IN'; throw new Error('NOT_LOGGED_IN'); }

  // ===== 안전장치: 체크아웃 URL의 vendorItemId 검증 =====
  const m = ourl.match(/item(?:%5B%5D|\[\])=(\d+)%3A(\d+)|item(?:%5B%5D|\[\])=(\d+):(\d+)/);
  const urlVendorItem = m ? (m[1] || m[3]) : null;
  const urlQty = m ? (m[2] || m[4]) : null;
  result.summary.checkoutVendorItem = urlVendorItem;
  result.summary.checkoutQty = urlQty;
  if (urlVendorItem !== expectVendorItem) {
    result.aborted = true;
    result.note = `OPTION_MISMATCH expected ${expectVendorItem} got ${urlVendorItem} — 결제 중단`;
    throw new Error(result.note);
  }
  if (urlQty && urlQty !== String(qty)) {
    result.aborted = true;
    result.note = `QTY_MISMATCH expected ${qty} got ${urlQty} — 결제 중단`;
    throw new Error(result.note);
  }

  await order.waitForTimeout(2000);
  await shot(order, 'order-2-checkout.png');

  // 체크아웃 본문 텍스트 저장 (파싱용)
  const bodyText = await order.evaluate(() => document.body.innerText).catch(() => '');
  writeFileSync(join(CACHE, 'coupang-checkout.txt'), bodyText);

  // 총액 파싱 (여러 후보 라벨)
  const summary = await order.evaluate(() => {
    const txt = document.body.innerText;
    const grab = (labels) => {
      for (const label of labels) {
        const re = new RegExp(label.replace(/\s+/g, '\\s*') + '[\\s\\S]{0,20}?([0-9][0-9,]{2,})\\s*원');
        const mm = txt.match(re);
        if (mm) return Number(mm[1].replace(/[^0-9]/g, ''));
      }
      return null;
    };
    return {
      productAmount: grab(['총 상품 가격', '상품금액', '주문금액']),
      shipping: grab(['배송비']),
      discount: grab(['와우 전용 즉시할인', '즉시할인', '상품할인', '할인금액']),
      total: grab(['총 결제 금액', '최종 결제 금액', '결제예정금액']),
      hasPayButton: /결제하기|결제 진행/.test(txt),
      url: location.href,
    };
  }).catch(() => ({}));
  result.summary = { ...result.summary, ...summary };

  if (MODE === 'pay') {
    if (!summary.hasPayButton) { result.note = 'NO_PAY_BUTTON'; }
    else {
      await order.evaluate(() => {
        const b = [...document.querySelectorAll('button, a')].find((x) => /^\s*결제하기\s*$/.test((x.textContent || '').trim()));
        b?.click();
      });
      await order.waitForTimeout(6000);
      await shot(order, 'order-3-paid.png');
      const after = await order.evaluate(() => document.body.innerText).catch(() => '');
      result.steps.push('pay-clicked-url:' + order.url());
      result.ok = /주문이?\s*완료|order.*complete|결제完|감사합니다/.test(after) || /complete|success/i.test(order.url());
      result.note = result.ok ? 'PAID' : 'PAY_CLICKED_UNCONFIRMED (스샷 확인 필요)';
    }
  } else {
    result.ok = true;
    result.note = 'PREVIEW_ONLY (결제 안 함)';
  }
} catch (e) {
  if (!result.note) result.note = 'ERROR:' + (e?.message || String(e)).slice(0, 250);
} finally {
  writeFileSync(join(CACHE, 'coupang-order.json'), JSON.stringify(result, null, 2));
  await ctx.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(0);
