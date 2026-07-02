import { chromium, devices } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13 Pro'] });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const base='file:///C:/Users/KoHwarang/Agent/taru/.cache/singapore-escape/index.html';
await p.goto(base); await p.evaluate(()=>localStorage.removeItem('sg_escape')); await p.reload();
await p.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
await p.getByText('시작하기').click({force:true}); await p.waitForTimeout(900);
await p.screenshot({path:'_v6_airport.png'});
const code=async(s)=>{for(const c of s){await p.locator('.key',{hasText:new RegExp('^\s*'+c+'\s*$')}).first().click({force:true});await p.waitForTimeout(60);}await p.waitForTimeout(200);};
const suc=async()=>{const bb=p.locator('#modalBg button:has-text("좋아"),#modalBg button:has-text("성공")');if(await bb.count())await bb.first().click({force:true});await p.waitForTimeout(100);};
// 안내데스크 → 지도
await p.locator('.spot-dot[title="안내데스크"]').click({force:true}); await p.waitForTimeout(250);
await p.locator('.btn.compact:has-text("가져가기")').click({force:true}); await p.waitForTimeout(150); await suc();
// 캐리어 930 → 열쇠
await p.locator('.spot-dot[title="캐리어"]').click({force:true}); await p.waitForTimeout(200);
await p.locator('.btn.compact:has-text("번호")').click({force:true}); await p.waitForTimeout(150); await code('930'); await suc();
// 사물함 → 교통카드
await p.locator('.spot-dot[title="사물함"]').click({force:true}); await p.waitForTimeout(200);
await p.locator('.btn.compact:has-text("열쇠")').click({force:true}); await p.waitForTimeout(150); await suc();
const inv=await p.locator('.invItem .nm').allTextContents();
await p.screenshot({path:'_v6_bag.png'});
// 중심지 → 경찰서 → 바쿠테
await p.locator('.navBtn:has-text("싱가포르 중심지")').click({force:true}); await p.waitForTimeout(300);
await p.locator('.navBtn:has-text("무지개 경찰서")').click({force:true}); await p.waitForTimeout(400);
await p.screenshot({path:'_v6_police.png'});
const polExits=await p.locator('.navBtn').allTextContents();
await p.locator('.navBtn:has-text("송파 바쿠테")').click({force:true}); await p.waitForTimeout(400);
await p.screenshot({path:'_v6_bakkutteh.png'});
const bkName=await p.locator('#roomName').textContent();
console.log('bag items :', inv.join(','));
console.log('police exits:', polExits.map(s=>s.trim()).join(' | '));
console.log('bakkutteh  :', bkName);
console.log('errors     :', errs.join(' ; ')||'none');
await b.close();
