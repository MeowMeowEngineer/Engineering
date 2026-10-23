// 랩실 운영하기 (타이쿤) 엔진. 화면과 분리해 브라우저(LabEngine 전역)와 Node(require) 양쪽에서 쓴다.
// 흐름: 연구 공간(데이터 생산) → 회의실(논문화) → 교수실(투고·과제) → 연구비·명성. 가장 느린 단계가 전체 속도를 정한다.
// 업그레이드 구조는 방치형 타이쿤과 화이트아웃 서바이벌에서 가져왔다(README.md 참조):
//   대학 본관(클래시 오브 클랜의 마을회관처럼 교수실 레벨 한계를 정함), 교수실 레벨 제한, 방별 가구·장비 5종, 스타 연구원 카드, 학과 연구,
//   대공사 시간·대기열, 일일 미션, 컨소시엄(연맹) 기술·도움·주간 목표.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 밸런스 조정값. sim.js가 이 값을 바꿔 가며 승진 속도를 맞춘다.
  const CFG = {
    fameNeed: [0, 0, 1e3, 3e5, 6e7, 1.2e10], // 직급별 승진에 필요한 누적 명성
    tierValue: 2.5, fameRate: 0.1,
    prodGrowth: 1.14, stageGrowth: 1.16, hireBase: 30, hireGrowth: 1.32,
    offlineCapH: 8, offlineEff: 0.5, laurelBonus: 0.25, libraryBonus: 0.05,
    officeGate: 10, // 다른 방은 교수실 레벨 + 이 값까지
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
  // buildSec: 처음 공사에 걸리는 시간
  const ROOMS = [
    { id: 'office', name: '교수실', role: 'C', plot: [0, 0], tier: 1, build: 0, ucost: 20, cap: 3, buildSec: 0, note: '교수가 투고하고 과제를 따 온다. 다른 방의 최대 레벨을 정한다' },
    { id: 'meeting', name: '회의실', role: 'B', plot: [1, 0], tier: 1, build: 0, ucost: 15, cap: 4, buildSec: 0, note: '데이터를 모아 논문으로 쓴다' },
    { id: 'lounge', name: '휴게실', role: 'M', plot: [2, 0], tier: 1, build: 0, ucost: 25, buildSec: 0, note: '학생들의 분위기를 지킨다' },
    { id: 'wetlab', name: '실험실', role: 'A', plot: [0, 1], tier: 1, build: 0, ucost: 10, rate: 1, buildSec: 0, note: '플라스크와 현미경이 있는 기본 실험실' },
    { id: 'server', name: '서버실', role: 'A', plot: [1, 1], tier: 2, build: 1500, ucost: 300, rate: 10, buildSec: 90, note: 'GPU 서버가 밤새 돈다' },
    { id: 'library', name: '자료실', role: 'V', plot: [0, 2], tier: 2, build: 3000, ucost: 600, buildSec: 120, note: '선행 연구를 모아 논문 가치를 높인다' },
    { id: 'clean', name: '클린룸', role: 'A', plot: [2, 1], tier: 3, build: 2e5, ucost: 3e4, rate: 110, buildSec: 300, note: '방진복을 입고 들어가는 정밀 실험실' },
    { id: 'bigequip', name: '대형 장비실', role: 'A', plot: [1, 2], tier: 4, build: 3e7, ucost: 4e6, rate: 1300, buildSec: 600, note: '전국에 몇 대 없는 장비' },
    { id: 'global', name: '국제 공동연구센터', role: 'A', plot: [2, 2], tier: 4, build: 6e8, ucost: 8e7, rate: 16000, buildSec: 900, note: '시차 덕분에 24시간 연구' },
  ];
  const MILESTONES = [10, 25, 50, 100]; // 이 레벨에 닿으면 효율 2배. 닿는 업그레이드는 대공사(시간이 걸림)
  const MILESTONE_SEC = { 10: 60, 25: 180, 50: 600, 100: 1800 };

  // 방별 가구·장비 5종: [이름, 효과, 레벨당 크기, 등급별 모습 4단계(Lv 1·4·7·10)].
  // 효과 mult=그 방 산출, seat=좌석(레벨당), comfort=휴게 정원, value=연구비, fame=명성
  const EQUIP = {
    office: [['책상', 'mult', 0.08, ['합판 책상', '원목 책상', '전동 스탠딩 책상', '마호가니 대가의 책상']], ['의자', 'mult', 0.07, ['접이식 의자', '사무용 의자', '메쉬 의자', '가죽 중역 의자']], ['컴퓨터', 'mult', 0.12, ['중고 데스크톱', '듀얼 모니터', '워크스테이션', '트리플 모니터 워크스테이션']], ['책장', 'fame', 0.05, ['철제 선반', '원목 책장', '붙박이 서가', '저서가 꽂힌 서가']], ['상패 진열장', 'fame', 0.07, ['종이 명패', '아크릴 명패', '상패 진열장', '훈장 진열장']]],
    meeting: [['회의 테이블', 'mult', 0.08, ['접이식 테이블', '원목 테이블', '대형 회의 테이블', '타원형 이사회 테이블']], ['의자', 'mult', 0.06, ['플라스틱 의자', '사무용 의자', '메쉬 의자', '인체공학 의자']], ['화이트보드', 'mult', 0.1, ['이젤 보드', '벽걸이 보드', '유리 보드', '전자 칠판']], ['빔프로젝터', 'mult', 0.12, ['중고 빔', 'HD 빔', '대형 TV', '화상회의 시스템']], ['커피 포트', 'comfort', 1, ['전기 포트', '드립 세트', '캡슐 머신', '바리스타 머신']]],
    lounge: [['소파', 'comfort', 1.5, ['낡은 소파', '3인 소파', '리클라이너', '안마 소파']], ['커피 머신', 'comfort', 1, ['믹스 커피', '캡슐 머신', '반자동 머신', '바리스타 머신']], ['간식 냉장고', 'comfort', 1, ['미니 냉장고', '음료 냉장고', '간식 자판기', '무한 간식바']], ['낮잠 침대', 'comfort', 1.5, ['간이 침대', '접이식 매트리스', '수면 캡슐', '호텔식 침대']], ['게임기', 'comfort', 2, ['보드게임', '휴대용 게임기', '콘솔 게임기', '아케이드 기계']]],
    wetlab: [['실험대', 'seat', 0.4, ['낡은 실험대', '스테인리스 실험대', '확장 실험대', '모듈형 실험대']], ['실험 의자', 'mult', 0.06, ['나무 의자', '높이 조절 의자', '실험용 스툴', '인체공학 스툴']], ['피펫·플라스크', 'mult', 0.08, ['유리 플라스크', '수동 피펫', '전자 피펫', '자동 분주기']], ['현미경', 'mult', 0.12, ['교육용 현미경', '광학 현미경', '형광 현미경', '공초점 현미경']], ['흄후드', 'mult', 0.15, ['환풍기', '간이 후드', '흄후드', '안전 캐비닛']]],
    server: [['서버 랙', 'seat', 0.4, ['선반 랙', '19인치 랙', '이중 랙', '데이터센터 랙']], ['책상과 의자', 'mult', 0.06, ['접이식 책상', '사무용 책상', '스탠딩 책상', '게이밍 책상']], ['GPU', 'mult', 0.15, ['게이밍 GPU', '워크스테이션 GPU', '데이터센터 GPU', 'GPU 클러스터']], ['냉각 장치', 'mult', 0.1, ['선풍기', '에어컨', '항온항습기', '수랭 시스템']], ['무정전 전원', 'mult', 0.08, ['멀티탭', '소형 UPS', '랙 UPS', '이중 전원']]],
    library: [['서가', 'value', 0.02, ['철제 선반', '원목 서가', '이동식 서가', '자동 서고']], ['열람 책상', 'value', 0.015, ['접이식 책상', '원목 책상', '칸막이 책상', '개인 열람실']], ['열람 의자', 'fame', 0.03, ['플라스틱 의자', '사무용 의자', '메쉬 의자', '인체공학 의자']], ['논문 DB 구독', 'value', 0.03, ['무료 DB', '학회 DB', '통합 DB', '전 세계 DB']], ['스캐너', 'fame', 0.03, ['복사기', '평판 스캐너', '고속 스캐너', '북 스캐너']]],
    clean: [['방진복 보관함', 'seat', 0.4, ['옷걸이', '보관함', '에어샤워', '자동 보관실']], ['클린 벤치', 'mult', 0.08, ['간이 벤치', '클린 벤치', '층류 벤치', '초정밀 벤치']], ['증착 장비', 'mult', 0.15, ['수동 증착기', '스퍼터', 'CVD', '원자층 증착기']], ['공조 설비', 'mult', 0.1, ['공기청정기', '헤파 필터', '클래스 1000 공조', '클래스 10 공조']], ['측정 장비', 'mult', 0.1, ['돋보기', '광학 측정기', '전자 현미경', '원자간력 현미경']]],
    bigequip: [['운영 인력석', 'seat', 0.4, ['간이 책상', '운영 책상', '제어실', '통합 관제실']], ['제어 컴퓨터', 'mult', 0.1, ['노트북', '데스크톱', '제어 서버', '실시간 제어 시스템']], ['핵심 장비', 'mult', 0.2, ['중고 장비', '신형 장비', '맞춤 장비', '세계 유일 장비']], ['예약 시스템', 'mult', 0.1, ['종이 장부', '엑셀 시트', '예약 웹', '자동 스케줄러']], ['안전 설비', 'mult', 0.06, ['소화기', '안전 표지', '가스 감지기', '통합 안전 시스템']]],
    global: [['화상 회의실', 'seat', 0.4, ['노트북 카메라', '회의용 카메라', '화상 회의실', '홀로그램 회의실']], ['공동 서버', 'mult', 0.15, ['공유 드라이브', '공동 서버', '국제 클라우드', '전용 회선']], ['통역 지원', 'mult', 0.1, ['번역기', '통역 아르바이트', '전문 통역사', '동시통역 부스']], ['방문 연구원 숙소', 'mult', 0.08, ['게스트하우스', '원룸', '기숙사', '레지던스']], ['공유 책상', 'mult', 0.06, ['접이식 책상', '공유 책상', '핫데스크', '라운지 오피스']]],
  };
  const EQUIP_MAX = 10, EQUIP_UNLOCK = [1, 1, 5, 10, 25], EQUIP_MUL = [2, 3, 5, 8, 12];
  const EQ_N = 5;
  // 장비 레벨에 따른 모습 단계: 0개(-1), Lv 1~3(0), 4~6(1), 7~9(2), 10(3)
  const eqGrade = (l) => (l <= 0 ? -1 : l >= 10 ? 3 : l >= 7 ? 2 : l >= 4 ? 1 : 0);

  // 대학 본관(메인 건물): 클래시 오브 클랜의 마을회관처럼 교수실 최대 레벨과 새 방을 정한다.
  // 작은 나라 지방 사립대에서 시작해 세계적 명문대가 되는 것이 최종 목표다. 승격은 공사 대기열을 쓰고 시간이 걸린다.
  const UNIVS = [
    null,
    { name: '지방 사립대', desc: '작은 나라 지방 소도시의 신생 사립대. 정문 하나, 건물 셋.', cap: 30, needTier: 1, cost: 0, sec: 0 },
    { name: '지방 거점 국립대', desc: '도에서 제일 큰 대학. 서버실과 자료실을 지을 부지가 생긴다.', cap: 60, needTier: 2, cost: 1000, sec: 60 },
    { name: '수도권 종합대', desc: '지하철역이 가까워 좋은 학생이 지원한다. 클린룸 부지가 생긴다.', cap: 110, needTier: 3, cost: 2e6, sec: 180 },
    { name: '서울 명문 사립대', desc: '대형 장비실과 국제 공동연구센터를 지을 수 있다.', cap: 170, needTier: 4, cost: 3e9, sec: 480 },
    { name: '세계적 명문대', desc: '전 세계에서 학생이 찾아오는 명문대. 이곳의 대가 랩실이 최종 목표다.', cap: 250, needTier: 4, cost: 3e11, sec: 900 },
  ];
  const UNIV_MAX = UNIVS.length - 1, MAXLV = 250;

  // 학과 연구: 연구비와 시간이 들고, 한 번에 하나씩
  const RESEARCH = {
    exp: { name: '효율적인 실험', desc: '데이터 생산 +10%', max: 10 },
    write: { name: '논문 작성법', desc: '회의실 용량 +10%', max: 10 },
    admin: { name: '행정 간소화', desc: '교수실 용량 +10%', max: 10 },
    welfare: { name: '복지 확대', desc: '휴게실 정원 +2명', max: 10 },
    scholar: { name: '장학금 확충', desc: '학생 모집 비용 -8%', max: 8 },
    build: { name: '공사 기술', desc: '공사·연구 시간 -8%', max: 8 },
    pr: { name: '연구실 홍보', desc: '명성 +10%', max: 10 },
  };

  // 스타 연구원 카드: 방에 배치하면 상시 배율, 스킬은 쿨다운마다 쓸 수 있다. 모집권은 무료로만 얻는다.
  const RARITY = { c: { name: '일반', w: 60, mult: 1.5, skill: [3, 20, 600] }, r: { name: '희귀', w: 28, mult: 2, skill: [4, 25, 480] }, e: { name: '영웅', w: 9, mult: 3, skill: [5, 30, 360] }, l: { name: '전설', w: 3, mult: 5, skill: [8, 30, 300] } };
  const CARDS = [
    { id: 'c1', name: '성실한 석사 김하늘', rar: 'c', role: 'A', skill: '밤샘 실험' },
    { id: 'c2', name: '꼼꼼한 박사 이도윤', rar: 'c', role: 'B', skill: '교정 마라톤' },
    { id: 'c3', name: '행정의 달인 박소라', rar: 'c', role: 'C', skill: '서류 일괄 처리' },
    { id: 'c4', name: '분위기 메이커 최준', rar: 'c', role: 'M', skill: '야식 배달' },
    { id: 'r1', name: '실험 장인 정민재', rar: 'r', role: 'A', skill: '완벽한 셋업' },
    { id: 'r2', name: '코딩 천재 한서윤', rar: 'r', role: 'A', skill: '자동화 스크립트' },
    { id: 'r3', name: '논문 기계 오지후', rar: 'r', role: 'B', skill: '하룻밤 원고' },
    { id: 'r4', name: '과제 사냥꾼 윤채원', rar: 'r', role: 'C', skill: '제안서 폭격' },
    { id: 'e1', name: '포닥 에이스 강태오', rar: 'e', role: 'A', skill: '연구실 총동원' },
    { id: 'e2', name: '편집위원 서은비', rar: 'e', role: 'B', skill: '빠른 심사 요청' },
    { id: 'l1', name: '전설의 연구교수 임도현', rar: 'l', role: 'any', skill: '세기의 아이디어' },
    { id: 'l2', name: '세계적 석학 권하린', rar: 'l', role: 'C', skill: '기조연설' },
  ];
  const CARD_PITY = 10; // 영웅 이상 없이 10번 뽑으면 다음은 영웅 이상 확정

  // 일일 미션
  const MISSIONS = {
    up: { name: '방·장비 업그레이드 20번', goal: 20 },
    hire: { name: '학생 2명 모집', goal: 2 },
    cheer: { name: '방 독려 5번', goal: 5 },
    event: { name: '돌발 이벤트 2개 처리', goal: 2 },
    research: { name: '학과 연구 1번 시작', goal: 1 },
  };

  // 컨소시엄(연맹) 기술: 멤버들이 기부한 점수 합으로 레벨이 정해지고 전원에게 적용된다
  const ALLY_TECH = {
    lab: { name: '공동 장비 구매', desc: '데이터 생산 +5%' },
    seminar: { name: '공동 세미나', desc: '회의실 용량 +5%' },
    office: { name: '공동 행정실', desc: '교수실 용량 +5%' },
    grant: { name: '공동 연구비', desc: '연구비 +5%' },
  };
  const allyTechLevel = (points) => Math.min(20, Math.floor(Math.sqrt(Math.max(0, points) / 20)));
  const WEEK_GOALS = [{ papers: 100, tickets: 2, minutes: 30 }, { papers: 500, tickets: 3, minutes: 60 }, { papers: 2000, tickets: 5, minutes: 120 }];
  const HELP_MAX = 10; // 요청 하나에 받을 수 있는 도움 수

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
  const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60); return m >= 60 ? Math.floor(m / 60) + '시간 ' + (m % 60) + '분' : m ? m + '분 ' + (s % 60) + '초' : s + '초'; };

  function rnd(st) {
    let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const note = (st, kind, text) => { st.notes.push({ kind, text }); if (st.notes.length > 30) st.notes.shift(); };

  // ---------- 새 게임과 세이브 변환 ----------
  // prev를 넘기면 정년 퇴임 후 새 연구실: 월계관·스타 연구원·모집권·컨소시엄 정보는 이어진다.
  function newGame(prev) {
    const keep = prev || {};
    const st = {
      v: 2, univ: 1, money: 60, fame: 0, totalMoney: 0, papers: 0, time: 0, tier: 1, ended: false,
      rooms: {}, equip: {}, students: [], buffs: [], cooldown: {}, notes: [], rng: (Math.random() * 2 ** 32) >>> 0,
      laurels: keep.laurels || 0, runs: keep.runs || 0, promotedAt: [{ tier: 1, time: 0 }],
      builds: [], research: { lv: {}, active: null }, nextReq: 1, helpApplied: {},
      cards: keep.cards || { owned: {}, assign: {}, skillCd: {}, pity: 0 }, tickets: keep.tickets != null ? keep.tickets : 2,
      missions: keep.missions || { day: '', prog: {}, claimed: {}, bonus: false },
      week: keep.week || { key: '', papers: 0, claimed: {} },
      ally: keep.ally || { id: null, nick: '', donated: {}, weekDonated: 0, helpGiven: 0, helps: {} },
      allyTech: keep.allyTech || {}, lifeFame: keep.lifeFame || 0,
    };
    st.cards.assign = {}; // 새 연구실이라 배치는 다시 한다
    ROOMS.forEach((r) => { st.rooms[r.id] = r.build === 0 ? 1 : 0; st.equip[r.id] = [0, 0, 0, 0, 0]; });
    hireFree(st); hireFree(st);
    return st;
  }
  function hireFree(st) {
    st.students.push({ name: STUDENT_NAMES[Math.floor(rnd(st) * STUDENT_NAMES.length)] + GIVEN[Math.floor(rnd(st) * GIVEN.length)], grade: 0 });
  }
  function migrate(st) {
    if (!st || typeof st !== 'object') return null;
    if (st.v === 1) st.v = 2; // v1에는 장비·연구·카드가 없다. 아래에서 기본값을 채운다
    if (st.v !== 2) return null;
    const fresh = newGame({ laurels: st.laurels, runs: st.runs });
    Object.keys(fresh).forEach((k) => { if (st[k] === undefined) st[k] = fresh[k]; });
    ROOMS.forEach((r) => {
      if (typeof st.rooms[r.id] !== 'number') st.rooms[r.id] = r.build === 0 ? 1 : 0;
      if (!Array.isArray(st.equip[r.id])) st.equip[r.id] = [];
      while (st.equip[r.id].length < EQ_N) st.equip[r.id].push(0);
    });
    if (typeof st.univ !== 'number' || st.univ < 1 || st.univ > UNIV_MAX) st.univ = 1;
    if (st.univ < Math.min(UNIV_MAX - 1, st.tier)) st.univ = Math.min(UNIV_MAX - 1, st.tier); // 본관이 없던 저장: 직급에 맞춰 준다
    ['money', 'fame', 'time', 'totalMoney', 'papers'].forEach((k) => { if (typeof st[k] !== 'number' || !isFinite(st[k]) || st[k] < 0) st[k] = 0; });
    return st;
  }

  // ---------- 조회 ----------
  const room = (id) => ROOMS.find((r) => r.id === id);
  const lv = (st, id) => st.rooms[id] || 0;
  const unlocked = (st, id) => st.univ >= room(id).tier;
  const placeName = (id) => (id === 'univ' ? '대학 본관' : room(id).name);
  const built = (st, id) => lv(st, id) > 0;
  const rlv = (st, id) => st.research.lv[id] || 0;
  const eqLv = (st, id, i) => (st.equip[id] || [])[i] || 0;
  const eqLook = (st, id, i) => { const g = eqGrade(eqLv(st, id, i)); return g < 0 ? null : EQUIP[id][i][3][g]; };
  function eqSum(st, id, kind) {
    return (EQUIP[id] || []).reduce((a, e, i) => a + (e[1] === kind ? e[2] * eqLv(st, id, i) : 0), 0);
  }
  const eqAll = (st, kind) => ROOMS.reduce((a, r) => a + eqSum(st, r.id, kind), 0);
  const buffMult = (st, target) => st.buffs.filter((b) => b.until > st.time && (b.target === target || b.target === 'all')).reduce((a, b) => a * b.mult, 1);
  const tech = (st, k) => allyTechLevel((st.allyTech || {})[k] || 0);
  // 배치된 스타 연구원의 상시 배율
  function cardMult(st, roomId) {
    const cid = st.cards.assign[roomId];
    if (!cid || !st.cards.owned[cid]) return 1;
    const c = CARDS.find((x) => x.id === cid);
    return RARITY[c.rar].mult * (1 + 0.25 * (st.cards.owned[cid] - 1));
  }
  const seats = (st, id) => (built(st, id) ? Math.min(14, 2 + Math.floor(lv(st, id) / 5) + Math.floor(eqSum(st, id, 'seat'))) : 0);
  const producers = (st) => ROOMS.filter((r) => r.role === 'A' && built(st, r.id));
  const maxStudents = (st) => producers(st).reduce((a, r) => a + seats(st, r.id), 0);
  function seating(st) {
    let left = st.students.length;
    const out = {};
    producers(st).slice().reverse().forEach((r) => { const n = Math.min(left, seats(st, r.id)); out[r.id] = n; left -= n; });
    return out;
  }
  const perStudent = (st, id) => room(id).rate * lv(st, id) * Math.pow(2, MILESTONES.filter((m) => lv(st, id) >= m).length) * (1 + eqSum(st, id, 'mult')) * cardMult(st, id);
  function stageA(st) {
    const s = seating(st);
    const g = (1 + 0.1 * rlv(st, 'exp')) * (1 + 0.05 * tech(st, 'lab'));
    return producers(st).reduce((a, r) => a + perStudent(st, r.id) * (s[r.id] || 0) * buffMult(st, r.id), 0) * g;
  }
  const capOf = (st, id) => room(id).cap * lv(st, id) * Math.pow(2, Math.floor(lv(st, id) / 10)) * Math.pow(1.6, st.tier - 1) * (1 + eqSum(st, id, 'mult')) * cardMult(st, id);
  const stageB = (st) => capOf(st, 'meeting') * buffMult(st, 'meeting') * (1 + 0.1 * rlv(st, 'write')) * (1 + 0.05 * tech(st, 'seminar'));
  const stageC = (st) => capOf(st, 'office') * buffMult(st, 'office') * (1 + 0.1 * rlv(st, 'admin')) * (1 + 0.05 * tech(st, 'office'));
  const comfort = (st) => Math.floor((3 + 2 * lv(st, 'lounge') + eqAll(st, 'comfort') + 2 * rlv(st, 'welfare')) * cardMult(st, 'lounge'));
  const mood = (st) => Math.max(0.35, Math.min(1, 1 - 0.07 * (st.students.length - comfort(st))));
  const valueMult = (st) => Math.pow(CFG.tierValue, st.tier - 1) * (1 + CFG.libraryBonus * lv(st, 'library') + eqAll(st, 'value')) * (1 + CFG.laurelBonus * st.laurels) * (1 + 0.05 * tech(st, 'grant'));
  const fameMult = (st) => (1 + eqAll(st, 'fame')) * (1 + 0.1 * rlv(st, 'pr')) * (1 + 0.15 * (st.univ - 1)); // 좋은 대학일수록 논문이 주목받는다
  function flow(st) {
    const a = stageA(st), b = stageB(st), c = stageC(st), m = mood(st);
    const t = Math.min(a, b, c) * m;
    const bott = a <= b && a <= c ? 'A' : b <= c ? 'B' : 'C';
    return { a, b, c, mood: m, t, bott, money: t * valueMult(st) * buffMult(st, 'money'), fame: t * CFG.fameRate * fameMult(st) };
  }

  // ---------- 비용과 제한 ----------
  const maxLevel = (st, id) => (id === 'office' ? Math.min(MAXLV, UNIVS[st.univ].cap) : Math.min(MAXLV, lv(st, 'office') + CFG.officeGate));
  const upCost = (st, id) => {
    const r = room(id), l = lv(st, id);
    if (l === 0) return r.build;
    return Math.ceil(r.ucost * Math.pow(r.role === 'A' ? CFG.prodGrowth : CFG.stageGrowth, l - 1));
  };
  const hireCost = (st) => Math.ceil(CFG.hireBase * Math.pow(CFG.hireGrowth, st.students.length - 2) * Math.max(0.3, 1 - 0.08 * rlv(st, 'scholar')));
  const eqCost = (st, id, i) => Math.ceil(Math.max(50, room(id).ucost) * EQUIP_MUL[i] * Math.pow(1.9, eqLv(st, id, i)));
  const timeMult = (st) => Math.max(0.36, 1 - 0.08 * rlv(st, 'build'));
  const buildSlots = (st) => 1 + (st.tier >= 3 ? 1 : 0);
  const researchCost = (st, id) => Math.ceil(200 * Math.pow(8, rlv(st, id)));
  const researchSec = (st, id) => Math.ceil(60 * Math.pow(rlv(st, id) + 1, 1.5) * timeMult(st));
  // 이 업그레이드가 대공사(시간이 걸림)인지
  function bigWorkSec(st, id) {
    const l = lv(st, id);
    if (l === 0) return room(id).buildSec * timeMult(st);
    return MILESTONE_SEC[l + 1] ? MILESTONE_SEC[l + 1] * timeMult(st) : 0;
  }
  const building = (st, id) => st.builds.find((b) => b.room === id);

  // ---------- 행동 ----------
  function tick(st, dt) {
    if (st.ended || !(dt > 0)) return;
    let left = dt;
    while (left > 0) {
      const ends = st.buffs.map((b) => b.until).concat(st.builds.map((b) => b.endAt), st.research.active ? [st.research.active.endAt] : []).filter((u) => u > st.time);
      const step = Math.min(left, ends.length ? Math.max(0.001, Math.min(...ends) - st.time) : left);
      gain(st, flow(st), step, 1);
      st.time += step; left -= step;
      finishTimers(st);
    }
    st.buffs = st.buffs.filter((b) => b.until > st.time);
  }
  function gain(st, f, sec, eff) {
    st.money += f.money * sec * eff; st.totalMoney += f.money * sec * eff;
    st.fame += f.fame * sec * eff; st.lifeFame += f.fame * sec * eff;
    const p = (f.t * sec * eff) / (40 * Math.pow(2, st.tier - 1));
    st.papers += p; st.week.papers += p;
  }
  function finishTimers(st) {
    st.builds = st.builds.filter((b) => {
      if (b.endAt > st.time) return true;
      if (b.room === 'univ') {
        st.univ = b.toLv;
        note(st, 'univ', '대학이 ' + UNIVS[b.toLv].name + '(으)로 승격했다! 교수실을 Lv ' + UNIVS[b.toLv].cap + '까지 올릴 수 있다.');
        checkEnd(st);
        return false;
      }
      st.rooms[b.room] = b.toLv;
      note(st, 'build', room(b.room).name + (b.toLv === 1 ? ' 공사를 마쳤다!' : ' Lv ' + b.toLv + ' 대공사 완료! 효율 2배'));
      return false;
    });
    const r = st.research.active;
    if (r && r.endAt <= st.time) {
      st.research.lv[r.id] = r.toLv; st.research.active = null;
      note(st, 'research', RESEARCH[r.id].name + ' 연구 Lv ' + r.toLv + ' 완료!');
    }
  }
  function canUpgrade(st, id) {
    const r = room(id);
    if (!unlocked(st, id)) return UNIVS[r.tier].name + '부터';
    if (building(st, id)) return '공사 중';
    if (lv(st, id) >= maxLevel(st, id)) return lv(st, id) >= MAXLV ? '최대' : id === 'office' ? '대학 본관 승격 필요' : '교수실 Lv ' + (lv(st, id) - CFG.officeGate + 1) + ' 필요';
    if (bigWorkSec(st, id) > 0 && st.builds.length >= buildSlots(st)) return '공사 대기열 가득';
    return st.money >= upCost(st, id) ? true : '연구비 부족';
  }
  function upgrade(st, id) {
    if (canUpgrade(st, id) !== true) return false;
    st.money -= upCost(st, id);
    track(st, 'up');
    const sec = bigWorkSec(st, id);
    if (sec > 0) {
      st.builds.push({ room: id, toLv: lv(st, id) + 1, endAt: st.time + sec, total: sec, reqId: 'b' + st.nextReq++ });
      note(st, 'build', room(id).name + (lv(st, id) === 0 ? ' 공사를 시작했다. ' : ' 대공사를 시작했다. ') + fmtTime(sec) + ' 걸린다. 컨소시엄 동료가 도와주면 빨라진다.');
      return true;
    }
    st.rooms[id] = lv(st, id) + 1;
    return true;
  }
  // 대학 본관 승격
  function canUpgradeUniv(st) {
    if (st.univ >= UNIV_MAX) return '최고 단계';
    if (building(st, 'univ')) return '승격 공사 중';
    const u = UNIVS[st.univ + 1];
    if (st.tier < u.needTier) return TIERS[u.needTier].name + ' 승진 필요';
    if (st.builds.length >= buildSlots(st)) return '공사 대기열 가득';
    return st.money >= u.cost ? true : '연구비 부족';
  }
  function upgradeUniv(st) {
    if (canUpgradeUniv(st) !== true) return false;
    const u = UNIVS[st.univ + 1], sec = u.sec * timeMult(st);
    st.money -= u.cost;
    track(st, 'up');
    st.builds.push({ room: 'univ', toLv: st.univ + 1, endAt: st.time + sec, total: sec, reqId: 'b' + st.nextReq++ });
    note(st, 'univ', u.name + ' 승격 공사를 시작했다. ' + fmtTime(sec) + ' 걸린다.');
    return true;
  }
  // 최종 목표: 살아있는 교과서가 되고, 대학이 세계적 명문대가 되면 한 판이 끝난다
  function checkEnd(st) { if (st.tier === LAST && st.univ === UNIV_MAX) st.ended = true; }
  function canEquip(st, id, i) {
    if (!built(st, id)) return '공사 먼저';
    if (lv(st, id) < EQUIP_UNLOCK[i]) return '방 Lv ' + EQUIP_UNLOCK[i] + '부터';
    if (eqLv(st, id, i) >= EQUIP_MAX) return '최대';
    return st.money >= eqCost(st, id, i) ? true : '연구비 부족';
  }
  function upgradeEquip(st, id, i) {
    if (canEquip(st, id, i) !== true) return false;
    st.money -= eqCost(st, id, i);
    st.equip[id][i] = eqLv(st, id, i) + 1;
    track(st, 'up');
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
    track(st, 'hire');
    note(st, 'hire', GRADES[g] + ' ' + s.name + ' 학생이 연구실에 들어왔다.');
    return s;
  }
  function encourage(st, id) {
    if (!built(st, id) || (st.cooldown[id] || 0) > st.time) return false;
    st.buffs.push({ target: id, mult: 2, until: st.time + 15, src: room(id).name + ' 독려' });
    st.cooldown[id] = st.time + 45;
    track(st, 'cheer');
    return true;
  }

  // ---------- 학과 연구 ----------
  function canResearch(st, id) {
    if (st.research.active) return '다른 연구 진행 중';
    if (rlv(st, id) >= RESEARCH[id].max) return '최대';
    return st.money >= researchCost(st, id) ? true : '연구비 부족';
  }
  function startResearch(st, id) {
    if (canResearch(st, id) !== true) return false;
    st.money -= researchCost(st, id);
    const sec = researchSec(st, id);
    st.research.active = { id, toLv: rlv(st, id) + 1, endAt: st.time + sec, total: sec, reqId: 'r' + st.nextReq++ };
    track(st, 'research');
    return true;
  }

  // ---------- 스타 연구원 ----------
  function drawCard(st) {
    if (st.tickets <= 0) return null;
    st.tickets--;
    let pool = CARDS;
    if (st.cards.pity >= CARD_PITY - 1) pool = CARDS.filter((c) => c.rar === 'e' || c.rar === 'l');
    const total = pool.reduce((a, c) => a + RARITY[c.rar].w / CARDS.filter((x) => x.rar === c.rar).length, 0);
    let r = rnd(st) * total, pick = pool[pool.length - 1];
    for (const c of pool) { r -= RARITY[c.rar].w / CARDS.filter((x) => x.rar === c.rar).length; if (r <= 0) { pick = c; break; } }
    st.cards.pity = pick.rar === 'e' || pick.rar === 'l' ? 0 : st.cards.pity + 1;
    const had = st.cards.owned[pick.id] || 0;
    st.cards.owned[pick.id] = Math.min(5, had + 1);
    note(st, 'card', (had ? '[별 +1] ' : '[새 연구원] ') + RARITY[pick.rar].name + ' 「' + pick.name + '」' + (had ? ' ★' + st.cards.owned[pick.id] : ''));
    return { card: pick, isNew: !had };
  }
  // 카드 한 장의 공개 확률(%)
  const cardRate = (id) => { const c = CARDS.find((x) => x.id === id); return RARITY[c.rar].w / CARDS.filter((x) => x.rar === c.rar).length; };
  const roleFits = (c, roomId) => c.role === 'any' || c.role === room(roomId).role;
  function assignCard(st, cid, roomId) {
    const c = CARDS.find((x) => x.id === cid);
    if (!c || !st.cards.owned[cid] || !built(st, roomId) || !roleFits(c, roomId)) return false;
    Object.keys(st.cards.assign).forEach((k) => { if (st.cards.assign[k] === cid) delete st.cards.assign[k]; });
    st.cards.assign[roomId] = cid;
    return true;
  }
  function unassignCard(st, roomId) { delete st.cards.assign[roomId]; }
  function useSkill(st, roomId) {
    const cid = st.cards.assign[roomId];
    if (!cid || (st.cards.skillCd[cid] || 0) > st.time) return false;
    const c = CARDS.find((x) => x.id === cid), s = RARITY[c.rar].skill;
    st.buffs.push({ target: roomId, mult: s[0], until: st.time + s[1], src: c.skill });
    st.cards.skillCd[cid] = st.time + s[2];
    note(st, 'skill', c.name + '의 스킬 「' + c.skill + '」! ' + s[1] + '초 동안 ' + room(roomId).name + ' ×' + s[0]);
    return true;
  }

  // ---------- 일일 미션 ----------
  function refreshDay(st, day) {
    if (st.missions.day !== day) st.missions = { day, prog: {}, claimed: {}, bonus: false };
  }
  function track(st, id) { st.missions.prog[id] = (st.missions.prog[id] || 0) + 1; }
  const missionDone = (st, id) => (st.missions.prog[id] || 0) >= MISSIONS[id].goal;
  function claimMission(st, id) {
    if (!missionDone(st, id) || st.missions.claimed[id]) return false;
    st.missions.claimed[id] = true; st.tickets++;
    const v = Math.max(100, flow(st).money * 300); st.money += v; st.totalMoney += v;
    return true;
  }
  const allMissionsClaimed = (st) => Object.keys(MISSIONS).every((k) => st.missions.claimed[k]);
  function claimMissionBonus(st) { if (!allMissionsClaimed(st) || st.missions.bonus) return false; st.missions.bonus = true; st.tickets += 2; return true; }

  // ---------- 돌발 이벤트 ----------
  const EVENTS = {
    deadline: { name: '마감 임박', text: '학회 마감이 내일이다! 회의실이 30초 동안 3배로 달린다.', apply: (st) => st.buffs.push({ target: 'meeting', mult: 3, until: st.time + 30, src: '마감 임박' }) },
    grant: { name: '과제 선정', text: '국가과제에 선정됐다! 연구비 1분 치와 연구원 모집권 1장을 받았다.', apply: (st) => { const v = Math.max(flow(st).money * 60, 100); st.money += v; st.totalMoney += v; st.tickets++; return v; } },
    audit: { name: '연구비 감사', text: '영수증을 정리했다. 감사를 무사히 넘겼다.', apply: () => 0, missed: (st) => st.buffs.push({ target: 'office', mult: 0.5, until: st.time + 60, src: '감사 대응' }) },
    conference: { name: '학회 시즌', text: '학회 발표가 호평을 받았다. 40초 동안 연구비 2배.', apply: (st) => st.buffs.push({ target: 'money', mult: 2, until: st.time + 40, src: '학회 시즌' }) },
  };
  function pickEvent(st) { const k = Object.keys(EVENTS); return k[Math.floor(rnd(st) * k.length)]; }
  function applyEvent(st, id) { const v = EVENTS[id].apply(st); track(st, 'event'); note(st, 'event', EVENTS[id].text); return v; }
  function missEvent(st, id) { if (EVENTS[id].missed) { EVENTS[id].missed(st); note(st, 'event', '감사 대응을 놓쳤다. 1분 동안 교수실 속도가 절반.'); } }

  // ---------- 컨소시엄 ----------
  // 기부: 연구비 10분 치를 내고 그 기술에 10점. 멤버 기부 점수 합으로 기술 레벨이 정해진다.
  const donateCost = (st) => Math.ceil(Math.max(100, flow(st).money * 600));
  function donate(st, techId) {
    if (!st.ally.id || !ALLY_TECH[techId]) return false;
    const c = donateCost(st); if (st.money < c) return false;
    st.money -= c;
    st.ally.donated[techId] = (st.ally.donated[techId] || 0) + 10;
    st.ally.weekDonated += 10;
    return true;
  }
  // 도움 요청이 필요한 진행 중 타이머(공사·연구)
  function helpRequests(st) {
    const out = st.builds.map((b) => ({ reqId: b.reqId, label: b.room === 'univ' ? UNIVS[b.toLv].name + ' 승격' : room(b.room).name + (b.toLv === 1 ? ' 공사' : ' Lv ' + b.toLv + ' 대공사'), endAt: b.endAt, total: b.total }));
    if (st.research.active) { const r = st.research.active; out.push({ reqId: r.reqId, label: RESEARCH[r.id].name + ' 연구', endAt: r.endAt, total: r.total }); }
    return out;
  }
  // 동료들이 보내 준 도움 수를 반영한다. 도움 1번 = 남은 시간에서 max(30초, 전체의 4%)를 줄인다(요청당 최대 10번).
  function applyHelps(st, reqId, count) {
    const n = Math.min(HELP_MAX, count), done = st.helpApplied[reqId] || 0;
    if (n <= done) return 0;
    const target = st.builds.find((b) => b.reqId === reqId) || (st.research.active && st.research.active.reqId === reqId ? st.research.active : null);
    st.helpApplied[reqId] = n;
    if (!target) return 0;
    const cut = (n - done) * Math.max(30, target.total * 0.04);
    target.endAt = Math.max(st.time, target.endAt - cut);
    finishTimers(st);
    return cut;
  }
  // 내가 동료를 도울 때(내 문서에만 기록). 도우면 연구비 1분 치를 받는다.
  function giveHelp(st, uid, reqId) {
    const cur = st.ally.helps[uid];
    const [rid, n] = cur ? cur.split(':') : [reqId, '0'];
    const cnt = rid === reqId ? Number(n) : 0;
    if (cnt >= 1) return false; // 요청 하나에 한 사람은 한 번만
    st.ally.helps[uid] = reqId + ':' + (cnt + 1);
    st.ally.helpGiven++;
    const v = Math.max(50, flow(st).money * 60); st.money += v; st.totalMoney += v;
    return true;
  }
  function refreshWeek(st, key) { if (st.week.key !== key) { st.week = { key, papers: 0, claimed: {} }; st.ally.weekDonated = 0; } }
  function claimWeek(st, i, teamPapers) {
    const g = WEEK_GOALS[i];
    if (!g || st.week.claimed[i] || teamPapers < g.papers) return false;
    st.week.claimed[i] = true; st.tickets += g.tickets;
    const v = Math.max(500, flow(st).money * 60 * g.minutes); st.money += v; st.totalMoney += v;
    return true;
  }
  const power = (st) => st.tier * 1000 + Math.floor(Math.log10(1 + st.lifeFame) * 100) + st.laurels * 300;

  // ---------- 승진과 정년 ----------
  const nextNeed = (st) => (st.tier < LAST ? CFG.fameNeed[st.tier + 1] : Infinity);
  const canPromote = (st) => st.tier < LAST && st.fame >= nextNeed(st);
  function promote(st) {
    if (!canPromote(st)) return false;
    st.tier++; st.promotedAt.push({ tier: st.tier, time: st.time });
    st.tickets += 2;
    checkEnd(st);
    return true;
  }
  const laurelReward = (st) => 3 + Math.min(5, Math.floor(Math.log10(Math.max(1, st.fame / CFG.fameNeed[LAST])) * 2));
  function retire(st) {
    if (!st.ended) return null;
    const keep = { laurels: st.laurels + laurelReward(st), runs: st.runs + 1, cards: st.cards, tickets: st.tickets, missions: st.missions, week: st.week, ally: st.ally, allyTech: st.allyTech, lifeFame: st.lifeFame };
    return newGame(keep);
  }

  // 앱을 닫아 둔 시간: 최대 8시간, 효율 50%. 공사·연구 타이머는 그대로 흐른다.
  function offline(st, seconds) {
    const raw = typeof seconds === 'number' && isFinite(seconds) ? seconds : 0;
    const s = Math.min(Math.max(0, raw), CFG.offlineCapH * 3600);
    const before = { money: st.totalMoney, fame: st.fame };
    if (s > 0 && !st.ended) {
      st.buffs = [];
      const n = 40, dt = s / n;
      for (let i = 0; i < n; i++) { gain(st, flow(st), dt, CFG.offlineEff); st.time += dt; finishTimers(st); }
    }
    // 오프라인 동안에도 실제 시간은 흐르므로, 상한을 넘긴 시간만큼 타이머만 더 진행한다
    if (raw > s) { st.time += raw - s; finishTimers(st); }
    return { seconds: s, capped: raw > CFG.offlineCapH * 3600, money: st.totalMoney - before.money, fame: st.fame - before.fame };
  }

  return {
    CFG, TIERS, LAST, ROOMS, MILESTONES, EQUIP, EQUIP_MAX, EQUIP_UNLOCK, EQ_N, UNIVS, UNIV_MAX, MAXLV, eqGrade, eqLook, placeName, canUpgradeUniv, upgradeUniv, RESEARCH, RARITY, CARDS, CARD_PITY, MISSIONS, ALLY_TECH, WEEK_GOALS, HELP_MAX, GRADES, EVENTS, fmt, fmtTime,
    newGame, migrate, tick, flow, room, lv, unlocked, built, seats, seating, maxStudents, perStudent, capOf, comfort, mood, valueMult, maxLevel, building, buildSlots, bigWorkSec,
    upCost, hireCost, canUpgrade, upgrade, canHire, hire, encourage, eqLv, eqCost, canEquip, upgradeEquip, cardMult,
    rlv, researchCost, researchSec, canResearch, startResearch, drawCard, cardRate, roleFits, assignCard, unassignCard, useSkill,
    refreshDay, missionDone, claimMission, allMissionsClaimed, claimMissionBonus, pickEvent, applyEvent, missEvent,
    allyTechLevel, donateCost, donate, helpRequests, applyHelps, giveHelp, refreshWeek, claimWeek, power,
    nextNeed, canPromote, promote, laurelReward, retire, offline, buffMult, tech,
  };
});
