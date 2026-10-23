// 랩실 운영하기 (타이쿤) 엔진. 화면과 분리해 브라우저(LabEngine 전역)와 Node(require) 양쪽에서 쓴다.
// 흐름: 연구 공간(데이터 생산) → 회의실(논문화) → 교수실(투고·과제) → 연구비·명성. 가장 느린 단계가 전체 속도를 정한다.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 밸런스 조정값. sim.js가 이 값을 바꿔 가며 승진 속도를 맞춘다.
  const CFG = {
    fameNeed: [0, 0, 1e3, 3e5, 9e7, 2.7e10], // 직급별 승진에 필요한 누적 명성
    tierValue: 2.5, // 승진할 때마다 데이터 1당 연구비 배율
    fameRate: 0.1, // 처리량 1당 명성
    prodGrowth: 1.14, stageGrowth: 1.16, hireBase: 30, hireGrowth: 1.32,
    offlineCapH: 8, offlineEff: 0.5, laurelBonus: 0.25, libraryBonus: 0.05,
  };

  const TIERS = [
    null,
    { name: '조교수', title: '신임 교수' },
    { name: '부교수', title: '중견 연구자' },
    { name: '정교수', title: '연구실의 왕' },
    { name: '석학', title: '학계의 거목' },
    { name: '살아있는 교과서', title: '인류의 지성' },
  ];
  const LAST = TIERS.length - 1;

  // 3×3 부지. role: A 데이터 생산, B 회의실(논문화 용량), C 교수실(투고 용량), M 휴게실(분위기), V 자료실(연구비 배율)
  const ROOMS = [
    { id: 'office', name: '교수실', role: 'C', plot: [0, 0], tier: 1, build: 0, ucost: 20, cap: 3, note: '교수가 투고하고 과제를 따 온다' },
    { id: 'meeting', name: '회의실', role: 'B', plot: [1, 0], tier: 1, build: 0, ucost: 15, cap: 4, note: '데이터를 모아 논문으로 쓴다' },
    { id: 'lounge', name: '휴게실', role: 'M', plot: [2, 0], tier: 1, build: 0, ucost: 25, note: '학생들의 분위기를 지킨다' },
    { id: 'wetlab', name: '실험실', role: 'A', plot: [0, 1], tier: 1, build: 0, ucost: 10, rate: 1, note: '플라스크와 현미경이 있는 기본 실험실' },
    { id: 'server', name: '서버실', role: 'A', plot: [1, 1], tier: 2, build: 1500, ucost: 300, rate: 10, note: 'GPU 서버가 밤새 돈다' },
    { id: 'library', name: '자료실', role: 'V', plot: [0, 2], tier: 2, build: 3000, ucost: 600, note: '선행 연구를 모아 논문 가치를 높인다' },
    { id: 'clean', name: '클린룸', role: 'A', plot: [2, 1], tier: 3, build: 2e5, ucost: 3e4, rate: 110, note: '방진복을 입고 들어가는 정밀 실험실' },
    { id: 'bigequip', name: '대형 장비실', role: 'A', plot: [1, 2], tier: 4, build: 3e7, ucost: 4e6, rate: 1300, note: '전국에 몇 대 없는 장비' },
    { id: 'global', name: '국제 공동연구센터', role: 'A', plot: [2, 2], tier: 4, build: 6e8, ucost: 8e7, rate: 16000, note: '시차 덕분에 24시간 연구' },
  ];
  const MILESTONES = [10, 25, 50, 100]; // 생산 공간이 이 레벨에 닿으면 효율 2배

  const STUDENT_NAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송'];
  const GIVEN = ['민준', '서연', '도윤', '하은', '시우', '지유', '주원', '서윤', '예준', '지민', '현우', '수아', '건우', '채원', '우진', '다은', '선우', '유나'];
  const GRADES = ['학부연구생', '석사과정', '박사과정', '포닥'];

  const fmtUnits = [[1e24, '자'], [1e20, '해'], [1e16, '경'], [1e12, '조'], [1e8, '억'], [1e4, '만']];
  function fmt(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n);
    if (n < 10) return (Math.floor(n * 10) / 10).toString();
    if (n < 1e4) return Math.floor(n).toLocaleString('ko-KR');
    for (const [v, u] of fmtUnits) if (n >= v) { const x = n / v; return (x >= 1e4 ? x.toExponential(2) : x >= 100 ? Math.floor(x) : Math.floor(x * 10) / 10) + u; }
    return Math.floor(n).toString();
  }

  function rnd(st) {
    let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const note = (st, kind, text) => { st.notes.push({ kind, text }); if (st.notes.length > 30) st.notes.shift(); };

  // ---------- 새 게임 ----------
  function newGame(prev) {
    const keep = prev || {};
    const st = {
      v: 1, money: 60, fame: 0, totalMoney: 0, papers: 0, time: 0, tier: 1, ended: false,
      rooms: {}, students: [], buffs: [], cooldown: {}, notes: [], rng: (Math.random() * 2 ** 32) >>> 0,
      laurels: keep.laurels || 0, runs: keep.runs || 0, promotedAt: [{ tier: 1, time: 0 }],
    };
    ROOMS.forEach((r) => { st.rooms[r.id] = r.build === 0 ? 1 : 0; });
    hireFree(st); hireFree(st);
    return st;
  }
  function hireFree(st) {
    st.students.push({ name: STUDENT_NAMES[Math.floor(rnd(st) * STUDENT_NAMES.length)] + GIVEN[Math.floor(rnd(st) * GIVEN.length)], grade: 0 });
  }
  function migrate(st) {
    if (!st || typeof st !== 'object' || st.v !== 1) return null;
    const fresh = newGame({ laurels: st.laurels });
    Object.keys(fresh).forEach((k) => { if (st[k] === undefined) st[k] = fresh[k]; });
    ROOMS.forEach((r) => { if (typeof st.rooms[r.id] !== 'number') st.rooms[r.id] = r.build === 0 ? 1 : 0; });
    ['money', 'fame', 'time', 'totalMoney', 'papers'].forEach((k) => { if (typeof st[k] !== 'number' || !isFinite(st[k]) || st[k] < 0) st[k] = 0; });
    return st;
  }

  // ---------- 계산 ----------
  const room = (id) => ROOMS.find((r) => r.id === id);
  const lv = (st, id) => st.rooms[id] || 0;
  const unlocked = (st, id) => st.tier >= room(id).tier;
  const built = (st, id) => lv(st, id) > 0;
  const buffMult = (st, target) => st.buffs.filter((b) => b.until > st.time && (b.target === target || b.target === 'all')).reduce((a, b) => a * b.mult, 1);
  const seats = (st, id) => (built(st, id) ? Math.min(10, 2 + Math.floor(lv(st, id) / 5)) : 0);
  const producers = (st) => ROOMS.filter((r) => r.role === 'A' && built(st, r.id));
  const maxStudents = (st) => producers(st).reduce((a, r) => a + seats(st, r.id), 0);
  // 학생을 생산 공간에 순서대로 앉힌다(비싼 공간부터)
  function seating(st) {
    let left = st.students.length;
    const out = {};
    producers(st).slice().reverse().forEach((r) => { const n = Math.min(left, seats(st, r.id)); out[r.id] = n; left -= n; });
    return out;
  }
  const perStudent = (st, id) => room(id).rate * lv(st, id) * Math.pow(2, MILESTONES.filter((m) => lv(st, id) >= m).length);
  function stageA(st) {
    const s = seating(st);
    return producers(st).reduce((a, r) => a + perStudent(st, r.id) * (s[r.id] || 0) * buffMult(st, r.id), 0);
  }
  const capOf = (st, id) => room(id).cap * lv(st, id) * Math.pow(2, Math.floor(lv(st, id) / 10)) * Math.pow(1.6, st.tier - 1);
  const stageB = (st) => capOf(st, 'meeting') * buffMult(st, 'meeting');
  const stageC = (st) => capOf(st, 'office') * buffMult(st, 'office');
  const comfort = (st) => 3 + 2 * lv(st, 'lounge');
  const mood = (st) => Math.max(0.35, Math.min(1, 1 - 0.07 * (st.students.length - comfort(st))));
  const valueMult = (st) => Math.pow(CFG.tierValue, st.tier - 1) * (1 + CFG.libraryBonus * lv(st, 'library')) * (1 + CFG.laurelBonus * st.laurels);
  function flow(st) {
    const a = stageA(st), b = stageB(st), c = stageC(st), m = mood(st);
    const t = Math.min(a, b, c) * m;
    const bott = a <= b && a <= c ? 'A' : b <= c ? 'B' : 'C';
    return { a, b, c, mood: m, t, bott, money: t * valueMult(st) * buffMult(st, 'money'), fame: t * CFG.fameRate };
  }

  // ---------- 비용 ----------
  const upCost = (st, id) => {
    const r = room(id), l = lv(st, id);
    if (l === 0) return r.build;
    return Math.ceil(r.ucost * Math.pow(r.role === 'A' ? CFG.prodGrowth : CFG.stageGrowth, l - 1));
  };
  const hireCost = (st) => Math.ceil(CFG.hireBase * Math.pow(CFG.hireGrowth, st.students.length - 2));

  // ---------- 행동 ----------
  function tick(st, dt) {
    if (st.ended || !(dt > 0)) return;
    let left = dt;
    while (left > 0) {
      const ends = st.buffs.map((b) => b.until).filter((u) => u > st.time);
      const step = Math.min(left, ends.length ? Math.min(...ends) - st.time : left);
      const f = flow(st);
      st.money += f.money * step; st.totalMoney += f.money * step; st.fame += f.fame * step;
      st.papers += (f.t * step) / (40 * Math.pow(2, st.tier - 1));
      st.time += step; left -= step;
    }
    st.buffs = st.buffs.filter((b) => b.until > st.time);
  }
  function canUpgrade(st, id) {
    const r = room(id);
    if (!unlocked(st, id)) return TIERS[r.tier].name + '부터';
    if (lv(st, id) >= 200) return '최대';
    return st.money >= upCost(st, id) ? true : '연구비 부족';
  }
  function upgrade(st, id) {
    if (canUpgrade(st, id) !== true) return false;
    st.money -= upCost(st, id);
    const first = lv(st, id) === 0;
    st.rooms[id] = lv(st, id) + 1;
    if (first) note(st, 'build', room(id).name + ' 공사를 마쳤다!');
    else if (MILESTONES.includes(st.rooms[id]) && room(id).role === 'A') note(st, 'milestone', room(id).name + ' Lv ' + st.rooms[id] + ' 달성! 효율 2배');
    return true;
  }
  function canHire(st) {
    if (st.students.length >= maxStudents(st)) return '자리 부족';
    return st.money >= hireCost(st) ? true : '연구비 부족';
  }
  function hire(st) {
    if (canHire(st) !== true) return null;
    st.money -= hireCost(st);
    const g = Math.min(3, Math.floor(rnd(st) * (1 + st.tier)));
    const s = { name: STUDENT_NAMES[Math.floor(rnd(st) * STUDENT_NAMES.length)] + GIVEN[Math.floor(rnd(st) * GIVEN.length)], grade: g };
    st.students.push(s);
    note(st, 'hire', GRADES[g] + ' ' + s.name + ' 학생이 연구실에 들어왔다.');
    return s;
  }
  // 방 독려: 15초 동안 그 방 2배, 방마다 45초 쿨다운
  function encourage(st, id) {
    if (!built(st, id) || (st.cooldown[id] || 0) > st.time) return false;
    st.buffs.push({ target: id, mult: 2, until: st.time + 15, src: room(id).name + ' 독려' });
    st.cooldown[id] = st.time + 45;
    return true;
  }
  // 돌발 이벤트 (화면이 띄우고, 누르면 처리)
  const EVENTS = {
    deadline: { name: '마감 임박', text: '학회 마감이 내일이다! 회의실이 30초 동안 3배로 달린다.', apply: (st) => st.buffs.push({ target: 'meeting', mult: 3, until: st.time + 30, src: '마감 임박' }) },
    grant: { name: '과제 선정', text: '국가과제에 선정됐다! 연구비 1분 치를 바로 받는다.', apply: (st) => { const v = Math.max(flow(st).money * 60, 100); st.money += v; st.totalMoney += v; return v; } },
    audit: { name: '연구비 감사', text: '영수증을 정리했다. 감사를 무사히 넘겼다.', apply: () => 0, missed: (st) => st.buffs.push({ target: 'office', mult: 0.5, until: st.time + 60, src: '감사 대응' }) },
    conference: { name: '학회 시즌', text: '학회 발표가 호평을 받았다. 40초 동안 연구비 2배.', apply: (st) => st.buffs.push({ target: 'money', mult: 2, until: st.time + 40, src: '학회 시즌' }) },
  };
  function pickEvent(st) { const k = Object.keys(EVENTS); return k[Math.floor(rnd(st) * k.length)]; }
  function applyEvent(st, id) { const v = EVENTS[id].apply(st); note(st, 'event', EVENTS[id].text); return v; }
  function missEvent(st, id) { if (EVENTS[id].missed) { EVENTS[id].missed(st); note(st, 'event', '감사 대응을 놓쳤다. 1분 동안 교수실 속도가 절반.'); } }

  // ---------- 승진과 정년 ----------
  const nextNeed = (st) => (st.tier < LAST ? CFG.fameNeed[st.tier + 1] : Infinity);
  const canPromote = (st) => st.tier < LAST && st.fame >= nextNeed(st);
  function promote(st) {
    if (!canPromote(st)) return false;
    st.tier++; st.promotedAt.push({ tier: st.tier, time: st.time });
    if (st.tier === LAST) st.ended = true;
    return true;
  }
  const laurelReward = (st) => 3 + Math.min(5, Math.floor(Math.log10(Math.max(1, st.fame / CFG.fameNeed[LAST])) * 2));
  function retire(st) {
    if (!st.ended) return null;
    return newGame({ laurels: st.laurels + laurelReward(st), runs: st.runs + 1 });
  }

  // 앱을 닫아 둔 시간: 최대 8시간, 효율 50%
  function offline(st, seconds) {
    const raw = typeof seconds === 'number' && isFinite(seconds) ? seconds : 0;
    const s = Math.min(Math.max(0, raw), CFG.offlineCapH * 3600);
    const before = { money: st.totalMoney, fame: st.fame };
    if (s > 0 && !st.ended) {
      st.buffs = [];
      const f = flow(st);
      st.money += f.money * s * CFG.offlineEff; st.totalMoney += f.money * s * CFG.offlineEff;
      st.fame += f.fame * s * CFG.offlineEff; st.papers += (f.t * s * CFG.offlineEff) / (40 * Math.pow(2, st.tier - 1));
      st.time += s;
    }
    return { seconds: s, capped: raw > CFG.offlineCapH * 3600, money: st.totalMoney - before.money, fame: st.fame - before.fame };
  }

  return {
    CFG, TIERS, LAST, ROOMS, MILESTONES, GRADES, EVENTS, fmt,
    newGame, migrate, tick, flow, room, lv, unlocked, built, seats, seating, maxStudents, perStudent, capOf, comfort, mood, valueMult,
    upCost, hireCost, canUpgrade, upgrade, canHire, hire, encourage, pickEvent, applyEvent, missEvent,
    nextNeed, canPromote, promote, laurelReward, retire, offline, buffMult,
  };
});
