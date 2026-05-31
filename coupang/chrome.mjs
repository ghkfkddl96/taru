// 실제 설치된 크롬을 디버그 포트로 띄우고 Playwright를 CDP로 연결한다.
// 자동화 전용 브라우저가 아니라 "진짜 크롬"이라 봇 탐지에 강함.
// 크롬은 계속 떠 있고, 각 스크립트는 붙었다(connect) 떨어진다(disconnect)만 함 — 크롬은 안 닫힘.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..');
export const PROFILE = join(ROOT, '.cache', 'coupang-chrome');
export const PORT = 9222;

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
];
const chromePath = CHROME_CANDIDATES.find((p) => p && existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryConnect() {
  try { return await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`, { timeout: 3000 }); }
  catch { return null; }
}

// 크롬 실행(없으면) + 연결. startUrl을 첫 탭으로 연다.
export async function getBrowser({ startUrl } = {}) {
  let browser = await tryConnect();
  let launched = false;
  if (!browser) {
    if (!chromePath) throw new Error('CHROME_NOT_FOUND');
    mkdirSync(PROFILE, { recursive: true });
    const args = [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
      '--restore-last-session=false',
      '--disable-features=Translate',
    ];
    if (startUrl) args.push(startUrl);
    spawn(chromePath, args, { detached: true, stdio: 'ignore' }).unref();
    launched = true;
    for (let i = 0; i < 30 && !browser; i++) { await sleep(1000); browser = await tryConnect(); }
  }
  if (!browser) throw new Error('CHROME_CONNECT_FAILED');
  const ctx = browser.contexts()[0] || (await browser.newContext());
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
  });
  return { browser, ctx, launched };
}

// 모든 컨텍스트의 모든 페이지 (바로구매가 새 탭을 열 수 있어서)
export function allPages(browser) {
  return browser.contexts().flatMap((c) => c.pages());
}

// CDP 연결만 끊고 크롬은 살려둠
export async function disconnect(browser) {
  try { await browser.close(); } catch {}
}
