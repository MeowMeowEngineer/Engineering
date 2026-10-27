// 출시 빌드 QA와 스토어 스크린샷: node build.js 후 NODE_PATH=$(npm root -g) node qa-release.js
// www/index.html을 file://로 열고 인터넷 요청을 모두 막은 채로 돌린다. 스크린샷은 store/screenshots/(1080×1920)에 저장한다.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const E = require('../../prototype/engine.js');
const ROOT = __dirname, URL = 'file://' + path.join(ROOT, 'www', 'index.html'), SHOTS = path.join(ROOT, 'store', 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const res = [], ok = (n, p, d) => res.push((p ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : ''));
const today = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

(async () => {
  const b = await chromium.launch();
  const errors = [], external = [];
  async function open(save, vp) {
    const ctx = await b.newContext({ viewport: vp || { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    // 인터넷 요청은 모두 막고 기록한다
    await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith('file:') || u.startsWith('data:')) return r.continue(); external.push(u); return r.abort(); });
    if (save) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('gradclicker.v1', s); localStorage.setItem('gradclicker.v1.seen', '{"gen":9,"write":9,"tab":9,"auto":9,"skill":9,"drink":9,"tapUp":9}'); } }, save);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(URL); await p.waitForTimeout(900);
    return { p, ctx };
  }
  const modal = (p) => p.evaluate(() => document.getElementById('modal').hidden ? '' : document.getElementById('dialog').innerText);
  const click = (p, label) => p.evaluate((l) => { if (document.getElementById('modal').hidden) return false; const x = [...document.querySelectorAll('#dialog button')].find((y) => y.innerText.includes(l)); if (x) x.click(); return !!x; }, label);
  const tap = (p, n) => p.evaluate((k) => { const t = document.getElementById('tapper'); for (let i = 0; i < k; i++) t.dispatchEvent(new PointerEvent('pointerdown', { clientX: 180, clientY: 300, bubbles: true })); }, n);

  // 1. 새 게임
  let { p, ctx } = await open();
  ok('출시 모드 켜짐, 버전 표시값', await p.evaluate(() => window.__GRAD_RELEASE__ === true && typeof window.__GRAD_VERSION__ === 'string'));
  ok('첫 실행: 성별 선택', (await modal(p)).includes('어떤 대학원생'));
  await click(p, '여성으로 시작'); await p.waitForTimeout(200); await click(p, '받기'); await p.waitForTimeout(300);
  ok('앱 안 글꼴로 그린다 (IBM Plex Sans KR · Black Han Sans · Nanum Pen Script)', await p.evaluate(async () => { await document.fonts.ready; return ['16px "IBM Plex Sans KR"', '16px "Black Han Sans"', '16px "Nanum Pen Script"'].every((f) => document.fonts.check(f, '대학원생')); }));
  ok('랭킹 탭 없음', (await p.$('#tab-rank')) === null);
  await p.click('#tab-shop'); await p.waitForTimeout(200);
  const shop = await p.textContent('#panel-shop');
  ok('상점: 출석·쿠폰만 있고 광고·가상 결제는 없다', shop.includes('출석') && shop.includes('커피 쿠폰') && !shop.includes('광고') && !shop.includes('가상 결제') && !shop.includes('BM'), shop.slice(0, 300));
  await p.click('#tab-gens'); await tap(p, 12); await p.waitForTimeout(400);
  ok('탭하면 데이터가 쌓인다', (await p.textContent('#data')) !== '0');
  ok('폰 너비(360px) 가로 스크롤 없음', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 360);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(SHOTS, '1-start.png') });
  await ctx.close();

  // 2. 중반: 박사과정, 동료·장비가 늘어난 연구실
  const mid = E.newGame(); mid.look.gender = 'm'; mid.tier = 3; mid.papers = 9; mid.data = 4.2e5; mid.lv = 14; mid.taps = 900; mid.daily.day = today; mid.daily.claimed = today;
  Object.assign(mid.gens, { coffee: 26, intern: 18, junior: 11, vna: 6, chamber: 2 }); mid.auto.paper = true; mid.auto.hire = true; mid.autoEver = { paper: true, hire: true };
  ({ p, ctx } = await open(JSON.stringify({ st: mid, at: Date.now() })));
  await tap(p, 15); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SHOTS, '2-lab.png') });
  // 3. 심사 중
  const rv = E.newGame(); rv.look.gender = 'f'; rv.tier = 4; rv.papers = 16; rv.data = 8e7; rv.lv = 22; rv.taps = 3000; rv.daily.day = today; rv.daily.claimed = today;
  Object.assign(rv.gens, { coffee: 40, intern: 30, junior: 22, vna: 14, chamber: 8, agent: 5, lecture: 3 }); rv.review = { to: 5, endAt: 15000, total: 21600 }; rv.auto = { paper: true, hire: true }; rv.autoEver = { paper: true, hire: true };
  ({ p, ctx } = await open(JSON.stringify({ st: rv, at: Date.now() })));
  ok('심사 진행 표시 (교수 임용 심사)', (await p.textContent('#nextLabel')).includes('교수 임용 심사 중'));
  await tap(p, 10); await p.waitForTimeout(300);
  // 연구실 장면 아래쪽과 심사 진행 막대가 함께 보이게 맞춘다
  await p.evaluate(() => { const r = document.querySelector('.paper').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.bottom - window.innerHeight + 8); }); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(SHOTS, '3-review.png') });
  // 4. 도감
  const col = JSON.parse(JSON.stringify(rv)); col.review = null;
  [0, 1, 2, 3, 5, 8, 9, 13, 15].forEach((i) => { col.col.quotes[i] = 1; }); [0, 1, 2, 4].forEach((i) => { col.col.goods[i] = 1; }); [1, 2, 3, 4].forEach((t) => { col.col.photos[t] = true; });
  ({ p, ctx } = await open(JSON.stringify({ st: col, at: Date.now() })));
  await p.click('#tab-col'); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('panel-col').scrollIntoView());
  await p.screenshot({ path: path.join(SHOTS, '4-collection.png') });
  // 5. 전직 화면
  const pr = E.newGame(); pr.look.gender = 'f'; pr.tier = 4; pr.papers = 16; pr.data = 8e7; pr.daily.day = today; pr.daily.claimed = today; pr.review = { to: 5, endAt: 0.5, total: 21600 };
  ({ p, ctx } = await open(JSON.stringify({ st: pr, at: Date.now() })));
  await p.waitForTimeout(600);
  ok('심사가 끝나면 전직 화면 (조교수)', (await modal(p)).includes('조교수'));
  await p.screenshot({ path: path.join(SHOTS, '5-promotion.png') });
  // 6. 방치 보상: 광고 2배 버튼이 없다
  ({ p, ctx } = await open(JSON.stringify({ st: mid, at: Date.now() - 3 * 3600 * 1000 })));
  const off = await modal(p);
  ok('방치 보상 창에 광고 버튼이 없다', off.includes('다녀오셨어요') && !off.includes('광고'));

  ok('인터넷 요청 없음', external.length === 0, external.slice(0, 3).join(' '));
  ok('콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  await b.close();
  console.log(res.join('\n'));
  console.log('스크린샷: ' + SHOTS);
  process.exitCode = res.some((r) => r.startsWith('FAIL')) ? 1 : 0;
})();
