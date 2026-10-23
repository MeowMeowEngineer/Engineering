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
    paperBase: 36000, paperGrowth: 1.47, paperBonus: 0.03, tapShare: 0.05, tierProd: 1.5, tierTap: 1.5, century: 1e10,
    levelBonus: 0.03, expBase: 60, expGrowth: 1.2, tapExp: 0.5,
    offlineCapH: 8, offlineEff: 0.5, subCapH: 12, subEff: 1, petTps: 3, laurelBonus: 0.2, laurelBase: 3,
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
    { name: '살아있는 교과서', title: '인류의 지성' },
  ];
  const LAST = TIERS.length - 1;

  // 자동 생산원. tier 이상이 되면 고용·구매할 수 있다.
  const GENS = [
    { id: 'coffee', name: '커피 머신', note: '졸음을 데이터로 바꾼다', base: 15, rate: 0.1, tier: 1 },
    { id: 'intern', name: '학부연구생', note: '측정 셋업을 대신 해 준다', base: 100, rate: 1, tier: 1 },
    { id: 'junior', name: '후배 대학원생', note: '"선배, 이거 왜 안 돼요?"', base: 1100, rate: 8, tier: 2 },
    { id: 'vna', name: '공용 실험 장비', note: '예약표는 늘 꽉 차 있다', base: 12000, rate: 47, tier: 2 },
    { id: 'chamber', name: '전용 실험실', note: '예약 전쟁 없이 우리 랩 전용', base: 130000, rate: 260, tier: 3 },
    { id: 'agent', name: 'AI 코딩 에이전트', note: '가끔 엉뚱한 파일을 고친다', base: 1.4e6, rate: 1400, tier: 3 },
    { id: 'lecture', name: '출강 학교', note: '월수금은 A대, 화목은 B대', base: 6e6, rate: 3500, tier: 4 },
    { id: 'cluster', name: 'GPU 서버', note: '밤새 실험을 1,000번 돌린다', base: 2e7, rate: 7800, tier: 5 },
    { id: 'postdoc', name: '포닥 연구원', note: '내가 포닥일 때보다 일을 잘한다', base: 3.3e8, rate: 44000, tier: 5 },
    { id: 'consortium', name: '국제 공동연구단', note: '시차 덕분에 24시간 연구', base: 5.1e9, rate: 260000, tier: 6 },
    { id: 'telescope', name: '국가 대형 연구시설', note: '가속기·망원경·데이터센터 사용 시간을 따냈다', base: 7.5e10, rate: 1.6e6, tier: 7 },
    { id: 'institute', name: '석학 연구원', note: '이름을 딴 연구원이 생겼다', base: 1e12, rate: 4e7, tier: 8 },
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
    drink: { name: '에너지 드링크', cost: 20, desc: '가방에 1개 들어간다. 마시면 5분 동안 탭·자동 생산 2배' },
  };
  // 에너지 드링크: 가방에 쌓이는 소모품. 마시면 5분 동안 탭·자동 생산 2배, 겹쳐 마시면 시간만 늘어난다.
  const DRINK = { dur: 300, mult: 2, src: '에너지 드링크' };
  const AD_LIMITS = { total: 10, buff: 5, skill: 5 };

  // ---------- 월계관 영구 강화 ----------
  // 쓰지 않고 가진 월계관은 1개당 생산·탭 +20%. 쓰면 그만큼 보유 보너스가 줄어드는 대신 강화가 남는다.
  const LAUREL_UPS = {
    know: { name: '연구 노하우', desc: '자동 생산 +30%', max: 10, cost: (lv) => lv + 1 },
    finger: { name: '타자 장인', desc: '탭 +50%', max: 5, cost: (lv) => lv + 1 },
    jokbo: { name: '선배의 족보', desc: '논문 비용 -6%', max: 5, cost: (lv) => 2 * (lv + 1) },
    network: { name: '교수님 인맥', desc: '교수님 보상 +50%, 더 자주 지나감', max: 3, cost: (lv) => 2 * (lv + 1) },
    leave: { name: '휴학계', desc: '방치 보상 최대 시간 +2시간', max: 3, cost: (lv) => 2 * (lv + 1) },
    grant: { name: '과제 수주 노하우', desc: '국가과제 선정률 +5%p', max: 4, cost: (lv) => 2 * (lv + 1) },
    slot: { name: '연구실 확장', desc: '과제 슬롯 +1', max: 2, cost: (lv) => 5 * (lv + 1) },
    early: { name: '조기 진학', desc: '재입학 때 박사과정(논문 3편)부터 시작', max: 1, cost: () => 8 },
    honor: { name: '명예 교수 추대', desc: '엔딩 때 받는 월계관 +1', max: 3, cost: (lv) => 3 * (lv + 1) },
  };
  const upLv = (st, id) => (st.ups && st.ups[id]) || 0;

  // ---------- 과제 ----------
  // 산학과제는 계약이라 선정 확률 100%, 국가과제는 주관 기업 규모별로 선정률이 다르다.
  // 비용·보상은 시작 시점의 자동 생산 몇 분 치로 정하고, 끝나면 방치 중이라도 보상이 들어온다.
  const PROJECTS = [
    { id: 'i1', kind: '산학과제', grade: '중소기업', name: '시제품 성능 시험 대행', tier: 1, dur: 900, select: 1, costMin: 1, rewardMin: 5, coupons: 1, buff: 0.05 },
    { id: 'i2', kind: '산학과제', grade: '중견기업', name: '공정 데이터 분석 용역', tier: 3, dur: 3600, select: 1, costMin: 4, rewardMin: 25, coupons: 1, buff: 0.08 },
    { id: 'i3', kind: '산학과제', grade: '대기업', name: '산학 공동연구센터', tier: 5, dur: 14400, select: 1, costMin: 15, rewardMin: 96, coupons: 2, buff: 0.12 },
    { id: 'n1', kind: '국가과제', grade: '중소기업 주관', name: '스마트 센서 국산화', tier: 2, dur: 3600, select: 0.6, costMin: 5, rewardMin: 60, coupons: 1, buff: 0.1 },
    { id: 'n2', kind: '국가과제', grade: '중소기업 주관', name: '친환경 소재 개발', tier: 2, dur: 7200, select: 0.55, costMin: 8, rewardMin: 130, coupons: 2, buff: 0.1 },
    { id: 'n3', kind: '국가과제', grade: '중견기업 주관', name: '제조 AI 고도화', tier: 4, dur: 10800, select: 0.45, costMin: 15, rewardMin: 240, coupons: 3, buff: 0.15 },
    { id: 'n4', kind: '국가과제', grade: '중견기업 주관', name: '바이오 진단 키트 상용화', tier: 4, dur: 14400, select: 0.4, costMin: 20, rewardMin: 360, coupons: 3, buff: 0.15 },
    { id: 'n5', kind: '국가과제', grade: '대기업 주관', name: '차세대 반도체 원천기술', tier: 6, dur: 21600, select: 0.3, costMin: 40, rewardMin: 660, coupons: 4, buff: 0.2 },
    { id: 'n6', kind: '국가과제', grade: '대기업 주관', name: '탄소중립 에너지 플랫폼', tier: 7, dur: 28800, select: 0.25, costMin: 60, rewardMin: 960, coupons: 5, buff: 0.25 },
  ];
  const SLOTS = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4];
  const REJECT_NOTES = ['우수하나 사업 목적과 맞지 않음', '예산 규모 대비 성과 목표가 낮음', '선행 연구 실적 보완 필요', '경쟁 과제 대비 차별성 부족', '평가위원 의견: 그림이 너무 많음'];

  // ---------- 연차 ----------
  // 석사과정은 1~2년차, 박사과정은 1~4년차. 그 과정 안에서 쓴 논문 수로 오르고, 1년 오를 때마다 자동 생산 +10%.
  const YEARS = { 1: 2, 2: 4 };
  function yearOf(st) {
    const n = YEARS[st.tier]; if (!n) return 0;
    const from = CFG.needs[st.tier], to = CFG.needs[st.tier + 1];
    return Math.max(1, Math.min(n, 1 + Math.floor(((st.papers - from) * n) / Math.max(1, to - from))));
  }
  const yearMult = (st) => 1 + 0.1 * Math.max(0, yearOf(st) - 1);
  const rankName = (st) => TIERS[st.tier].name + (yearOf(st) ? ' ' + yearOf(st) + '년차' : '');
  const ATTEND = [5, 5, 10, 10, 15, 15, 30];

  // ---------- 랩실 도감 (수집형) ----------
  // 모든 항목은 플레이로만 얻는다(결제로 얻는 방법 없음). 재입학해도 유지된다.
  // 희귀도별 가중치: 일반 6, 희귀 3, 영웅 2, 전설 1. 도감 화면에 항목별 확률을 공개한다.
  // 영웅 등급은 아바타에만 있어서, 다른 도감의 확률은 영웅을 넣기 전과 같다.
  const RARITY = { c: { name: '일반', w: 6 }, r: { name: '희귀', w: 3 }, e: { name: '영웅', w: 2 }, l: { name: '전설', w: 1 } };
  const COLLECTION = {
    quotes: {
      name: '교수님 어록', source: '지나가는 교수님을 잡으면', chance: 0.6,
      each: '어록 1개당 탭 +2%', set: '교수님 보상 2배',
      items: [
        ['이거 그냥 하면 되잖아?', 'c'], ['다음 주까지 되지?', 'c'], ['데이터가 말해 주겠지.', 'c'], ['그 그림, 축 단위 어디 갔어?', 'c'],
        ['요즘 연구실에서 잘 안 보이던데?', 'c'], ['내가 학생 때는 이거 손으로 했어.', 'c'], ['논문은 엉덩이로 쓰는 거야.', 'c'], ['일단 돌려 봐.', 'c'],
        ['이 결과, 실험 다시 해 봤어?', 'r'], ['내일 아침 8시에 미팅하자.', 'r'], ['과제 제안서 그림 좀 부탁해.', 'r'], ['학회는 놀러 가는 데가 아니야.', 'r'], ['졸업은 논문이 말해 줄 거야.', 'r'],
        ['이번 결과 좋다. 수고했어.', 'l'], ['오늘은 일찍 들어가.', 'l'], ['이제 졸업해도 되겠다.', 'l'],
      ],
    },
    goods: {
      name: '학회 굿즈', source: '논문을 낼 때', chance: 0.2,
      each: '굿즈 1개당 자동 생산 +2%', set: '논문 비용 -10%',
      items: [
        ['학회 명찰', 'c'], ['학회 에코백', 'c'], ['기념 볼펜', 'c'], ['학회 수첩', 'c'], ['포스터 튜브', 'c'], ['로고 생수', 'c'],
        ['학회 텀블러', 'r'], ['로고 USB', 'r'], ['학회 티셔츠', 'r'], ['보조배터리', 'r'],
        ['최우수 논문상 상패', 'l'], ['기조연설자와 찍은 사진', 'l'],
      ],
    },
    topics: {
      name: '연구 주제', source: '그 주제로 논문 1·4·10편을 쓰면 별 1·2·3개', chance: 1,
      each: '별 1개당 자동 생산 +1%', set: '논문 1편당 생산 보너스 3% → 4%',
    },
    photos: {
      name: '직급 기념사진', source: '그 직급에 처음 오르면', chance: 1,
      each: '사진 1장당 경험치 +3%', set: '재입학할 때 커피 머신 10대·학부연구생 5대로 시작',
    },
    projects: {
      name: '과제 협약서', source: '그 과제를 처음 끝내면', chance: 1,
      each: '협약서 1장당 과제 보상 +5%', set: '과제 슬롯 +1',
    },
    avatar: {
      name: '아바타', source: '전직할 때마다 1개 확정, 5레벨마다 1개, 과제 완료 시 25%', chance: 1,
      each: '부위별 능력치 일반 2%·희귀 4%·영웅 8%·전설 15%', set: '부위를 다 모으면 그 능력치 +10%',
      items: [
        ['체크셔츠', 'c'], ['과티', 'c'], ['실험 가운', 'r'], ['니트 조끼', 'r'], ['정장', 'e'], ['학위복', 'l'],
        ['비니', 'c'], ['헤어밴드', 'r'], ['헤드폰', 'r'], ['학사모', 'l'],
        ['뿔테 안경', 'c'], ['마스크', 'c'], ['반창고', 'c'], ['블루라이트 안경', 'r'], ['선글라스', 'e'],
        ['거북목', 'c'], ['바른 자세', 'e'],
        ['텀블러', 'c'], ['음료 캔', 'c'], ['컵라면', 'r'], ['다육이 화분', 'r'], ['황금 키보드', 'l'],
      ],
    },
    // 상장·학회 발표는 논문을 낼 때 떨어지고, 직급이 높을수록 높은 등급이 잘 나온다(tierScaled).
    awards: {
      name: '상장·수상', source: '논문을 낼 때', chance: 0.15, tierScaled: true,
      each: '상장 1개당 논문 비용 -1%', set: '엔딩 때 받는 월계관 +1',
      items: [
        ['학과 공모전 장려상', 'c'], ['학과 공모전 우수상', 'c'], ['교내 학술대회 포스터상', 'c'], ['우수 조교상', 'c'],
        ['학과 공모전 최우수상', 'r'], ['Best Poster Award', 'r'], ['학회 우수 발표상', 'r'],
        ['학회장상', 'e'], ['Best Paper Award', 'e'], ['학회 논문지 우수 논문상', 'e'],
        ['장관상', 'l'], ['국제학회 최우수 논문상', 'l'],
      ],
    },
    talks: {
      name: '학회 발표 기록', source: '논문을 낼 때', chance: 0.25, tierScaled: true,
      each: '발표 1건당 교수님 보상 +3%', set: '교수님이 20% 더 자주 지나감',
      items: [
        ['국내학회 포스터 발표', 'c'], ['국내학회 구두 발표', 'c'], ['교내 세미나 발표', 'c'], ['연구실 저널클럽 발표', 'c'],
        ['국제학회 포스터 발표', 'r'], ['국제학회 구두 발표', 'r'], ['워크숍 패널 토론', 'r'],
        ['초청 강연', 'e'], ['튜토리얼 강연', 'e'], ['세션 좌장', 'e'],
        ['기조연설', 'l'], ['국제학회 기념 강연', 'l'],
      ],
    },
    scholar: {
      name: '장학생', source: '연차가 오르거나 전직할 때 70%', chance: 0.7, tierScaled: true,
      each: '장학금 1개당 자동 생산 +1%', set: '재입학할 때 에너지 드링크 3개',
      items: [
        ['학과 성적 장학금', 'c'], ['근로 장학금', 'c'], ['연구실 연구 장학생', 'c'], ['학회 참가 지원 장학생', 'c'],
        ['학과 연구 장학생', 'r'], ['학술 연구 지원 장학생', 'r'], ['산학 장학생', 'r'],
        ['국가 장학생', 'e'], ['해외 연수 장학생', 'e'],
        ['대통령급 과학장학생', 'l'], ['국외 박사과정 전액 장학생', 'l'],
      ],
    },
    cats: {
      name: '야옹 사진', source: '야옹과 1시간 이상 방치하고 돌아오면', chance: 1,
      each: '사진 1장당 방치 효율 +3%p', set: '방치 보상 최대 시간 +2시간',
      items: [
        ['키보드 위에서 낮잠', 'c'], ['택배 상자 속 야옹', 'c'], ['창밖 구경', 'c'], ['레이저 포인터 사냥', 'c'],
        ['따뜻한 서버 위에서 낮잠', 'r'], ['논문 출력물에 꾹꾹이', 'r'],
        ['실험실 탐험', 'l'], ['학위복 입은 야옹', 'l'],
      ],
    },
  };
  const TOPIC_STARS = [1, 4, 10];

  // ---------- 아바타 (부위별 능력치, 입으면 캐릭터 외형이 바뀐다) ----------
  // AVATAR_KEYS는 COLLECTION.avatar.items와 같은 순서다. key는 화면이 그림을 고를 때 쓴다.
  const AV_SLOTS = {
    top: { name: '상의', stat: 'prod', statName: '자동 생산', unit: '%' },
    head: { name: '머리', stat: 'tap', statName: '탭', unit: '%' },
    face: { name: '얼굴', stat: 'exp', statName: '경험치', unit: '%' },
    posture: { name: '자세', stat: 'offline', statName: '방치 효율', unit: '%p' },
    prop: { name: '책상 소품', stat: 'projReward', statName: '과제 보상', unit: '%' },
  };
  const AVATAR_KEYS = [
    ['top', 'check'], ['top', 'tee'], ['top', 'labcoat'], ['top', 'vest'], ['top', 'suit'], ['top', 'gown'],
    ['head', 'beanie'], ['head', 'band'], ['head', 'phones'], ['head', 'gradcap'],
    ['face', 'horn'], ['face', 'mask'], ['face', 'bandage'], ['face', 'blue'], ['face', 'sun'],
    ['posture', 'turtle'], ['posture', 'straight'],
    ['prop', 'tumbler'], ['prop', 'energy'], ['prop', 'ramen'], ['prop', 'plant'], ['prop', 'goldkb'],
  ];
  const AV_VALUE = { c: 0.02, r: 0.04, e: 0.08, l: 0.15 };
  const AV_PRICE = { c: 40, r: 80, e: 160, l: 320 }; // 커피 쿠폰으로 원하는 아이템을 골라서 산다(무작위 뽑기 없음)
  const AV_SET = 0.1;
  const DEFAULT_LOOK = () => ({ gender: 'm', top: -1, head: -1, face: -1, posture: -1, prop: -1 });

  const TOPICS = ['기후 변화 예측', '신약 후보 물질', '자율주행 인식', '차세대 배터리', '양자 컴퓨팅', '유전체 분석', '대규모 언어 모델', '신소재 합성', '뇌 신호 해석', '도시 교통 최적화'];
  const METHODS = ['설계', '실험적 검증', '대규모 데이터 분석', '머신러닝 기반 최적화', '이론적 고찰', '성능 개선', '시뮬레이션', '메타 분석'];
  const FINAL_TITLE = '모든 분야를 잇는 통합 이론';

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
      medals: keep.medals || 0, laurels: keep.laurels || 0, ups: keep.ups || {}, coupons: keep.coupons || 0, pet: !!keep.pet, bestTier: keep.bestTier || 1,
      life: keep.life || { runs: 0, papers: 0, projects: 0, bestRun: null }, projects: [], rank: keep.rank || { join: false, nick: '' },
      shop: keep.shop || { noAds: false, starter: false, subUntil: '', purchases: [] },
      daily: keep.daily || { day: '', streak: 0, claimed: '', ads: 0, adBuff: 0, adSkill: 0 },
      subActive: !!keep.subActive,
      col: keep.col || { quotes: {}, goods: {}, topics: {}, photos: { 1: true }, cats: {}, projects: {}, avatar: {}, awards: {}, talks: {}, scholar: {} },
      look: keep.look || DEFAULT_LOOK(), drinks: keep.drinks || 0,
    };
    GENS.forEach((g) => (st.gens[g.id] = 0));
    if (colSetDone(st, 'photos')) { st.gens.coffee = 10; st.gens.intern = 5; }
    if (prev && colSetDone(st, 'scholar')) st.drinks += 3;
    if (upLv(st, 'early')) { st.tier = 2; st.papers = CFG.needs[2]; st.promotedAt.push({ tier: 2, time: 0 }); st.col.photos[2] = true; }
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
    if (st.laurels === undefined) st.laurels = st.medals || 0;
    // 깨진 저장본: 객체·배열이어야 할 칸이 null이거나 숫자가 문자열이면 새 값으로 바꾼다
    const fresh0 = newGame({});
    Object.keys(fresh0).forEach((k) => { const a = fresh0[k], b = st[k]; if (b === undefined) return; if (a && typeof a === 'object' && (!b || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b))) st[k] = a; else if (typeof a === 'number' && typeof b !== 'number') st[k] = Number(b) >= 0 ? Number(b) : a; });
    const fresh = newGame({ medals: st.medals, laurels: st.laurels });
    Object.keys(fresh).forEach((k) => { if (st[k] === undefined) st[k] = fresh[k]; });
    GENS.forEach((g) => { if (typeof st.gens[g.id] !== 'number') st.gens[g.id] = 0; });
    ['data', 'total', 'time', 'exp'].forEach((k) => { if (typeof st[k] !== 'number' || !isFinite(st[k]) || st[k] < 0) st[k] = 0; });
    st.tier = Math.min(LAST, Math.max(1, st.tier | 0));
    (st.promotedAt || []).forEach((x) => { st.col.photos[x.tier] = true; });
    if (!st.col.projects) st.col.projects = {};
    ['avatar', 'awards', 'talks', 'scholar'].forEach((k) => { if (!st.col[k]) st.col[k] = {}; });
    if (typeof st.drinks !== 'number' || !(st.drinks >= 0)) st.drinks = 0;
    if (!st.look || typeof st.look !== 'object') st.look = DEFAULT_LOOK();
    Object.keys(DEFAULT_LOOK()).forEach((k) => { if (st.look[k] === undefined) st.look[k] = DEFAULT_LOOK()[k]; });
    if (st.look.gender !== 'f') st.look.gender = 'm';
    return st;
  }

  function rnd(st) {
    let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const note = (st, kind, text) => { st.notes.push({ kind, text }); if (st.notes.length > 30) st.notes.shift(); };

  // ---------- 도감 계산 ----------
  const colCount = (st, k) => {
    if (k === 'topics') return Object.values(st.col.topics).reduce((a, n) => a + TOPIC_STARS.filter((t) => n >= t).length, 0);
    if (k === 'photos') return Object.keys(st.col.photos).length;
    if (k === 'projects') return Object.keys(st.col.projects || {}).length;
    return Object.keys(st.col[k]).length;
  };
  const colTotal = (k) => (k === 'topics' ? TOPICS.length * 3 : k === 'photos' ? TIERS.length - 1 : k === 'projects' ? PROJECTS.length : COLLECTION[k].items.length);
  function colSetDone(st, k) { return colCount(st, k) >= colTotal(k); }
  // 아바타 부위별 능력치 합계: 가진 아이템의 등급 값 + 부위를 다 모으면 +10%
  function avatarStats(st) {
    const out = { prod: 0, tap: 0, exp: 0, offline: 0, projReward: 0 }, have = {}, all = {};
    const owned = (st.col && st.col.avatar) || {};
    AVATAR_KEYS.forEach(([slot], i) => {
      all[slot] = (all[slot] || 0) + 1;
      if (owned[i]) { have[slot] = (have[slot] || 0) + 1; out[AV_SLOTS[slot].stat] += AV_VALUE[COLLECTION.avatar.items[i][1]]; }
    });
    Object.keys(AV_SLOTS).forEach((slot) => { if (have[slot] === all[slot]) out[AV_SLOTS[slot].stat] += AV_SET; });
    return out;
  }
  const avSlotDone = (st, slot) => AVATAR_KEYS.every(([sl], i) => sl !== slot || !!st.col.avatar[i]);
  function colBonus(st) {
    const av = avatarStats(st);
    return {
      tap: 0.02 * colCount(st, 'quotes') + av.tap, prod: 0.02 * colCount(st, 'goods') + 0.01 * colCount(st, 'topics') + 0.01 * colCount(st, 'scholar') + av.prod,
      exp: 0.03 * colCount(st, 'photos') + av.exp, offline: 0.03 * colCount(st, 'cats') + av.offline, projReward: av.projReward,
      profMult: (colSetDone(st, 'quotes') ? 2 : 1) * (1 + 0.03 * colCount(st, 'talks')), profFreq: colSetDone(st, 'talks') ? 0.2 : 0,
      paperDiscount: Math.min(0.5, (colSetDone(st, 'goods') ? 0.1 : 0) + 0.01 * colCount(st, 'awards')),
      paperBonus: CFG.paperBonus + (colSetDone(st, 'topics') ? 0.01 : 0), capH: colSetDone(st, 'cats') ? 2 : 0,
    };
  }
  // 희귀도 가중치로 항목 하나를 뽑는다. 이미 가진 항목이면 커피 쿠폰 1개로 바꿔 준다.
  // 중복 보정: 중복이 PITY번 쌓이면 다음 드롭은 아직 없는 항목 중에서 확정으로 나온다.
  const PITY = 4;
  // 직급이 오를수록 희귀 +15%, 영웅 +30%, 전설 +50%씩 가중치가 커진다(tierScaled 도감만).
  const TIER_W = { c: 0, r: 0.15, e: 0.3, l: 0.5 };
  const weightOf = (k, rar, tier) => RARITY[rar].w * (COLLECTION[k].tierScaled ? 1 + TIER_W[rar] * ((tier || 1) - 1) : 1);
  function weightedPick(st, items, list, k) {
    const total = list.reduce((a, i) => a + weightOf(k, items[i][1], st.tier), 0);
    let r = rnd(st) * total;
    for (const i of list) { r -= weightOf(k, items[i][1], st.tier); if (r <= 0) return i; }
    return list[list.length - 1];
  }
  function dropItem(st, k) {
    const c = COLLECTION[k];
    if (rnd(st) >= c.chance) return null;
    const all = c.items.map((_, i) => i);
    const missing = all.filter((i) => !st.col[k][i]);
    if (!st.col.pity) st.col.pity = {};
    const pity = st.col.pity[k] || 0;
    const idx = pity >= PITY && missing.length ? weightedPick(st, c.items, missing, k) : weightedPick(st, c.items, all, k);
    const [name, rar] = c.items[idx];
    const isNew = !st.col[k][idx];
    st.col.pity[k] = isNew ? 0 : pity + 1;
    st.col[k][idx] = (st.col[k][idx] || 0) + 1;
    if (isNew) note(st, 'collect', '[' + c.name + '] ' + RARITY[rar].name + ' 「' + name + '」 수집! (' + colCount(st, k) + '/' + colTotal(k) + ')' + (colSetDone(st, k) ? ' 세트 완성: ' + c.set : ''));
    else { st.coupons += 1; note(st, 'dupe', '[' + c.name + '] 「' + name + '」 중복 → 커피 쿠폰 +1'); }
    return { k, idx, name, rar, isNew };
  }
  // 도감 화면용: 항목별 확률(%). 직급에 따라 바뀌는 도감은 tier(지금 직급) 기준.
  function dropRate(k, idx, tier) {
    const c = COLLECTION[k];
    const total = c.items.reduce((a, it) => a + weightOf(k, it[1], tier), 0);
    return c.chance * weightOf(k, c.items[idx][1], tier) / total * 100;
  }

  // ---------- 배율 ----------
  const buffMult = (st, kind) => st.buffs.filter((b) => b.kind === kind && b.until > st.time).reduce((a, b) => a * b.mult, 1);
  const milestoneMult = (n) => MILESTONES.filter((m) => n >= m).length;
  const genRate = (st, g) => g.rate * Math.pow(2, milestoneMult(st.gens[g.id]));
  const levelMult = (st) => 1 + CFG.levelBonus * st.lv;
  const laurelMult = (st) => 1 + CFG.laurelBonus * st.laurels;
  const projBuff = (st) => (st.projects || []).reduce((a, p) => a + p.buff, 0);
  function globalMult(st) {
    const cb = colBonus(st);
    return (1 + cb.paperBonus * st.papers) * Math.pow(CFG.tierProd, st.tier - 1) * yearMult(st) * laurelMult(st) * (1 + 0.3 * upLv(st, 'know')) * levelMult(st) * (1 + cb.prod) * (1 + projBuff(st));
  }
  function perSecBase(st) { return GENS.reduce((a, g) => a + st.gens[g.id] * genRate(st, g), 0) * globalMult(st); }
  function perSec(st) { return perSecBase(st) * buffMult(st, 'prod'); }
  function perTapBase(st) {
    const base = Math.pow(2, st.tapLv) * Math.pow(CFG.tierTap, st.tier - 1) * laurelMult(st) * (1 + 0.5 * upLv(st, 'finger')) * levelMult(st) * (1 + colBonus(st).tap);
    const share = st.tier >= 2 ? perSecBase(st) * CFG.tapShare : 0; // 박사과정부터 탭 1번에 초당 생산의 일부가 더해진다
    return base + share;
  }
  const perTap = (st) => perTapBase(st) * buffMult(st, 'tap');
  const petPerSec = (st) => (st.pet ? CFG.petTps * perTap(st) : 0);

  // ---------- 경험치 (방치해도 시간만큼 오른다) ----------
  const expNeed = (lv) => Math.ceil(CFG.expBase * Math.pow(CFG.expGrowth, lv));
  function addExp(st, v) {
    st.exp += v * (1 + colBonus(st).exp);
    while (st.exp >= expNeed(st.lv)) {
      st.exp -= expNeed(st.lv); st.lv++;
      if (st.lv % 10 === 0) { st.coupons += 5; note(st, 'level', '레벨 ' + st.lv + ' 달성! 커피 쿠폰 +5'); }
      else note(st, 'level', '레벨 업! Lv ' + st.lv + ' (생산·탭 +' + Math.round(CFG.levelBonus * 100 * st.lv) + '%)');
      if (st.lv % 5 === 0) { dropItem(st, 'avatar'); giveDrink(st, 1, '레벨 ' + st.lv); }
    }
  }

  // ---------- 비용 ----------
  const genCost = (st, id) => { const g = GENS.find((x) => x.id === id); return Math.ceil(g.base * Math.pow(GEN_GROWTH, st.gens[id])); };
  const tapCost = (st) => Math.ceil(50 * Math.pow(6, st.tapLv));
  // 첫 논문 몇 편은 할인해 초반 전직이 빨리 오게 한다(1편째 1/64 가격, 8편째부터 정가).
  const paperCost = (st) => Math.ceil(CFG.paperBase * Math.pow(CFG.paperGrowth, st.papers) * Math.min(1, Math.pow((st.papers + 1) / 8, 2)) * (1 - colBonus(st).paperDiscount) * (1 - 0.06 * upLv(st, 'jokbo')));
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
    checkProjects(st);
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
    const yearBefore = yearOf(st);
    st.data -= c; st.papers++; st.life.papers++;
    if (yearOf(st) > yearBefore) { note(st, 'year', jo(rankName(st), '으로', '로') + ' 진급했다! 자동 생산 +10%'); dropItem(st, 'scholar'); }
    const ti = Math.floor(rnd(st) * TOPICS.length);
    const title = TOPICS[ti] + '의 ' + METHODS[Math.floor(rnd(st) * METHODS.length)];
    st.paperTitles.push(title);
    const n = (st.col.topics[ti] || 0) + 1;
    st.col.topics[ti] = n;
    if (TOPIC_STARS.includes(n)) note(st, 'collect', '[연구 주제] 「' + TOPICS[ti] + '」 ★' + (TOPIC_STARS.indexOf(n) + 1) + ' (' + colCount(st, 'topics') + '/' + colTotal('topics') + ')');
    dropItem(st, 'goods'); dropItem(st, 'awards'); dropItem(st, 'talks');
    return title;
  }
  function canPromote(st) {
    if (st.tier >= LAST || st.papers < nextNeed(st)) return false;
    return st.tier + 1 < LAST || st.century;
  }
  function promote(st) {
    if (!canPromote(st)) return false;
    st.tier++; st.promotedAt.push({ tier: st.tier, time: st.time });
    dropItem(st, 'avatar'); dropItem(st, 'scholar'); giveDrink(st, 1, '전직 축하');
    if (!st.col.photos[st.tier]) { st.col.photos[st.tier] = true; note(st, 'collect', '[직급 기념사진] ' + TIERS[st.tier].name + ' (' + colCount(st, 'photos') + '/' + colTotal('photos') + ')'); }
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
  function setAuto(st, id, on) { if (st.tier < AUTOS[id].tier) return false; st.auto[id] = !!on; if (on) { st.autoEver = st.autoEver || {}; st.autoEver[id] = true; } return true; }
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
    const r = rnd(st), m = colBonus(st).profMult * (1 + 0.5 * upLv(st, 'network'));
    let out;
    if (r < 0.5) { const v = Math.max(perSec(st) * 60, perTap(st) * 30, 50) * m; earn(st, v); out = { kind: 'data', text: '교수님이 연구비를 풀었다! 데이터 +' + fmt(v) }; }
    else if (r < 0.8) { st.buffs.push({ kind: 'tap', mult: 7 * m, until: st.time + 20, src: '영감' }); out = { kind: 'tap', text: '교수님 한마디에 영감이 왔다. 20초 동안 탭 ' + +(7 * m).toFixed(1) + '배' }; }
    else { st.buffs.push({ kind: 'prod', mult: 5 * m, until: st.time + 20, src: '과제 선정' }); out = { kind: 'prod', text: '과제 선정 소식! 20초 동안 자동 생산 ' + +(5 * m).toFixed(1) + '배' }; }
    out.drop = dropItem(st, 'quotes');
    return out;
  }
  // 앱을 닫아 둔 시간의 보상. 100조각으로 나눠 계산해 자동 투고·고용과 레벨 업이 방치 중에도 일어난다.
  function offline(st, seconds) {
    const cb = colBonus(st);
    const cap = ((st.subActive ? CFG.subCapH : CFG.offlineCapH) + cb.capH + 2 * upLv(st, 'leave')) * 3600;
    const eff = Math.min(1, (st.subActive ? CFG.subEff : CFG.offlineEff) + cb.offline);
    const raw = typeof seconds === 'number' && isFinite(seconds) ? seconds : 0;
    const s = Math.min(Math.max(0, raw), cap);
    const before = { total: st.total, lv: st.lv, papers: st.papers, projects: st.life.projects };
    if (s > 0 && !st.ended) {
      const n = 100, dt = s / n;
      for (let i = 0; i < n; i++) {
        earn(st, (perSecBase(st) + (st.pet ? CFG.petTps * perTapBase(st) : 0)) * dt * eff);
        st.time += dt;
        addExp(st, dt + (st.pet ? CFG.petTps * CFG.tapExp * dt : 0));
        checkProjects(st);
        autoActions(st);
      }
      if (st.pet && s >= 3600) dropItem(st, 'cats');
      // 자리를 비운 동안 교수님이 2시간마다 다녀가며 어록을 남긴다(최대 4번)
      for (let i = 0; i < Math.min(4, Math.floor(s / 7200)); i++) dropItem(st, 'quotes');
      st.buffs = st.buffs.filter((b) => b.until > st.time); // 버프는 지워지지 않고, 자리를 비운 시간만큼 줄어든다
    }
    return { seconds: s, capH: cap / 3600, capped: raw > cap, eff, gain: st.total - before.total, levels: st.lv - before.lv, papers: st.papers - before.papers, projects: st.life.projects - before.projects };
  }

  // ---------- 과제 ----------
  const projSlots = (st) => SLOTS[st.tier] + upLv(st, 'slot') + (colSetDone(st, 'projects') ? 1 : 0);
  const projSelect = (st, p) => (p.select >= 1 ? 1 : Math.min(0.95, p.select + 0.05 * upLv(st, 'grant')));
  const projUnit = (st) => Math.max(perSecBase(st) / (1 + projBuff(st)), perTapBase(st) * 2, 1) * 60; // 자동 생산 1분 치(과제 보너스 제외)
  const projCost = (st, p) => Math.ceil(Math.max(50, projUnit(st) * p.costMin));
  const projReward = (st, p) => Math.ceil(Math.max(300, projUnit(st) * p.rewardMin) * (1 + 0.05 * colCount(st, 'projects') + colBonus(st).projReward));
  function projState(st, id) {
    const p = PROJECTS.find((x) => x.id === id);
    if (st.tier < p.tier) return TIERS[p.tier].name + '부터';
    if (st.projects.some((x) => x.id === id)) return '진행 중';
    if (st.projects.length >= projSlots(st)) return '슬롯 부족';
    if (st.data < projCost(st, p)) return '데이터 부족';
    return true;
  }
  // 제안서 제출(산학은 계약). 국가과제는 바로 선정 여부를 굴린다.
  function startProject(st, id) {
    if (st.ended || projState(st, id) !== true) return null;
    const p = PROJECTS.find((x) => x.id === id);
    st.data -= projCost(st, p);
    if (rnd(st) >= projSelect(st, p)) {
      const why = REJECT_NOTES[Math.floor(rnd(st) * REJECT_NOTES.length)];
      note(st, 'project', '[' + p.grade + '] 「' + p.name + '」 탈락. 평가 의견: ' + why);
      return { selected: false, why };
    }
    st.projects.push({ id, endAt: st.time + p.dur, reward: projReward(st, p), coupons: p.coupons, buff: p.buff });
    note(st, 'project', '[' + p.grade + '] 「' + p.name + '」 ' + (p.select >= 1 ? '계약' : '선정') + '! 진행 중 자동 생산 +' + Math.round(p.buff * 100) + '%');
    return { selected: true };
  }
  function checkProjects(st) {
    if (!st.projects || !st.projects.length) return;
    st.projects = st.projects.filter((x) => {
      if (x.endAt > st.time) return true;
      const p = PROJECTS.find((q) => q.id === x.id);
      const v = projReward(st, p); // 끝날 때의 생산 기준으로 준다(시작 때 정하면 그새 커진 생산에 묻힌다)
      earn(st, v); st.coupons += x.coupons; st.life.projects++;
      if (rnd(st) < 0.25) dropItem(st, 'avatar');
      giveDrink(st, 1, '과제 완료');
      note(st, 'project', '「' + p.name + '」 과제 완료! 데이터 +' + fmt(v) + ', 커피 쿠폰 +' + x.coupons);
      if (!st.col.projects[x.id]) { st.col.projects[x.id] = true; note(st, 'collect', '[과제 협약서] 「' + p.name + '」 (' + colCount(st, 'projects') + '/' + colTotal('projects') + ')' + (colSetDone(st, 'projects') ? ' 세트 완성: 과제 슬롯 +1' : '')); }
      return false;
    });
  }

  // ---------- 월계관과 재입학 ----------
  function laurelReward(st) {
    const extra = Math.min(5, Math.floor(Math.max(0, st.papers - CFG.needs[LAST]) / 5));
    const award = colSetDone(st, 'awards') ? 1 : 0;
    return { base: CFG.laurelBase, extra, honor: upLv(st, 'honor'), award, total: CFG.laurelBase + extra + upLv(st, 'honor') + award };
  }
  // 엔딩 후 재입학: 월계관을 받고 새 판을 연다. 평생 기록은 이어진다.
  function retire(st) {
    if (!st.ended) return null;
    const r = laurelReward(st);
    st.laurels += r.total; st.medals += r.total;
    st.life.runs++;
    // 진행 중이던 과제는 완료로 처리해 협약서와 실적을 남긴다(데이터 보상은 새 판에 넘기지 않음).
    (st.projects || []).forEach((x) => { st.life.projects++; st.col.projects[x.id] = true; });
    st.projects = [];
    if (st.life.bestRun == null || st.time < st.life.bestRun) st.life.bestRun = st.time;
    return newGame(st);
  }
  function buyUpgrade(st, id) {
    const u = LAUREL_UPS[id], lv = upLv(st, id);
    if (!u || lv >= u.max || st.laurels < u.cost(lv)) return false;
    st.laurels -= u.cost(lv); st.ups[id] = lv + 1; return true;
  }

  // ---------- 아바타 구매·장착 ----------
  function avPrice(idx) { return AV_PRICE[COLLECTION.avatar.items[idx][1]]; }
  function buyAvatar(st, idx) {
    const it = COLLECTION.avatar.items[idx];
    if (!it || st.col.avatar[idx] || st.coupons < avPrice(idx)) return false;
    st.coupons -= avPrice(idx); st.col.avatar[idx] = 1;
    note(st, 'collect', '[아바타] ' + RARITY[it[1]].name + ' 「' + it[0] + '」 구매! (' + colCount(st, 'avatar') + '/' + colTotal('avatar') + ')');
    return true;
  }
  // 가진 아이템을 입는다. 이미 입고 있으면 벗는다.
  function equip(st, idx) {
    if (!st.col.avatar[idx]) return false;
    const slot = AVATAR_KEYS[idx][0];
    st.look[slot] = st.look[slot] === idx ? -1 : idx;
    return true;
  }
  function setGender(st, g) { st.look.gender = g === 'f' ? 'f' : 'm'; return true; }

  // ---------- 랭킹 점수 ----------
  function colPct(st) {
    const keys = Object.keys(COLLECTION);
    return Math.floor((keys.reduce((a, k) => a + colCount(st, k), 0) / keys.reduce((a, k) => a + colTotal(k), 0)) * 100);
  }
  function scoreCard(st) {
    const card = { bestTier: st.bestTier, laurels: st.medals, colPct: colPct(st), projects: st.life.projects, papers: st.life.papers, runs: st.life.runs, bestRun: st.life.bestRun == null ? null : Math.round(st.life.bestRun) };
    card.score = card.bestTier * 100 + card.laurels * 50 + card.colPct * 5 + card.projects * 2 + Math.floor(card.papers / 2);
    return card;
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
  const attendDrink = (st) => [3, 7].includes(((Math.max(1, st.daily.streak) - 1) % 7) + 1);
  function claimAttend(st) {
    if (!attendReady(st)) return 0;
    const v = attendReward(st); st.coupons += v; st.daily.claimed = st.daily.day;
    if (attendDrink(st)) giveDrink(st, 1, '출석');
    return v;
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
    else if (kind === 'skill') { st.daily.adSkill++; giveDrink(st, 1, '광고 보상'); }
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
    if (id === 'drink') st.drinks++;
    return true;
  }
  function giveDrink(st, n, why) { st.drinks = (st.drinks || 0) + n; note(st, 'drink', '에너지 드링크 +' + n + ' (' + why + ') · 가방에 ' + st.drinks + '개'); }
  // 마시기: 이미 마신 효과가 남아 있으면 시간만 5분 늘린다
  function drink(st) {
    if (st.ended || !(st.drinks > 0)) return false;
    st.drinks--;
    const cur = st.buffs.filter((b) => b.src === DRINK.src && b.until > st.time);
    if (cur.length) cur.forEach((b) => { b.until += DRINK.dur; });
    else { st.buffs.push({ kind: 'tap', mult: DRINK.mult, until: st.time + DRINK.dur, src: DRINK.src }); st.buffs.push({ kind: 'prod', mult: DRINK.mult, until: st.time + DRINK.dur, src: DRINK.src }); }
    return true;
  }
  const spent = (st) => st.shop.purchases.reduce((a, p) => a + p.price, 0);

  // ---------- 실시간 가이드 ----------
  // 지금 먼저 할 일 하나를 고른다. ctx.prof: 화면에 교수님이 지나가는 중인지(화면이 알려 줌)
  const jo = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b); };
  const dur = (sec) => { const t = Math.max(1, Math.ceil(sec)); return t >= 3600 ? Math.floor(t / 3600) + '시간 ' + Math.round((t % 3600) / 60) + '분' : t >= 60 ? Math.round(t / 60) + '분' : t + '초'; };
  function guide(st, ctx) {
    const c = ctx || {}, ps = perSec(st);
    if (st.ended) return { kind: 'retire', text: '살아있는 교과서가 되었어요! 월계관을 받고 재입학하세요.' };
    if (st.taps < 10 && st.papers === 0) return { kind: 'tap', text: '대학원생을 탭해서 연구 데이터를 모으세요.' };
    if (canPromote(st)) return { kind: 'promote', text: '논문이 다 모였어요. ' + jo(TIERS[st.tier + 1].name, '으로', '로') + ' 전직하세요!' };
    if (c.prof) return { kind: 'prof', text: '교수님이 지나가요! 놓치기 전에 누르세요.' };
    if (st.tier === LAST - 1 && !st.century && st.papers >= CFG.needs[LAST]) {
      if (st.data >= CFG.century) return { kind: 'century', text: '세기의 연구를 완성할 수 있어요.' };
      return { kind: 'wait', text: '세기의 연구에 데이터 ' + fmt(CFG.century) + '이 필요해요' + (ps > 0 ? ' (약 ' + dur((CFG.century - st.data) / ps) + ')' : '') + '.' + (st.auto.hire ? ' 자동 고용을 잠시 끄면 더 빨리 모여요.' : '') };
    }
    const need = nextNeed(st), pc = paperCost(st);
    if (st.papers < need && st.data >= pc) return { kind: 'write', text: '논문을 쓸 수 있어요. 전직까지 ' + (need - st.papers) + '편 남았어요.' };
    // 논문이 곧이면(20초 안) 다른 데 쓰지 말고 기다리게 한다
    if (st.papers < need && ps > 0 && (pc - st.data) / ps <= 20) return { kind: 'wait', text: '곧 논문을 쓸 수 있어요 (약 ' + dur((pc - st.data) / ps) + '). 데이터를 아껴 두세요.' };
    if (attendReady(st)) return { kind: 'tab', tab: 'shop', text: '오늘 출석 보상(커피 쿠폰)을 받으세요.' };
    const AUTO_TXT = { paper: '후배가 데이터가 모이는 대로 논문을 내 줘요', hire: '데이터 절반 안에서 효율 좋은 동료·장비를 알아서 들여요' };
    const au = Object.keys(AUTOS).find((id) => st.tier >= AUTOS[id].tier && !st.auto[id] && !(st.autoEver && st.autoEver[id]));
    if (au) return { kind: 'auto', id: au, text: jo(AUTOS[au].name, '을', '를') + ' 켜면 ' + AUTO_TXT[au] + '.' };
    if (st.drinks > 0 && !st.buffs.some((b) => b.src === DRINK.src && b.until > st.time)) return { kind: 'drink', text: '에너지 드링크가 있어요. 마시면 5분 동안 2배예요.' };
    if (st.papers >= 1 && st.projects.length < projSlots(st) && PROJECTS.some((p) => projState(st, p.id) === true)) return { kind: 'tab', tab: 'proj', text: '과제 슬롯이 비었어요. 과제를 따 오세요.' };
    const best = GENS.filter((g) => genUnlocked(st, g.id)).map((g) => ({ g, c: genCost(st, g.id) })).sort((a, b) => genRate(st, b.g) / b.c - genRate(st, a.g) / a.c)[0];
    if (best && st.data >= best.c) return { kind: 'gen', id: best.g.id, text: jo(best.g.name, '을', '를') + (['intern', 'junior', 'postdoc'].includes(best.g.id) ? ' 뽑으세요' : ' 들이세요') + '. 지금 가장 효율이 좋아요.' };
    if (st.data >= tapCost(st)) { const t0 = perTapBase(st); st.tapLv++; const t1 = perTapBase(st); st.tapLv--; if (t1 / t0 > 1.3) return { kind: 'tapUp', text: '타자 속도를 올리면 탭이 ' + (t1 / t0).toFixed(1) + '배가 돼요.' }; }
    const sk = Object.keys(SKILLS).find((id) => skillReady(st, id));
    if (sk) return { kind: 'skill', id: sk, text: jo(SKILLS[sk].name, '을', '를') + ' 쓰면 ' + SKILLS[sk].desc + '예요.' };
    if (st.laurels > 0 && Object.keys(LAUREL_UPS).some((id) => upLv(st, id) < LAUREL_UPS[id].max && st.laurels >= LAUREL_UPS[id].cost(upLv(st, id)))) return { kind: 'tab', tab: 'laurel', text: '월계관으로 영구 강화를 살 수 있어요.' };
    if (st.papers < need && ps > 0) return { kind: 'wait', text: '다음 논문까지 데이터를 모으는 중 (약 ' + dur((pc - st.data) / ps) + '). 탭하면 더 빨라요.' };
    if (best && ps > 0) return { kind: 'wait', text: best.g.name + '까지 데이터를 모으는 중 (약 ' + dur((best.c - st.data) / ps) + ').' };
    return { kind: 'tap', text: '탭해서 데이터를 모으세요. 동료·장비를 들이면 자동으로 쌓여요.' };
  }

  return {
    CFG, TIERS, LAST, GENS, SKILLS, AUTOS, MILESTONES, PRODUCTS, COUPON_ITEMS, AD_LIMITS, ATTEND, fmt,
    COLLECTION, RARITY, TOPICS, TOPIC_STARS, PITY, AV_SLOTS, AVATAR_KEYS, AV_VALUE, AV_PRICE, AV_SET, SLOTS,
    avatarStats, avSlotDone, avPrice, buyAvatar, equip, setGender, DRINK, drink, giveDrink, attendDrink, LAUREL_UPS, PROJECTS, YEARS, upLv, laurelMult, projBuff, yearOf, rankName,
    projSlots, projSelect, projCost, projReward, projState, startProject, laurelReward, retire, buyUpgrade, colPct, scoreCard, colCount, colTotal, colSetDone, colBonus, dropRate,
    newGame, migrate, tick, tap, perSec, perSecBase, perTap, petPerSec, globalMult, genRate, genCost, tapCost, paperCost,
    nextTier, nextNeed, genUnlocked, expNeed, levelMult, buffMult,
    buyGen, buyTap, writePaper, canPromote, promote, buyCentury, skillReady, useSkill, setAuto, profReward, offline,
    refreshDay, attendReady, attendReward, claimAttend, adLeft, adReward, mockBuy, spendCoupon, spent, guide, jo, FINAL_TITLE,
  };
});
