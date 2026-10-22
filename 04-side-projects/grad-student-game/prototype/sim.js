// 밸런스 시뮬레이터: node sim.js
// 플레이어 유형별로 각 직급에 도달하는 시각을 출력한다. 결제·광고 보상은 '구독' 유형에만 넣는다.
const E = require('./engine.js');

// 1초 동안 적극적으로 플레이하는 한 걸음: 탭, 스킬, 구매, 전직
function activeSecond(st, p, reach) {
  for (let i = 0; i < p.tps; i++) E.tap(st);
  if (p.skills) { E.useSkill(st, 'night'); E.useSkill(st, 'deadline'); }
  E.tick(st, 1);
  if (p.auto) { E.setAuto(st, 'paper', true); E.setAuto(st, 'hire', true); }
  for (let guard = 0; guard < 60; guard++) {
    if (E.canPromote(st)) { E.promote(st); reach[st.tier] = st.time; continue; }
    if (E.buyCentury(st)) continue;
    const ps = E.perSecBase(st), income = ps + p.tps * E.perTap(st) + 1;
    const opts = [];
    E.GENS.filter((g) => E.genUnlocked(st, g.id)).forEach((g) => {
      const n = st.gens[g.id];
      const d = (E.genRate({ gens: { [g.id]: n + 1 } }, g) * (n + 1) - E.genRate(st, g) * n) * E.globalMult(st);
      opts.push({ cost: E.genCost(st, g.id), gain: d, buy: () => E.buyGen(st, g.id) });
    });
    opts.push({ cost: E.tapCost(st), gain: p.tps * E.perTap(st) * 0.5, buy: () => E.buyTap(st) });
    const need = E.nextNeed(st);
    const promoBonus = st.papers + 1 >= need ? income * 0.6 : 0;
    opts.push({ cost: E.paperCost(st), gain: ps * E.CFG.paperBonus / (1 + E.CFG.paperBonus * st.papers) + promoBonus + (st.papers < need ? income * 0.05 : 0), buy: () => E.writePaper(st) });
    opts.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
    const best = opts[0];
    if (st.data >= best.cost) { best.buy(); continue; }
    if (best.cost > income * 120) { const alt = opts.find((o) => o.cost <= st.data && o.cost < income * 30); if (alt) { alt.buy(); continue; } }
    break;
  }
}

function run(p) {
  const st = E.newGame();
  st.rng = 12345;
  if (p.sub) { st.subActive = true; st.pet = true; }
  const reach = { 1: 0 };
  const limit = (p.limitH || 10) * 3600;
  let nextProf = p.profEvery || Infinity;
  if (!p.checkInH) {
    while (st.time < limit && !st.ended) {
      if (st.time >= nextProf) { E.profReward(st); nextProf += p.profEvery; }
      activeSecond(st, p, reach);
    }
  } else {
    // 방치형: checkInH시간마다 앱을 열어 sessionSec초 동안만 플레이한다.
    while (st.time < limit && !st.ended) {
      for (let s = 0; s < p.sessionSec && !st.ended; s++) activeSecond(st, p, reach);
      if (st.ended) break;
      E.offline(st, p.checkInH * 3600);
      while (E.canPromote(st)) { E.promote(st); reach[st.tier] = st.time; }
    }
  }
  return { reach, papers: st.papers, lv: st.lv, ended: st.ended, time: st.time };
}
module.exports = { run };
if (require.main !== module) return;

const PROFILES = [
  { label: '적극 (초당 5탭, 스킬, 교수님 90초)', tps: 5, skills: true, profEvery: 90, auto: true },
  { label: '가벼움 (초당 1탭)', tps: 1, skills: false, auto: true },
  { label: '방치 (4시간마다 2분 플레이, 무과금)', tps: 3, skills: true, auto: true, checkInH: 4, sessionSec: 120, limitH: 24 * 14 },
  { label: '방치 + 정기구독·야옹', tps: 3, skills: true, auto: true, checkInH: 4, sessionSec: 120, limitH: 24 * 14, sub: true },
  { label: '하루 2번 (12시간마다 5분, 무과금)', tps: 3, skills: true, auto: true, checkInH: 12, sessionSec: 300, limitH: 24 * 14 },
  { label: '하루 2번 + 정기구독·야옹', tps: 3, skills: true, auto: true, checkInH: 12, sessionSec: 300, limitH: 24 * 14, sub: true },
];
const t = (sec) => (sec == null ? '-' : sec >= 86400 ? (sec / 86400).toFixed(1) + '일' : sec >= 3600 ? (sec / 3600).toFixed(1) + '시간' : Math.round(sec / 60) + '분');
for (const p of PROFILES) {
  const r = run(p);
  console.log(p.label + '\n  ' + E.TIERS.slice(1).map((x, i) => x.name + ' ' + t(r.reach[i + 1])).join(' | ') + '\n  논문 ' + r.papers + '편, 레벨 ' + r.lv + ', 종료 ' + r.ended);
}
