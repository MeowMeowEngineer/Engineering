# 평면파 전신·국부 SAR 비교 문헌 노트 (2–2.45 GHz, 성인·어린이 인체 모형)

작성일: 2026-10-20. 대상: 전자레인지 누설 SAR 소논문의 CST 평면파 결과(성인 1.72 m·74.2 kg, 어린이 1.13 m·22.3 kg, 정면 입사)와 비교할 수 있는 발표 수치.

## 0. 확인 방법과 한계

- 웹 페이지·PDF 직접 열람은 실패했다. WebFetch는 iopscience.iop.org에서 DNS 오류(getaddrinfo ENOTFOUND)를 냈고, curl로 받으려던 Aalto 저장소의 Uusitupa 2010 전문 PDF는 프록시가 막았다(CONNECT 403). 아래 내용은 모두 **WebSearch 결과에 나온 발췌와 요약**을 근거로 한다. 이 요약은 검색 도구가 PubMed, IOP, OSTI, ResearchGate, 저장소 페이지를 읽고 만든 것이라 문장이 원문 그대로라는 보장은 없다.
- 확인 수준 표기
  - **A 초록 문장**: 검색 결과에 초록 문장이 인용부호로 나왔고, 다른 검색에서 같은 문장이 다시 나왔다(PubMed/IOP/OSTI/저장소).
  - **B 초록 요지**: 검색 요약이 초록 내용을 풀어 썼다. 문장을 그대로 보지는 못했다.
  - **C 2차 인용**: 다른 논문·리뷰·ICNIRP 문서가 그 논문을 인용한 문장으로만 확인했다.
  - 서지(권·호·쪽·DOI)는 따로 표기한다. "DOI 미확인"은 검색 결과에서 DOI 문자열을 보지 못했다는 뜻이다.
- **핵심 한계**: "1 W/m²당 전신 SAR(W/kg)" 같은 **절대 수치는 어느 논문에서도 검색 결과로 확인하지 못했다.** 확인된 것은 대부분 "기준레벨 노출에서 기본제한 0.08 W/kg을 몇 % 넘는다 / 넘지 않는다"는 상대값과 정성적 결론이다. 아래 3절의 W/kg 환산값은 그 백분율에 0.08 W/kg을 곱해 내가 계산한 값이며 논문에 적힌 숫자가 아니다.
- 기준레벨 참고: ICNIRP 2020의 2 GHz 이상 전신 노출 입사 전력밀도 기준레벨은 30분 평균 10 W/m²다(기존 노트 `references_verified.md` 2.2절). 1998판도 2–300 GHz에서 10 W/m²이고 400 MHz–2 GHz에서는 주파수에 따라 올라간다고 알고 있으나, 이번 검색에서 1998 원문은 확인하지 않았다(조사자 지식). 아래 Kodera 외 2005의 "2 GHz의 둘째 봉우리는 기준레벨 증가 때문"이라는 설명이 이 구조와 맞는다. 따라서 2 GHz와 2.45 GHz 결과는 같은 10 W/m²에서 비교하는 셈이다.

## 1. 요약표

| # | 문헌 | 모형·조건 | 확인된 결론(2–2.45 GHz 관련) | 수치 | 확인 수준 |
|---|---|---|---|---|---|
| 1 | Wang 외 2006 PMB | 일본 성인 해부 모형 + 축소 어린이 모형, 30 MHz–3 GHz | 어린이 모형의 기준레벨 노출 전신 SAR이 공진 주파수와 **2 GHz 대역**에서 기본제한을 넘음 | 약 30 % 초과 ("nearly 30%") | B (PubMed·OSTI 요약 반복) |
| 2 | Kodera, Hirata, Wang, Fujiwara 2005 IEICE 기술보고 | 성인·어린이, 직육면체 모형 비교 | 기준레벨 노출 전신 SAR은 두 봉우리(수십 MHz 공진, **2 GHz**). 2 GHz 봉우리는 기준레벨 증가 때문이고 크기는 모형 표면적이 좌우 | 5세 모형 첨두 23 % 초과 | A (IEICE 초록 페이지) |
| 3 | Hirata, Kodera, Wang, Fujiwara 2007 Bioelectromagnetics | 해부 모형, 균질 모형, 직육면체 | GHz 영역 봉우리는 주로 **모형 표면적**이 결정, 공진 영역은 조직 전기 특성 | 없음 | A (PubMed 초록) |
| 4 | Dimbylow & Bolch 2007 PMB | UF Series B 소아 팬텀(9개월–14세), 50 MHz–4 GHz | 5세·1세 모형에서 ICNIRP 일반인 기준레벨이 전신 SAR 제한을 보수적으로 보장하지 못함. 다른 문헌 인용: "1 GHz 이상, 8세 미만" | 없음 | B (OSTI 요약) + C |
| 5 | Dimbylow, Bolch, Lee 2010 PMB | UF 신생아 팬텀, 20 MHz–6 GHz | 기준레벨이 **700–2450 MHz**에서 모든 조사 방향에 대해 초과됨 | 없음 | B (PubMed/PMC 요약 2회) |
| 6 | Nagaoka, Kunieda, Watanabe 2008 PMB | 3·5·7세 일본 어린이(성인 모형 변형), 30 MHz–3 GHz | 기본제한 0.08 W/kg에 해당하는 입사 전계를 구함. 결과 수치는 미확인 | 미확인 | B |
| 7 | Conil 외 2008 PMB | 성인 6명 + 형태 변환한 5·8·12세, 20 MHz–2.4 GHz, 정면 입사 수직 편파 | 성인 모형 간 전신 SAR 표준편차 최대 약 40 %. 어린이 결론 문장은 미확인 | SD 40 % | B |
| 8 | Kühn, Jennings, Christ, Kuster 2009 PMB | 6세–대형 성인, 6방향 × 2편파 | ICNIRP 2009 성명이 이 논문 등을 근거로 "키 1.3 m 미만, 공진 영역과 1–4 GHz, 최악 조건에서 기본제한보다 최대 40 % 높을 수 있음"이라고 씀 | 최대 40 % | C |
| 9 | Hirata, Ito, Fujiwara 2009 PMB | 영유아 모형 | **2 GHz 이상에서 수직 편파(VP) 전신 SAR < 수평 편파(HP)**. 원인은 입사 전계에 수직인 체표면적 성분 | 없음 | A/B (PubMed·IOP 요약) |
| 10 | Uusitupa, Laakso, Ilvonen, Nikoskinen 2010 PMB | 15개 복셀 모형(18–105 kg), 300 MHz–5 GHz, 720회 계산 | 가장 작은 모형(약 20 kg)은 기준레벨에서 전신 기본제한 초과, 일부 성인도 근접. 성인 2–5 GHz에서 HP > VP. 질량 영향은 2–5 GHz에서 큼. 균질 모형은 약 2 GHz에서 과소평가. 첨두 10 g 제한은 한 번도 넘지 않음 | 없음 | A (OSTI/PubMed 초록 문장) |
| 11 | Bakker 외 2010 PMB | 어린이 6명 + 성인 2명, 12개 직교 평면파, 10 MHz–5.6 GHz | 어린이 전신 SAR 기본제한이 간혹 초과, **작은 어린이에서 최대 45 %**. 최대 10 g SAR은 모든 경우 제한 이하 | 45 %; 확장 불확도 53 % (wb), 58 % (10 g) | A (TU/e·EUR 저장소 초록) |
| 12 | Piuzzi 외 2011 IEEE Trans EMC | 7세, 13세, 성인(해부 축척), 900 MHz–3 GHz | 작은 모형일수록 전신 SAR 큼. 성인은 기준레벨에서 기본제한 이하, **어린이는 1.8–2.4 GHz에서 초과** | 없음 | A (Sapienza IRIS 초록) |
| 13 | Nagaoka & Watanabe 2019 IEEE Access | ICRP 기준 1·5·10세 복셀 모형, 10 MHz–6 GHz | 어린이 전신 SAR이 ICRP 기준 성인 모형보다 40–50 % 높고(리뷰는 40–60 %), 기준레벨에서 기본제한을 최대 20 % 초과. ICNIRP 2020은 "최대 16 %"로 인용 | 20 % (16 %) | C (리뷰·ICNIRP 인용, 상충) |
| 14 | ICNIRP 2009 성명, ICNIRP 2018 초안 부록 A, ICNIRP 2020 | 지침 문서 | 위 결과를 인정하면서도 일반인 축소계수에 비해 작다고 보고 소아 평면파 시나리오 때문에 기준레벨을 바꾸지 않음 | 40 %, 45 % 인용 | B/C |
| 15 | Flintoft 외 2014 PMB | 성인 자원자 60명, 잔향실 측정, 1–12 GHz | 방향·편파 평균 흡수단면적(ACS) 0.15–0.4 m², 1 GHz 이상에서 체표면적(BSA)과 상관이 가장 강함, 정비례는 5 GHz 이상에서만 성립 | 0.15–0.4 m² | A (White Rose 저장소 초록) |
| 16 | Hirata 외 2008 PMB (영아) | 9개월 영아 + 균질 타원체, 1–6 GHz | 표면적이 같은 타원체는 보수적(과대) 추정, 정면 투영면적이 같은 타원체는 과소 추정. 체형에 따른 변동 약 15 % | 15 % | A (PubMed/IOP 요약) |

## 2. 항목별 상세

### 2.1 성인 인체 모형의 전신 평균 SAR (요청 1)

**결론: 2–2.45 GHz에서 1 W/m²당 성인 전신 SAR의 절대값은 확인하지 못했다.** 확인된 것은 "성인은 기준레벨 10 W/m²에서 0.08 W/kg 이하, 일부는 근접"이라는 정성적 결과다.

- **Uusitupa 외 2010** (Aalto/헬싱키공대). 확인 수준 A. 검색 결과에 OSTI·PubMed 초록 문장이 그대로 인용됐다.
  - "The polarization of the incident electric field may have an effect of several dB on whole-body SAR. Between 2 and 5 GHz for adults, whole-body SAR is higher for horizontal than for vertical polarization, if the incoming direction is in the azimuth plane."
  - "A homogenized model underestimates whole-body SAR, especially at approximately 2 GHz."
  - "The basic restriction of whole-body SAR, set by ICNIRP, is exceeded in the smallest models (approximately 20 kg) at the reference level of exposure, but also some adult phantoms are close to the limit. The peak 10 g SAR limits were never exceeded in the studied cases."
  - 같은 초록(검색 요약): 질량(18–105 kg)이 전신 SAR에 주는 영향은 약 2–5 GHz와 수직 편파 300 MHz에서, 수평 편파 300–900 MHz보다 크다. GHz 대역에서 자세의 영향은 작다. ICNIRP 기준레벨을 특히 2–5 GHz에서 낮추도록 권고했다(마지막 내용은 검색 요약 1회, B).
  - 모형별·주파수별 W/kg 표는 **미확인**(전문 필요).
- **Dimbylow 2002**. 확인 수준 B. NORMAN 2 mm 해상도로 100 MHz–3 GHz 전신 평균 SAR을 계산했고, 10·5·1세 축소 모형도 포함했다. 전신 SAR 제한과 발목 국부 SAR 제한에서 외부 전계를 역산해 NRPB·ICNIRP 기준레벨과 비교했다. 초록에 남은 결론은 "접지 조건에서 다리 국부 SAR에 대해 ICNIRP 기준레벨이 보수적이지 않다"이다. 2 GHz 성인 수치는 **미확인**.
- **Dimbylow, Hirata, Nagaoka 2008**. 확인 수준 B. NORMAN·NAOMI(영국 HPA)와 TARO·HANAKO(일본 NICT)를 정면 입사 수직 전계, 30 MHz–3 GHz, 비접지 조건으로 세 기관이 계산했다. 높은 주파수에서는 조직, 특히 **피부와 지방**의 유전율 지정 방식과 SAR 계산 알고리즘이 차이를 만든다. 차이의 크기는 **미확인**. 저자 목록이 저장소 기록(Dimbylow, Hirata, Nagaoka)과 연구자 페이지(Dimbylow, Hirata, Fujiwara)에서 다르다. PubMed/IOP 기록은 Nagaoka로 나온다.
- **Conil 외 2008**. 확인 수준 B. 성인 모형 6개로 5·8·12세 어린이를 형태 변환했고, 20 MHz–2.4 GHz에서 정면 입사 수직 편파로 계산했다. 검색 요약: 성인 모형 간 전신 SAR 표준편차가 약 40 %까지 된다. 같은 요약의 "all phantoms were within ICNIRP reference levels"는 뜻이 분명하지 않다. 어린이 2.4 GHz 결론은 **미확인**.
- **Piuzzi 외 2011**. 확인 수준 A(초록). "for adult exposure to fields in compliance with reference levels promulgated by ICNIRP and IEEE-2005 guidelines, the resulting SAR values are lower than the basic restrictions, as expected."
- **Nagaoka 외 2004**(TARO·HANAKO 개발 논문). 서지만 확인했다. 평면파 전신 SAR 수치는 **미확인**.
- **Findlay & Dimbylow**(자세 연구 2005, 앉은 자세 10 MHz–3 GHz): 서지와 범위만 확인(C). 2.45 GHz 수치는 **미확인**.
- **성인 흡수단면적 측정값(참고, 2.3절)**: Flintoft 외 2014는 성인 60명의 방향·편파 평균 ACS를 0.15–0.4 m²로 보고했다(A). 전신 SAR = ACS × 입사 전력밀도 / 체중이므로 성인 크기의 ACS 범위로 쓸 수 있다. 다만 이 값은 **모든 방향 평균**이라 정면 입사 단일 평면파와 같지 않다.

### 2.2 어린이 모형: 기준레벨에서 0.08 W/kg 근접·초과 (요청 2)

**결론: 여러 독립 연구가 같은 결론을 낸다. 1–3 GHz, 특히 2 GHz 부근 기준레벨 노출에서 작은 어린이 모형의 전신 SAR은 0.08 W/kg에 근접하거나 넘는다. 초과 폭은 약 16–45 %로 보고됐다. 성인은 같은 조건에서 제한 이하다.**

- **Wang, Fujiwara, Kodera, Watanabe 2006**. 확인 수준 B(PubMed 16912372 요약, OSTI 요약 반복). 일본 성인 해부 모형과 축소 어린이 모형을 FDTD로 계산했다. 먼저 유전체 구와 Mie 이론으로 PML 사용 규칙을 정했다. "the whole-body average SAR under the ICNIRP reference level exceeds the basic safety limit nearly 30% for the child model both in the resonance frequency and 2 GHz band." 어린이 모형의 나이·키, 2 GHz 수치는 **미확인**.
- **Kodera, Hirata, Wang, Fujiwara 2005** (IEICE 기술연구보고 EMCJ2005-116). 확인 수준 A(IEICE 초록 페이지). 기준레벨 노출의 전신 SAR은 이중 봉우리를 가진다. 첫째는 수십 MHz의 전신 공진, 둘째는 "the second at 2GHz caused by the increased reference level"이다. "the calculated peak SAR for a 5-year-child model exceeds the safety limit specified in the guideline by 23%." "the peak absorption at GHz band is affected by the model surface area." 학술지가 아니라 기술보고이므로 원고에서는 보조 인용으로 쓴다.
- **Dimbylow & Bolch 2007**. 확인 수준 B(OSTI 요약) + C. UF Series B 소아 팬텀(9개월–14세), 50 MHz–4 GHz 평면파. 5세·1세 모형에서 ICNIRP 일반인 기준레벨이 전신 SAR 제한을 보수적으로 보장하지 못한다. 900 MHz 이상은 더 촘촘한 격자로 추가 계산했다. Dimbylow 외 2010의 초록 또는 서론(검색 요약. 어느 쪽인지 미확인, C): "above ~1 GHz, the ICNIRP reference level does not provide a conservative estimate of the whole-body averaged SAR restriction for children younger than 8 years." 초과 %는 **미확인**.
- **Dimbylow, Bolch, Lee 2010** (신생아). 확인 수준 B. "the reference level is also breached in the range 700 to 2450 MHz by all of the irradiation geometries considered." 250 MHz 공진 부근에서도 보수적이지 않다. 해상도 2·1·0.5 mm를 비교했다. 신생아이므로 원고의 1.13 m 어린이보다 훨씬 작다.
- **Nagaoka, Kunieda, Watanabe 2008**. 확인 수준 B. 3·5·7세 일본 어린이 비율로 성인 모형을 변형했다(2 mm, 51개 조직). 축소 성인 모형과 비교했고 기본제한 0.08 W/kg에 해당하는 입사 전계를 제시했다. 수치는 **미확인**.
- **Hirata, Ito, Fujiwara 2009**. 확인 수준 A/B. "the whole-body averaged specific absorption rate (WBSAR) for plane-wave exposure with a vertically aligned electric field is smaller than that with a horizontally aligned electric field for frequencies above 2 GHz." 차이는 주로 입사 전계에 수직인 체표면적 성분 때문이다(PubMed 요약, B). 영아 모형 대상이다. 같은 연구실의 IEICE 2010 보고(B): 9개월·신생아 모형에서 수평 편파가 더 크고, 1–3 GHz에서 값이 거의 평탄하다.
- **Uusitupa 외 2010**: 2.1절. 약 20 kg 모형이 기준레벨에서 초과(A). 키 약 1.2 m 어린이의 입사 방향 효과는 성인과 비슷하다(300 MHz 수평 편파 제외).
- **Bakker 외 2010**. 확인 수준 A(TU/e·EUR 저장소 초록). FDTD로 어린이 6명과 성인 2명에 12개 직교 평면파를 계산했다. "The basic restriction on the SARwb is occasionally exceeded for children, up to a maximum of 45% in small children." "The maximum SAR10g values, usually found at body protrusions, remain under the limit for all scenarios studied." 확장 불확도는 SARwb 53 %, SAR10g 58 %. 저자들은 ICNIRP 기준레벨의 "fine tuning"이 필요할 수 있다고 썼다. 45 %가 나온 주파수·방향·모형은 **미확인**이다. 2011년 정오표(그림 3·4 오타, 불확도 산정 설명 추가)가 있다(검색 요약 1회).
- **Piuzzi, Bernardi, Cavagnaro, Pisa, Lin 2011**. 확인 수준 A. "The results showed that the whole-body averaged SARs are higher in the smaller (child) models. ... However, the basic restrictions are exceeded for child exposures between 1.8 and 2.4 GHz." 신체 치수로 전신 SAR을 구하는 경험식도 제안했다(식 자체는 미확인).
- **Kühn, Jennings, Christ, Kuster 2009**. 확인 수준 C. 6세 어린이부터 대형 성인 남성까지, 6방향 × 2편파 평면파(B). 결과는 ICNIRP 2009 성명의 인용으로만 봤다.
- **Nagaoka & Watanabe 2019**. 확인 수준 C, 수치가 상충한다. ICRP 기준 1·5·10세 복셀 모형, 10 MHz–6 GHz. 리뷰(MDPI Electronics 11(4):511, 2022)와 검색 요약에 따르면 어린이 전신 SAR이 ICRP 기준 성인 모형보다 40–50 %(리뷰 표현 40–60 %) 높고, 기준레벨 노출에서 기본제한을 최대 20 % 넘는다. ICNIRP 2020은 이 논문을 "standard child models ... at most 16%"로 인용했다(검색 요약). 원문 확인 전에는 "약 20 % 이내"로만 쓰는 것이 안전하다.
- **ICNIRP 2009 성명** (Health Phys 97(3):257–258). 확인 수준 B/C. 검색 결과의 성명 PDF 발췌: "... induced SARs could be up to 40% higher than the current basic restriction ..." 조건(공진 영역과 1–4 GHz, 키 1.3 m 미만 ≈ 8세 이하, 최악 조건)과 "일반인 축소계수에 비하면 작다"는 평가는 검색 요약으로만 확인했다. ICNIRP 2018 초안 부록 A는 같은 성명을 "given the same external field, the child whole body average SAR can be 40% higher than those of adults (ICNIRP Statement, 2009)"로 인용하고 "Bakker et al., (2010) reported similar (but slightly higher) enhancements (45%)"를 덧붙였다. 즉 "기본제한보다 40 % 높다"와 "성인보다 40 % 높다"가 문서마다 다르게 쓰였다. 원고에는 "최대 약 40 %"와 출처만 쓰고, 무엇에 비해 40 %인지는 원문을 확인한 뒤 적는다.
- **ICNIRP 2020**. 확인 수준 B(발췌 1회). "ICNIRP has thus not altered the reference levels to account for the resultant SAR elevation in the small-child, plane-wave scenario."
- **문헌이 드는 원인**
  - GHz 대역 흡수는 체표면 근처에서 일어나고 흡수량이 체표면적에 비례한다(Hirata 외 2007, Kodera 외 2005, Nagaya 외 2008). 체중당 표면적이 큰 어린이는 같은 전력밀도에서 전신 평균 SAR이 커진다. "표면적/질량 비"라는 표현은 Hirata, Asano, Fujiwara 2008(체온 논문)에 나온다(2.3절).
  - "skin depth(침투 깊이)" 자체를 원인으로 든 문장은 **검색에서 확인하지 못했다**. 비슷한 근거로 Hirata 외 2013 초록이 IEEE C95.1(2006)의 설명("radio-wave energy is absorbed around the body surface when the frequency is increased")을 소개한다(B).

### 2.3 GHz 대역 전신 SAR과 체표면적/질량 (요청 3)

- **Hirata, Kodera, Wang, Fujiwara 2007**, Bioelectromagnetics 28(6):484–487. 확인 수준 A(PubMed 17486582 초록). 해부 모형, 균질 인체형 모형, 직육면체 모형을 비교했다. 공진 영역의 흡수 봉우리는 조직의 전기적 특성에 크게 좌우되고, **GHz 영역의 봉우리는 주로 모형의 표면적이 좌우한다.** 이 절의 핵심 인용이다.
- **Nagaya, Hirata, Fujiwara, Nagaoka, Watanabe 2008** (IEICE 논문지 B, 일본어, J91-B). 확인 수준 B. 일본 성인·어린이 해부 모형의 2 GHz 원역장 노출에서 **흡수단면적과 체표면적의 강한 상관**을 확인했다. 같은 키·체중·표면적의 균질 모형과 직육면체에서도 상관이 성립한다. 이를 근거로 키, 체중, 입사 전력밀도로 전신 평균 SAR을 예측하는 식과 불확도를 제시했다. 식의 계수와 쪽수는 **미확인**(저장소 PDF: nitech.repo.nii.ac.jp/record/5372/files/J91-B_199.pdf). 같은 주제의 영어 제목 "Correlation between absorption cross section and body surface area of human for far-field exposure at GHz bands"가 IEICE 기술보고 EMCJ2006-81과 IEEE 학회 논문(infona 기록 ieee-art-000004305723)으로 검색에 나온다. 제1저자 표기(Nagaya / Miwa)가 검색 결과마다 다르고 학회명·연도도 **미확인**이다. 0.3–2 GHz에서 흡수단면적과 체표면적의 상관을 보였다는 요지만 2차로 확인했다(C).
- **Hirata, Ito, Fujiwara, Nagaoka, Watanabe 2008** (영아, PMB 53(24):7215–7223). 확인 수준 A/B. 9개월 영아 모형과 근육 2/3 균질 회전타원체·타원체, 1–6 GHz. 정면 투영면적이 같은 타원체는 전신 SAR을 **과소**, **표면적이 같은** 타원체는 보수적(과대)으로 추정한다. 체형에 따른 변동은 약 15 %다. 흡수가 투영면적보다 표면적을 따른다는 근거다.
- **Hirata, Ito, Fujiwara 2009**: 2.2절. 편파 차이를 "입사 전계에 수직인 체표면적" 성분으로 설명한다(B).
- **Hirata, Asano, Fujiwara 2008** (PMB 53(18):5223–5238). 확인 수준 B. 기본제한 수준(전신 SAR 0.08 W/kg)에서 3세 어린이 팬텀의 심부 체온 상승은 0.03 °C로 성인 여성보다 35 % 작았고, 저자들은 이를 어린이의 큰 **체표면적 대 질량 비**로 설명했다. 이 비는 SAR이 아니라 **방열** 쪽 설명이다. 원고에는 "같은 전력밀도에서 SAR은 어린이가 크지만, 같은 SAR에서 체온 상승은 어린이가 작다"는 두 방향을 함께 쓰는 것이 공정하다.
- **Flintoft, Robinson, Melia, Dawson, Marvin 2014**. 확인 수준 A(저장소 초록). 성인 60명, 1–12 GHz. "Average ACS of all subjects was found to vary from 0.15 to 0.4 m²". 개인별 ACS는 1–6 GHz에서 주파수가 오를수록 줄어든다. "the strongest correlation is with body surface area (BSA) at all frequencies above 1 GHz, however direct proportionality to BSA is not established until above 5 GHz." ACS/BSA(흡수 효율)는 피하지방 두께 추정치와 음의 상관을 보인다(ResearchGate 요약, B). 원고 팬텀의 지방층 두께 가정이 결과에 영향을 준다는 근거가 된다.
- **Bamba, Joseph, Vermeeren, Thielens, Tanghe, Martens 2014** (PMB 59(23):7435–). 확인 수준 B. 1.45–5.8 GHz 확산장 노출에서 입사 전력밀도와 체중만으로 전신 SAR을 구하는 식(타원체 모형 기반)을 냈다. Virtual Family 3 GHz FDTD와 비교한 확산장 오차는 6세 남아 약 −39 %, 34세 남성 약 +11 %였고, 질량이 클수록 정확했다. 확산장이라 정면 평면파와 직접 비교할 수는 없다. 저자 목록은 검색 요약 1회로만 확인했다.
- **ICNIRP 2018 초안 부록 A**(최종판 아님). 확인 수준 B. 전신 평균 SAR이 입사 전력밀도와 체표면에 대략 비례하며, 이것이 전신 기준레벨을 300 GHz까지 연장한 근거라는 취지다. 최종 2020판의 문장은 **미확인**.
- **내 계산(문헌 수치 아님)**: 원고 결과를 흡수단면적으로 바꾸면 ACS = SAR_wb × 체중 / S다. 성인 0.352 m²(V)·0.385 m²(H), 어린이 0.166 m²(V)·0.197 m²(H). Du Bois 식(키·체중)으로 구한 체표면적은 성인 1.87 m², 어린이 0.83 m²로, 실제 팬텀 형상의 표면적과는 다를 수 있다. 이 BSA로 나눈 ACS/BSA는 성인 0.19–0.21, 어린이 0.20–0.24로 거의 같다. 체중당 BSA 비(어린이/성인)는 1.47이고, 원고의 전신 SAR 비(어린이/성인)는 1.56(V)·1.70(H)이다. 흡수가 체표면적을 따른다는 Hirata 계열의 설명과 맞는다. 성인 정면 입사 ACS 0.35–0.39 m²는 Flintoft의 방향 평균 0.15–0.4 m² 범위의 위쪽 끝이다. 서 있는 사람은 정면이 머리·발 방향보다 넓은 단면을 보이므로 정면 값이 평균보다 큰 것은 자연스럽다. 다만 이 마지막 판단은 내 추론이다.

### 2.4 첨두 10 g SAR, 2.45 GHz 평면파 (요청 4)

**결론: 2.45 GHz(또는 2 GHz) 평면파 1 W/m²나 10 W/m²에서의 첨두 10 g SAR 수치는 검색으로 확인하지 못했다.** 확인된 것은 "기준레벨 노출에서 10 g 국부 제한은 넘지 않는다"는 정성적 결론뿐이다.

- **Uusitupa 외 2010** (A): "The peak 10 g SAR limits were never exceeded in the studied cases." 당시 비교 기준은 ICNIRP 1998 일반인 머리·몸통 2 W/kg, 사지 4 W/kg(10 g)으로 보인다. 어느 제한과 비교했는지는 **미확인**.
- **Bakker 외 2010** (A): "The maximum SAR10g values, usually found at body protrusions, remain under the limit for all scenarios studied." 확장 불확도 58 %. "돌출부(body protrusions)"는 원고의 1 g 첨두가 팔 끝에서 나온 것과 같은 경향이다.
- **Kühn 외 2009** (B/C, ResearchGate 단편): 전신 노출에서는 10 g 평균 SAR이 덜 제한적인 지표였다.
- **ICNIRP 2018 초안 부록 A** (B): 10 g 정육면체 평균은 6 GHz까지 적절하고 "applicable even for plane wave exposures".
- **참고(평면파 아님)**: Findlay & Dimbylow 2010(PMB 55(15):N405–N411, 10세 앉은 자세 복셀, Wi-Fi 2.4 GHz 근처장, A): 역F 안테나 100 mW, 듀티 0.1, 34 cm에서 몸통 최대 국부 SAR 3.99 mW/kg, 머리 최악 조건(100 mW, 듀티 1) 5.7 mW/kg. 송신 전력 기준이라 W/m²당 값으로 바꿀 수 없다.

## 3. 원고 결과와 문헌 비교

원고 값(1 W/m²당) × 10 W/m²(2–300 GHz 기준레벨)로 환산했다. 문헌 W/kg 값은 "기본제한 0.08 W/kg × (1 + 초과율)"로 **내가 계산한 값**이다.

| 항목 | 원고 결과 | 문헌 | 판정 |
|---|---|---|---|
| 성인 전신 SAR @ 10 W/m² | 0.0475 (V)–0.0519 (H) W/kg = 기본제한의 59–65 % | 성인은 기준레벨에서 기본제한 이하(Piuzzi 2011), 일부 성인은 근접(Uusitupa 2010). 성인 모형 간 SD 최대 약 40 %(Conil 2008). 절대 수치 미확인 | **범위 안**(정성적 일치). 근접 사례보다는 낮은 쪽이지만, 정면 입사만 계산했으므로 방향·편파 최악값은 아니다 |
| 어린이 전신 SAR @ 10 W/m² | 0.0743 (V)–0.0884 (H) W/kg = 기본제한의 93–110 % | 작은 어린이는 기본제한 근접 또는 초과. 초과율 약 16–20 %(Nagaoka & Watanabe 2019, ICRP 표준 체형), 23 %(Kodera 2005, 5세 첨두), 약 30 %(Wang 2006, 2 GHz 대역), 최대 40 %(ICNIRP 2009, 최악 조건), 최대 45 %(Bakker 2010) → 환산 0.093–0.116 W/kg. 1.8–2.4 GHz 초과(Piuzzi 2011), 약 20 kg 모형 초과(Uusitupa 2010) | **범위 안, 낮은 쪽**. H 편파 +10 %는 표준 체형의 "최대 16–20 %"보다 작고, 최악 조건 40–45 %보다 확실히 작다. 문헌 최대값은 여러 방향·편파·마른 체형과 2 GHz 봉우리 근처를 포함하므로, 정면 입사·2.45 GHz인 원고가 낮게 나오는 것은 예상과 맞다 |
| 어린이/성인 전신 SAR 비 | 1.56 (V), 1.70 (H) | ICRP 기준 체형에서 어린이가 성인보다 40–50 % 높음(Nagaoka & Watanabe 2019, 2차 인용. 리뷰는 40–60 %) | **약간 높은 쪽**(+56–70 % 대 +40–60 %). 원고 어린이 모형의 체중당 표면적(BSA/질량 비 1.47배)으로 설명된다 |
| 편파 | H > V (성인 +9 %, 어린이 +19 %) | 2 GHz 이상에서 VP < HP(Hirata 2009, 영아). 성인 2–5 GHz에서 HP > VP(Uusitupa 2010, 방위면 입사) | **일치** |
| 흡수의 표면적 의존 | ACS/BSA 성인 0.19–0.21, 어린이 0.20–0.24(내 계산) | GHz 흡수는 표면적이 지배(Hirata 2007), 1 GHz 이상에서 ACS–BSA 상관 최강(Flintoft 2014) | **일치**(정성적) |
| 성인 흡수단면적 | 0.35–0.39 m²(정면) | 방향·편파 평균 0.15–0.4 m²(Flintoft 2014, 성인 60명 측정) | **범위 안, 위쪽 끝**(정면 입사이므로 자연스럽다) |
| 첨두 10 g SAR @ 10 W/m² | 성인 0.47–0.63 W/kg, 어린이 0.47–0.77 W/kg (2 W/kg의 24–39 %) | 기준레벨에서 10 g 제한 미초과(Uusitupa 2010, Bakker 2010). 절대 수치 미확인 | **정성적 일치**. 수치 비교 불가 |
| 첨두 1 g SAR | 0.062–0.21 W/kg per W/m² | 비교 문헌 없음. 돌출부에서 최대가 나온다는 경향만 Bakker 2010과 같음 | 비교 불가 |

정리:
- 원고의 성인 전신 SAR은 "성인은 기준레벨에서 제한 이하"라는 문헌 결론과 맞다.
- 원고의 어린이 결과(정면 입사 수평 편파에서 기본제한 +10 %)는 문헌의 "작은 어린이는 2 GHz 부근 기준레벨에서 기본제한에 근접하거나 넘는다(+16–45 %)" 범위의 낮은 쪽에 든다.
- 원고에서 조심할 점
  1. 문헌 초과율은 대부분 2 GHz(기준레벨이 10 W/m²에 도달하는 봉우리)나 여러 방향 중 최악값이다. 원고는 2.45 GHz 정면 입사 하나다.
  2. Uusitupa는 균질 모형이 약 2 GHz에서 과소평가한다고 보고했고, Dimbylow 외 2008과 Flintoft 2014는 피부·지방 처리가 결과를 바꾼다고 했다. 원고 팬텀은 층 구조라 균질 모형보다는 낫지만 해부 모형이 아니다.
  3. 전자레인지 누설은 평면파가 아니라 문 틈 근처의 불균일장이다. 다중 평면파 연구(Kientega 외 2011, 2.4 GHz)는 정면 단일 평면파가 최악 조건이 아니며 변동이 ±25 %라고 보고했다.

## 4. 원고에 쓸 문장 제안

- "같은 입사 전력밀도에서 어린이 모형의 전신 평균 SAR은 성인보다 56–70 % 컸다. GHz 대역 흡수가 체표면적에 비례한다는 선행 연구(Hirata 외, 2007; Flintoft 외, 2014)와 맞으며, 어린이의 체중당 체표면적이 성인보다 약 1.5배 크기 때문으로 해석된다."
- "기준레벨 10 W/m²로 환산하면 성인 0.047–0.052 W/kg, 어린이 0.074–0.088 W/kg이다. 작은 어린이의 전신 SAR이 2 GHz 부근 기준레벨 노출에서 기본제한 0.08 W/kg을 넘을 수 있다는 보고(Wang 외, 2006; Bakker 외, 2010; Uusitupa 외, 2010; Piuzzi 외, 2011)와 같은 경향이고, 초과 폭(최대 10 %)은 보고된 범위(최대 약 20–45 %)보다 작다."
- 제한 문장: "선행 연구의 최대값은 여러 입사 방향·편파와 해부학적 모형을 포함한 반면, 본 연구는 단순 층 구조 팬텀에 정면 평면파 하나만 계산했다."

## 5. 참고문헌 (서지 원문, 확인 수준)

1. Wang, J., Fujiwara, O., Kodera, S., & Watanabe, S. (2006). FDTD calculation of whole-body average SAR in adult and child models for frequencies from 30 MHz to 3 GHz. Physics in Medicine and Biology, 51(17), 4119–4127. https://doi.org/10.1088/0031-9155/51/17/001 (PMID 16912372) [서지: 검색 결과 2회(연구자 목록 + IOP URL). 내용: B]
2. Kodera, S., Hirata, A., Wang, J., & Fujiwara, O. (2005). Double-humped frequency characteristics and peak value estimation of whole-body average SAR due to far-field exposure at ICNIRP reference level. IEICE Technical Report, 105(454), EMCJ2005-116, 11–16. https://ken.ieice.org/ken/paper/20051209tAhe/eng/ [서지·내용: A, 기술보고]
3. Hirata, A., Kodera, S., Wang, J., & Fujiwara, O. (2007). Dominant factors influencing whole-body average SAR due to far-field exposure in whole-body resonance frequency and GHz regions. Bioelectromagnetics, 28(6), 484–487. https://doi.org/10.1002/bem.20335 (PMID 17486582) [서지: KAKEN·연구자 목록·Wiley URL. 내용: A]
4. Dimbylow, P., & Bolch, W. (2007). Whole-body-averaged SAR from 50 MHz to 4 GHz in the University of Florida child voxel phantoms. Physics in Medicine and Biology, 52(22), 6639–6649. https://doi.org/10.1088/0031-9155/52/22/006 (PMID 17975288) [서지: 참고문헌 목록 + EMF-Portal. 내용: B/C]
5. Dimbylow, P., Bolch, W., & Lee, C. (2010). SAR calculations from 20 MHz to 6 GHz in the University of Florida newborn voxel phantom and their implications for dosimetry. Physics in Medicine and Biology, 55(5), 1519–1530. (PMID 20157229, PMC3927542) [DOI 미확인. 내용: B]
6. Dimbylow, P. J., Hirata, A., & Nagaoka, T. (2008). Intercomparison of whole-body averaged SAR in European and Japanese voxel phantoms. Physics in Medicine and Biology, 53(20), 5883–5897. https://doi.org/10.1088/0031-9155/53/20/022 (PMID 18827316) [세 번째 저자가 자료에 따라 Nagaoka/Fujiwara로 다름. Nagaoka 쪽이 다수. 내용: B]
7. Dimbylow, P. J. (2002). Fine resolution calculations of SAR in the human body for frequencies up to 3 GHz. Physics in Medicine and Biology, 47(16), 2835–2846. https://doi.org/10.1088/0031-9155/47/16/301 (PMID 12222849) [내용: B]
8. Nagaoka, T., Kunieda, E., & Watanabe, S. (2008). Proportion-corrected scaled voxel models for Japanese children and their application to the numerical dosimetry of specific absorption rate for frequencies from 30 MHz to 3 GHz. Physics in Medicine and Biology, 53(23), 6695–6711. https://doi.org/10.1088/0031-9155/53/23/004 (PMID 18997264) [내용: B, 수치 미확인]
9. Conil, E., Hadjem, A., Lacroux, F., Wong, M. F., & Wiart, J. (2008). Variability analysis of SAR from 20 MHz to 2.4 GHz for different adult and child models using finite-difference time-domain. Physics in Medicine and Biology, 53(6), 1511–1525. https://doi.org/10.1088/0031-9155/53/6/001 [내용: B]
10. Kühn, S., Jennings, W., Christ, A., & Kuster, N. (2009). Assessment of induced radio-frequency electromagnetic fields in various anatomical human body models. Physics in Medicine and Biology, 54(4), 875–890. https://doi.org/10.1088/0031-9155/54/4/004 [서지: 참고문헌 목록 검색 요약. 내용: C]
11. Hirata, A., Ito, N., & Fujiwara, O. (2009). Influence of electromagnetic polarization on the whole-body averaged SAR in children for plane-wave exposures. Physics in Medicine and Biology, 54(4), N59–N65. https://doi.org/10.1088/0031-9155/54/4/N02 (PMID 19141885) [내용: A/B]
12. Uusitupa, T., Laakso, I., Ilvonen, S., & Nikoskinen, K. (2010). SAR variation study from 300 to 5000 MHz for 15 voxel models including different postures. Physics in Medicine and Biology, 55(4), 1157–1176. https://doi.org/10.1088/0031-9155/55/4/017 (PMID 20107250) [내용: A]
13. Bakker, J. F., et al. (2010). Assessment of induced SAR in children exposed to electromagnetic plane waves between 10 MHz and 5.6 GHz. Physics in Medicine and Biology, 55(11), 3115–3130. https://doi.org/10.1088/0031-9155/55/11/009 (PMID 20463374). Corrigendum: Physics in Medicine and Biology, 56, 2883 (2011). [제1저자 J. F. Bakker만 검색 결과로 확인. 공저자(Paulides, Christ, Kuster, van Rhoon으로 기억)는 원문 대조 필요. 정오표 서지는 검색 요약 1회. 내용: A]
14. Piuzzi, E., Bernardi, P., Cavagnaro, M., Pisa, S., & Lin, J. C. (2011). Analysis of adult and child exposure to uniform plane waves at mobile communication systems frequencies (900 MHz–3 GHz). IEEE Transactions on Electromagnetic Compatibility, 53(1), 38–47. https://doi.org/10.1109/TEMC.2010.2053376 [DOI는 검색 요약 1회. 내용: A]
15. Nagaoka, T., & Watanabe, S. (2019). Development of voxel models adjusted to ICRP reference children and their whole-body averaged SARs for whole-body exposure to electromagnetic fields from 10 MHz to 6 GHz. IEEE Access, 7, 135909–135916. (IEEE Xplore document 8834784) [DOI 미확인. 내용: C, 수치 상충]
16. Hirata, A., Asano, T., & Fujiwara, O. (2008). FDTD analysis of body-core temperature elevation in children and adults for whole-body exposure. Physics in Medicine and Biology, 53(18), 5223–5238. https://doi.org/10.1088/0031-9155/53/18/025 [내용: B]
17. Hirata, A., Ito, N., Fujiwara, O., Nagaoka, T., & Watanabe, S. (2008). Conservative estimation of whole-body-averaged SARs in infants with a homogeneous and simple-shaped phantom in the GHz region. Physics in Medicine and Biology, 53(24), 7215–7223. https://doi.org/10.1088/0031-9155/53/24/014 (PMID 19043178) [내용: A/B]
18. Nagaya, Y., Hirata, A., Fujiwara, O., Nagaoka, T., & Watanabe, S. (2008). 人体の吸収断面積と体表面積の相関性に基づくGHz帯全身平均SARの予測式と不確定性. 電子情報通信学会論文誌 B, J91-B. (저장소 PDF https://nitech.repo.nii.ac.jp/record/5372/files/J91-B_199.pdf) [저자 일본어 표기, 이니셜, 호, 쪽 미확인(파일명으로 보아 199쪽 시작 추정). 내용: B]
19. Flintoft, I. D., Robinson, M. P., Melia, G. C. R., Dawson, J. F., & Marvin, A. C. (2014). Average absorption cross-section of the human body measured at 1–12 GHz in a reverberant chamber: results of a human volunteer study. Physics in Medicine and Biology, 59(13), 3297–3317. https://doi.org/10.1088/0031-9155/59/13/3297 [내용: A]
20. Bamba, A., Joseph, W., Vermeeren, G., Thielens, A., Tanghe, E., & Martens, L. (2014). A formula for human average whole-body SARwb under diffuse fields exposure in the GHz region. Physics in Medicine and Biology, 59(23), 7435–. https://doi.org/10.1088/0031-9155/59/23/7435 [끝 쪽 미확인, 저자 목록은 검색 요약 1회. 내용: B]
21. Hirata, A., et al. (2013). The relationship between specific absorption rate and temperature elevation in anatomically based human body models for plane wave exposure from 30 MHz to 6 GHz. Physics in Medicine and Biology, 58(4), 903–921. [공저자(Laakso, Oizumi, Hanatani, Chan, Wiart로 기억)와 DOI 미확인. 내용: B]
22. International Commission on Non-Ionizing Radiation Protection (2009). ICNIRP statement on the "Guidelines for limiting exposure to time-varying electric, magnetic, and electromagnetic fields (up to 300 GHz)". Health Physics, 97(3), 257–258. https://www.icnirp.org/cms/upload/publications/ICNIRPStatementEMF.pdf [DOI 미확인. 내용: B/C]
23. International Commission on Non-Ionizing Radiation Protection (2020). Guidelines for limiting exposure to electromagnetic fields (100 kHz to 300 GHz). Health Physics, 118(5), 483–524. https://www.icnirp.org/cms/upload/publications/ICNIRPrfgdl2020.pdf [서지: 기존 노트 `references_verified.md`. 이 노트의 인용 문장: B, 발췌 1회]
24. ICNIRP (2018-07-11). Draft ICNIRP Guidelines, Appendix A (public consultation draft). https://www.icnirp.org/cms/upload/consultation_upload/ICNIRP_RF_Guidelines_PCD_Appendix_A_2018_07_11.pdf [초안. 최종판 대신 인용하지 말 것]
25. Findlay, R. P., & Dimbylow, P. J. (2010). SAR in a child voxel phantom from exposure to wireless computer networks (Wi-Fi). Physics in Medicine and Biology, 55(15), N405–N411. https://doi.org/10.1088/0031-9155/55/15/N01 [내용: A, 평면파 아님]
26. Kientega, T., Conil, E., Hadjem, A., Richalot, E., Gati, A., et al. (2011). A surrogate model to assess the whole body SAR induced by multiple plane waves at 2.4 GHz. Annals of Telecommunications, 66, 419–428. https://doi.org/10.1007/s12243-011-0261-z [나머지 저자 미확인. 연도는 검색 결과마다 2011/2012로 다름. 내용: B]
27. Nagaoka, T., Watanabe, S., Sakurai, K., Kunieda, E., Watanabe, S., Taki, M., & Yamanaka, Y. (2004). Development of realistic high-resolution whole-body voxel models of Japanese adult males and females of average height and weight, and application of models to radio-frequency electromagnetic-field dosimetry. Physics in Medicine and Biology, 49(1), 1–15. [서지만 확인(EMF-Portal), 평면파 수치 미확인]

## 6. 남은 미확인 항목

1. 2–2.45 GHz 성인 해부 모형(NORMAN, TARO, Duke 등)의 1 W/m²당 전신 SAR 절대값. Uusitupa 2010, Dimbylow 외 2008, Conil 2008의 그림·표가 필요하다. Uusitupa 2010 전문은 Aalto 저장소에 있다(https://aaltodoc.aalto.fi/server/api/core/bitstreams/d9d3c64b-1baf-4aab-bdda-cc1701d00a8d/content). 이 환경에서는 열리지 않았다.
2. Bakker 2010의 45 % 초과가 나온 주파수·모형·입사 방향, 2.45 GHz 부근 값.
3. ICNIRP 2009 성명과 ICNIRP 2020의 어린이 관련 원문 문장. 특히 "40 %"가 기본제한 대비인지 성인 대비인지, ICNIRP 2020이 인용한 Nagaoka & Watanabe 2019 값(16 % 대 20 %).
4. Nagaya 외 2008 예측식의 계수(키·체중 → 전신 SAR). 원고 모형에 대입하면 독립 검증이 된다.
5. 2.45 GHz 평면파에서의 첨두 10 g SAR 절대값(W/kg per W/m²).
6. Dimbylow 외 2010(신생아), Nagaoka & Watanabe 2019, Hirata 외 2013, ICNIRP 2009 성명의 DOI.
7. Conil 2008 초록의 어린이 관련 결론과 "all phantoms were within ICNIRP reference levels"의 정확한 뜻.
