// 브라우저 QA: node qa.js [스크린샷 폴더]
// playwright가 필요하다. index.html을 문서 골격으로 감싼 임시 페이지에서 시나리오 11개를 돌린다.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const E = require('./engine.js');
const SP = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'lab-qa-'));
fs.mkdirSync(path.join(SP, 'ty'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'engine.js'), path.join(SP, 'ty', 'engine.js'));
fs.writeFileSync(path.join(SP, 'ty', 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8') + '</body></html>');
const url = 'file://' + path.join(SP, 'ty', 'index.html');
const res = []; const ok = (n, p, d) => res.push((p ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : ''));
(async () => {
  const b = await chromium.launch(); const errors = [];
  async function page(vp, save, dark) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: dark ? 'dark' : 'light' });
    if (save) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('labtycoon.v1', s); } }, save);
    const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(url); await p.waitForTimeout(800); return p;
  }
  let p = await page({ width: 400, height: 900 });
  ok('첫 화면: 조교수, 학생 2명, 방 9칸', (await p.textContent('#tierName')) === '조교수' && (await p.textContent('#studentsN')) === '2' && (await p.$$('.plot')).length === 9);
  await p.waitForTimeout(4000);
  ok('걸어 다니는 학생이 생긴다', (await p.$$('#walkers g')).length > 0, (await p.$$('#walkers g')).length + '명');
  const m0 = await p.textContent('#money');
  await p.click('#upBtn'); await p.waitForTimeout(250);
  ok('실험실 업그레이드', (await p.textContent('#roomCard h2')).includes('Lv 2'), m0 + ' → ' + (await p.textContent('#money')));
  await p.click('#cheerBtn'); await p.waitForTimeout(250);
  ok('독려하면 ×2 표시와 쿨다운', (await p.textContent('#roomCard')).includes('다시 독려까지') && (await p.$$('.tag.boost')).length === 1);
  await p.click('.plot[data-id="meeting"]'); await p.waitForTimeout(200);
  ok('방을 누르면 패널이 그 방으로 바뀐다', (await p.textContent('#roomCard h2')).startsWith('회의실'));
  await p.click('.plot[data-id="server"]'); await p.waitForTimeout(200);
  ok('잠긴 방은 승진 조건을 보여 준다', (await p.textContent('#roomCard')).includes('부교수로 승진하면'));
  ok('흐름 막대에 병목 표시', (await p.$$('.flow .bott')).length === 1);
  await p.screenshot({ path: SP + '/ty-mobile.png', fullPage: true });
  ok('폰 너비 가로 스크롤 없음', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 400);
  // 후반 상태
  const s = E.newGame(); s.tier = 4; s.money = 5e9; s.fame = 1e8;
  Object.assign(s.rooms, { office: 60, meeting: 58, lounge: 8, wetlab: 50, server: 30, library: 40, clean: 25, bigequip: 3, global: 0 });
  for (let i = 0; i < 16; i++) s.students.push({ name: '학생' + i, grade: i % 4 });
  p = await page({ width: 1280, height: 900 }, JSON.stringify({ st: s, at: Date.now() }), true);
  await p.waitForTimeout(3500);
  await p.screenshot({ path: SP + '/ty-desktop-dark.png' });
  await p.click('.plot[data-id="global"]'); await p.click('#upBtn'); await p.waitForTimeout(300);
  ok('국제 공동연구센터 공사', (await p.textContent('#roomCard h2')).includes('Lv 1'));
  const s2 = E.newGame(); s2.fame = 2000;
  p = await page({ width: 400, height: 900 }, JSON.stringify({ st: s2, at: Date.now() }));
  await p.click('#promoteBtn', { force: true }); await p.waitForTimeout(300);
  ok('승진 모달 (부교수)', (await p.textContent('#dialog')).includes('부교수'));
  ok('콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  console.log(res.join('\n')); console.log('스크린샷: ' + SP); process.exitCode = res.some((r) => r.startsWith('FAIL')) ? 1 : 0; await b.close();
})();
