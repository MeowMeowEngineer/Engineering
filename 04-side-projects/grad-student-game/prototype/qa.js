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
  const y = E.newGame(); y.data = 1e9;
  const names = []; for (let i = 0; i < 7; i++) { E.writePaper(y); if (E.canPromote(y)) E.promote(y); names.push(E.rankName(y)); }
  ok('연차: 석사 1~2년차, 박사 1~4년차 순서로 오른다', names.join(',') === '석사과정 1년차,석사과정 2년차,박사과정 1년차,박사과정 2년차,박사과정 3년차,박사과정 4년차,포닥', names.join(','));
  const pj = E.newGame(); pj.data = 1e6; pj.rng = 3;
  const r1 = E.startProject(pj, 'i1');
  ok('산학과제는 계약(선정 100%)이고 진행 중 생산 보너스가 붙는다', r1 && r1.selected && E.projBuff(pj) === 0.05);
  ok('박사과정 전에는 국가과제를 낼 수 없다', E.projState(pj, 'n1') === '박사과정부터' && E.startProject(pj, 'n1') === null);
  E.tick(pj, 901);
  ok('과제가 끝나면 보상·협약서·실적이 남는다', pj.projects.length === 0 && pj.life.projects === 1 && pj.col.projects.i1 === true);
  const lr = E.newGame(); lr.tier = 8; lr.papers = 50; lr.data = 1e12; E.buyCentury(lr); E.promote(lr);
  const rw = E.laurelReward(lr).total, nx = E.retire(lr);
  ok('재입학하면 월계관(기본 3 + 추가 논문 1)을 받는다', rw === 4 && nx.laurels === 4 && nx.life.runs === 1);
  ok('월계관 강화를 사면 보유 월계관이 줄고 레벨이 오른다', E.buyUpgrade(nx, 'know') && nx.laurels === 3 && E.upLv(nx, 'know') === 1);
  nx.laurels = 20; E.buyUpgrade(nx, 'early'); const nx2 = E.retire(Object.assign(nx, { ended: true }));
  ok('조기 진학 강화: 재입학하면 박사과정 1년차로 시작', nx2.tier === 2 && E.rankName(nx2) === '박사과정 1년차');
  const qRate = E.dropRate('quotes', 0), aRates = ['c', 'r', 'e', 'l'].map((r) => E.dropRate('avatar', E.COLLECTION.avatar.items.findIndex((it) => it[1] === r)));
  ok('영웅 등급을 넣어도 어록 확률은 그대로(5.45%), 아바타는 일반>희귀>영웅>전설', Math.abs(qRate - 5.4545) < 0.01 && aRates[0] > aRates[1] && aRates[1] > aRates[2] && aRates[2] > aRates[3], aRates.map((x) => x.toFixed(2)).join('/'));
  const av = E.newGame(); av.rng = 9; av.data = 1e9;
  for (let i = 0; i < 3; i++) E.writePaper(av);
  E.promote(av);
  ok('전직하면 아바타 1개 확정', E.colCount(av, 'avatar') === 1);
  const lvA = E.newGame(); lvA.rng = 2; lvA.exp = 1e9; E.tick(lvA, 1);
  ok('5레벨마다 아바타 1개 (레벨 5 이상이면 1개 이상)', lvA.lv >= 5 && E.colCount(lvA, 'avatar') >= 1, 'Lv ' + lvA.lv + ', 아바타 ' + E.colCount(lvA, 'avatar'));
  const buy = E.newGame(); buy.coupons = 100;
  ok('쿠폰으로 원하는 아바타를 골라 산다 (희귀 80)', E.buyAvatar(buy, 2) && buy.coupons === 20 && buy.col.avatar[2] === 1 && !E.buyAvatar(buy, 2));
  ok('가진 아바타만 입을 수 있고, 다시 누르면 벗는다', !E.equip(buy, 5) && E.equip(buy, 2) && buy.look.top === 2 && E.equip(buy, 2) && buy.look.top === -1);
  const set = E.newGame(); [15, 16].forEach((i) => (set.col.avatar[i] = 1));
  ok('자세 부위를 다 모으면 방치 효율 2%+8%+세트 10% = 20%p', Math.abs(E.avatarStats(set).offline - 0.2) < 1e-9);
  set.look.gender = 'f'; const re = E.retire(Object.assign(set, { ended: true }));
  ok('재입학해도 성별·아바타 유지', re.look.gender === 'f' && re.col.avatar[16] === 1);
  const mg = E.migrate({ v: 2, data: 1, total: 1, taps: 0, tapLv: 0, gens: {}, papers: 0, paperTitles: [], tier: 1, time: 0, skills: { night: 0, deadline: 0 }, buffs: [], medals: 0, century: false, promotedAt: [{ tier: 1, time: 0 }], rng: 1, ended: false, col: { quotes: {}, goods: {}, topics: {}, photos: { 1: true }, cats: {}, projects: {} } });
  // 에너지 드링크
  const dr = E.newGame(); dr.drinks = 2; const tap0 = E.perTap(dr), ps0 = E.perSec(dr);
  E.drink(dr);
  ok('에너지 드링크: 마시면 5분 동안 탭·자동 생산 2배', E.perTap(dr) === tap0 * 2 && E.buffMult(dr, 'prod') === 2 && dr.buffs.every((b) => b.until === 300) && dr.drinks === 1);
  E.drink(dr);
  ok('겹쳐 마시면 배율은 그대로 2배, 시간만 10분으로 늘어난다', E.buffMult(dr, 'tap') === 2 && dr.buffs.length === 2 && dr.buffs.every((b) => b.until === 600) && !E.drink(dr));
  const gd = E.newGame(); gd.data = 1e9; gd.coupons = 20; gd.rng = 4;
  for (let i = 0; i < 3; i++) E.writePaper(gd); E.promote(gd);
  const afterPromo = gd.drinks; E.spendCoupon(gd, 'drink');
  gd.daily = { day: 'd3', streak: 3, claimed: '', ads: 0, adBuff: 0, adSkill: 0 }; E.claimAttend(gd);
  E.adReward(gd, 'skill');
  ok('드링크 얻는 곳: 전직 +1, 쿠폰 20 구매 +1, 출석 3일째 +1, 광고 +1', afterPromo === 1 && gd.drinks === 4, '가방 ' + gd.drinks);
  ok('출석은 3·7일째에만 드링크', [1, 2, 3, 4, 5, 6, 7].map((d) => E.attendDrink({ daily: { streak: d } })).join() === 'false,false,true,false,false,false,true');
  // 새 도감 3갈래
  const nk = ['awards', 'talks', 'scholar'].map((k) => E.colTotal(k));
  ok('새 도감: 상장·수상 12, 학회 발표 기록 12, 장학생 11', nk.join() === '12,12,11');
  const Lidx = (k) => E.COLLECTION[k].items.findIndex((x) => x[1] === 'l');
  ok('직급이 높을수록 전설 확률이 오른다 (상장 전설 1단계 < 8단계)', E.dropRate('awards', Lidx('awards'), 1) < E.dropRate('awards', Lidx('awards'), 8), E.dropRate('awards', Lidx('awards'), 1).toFixed(2) + '% → ' + E.dropRate('awards', Lidx('awards'), 8).toFixed(2) + '%');
  const pp = E.newGame(); pp.rng = 11; pp.data = 1e60; for (let i = 0; i < 60; i++) E.writePaper(pp);
  ok('논문을 쓰면 상장·학회 발표가 떨어진다', E.colCount(pp, 'awards') > 0 && E.colCount(pp, 'talks') > 0, '상장 ' + E.colCount(pp, 'awards') + ', 발표 ' + E.colCount(pp, 'talks'));
  let yrHits = 0, yrName = '';
  for (let seed = 1; seed <= 40; seed++) { const yr = E.newGame(); yr.rng = seed * 7919; yr.data = 1e9; E.writePaper(yr); E.writePaper(yr); yrName = E.rankName(yr); if (E.colCount(yr, 'scholar') > 0) yrHits++; }
  ok('연차가 오르면 장학생이 70% 확률로 떨어진다 (40판 중 20~38판)', yrName === '석사과정 2년차' && yrHits >= 20 && yrHits <= 38, yrHits + '/40');
  const sw = E.newGame(); E.COLLECTION.awards.items.forEach((_, i) => (sw.col.awards[i] = 1)); sw.tier = 9; sw.ended = true; sw.papers = 45;
  ok('상장 세트를 완성하면 엔딩 월계관 +1', E.laurelReward(sw).award === 1 && E.laurelReward(sw).total === 4);
  E.COLLECTION.scholar.items.forEach((_, i) => (sw.col.scholar[i] = 1));
  ok('장학생 세트를 완성하면 재입학 때 에너지 드링크 3개', E.retire(sw).drinks === 3);
  ok('예전 v2 세이브는 남성·아바타 없음으로 채워진다', mg.look.gender === 'm' && mg.look.top === -1 && typeof mg.col.avatar === 'object');
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
  const m0 = await modalText(p);
  ok('첫 실행: 남녀 선택 모달 (미리보기 2개)', m0.includes('어떤 대학원생을 키울까요') && (await p.$$('#dialog .picks svg')).length === 2);
  await clickModal(p, '여성으로 시작'); await p.waitForTimeout(200);
  ok('여성을 고르면 장면에 여성 머리(뒷머리)가 그려진다', await p.evaluate(() => document.querySelector('#scene path[d^="M50 96 Q42 172"]') !== null));
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
  ok('깨진 세이브는 새 게임으로 시작 (석사과정 1년차, 성별 선택)', (await p.textContent('#tierName')) === '석사과정 1년차' && (await modalText(p)).includes('어떤 대학원생'));
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
  ok('재입학 후 석사과정·쿠폰(77+출석5+첫 도달10)·야옹 유지', (await p.textContent('#tierName')) === '석사과정 1년차' && (await p.textContent('#coupons')) === '92' && (await p.$('.cat')) !== null, '쿠폰 ' + (await p.textContent('#coupons')));
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
  // 13. 새 기능: 범용 이름, 움직이는 장면, 과제·월계관·랭킹 탭
  p = await page();
  await clickModal(p, '남성으로 시작');
  await clickModal(p, '받기');
  const bodyText = await p.evaluate(() => document.body.innerText);
  ok('범용 이름: 화면에 VNA·무향실·안테나·레이다가 없다', !/VNA|무향실|안테나|레이다/.test(bodyText));
  ok('배지에 연차 표시 (석사과정 1년차)', (await p.textContent('#tierName')) === '석사과정 1년차');
  const modes = new Set();
  for (let i = 0; i < 3; i++) { modes.add(await p.evaluate(() => document.getElementById('scene').getAttribute('class'))); await p.click('#tab-gens'); await p.evaluate(() => document.querySelector('#genRows .buy') && 0); await p.waitForTimeout(10); }
  await p.evaluate(() => { const t = document.getElementById('tapper'); for (let i = 0; i < 3; i++) t.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 300, bubbles: true })); });
  await p.waitForTimeout(300);
  ok('연구실 장면이 모드를 가진다 (논문·실험·분석·생각 중 하나)', /mode-(type|exp|an|think)/.test([...modes][0]) && (await p.textContent('#hint')).endsWith('중…'), [...modes].join(' / ') + ' · ' + (await p.textContent('#hint')));
  await p.click('#tab-proj'); await p.waitForTimeout(150);
  const projText = await p.textContent('#panel-proj');
  ok('과제 탭: 산학 3개 + 국가과제(중소·중견·대기업 주관) 6개', (projText.match(/중소기업 주관/g) || []).length === 2 && (projText.match(/중견기업 주관/g) || []).length === 2 && (projText.match(/대기업 주관/g) || []).length === 2 && projText.includes('산학 공동연구센터'));
  ok('과제 탭: 국가과제 선정률 공개 (60%)', projText.includes('선정률 60%'));
  await p.click('#tab-laurel'); await p.waitForTimeout(100);
  ok('월계관 탭: 강화 9종 표시', (await p.$$('#panel-laurel [data-up]')).length === 9);
  await p.click('#tab-rank'); await p.waitForTimeout(100);
  ok('파일로 열면 랭킹 대신 안내 문구', (await p.textContent('#panel-rank')).includes('claude.ai에서 이 게임을 열었을 때'));
  await p.click('#tab-proj'); await p.waitForTimeout(100);
  await p.screenshot({ path: SP + '/qa-projects.png', fullPage: true });
  // 14. 아바타 탭·충혈·전직 미리보기
  const s14 = E.newGame(); s14.daily.claimed = 'x'; s14.coupons = 500; s14.taps = 3; s14.look.gender = 'f';
  [2, 9, 14, 15, 20].forEach((i) => (s14.col.avatar[i] = 1));
  p = await page(undefined, JSON.stringify({ st: s14, at: Date.now() }));
  await clickModal(p, '받기');
  await p.click('#tab-avatar'); await p.waitForTimeout(150);
  ok('아바타 탭: 22칸, 가진 5개는 입기 버튼, 없는 것은 ??? + 쿠폰 가격', (await p.$$('#panel-avatar [data-equip]')).length === 5 && (await p.$$('#panel-avatar [data-avbuy]')).length === 17 && (await p.textContent('#panel-avatar')).includes('☕ 40로 사기'));
  for (const i of [2, 9, 14, 15, 20]) { await p.click('[data-equip="' + i + '"]'); await p.waitForTimeout(80); }
  const look = await p.evaluate(() => JSON.parse(localStorage.getItem('gradclicker.v1')).st.look);
  ok('입은 아바타가 저장된다 (실험 가운·학사모·선글라스·거북목·다육이)', look.top === 2 && look.head === 9 && look.face === 14 && look.posture === 15 && look.prop === 20, JSON.stringify(look));
  ok('입은 아이템이 장면에 그려진다 (학사모·선글라스·다육이)', await p.evaluate(() => { const sc = document.getElementById('scene'); return !!sc.querySelector('path[d^="M100 22 L156 42"]') && !!sc.querySelector('path[d^="M66 96 H98"]') && !!sc.querySelector('ellipse[cx="137"][cy="230"]'); }));
  const cBefore = Number(await p.textContent('#coupons'));
  await p.click('[data-avbuy="0"]'); await p.waitForTimeout(150);
  const lk2 = await p.evaluate(() => JSON.parse(localStorage.getItem('gradclicker.v1')).st.look);
  ok('쿠폰 40으로 체크셔츠를 사면 바로 입는다', Number(await p.textContent('#coupons')) === cBefore - 40 && lk2.top === 0, cBefore + ' → ' + (await p.textContent('#coupons')));
  await p.screenshot({ path: SP + '/qa-avatar.png', fullPage: true });
  // 충혈: 한 번에 많이 탭하면 f3, 멈추면 내려간다
  for (let k = 0; k < 10; k++) { await p.evaluate(() => { const t = document.getElementById('tapper'); for (let i = 0; i < 15; i++) t.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 300, bubbles: true })); }); await p.waitForTimeout(1010); }
  const f3 = await p.evaluate(() => document.getElementById('scene').getAttribute('class'));
  ok('계속 탭하면 눈이 3단계로 충혈되고 문구가 바뀐다', f3.includes('f3') && (await p.textContent('#hint')).includes('충혈'), f3);
  await p.screenshot({ path: SP + '/qa-redeye.png' });
  await p.waitForTimeout(9000);
  ok('탭을 멈추면 충혈이 풀린다', !(await p.evaluate(() => document.getElementById('scene').getAttribute('class'))).includes('f3'));
  await p.click('#nextLabel'); await p.waitForTimeout(150);
  const pv = await modalText(p);
  ok('다음 전직 미리보기: 박사과정 보상 목록', pv.includes('박사과정') && pv.includes('공용 실험 장비') && pv.includes('자동 투고') && pv.includes('아바타 1개 확정') && pv.includes('커피 쿠폰 +10'));
  await clickModal(p, '닫기');
  await p.click('#tab-rec'); await p.waitForTimeout(150);
  await p.click('#treeBox .tier:nth-child(9)'); await p.waitForTimeout(150);
  ok('전직 트리에서 숨겨진 직급은 ???', (await modalText(p)).includes('???'));
  await clickModal(p, '닫기');
  await p.click('#treeBox .tier:nth-child(5)'); await p.waitForTimeout(150);
  ok('전직 트리에서 조교수 미리보기 (대기업 산학과제)', (await modalText(p)).includes('산학 공동연구센터'));
  await clickModal(p, '닫기');
  // 15. 에너지 드링크 버튼·상점 광고 이름·새 도감 탭
  const s15 = E.newGame(); s15.daily.claimed = 'x'; s15.drinks = 2;
  p = await page(undefined, JSON.stringify({ st: s15, at: Date.now() }));
  await clickModal(p, '받기');
  ok('상단에 에너지 드링크 2개와 마시기 버튼', (await p.textContent('#drinks')) === '2' && !(await p.isDisabled('#drinkBtn')));
  await p.click('#drinkBtn'); await p.waitForTimeout(250);
  ok('마시면 1개로 줄고 버프 표시가 뜬다', (await p.textContent('#drinks')) === '1' && (await p.textContent('#buffs')).includes('에너지 드링크'));
  await p.click('#tab-shop'); await p.waitForTimeout(150);
  ok('상점 광고 보상 이름이 「에너지 드링크 1개 받기」로 바뀌었다', (await p.textContent('#panel-shop')).includes('에너지 드링크 1개 받기') && !(await p.textContent('#panel-shop')).includes('밤샘·마감 버프를 바로'));
  await p.click('#tab-col'); await p.waitForTimeout(150);
  const colT = await p.textContent('#panel-col');
  ok('도감 탭에 상장·수상, 학회 발표 기록, 장학생, 아바타가 보인다', ['상장·수상', '학회 발표 기록', '장학생', '아바타'].every((x) => colT.includes(x)));
  // 11. 폰 너비
  const p11 = await page();
  ok('폰 너비 가로 스크롤 없음', (await p11.evaluate(() => document.documentElement.scrollWidth)) <= 400);
  ok('콘솔 오류 없음', errors.length === 0, errors.join(' | '));
  console.log(results.join('\n'));
  console.log('스크린샷: ' + SP);
  process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
  await browser.close();
})();
