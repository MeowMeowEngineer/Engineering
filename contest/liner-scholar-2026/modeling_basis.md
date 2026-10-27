# 모델링 근거 표 (논문 "해석 모델" 절용)

표시: [검증] 이번 조사에서 원문·서지를 확인함 / [서지만] 서지 확인, 본문 미확인 / [확인 필요] 기억이나 2차 자료 기반

## 1. 인체 모형: 단순 형상과 해부학 모형
| 선택 | 근거 | 상태 |
|---|---|---|
| 해부학적 voxel 모형이 전신·국부 SAR 연구의 표준 | Bakker JF, Paulides MM, Christ A, Kuster N, van Rhoon GC. Assessment of induced SAR in children exposed to electromagnetic plane waves between 10 MHz and 5.6 GHz. Phys Med Biol 2010;55(11):3115–3130 (정정 2011;56:2883). 아동 6명·성인 2명 해부학 모형, 평면파 12방향. 소아 전신 SAR이 기준 레벨 노출에서 기본 제한을 최대 45% 초과, 국부 10 g은 모두 제한 이내, 최대값은 신체 돌출부 | [검증] (초록) |
| Virtual Family (Duke, Ella, Billie, Thelonious) | Christ A et al. The Virtual Family—development of surface-based anatomical models of two adults and two children for dosimetric simulations. Phys Med Biol 2010;55:N23–N38 | [확인 필요] |
| 단순 형상(균질 타원체 등)은 보수적 추정에 쓰임 | Hirata A, Ito N, Fujiwara O, Nagaoka T, Watanabe S. Conservative estimation of whole-body-averaged SARs in infants with a homogeneous and simple-shaped phantom in the GHz region. Phys Med Biol 2008;53(24):7215, doi:10.1088/0031-9155/53/24/014. 표면적이 같은 근육 등가 타원체가 1–6 GHz에서 전신 평균 SAR을 보수적으로(크게) 줌. 투영 면적이 같은 타원체는 과소평가 | [검증] (초록) |
| 피부·지방·근육 층 구조를 넣는 이유 | Christ A, Samaras T, Klingenböck A, Kuster N. Characterization of the electromagnetic near-field absorption in layered biological tissue in the frequency range from 30 MHz to 6,000 MHz. Phys Med Biol 2006;51(19):4951–4965. 층 구조에서 근역장 흡수가 균질 모형과 달라짐 | [서지만] |
| 고전적 단순 모형 계보 | Durney CH, Massoudi H, Iskander MF. Radiofrequency Radiation Dosimetry Handbook, 4th ed., USAF SAM-TR-85-73, 1986 (장구형 인체 모형) | [확인 필요] |

**논문에서의 위치**: 이 연구의 원기둥·구 층 모형은 Hirata 2008 계열의 "단순 형상 보수적 추정"에 해당한다. 해부학 voxel 모형(CST Voxel Family) 평면파 결과로 차이를 확인한다(진행 중). 단순 모형의 몸통 모서리 국부 SAR 최댓값은 Bakker 2010의 "돌출부 최대" 관찰과 같은 현상이지만 직각 모서리 때문에 과장될 수 있어 영역별로 따로 보고한다.

## 2. 조직 물성
| 선택 | 근거 | 상태 |
|---|---|---|
| 2.45 GHz 조직 유전율·도전율 | Gabriel S, Lau RW, Gabriel C. The dielectric properties of biological tissues: III. Parametric models for the dielectric spectrum of tissues. Phys Med Biol 1996;41:2271–2293 / IT'IS Foundation Tissue Properties Database | [확인 필요] 값은 DB에서 다시 뽑을 것 |
| 조직 밀도 | IT'IS Tissue Properties Database | [확인 필요] |

## 3. 전자레인지
| 선택 | 근거 | 상태 |
|---|---|---|
| 기준 제품 치수 (삼성 MS23K3513AW: 외형 489×275×374, 캐비티 330×211×324, 회전접시 Ø288, 800 W) | 삼성전자 공식 사양 페이지 (samsung.com/ae, MS23K3513AW/SG); 유통사 사양표와 일치 | 확인 (2026-10-27) |
| 누설 시험 부하: 물 275 ± 15 mL, 20 ± 5 °C, 내경 약 8.5 cm 600 mL 저형 비커, 회전판 중앙, 최대 출력 | 21 CFR 1030.10(c) | [검증] → 모델의 물 원기둥을 지름 85 mm, 높이 48.5 mm로 맞출 것 (현재 Ø90 × 43) |
| 누설 기준 1 mW/cm²(출고 전) / 5 mW/cm²(사용 중), 외부 표면 5 cm 이상 | 21 CFR 1030.10(c)(1) | [검증] |
| 문 타공판 구멍 지름 0.6–1.8 mm, 판 두께 0.10–0.35 mm | US4051341A (Microwave oven door screen) | [검증] (특허 요약) |
| λ/4 초크 깊이 약 20–35 mm (2450 MHz), 흡수체 삽입 설계 | US8455803B2 (Wave choke device for a microwave oven door) | [검증] (특허 요약) |
| 유리–금속 메쉬–수지 적층 문 | US5973305A, CA1038045A | [검증] (특허 요약) |
| 정상 제품 누설은 상한의 약 1% | BfS 전자레인지 안내 페이지 | [확인 필요] (페이지 직접 열람 못 함) |
| 유리·붕규산 유전율 | 문헌값 필요 (소다석회 εr 6–7.5, 붕규산 εr 약 4.6) | [확인 필요] |

## 4. 출력이 제품마다 다른 문제
- 국내 판매 단독형은 대체로 700 W(20 L 보급형)부터 1,000 W 이상(대용량)까지 있다 [확인 필요: 다나와 등 사양표로 범위 확정].
- **보정 모드**(5 cm 누설을 정상 1% / 법정 상한으로 맞춤)는 출력과 무관하다. 누설 기준 자체가 출력과 상관없는 절대값이기 때문이다.
- **물리 모드**(마그네트론 출력을 넣어 실제 누설 예측)는 누설 전력이 출력에 비례한다(선형 해석). 그래서 1 W당 결과를 구하고 700 / 800 / 1,000 / 1,200 W를 표 한 줄씩으로 보고한다. 추가 해석은 필요 없다.
- 출력 정의: 조리 출력은 IEC 60705 측정법 기준 [확인 필요]. 소비전력(예: 1,150 W)과 다르다.

## 5. SAR 계산과 기준
| 선택 | 근거 | 상태 |
|---|---|---|
| 1 g / 10 g 평균 방법 | IEC/IEEE 62704-1 (CST SAR 후처리 옵션) | [서지만] |
| 국내 기준값 (일반인 전신 0.08 W/kg, 머리·몸통 1 g 1.6 W/kg, 2.45 GHz 전력밀도 10 W/m²) | 과기정통부 「전자파 인체보호기준」 고시 | [확인 필요] 고시 원문 |
| 국제 비교 | ICNIRP 2020 가이드라인 | [확인 필요] |
