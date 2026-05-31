// 실제 크롬을 띄워 쿠팡 로그인을 받는다. (CDP 방식)
// 사용자가 직접 로그인 + "로그인 상태 유지" 체크 → 전용 크롬 프로필에 세션 저장.
// .cache/coupang-login-done 센티넬이 생기면 연결만 끊고 크롬은 열어둔다.
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getBrowser, disconnect, ROOT } from './chrome.mjs';

const SENTINEL = join(ROOT, '.cache', 'coupang-login-done');
if (existsSync(SENTINEL)) unlinkSync(SENTINEL);

const { browser, ctx } = await getBrowser({ startUrl: 'https://www.coupang.com' });
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://www.coupang.com', { waitUntil: 'domcontentloaded' }).catch(() => {});

console.log('LOGIN_BROWSER_READY');

const start = Date.now();
while (Date.now() - start < 20 * 60 * 1000) {
  if (existsSync(SENTINEL)) break;
  await new Promise((r) => setTimeout(r, 1500));
}
try { unlinkSync(SENTINEL); } catch {}

await disconnect(browser); // 크롬은 계속 열어둠
console.log('LOGIN_SAVED');
process.exit(0);
