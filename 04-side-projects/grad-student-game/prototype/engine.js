// 대학원생 키우기 (클리커) 엔진. 화면과 분리해 브라우저(GradEngine 전역)와 Node(require) 양쪽에서 쓴다.
// 시간은 st.time(초)으로만 흐르므로 세이브·밸런스 시뮬레이션에서 같은 결과가 나온다.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 밸런스 조정값. sim.js가 이 값을 바꿔 가며 전직 속도를 맞춘다.
  const CFG = {
    needs: [0, 0, 3, 7, 12, 18, 25, 32, 38], // 직급별 전직에 필요한 누적 논문 편수
    paperBase: 6000, paperGrowth: 1.45, paperBonus: 0.03, tierProd: 1.5, tierTap: 1.5, century: 3e9,
  };
  const TIERS = [
    null,
    { name: '석사과정', title: '랩실 막내' },
    { name: '박사과정', title: '연구실 고인물' },
    { name: '포닥', title: '떠돌이 연구자' },
    { name: '조교수', title: '테뉴어 수험생' },
    { name: '부교수', title: '중견 연구자' },
    { name: '정교수', title: '연구실의 왕' },
    { name: '석학', title: '학계의 거목' },
    { name: '아인슈타인급', title: '인류의 지성' },
  ];
  
  // 자동 생산원. tier 이상이 되면 고용·구매할 수 있다.
  const GENS = [
    { id: 'coffee', name: '커피 머신', note: '졸음을 데이터로 바꾼다', base: 15, rate: 0.1, tier: 1 },
    { id: 'intern', name: '학부연구생', note: '측정 셋업을 대신 해 준다', base: 100, rate: 1, tier: 1 },
    { id: 'junior', name: '후배 대학원생', note: '"선배, 이거 왜 안 돼요?"', base: 1100, rate: 8, tier: 2 },
    { id: 'vna', name: 'VNA', note: '벡터 네트워크 분석기. 교정 키트는 자주 사라진다', base: 12000, rate: 47, tier: 2 },
    { id: 'chamber', name: '무향실', note: '예약 전쟁 없이 우리 랩 전용', base: 130000, rate: 260, tier: 3 },
    { id: 'agent', name: 'AI 코딩 에이전트', note: '가끔 엉뚱한 파일을 고친다', base: 1.4e6, rate: 1400, tier: 3 },
    { id: 'cluster', name: 'EM 해석 클러스터', note: '밤새 1,000건을 돌린다', base: 2e7, rate: 7800, tier: 4 },
    { id: 'postdoc', name: '포닥 연구원', note: '내가 포닥일 때보다 일을 잘한다', base: 3.3e8, rate: 44000, tier: 4 },
    { id: 'consortium', name: '국제 공동연구단', note: '시차 덕분에 24시간 연구', base: 5.1e9, rate: 260000, tier: 5 },
    { id: 'telescope', name: '전파망원경 배열', note: '우주에서 오는 데이터', base: 7.5e10, rate: 1.6e6, tier: 6 },
    { id: 'institute', name: '석학 연구원', note: '이름을 딴 연구원이 생겼다', base: 1e12, rate: 1e7, tier: 7 },
  ];
  const GEN_GROWTH = 1.15;
  const MILESTONES = [10, 25, 50, 100]; // 이만큼 보유하면 그 생산원 효율 2배

  const SKILLS = {
    night: { name: '밤샘', desc: '30초 동안 탭 데이터 10배', dur: 30, cd: 300, tier: 1 },
    deadline: { name: '마감 버프', desc: '30초 동안 자동 생산 3배', dur: 30, cd: 600, tier: 2 },
  };

  const TOPICS = ['벽 투과 FMCW 레이다', '광각 위상배열 안테나', '저손실 동축 케이블', '렌즈 배열 안테나', '메타표면 반사판', '이중편파 분산형 레이다', '밀리미터파 빔포밍', '무선 전력 전송 코일', '도파관 필터', '레이다 거리 빈 선택'];
  const METHODS = ['설계', '측정', '해석', '머신러닝 기반 최적화', '소형화', '실험적 검증', '오차 보정', '성능 개선'];
  const FINAL_TITLE = '전자기파와 시공간 곡률의 통합 이론';

  const fmtUnits = [[1e44, '재'], [1e40, '정'], [1e36, '간'], [1e32, '구'], [1e28, '양'], [1e24, '자'], [1e20, '해'], [1e16, '경'], [1e12, '조'], [1e8, '억'], [1e4, '만']];
  function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n);
    if (n < 10) return (Math.floor(n * 10) / 10).toString();
    if (n < 1e4) return Math.floor(n).toLocaleString('ko-KR');
    for (const [v, u] of fmtUnits) if (n >= v) { const x = n / v; return (x >= 100 ? Math.floor(x) : Math.floor(x * 10) / 10) + u; }
    return Math.floor(n).toString();
  }

  function newGame(medals) {
    const st = {
      v: 1, data: 0, total: 0, taps: 0, tapLv: 0, gens: {}, papers: 0, paperTitles: [], tier: 1,
      time: 0, skills: { night: 0, deadline: 0 }, buffs: [], medals: medals || 0, century: false,
      promotedAt: [{ tier: 1, time: 0 }], rng: (Math.random() * 2 ** 32) >>> 0, ended: false,
    };
    GENS.forEach((g) => (st.gens[g.id] = 0));
    return st;
  }

  function rnd(st) {
    let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- 배율 ----------
  const buffMult = (st, kind) => st.buffs.filter((b) => b.kind === kind && b.until > st.time).reduce((a, b) => a * b.mult, 1);
  const milestoneMult = (n) => MILESTONES.filter((m) => n >= m).length;
  const genRate = (st, g) => g.rate * Math.pow(2, milestoneMult(st.gens[g.id]));
  function globalMult(st) {
    return (1 + CFG.paperBonus * st.papers) * Math.pow(CFG.tierProd, st.tier - 1) * (1 + 0.5 * st.medals);
  }
  function perSecBase(st) { return GENS.reduce((a, g) => a + st.gens[g.id] * genRate(st, g), 0) * globalMult(st); }
  function perSec(st) { return perSecBase(st) * buffMult(st, 'prod'); }
  function perTap(st) {
    const base = Math.pow(2, st.tapLv) * Math.pow(CFG.tierTap, st.tier - 1) * (1 + 0.5 * st.medals);
    const share = st.tier >= 3 ? perSecBase(st) * 0.02 : 0; // 포닥부터 탭 1번에 초당 생산의 2%가 더해진다
    return (base + share) * buffMult(st, 'tap');
  }

  // ---------- 비용 ----------
  const genCost = (st, id) => { const g = GENS.find((x) => x.id === id); return Math.ceil(g.base * Math.pow(GEN_GROWTH, st.gens[id])); };
  const tapCost = (st) => Math.ceil(50 * Math.pow(6, st.tapLv));
  // 첫 논문 몇 편은 할인해 초반 전직이 빨리 오게 한다(1편째 1/6 가격, 6편째부터 정가).
  const paperCost = (st) => Math.ceil(CFG.paperBase * Math.pow(CFG.paperGrowth, st.papers) * Math.min(1, (st.papers + 1) / 6));
  const nextTier = (st) => (st.tier < 8 ? TIERS[st.tier + 1] : null);

  // ---------- 행동 ----------
  function earn(st, v) { st.data += v; st.total += v; }
  function tick(st, dt) {
    if (st.ended) return;
    // 버프 경계에서 나눠 계산해, 큰 dt(오프라인 보상, 시뮬레이션)에서도 버프 시간만큼만 배율이 붙는다.
    let left = dt;
    while (left > 0) {
      const ends = st.buffs.map((b) => b.until).filter((u) => u > st.time);
      const step = Math.min(left, ends.length ? Math.min(...ends) - st.time : left);
      earn(st, perSec(st) * step);
      st.time += step; left -= step;
    }
    st.buffs = st.buffs.filter((b) => b.until > st.time);
  }
  function tap(st) { if (st.ended) return 0; const v = perTap(st); earn(st, v); st.taps++; return v; }
  function genUnlocked(st, id) { return st.tier >= GENS.find((g) => g.id === id).tier; }
  function buyGen(st, id) {
    if (!genUnlocked(st, id)) return false;
    const c = genCost(st, id); if (st.data < c) return false;
    st.data -= c; st.gens[id]++; return true;
  }
  function buyTap(st) { const c = tapCost(st); if (st.data < c) return false; st.data -= c; st.tapLv++; return true; }
  function writePaper(st) {
    const c = paperCost(st); if (st.data < c) return null;
    st.data -= c; st.papers++;
    const title = TOPICS[Math.floor(rnd(st) * TOPICS.length)] + '의 ' + METHODS[Math.floor(rnd(st) * METHODS.length)];
    st.paperTitles.push(title);
    return title;
  }
  function canPromote(st) {
    const n = nextTier(st); if (!n) return false;
    if (st.papers < CFG.needs[st.tier + 1]) return false;
    return st.tier + 1 < 8 || st.century;
  }
  function promote(st) {
    if (!canPromote(st)) return false;
    st.tier++; st.promotedAt.push({ tier: st.tier, time: st.time });
    if (st.tier === 8) st.ended = true;
    return true;
  }
  function buyCentury(st) {
    if (st.tier !== 7 || st.century || st.data < CFG.century) return false;
    st.data -= CFG.century; st.century = true; st.paperTitles.push(FINAL_TITLE); return true;
  }
  function skillReady(st, id) { return st.tier >= SKILLS[id].tier && st.time >= st.skills[id]; }
  function useSkill(st, id) {
    if (!skillReady(st, id)) return false;
    const s = SKILLS[id];
    st.buffs.push({ kind: id === 'night' ? 'tap' : 'prod', mult: id === 'night' ? 10 : 3, until: st.time + s.dur, src: s.name });
    st.skills[id] = st.time + s.cd;
    return true;
  }
  // 화면에 가끔 지나가는 교수님을 누르면 받는 보상 (거지키우기의 보물 거지 자리)
  function profReward(st) {
    const r = rnd(st);
    if (r < 0.5) { const v = Math.max(perSec(st) * 60, perTap(st) * 30, 50); earn(st, v); return { kind: 'data', text: '교수님이 연구비를 풀었다! 데이터 +' + fmt(v) }; }
    if (r < 0.8) { st.buffs.push({ kind: 'tap', mult: 7, until: st.time + 20, src: '영감' }); return { kind: 'tap', text: '교수님 한마디에 영감이 왔다. 20초 동안 탭 7배' }; }
    st.buffs.push({ kind: 'prod', mult: 5, until: st.time + 20, src: '과제 선정' }); return { kind: 'prod', text: '과제 선정 소식! 20초 동안 자동 생산 5배' };
  }
  // 앱을 닫아 둔 시간의 보상: 최대 8시간, 효율 50%
  function offline(st, seconds) {
    const s = Math.min(Math.max(0, seconds), 8 * 3600);
    const v = perSecBase(st) * s * 0.5;
    earn(st, v); st.time += s;
    st.buffs = st.buffs.filter((b) => b.until > st.time);
    return { seconds: s, gain: v };
  }

  return {
    CFG, TIERS, GENS, SKILLS, MILESTONES, fmt,
    newGame, tick, tap, perSec, perSecBase, perTap, globalMult, genRate, genCost, tapCost, paperCost, nextTier, genUnlocked,
    buyGen, buyTap, writePaper, canPromote, promote, buyCentury, skillReady, useSkill, profReward, offline, buffMult,
  };
});
