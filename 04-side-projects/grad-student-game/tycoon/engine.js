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
    fameNeed: [0, 0, 1e3, 3e5, 1.5e8, 1.5e11], // 직급별 승진에 필요한 누적 명성
    tierValue: 2.5, fameRate: 0.1,
    prodGrowth: 1.14, stageGrowth: 1.16, hireBase: 30, hireGrowth: 1.32,
    offlineCapH: 8, offlineEff: 0.5, laurelBonus: 0.25, libraryBonus: 0.05,
    officeGate: 10, moodMax: 1.3, // 다른 방은 교수실 레벨 + 이 값까지
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
    { id: 'global', name: '국제 공동연구센터', role: 'A', plot: [2, 2], tier: 5, build: 6e8, ucost: 8e7, rate: 16000, buildSec: 900, note: '시차 덕분에 24시간 연구' },
  ];
  const MILESTONES = [10, 25, 50, 100]; // 이 레벨에 닿으면 효율 2배. 닿는 업그레이드는 대공사(시간이 걸림)
  const MILESTONE_SEC = { 10: 45, 25: 120, 50: 300, 100: 600 };

  // 방별 가구·장비 5종: [이름, 효과, 레벨당 크기, 단계별 모습 5개].
  // 효과 mult=그 방 산출, seat=좌석(레벨당), comfort=휴게 정원, value=연구비, fame=명성
  const EQUIP = {
    office: [['책상', 'mult', 0.08, ['합판 책상', '철제 책상', '원목 책상', '전동 스탠딩 책상', '마호가니 대가의 책상']], ['의자', 'mult', 0.07, ['접이식 의자', '플라스틱 의자', '사무용 의자', '메쉬 의자', '가죽 중역 의자']], ['컴퓨터', 'mult', 0.12, ['중고 데스크톱', '새 데스크톱', '듀얼 모니터', '워크스테이션', '트리플 모니터 워크스테이션']], ['책장', 'fame', 0.05, ['철제 선반', '조립식 책장', '원목 책장', '붙박이 서가', '저서가 꽂힌 서가']], ['상패 진열장', 'fame', 0.07, ['종이 명패', '아크릴 명패', '상패 한 개', '상패 진열장', '훈장 진열장']]],
    meeting: [['회의 테이블', 'mult', 0.08, ['접이식 테이블', '사무용 테이블', '원목 테이블', '대형 회의 테이블', '타원형 이사회 테이블']], ['의자', 'mult', 0.06, ['플라스틱 의자', '철제 의자', '사무용 의자', '메쉬 의자', '인체공학 의자']], ['화이트보드', 'mult', 0.1, ['이젤 보드', '벽걸이 보드', '대형 보드', '유리 보드', '전자 칠판']], ['빔프로젝터', 'mult', 0.12, ['중고 빔', 'HD 빔', '4K 빔', '대형 TV', '화상회의 시스템']], ['커피 포트', 'comfort', 1, ['전기 포트', '드립 세트', '커피 메이커', '캡슐 머신', '바리스타 머신']]],
    lounge: [['소파', 'comfort', 1.5, ['낡은 소파', '2인 소파', '3인 소파', '리클라이너', '안마 소파']], ['커피 머신', 'comfort', 1, ['믹스 커피', '드립 세트', '캡슐 머신', '반자동 머신', '바리스타 머신']], ['간식 냉장고', 'comfort', 1, ['미니 냉장고', '가정용 냉장고', '음료 냉장고', '간식 자판기', '무한 간식바']], ['낮잠 침대', 'comfort', 1.5, ['간이 침대', '접이식 매트리스', '소파 베드', '수면 캡슐', '호텔식 침대']], ['게임기', 'comfort', 2, ['보드게임', '다트판', '휴대용 게임기', '콘솔 게임기', '아케이드 기계']]],
    wetlab: [['실험대', 'seat', 0.4, ['낡은 실험대', '철제 실험대', '스테인리스 실험대', '확장 실험대', '모듈형 실험대']], ['실험 의자', 'mult', 0.06, ['나무 의자', '철제 스툴', '높이 조절 의자', '실험용 스툴', '인체공학 스툴']], ['피펫·플라스크', 'mult', 0.08, ['유리 플라스크', '눈금 실린더', '수동 피펫', '전자 피펫', '자동 분주기']], ['현미경', 'mult', 0.12, ['교육용 현미경', '실체 현미경', '광학 현미경', '형광 현미경', '공초점 현미경']], ['흄후드', 'mult', 0.15, ['환풍기', '간이 후드', '흄후드', '고성능 흄후드', '안전 캐비닛']]],
    server: [['서버 랙', 'seat', 0.4, ['선반 랙', '철제 랙', '19인치 랙', '이중 랙', '데이터센터 랙']], ['책상과 의자', 'mult', 0.06, ['접이식 책상', '사무용 책상', '듀얼 모니터 책상', '스탠딩 책상', '게이밍 책상']], ['GPU', 'mult', 0.15, ['게이밍 GPU', '고급 게이밍 GPU', '워크스테이션 GPU', '데이터센터 GPU', 'GPU 클러스터']], ['냉각 장치', 'mult', 0.1, ['선풍기', '서큘레이터', '에어컨', '항온항습기', '수랭 시스템']], ['무정전 전원', 'mult', 0.08, ['멀티탭', '서지 보호기', '소형 UPS', '랙 UPS', '이중 전원']]],
    library: [['서가', 'value', 0.02, ['철제 선반', '조립식 서가', '원목 서가', '이동식 서가', '자동 서고']], ['열람 책상', 'value', 0.015, ['접이식 책상', '사무용 책상', '원목 책상', '칸막이 책상', '개인 열람실']], ['열람 의자', 'fame', 0.03, ['플라스틱 의자', '철제 의자', '사무용 의자', '메쉬 의자', '인체공학 의자']], ['논문 DB 구독', 'value', 0.03, ['무료 DB', '학회 DB', '출판사 DB', '통합 DB', '전 세계 DB']], ['스캐너', 'fame', 0.03, ['복사기', '복합기', '평판 스캐너', '고속 스캐너', '북 스캐너']]],
    clean: [['방진복 보관함', 'seat', 0.4, ['옷걸이', '사물함', '보관함', '에어샤워', '자동 보관실']], ['클린 벤치', 'mult', 0.08, ['간이 벤치', '클린 벤치', '층류 벤치', '정밀 벤치', '초정밀 벤치']], ['증착 장비', 'mult', 0.15, ['수동 증착기', '열 증착기', '스퍼터', 'CVD', '원자층 증착기']], ['공조 설비', 'mult', 0.1, ['공기청정기', '헤파 필터', '클래스 10000 공조', '클래스 1000 공조', '클래스 10 공조']], ['측정 장비', 'mult', 0.1, ['돋보기', '광학 측정기', '표면 프로파일러', '전자 현미경', '원자간력 현미경']]],
    bigequip: [['운영 인력석', 'seat', 0.4, ['간이 책상', '운영 책상', '모니터링 책상', '제어실', '통합 관제실']], ['제어 컴퓨터', 'mult', 0.1, ['노트북', '데스크톱', '산업용 PC', '제어 서버', '실시간 제어 시스템']], ['핵심 장비', 'mult', 0.2, ['중고 장비', '보급형 장비', '신형 장비', '맞춤 장비', '세계 유일 장비']], ['예약 시스템', 'mult', 0.1, ['종이 장부', '화이트보드 일정표', '엑셀 시트', '예약 웹', '자동 스케줄러']], ['안전 설비', 'mult', 0.06, ['소화기', '안전 표지', '비상 샤워', '가스 감지기', '통합 안전 시스템']]],
    global: [['화상 회의실', 'seat', 0.4, ['노트북 카메라', '웹캠', '회의용 카메라', '화상 회의실', '홀로그램 회의실']], ['공동 서버', 'mult', 0.15, ['공유 드라이브', '클라우드 폴더', '공동 서버', '국제 클라우드', '전용 회선']], ['통역 지원', 'mult', 0.1, ['번역기', '통역 아르바이트', '번역 소프트웨어', '전문 통역사', '동시통역 부스']], ['방문 연구원 숙소', 'mult', 0.08, ['게스트하우스', '원룸', '기숙사', '서비스드 아파트', '레지던스']], ['공유 책상', 'mult', 0.06, ['접이식 책상', '공유 책상', '핫데스크', '코워킹 라운지', '라운지 오피스']]],
  };
  const EQUIP_MAX = 10, EQUIP_UNLOCK = [1, 1, 5, 10, 25], EQUIP_MUL = [2, 3, 5, 8, 12];
  // 장비 단계: 레벨 1·3·5·8·10에서 1~5단계가 되고 모습이 바뀐다. 단계가 하나 오를 때마다 그 장비 효과 +10%
  const EQ_STAGE_LV = [1, 3, 5, 8, 10];
  const eqGrade = (l) => { let g = -1; EQ_STAGE_LV.forEach((t, i) => { if (l >= t) g = i; }); return g; };
  const eqStageBonus = (g) => (g <= 0 ? 1 : 1 + 0.1 * g);
  // 방 인테리어: 방 레벨에 따라 바닥·벽·조명이 바뀐다(모습만 바뀜)
  const STYLES = [
    { lv: 1, name: '낡은 방', desc: '시멘트 바닥과 빛바랜 벽' },
    { lv: 10, name: '깔끔한 방', desc: '타일 바닥, 흰 벽, 창문 두 개' },
    { lv: 25, name: '아늑한 방', desc: '원목·카펫 바닥, 액자, 화분, 천장 조명' },
    { lv: 50, name: '세련된 방', desc: '광택 바닥, 벽 패널, 간접 조명' },
    { lv: 100, name: '최첨단 방', desc: '대리석 바닥, 유리 벽, 금색 몰딩' },
  ];
  const roomStyle = (l) => { let g = 0; STYLES.forEach((x, i) => { if (l >= x.lv) g = i; }); return g; };
  const EQ_N = 5;
  // 장비 레벨에 따른 모습 단계: 0개(-1), Lv 1~3(0), 4~6(1), 7~9(2), 10(3)

  // 대학 본관(메인 건물): 클래시 오브 클랜의 마을회관처럼 교수실 최대 레벨과 새 방을 정한다.
  // 작은 나라 지방 사립대에서 시작해 세계적 명문대가 되는 것이 최종 목표다. 승격은 공사 대기열을 쓰고 시간이 걸린다.
  const UNIVS = [
    null,
    { name: '신생 지방대', desc: '작은 나라 지방 소도시에 막 문을 연 한빛대. 정문 하나, 건물 셋.', cap: 30, needTier: 1, cost: 0, sec: 0 },
    { name: '지역 거점대', desc: '한빛대가 지역에서 손꼽히는 대학이 됐다. 서버실과 자료실 부지가 생긴다.', cap: 60, needTier: 2, cost: 1000, sec: 60 },
    { name: '연구중심대', desc: '연구비가 몰리면서 좋은 학생이 지원한다. 클린룸 부지가 생긴다.', cap: 110, needTier: 3, cost: 2e6, sec: 180 },
    { name: '국내 최상위 명문대', desc: '나라 안에서 첫손에 꼽힌다. 대형 장비실 부지가 생긴다.', cap: 170, needTier: 4, cost: 3e9, sec: 480 },
    { name: '세계적 명문대', desc: '전 세계에서 학생이 찾아온다. 국제 공동연구센터 부지가 생긴다. 이곳의 대가 랩실이 최종 목표다.', cap: 250, needTier: 4, cost: 3e11, sec: 900 },
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
  // 학생 도감: 과정별 5갈래 30명. group은 갈래, role은 배치할 수 있는 방(A 생산, B 회의실, C 교수실, M 휴게실, any 어디든)
  const CARD_GROUPS = {
    u: { name: '학부연구생', set: '데이터 생산 +10%' },
    m: { name: '석사과정', set: '회의실 용량 +10%' },
    d: { name: '박사과정', set: '데이터 생산 +15%' },
    p: { name: '포닥·연구교수', set: '교수실 용량 +15%' },
    v: { name: '해외 방문연구원', set: '연구비 +20%' },
  };
  const CARDS = [
    { id: 'u1', g: 'u', name: '열정 넘치는 학부생 김하늘', rar: 'c', role: 'A', skill: '밤샘 실험' },
    { id: 'u2', g: 'u', name: '간식 담당 학부생 최준', rar: 'c', role: 'M', skill: '야식 배달' },
    { id: 'u3', g: 'u', name: '손 빠른 학부생 이서진', rar: 'c', role: 'A', skill: '시료 정리' },
    { id: 'u4', g: 'u', name: '받아쓰기 달인 학부생 박도윤', rar: 'c', role: 'B', skill: '회의록 정리' },
    { id: 'u5', g: 'u', name: '심부름 달인 학부생 정예린', rar: 'c', role: 'C', skill: '도장 받아 오기' },
    { id: 'u6', g: 'u', name: '조기 졸업 학부생 한서윤', rar: 'r', role: 'A', skill: '자동화 스크립트' },
    { id: 'm1', g: 'm', name: '성실한 석사 강민재', rar: 'c', role: 'A', skill: '반복 실험' },
    { id: 'm2', g: 'm', name: '꼼꼼한 석사 오지후', rar: 'c', role: 'B', skill: '교정 마라톤' },
    { id: 'm3', g: 'm', name: '행정의 달인 석사 박소라', rar: 'c', role: 'C', skill: '서류 일괄 처리' },
    { id: 'm4', g: 'm', name: '분위기 메이커 석사 윤하준', rar: 'c', role: 'M', skill: '회식 기획' },
    { id: 'm5', g: 'm', name: '실험 장인 석사 정민재', rar: 'r', role: 'A', skill: '완벽한 셋업' },
    { id: 'm6', g: 'm', name: '발표왕 석사 서유나', rar: 'r', role: 'B', skill: '리허설 지도' },
    { id: 'm7', g: 'm', name: '상담가 석사 임채원', rar: 'r', role: 'M', skill: '고민 상담' },
    { id: 'd1', g: 'd', name: '밤샘 박사 조은우', rar: 'c', role: 'A', skill: '72시간 실험' },
    { id: 'd2', g: 'd', name: '그림 장인 박사 신다은', rar: 'c', role: 'B', skill: '그림 완성' },
    { id: 'd3', g: 'd', name: '논문 기계 박사 권지후', rar: 'r', role: 'B', skill: '하룻밤 원고' },
    { id: 'd4', g: 'd', name: '과제 사냥꾼 박사 윤채원', rar: 'r', role: 'C', skill: '제안서 폭격' },
    { id: 'd5', g: 'd', name: '코딩 천재 박사 황시우', rar: 'r', role: 'A', skill: 'GPU 총동원' },
    { id: 'd6', g: 'd', name: '수석 박사 강태오', rar: 'e', role: 'A', skill: '연구실 총동원' },
    { id: 'd7', g: 'd', name: '최우수 논문상 박사 송유진', rar: 'e', role: 'B', skill: '빠른 심사 요청' },
    { id: 'p1', g: 'p', name: '예산 정산 포닥 이준서', rar: 'r', role: 'C', skill: '예산 정산' },
    { id: 'p2', g: 'p', name: '연구교수 한지민', rar: 'e', role: 'C', skill: '과제 따내기' },
    { id: 'p3', g: 'p', name: '만능 포닥 오세린', rar: 'e', role: 'any', skill: '멀티태스킹' },
    { id: 'p4', g: 'p', name: '전설의 연구교수 임도현', rar: 'l', role: 'any', skill: '세기의 아이디어' },
    { id: 'p5', g: 'p', name: '편집위원 연구교수 서은비', rar: 'l', role: 'B', skill: '특집호 초청' },
    { id: 'v1', g: 'v', name: '방문연구원 레온 (독일)', rar: 'r', role: 'A', skill: '공동 실험' },
    { id: 'v2', g: 'v', name: '방문연구원 에밀리 (미국)', rar: 'r', role: 'B', skill: '공동 저자 섭외' },
    { id: 'v3', g: 'v', name: '방문연구원 하루토 (일본)', rar: 'e', role: 'A', skill: '데이터 공유' },
    { id: 'v4', g: 'v', name: '방문연구원 클레어 (프랑스)', rar: 'e', role: 'M', skill: '세미나 뒤풀이' },
    { id: 'v5', g: 'v', name: '세계적 석학 권하린', rar: 'l', role: 'C', skill: '기조연설' },
  ];
  // 강화: 같은 연구원이 또 나오면 중복 카드로 쌓이고, 중복 카드를 써서 별을 올린다. 별 1개마다 배율 +25%
  const ENHANCE_COST = [0, 1, 2, 3, 5]; // ★n → ★n+1에 필요한 중복 카드
  const STAR_MAX = 5, MAX_DUP_GEMS = 10;
  const OLD_CARD = { c1: 'm1', c2: 'm2', c3: 'm3', c4: 'm4', r1: 'm5', r2: 'u6', r3: 'd3', r4: 'd4', e1: 'd6', e2: 'd7', l1: 'p4', l2: 'v5' };
  const CARD_PITY = 10; // 영웅 이상 없이 10번 뽑으면 다음은 영웅 이상 확정

  // 일일 미션
  const MISSIONS = {
    up: { name: '방·장비 업그레이드 20번', goal: 20 },
    hire: { name: '학생 2명 모집', goal: 2 },
    cheer: { name: '야식 쏘기 5번', goal: 5 },
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
  const WEEK_GOALS = [{ papers: 50, tickets: 2, minutes: 30 }, { papers: 200, tickets: 3, minutes: 60 }, { papers: 600, tickets: 5, minutes: 120 }];
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
      builds: [], research: { lv: {}, active: null }, nextReq: 1, reqPre: ((Math.random() * 46656) | 0).toString(36), helpApplied: {}, upTotal: 0,
      cards: keep.cards || { owned: {}, dup: {}, assign: {}, skillCd: {}, pity: 0 }, tickets: keep.tickets != null ? keep.tickets : 2,
      missions: keep.missions || { day: '', prog: {}, claimed: {}, bonus: false },
      week: keep.week || { key: '', papers: 0, claimed: {} },
      ally: keep.ally || { id: null, nick: '', donated: {}, weekDonated: 0, helpGiven: 0, helps: {} },
      allyTech: keep.allyTech || {}, lifeFame: keep.lifeFame || 0,
      col: keep.col || { covers: {}, alumni: {}, visitors: {}, photos: {}, contracts: {} }, colPity: keep.colPity || 0, colNew: keep.colNew || 0,
      gems: keep.gems || 0, daily: keep.daily || { day: '', streak: 0, claimed: '', ads: 0, adBuild: 0, adBoost: 0 },
      shop: keep.shop || { starter: false, noAds: false, subUntil: '', purchases: [] }, subActive: false, deco: keep.deco || {},
      look: keep.look || { gender: null, outfit: -1, hair: -1, face: -1, prop: -1, pose: -1 }, av: keep.av || {},
      projects: { active: [], done: (keep.projects && keep.projects.done) || {} }, guideOff: !!keep.guideOff,
    };
    st.cards.assign = {}; // 새 연구실이라 배치는 다시 한다
    ROOMS.forEach((r) => { st.rooms[r.id] = r.build === 0 ? 1 : 0; st.equip[r.id] = [0, 0, 0, 0, 0]; });
    hireFree(st); hireFree(st);
    if (!st.col.photos[0]) st.col.photos[0] = 1; // 지방 사립대 기념사진
    return st;
  }
  function hireFree(st) {
    st.students.push({ name: STUDENT_NAMES[Math.floor(rnd(st) * STUDENT_NAMES.length)] + GIVEN[Math.floor(rnd(st) * GIVEN.length)], grade: 0 });
  }
  function migrate(st) {
    if (!st || typeof st !== 'object') return null;
    if (st.v === 1) st.v = 2; // v1에는 장비·연구·카드가 없다. 아래에서 기본값을 채운다
    if (st.v !== 2) return null;
    const hadUniv = typeof st.univ === 'number';
    const fresh = newGame({ laurels: st.laurels, runs: st.runs });
    Object.keys(fresh).forEach((k) => { if (st[k] === undefined) st[k] = fresh[k]; });
    ROOMS.forEach((r) => {
      if (typeof st.rooms[r.id] !== 'number') st.rooms[r.id] = r.build === 0 ? 1 : 0;
      if (!Array.isArray(st.equip[r.id])) st.equip[r.id] = [];
      while (st.equip[r.id].length < EQ_N) st.equip[r.id].push(0);
    });
    if (typeof st.univ !== 'number' || st.univ < 1 || st.univ > UNIV_MAX) st.univ = 1;
    if (!hadUniv) st.univ = Math.max(1, Math.min(UNIV_MAX - 1, st.tier)); // 본관이 없던 저장에만 직급에 맞춰 준다
    // 일부가 빠진 저장본: 하위 칸을 채운다
    ['owned', 'dup', 'assign', 'skillCd'].forEach((k) => { if (!st.cards[k] || typeof st.cards[k] !== 'object') st.cards[k] = {}; });
    if (typeof st.cards.pity !== 'number') st.cards.pity = 0;
    Object.keys(fresh.col).forEach((k) => { if (!st.col[k] || typeof st.col[k] !== 'object') st.col[k] = {}; });
    if (!st.reqPre) st.reqPre = fresh.reqPre;
    if (typeof st.upTotal !== 'number') st.upTotal = 99;
    // 예전 카드 12종 id를 새 학생 도감 id로 옮긴다
    const c = st.cards; if (!c.dup) c.dup = {};
    Object.keys(OLD_CARD).forEach((o) => {
      if (c.owned[o]) { c.owned[OLD_CARD[o]] = Math.max(c.owned[OLD_CARD[o]] || 0, c.owned[o]); delete c.owned[o]; }
      Object.keys(c.assign).forEach((r) => { if (c.assign[r] === o) c.assign[r] = OLD_CARD[o]; });
      if (c.skillCd[o] != null) { c.skillCd[OLD_CARD[o]] = c.skillCd[o]; delete c.skillCd[o]; }
    });
    if (!st.col.contracts) st.col.contracts = {};
    if (!st.look) st.look = fresh.look;
    if (!st.projects) st.projects = fresh.projects;
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
    return (EQUIP[id] || []).reduce((a, e, i) => a + (e[1] === kind ? e[2] * eqLv(st, id, i) * eqStageBonus(eqGrade(eqLv(st, id, i))) : 0), 0);
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
    const g = (1 + 0.1 * rlv(st, 'exp')) * (1 + 0.05 * tech(st, 'lab')) * (1 + colBonus(st, 'data') + avBonus(st, 'prop') + cardSet(st, 'u') + cardSet(st, 'd'));
    return producers(st).reduce((a, r) => a + perStudent(st, r.id) * (s[r.id] || 0) * buffMult(st, r.id), 0) * g;
  }
  const capOf = (st, id) => room(id).cap * lv(st, id) * Math.pow(2, Math.floor(lv(st, id) / 10)) * Math.pow(1.6, st.tier - 1) * (1 + eqSum(st, id, 'mult')) * cardMult(st, id);
  const stageB = (st) => capOf(st, 'meeting') * buffMult(st, 'meeting') * (1 + 0.1 * rlv(st, 'write')) * (1 + 0.05 * tech(st, 'seminar')) * (1 + avBonus(st, 'face') + cardSet(st, 'm'));
  const stageC = (st) => capOf(st, 'office') * buffMult(st, 'office') * (1 + 0.1 * rlv(st, 'admin')) * (1 + 0.05 * tech(st, 'office')) * (1 + avBonus(st, 'face') + cardSet(st, 'p'));
  const comfort = (st) => Math.floor((3 + 2 * lv(st, 'lounge') + eqAll(st, 'comfort') + 2 * rlv(st, 'welfare')) * cardMult(st, 'lounge') * buffMult(st, 'lounge') * (1 + avBonus(st, 'pose')));
  // 정원을 넘으면 1명당 -7%(최저 35%), 정원에 여유가 있으면 1명당 +1%(최대 130%)
  const mood = (st) => { const d = comfort(st) - st.students.length; return d >= 0 ? Math.min(CFG.moodMax, 1 + 0.01 * d) : Math.max(0.35, 1 + 0.07 * d); };
  const valueMult = (st) => Math.pow(CFG.tierValue, st.tier - 1) * (1 + CFG.libraryBonus * lv(st, 'library') + eqAll(st, 'value')) * cardMult(st, 'library') * buffMult(st, 'library') * (1 + CFG.laurelBonus * st.laurels) * (1 + 0.05 * tech(st, 'grant')) * (1 + colBonus(st, 'money') + colBonus(st, 'all') + avBonus(st, 'hair') + cardSet(st, 'v') + projBuff(st));
  const fameMult = (st) => (1 + eqAll(st, 'fame')) * (1 + 0.1 * rlv(st, 'pr')) * (1 + 0.15 * (st.univ - 1)) * (1 + colBonus(st, 'fame') + colBonus(st, 'all') + avBonus(st, 'outfit')); // 좋은 대학일수록 논문이 주목받는다
  // '연구비 N분 치' 보상은 일시 버프를 뺀 수입으로 센다(광고·독려를 겹쳐 보상을 부풀리지 못하게)
  function incomeBase(st) { const b = st.buffs; st.buffs = []; const v = flow(st).money; st.buffs = b; return v; }
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
      const ends = st.buffs.map((b) => b.until).concat(st.builds.map((b) => b.endAt), st.research.active ? [st.research.active.endAt] : [], st.projects.active.map((a) => a.endAt)).filter((u) => u > st.time);
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
    const p = (sec * eff * Math.min(1, f.mood) * (f.t > 0 ? 1 : 0)) / 30; // 논문은 30초에 1편꼴(분위기가 나쁘면 줄어든다)
    st.papers += p; st.week.papers += p;
  }
  function finishTimers(st) {
    st.builds = st.builds.filter((b) => {
      if (b.endAt > st.time) return true;
      if (b.room === 'univ') {
        st.univ = b.toLv;
        gainPhoto(st, b.toLv - 1);
        giveAvatar(st, '대학 승격');
        note(st, 'univ', '한빛대가 ' + jo(UNIVS[b.toLv].name, '으로', '로') + ' 성장했다! 교수실을 Lv ' + UNIVS[b.toLv].cap + '까지 올릴 수 있다.');
        checkEnd(st);
        return false;
      }
      st.rooms[b.room] = b.toLv;
      note(st, 'build', room(b.room).name + (b.toLv === 1 ? ' 공사를 마쳤다!' : ' Lv ' + b.toLv + ' 대공사 완료!' + (room(b.room).role === 'A' ? ' 효율 2배' : '')));
      dropCol(st, 'covers', 0.25);
      return false;
    });
    const r = st.research.active;
    if (r && r.endAt <= st.time) {
      st.research.lv[r.id] = r.toLv; st.research.active = null;
      note(st, 'research', RESEARCH[r.id].name + ' 연구 Lv ' + r.toLv + ' 완료!');
      dropCol(st, 'covers', 0.35);
    }
    finishProjects(st);
  }
  function canUpgrade(st, id) {
    if (st.ended) return '정년 퇴임 전';
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
    track(st, 'up'); st.upTotal = (st.upTotal || 0) + 1;
    const sec = bigWorkSec(st, id);
    if (sec > 0) {
      st.builds.push({ room: id, toLv: lv(st, id) + 1, endAt: st.time + sec, total: sec, reqId: 'b' + (st.reqPre || '') + st.nextReq++ });
      note(st, 'build', room(id).name + (lv(st, id) === 0 ? ' 공사를 시작했다. ' : ' 대공사를 시작했다. ') + fmtTime(sec) + ' 걸린다. 컨소시엄 동료가 도와주면 빨라진다.');
      return true;
    }
    st.rooms[id] = lv(st, id) + 1;
    return true;
  }
  // 대학 본관 승격
  function canUpgradeUniv(st) {
    if (st.ended) return '정년 퇴임 전';
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
    track(st, 'up'); st.upTotal = (st.upTotal || 0) + 1;
    st.builds.push({ room: 'univ', toLv: st.univ + 1, endAt: st.time + sec, total: sec, reqId: 'b' + (st.reqPre || '') + st.nextReq++ });
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
    track(st, 'up'); st.upTotal = (st.upTotal || 0) + 1;
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
    st.buffs.push({ target: id, mult: 2, until: st.time + 15, src: room(id).name + ' 야식' });
    st.cooldown[id] = st.time + 45;
    track(st, 'cheer');
    return true;
  }

  // ---------- 학과 연구 ----------
  function canResearch(st, id) {
    if (st.ended) return '정년 퇴임 전';
    if (st.research.active) return '다른 연구 진행 중';
    if (rlv(st, id) >= RESEARCH[id].max) return '최대';
    return st.money >= researchCost(st, id) ? true : '연구비 부족';
  }
  function startResearch(st, id) {
    if (canResearch(st, id) !== true) return false;
    st.money -= researchCost(st, id);
    const sec = researchSec(st, id);
    st.research.active = { id, toLv: rlv(st, id) + 1, endAt: st.time + sec, total: sec, reqId: 'r' + (st.reqPre || '') + st.nextReq++ };
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
    track(st, 'draw');
    if (!had) {
      st.cards.owned[pick.id] = 1;
      note(st, 'card', '[새 연구원] ' + RARITY[pick.rar].name + ' 「' + pick.name + '」 (' + CARD_GROUPS[pick.g].name + ' ' + groupCount(st, pick.g) + '/' + groupTotal(pick.g) + ')');
    } else if (had >= STAR_MAX) {
      st.gems += MAX_DUP_GEMS;
      note(st, 'card', '「' + pick.name + '」 중복 (이미 ★5). 발전기금 +' + MAX_DUP_GEMS);
    } else {
      st.cards.dup[pick.id] = (st.cards.dup[pick.id] || 0) + 1;
      note(st, 'card', '「' + pick.name + '」 중복 카드 +1 (' + st.cards.dup[pick.id] + '장). 연구원 탭에서 강화할 수 있다.');
    }
    return { card: pick, isNew: !had };
  }
  const groupCount = (st, g) => CARDS.filter((c) => c.g === g && st.cards.owned[c.id]).length;
  const groupTotal = (g) => CARDS.filter((c) => c.g === g).length;
  const groupDone = (st, g) => groupCount(st, g) >= groupTotal(g);
  const enhanceNeed = (st, id) => { const s0 = st.cards.owned[id] || 0; return s0 && s0 < STAR_MAX ? ENHANCE_COST[s0] : null; };
  const canEnhance = (st, id) => { const n = enhanceNeed(st, id); return n != null && (st.cards.dup[id] || 0) >= n; };
  function enhanceCard(st, id) {
    if (!canEnhance(st, id)) return false;
    st.cards.dup[id] -= enhanceNeed(st, id);
    st.cards.owned[id]++;
    const c = CARDS.find((x) => x.id === id);
    note(st, 'card', '「' + c.name + '」 강화! ★' + st.cards.owned[id] + ' (배율 ×' + (RARITY[c.rar].mult * (1 + 0.25 * (st.cards.owned[id] - 1))).toFixed(2) + ')');
    return true;
  }
  const anyEnhance = (st) => CARDS.some((c) => canEnhance(st, c.id));
  // 학생 도감 세트: 갈래를 다 모으면 효과
  const cardSet = (st, g) => (groupDone(st, g) ? { u: 0.1, m: 0.1, d: 0.15, p: 0.15, v: 0.2 }[g] : 0);
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
  // 빈 방 중 맞는 곳에 자동으로 배치한다
  function autoAssign(st, cid) {
    const c = CARDS.find((x) => x.id === cid); if (!c) return null;
    const r = ROOMS.find((x) => built(st, x.id) && roleFits(c, x.id) && !st.cards.assign[x.id]);
    return r && assignCard(st, cid, r.id) ? r.id : null;
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
  function refreshDay(st, day, yesterday, today) {
    if (st.missions.day !== day) st.missions = { day, prog: {}, claimed: {}, bonus: false };
    if (st.daily.day !== day) {
      st.daily.streak = st.daily.day && st.daily.day === yesterday ? st.daily.streak + 1 : 1;
      st.daily.day = day; st.daily.ads = 0; st.daily.adBuild = 0; st.daily.adBoost = 0;
    }
    st.subActive = !!st.shop.subUntil && day <= st.shop.subUntil;
  }
  function track(st, id) { st.missions.prog[id] = (st.missions.prog[id] || 0) + 1; }
  const missionDone = (st, id) => (st.missions.prog[id] || 0) >= MISSIONS[id].goal;
  function claimMission(st, id) {
    if (!missionDone(st, id) || st.missions.claimed[id]) return false;
    st.missions.claimed[id] = true; st.tickets++;
    dropCol(st, 'alumni', 0.5);
    const v = Math.max(100, incomeBase(st) * 300); st.money += v; st.totalMoney += v;
    return true;
  }
  const allMissionsClaimed = (st) => Object.keys(MISSIONS).every((k) => st.missions.claimed[k]);
  function claimMissionBonus(st) { if (!allMissionsClaimed(st) || st.missions.bonus) return false; st.missions.bonus = true; st.tickets += 2; return true; }

  // ---------- 돌발 이벤트 ----------
  const EVENTS = {
    deadline: { name: '마감 임박', text: '학회 마감이 내일이다! 회의실이 30초 동안 3배로 달린다.', apply: (st) => st.buffs.push({ target: 'meeting', mult: 3, until: st.time + 30, src: '마감 임박' }) },
    grant: { name: '과제 선정', text: '국가과제에 선정됐다! 연구비 1분 치와 연구원 모집권 1장을 받았다.', apply: (st) => { const v = Math.max(incomeBase(st) * 60, 100); st.money += v; st.totalMoney += v; st.tickets++; return v; } },
    audit: { name: '연구비 감사', text: '영수증을 정리했다. 감사를 무사히 넘겼다.', apply: () => 0, missed: (st) => st.buffs.push({ target: 'office', mult: 0.5, until: st.time + 60, src: '감사 대응' }) },
    conference: { name: '학회 시즌', text: '학회 발표가 호평을 받았다. 40초 동안 연구비 2배.', apply: (st) => st.buffs.push({ target: 'money', mult: 2, until: st.time + 40, src: '학회 시즌' }) },
  };
  function pickEvent(st) { const k = Object.keys(EVENTS); return k[Math.floor(rnd(st) * k.length)]; }
  function applyEvent(st, id) { const v = EVENTS[id].apply(st); track(st, 'event'); note(st, 'event', EVENTS[id].text); dropCol(st, 'visitors', 0.4); return v; }
  function missEvent(st, id) { if (EVENTS[id].missed) { EVENTS[id].missed(st); note(st, 'event', '감사 대응을 놓쳤다. 1분 동안 교수실 속도가 절반.'); } }

  // ---------- 컨소시엄 ----------
  // 기부: 연구비 10분 치를 내고 그 기술에 10점. 멤버 기부 점수 합으로 기술 레벨이 정해진다.
  const donateCost = (st) => Math.ceil(Math.max(100, incomeBase(st) * 600));
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
    const v = Math.max(50, incomeBase(st) * 60); st.money += v; st.totalMoney += v;
    return true;
  }
  function refreshWeek(st, key) { if (st.week.key !== key) { st.week = { key, papers: 0, claimed: {} }; st.ally.weekDonated = 0; } }
  function claimWeek(st, i, teamPapers) {
    const g = WEEK_GOALS[i];
    if (!g || st.week.claimed[i] || teamPapers < g.papers) return false;
    st.week.claimed[i] = true; st.tickets += g.tickets;
    dropCol(st, null, 1);
    const v = Math.max(500, incomeBase(st) * 60 * g.minutes); st.money += v; st.totalMoney += v;
    return true;
  }
  const power = (st) => st.tier * 1000 + Math.floor(Math.log10(1 + st.lifeFame) * 100) + st.laurels * 300;

  // ---------- 연구실 도감 ----------
  // 플레이로만 얻고 정년 퇴임해도 남는다. 항목마다 그 갈래 효과가 오르고, 다 모으면 세트 보너스.
  const COLLECTION = {
    covers: { name: '학술지 표지 논문', kind: 'fame', how: '학과 연구 완료 35%, 공사·대공사 완료 25%', set: 0.2, items: [['세포 그림 표지', 'c'], ['반도체 웨이퍼 표지', 'c'], ['은하 사진 표지', 'c'], ['단백질 구조 표지', 'c'], ['도시 지도 데이터 표지', 'c'], ['로봇 팔 표지', 'c'], ['양자 칩 표지', 'r'], ['뇌 지도 표지', 'r'], ['기후 모델 표지', 'r'], ['창간 특집호 표지', 'e'], ['올해의 논문 표지', 'e'], ['100주년 기념호 표지', 'l']] },
    alumni: { name: '졸업생 소식', kind: 'money', how: '일일 미션 보상 받기 50%', set: 0.2, items: [['중소기업 연구원', 'c'], ['스타트업 개발자', 'c'], ['공공기관 연구원', 'c'], ['고등학교 과학 교사', 'c'], ['중견기업 엔지니어', 'c'], ['박사후연구원', 'c'], ['대기업 연구소', 'r'], ['국책 연구소 선임', 'r'], ['스타트업 창업', 'r'], ['교수 임용', 'e'], ['해외 대학 교수', 'e'], ['세계적 학술상 수상', 'l']] },
    visitors: { name: '연구실 방문객', kind: 'data', how: '돌발 이벤트 처리 40%', set: 0.2, items: [['견학 온 고등학생', 'c'], ['과학 기자', 'c'], ['다른 대학 교수', 'c'], ['장비 영업사원', 'c'], ['총장', 'r'], ['해외 석학', 'r'], ['기업 연구소장', 'r'], ['장관급 인사', 'e'], ['다큐멘터리 촬영팀', 'e'], ['살아있는 전설', 'l']] },
    contracts: { name: '과제 협약서', kind: 'money', how: '과제를 처음 마칠 때 확정', set: 0.1, items: [['시제품 성능 시험 대행', 'c'], ['공정 데이터 분석 용역', 'r'], ['산학 공동연구센터', 'e'], ['스마트 센서 국산화', 'c'], ['친환경 소재 개발', 'c'], ['제조 AI 고도화', 'r'], ['바이오 진단 키트 상용화', 'r'], ['차세대 반도체 원천기술', 'e'], ['탄소중립 에너지 플랫폼', 'l']] },
    photos: { name: '대학 기념사진', kind: 'all', how: '대학 승격 때 확정', set: 0.1, items: [['신생 지방대 정문', 'c'], ['지역 거점대 본관', 'r'], ['연구중심대 시계탑', 'r'], ['국내 최상위 명문대 졸업식', 'e'], ['세계적 명문대 돔', 'l']] },
  };
  const COL_W = { c: 55, r: 30, e: 12, l: 3 }; // 갈래 안에서 등급이 뽑힐 비중
  const COL_BONUS = { c: 0.01, r: 0.02, e: 0.04, l: 0.08 };
  const COL_PITY = 4; // 중복이 4번 이어지면 다음은 그 갈래에서 아직 없는 항목
  const COL_DUP_GEMS = 5;
  const colCount = (st, g) => Object.keys(st.col[g] || {}).length;
  const colTotal = (g) => COLLECTION[g].items.length;
  const colDone = (st, g) => colCount(st, g) >= colTotal(g);
  function colBonus(st, kind) {
    if (!st.col) return 0;
    return Object.keys(COLLECTION).filter((g) => COLLECTION[g].kind === kind).reduce((a, g) => a + COLLECTION[g].items.reduce((b, it, i) => b + (st.col[g][i] ? COL_BONUS[it[1]] : 0), 0) + (colDone(st, g) ? COLLECTION[g].set : 0), 0);
  }
  // 항목 하나가 나올 확률(%): 그 등급 비중 ÷ 등급 안 항목 수
  function colRate(g, i) {
    const items = COLLECTION[g].items, r = items[i][1];
    const rs = Object.keys(COL_W).filter((k) => items.some((it) => it[1] === k));
    const tw = rs.reduce((a, k) => a + COL_W[k], 0);
    return (COL_W[r] / tw / items.filter((it) => it[1] === r).length) * 100;
  }
  function dropCol(st, group, chance) {
    if (rnd(st) >= chance) return null;
    const groups = ['covers', 'alumni', 'visitors'];
    const g = group || groups[Math.floor(rnd(st) * groups.length)];
    const items = COLLECTION[g].items;
    let idx;
    if (st.colPity >= COL_PITY && !colDone(st, g)) {
      const missing = items.map((_, i) => i).filter((i) => !st.col[g][i]);
      idx = missing[Math.floor(rnd(st) * missing.length)];
    } else {
      const rs = Object.keys(COL_W).filter((k) => items.some((it) => it[1] === k));
      let x = rnd(st) * rs.reduce((a, k) => a + COL_W[k], 0), r = rs[0];
      for (const k of rs) { if (x < COL_W[k]) { r = k; break; } x -= COL_W[k]; }
      const pool = items.map((_, i) => i).filter((i) => items[i][1] === r);
      idx = pool[Math.floor(rnd(st) * pool.length)];
    }
    return giveCol(st, g, idx);
  }
  function giveCol(st, g, idx) {
    const it = COLLECTION[g].items[idx], isNew = !st.col[g][idx];
    st.col[g][idx] = (st.col[g][idx] || 0) + 1;
    if (isNew) {
      st.colPity = 0; st.colNew++;
      note(st, 'collect', '[' + COLLECTION[g].name + '] ' + RARITY[it[1]].name + ' 「' + it[0] + '」을(를) 도감에 넣었다! (' + colCount(st, g) + '/' + colTotal(g) + ')' + (colDone(st, g) ? ' 세트 완성!' : ''));
    } else {
      st.colPity++; st.gems += COL_DUP_GEMS;
      note(st, 'collect', '[' + COLLECTION[g].name + '] 「' + it[0] + '」 중복. 발전기금 +' + COL_DUP_GEMS);
    }
    return { group: g, idx, isNew };
  }
  function gainPhoto(st, idx) { if (!st.col.photos[idx]) giveCol(st, 'photos', idx); }

  // ---------- 상점 (BM 시뮬레이션: 실제 결제·광고 없음) ----------
  // 발전기금(유료 재화)은 시간 단축·선지급·캠퍼스 장식에만 쓴다. 모집권(뽑기)과 도감은 결제로 팔지 않는다.
  const ATTEND = [10, 10, 20, 20, 30, 30, 60];
  const AD_LIMITS = { total: 10, build: 5, boost: 5 };
  const PRODUCTS = {
    starter: { name: '신임 교수 패키지', price: 1200, desc: '발전기금 100 + 캠퍼스 분수대 (1회)' },
    noads: { name: '광고 제거', price: 4400, desc: '광고 없이 광고 보상을 바로 받는다. 하루 한도는 같다 (1회)' },
    sub: { name: '연구년 정기구독', price: 5500, desc: '30일 동안 출석 때 발전기금 +20, 방치 보상 효율 50%→100%, 최대 8→12시간' },
    g60: { name: '발전기금 60', price: 1200, desc: '' },
    g330: { name: '발전기금 330', price: 5900, desc: '10% 더' },
    g700: { name: '발전기금 700', price: 12000, desc: '17% 더' },
  };
  const DECOS = {
    fountain: { name: '분수대', cost: 80, desc: '본관 앞마당에 물줄기가 오른다' },
    cherry: { name: '벚꽃길', cost: 60, desc: '캠퍼스 나무가 벚나무로 바뀐다' },
    statue: { name: '설립자 동상', cost: 120, desc: '본관 옆에 동상이 선다' },
    lamps: { name: '캠퍼스 가로등', cost: 100, desc: '연구동 둘레에 가로등이 켜진다' },
    gate: { name: '정문 아치', cost: 150, desc: '캠퍼스 입구에 아치형 정문이 생긴다' },
  };
  const ADVANCE_GEMS = 30; // 연구비 2시간 치 바로 받기
  const attendReady = (st) => !!st.daily.day && st.daily.claimed !== st.daily.day;
  const attendReward = (st) => ATTEND[(Math.max(1, st.daily.streak) - 1) % 7] + (st.subActive ? 20 : 0);
  function claimAttend(st) {
    if (!attendReady(st)) return 0;
    const v = attendReward(st); st.gems += v; st.daily.claimed = st.daily.day;
    if (((Math.max(1, st.daily.streak) - 1) % 7) + 1 === 7) st.tickets += 1;
    return v;
  }
  function adLeft(st, kind) {
    const total = AD_LIMITS.total - st.daily.ads;
    return Math.max(0, Math.min(total, AD_LIMITS[kind] - (kind === 'build' ? st.daily.adBuild : st.daily.adBoost)));
  }
  // 광고 보상: build = 진행 중인 공사·연구 하나를 15분 줄임, boost = 30분 동안 연구비 2배
  function adReward(st, kind, reqId) {
    if (adLeft(st, kind) <= 0) return false;
    if (kind === 'build') {
      const t = timerOf(st, reqId); if (!t) return false;
      t.endAt = Math.max(st.time, t.endAt - 900); st.daily.adBuild++; finishTimers(st);
    } else {
      st.daily.adBoost++;
      const cur = st.buffs.find((b) => b.src === '연구 지원금 광고' && b.until > st.time);
      if (cur) cur.until += 1800; else st.buffs.push({ target: 'money', mult: 2, until: st.time + 1800, src: '연구 지원금 광고' }); // 겹치면 시간만 늘어난다
    }
    st.daily.ads++;
    return true;
  }
  function timerOf(st, reqId) { return st.builds.find((b) => b.reqId === reqId) || (st.research.active && st.research.active.reqId === reqId ? st.research.active : null); }
  // 즉시 완료: 남은 1분마다 발전기금 1 (최소 1)
  const finishCost = (st, reqId) => { const t = timerOf(st, reqId); return t ? Math.max(1, Math.ceil((t.endAt - st.time) / 60)) : 0; };
  function finishNow(st, reqId) {
    const t = timerOf(st, reqId), c = finishCost(st, reqId);
    if (!t || st.gems < c) return false;
    st.gems -= c; t.endAt = st.time; finishTimers(st);
    return true;
  }
  function spendAdvance(st) {
    if (st.gems < ADVANCE_GEMS) return false;
    st.gems -= ADVANCE_GEMS;
    const v = Math.max(1000, incomeBase(st) * 7200); st.money += v; st.totalMoney += v;
    return v;
  }
  function buyDeco(st, id) {
    const d = DECOS[id]; if (!d || st.deco[id] || st.gems < d.cost) return false;
    st.gems -= d.cost; st.deco[id] = true;
    return true;
  }
  function mockBuy(st, sku, today, subEnd) {
    const p = PRODUCTS[sku]; if (!p) return false;
    if ((sku === 'starter' && st.shop.starter) || (sku === 'noads' && st.shop.noAds)) return false;
    if (sku === 'starter') { st.shop.starter = true; st.gems += 100; st.deco.fountain = true; }
    else if (sku === 'noads') st.shop.noAds = true;
    else if (sku === 'sub') { st.shop.subUntil = subEnd; st.subActive = true; }
    else st.gems += { g60: 60, g330: 330, g700: 700 }[sku];
    st.shop.purchases.push({ sku, price: p.price, day: today });
    return true;
  }
  const spent = (st) => st.shop.purchases.reduce((a, x) => a + x.price, 0);

  // ---------- 교수 아바타 ----------
  // 가진 아이템 하나마다 그 부위 능력치가 오른다(입지 않아도 됨). 부위를 다 모으면 +10% 더.
  // 얻는 곳: 승진·대학 승격 때 1개 확정, 과제 완료 25%, 발전기금으로 골라 사기(무작위 뽑기 없음)
  const AV_SLOTS = {
    outfit: { name: '옷', stat: '명성' },
    hair: { name: '머리', stat: '연구비' },
    face: { name: '얼굴', stat: '회의실·교수실 용량' },
    prop: { name: '소품', stat: '데이터 생산' },
    pose: { name: '자세', stat: '휴게 정원' },
  };
  const AVATARS = [
    ['outfit', 'check', '체크셔츠', 'c'], ['outfit', 'vest', '니트 조끼', 'c'], ['outfit', 'labcoat', '실험 가운', 'r'], ['outfit', 'tweed', '트위드 재킷', 'r'], ['outfit', 'suit', '정장', 'e'], ['outfit', 'gown', '학위 가운', 'l'],
    ['hair', 'neat', '단정한 머리', 'c'], ['hair', 'gray', '반백 머리', 'c'], ['hair', 'messy', '부스스한 머리', 'r'], ['hair', 'beret', '베레모', 'e'], ['hair', 'einstein', '아인슈타인 머리', 'l'],
    ['face', 'horn', '뿔테 안경', 'c'], ['face', 'dark', '다크서클', 'c'], ['face', 'reading', '돋보기 안경', 'r'], ['face', 'mustache', '콧수염', 'r'], ['face', 'gold', '금테 안경', 'e'],
    ['prop', 'tumbler', '텀블러', 'c'], ['prop', 'redpen', '빨간 펜', 'c'], ['prop', 'laser', '레이저 포인터', 'r'], ['prop', 'pen', '만년필', 'e'], ['prop', 'medal', '노벨상 메달 모형', 'l'],
    ['pose', 'turtle', '거북목', 'c'], ['pose', 'arms', '팔짱', 'c'], ['pose', 'behind', '뒷짐', 'r'], ['pose', 'straight', '꼿꼿한 자세', 'e'],
  ];
  const AV_VALUE = { c: 0.02, r: 0.04, e: 0.08, l: 0.15 }, AV_PRICE = { c: 40, r: 80, e: 160, l: 320 }, AV_SET = 0.1;
  const avSlotDone = (st, slot) => AVATARS.every((a, i) => a[0] !== slot || st.av[i]);
  function avBonus(st, slot) {
    if (!st.av) return 0;
    return AVATARS.reduce((a, x, i) => a + (x[0] === slot && st.av[i] ? AV_VALUE[x[3]] : 0), 0) + (avSlotDone(st, slot) ? AV_SET : 0);
  }
  function giveAvatar(st, why) {
    const miss = AVATARS.map((_, i) => i).filter((i) => !st.av[i]);
    if (!miss.length) { st.gems += 20; note(st, 'avatar', '아바타를 다 모았다. 대신 발전기금 +20 (' + why + ')'); return null; }
    // 일반이 잘 나오고 전설은 드물다
    const w = miss.map((i) => ({ c: 6, r: 3, e: 1.5, l: 0.6 })[AVATARS[i][3]]), t = w.reduce((a, b) => a + b, 0);
    let x = rnd(st) * t, idx = miss[miss.length - 1];
    for (let k = 0; k < miss.length; k++) { if (x < w[k]) { idx = miss[k]; break; } x -= w[k]; }
    st.av[idx] = 1;
    note(st, 'avatar', '[아바타] ' + RARITY[AVATARS[idx][3]].name + ' 「' + AVATARS[idx][2] + '」을(를) 얻었다! (' + why + ')');
    return idx;
  }
  function buyAvatar(st, idx) {
    const a = AVATARS[idx]; if (!a || st.av[idx] || st.gems < AV_PRICE[a[3]]) return false;
    st.gems -= AV_PRICE[a[3]]; st.av[idx] = 1; return true;
  }
  function wear(st, idx) {
    if (!st.av[idx]) return false;
    const slot = AVATARS[idx][0]; st.look[slot] = st.look[slot] === idx ? -1 : idx; return true;
  }
  function setGender(st, g) { st.look.gender = g === 'f' ? 'f' : 'm'; return true; }

  // ---------- 과제 ----------
  // 산학과제는 직급, 국가과제는 대학 단계가 되어야 신청한다. 국가과제는 심사에서 떨어질 수 있고, 떨어지면 신청비 절반을 돌려받는다.
  // 진행 중에는 연구비 보너스, 끝나면 연구비(그때 수입 기준 N분 치)·모집권·과제 협약서(처음 한 번).
  const PROJECTS = [
    { id: 'i1', kind: '산학과제', grade: '중소기업', name: '시제품 성능 시험 대행', tier: 1, univ: 1, dur: 300, select: 1, costMin: 0.5, rewardMin: 2, tickets: 0, buff: 0.05 },
    { id: 'i2', kind: '산학과제', grade: '중견기업', name: '공정 데이터 분석 용역', tier: 2, univ: 1, dur: 900, select: 1, costMin: 1.5, rewardMin: 6, tickets: 1, buff: 0.08 },
    { id: 'i3', kind: '산학과제', grade: '대기업', name: '산학 공동연구센터', tier: 4, univ: 1, dur: 3600, select: 1, costMin: 6, rewardMin: 24, tickets: 2, buff: 0.12 },
    { id: 'n1', kind: '국가과제', grade: '중소기업 주관', name: '스마트 센서 국산화', tier: 1, univ: 2, dur: 1200, select: 0.6, costMin: 2, rewardMin: 13, tickets: 1, buff: 0.1 },
    { id: 'n2', kind: '국가과제', grade: '중소기업 주관', name: '친환경 소재 개발', tier: 1, univ: 2, dur: 1800, select: 0.55, costMin: 3, rewardMin: 22, tickets: 1, buff: 0.1 },
    { id: 'n3', kind: '국가과제', grade: '중견기업 주관', name: '제조 AI 고도화', tier: 1, univ: 3, dur: 3600, select: 0.45, costMin: 6, rewardMin: 53, tickets: 2, buff: 0.15 },
    { id: 'n4', kind: '국가과제', grade: '중견기업 주관', name: '바이오 진단 키트 상용화', tier: 1, univ: 3, dur: 5400, select: 0.4, costMin: 9, rewardMin: 90, tickets: 2, buff: 0.15 },
    { id: 'n5', kind: '국가과제', grade: '대기업 주관', name: '차세대 반도체 원천기술', tier: 1, univ: 4, dur: 7200, select: 0.3, costMin: 12, rewardMin: 160, tickets: 3, buff: 0.2 },
    { id: 'n6', kind: '국가과제', grade: '대기업 주관', name: '탄소중립 에너지 플랫폼', tier: 1, univ: 5, dur: 10800, select: 0.25, costMin: 18, rewardMin: 290, tickets: 4, buff: 0.25 },
  ];
  const PROJ_SLOTS = [0, 1, 1, 2, 2, 3];
  const REJECT_NOTES = ['우수하나 사업 목적과 맞지 않음', '예산 규모 대비 성과 목표가 낮음', '선행 연구 실적 보완 필요', '경쟁 과제 대비 차별성 부족', '평가위원 의견: 그림이 너무 많음'];
  const proj = (id) => PROJECTS.find((x) => x.id === id);
  const projSlots = (st) => PROJ_SLOTS[st.tier];
  const projBuff = (st) => (st.projects ? st.projects.active.reduce((a, x) => a + proj(x.id).buff, 0) : 0);
  const projCost = (st, id) => Math.ceil(Math.max(30, incomeBase(st) * 60 * proj(id).costMin));
  // 국가과제 선정 확률: 대학 단계가 높을수록 오른다(단계마다 +5%p, 최대 95%)
  const projSelect = (st, id) => { const p = proj(id); return p.select >= 1 ? 1 : Math.min(0.95, p.select + 0.05 * (st.univ - p.univ)); };
  function canStartProject(st, id) {
    const p = proj(id); if (!p) return '없음';
    if (st.ended) return '정년 퇴임 전';
    if (st.tier < p.tier) return TIERS[p.tier].name + '부터';
    if (st.univ < p.univ) return UNIVS[p.univ].name + '부터';
    if (st.projects.active.some((a) => a.id === id)) return '진행 중';
    if (st.projects.active.length >= projSlots(st)) return '과제 칸 가득';
    return st.money >= projCost(st, id) ? true : '연구비 부족';
  }
  function startProject(st, id) {
    if (canStartProject(st, id) !== true) return null;
    const p = proj(id), c = projCost(st, id);
    st.money -= c;
    track(st, 'project');
    if (rnd(st) >= projSelect(st, id)) {
      const back = Math.floor(c / 2); st.money += back;
      const why = REJECT_NOTES[Math.floor(rnd(st) * REJECT_NOTES.length)];
      note(st, 'project', p.name + ' 탈락. 심사평: "' + why + '" 신청비 절반을 돌려받았다.');
      return { ok: false, why };
    }
    const sec = p.dur * timeMult(st);
    st.projects.active.push({ id, endAt: st.time + sec, total: sec });
    note(st, 'project', p.kind + ' 「' + p.name + '」 선정! ' + fmtTime(sec) + ' 동안 연구비 +' + Math.round(p.buff * 100) + '%');
    return { ok: true };
  }
  function finishProjects(st) {
    if (!st.projects) return;
    st.projects.active = st.projects.active.filter((a) => {
      if (a.endAt > st.time) return true;
      const p = proj(a.id), v = Math.max(200, incomeBase(st) * 60 * p.rewardMin);
      st.money += v; st.totalMoney += v; st.tickets += p.tickets;
      st.projects.done[a.id] = (st.projects.done[a.id] || 0) + 1;
      note(st, 'project', '「' + p.name + '」 과제 완료! 연구비 +' + fmt(v) + (p.tickets ? ', 모집권 +' + p.tickets : ''));
      const ci = PROJECTS.indexOf(p); if (!st.col.contracts[ci]) giveCol(st, 'contracts', ci);
      if (rnd(st) < 0.25) giveAvatar(st, '과제 완료');
      return false;
    });
  }

  // ---------- 실시간 가이드 ----------
  // 받침에 따라 조사를 고른다: jo('실험실', '을', '를') → '실험실을'
  const jo = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b); };
  // 지금 가장 먼저 할 일 하나를 고른다. 화면은 kind와 room을 보고 말풍선을 어디에 띄울지 정한다.
  function guide(st) {
    const f = flow(st);
    if (st.ended) return { kind: 'retire', text: '최종 목표를 이뤘어요! 정년 퇴임하고 월계관을 받으세요.' };
    if (canPromote(st)) return { kind: 'promote', text: '명성이 찼어요. ' + jo(TIERS[st.tier + 1].name, '으로', '로') + ' 승진하세요!' };
    if (canUpgradeUniv(st) === true) return { kind: 'univ', text: '대학 본관을 ' + jo(UNIVS[st.univ + 1].name, '으로', '로') + ' 승격할 수 있어요.' };
    const nb = ROOMS.find((r) => !built(st, r.id) && canUpgrade(st, r.id) === true);
    if (nb) return { kind: 'build', room: nb.id, text: nb.name + ' 부지가 열렸어요. 눌러서 공사하세요.' };
    if (f.mood < 1 && canUpgrade(st, 'lounge') === true) return { kind: 'upgrade', room: 'lounge', text: '학생이 휴게실 정원을 넘어 분위기가 ' + Math.round(f.mood * 100) + '%예요. 휴게실을 올리세요.' };
    const early = st.tier === 1 && (st.upTotal || 0) < 15; // 처음 몇 분은 핵심 반복(병목 업그레이드)부터
    if (!early) {
      if (Object.keys(MISSIONS).some((k) => missionDone(st, k) && !st.missions.claimed[k])) return { kind: 'tab', tab: 'mission', text: '끝난 미션 보상을 받으세요.' };
      if (allMissionsClaimed(st) && !st.missions.bonus) return { kind: 'tab', tab: 'mission', text: '오늘 미션을 다 끝냈어요. 보너스 모집권 2장을 받으세요.' };
      if (st.daily && st.daily.day && st.daily.claimed !== st.daily.day) return { kind: 'tab', tab: 'shop', text: '오늘 출석 보상이 있어요.' };
      if (st.tickets > 0) return { kind: 'tab', tab: 'cards', text: '모집권 ' + st.tickets + '장이 있어요. 연구원을 뽑아 보세요.' };
      if (anyEnhance(st)) return { kind: 'tab', tab: 'cards', text: '중복 카드가 모였어요. 연구원을 강화하세요.' };
      const free = CARDS.find((c) => st.cards.owned[c.id] && !Object.values(st.cards.assign).includes(c.id) && ROOMS.some((r) => built(st, r.id) && roleFits(c, r.id) && !st.cards.assign[r.id]));
      if (free) return { kind: 'assign', card: free.id, text: '「' + free.name + '」' + jo(free.name, '을', '를').slice(free.name.length) + ' 빈 방에 배치하세요.' };
    }
    // 병목: 세 단계가 비슷하면 지난번 대상을 유지해 말풍선이 이리저리 튀지 않게 한다
    const val = { A: f.a, B: f.b, C: f.c }, low = Math.min(f.a, f.b, f.c);
    const stage = st.gPrev && val[st.gPrev] <= low * 1.15 ? st.gPrev : f.bott;
    st.gPrev = stage;
    // 생산 공간은 들인 연구비 대비 늘어나는 데이터가 가장 큰 방
    const seat = seating(st);
    const prod = producers(st).map((r) => { const L = lv(st, r.id), k = (L + 1) / L * (MILESTONES.includes(L + 1) ? 2 : 1); return { r, score: (perStudent(st, r.id) * (k - 1) * (seat[r.id] || 0) + 1e-9) / upCost(st, r.id), ok: canUpgrade(st, r.id) }; })
      .filter((x) => x.ok === true || x.ok === '연구비 부족').sort((a, b) => b.score - a.score)[0];
    const target = stage === 'B' ? 'meeting' : stage === 'C' ? 'office' : (prod ? prod.r.id : producers(st).slice(-1)[0].id);
    let busy = null;
    if (stage === 'A' && canHire(st) === true) return { kind: 'hire', text: '빈자리가 있어요. 학생을 뽑으면 데이터가 늘어요.' };
    const cu = canUpgrade(st, target), tn = room(target).name;
    if (cu === true) return { kind: 'upgrade', room: target, text: (stage === 'A' ? '데이터 생산이 병목이에요. ' : jo(tn, '이', '가') + ' 병목이에요. ') + jo(tn, '을', '를') + ' 업그레이드하세요.' };
    if (typeof cu === 'string' && cu.startsWith('교수실') && canUpgrade(st, 'office') === true) return { kind: 'upgrade', room: 'office', text: jo(tn, '을', '를') + ' 더 올리려면 교수실 레벨이 필요해요. 교수실부터 올리세요.' };
    if (cu === '대학 본관 승격 필요') { const u = UNIVS[st.univ + 1]; busy = '교수실이 대학 한계예요. ' + (u && st.tier < u.needTier ? '명성을 모아 ' + jo(TIERS[u.needTier].name, '으로', '로') + ' 승진하면 본관을 승격할 수 있어요.' : '본관 승격 공사를 기다리는 중이에요.'); }
    if (cu === '공사 중') { const b = building(st, target); busy = tn + ' 대공사 중 (남은 ' + fmtTime(b.endAt - st.time) + '). 그동안 다른 일을 해 보세요.'; }
    if (stage === 'A' && canHire(st) === '자리 부족') {
      const pr = prod ? prod.r.id : target;
      const eqi = seats(st, pr) < 14 ? (EQUIP[pr] || []).findIndex((e, i) => e[1] === 'seat' && canEquip(st, pr, i) === true) : -1;
      if (eqi >= 0) return { kind: 'equip', room: pr, i: eqi, text: '자리가 꽉 찼어요. ' + jo(EQUIP[pr][eqi][0], '을', '를') + ' 늘려 좌석을 확장하세요.' };
    }
    if (early) {
      if (st.tickets > 0) return { kind: 'tab', tab: 'cards', text: '모집권 ' + st.tickets + '장이 있어요. 연구원을 뽑아 보세요.' };
    }
    if (!st.research.active && Object.keys(RESEARCH).some((k) => canResearch(st, k) === true)) return { kind: 'tab', tab: 'lab', text: (busy ? busy + ' ' : '') + '학과 연구가 쉬고 있어요.' };
    if (st.projects.active.length < projSlots(st) && PROJECTS.some((x) => canStartProject(st, x.id) === true)) return { kind: 'tab', tab: 'proj', text: (busy ? busy + ' ' : '') + '과제 칸이 비었어요.' };
    for (const r of ROOMS) { if (!built(st, r.id)) continue; const i = EQUIP[r.id].findIndex((_, k) => canEquip(st, r.id, k) === true && eqCost(st, r.id, k) < st.money * 0.3); if (i >= 0) return { kind: 'equip', room: r.id, i, text: (busy ? busy + ' ' : '') + r.name + '의 ' + jo(EQUIP[r.id][i][0], '을', '를') + ' 싸게 올릴 수 있어요.' }; }
    if (busy) return { kind: 'wait', room: target, short: busy.split('.')[0], text: busy };
    const need = cu === '연구비 부족' ? upCost(st, target) - st.money : 0;
    if (need > 0 && f.money > 0) return { kind: 'wait', room: target, short: tn + ' · 약 ' + fmtTime(need / f.money), text: tn + ' 업그레이드까지 연구비를 모으는 중 (약 ' + fmtTime(need / f.money) + ')' };
    return { kind: 'wait', room: target, short: '잘 돌아가는 중', text: '연구실이 잘 돌아가고 있어요.' };
  }

  // ---------- 승진과 정년 ----------
  const nextNeed = (st) => (st.tier < LAST ? CFG.fameNeed[st.tier + 1] : Infinity);
  const canPromote = (st) => st.tier < LAST && st.fame >= nextNeed(st);
  function promote(st) {
    if (!canPromote(st)) return false;
    st.tier++; st.promotedAt.push({ tier: st.tier, time: st.time });
    st.tickets += 2;
    dropCol(st, null, 1);
    giveAvatar(st, '승진');
    checkEnd(st);
    return true;
  }
  const laurelReward = (st) => 3 + Math.min(5, Math.floor(Math.log10(Math.max(1, st.fame / CFG.fameNeed[LAST])) * 2));
  function retire(st) {
    if (!st.ended) return null;
    st.cards.skillCd = {}; // 새 연구실은 시계가 0부터라 쿨다운을 비운다
    st.projects.active.forEach((a) => { a.endAt = st.time; }); finishTimers(st); // 진행 중인 과제는 퇴임 때 마무리한다
    const keep = { laurels: st.laurels + laurelReward(st), runs: st.runs + 1, cards: st.cards, tickets: st.tickets, missions: st.missions, week: st.week, ally: st.ally, allyTech: st.allyTech, lifeFame: st.lifeFame, col: st.col, colPity: st.colPity, colNew: st.colNew, gems: st.gems, daily: st.daily, shop: st.shop, deco: st.deco, look: st.look, av: st.av, projects: st.projects, guideOff: st.guideOff };
    return newGame(keep);
  }

  // 앱을 닫아 둔 시간: 최대 8시간, 효율 50%. 공사·연구 타이머는 그대로 흐른다.
  function offline(st, seconds) {
    const raw = typeof seconds === 'number' && isFinite(seconds) ? seconds : 0;
    const capH = st.subActive ? 12 : CFG.offlineCapH, eff = st.subActive ? 1 : CFG.offlineEff;
    const s = Math.min(Math.max(0, raw), capH * 3600);
    const before = { money: st.totalMoney, fame: st.fame };
    if (s > 0 && !st.ended) {
      const n = 40, dt = s / n;
      for (let i = 0; i < n; i++) { gain(st, flow(st), dt, eff); st.time += dt; finishTimers(st); }
      st.buffs = st.buffs.filter((b) => b.until > st.time); // 버프는 지워지지 않고 비운 시간만큼 줄어든다
    }
    // 오프라인 동안에도 실제 시간은 흐르므로, 상한을 넘긴 시간만큼 타이머만 더 진행한다
    if (raw > s) { st.time += raw - s; finishTimers(st); }
    return { seconds: s, capped: raw > capH * 3600, capH, eff, money: st.totalMoney - before.money, fame: st.fame - before.fame };
  }

  return {
    COLLECTION, COL_W, COL_BONUS, COL_PITY, COL_DUP_GEMS, colCount, colTotal, colDone, colBonus, colRate, dropCol, giveCol,
    CARD_GROUPS, ENHANCE_COST, STAR_MAX, groupCount, groupTotal, groupDone, enhanceNeed, canEnhance, enhanceCard, anyEnhance, cardSet,
    AV_SLOTS, AVATARS, AV_VALUE, AV_PRICE, AV_SET, avSlotDone, avBonus, giveAvatar, buyAvatar, wear, setGender,
    PROJECTS, PROJ_SLOTS, projSlots, projBuff, projCost, projSelect, canStartProject, startProject, guide,
    ATTEND, AD_LIMITS, PRODUCTS, DECOS, ADVANCE_GEMS, attendReady, attendReward, claimAttend, adLeft, adReward, finishCost, finishNow, spendAdvance, buyDeco, mockBuy, spent,
    EQ_STAGE_LV, eqStageBonus, STYLES, roomStyle,
    CFG, TIERS, LAST, ROOMS, MILESTONES, EQUIP, EQUIP_MAX, EQUIP_UNLOCK, EQ_N, UNIVS, UNIV_MAX, MAXLV, eqGrade, eqLook, placeName, canUpgradeUniv, upgradeUniv, RESEARCH, RARITY, CARDS, CARD_PITY, MISSIONS, ALLY_TECH, WEEK_GOALS, HELP_MAX, GRADES, EVENTS, fmt, fmtTime,
    newGame, migrate, tick, flow, room, lv, unlocked, built, seats, seating, maxStudents, perStudent, capOf, comfort, mood, valueMult, maxLevel, building, buildSlots, bigWorkSec,
    upCost, hireCost, canUpgrade, upgrade, canHire, hire, encourage, eqLv, eqCost, canEquip, upgradeEquip, cardMult,
    rlv, researchCost, researchSec, canResearch, startResearch, drawCard, cardRate, roleFits, assignCard, autoAssign, unassignCard, useSkill, jo,
    refreshDay, missionDone, claimMission, allMissionsClaimed, claimMissionBonus, pickEvent, applyEvent, missEvent,
    allyTechLevel, donateCost, donate, helpRequests, applyHelps, giveHelp, refreshWeek, claimWeek, power,
    nextNeed, canPromote, promote, laurelReward, retire, offline, buffMult, tech,
  };
});
