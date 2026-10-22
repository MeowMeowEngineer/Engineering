// 대학원생 키우기 (클리커·방치형) 엔진. 화면과 분리해 브라우저(GradEngine 전역)와 Node(require) 양쪽에서 쓴다.
// 게임 시간은 st.time(초)으로만 흐르고, 실제 날짜가 필요한 출석·구독은 화면이 날짜 문자열(YYYY-MM-DD)을 넘겨준다.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 밸런스 조정값. sim.js가 이 값을 바꿔 가며 전직 속도를 맞춘다.
  const CFG = {
    needs: [0, 0, 3, 7, 11, 16, 22, 29, 37, 45], // 직급별 전직에 필요한 누적 논문 편수
    paperBase: 30000, paperGrowth: 1.45, paperBonus: 0.03, tierProd: 1.5, tierTap: 1.5, century: 1e10,
    levelBonus: 0.03, expBase: 60, expGrowth: 1.2, tapExp: 0.5,
    offlineCapH: 8, offlineEff: 0.5, subCapH: 12, subEff: 1, petTps: 3,
  };

  const TIERS = [
    null,
    { name: '석사과정', title: '랩실 막내' },
    { name: '박사과정', title: '연구실 고인물' },
    { name: '포닥', title: '떠돌이 연구자' },
    { name: '시간강사', title: '보따리 장수' },
    { name: '조교수', title: '테뉴어 수험생' },
    { name: '부교수', title: '중견 연구자' },
    { name: '정교수', title: '연구실의 왕' },
    { name: '석학', title: '학계의 거목' },
    { name: '아인슈타인급', title: '인류의 지성' },
  ];
  const LAST = TIERS.length - 1;

  // 자동 생산원. tier 이상이 되면 고용·구매할 수 있다.
  const GENS = [
    { id: 'coffee', name: '커피 머신', note: '졸음을 데이터로 바꾼다', base: 15, rate: 0.1, tier: 1 },
    { id: 'intern', name: '학부연구생', note: '측정 셋업을 대신 해 준다', base: 100, rate: 1, tier: 1 },
    { id: 'junior', name: '후배 대학원생', note: '"선배, 이거 왜 안 돼요?"', base: 1100, rate: 8, tier: 2 },
    { id: 'vna', name: 'VNA', note: '벡터 네트워크 분석기. 교정 키트는 자주 사라진다', base: 12000, rate: 47, tier: 2 },
    { id: 'chamber', name: '무향실', note: '예약 전쟁 없이 우리 랩 전용', base: 130000, rate: 260, tier: 3 },
    { id: 'agent', name: 'AI 코딩 에이전트', note: '가끔 엉뚱한 파일을 고친다', base: 1.4e6, rate: 1400, tier: 3 },
    { id: 'lecture', name: '출강 학교', note: '월수금은 A대, 화목은 B대', base: 6e6, rate: 3500, tier: 4 },
    { id: 'cluster', name: 'EM 해석 클러스터', note: '밤새 1,000건을 돌린다', base: 2e7, rate: 7800, tier: 5 },
    { id: 'postdoc', name: '포닥 연구원', note: '내가 포닥일 때보다 일을 잘한다', base: 3.3e8, rate: 44000, tier: 5 },
    { id: 'consortium', name: '국제 공동연구단', note: '시차 덕분에 24시간 연구', base: 5.1e9, rate: 260000, tier: 6 },
    { id: 'telescope', name: '전파망원경 배열', note: '우주에서 오는 데이터', base: 7.5e10, rate: 1.6e6, tier: 7 },
    { id: 'institute', name: '석학 연구원', note: '이름을 딴 연구원이 생겼다', base: 1e12, rate: 1e7, tier: 8 },
  ];
  const GEN_GROWTH = 1.15;
  const MILESTONES = [10, 25, 50, 100]; // 이만큼 보유하면 그 생산원 효율 2배

  const SKILLS = {
    night: { name: '밤샘', desc: '30초 동안 탭 데이터 10배', dur: 30, cd: 300, tier: 1 },
    deadline: { name: '마감 버프', desc: '30초 동안 자동 생산 3배', dur: 30, cd: 600, tier: 2 },
  };
  const AUTOS = {
    paper: { name: '자동 투고', desc: '후배가 데이터가 모이는 대로 논문을 낸다', tier: 2 },
    hire: { name: '자동 고용', desc: '데이터 절반 안에서 효율 좋은 동료·장비를 들인다', tier: 3 },
  };

  // ---------- BM: 가상 결제 상품, 쿠폰 사용처, 광고 보상 ----------
  const PRODUCTS = {
    starter: { name: '신입생 패키지', price: 1200, once: true, desc: '커피 쿠폰 100 + 야옹(자동 탭)' },
    noads: { name: '광고 제거', price: 4400, once: true, desc: '광고 없이 광고 보상을 바로 받는다' },
    sub: { name: '연구실 정기구독 (30일)', price: 5500, desc: '매일 쿠폰 20, 방치 보상 100%·최대 12시간' },
    c60: { name: '커피 쿠폰 60', price: 1200, desc: '' },
    c330: { name: '커피 쿠폰 330', price: 5900, desc: '10% 더' },
    c700: { name: '커피 쿠폰 700', price: 12000, desc: '17% 더' },
  };
  const COUPON_ITEMS = {
    warp: { name: '시간 가속', cost: 30, desc: '자동 생산 2시간 치를 바로 받는다' },
    pet: { name: '야옹 입양', cost: 150, desc: '야옹이 1초에 3번 대신 탭한다 (방치 중에도)' },
  };
  const AD_LIMITS = { total: 10, buff: 5, skill: 5 };
  const ATTEND = [5, 5, 10, 10, 15, 15, 30];

  const TOPICS = ['벽 투과 FMCW 레이다', '광각 위상배열 안테나', '저손실 동축 케이블', '렌즈 배열 안테나', '메타표면 반사판', '이중편파 분산형 레이다', '밀리미터파 빔포밍', '무선 전력 전송 코일', '도파관 필터', '레이다 거리 빈 선택'];
  const METHODS = ['설계', '측정', '해석', '머신러닝 기반 최적화', '소형화', '실험적 검증', '오차 보정', '성능 개선'];
  const FINAL_TITLE = '전자기파와 시공간 곡률의 통합 이론';

  const fmtUnits = [[1e44, '재'], [1e40, '정'], [1e36, '간'], [1e32, '구'], [1e28, '양'], [1e24, '자'], [1e20, '해'], [1e16, '경'], [1e12, '조'], [1e8, '억'], [1e4, '만']];
  function fmt(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n);
    if (n < 10) return (Math.floor(n * 10) / 10).toString();
    if (n < 1e4) return Math.floor(n).toLocaleString('ko-KR');
    for (const [v, u] of fmtUnits) if (n >= v) { const x = n / v; return (x >= 1e4 ? x.toExponential(2) : x >= 100 ? Math.floor(x) : Math.floor(x * 10) / 10) + u; }
    return Math.floor(n).toString();
  }

  // ---------- 새 게임과 세이브 변환 ----------
  // prev를 넘기면 재입학: 메달·쿠폰·구매 내역·야옹·출석은 이어진다.
  function newGame(prev) {
    const keep = prev || {};
    const st = {
      v: 2, data: 0, total: 0, taps: 0, tapLv: 0, gens: {}, papers: 0, paperTitles: [], tier: 1,
      time: 0, skills: { night: 0, deadline: 0 }, buffs: [], century: false, ended: false,
      promotedAt: [{ tier: 1, time: 0 }], rng: (Math.random() * 2 ** 32) >>> 0,
      exp: 0, lv: 0, auto: { paper: false, hire: false }, notes: [],
      medals: keep.medals || 0, coupons: keep.coupons || 0, pet: !!keep.pet, bestTier: keep.bestTier || 1,
      shop: keep.shop || { noAds: false, starter: false, subUntil: '', purchases: [] },
      daily: keep.daily || { day: '', streak: 0, claimed: '', ads: 0, adBuff: 0, adSkill: 0 },
      subActive: !!keep.subActive,
    };
    GENS.forEach((g) => (st.gens[g.id] = 0));
    return st;
  }
  // 저장본을 현재 구조로 맞춘다. 알 수 없는 저장본이면 null.
  function migrate(st) {
    if (!st || typeof st !== 'object') return null;
    if (st.v === 1) {
      // v1은 8단계(시간강사 없음). 조교수 이상은 한 칸씩 밀린다.
      const shift = (t) => (t >= 4 ? t + 1 : t);
      st.tier = shift(st.tier);
      st.promotedAt = (st.promotedAt || []).map((p) => ({ tier: shift(p.tier), time: p.time }));
      st.bestTier = st.tier;
      st.v = 2;
    }
    if (st.v !== 2) return null;
    const fresh = newGame({ medals: st.medals });
    Object.keys(fresh).forEach((k) => { if (st[k] === undefined) st[k] = fresh[k]; });
    GENS.forEach((g) => { if (typeof st.gens[g.id] !== 'number') st.gens[g.id] = 0; });
    ['data', 'total', 'time', 'exp'].forEach((k) => { if (typeof st[k] !== 'number' || !isFinite(st[k]) || st[k] < 0) st[k] = 0; });
    st.tier = Math.min(LAST, Math.max(1, st.tier | 0));
    return st;
  }

  function rnd(st) {
    let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const note = (st, kind, text) => { st.notes.push({ kind, text }); if (st.notes.length > 30) st.notes.shift(); };

  // ---------- 배율 ----------
  const buffMult = (st, kind) => st.buffs.filter((b) => b.kind === kind && b.until > st.time).reduce((a, b) => a * b.mult, 1);
  const milestoneMult = (n) => MILESTONES.filter((m) => n >= m).length;
  const genRate = (st, g) => g.rate * Math.pow(2, milestoneMult(st.gens[g.id]));
  const levelMult = (st) => 1 + CFG.levelBonus * st.lv;
  function globalMult(st) {
    return (1 + CFG.paperBonus * st.papers) * Math.pow(CFG.tierProd, st.tier - 1) * (1 + 0.5 * st.medals) * levelMult(st);
  }
  function perSecBase(st) { return GENS.reduce((a, g) => a + st.gens[g.id] * genRate(st, g), 0) * globalMult(st); }
  function perSec(st) { return perSecBase(st) * buffMult(st, 'prod'); }
  function perTapBase(st) {
    const base = Math.pow(2, st.tapLv) * Math.pow(CFG.tierTap, st.tier - 1) * (1 + 0.5 * st.medals) * levelMult(st);
    const share = st.tier >= 3 ? perSecBase(st) * 0.02 : 0; // 포닥부터 탭 1번에 초당 생산의 2%가 더해진다
    return base + share;
  }
  const perTap = (st) => perTapBase(st) * buffMult(st, 'tap');
  const petPerSec = (st) => (st.pet ? CFG.petTps * perTap(st) : 0);

  // ---------- 경험치 (방치해도 시간만큼 오른다) ----------
  const expNeed = (lv) => Math.ceil(CFG.expBase * Math.pow(CFG.expGrowth, lv));
  function addExp(st, v) {
    st.exp += v;
    while (st.exp >= expNeed(st.lv)) {
      st.exp -= expNeed(st.lv); st.lv++;
      if (st.lv % 10 === 0) { st.coupons += 5; note(st, 'level', '레벨 ' + st.lv + ' 달성! 커피 쿠폰 +5'); }
      else note(st, 'level', '레벨 업! Lv ' + st.lv + ' (생산·탭 +' + Math.round(CFG.levelBonus * 100 * st.lv) + '%)');
    }
  }

  // ---------- 비용 ----------
  const genCost = (st, id) => { const g = GENS.find((x) => x.id === id); return Math.ceil(g.base * Math.pow(GEN_GROWTH, st.gens[id])); };
  const tapCost = (st) => Math.ceil(50 * Math.pow(6, st.tapLv));
  // 첫 논문 몇 편은 할인해 초반 전직이 빨리 오게 한다(1편째 1/64 가격, 8편째부터 정가).
  const paperCost = (st) => Math.ceil(CFG.paperBase * Math.pow(CFG.paperGrowth, st.papers) * Math.min(1, Math.pow((st.papers + 1) / 8, 2)));
  const nextTier = (st) => (st.tier < LAST ? TIERS[st.tier + 1] : null);
  const nextNeed = (st) => (st.tier < LAST ? CFG.needs[st.tier + 1] : Infinity);

  // ---------- 행동 ----------
  function earn(st, v) { st.data += v; st.total += v; }
  function tick(st, dt) {
    if (st.ended || !(dt > 0)) return;
    // 버프 경계에서 나눠 계산해, 큰 dt에서도 버프 시간만큼만 배율이 붙는다.
    let left = dt;
    while (left > 0) {
      const ends = st.buffs.map((b) => b.until).filter((u) => u > st.time);
      const step = Math.min(left, ends.length ? Math.min(...ends) - st.time : left);
      earn(st, (perSec(st) + petPerSec(st)) * step);
      st.time += step; left -= step;
    }
    st.buffs = st.buffs.filter((b) => b.until > st.time);
    addExp(st, dt + (st.pet ? CFG.petTps * CFG.tapExp * dt : 0));
    autoActions(st);
  }
  function tap(st) { if (st.ended) return 0; const v = perTap(st); earn(st, v); st.taps++; addExp(st, CFG.tapExp); return v; }
  function genUnlocked(st, id) { return st.tier >= GENS.find((g) => g.id === id).tier; }
  function buyGen(st, id) {
    if (!genUnlocked(st, id)) return false;
    const c = genCost(st, id); if (st.data < c) return false;
    st.data -= c; st.gens[id]++; return true;
  }
  function buyTap(st) { const c = tapCost(st); if (st.data < c) return false; st.data -= c; st.tapLv++; return true; }
  function writePaper(st) {
    if (st.ended) return null;
    const c = paperCost(st); if (st.data < c) return null;
    st.data -= c; st.papers++;
    const title = TOPICS[Math.floor(rnd(st) * TOPICS.length)] + '의 ' + METHODS[Math.floor(rnd(st) * METHODS.length)];
    st.paperTitles.push(title);
    return title;
  }
  function canPromote(st) {
    if (st.tier >= LAST || st.papers < nextNeed(st)) return false;
    return st.tier + 1 < LAST || st.century;
  }
  function promote(st) {
    if (!canPromote(st)) return false;
    st.tier++; st.promotedAt.push({ tier: st.tier, time: st.time });
    if (st.tier > st.bestTier) { st.bestTier = st.tier; st.coupons += 10; note(st, 'coupon', '처음 오른 직급이라 커피 쿠폰 +10'); }
    if (st.tier === LAST) st.ended = true;
    return true;
  }
  function buyCentury(st) {
    if (st.tier !== LAST - 1 || st.century || st.papers < CFG.needs[LAST] || st.data < CFG.century) return false;
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
  function setAuto(st, id, on) { if (st.tier < AUTOS[id].tier) return false; st.auto[id] = !!on; return true; }
  // 자동 투고와 자동 고용. 매 틱과 방치 계산 중에 부른다.
  function autoActions(st) {
    if (st.ended) return;
    if (st.auto.paper && st.tier >= AUTOS.paper.tier) {
      for (let i = 0; i < 20; i++) {
        const need = st.papers < nextNeed(st) ? 1 : 3; // 전직에 필요한 만큼은 바로, 그 뒤로는 여유 있을 때만
        if (st.data < paperCost(st) * need) break;
        const t = writePaper(st); if (t) note(st, 'paper', '후배가 대신 투고했다: 「' + t + '」');
      }
    }
    if (st.auto.hire && st.tier >= AUTOS.hire.tier) {
      for (let i = 0; i < 40; i++) {
        const best = GENS.filter((g) => genUnlocked(st, g.id)).map((g) => ({ g, c: genCost(st, g.id) })).sort((a, b) => b.g.rate / b.c - a.g.rate / a.c)[0];
        if (!best || best.c > st.data * 0.5) break;
        buyGen(st, best.g.id);
      }
    }
  }
  // 화면에 가끔 지나가는 교수님을 누르면 받는 보상 (거지키우기의 보물 거지 자리)
  function profReward(st) {
    const r = rnd(st);
    if (r < 0.5) { const v = Math.max(perSec(st) * 60, perTap(st) * 30, 50); earn(st, v); return { kind: 'data', text: '교수님이 연구비를 풀었다! 데이터 +' + fmt(v) }; }
    if (r < 0.8) { st.buffs.push({ kind: 'tap', mult: 7, until: st.time + 20, src: '영감' }); return { kind: 'tap', text: '교수님 한마디에 영감이 왔다. 20초 동안 탭 7배' }; }
    st.buffs.push({ kind: 'prod', mult: 5, until: st.time + 20, src: '과제 선정' }); return { kind: 'prod', text: '과제 선정 소식! 20초 동안 자동 생산 5배' };
  }
  // 앱을 닫아 둔 시간의 보상. 100조각으로 나눠 계산해 자동 투고·고용과 레벨 업이 방치 중에도 일어난다.
  function offline(st, seconds) {
    const cap = (st.subActive ? CFG.subCapH : CFG.offlineCapH) * 3600;
    const eff = st.subActive ? CFG.subEff : CFG.offlineEff;
    const raw = typeof seconds === 'number' && isFinite(seconds) ? seconds : 0;
    const s = Math.min(Math.max(0, raw), cap);
    const before = { total: st.total, lv: st.lv, papers: st.papers };
    if (s > 0 && !st.ended) {
      st.buffs = [];
      const n = 100, dt = s / n;
      for (let i = 0; i < n; i++) {
        earn(st, (perSecBase(st) + (st.pet ? CFG.petTps * perTapBase(st) : 0)) * dt * eff);
        st.time += dt;
        addExp(st, dt + (st.pet ? CFG.petTps * CFG.tapExp * dt : 0));
        autoActions(st);
      }
    }
    return { seconds: s, capped: raw > cap, eff, gain: st.total - before.total, levels: st.lv - before.lv, papers: st.papers - before.papers };
  }

  // ---------- BM ----------
  function refreshDay(st, today, yesterday) {
    if (st.daily.day !== today) {
      st.daily.streak = st.daily.day === yesterday ? st.daily.streak + 1 : 1;
      st.daily.day = today; st.daily.ads = 0; st.daily.adBuff = 0; st.daily.adSkill = 0;
    }
    st.subActive = !!st.shop.subUntil && today <= st.shop.subUntil;
  }
  const attendReady = (st) => !!st.daily.day && st.daily.claimed !== st.daily.day;
  const attendReward = (st) => ATTEND[(Math.max(1, st.daily.streak) - 1) % 7] + (st.subActive ? 20 : 0);
  function claimAttend(st) {
    if (!attendReady(st)) return 0;
    const v = attendReward(st); st.coupons += v; st.daily.claimed = st.daily.day; return v;
  }
  function adLeft(st, kind) {
    const total = AD_LIMITS.total - st.daily.ads;
    if (kind === 'buff') return Math.min(total, AD_LIMITS.buff - st.daily.adBuff);
    if (kind === 'skill') return Math.min(total, AD_LIMITS.skill - st.daily.adSkill);
    return total;
  }
  // 광고 보상. 광고 제거를 산 사람은 화면이 광고를 건너뛰고 바로 부른다. payload는 방치 보상 2배 때 더 줄 양.
  function adReward(st, kind, payload) {
    if (adLeft(st, kind) <= 0) return false;
    st.daily.ads++;
    if (kind === 'buff') { st.daily.adBuff++; st.buffs.push({ kind: 'prod', mult: 2, until: st.time + 1800, src: '연구 지원금' }); }
    else if (kind === 'skill') { st.daily.adSkill++; st.skills.night = st.time; st.skills.deadline = st.time; }
    else if (kind === 'offline') earn(st, payload || 0);
    return true;
  }
  function mockBuy(st, sku, today, subEnd) {
    const p = PRODUCTS[sku]; if (!p) return false;
    if (sku === 'starter' && st.shop.starter) return false;
    if (sku === 'noads' && st.shop.noAds) return false;
    if (sku === 'starter') { st.shop.starter = true; st.coupons += 100; st.pet = true; }
    else if (sku === 'noads') st.shop.noAds = true;
    else if (sku === 'sub') { st.shop.subUntil = subEnd; st.subActive = true; }
    else st.coupons += { c60: 60, c330: 330, c700: 700 }[sku];
    st.shop.purchases.push({ sku, price: p.price, day: today });
    return true;
  }
  function spendCoupon(st, id) {
    const it = COUPON_ITEMS[id]; if (!it || st.coupons < it.cost) return false;
    if (id === 'pet' && st.pet) return false;
    st.coupons -= it.cost;
    if (id === 'warp') earn(st, perSecBase(st) * 7200);
    if (id === 'pet') st.pet = true;
    return true;
  }
  const spent = (st) => st.shop.purchases.reduce((a, p) => a + p.price, 0);

  return {
    CFG, TIERS, LAST, GENS, SKILLS, AUTOS, MILESTONES, PRODUCTS, COUPON_ITEMS, AD_LIMITS, ATTEND, fmt,
    newGame, migrate, tick, tap, perSec, perSecBase, perTap, petPerSec, globalMult, genRate, genCost, tapCost, paperCost,
    nextTier, nextNeed, genUnlocked, expNeed, levelMult, buffMult,
    buyGen, buyTap, writePaper, canPromote, promote, buyCentury, skillReady, useSkill, setAuto, profReward, offline,
    refreshDay, attendReady, attendReward, claimAttend, adLeft, adReward, mockBuy, spendCoupon, spent,
  };
});
