// 밸런스 시뮬레이터: node sim.js
// 매초 '연구비 증가량 ÷ 비용'이 가장 좋은 선택(방 업그레이드·공사·학생 모집)을 하는 플레이어로 승진 시각을 잰다.
const E = require('./engine.js');

const clone = (st) => JSON.parse(JSON.stringify(st));
// 실제 플레이어처럼: 분위기가 떨어지면 휴게실, 새 방이 열리면 공사, 그 밖에는 병목 단계를 키운다.
function bestAction(st) {
  const f = E.flow(st);
  const opts = [];
  const push = (cost, gain, act) => { if (gain > 0) opts.push({ cost, gain, act }); };
  if (f.mood < 0.97) push(E.upCost(st, 'lounge'), 1e9, () => E.upgrade(st, 'lounge'));
  E.ROOMS.filter((r) => E.unlocked(st, r.id) && !E.built(st, r.id)).forEach((r) => push(E.upCost(st, r.id), 1e9, () => E.upgrade(st, r.id)));
  const stageGain = (mut) => { const c = clone(st); c.money = Infinity; mut(c); const g = E.flow(c); return f.bott === 'A' ? g.a - f.a : f.bott === 'B' ? g.b - f.b : g.c - f.c; };
  if (f.bott === 'A') {
    E.ROOMS.filter((r) => r.role === 'A' && E.built(st, r.id)).forEach((r) => push(E.upCost(st, r.id), stageGain((c) => E.upgrade(c, r.id)), () => E.upgrade(st, r.id)));
    if (st.students.length < E.maxStudents(st)) push(E.hireCost(st), stageGain((c) => E.hire(c)), () => E.hire(st));
  } else {
    const id = f.bott === 'B' ? 'meeting' : 'office';
    push(E.upCost(st, id), 1, () => E.upgrade(st, id));
  }
  opts.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
  // 자료실은 병목 비용의 20%보다 싸면 함께 올린다
  if (E.built(st, 'library') && opts.length && E.upCost(st, 'library') < opts[0].cost * 0.2) opts.unshift({ cost: E.upCost(st, 'library'), gain: 1, act: () => E.upgrade(st, 'library') });
  return opts;
}
function activeSecond(st, p, reach) {
  if (p.encourage) { const f = E.flow(st); const id = f.bott === 'B' ? 'meeting' : f.bott === 'C' ? 'office' : (E.ROOMS.filter((r) => r.role === 'A' && E.built(st, r.id)).pop() || {}).id; if (id) E.encourage(st, id); }
  E.tick(st, 1);
  for (let g = 0; g < 30; g++) {
    if (E.canPromote(st)) { E.promote(st); reach[st.tier] = st.time; continue; }
    const opts = bestAction(st);
    if (!opts.length) break;
    if (st.money >= opts[0].cost) { opts[0].act(); continue; }
    break;
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
  console.log(p.label + '\n  ' + E.TIERS.slice(1).map((x, i) => x.name + ' ' + t(r.reach[i + 1])).join(' | ') + '\n  학생 ' + r.st.students.length + '명, 방 ' + JSON.stringify(r.st.rooms));
}
