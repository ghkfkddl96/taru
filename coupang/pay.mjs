// 쿠팡 결제 (실제 크롬 CDP) — 결제 비밀번호 보안키패드까지 자동 입력 후 주문완료 확인.
// PIN은 private/coupang.pin(DPAPI 암호문)을 실행 순간에만 복호화해 메모리에서만 사용.
// 사용법: node coupang/pay.mjs <productId> <vendorItemId> <qty>
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { getBrowser, disconnect, allPages, ROOT } from './chrome.mjs';

const CACHE = join(ROOT, '.cache');
const PIN_FILE = join(ROOT, 'private', 'coupang.pin');
const pid = process.argv[2];
const expectVendorItem = process.argv[3] || '';
const qty = process.argv[4] || '1';
if (!pid || !expectVendorItem) { console.error('USAGE: pay.mjs <productId> <vendorItemId> <qty>'); process.exit(2); }

function getPin() {
  if (process.env.PIN) return process.env.PIN.trim();
  const cmd = `$s = Get-Content '${PIN_FILE}' | ConvertTo-SecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))`;
  return execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = { pid, expectVendorItem, qty, steps: [], summary: {}, ok: false, aborted: false, note: '' };
const { browser, ctx } = await getBrowser({ startUrl: 'https://www.coupang.com' });
const shot = async (p, name) => { try { await p.screenshot({ path: join(CACHE, name) }); } catch {} };

try {
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const purl = `https://www.coupang.com/vp/products/${pid}?vendorItemId=${expectVendorItem}&q=`;
  let title = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto(purl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    title = await page.title();
    if (!/Access Denied|차단/i.test(title)) break;
    result.steps.push('blocked-attempt-' + attempt);
    await page.waitForTimeout(attempt * 6000);
  }
  if (/Access Denied|차단/i.test(title)) { result.note = 'BLOCKED'; throw new Error('BLOCKED'); }
  result.steps.push('product-loaded:' + title);

  const clickBuy = async () => {
    await page.waitForSelector('button.prod-buy-btn', { timeout: 10000 }).catch(() => {});
    await page.click('button.prod-buy-btn', { timeout: 6000 }).catch(async () => {
      await page.evaluate(() => document.querySelector('button.prod-buy-btn')?.click());
    });
  };
  const findCheckout = () => allPages(browser).find((p) => /checkout\.coupang\.com|login\.coupang\.com/.test(p.url()));
  const waitCheckout = async (ms) => {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) { const co = findCheckout(); if (co) return co; await page.waitForTimeout(1000); }
    return null;
  };
  await clickBuy();
  let order = await waitCheckout(15000);
  if (!order) { result.steps.push('retry-buy'); await clickBuy(); order = await waitCheckout(15000); }
  if (!order) { result.note = 'NO_CHECKOUT_NAV'; throw new Error('NO_CHECKOUT_NAV'); }
  await order.waitForLoadState('domcontentloaded').catch(() => {});
  await order.waitForTimeout(3000);
  const ourl = order.url();
  result.steps.push('checkout-url:' + ourl);
  if (/login\.coupang\.com/.test(ourl)) { result.note = 'NOT_LOGGED_IN'; throw new Error('NOT_LOGGED_IN'); }

  // 안전장치: 옵션/수량 검증
  const m = ourl.match(/item(?:%5B%5D|\[\])=(\d+)%3A(\d+)|item(?:%5B%5D|\[\])=(\d+):(\d+)/);
  const urlVendorItem = m ? (m[1] || m[3]) : null;
  const urlQty = m ? (m[2] || m[4]) : null;
  result.summary.checkoutVendorItem = urlVendorItem;
  if (urlVendorItem !== expectVendorItem) { result.aborted = true; result.note = `OPTION_MISMATCH expected ${expectVendorItem} got ${urlVendorItem}`; throw new Error(result.note); }
  if (urlQty && urlQty !== String(qty)) { result.aborted = true; result.note = `QTY_MISMATCH expected ${qty} got ${urlQty}`; throw new Error(result.note); }

  const total = await order.evaluate(() => {
    const t = document.body.innerText.match(/총\s*결제\s*금액[\s\S]{0,20}?([0-9][0-9,]{2,})\s*원/);
    return t ? Number(t[1].replace(/[^0-9]/g, '')) : null;
  }).catch(() => null);
  result.summary.total = total;

  // 결제하기 → 보안 키패드
  await order.evaluate(() => {
    const b = [...document.querySelectorAll('button, a')].find((x) => /^\s*결제하기\s*$/.test((x.textContent || '').trim()));
    b?.click();
  });
  await order.waitForTimeout(3500);
  await shot(order, 'pay-pin-prompt.png');

  const diag = await order.evaluate(() => {
    const isVis = (el) => { const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4; };
    const leafDigit = (d) => [...document.querySelectorAll('button,[role="button"],a,span,div,li,td')]
      .some((el) => el.childElementCount === 0 && isVis(el) && (el.textContent || '').trim() === d);
    const digits = {};
    for (let i = 0; i <= 9; i++) digits[i] = leafDigit(String(i));
    return {
      pinTextShown: /결제 ?비밀번호|비밀번호 입력|비밀번호 6자리/.test(document.body.innerText),
      frames: [...document.querySelectorAll('iframe')].map((f) => f.src || '(no src)'),
      digitsClickable: digits,
    };
  }).catch((e) => ({ err: String(e) }));
  result.summary.keypad = diag;
  writeFileSync(join(CACHE, 'coupang-keypad.json'), JSON.stringify(diag, null, 2));

  const pin = getPin();
  if (!diag.pinTextShown) { result.note = 'NO_PIN_MODAL'; throw new Error('NO_PIN_MODAL'); }
  const allNeeded = [...new Set(pin.split(''))].every((d) => diag.digitsClickable && diag.digitsClickable[d]);
  if (!allNeeded) { result.note = 'KEYPAD_DIGITS_NOT_TEXT (점검필요)'; throw new Error(result.note); }

  for (const ch of pin) {
    const ok = await order.evaluate((digit) => {
      const isVis = (el) => { const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4; };
      const cands = [...document.querySelectorAll('button,[role="button"],a,span,div,li,td')]
        .filter((el) => el.childElementCount === 0 && isVis(el) && (el.textContent || '').trim() === digit);
      const el = cands.find((e) => /button/i.test(e.tagName) || e.getAttribute('role') === 'button') || cands[0];
      if (el) { el.click(); return true; }
      return false;
    }, ch);
    if (!ok) { result.note = 'PIN_CLICK_FAIL'; throw new Error('PIN_CLICK_FAIL'); }
    await order.waitForTimeout(380);
  }
  result.steps.push('pin-entered');
  await order.waitForTimeout(4000);

  const start = Date.now();
  let done = false;
  while (Date.now() - start < 90 * 1000) {
    const txt = await order.evaluate(() => document.body.innerText).catch(() => '');
    const url = order.url();
    if (/주문이?\s*완료|주문번호|정상적으로 (접수|처리)|주문해주셔서/.test(txt) || /complete|thankyou|order\/?(list|detail)/i.test(url)) {
      done = true;
      const on = txt.match(/주문번호[^0-9]{0,10}([0-9]{6,})/);
      if (on) result.summary.orderNo = on[1];
      break;
    }
    if (/비밀번호가 (일치하지|올바르지)|다시 입력/.test(txt)) { result.note = 'WRONG_PIN'; break; }
    await order.waitForTimeout(2500);
  }
  await shot(order, 'pay-result.png');
  result.ok = done;
  if (done) result.note = 'ORDER_COMPLETE';
  else if (!result.note) result.note = 'TIMEOUT_NO_CONFIRM';
} catch (e) {
  if (!result.note) result.note = 'ERROR:' + (e?.message || String(e)).slice(0, 250);
} finally {
  writeFileSync(join(CACHE, 'coupang-pay.json'), JSON.stringify(result, null, 2));
  await disconnect(browser); // 크롬은 계속 열어둠
}
console.log(JSON.stringify(result, null, 2));
process.exit(0);
