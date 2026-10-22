// 브라우저 QA: node qa.js [스크린샷 폴더]
// playwright가 필요하다. 엔진 단위 검사 뒤, index.html을 문서 골격으로 감싼 임시 페이지에서 브라우저 시나리오를 돌린다.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const E = require('./engine.js');
const SP = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'grad-qa-'));
fs.mkdirSync(path.join(SP, 'web'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'engine.js'), path.join(SP, 'web', 'engine.js'));
fs.writeFileSync(path.join(SP, 'web', 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8') + '</body></html>');
const url = 'file://' + path.join(SP, 'web', 'index.html');
const results = [];
const ok = (name, pass, detail) => { results.push((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };
// 엔진 단위 검사 (브라우저 없이)
{
  const s = E.newGame(); s.rng = 7;
  E.COLLECTION.quotes.items.forEach((_, i) => { if (i !== 15) s.col.quotes[i] = 1; });
  s.col.pity = { quotes: E.PITY };
  let got = null;
  for (let i = 0; i < 20 && !got; i++) { const d = E.profReward(s).drop; if (d) got = d; }
  ok('중복 보정: ' + E.PITY + '번 중복 뒤에는 없는 항목(전설 1개)이 확정', got && got.idx === 15);
  const next = E.newGame(s);
  ok('재입학해도 도감 유지', E.colCount(next, 'quotes') === 16 && next.col === s.col);
  const p = E.newGame(); for (let t = 1; t <= E.LAST; t++) p.col.photos[t] = true;
  const p2 = E.newGame(p);
  ok('기념사진 세트 완성 시 커피 머신 10대·학부연구생 5대로 시작', p2.gens.coffee === 10 && p2.gens.intern === 5);
  const sum = Object.keys(E.COLLECTION).filter((k) => E.COLLECTION[k].items).every((k) => Math.abs(E.COLLECTION[k].items.reduce((a, _, i) => a + E.dropRate(k, i), 0) - E.COLLECTION[k].chance * 100) < 1e-9);
  ok('공개 확률 합계 = 드롭 확률', sum);
  const old = E.migrate({ v: 1, data: 1, total: 1, taps: 0, tapLv: 0, gens: {}, papers: 3, paperTitles: [], tier: 4, time: 10, skills: { night: 0, deadline: 0 }, buffs: [], medals: 0, century: false, promotedAt: [{ tier: 1, time: 0 }, { tier: 2, time: 5 }, { tier: 4, time: 9 }], rng: 1, ended: false });
  ok('v1 세이브 변환 시 지나온 직급 기념사진 복원', old.col.photos[2] && old.col.photos[5] && !old.col.photos[4]);
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  async function page(opts, save) {
    const ctx = await browser.newContext(opts || { viewport: { width: 400, height: 860 } });
    if (save !== undefined) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('inj')) { sessionStorage.setItem('inj', '1'); localStorage.setItem('gradclicker.v1', s); } }, save);
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto(url); await p.waitForTimeout(700);
    return p;
  }
  const modalText = (p) => p.evaluate(() => document.getElementById('modal').hidden ? '' : document.getElementById('dialog').innerText);
  const clickModal = (p, label) => p.evaluate((l) => { const b = [...document.querySelectorAll('#dialog button')].find((x) => x.innerText.includes(l)); if (b) b.click(); return !!b; }, label);

  // 1. 첫 실행: 출석 모달
  let p = await page();
  const m1 = await modalText(p);
  ok('첫 실행 출석 모달', m1.includes('출석 1일째'), m1.split('\n')[0]);
  await clickModal(p, '받기');
  ok('출석 쿠폰 지급', (await p.textContent('#coupons')) === '5');
  // 2. 오토클리커 제한
  await p.evaluate(() => { const t = document.getElementById('tapper'); for (let i = 0; i < 40; i++) t.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 300, bubbles: true })); });
  await p.waitForTimeout(300);
  const counted = await p.evaluate(() => document.querySelectorAll('.float').length);
  ok('한 번에 40번 탭하면 15번만 인정', counted === 15, '인정된 탭 ' + counted);
  // 3. 상점: 신입생 패키지 가상 결제
  await p.click('#tab-shop');
  await p.click('[data-sku="starter"]');
  ok('가상 결제 확인창', (await modalText(p)).includes('실제 결제는 일어나지 않습니다'));
  await clickModal(p, '가상 결제 완료'); await p.waitForTimeout(300);
  ok('신입생 패키지 지급 (쿠폰 105, 야옹)', (await p.textContent('#coupons')) === '105' && (await p.$('.cat')) !== null);
  ok('한 번만 사는 상품 재구매 막힘', await p.isDisabled('[data-sku="starter"]'));
  // 4. 광고 시뮬레이션
  await p.click('#adBuff');
  ok('광고 카운트다운 표시', (await modalText(p)).includes('광고 (시뮬레이션)'));
  await p.waitForTimeout(5600);
  ok('광고 끝나면 생산 2배 버프', (await p.textContent('#buffs')).includes('연구 지원금'));
  await p.screenshot({ path: SP + '/qa-shop.png', fullPage: true });

  // 5. v1 세이브 변환: v1 조교수(4) → v2 조교수(5)
  const v1 = { v: 1, data: 5e7, total: 5e7, taps: 10, tapLv: 3, gens: { coffee: 10, intern: 10, junior: 5, vna: 5, chamber: 2, agent: 1, cluster: 0, postdoc: 0, consortium: 0, telescope: 0, institute: 0 }, papers: 14, paperTitles: [], tier: 4, time: 900, skills: { night: 0, deadline: 0 }, buffs: [], medals: 0, century: false, promotedAt: [{ tier: 1, time: 0 }, { tier: 4, time: 800 }], rng: 1, ended: false };
  p = await page(undefined, JSON.stringify({ st: v1, at: Date.now() }));
  await clickModal(p, '받기');
  ok('v1 세이브 → 조교수 유지', (await p.textContent('#tierName')) === '조교수');
  // 6. 방치 보상: 3시간 전 저장, 박사과정, 자동 투고 ON
  const s6 = E.newGame(); s6.tier = 2; s6.gens.coffee = 20; s6.gens.intern = 15; s6.gens.junior = 10; s6.papers = 3; s6.auto.paper = true; s6.daily = { day: '', streak: 0, claimed: '', ads: 0, adBuff: 0, adSkill: 0 };
  p = await page(undefined, JSON.stringify({ st: s6, at: Date.now() - 3 * 3600 * 1000 }));
  const m6 = await modalText(p);
  ok('3시간 방치 보상 모달', m6.includes('3시간 0분') && m6.includes('레벨'), m6.replace(/\n/g, ' / ').slice(0, 120));
  await p.screenshot({ path: SP + '/qa-offline.png' });
  // 7. 깨진 세이브
  p = await page(undefined, '{not json');
  ok('깨진 세이브는 새 게임으로 시작', (await p.textContent('#tierName')) === '석사과정');
  // 8. 시계를 되돌린 경우(저장 시각이 미래)
  p = await page(undefined, JSON.stringify({ st: s6, at: Date.now() + 5 * 3600 * 1000 }));
  ok('미래 저장 시각은 방치 보상 없음', !(await modalText(p)).includes('다녀오셨어요'));
  // 9. 시간강사 전직
  const s9 = E.newGame(); s9.tier = 3; s9.papers = 11; s9.data = 1e8; s9.daily.claimed = 'x';
  p = await page(undefined, JSON.stringify({ st: s9, at: Date.now() }));
  await clickModal(p, '받기');
  await p.click('#promoteBtn', { force: true }); await p.waitForTimeout(500);
  const m9 = await modalText(p);
  ok('포닥 → 시간강사 전직', m9.includes('시간강사') && m9.includes('보따리'), m9.split('\n').slice(0, 3).join(' / '));
  await p.screenshot({ path: SP + '/qa-lecturer.png' });
  // 10. 엔딩과 재입학 (쿠폰·야옹 유지)
  const s10 = E.newGame(); s10.tier = 8; s10.papers = 45; s10.data = 2e10; s10.coupons = 77; s10.pet = true; s10.medals = 0;
  p = await page({ viewport: { width: 1200, height: 900 }, colorScheme: 'dark' }, JSON.stringify({ st: s10, at: Date.now() }));
  await clickModal(p, '받기');
  await p.click('#centuryBtn'); await p.click('#promoteBtn', { force: true }); await p.waitForTimeout(500);
  ok('살아있는 교과서 엔딩', (await modalText(p)).includes('살아있는 교과서') && (await modalText(p)).includes('인류의 지성'));
  ok('마지막 캐릭터는 월계관 (흰 머리 뭉치 없음)', await p.evaluate(() => { const svg = document.querySelector('#dialog svg'); return svg.querySelectorAll('ellipse[fill="#d4a72c"]').length >= 13 && svg.querySelectorAll('circle[r="16"]').length === 0; }));
  await p.screenshot({ path: SP + '/qa-ending.png' });
  await clickModal(p, '재입학'); await p.waitForTimeout(300);
  ok('재입학 후 석사과정·쿠폰(77+출석5+첫 도달10)·야옹 유지', (await p.textContent('#tierName')) === '석사과정' && (await p.textContent('#coupons')) === '92' && (await p.$('.cat')) !== null, '쿠폰 ' + (await p.textContent('#coupons')));
  // 12. 도감 탭: 주입한 수집 상태가 그대로 보인다
  const s12 = E.newGame(); s12.daily.claimed = 'x';
  s12.col = { quotes: { 0: 1, 13: 2 }, goods: { 10: 1 }, topics: { 0: 4, 3: 10 }, photos: { 1: true, 2: true }, cats: {}, pity: { quotes: 2 } };
  p = await page(undefined, JSON.stringify({ st: s12, at: Date.now() }));
  await clickModal(p, '받기');
  await p.click('#tab-col'); await p.waitForTimeout(200);
  const colText = await p.textContent('#panel-col');
  ok('도감: 어록 2/16, 전설 어록 표시, 중복 2/4', colText.includes('2/16') && colText.includes('이번 결과 좋다') && colText.includes('중복 2/4'));
  ok('도감: 연구 주제 별 5개(★★ + ★★★)', colText.includes('5/30') && colText.includes('★★★'));
  ok('도감: 확률 공개 (일반 어록 5.5%)', colText.includes('일반 · 5.5%'));
  await p.screenshot({ path: SP + '/qa-collection.png', fullPage: true });
  // 11. 폰 너비
  const p11 = await page();
  ok('폰 너비 가로 스크롤 없음', (await p11.evaluate(() => document.documentElement.scrollWidth)) <= 400);
  ok('콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  console.log(results.join('\n'));
  console.log('스크린샷: ' + SP);
  process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
  await browser.close();
})();
