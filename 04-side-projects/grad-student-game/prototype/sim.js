// 밸런스 시뮬레이터: node sim.js
// 플레이어 유형별로 각 직급에 도달하는 시각(분)을 출력한다.
const E = require('./engine.js');

function run({ tps, skills, profEvery, limitMin = 600 }) {
  const st = E.newGame(0);
  st.rng = 12345;
  const reach = { 1: 0 };
  let nextProf = profEvery;
  for (let sec = 0; sec < limitMin * 60 && !st.ended; sec++) {
    for (let i = 0; i < tps; i++) E.tap(st);
    if (skills) { E.useSkill(st, 'night'); E.useSkill(st, 'deadline'); }
    if (profEvery && st.time >= nextProf) { E.profReward(st); nextProf += profEvery; }
    E.tick(st, 1);
    for (let guard = 0; guard < 50; guard++) {
      if (E.canPromote(st)) { E.promote(st); reach[st.tier] = st.time / 60; continue; }
      if (st.tier === 7 && st.papers >= E.CFG.needs[8] && E.buyCentury(st)) continue;
      const ps = E.perSecBase(st), income = ps + tps * E.perTap(st);
      const opts = [];
      E.GENS.filter((g) => E.genUnlocked(st, g.id)).forEach((g) => {
        const n = st.gens[g.id];
        const d = (E.genRate({ gens: { [g.id]: n + 1 } }, g) * (n + 1) - E.genRate(st, g) * n) * E.globalMult(st);
        opts.push({ cost: E.genCost(st, g.id), gain: d, buy: () => E.buyGen(st, g.id) });
      });
      opts.push({ cost: E.tapCost(st), gain: tps * E.perTap(st) * 0.5, buy: () => E.buyTap(st) });
      const nt = E.nextTier(st);
      const need = E.CFG.needs[st.tier + 1];
      const promoBonus = nt && st.papers + 1 >= need ? income * 0.6 : 0;
      opts.push({ cost: E.paperCost(st), gain: ps * E.CFG.paperBonus / (1 + E.CFG.paperBonus * st.papers) + promoBonus + (nt && st.papers < need ? income * 0.05 : 0), buy: () => E.writePaper(st) });
      opts.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
      const best = opts[0];
      if (st.data >= best.cost) { best.buy(); continue; }
      if (best.cost > income * 120) { const alt = opts.find((o) => o.cost <= st.data && o.cost < income * 30); if (alt) { alt.buy(); continue; } }
      break;
    }
  }
  return { reach, papers: st.papers, taps: st.taps, ended: st.ended, min: st.time / 60 };
}

module.exports = { run };
if (require.main !== module) return;

const fmtReach = (r) => E.TIERS.slice(1).map((t, i) => t.name + ' ' + (r.reach[i + 1] != null ? r.reach[i + 1].toFixed(0) + '분' : '-')).join(' | ');
for (const p of [{ label: '적극 (초당 5탭, 스킬, 교수님 90초)', tps: 5, skills: true, profEvery: 90 }, { label: '가벼움 (초당 1탭)', tps: 1, skills: false, profEvery: 0 }]) {
  const r = run(p);
  console.log(p.label + '\n  ' + fmtReach(r) + '\n  논문 ' + r.papers + '편, 종료 ' + r.ended + ', ' + r.min.toFixed(0) + '분');
}
