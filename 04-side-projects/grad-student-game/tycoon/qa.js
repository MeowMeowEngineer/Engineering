// 브라우저 QA: node qa.js [스크린샷 폴더]
// playwright가 필요하다. index.html을 문서 골격으로 감싼 임시 페이지에서 시나리오를 돌린다.
// 컨소시엄은 claude.ai의 db·user를 흉내 낸 메모리 저장소로 검사한다.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const E = require('./engine.js');
const SP = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'lab-qa-'));
fs.mkdirSync(path.join(SP, 'ty'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'engine.js'), path.join(SP, 'ty', 'engine.js'));
fs.writeFileSync(path.join(SP, 'ty', 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8') + '</body></html>');
const url = 'file://' + path.join(SP, 'ty', 'index.html');
const res = []; const ok = (n, p, d) => res.push((p ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : ''));
// claude.use('db') / use('user') 대역
function mockClaude() {
  const store = {}, subs = {};
  const emit = (c) => (subs[c] || []).forEach((cb) => cb({ docs: Object.keys(store).filter((k) => k.split('/')[0] === c).map((k) => ({ id: k.split('/')[1], exists: true, data: () => JSON.parse(JSON.stringify(store[k])) })) }));
  const db = {
    collection: (c) => ({ onSnapshot: (cb) => { (subs[c] = subs[c] || []).push(cb); setTimeout(() => emit(c), 0); return () => {}; } }),
    doc: (p) => ({ set: async (d) => { store[p] = JSON.parse(JSON.stringify(d)); emit(p.split('/')[0]); } }),
  };
  const user = { id: async () => 'me', can: async () => true, profiles: async () => ({}) };
  window.__store = store; window.__put = (p, d) => { store[p] = d; emit(p.split('/')[0]); };
  window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? user : null) };
}
(async () => {
  const b = await chromium.launch(); const errors = [];
  async function page(vp, save, opt) {
    const o = opt || {};
    const ctx = await b.newContext({ viewport: vp, colorScheme: o.dark ? 'dark' : 'light' });
    if (save) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('labtycoon.v1', s); } }, save);
    if (o.cloud) await ctx.addInitScript(mockClaude);
    const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(url); await p.waitForTimeout(800); return p;
  }
  const saveOf = (s) => JSON.stringify({ st: s, at: Date.now() });

  let p = await page({ width: 400, height: 900 });
  ok('첫 화면: 지방 사립대 조교수, 학생 2명, 본관+방 9칸', (await p.textContent('#univName')) === '지방 사립대' && (await p.textContent('#tierName')) === '조교수' && (await p.textContent('#studentsN')) === '2' && (await p.$$('.plot')).length === 10);
  ok('최종 목표 막대', (await p.textContent('#goal')).includes('세계적 명문대의 대가 랩실'));
  await p.waitForTimeout(4000);
  ok('걸어 다니는 학생이 생긴다', (await p.$$('#walkers g')).length > 0, (await p.$$('#walkers g')).length + '명');
  const m0 = await p.textContent('#money');
  await p.click('#upBtn'); await p.waitForTimeout(250);
  ok('실험실 업그레이드', (await p.textContent('#roomCard h2')).includes('Lv 2'), m0 + ' → ' + (await p.textContent('#money')));
  ok('실험실 가구·장비 5종', (await p.$$('#roomCard [data-eq]')).length === 5);
  await p.click('#roomCard [data-eq="0"]'); await p.waitForTimeout(250);
  ok('실험대를 들이면 모습 이름이 붙는다', (await p.textContent('#roomCard')).includes('낡은 실험대'));
  ok('장비 단계 표시 (1단계)와 방 인테리어 단계', (await p.textContent('#roomCard')).includes('1단계 낡은 실험대') && (await p.textContent('#roomCard')).includes('인테리어 1단계 낡은 방'));
  await p.click('#tab-col'); await p.waitForTimeout(200);
  ok('도감: 지방 사립대 기념사진 1/39와 확률 공개', (await p.textContent('#panel-col')).includes('1/39') && (await p.textContent('#panel-col')).includes('지방 사립대 정문') && (await p.textContent('#panel-col')).includes('%'));
  await p.click('#tab-shop'); await p.waitForTimeout(200);
  await p.click('#attendBtn'); await p.waitForTimeout(250);
  ok('상점: 출석 보상으로 발전기금 10', (await p.textContent('#gems')) === '10');
  await p.click('#adBoost'); await p.waitForTimeout(3400);
  ok('상점: 가상 광고 3초 뒤 연구비 2배', (await p.textContent('#ticker')).includes('연구 지원금') && (await p.$eval('#modal', (e) => e.hidden)));
  await p.click('[data-sku="starter"]'); await p.waitForTimeout(200); await p.click('#dialog .btn.primary'); await p.waitForTimeout(300);
  ok('상점: 신임 교수 패키지 가상 구매 → 기금 110, 분수대', (await p.textContent('#gems')) === '110' && (await p.textContent('#panel-shop')).includes('설치됨') && (await p.textContent('#panel-shop')).includes('1,200원'));
  await p.click('[data-deco="cherry"]'); await p.waitForTimeout(300);
  ok('상점: 벚꽃길 장식이 지도에 나타난다', (await p.innerHTML('#map')).includes('#f4b6c8') && (await p.textContent('#gems')) === '50');
  await p.click('#tab-room');
  await p.click('#cheerBtn'); await p.waitForTimeout(250);
  ok('독려하면 ×2 표시와 쿨다운', (await p.textContent('#roomCard')).includes('다시 독려까지') && (await p.$$('.tag.boost')).length === 1);
  await p.click('.plot[data-id="meeting"]'); await p.waitForTimeout(200);
  ok('방을 누르면 패널이 그 방으로 바뀐다', (await p.textContent('#roomCard h2')).startsWith('회의실'));
  await p.click('.plot[data-id="server"]'); await p.waitForTimeout(200);
  ok('잠긴 방은 대학 승격 조건을 보여 준다', (await p.textContent('#roomCard')).includes('지방 거점 국립대(으)로 승격하면'));
  await p.click('.plot[data-id="univ"]', { force: true }); await p.waitForTimeout(200);
  ok('본관을 누르면 대학 단계 5개와 승격 조건', (await p.textContent('#roomCard h2')).startsWith('대학 본관') && (await p.$$('#roomCard .ulist li')).length === 5 && (await p.textContent('#univBtn')).includes('부교수 승진 필요'));
  ok('흐름 막대에 병목 표시', (await p.$$('.flow .bott')).length === 1);
  await p.click('#tab-ally'); await p.waitForTimeout(200);
  ok('claude.ai 밖에서는 컨소시엄 안내', (await p.textContent('#panel-ally')).includes('claude.ai에서 공유된'));
  await p.click('#tab-room');
  await p.screenshot({ path: SP + '/ty-mobile.png', fullPage: true });
  ok('폰 너비 가로 스크롤 없음', (await p.evaluate(() => document.documentElement.scrollWidth)) <= 400);

  // 후반 상태: 서울 명문 사립대 석학, 장비를 들여 놓은 연구실
  const s = E.newGame(); s.tier = 4; s.univ = 4; s.money = 5e11; s.fame = 1e8;
  Object.assign(s.rooms, { office: 60, meeting: 58, lounge: 8, wetlab: 50, server: 30, library: 40, clean: 25, bigequip: 3, global: 0 });
  Object.keys(s.equip).forEach((k, i) => { s.equip[k] = [10, 7, 4, 2 + (i % 3), i % 2 ? 10 : 0]; });
  for (let i = 0; i < 16; i++) s.students.push({ name: '학생' + i, grade: i % 4 });
  p = await page({ width: 1280, height: 900 }, saveOf(s), { dark: true });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: SP + '/ty-desktop-dark.png' });
  await p.click('.plot[data-id="global"]'); await p.click('#upBtn'); await p.waitForTimeout(300);
  ok('국제 공동연구센터 공사는 시간이 걸린다', (await p.textContent('#roomCard')).includes('공사 중') && (await p.textContent('#map')).includes('공사 중'));
  await p.click('.plot[data-id="univ"]', { force: true }); await p.waitForTimeout(200);
  await p.click('#univBtn'); await p.waitForTimeout(300);
  ok('대학 승격 공사 (세계적 명문대)', (await p.textContent('#map')).includes('승격 공사') && (await p.textContent('#roomCard')).includes('승격 공사 중'));
  await p.click('.plot[data-id="office"]'); await p.waitForTimeout(200);
  ok('교수실 장비 모습: 마호가니 책상', (await p.textContent('#roomCard')).includes('마호가니 대가의 책상'));
  ok('장비 5단계와 인테리어 4단계 (교수실 Lv 60)', (await p.textContent('#roomCard')).includes('5단계 마호가니 대가의 책상') && (await p.textContent('#roomCard')).includes('인테리어 4단계 세련된 방') && (await p.textContent('#roomCard')).includes('단계 보너스 ×1.4'));
  await p.screenshot({ path: SP + '/ty-desktop-late.png' });
  await p.click('#tab-lab'); await p.waitForTimeout(200);
  await p.click('[data-rs="exp"]'); await p.waitForTimeout(250);
  ok('학과 연구 시작', (await p.textContent('#panel-lab')).includes('연구 중'));
  await p.click('#tab-mission'); await p.waitForTimeout(200);
  ok('일일 미션 진행 표시', (await p.textContent('#panel-mission')).includes('1/1'));
  await p.click('#tab-cards'); await p.waitForTimeout(200);
  await p.click('#drawBtn'); await p.waitForTimeout(250);
  ok('스타 연구원 뽑기', (await p.textContent('#dialog')).includes('연구원 모집'));
  await p.click('#dialog button'); await p.click('#tab-room');

  // 승진
  const s2 = E.newGame(); s2.fame = 2000;
  p = await page({ width: 400, height: 900 }, saveOf(s2));
  await p.click('#promoteBtn', { force: true }); await p.waitForTimeout(300);
  ok('승진 모달 (부교수) 뒤 본관 승격 안내', (await p.textContent('#dialog')).includes('부교수') && (await p.textContent('#dialog')).includes('지방 거점 국립대'));

  // 엔딩과 정년 퇴임
  const s3 = E.newGame(); s3.tier = 5; s3.univ = 5; s3.fame = 2e10; s3.ended = true;
  p = await page({ width: 400, height: 900 }, saveOf(s3));
  ok('엔딩 저장은 퇴임 버튼을 보여 준다', (await p.textContent('#promoteBtn')).includes('정년 퇴임'));
  await p.click('#promoteBtn', { force: true }); await p.waitForTimeout(200);
  ok('엔딩 모달', (await p.textContent('#dialog')).includes('세계적 명문대의 대가 랩실'));
  await p.click('#dialog .btn.primary'); await p.waitForTimeout(300);
  ok('퇴임하면 지방 사립대 조교수로 돌아가고 월계관', (await p.textContent('#univName')) === '지방 사립대' && (await p.textContent('#tierName')) === '조교수' && (await p.textContent('#laurelNote')).includes('월계관'));

  // 컨소시엄 (db·user 대역)
  const s4 = E.newGame(); s4.tier = 2; s4.univ = 2; s4.money = 1e5; s4.time = 1000;
  s4.rooms.server = 0; s4.builds = [{ room: 'server', toLv: 1, endAt: 1600, total: 600, reqId: 'b1' }]; s4.nextReq = 2;
  p = await page({ width: 1280, height: 900 }, saveOf(s4), { cloud: true });
  await p.click('#tab-ally'); await p.waitForTimeout(300);
  await p.fill('#allyNick', 'QA교수'); await p.fill('#allyName', 'QA 컨소시엄');
  await p.click('#allyCreate'); await p.waitForTimeout(400);
  const st0 = await p.evaluate(() => window.__store);
  ok('컨소시엄 만들기: 내 문서와 컨소시엄 문서', st0['alliances/me'] && st0['alliances/me'].name === 'QA 컨소시엄' && st0['members/me'] && st0['members/me'].ally === 'me' && st0['members/me'].reqs.some((r) => r.reqId === 'b1'));
  const wk = await p.evaluate(() => { const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); return y + '-W' + String(Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7)).padStart(2, '0'); });
  const left0 = await p.evaluate(() => Number((document.querySelector('.sign .timer') || {}).textContent ? 1 : 0));
  await p.evaluate((w) => window.__put('members/u2', { nick: '동료', ally: 'me', tier: 2, univ: 2, power: 2500, donated: { lab: 100 }, weekKey: w, weekPapers: 120, helpGiven: 3, helps: { me: 'b1:3' }, reqs: [{ reqId: 'b9', label: '서버실 공사', left: 300, at: Date.now() }], updatedAt: Date.now() }), wk);
  await p.waitForTimeout(400);
  const txt = await p.textContent('#panel-ally');
  ok('동료 도움 요청이 보이고 멤버 2명', txt.includes('동료 · 서버실 공사') && (await p.$$('#memberList li')).length === 2);
  ok('동료 기부로 공동 기술 Lv 2', txt.includes('공동 장비 구매 Lv 2'));
  ok('주간 목표: 멤버 논문 합계로 1단계 상자', !(await p.$eval('[data-wk="0"]', (e) => e.disabled)));
  await p.click('#helpList .btn'); await p.waitForTimeout(300);
  const st1 = await p.evaluate(() => window.__store['members/me']);
  ok('도와주기는 내 문서에만 기록', st1.helps.u2 === 'b9:1' && st1.helpGiven === 1);
  await p.click('.plot[data-id="server"]'); await p.waitForTimeout(200);
  const remain = await p.textContent('#roomCard');
  ok('동료 도움 3번이 내 공사 시간을 줄인다', /남은 시간 (8분|7분)/.test(remain), (remain.match(/남은 시간 [^.]*/) || [''])[0] + (left0 ? '' : ''));
  await p.screenshot({ path: SP + '/ty-ally.png' });
  { const t = E.newGame(); t.colPity = E.COL_PITY; for (let i = 0; i < 6; i++) t.col.visitors[i] = 1; const r = E.dropCol(t, 'visitors', 1); ok('도감 천장: 중복 4번 뒤 새 항목 확정', r && r.isNew && t.colPity === 0); }
  { const t = E.newGame(); E.refreshDay(t, '2026-10-23', '2026-10-22'); E.mockBuy(t, 'sub', '2026-10-23', '2026-11-22'); const r = E.offline(t, 10 * 3600); ok('정기구독: 방치 효율 100%, 최대 12시간', r.eff === 1 && r.capH === 12 && !r.capped); }
  ok('콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  console.log(res.join('\n')); console.log('스크린샷: ' + SP); process.exitCode = res.some((r) => r.startsWith('FAIL')) ? 1 : 0; await b.close();
})();
