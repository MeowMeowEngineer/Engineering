// 밸런스 시뮬레이터: node sim.js
// 매초 '연구비 증가량 ÷ 비용'이 가장 좋은 선택(방 업그레이드·공사·학생 모집)을 하는 플레이어로 승진 시각을 잰다.
const E = require('./engine.js');

const clone = (st) => JSON.parse(JSON.stringify(st));
// 실제 플레이어처럼: 분위기가 떨어지면 휴게실, 새 방이 열리면 공사, 그 밖에는 병목 단계를 키운다.
function bestAction(st) {
  const f = E.flow(st);
  const opts = [];
  const push = (cost, gain, act) => { if (gain > 0) opts.push({ cost, gain, act }); };
  const okUp = (id) => { const c = E.canUpgrade(st, id); return c === true || c === '연구비 부족'; };
  if (f.mood < 0.97 && okUp('lounge')) push(E.upCost(st, 'lounge'), 1e9, () => E.upgrade(st, 'lounge'));
  E.ROOMS.filter((r) => !E.built(st, r.id) && okUp(r.id)).forEach((r) => push(E.upCost(st, r.id), 1e9, () => E.upgrade(st, r.id)));
  // 대학 승격: 30분 안에 모을 수 있는 금액이면 그것부터 모은다
  { const c = E.canUpgradeUniv(st); if ((c === true || c === '연구비 부족') && E.UNIVS[st.univ + 1].cost <= st.money + f.money * 1800) push(E.UNIVS[st.univ + 1].cost, 1e12, () => E.upgradeUniv(st)); }
  const stageGain = (mut) => { const c = clone(st); c.money = Infinity; mut(c); const g = E.flow(c); return f.bott === 'A' ? g.a - f.a : f.bott === 'B' ? g.b - f.b : g.c - f.c; };
  if (f.bott === 'A') {
    // 대공사는 시간이 지나야 레벨이 오르므로, 효과 계산에서는 레벨을 바로 올려 본다
    E.ROOMS.filter((r) => r.role === 'A' && E.built(st, r.id) && okUp(r.id)).forEach((r) => push(E.upCost(st, r.id), stageGain((c) => { c.rooms[r.id] = E.lv(c, r.id) + 1; }), () => E.upgrade(st, r.id)));
    if (st.students.length < E.maxStudents(st)) push(E.hireCost(st), stageGain((c) => E.hire(c)), () => E.hire(st));
  } else {
    const id = f.bott === 'B' ? 'meeting' : 'office';
    if (okUp(id)) push(E.upCost(st, id), 1, () => E.upgrade(st, id));
    else if (okUp('office')) push(E.upCost(st, 'office'), 1, () => E.upgrade(st, 'office')); // 교수실 레벨 제한에 걸리면 교수실부터
  }
  // 교수실 레벨 제한에 걸린 방이 있으면 교수실을 올린다
  if (E.ROOMS.some((r) => E.built(st, r.id) && String(E.canUpgrade(st, r.id)).startsWith('교수실')) && okUp('office')) push(E.upCost(st, 'office'), 1, () => E.upgrade(st, 'office'));
  // 장비: 싼 것부터 (병목 비용의 30%보다 싸면)
  const cheapest = Math.min(...opts.map((o) => o.cost), Infinity);
  E.ROOMS.forEach((r) => E.EQUIP[r.id].forEach((_, i) => { const c = E.canEquip(st, r.id, i); if ((c === true || c === '연구비 부족') && E.eqCost(st, r.id, i) < cheapest * 0.3) push(E.eqCost(st, r.id, i), 1e6, () => E.upgradeEquip(st, r.id, i)); }));
  opts.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
  // 자료실은 병목 비용의 20%보다 싸면 함께 올린다
  if (E.built(st, 'library') && okUp('library') && opts.length && E.upCost(st, 'library') < opts[0].cost * 0.2) opts.unshift({ cost: E.upCost(st, 'library'), gain: 1, act: () => E.upgrade(st, 'library') });
  return opts;
}
// 학과 연구·스타 연구원·스킬: 쓸 수 있으면 바로 쓴다
function extras(st) {
  const order = ['exp', 'write', 'admin', 'welfare', 'pr', 'build', 'scholar'];
  if (!st.research.active) { const id = order.slice().sort((a, b) => E.researchCost(st, a) - E.researchCost(st, b)).find((k) => E.canResearch(st, k) === true); if (id) E.startResearch(st, id); }
  while (st.tickets > 0) E.drawCard(st);
  const best = (role) => E.CARDS.filter((c) => st.cards.owned[c.id] && (c.role === role || c.role === 'any')).sort((a, b) => E.RARITY[b.rar].mult - E.RARITY[a.rar].mult)[0];
  const top = E.ROOMS.filter((r) => r.role === 'A' && E.built(st, r.id)).pop();
  [['meeting', 'B'], ['office', 'C'], ['lounge', 'M'], [top.id, 'A']].forEach(([rid, role]) => { const c = best(role); if (c && !Object.values(st.cards.assign).includes(c.id)) E.assignCard(st, c.id, rid); });
  const f = E.flow(st); const bid = f.bott === 'B' ? 'meeting' : f.bott === 'C' ? 'office' : top.id;
  E.useSkill(st, bid);
}
function activeSecond(st, p, reach) {
  extras(st);
  if (p.encourage) { const f = E.flow(st); const id = f.bott === 'B' ? 'meeting' : f.bott === 'C' ? 'office' : (E.ROOMS.filter((r) => r.role === 'A' && E.built(st, r.id)).pop() || {}).id; if (id) E.encourage(st, id); }
  E.tick(st, 1);
  if (st.univ === E.UNIV_MAX && reach.u == null) reach.u = st.time;
  for (let g = 0; g < 30; g++) {
    if (E.canPromote(st)) { E.promote(st); reach[st.tier] = st.time; continue; }
    const opts = bestAction(st);
    if (!opts.length) break;
    // 살 수 있는 선택을 앞에서부터 시도하고, 실패하면(제한·대기열) 다음 선택으로 넘어간다
    const pick = st.money >= opts[0].cost ? opts.find((o) => st.money >= o.cost && o.act()) : null;
    if (!pick) break;
  }
}
function run(p) {
  const st = E.newGame(p.prev); st.rng = 7;
  const reach = { 1: 0 };
  const limit = (p.limitH || 6) * 3600;
  let nextEvent = p.eventEvery || Infinity;
  if (!p.checkInH) {
    while (st.time < limit && !st.ended) {
      if (st.time >= nextEvent) { const ev = E.pickEvent(st); E.applyEvent(st, ev); nextEvent += p.eventEvery; }
      activeSecond(st, p, reach);
    }
  } else {
    while (st.time < limit && !st.ended) {
      for (let s = 0; s < p.sessionSec && !st.ended; s++) activeSecond(st, p, reach);
      if (st.ended) break;
      E.offline(st, p.checkInH * 3600);
      while (E.canPromote(st)) { E.promote(st); reach[st.tier] = st.time; }
      if (st.univ === E.UNIV_MAX && reach.u == null) reach.u = st.time;
    }
  }
  return { reach, st };
}
module.exports = { run };
if (require.main !== module) return;

const t = (sec) => (sec == null ? '-' : sec >= 86400 ? (sec / 86400).toFixed(1) + '일' : sec >= 3600 ? (sec / 3600).toFixed(1) + '시간' : Math.round(sec / 60) + '분');
const PROFILES = [
  { label: '적극 (방 독려, 이벤트 2분마다)', encourage: true, eventEvery: 120 },
  { label: '가벼움 (구매만)', encourage: false },
  { label: '방치 (4시간마다 2분 접속)', encourage: true, checkInH: 4, sessionSec: 120, limitH: 24 * 10 },
];
for (const p of PROFILES) {
  const r = run(p);
  console.log(p.label + '\n  ' + E.TIERS.slice(1).map((x, i) => x.name + ' ' + t(r.reach[i + 1])).join(' | ') + ' | 세계적 명문대 ' + t(r.reach.u) + ' | 엔딩 ' + (r.st.ended ? t(r.st.time) : '-') + '\n  학생 ' + r.st.students.length + '명, 방 ' + JSON.stringify(r.st.rooms));
}
