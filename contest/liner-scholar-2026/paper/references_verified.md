# 인용 사실·서지 검증 노트 (전자레인지 누설 SAR 소논문)

작성: 2026-10-20. 대상 원고: `paper_draft.md` ("작동 중인 전자레인지 앞에 서 있으면 해로울까?").

## 0. 확인 방법과 한계

이 환경에서는 웹 페이지와 PDF를 직접 열 수 없었다. WebFetch는 모든 주소에서 DNS 오류가 났다. curl은 프록시에서 거부됐다(law.go.kr, rra.go.kr, emf.kca.kr, ecfr.gov, govinfo.gov, ncbi.nlm.nih.gov, icnirp.org, webstore.iec.ch, bfs.de, bag.admin.ch, itis.swiss, niremf.ifac.cnr.it, mdpi.com, doi.org, crossref, utexas.edu 등). 따라서 확인은 거의 모두 **검색엔진 결과(요약과 발췌)**로 했다. 예외로, PyPI에서 받은 공개 패키지 `ossdbs` 0.5.8의 소스에 실린 Gabriel 4-Cole-Cole 매개변수로 2.45 GHz 물성을 직접 계산했다(4절).

확인 수준 표기
- **원문**: 원문 페이지나 PDF를 직접 열람함. 이번 조사에서는 해당 없음.
- **원문(발췌)**: 검색 결과에 원문 조문·표·초록 문장이 그대로 인용되어 나온 것을 봄. 페이지 전체는 보지 못함.
- **초록**: 초록 또는 서지 레코드(PubMed, 출판사, 학회 페이지)의 내용을 검색 결과로 확인함.
- **2차 인용**: 다른 기관 안내, 다른 논문, 언론, 검색 요약이 전한 값.
- **미확인**: 찾지 못했거나 출처끼리 어긋남. 무엇이 빠졌는지 적었다.
- **조사자 계산**: 확인된 값으로 직접 계산한 값.

원고에 인용하기 전에 **원문 열람이 필수인 항목**: 국내 고시 별표 1·3 원문, IEC 60335-2-25 32절, 조직 물성 표, ICNIRP 2020 표 2·5·6.

---

## 1. 논문에 쓰는 기준값 요약표

| 구분 | 값 | 단위 | 조건 | 출처 | 확인 수준 |
|---|---|---|---|---|---|
| 국내 일반인 전신 평균 SAR | 0.08 | W/kg | 100 kHz–10 GHz | 전자파인체보호기준(과기정통부고시 제2019-4호) 별표 3, 국립전파연구원 안내 페이지 | 2차 인용 |
| 국내 일반인 국부 SAR, 머리·몸통 | 1.6 | W/kg | 임의 조직 1 g 평균 최댓값 | 같음 | 2차 인용 |
| 국내 일반인 국부 SAR, 사지 | 4 | W/kg | 10 g 평균 최댓값 | 같음 | 2차 인용 |
| 국내 직업인 SAR (참고) | 0.4 / 8 / 20 | W/kg | 전신 / 머리·몸통 / 사지 | 같음 | 2차 인용 |
| 국내 일반인 전자파강도, 2–300 GHz | E 61, H 0.16, B 0.20, S 10 | V/m, A/m, μT, W/m² | 전신노출 | 같은 고시 별표 1, 국립전파연구원 안내 | 2차 인용 |
| 국내 기준의 평균 시간 | 미확인 | | | | 미확인 |
| ICNIRP 2020 일반인 전신 평균 SAR | 0.08 | W/kg | 30분 평균 | ICNIRP 2020, Health Phys 118(5):483–524 | 원문(발췌) |
| ICNIRP 2020 일반인 국부 SAR, 머리·몸통 | 2 | W/kg | 10 g 정육면체, 6분 평균, 100 kHz–6 GHz | 같음(표 2), ITU-R SM.2452-1 요약표 | 원문(발췌) + 2차 인용 |
| ICNIRP 2020 일반인 국부 SAR, 사지 | 4 | W/kg | 10 g 정육면체, 6분 평균, 100 kHz–6 GHz | 같음(표 2) | 원문(발췌) |
| ICNIRP 2020 일반인 전신 기준레벨, 2–300 GHz | S_inc 10 | W/m² | 30분, 전신 공간 평균 | 같음(표 5) | 2차 인용 |
| ICNIRP 2020 일반인 국부 기준레벨, 2–6 GHz | 40 (추정) | W/m² | 6분 | 같음(표 6) | 미확인 (2차 문헌의 "2–6 GHz에서 전신 기준의 4배"만 확인) |
| 21 CFR 1030.10 판매 전 | 1 (=10 W/m²) | mW/cm² | 외면에서 5 cm 이상 모든 점 | eCFR / govinfo CFR | 원문(발췌) |
| 21 CFR 1030.10 판매 후(사용 중) | 5 (=50 W/m²) | mW/cm² | 같음 | 같음 | 원문(발췌) |
| 21 CFR 시험 부하 | 275 ± 15 mL 수돗물, 초기 20 ± 5 °C | | 최대 출력, 600 mL 저형 비커(내경 약 8.5 cm) | 같음 | 원문(발췌) |
| IEC 60335-2-25 누설 상한 | 50 | W/m² | 외면에서 50 mm 이상 | IEC 60335-2-25 32절(AS/NZS 60335.2.25 인용 2차 자료) | 2차 인용 |
| IEC 60335-2-25 시험 부하 | 미확인 | | | | 미확인 |
| KC 60335-2-25 누설 상한 | 미확인 | | | 국가기술표준원고시 제2022-16호(시행 2022-02-16)로 검색됨 | 고시 존재만 2차 인용 |

환산(조사자 계산, Z0 = 376.7 Ω, S = E_rms²/Z0)
- 0.5 W/m² → E_rms 13.7 V/m, 50 W/m² → 137 V/m, 10 W/m² → 61.4 V/m(고시의 61 V/m와 일치).
- 1 mW/cm² = 10 W/m², 5 mW/cm² = 50 W/m², 0.05 mW/cm² = 0.5 W/m².
- 2.45 GHz 자유공간 파장 122.4 mm, 반파장 61.2 mm. 측정 거리 5 cm는 반파장보다 짧다.

---

## 2. 항목별 상세

### 2.1 국내 전자파인체보호기준 (과학기술정보통신부 고시)

**고시 번호와 현행 여부**
- 국가법령정보센터 행정규칙 페이지는 현행본을 "전자파인체보호기준 [시행 2019. 1. 16.] [과학기술정보통신부고시 제2019-4호, 2019. 1. 16., 일부개정]"으로 표시했다(검색 요약). U-LEX의 개정 이력도 2019-01-16이 마지막이고, 이전 개정은 2017-08-24, 2015-03-25, 2013-08-29, 2012-01-05, 2008-05-19 제정 순으로 나왔다. 확인 수준: 2차 인용.
- 2024-07-15 헌법소원 심판청구서가 "2019년 4호 고시 제3조 제1항 [별표 1]"의 일반인 전자파강도기준을 다투고 있다. 2024년에도 2019-4호가 현행이라는 방증이다. 확인 수준: 2차 인용.
- 국립전파연구원이 2025년 12월 「전자파흡수율 측정기준」을 개정하며 "전자파인체보호기준 제4조에 따른 전자파흡수율기준 측정"이라고 썼다(검색 요약). 2025년 말에도 제4조가 SAR 조항이라는 뜻이다. 확인 수준: 2차 인용.
- **미확인**: 2024년 이후 일부개정 여부. 국가법령정보센터의 연혁을 직접 봐야 한다.
- 출처 URL: https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000175532 (차단, 검색 결과로만 봄)

**조문(검색 결과에 인용된 문장)**
- 제3조: "일반인에 대한 전신노출은 별표1에 규정된 전기장강도와 자기장강도 또는 자속밀도와 전력밀도 값을 초과하지 않아야 한다." 확인 수준: 원문(발췌).
- 제4조(현행): "전자파흡수율(SAR)의 최댓값은 [별표3]에 규정된 값을 초과하지 않아야 한다." 2008년 제정 당시 조문 제목은 "국부노출에 대한 전자파흡수율기준", 문장은 "국부노출로 인한 전자파흡수율(SAR)의 최대값은 별표3에 규정된 값을 초과하지 않아야 한다." 확인 수준: 원문(발췌), 검색 요약 1회.
- "일반인"의 정의: "전자기장에 노출되고 있는 사실을 모르거나 조치를 취할 수 없는 자". 확인 수준: 원문(발췌).

**SAR 기준(별표 3)**: 국립전파연구원 "전자파 흡수율(SAR) 기준" 페이지(https://www.rra.go.kr/ko/license/D_b_benchmark.do)와 "전자파 인체보호기준" 페이지(https://www.rra.go.kr/emf/wrongfact/knowing/index08.do)의 표를 검색 결과로 봤다.
- 100 kHz–10 GHz, 일반인: 전신 0.08, 머리·몸통 1.6, 사지 4 W/kg. 직업인: 0.4, 8, 20 W/kg.
- 주석: 머리·몸통은 사지를 제외한 부위. 한국과 미국은 "임의 인체 조직 1그램에 대하여 평균한 최댓값", 사지는 10 g 평균 최댓값.
- 근거 설명: 4 W/kg가 체온 1 °C 상승을 일으킬 수 있는 노출 한계이고, 안전계수 50을 두어 0.08 W/kg로 정했다.
- 국제 비교: 머리·몸통 한국 1.6, 미국 1.6, 일본·유럽·ICNIRP·IEEE 2 W/kg.
- 확인 수준: 2차 인용(기관 안내 페이지의 표를 검색 요약으로 봄). 고시 별표 3 원문은 못 봤다.

**전자파강도 기준(별표 1), 2–300 GHz 일반인**
- E 61 V/m, H 0.16 A/m, B 0.20 μT, 전력밀도 10 W/m². 국립전파연구원 자료 검색 결과. 확인 수준: 2차 인용.
- 같은 표의 다른 행(참고): 10–400 MHz 28 V/m, 0.073 A/m, 2 W/m² (한국전파진흥협회 emf.kca.kr, 검색 발췌). 이 값과 2–300 GHz 행은 ICNIRP 1998 일반인 기준레벨과 같은 계열이다. 국립전파연구원은 "우리나라의 인체보호기준은 ICNIRP의 기준을 채택·적용"한다고 쓴다. 확인 수준: 2차 인용.
- **평균 시간: 미확인.** 고시 별표 1의 비고나 「전자파강도 측정기준」에 6분 평균 규정이 있는지 찾지 못했다. ICNIRP 1998을 따랐다면 6분일 가능성이 있으나 근거로 쓰면 안 된다.

**국부 SAR 기준이 전자레인지 노출에 적용되는가**
- 고시 제4조는 대상 기기를 따로 적지 않는다(현행 문장 기준). 그러나 SAR **측정 의무** 대상은 "공중선 전력 20 mW 초과, 인체로부터 20 cm 이내에서 사용하는 휴대용 무선기기"로 안내된다(한국산업기술시험원 KTR 시험 안내, 2차 인용). 국립전파연구원은 "2013년 1월 1일부터 SAR 기준 적용 대상을 휴대전화에서 인체에 근접하여 사용하는 대부분의 기기로 확대"했다고 쓴다(2차 인용). 국립전파연구원 공공데이터 설명도 SAR 표시 대상을 휴대용 무선설비로 둔다(2차 인용).
- 전자레인지는 무선설비가 아니라 전기용품이다. 누설은 KC 60335-2-25로 관리된다(2.3절). 2016년 미래부가 전기장판류(2017-07-01)와 IH 가열기기(2019-01-01)에 인체보호기준 적합성 시험을 도입했다는 보도는 있다(아시아경제 2016-12-07, 2차 인용). 전자레인지가 그 대상에 들어가는지는 **미확인**.
- 정리(조사자 해석): 원고에서 국부 SAR 1.6 W/kg(1 g)과 비교하는 것은 "법적 적합성 판정"이 아니라 "기본 제한값과의 물리적 비교"로 써야 안전하다. 노출원 종류와 무관하게 적용되는 국부 기본제한으로는 ICNIRP 2020의 10 g 기준이 더 깔끔한 비교 대상이다.

### 2.2 ICNIRP 2020 지침

- 서지: ICNIRP (2020). Guidelines for limiting exposure to electromagnetic fields (100 kHz to 300 GHz). Health Physics 118(5):483–524. DOI 10.1097/HP.0000000000001210. ICNIRP 사이트가 DOI를 표시하고, 2020년 3월 Health Phys 118(00) 선공개판이 있었다고 적는다. 확인 수준: 2차 인용(ICNIRP 공지 페이지의 검색 요약).
- 범위: ICNIRP 1998의 100 kHz–300 GHz 부분과 ICNIRP 2010 저주파 지침의 100 kHz–10 MHz 부분을 대체한다. 확인 수준: 2차 인용.
- **전신 평균 SAR 0.08 W/kg, 30분 평균**: ICNIRP PDF의 문장 "A reduction factor of 50 was applied for the general public, making the whole-body average SAR restriction for the general public 0.08 W kg−1, averaged over 30 min."이 검색 결과에 인용됐다. 4 W/kg 체심부 온도 상승 문턱에 축소계수 50을 적용한 값이다. 확인 수준: 원문(발췌).
- **국부 SAR 머리·몸통 2 W/kg, 사지 4 W/kg (100 kHz–6 GHz)**: ITU-R 보고서 SM.2452-1(2022)이 ICNIRP 2020 표 2 "Basic restrictions ... for averaging intervals ≥6 min"를 옮기며 국부 2 W/kg(10 g)을 적었다. 사지 4 W/kg와 표 주석("Local SAR and Sab exposures are to be averaged over 6 minutes. Local SAR is to be averaged over a 10-g cubic mass.")은 다른 검색에서 인용됐다. 일본 총무성 자료(soumu.go.jp)도 머리·몸통 2, 사지 4 W/kg, 6분 평균으로 적는다. 직업인 0.4 / 10 W/kg. 확인 수준: 원문(발췌) + 2차 인용.
- **전신 기준레벨, 2–300 GHz: S_inc 10 W/m²(일반인), 50 W/m²(직업인), 30분 평균**: 여러 2차 문헌이 일치한다. "the whole-body averaging time was extended to 30 min in the entire frequency range"라는 문장도 검색됐다. 2 GHz 초과 구간의 전신 기준에는 E, H 값이 없고(NA) 전력밀도만 있다(국립전파연구원 ICNIRP 2020 표, 2차 인용). 확인 수준: 2차 인용.
- **국부 기준레벨, 2–6 GHz**: 한 2차 문헌(Frontiers in Communications and Networks 2022, doi 10.3389/frcmn.2022.744528)이 "국부 기준레벨이 2–6 GHz에서 전신보다 4배 높다"고 쓴다. 40 W/m²라는 값 자체는 검색 결과에 나오지 않았다. **미확인**(표 6 원문 필요).
- 원고에 쓸 문장 제안: "ICNIRP(2020)는 일반인의 전신 평균 SAR을 30분 평균 0.08 W/kg, 머리·몸통 국부 SAR을 10 g 정육면체·6분 평균 2 W/kg으로 제한하고, 2 GHz 이상 전신 노출의 입사 전력밀도 기준레벨을 30분 평균 10 W/m²로 둔다."

### 2.3 전자레인지 누설 기준

**21 CFR 1030.10 (미국 FDA 성능 표준)**
- 검색 결과에 인용된 조문: "The equivalent plane-wave power density existing in the proximity of the external oven surface shall not exceed 1 milliwatt per square centimeter at any point 5 centimeters or more from the external surface of the oven, measured prior to acquisition by a purchaser, and, thereafter, 5 milliwatts per square centimeter at any such point." (eCFR, govinfo CFR 2023·2025판). 확인 수준: 원문(발췌).
- 정의: equivalent plane-wave power density = rms 전계의 제곱 / 자유공간 임피던스(377 Ω). 확인 수준: 원문(발췌).
- 시험 조건: "Measurements shall be made with the microwave oven operating at its maximum output and containing a load of 275 ± 15 milliliters of tap water initially at 20 ± 5 °centigrade placed within the cavity at the center of the load-carrying surface provided by the manufacturer." 용기는 내경 약 8.5 cm의 저형(low form) 600 mL 비커, 유리나 플라스틱 같은 비전도성 재질. 문을 완전히 닫은 상태와 동작이 가능한 다른 모든 문 위치에서 측정. 확인 수준: 원문(발췌).
- 계측기: (c)(3)(i) "an instrument which reaches 90 percent of its steady-state reading within 3 seconds" (계단 입력 기준). 확인 수준: 원문(발췌).
- 인터록: 보조(secondary) 인터록이 작동하는 경우에도 5 cm 이상에서 5 mW/cm² 이하를 요구. 확인 수준: 2차 인용.
- **미확인**: 검출기 유효 개구 25 cm² 이하·최대 치수 10 cm 규정. 오리건주 규칙(OAR 333-112-0020)에서만 확인됐고 연방 조문에서는 확인하지 못했다. 원고의 "프로브 면적"은 이 규칙을 출처로 쓰지 말 것.
- 출처: https://www.ecfr.gov/current/title-21/chapter-I/subchapter-J/part-1030/section-1030.10 , https://www.govinfo.gov/content/pkg/CFR-2025-title21-vol8/pdf/CFR-2025-title21-vol8-part1030.pdf

**IEC 60335-2-25 (전자레인지 개별 안전 요구사항)**
- 현행판: IEC 60335-2-25:2024, Edition 8.0, 2024-07(7판 2020-01을 대체). IEC 웹스토어 목록. 확인 수준: 2차 인용.
- 누설 상한: 외면에서 50 mm 이상 떨어진 점에서 50 W/m²(5 mW/cm²). AS/NZS 60335.2.25를 인용한 호주 시험기관 자료와 규제기관 자료에서 확인했다("the leakage at 50mm or more from the external surface shall not exceed 50 W/m²"). 판매본 미리보기에는 "the limit specified in Clause 32", "32.1"이 나온다. 확인 수준: 2차 인용. IEC 원문 32절 문장은 못 봤다.
- 국가별 차이(2024판 미리보기 발췌): "Microwave leakage is not to exceed 10 W/m² during the initial test (Japan and USA)", "Microwave leakage is not to exceed 50 W/m² (Japan and USA)". 미국의 판매 전 1 mW/cm²와 대응한다. 확인 수준: 원문(발췌), 조항 번호(21.105, 22.112 등)는 검색 요약이 붙인 것이라 미확인.
- **시험 부하 미확인.** "275 g 물"을 IEC 조건으로 쓴 원고 문장은 근거가 없다. 275 mL는 21 CFR의 부하다. 2024판 미리보기에 "1 000 g ± 50 g of potable water at 20 °C ± 2 °C, borosilicate glass vessel"이라는 수정 문단이 있었으나 어느 조항(누설 시험인지 다른 시험인지)인지 확인하지 못했다.

**KC 60335-2-25 (국내)**
- 국가법령정보센터에 "전기용품 안전기준(KC 60335-2-25) [시행 2022. 2. 16.] [국가기술표준원고시 제2022-16호]"로 검색됐다(https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000209324). 확인 수준: 2차 인용(검색 결과 1건).
- 누설 상한과 시험 조건: **미확인**. 국제표준 부합화 기준이므로 IEC와 같을 가능성이 높지만 원문 확인 전에는 쓰지 말 것.

**참고: 캐나다**
- Health Canada(2000) "Radiation Leakage of Before-Sale and Used Microwave Ovens": 판매 전 오븐 60대 중 상한 초과 0대, 오타와 지역 사용 중 오븐 100여 대 중 1대 초과. 검색 요약은 캐나다 규정 한도를 "시험 부하 있을 때 1.0 mW/cm², 없을 때 5.0 mW/cm²(5 cm)"로 전했다. 확인 수준: 초록 수준(한도 해석은 2차, 원문 확인 필요).

### 2.4 조직 물성(2.45 GHz)과 물

**Gabriel 1996 3부작 서지** (PubMed ID는 서지 레코드 검색 결과)
- I부: Gabriel C, Gabriel S, Corthout E. The dielectric properties of biological tissues: I. Literature survey. Phys Med Biol 41(11):2231–2249, 1996. PMID 8938024. 확인 수준: 초록(서지 레코드). DOI 10.1088/0031-9155/41/11/001은 시리즈 형식상 맞지만 직접 확인 못함.
- II부: Gabriel S, Lau RW, Gabriel C. II. Measurements in the frequency range 10 Hz to 20 GHz. 41(11):2251–2269. PMID 8938025. DOI 10.1088/0031-9155/41/11/002(검색으로 확인). 확인 수준: 초록.
- III부: Gabriel S, Lau RW, Gabriel C. III. Parametric models for the dielectric spectrum of tissues. 41(11):2271–2293. PMID 8938026. DOI .../41/11/003은 형식상 추정, 미확인. 확인 수준: 초록.
- 주의: Corthout는 I부(문헌 조사) 저자다. 물성 값의 출처로는 III부(매개변수 모형)를 인용해야 한다.
- 4-Cole-Cole 모형식(III부, IFAC 부록 C): ε(ω) = ε∞ + Σₙ Δεₙ / (1 + (jωτₙ)^(1−αₙ)) + σᵢ/(jωε0). IFAC 부록 C의 표 열 이름은 ef, del1, tau1(ps), alf1, del2, tau2(ns), alf2, sig, del3 … 이다. "1 MHz 이상에서는 신뢰하고 쓸 수 있다"는 설명이 있다. 확인 수준: 2차 인용.
- 데이터베이스: IT'IS Foundation Tissue Properties Database V5.0, DOI 10.13099/VIP21000-05-0(검색 결과). 이전판 V4.0 추적 페이지도 있다. 버전별 저자 목록은 **미확인**. IFAC-CNR(https://niremf.ifac.cnr.it/tissprop/), NICT 데이터베이스, FCC 계산기(10–6000 MHz, Gabriel 공군 보고서의 4-Cole-Cole 사용)도 같은 계열이다.

**2.45 GHz 값**

| 조직 | εr | σ (S/m) | 근거 | 확인 수준 |
|---|---|---|---|---|
| 근육 | 53 (ε″ 13) | 1.77 (ε″에서 환산) | Foster & Adair 2004 표 2: 2450 MHz 근육 53−13j | 2차 인용 + 조사자 계산 |
| 근육 (흔히 쓰는 값) | 52.7 | 1.74 | 1.74 S/m는 RF 용어집(rfessentials)에서만 확인, 52.7은 미확인 | 일부 2차, 일부 미확인 |
| 피부(건조) | 38 (ε″ 10.7) | 1.46 | Foster & Adair 2004 표 2: 피부 38−10.7j (건조/습윤 구분 표기 없음). 2.5 GHz 표(Springer)는 37.95 / 1.488 | 2차 인용 + 조사자 계산 |
| 지방 | 5.3 (ε″ 0.77) | 0.105 | Foster & Adair 2004 표 2: 지방 5.3−0.77j | 2차 인용 + 조사자 계산 |
| 피질골 | 11.4 | 0.39 | 2.45 GHz 값을 담은 출처를 찾지 못함(1300 MHz 12.1 / 0.20만 확인) | 미확인 |
| 회백질 | 48.91 | 1.808 | Gabriel 회백질 4-Cole-Cole 매개변수(ossdbs 0.5.8 소스에 수록: ε∞ 4.0, σ 0.02, Δε 45/400/2e5/4.5e7, τ 7.958 ps/15.915 ns/106.103 μs/5.305 ms, α 0.1/0.15/0.22/0)로 계산 | 조사자 계산(매개변수는 2차) |
| 뇌척수액(참고) | 66.24 | 3.458 | 같은 방식 계산. 다른 논문이 "2.45 GHz 인체 조직 도전율 범위 0.095–3.458 S/m"라고 쓴 최댓값과 일치해 계산 경로가 검증됨 | 조사자 계산 + 2차 대조 |
| 유리체 | 68.2 | 2.48 | 2.45 GHz 값을 담은 출처를 찾지 못함 | 미확인 |
| 수정체 | 원고 48.1 / 1.53, 사양서 약 45 / 1.5 | | 출처 못 찾음. IFAC·Gabriel에는 수정체 피질(Lens Cortex)과 핵(Lens Nucleus)이 따로 있다. 원고는 어느 쪽인지 밝혀야 한다 | 미확인 |

- 권고: CST Bio Models나 CST 재질 라이브러리(IT'IS 기반)를 쓰면 그 소프트웨어가 실제로 쓴 값과 데이터베이스 버전을 그대로 기록해 표 1에 쓴다. 간이 팬텀을 직접 만들면 IT'IS 또는 IFAC 계산기에서 2450 MHz 값을 뽑아 버전과 접속일을 적는다.
- 조직 밀도(원고 표 1의 1109, 911 kg/m³ 등)도 출처가 필요하다(IT'IS 밀도 표). 이번에 확인하지 못했다.

**물(2.45 GHz)**
- 25 °C 물: 정적 유전율 약 78, ε∞ 약 5, 데바이 이완시간 약 8.2 ps(arXiv 1811.01449의 설명), 25 °C 이완시간 8.27 ps(idc-online "Water and Microwaves"). 확인 수준: 2차 인용.
- 단일 데바이 식 계산(조사자 계산, 이온 전도 제외): ε′ 76.9–77.2, ε″ 9.1–9.2, σ = ωε0ε″ ≈ 1.24–1.25 S/m.
- 20 °C 값은 확인 못함. 한 포럼 글이 "20 °C, 2.45 GHz에서 ε′ 78, ε″ 6.8"(σ 약 0.93 S/m)을 인용했지만 출처 불명이라 쓰지 말 것. 원고의 εr 77.5, σ 1.40 S/m은 25 °C 계산값보다 σ가 크다. 20 °C 쪽 값(이완시간이 길어 ε″가 커짐)으로 볼 수는 있으나 **미확인**. Kaatze(1989)나 Ellison(2007, J Phys Chem Ref Data)의 원문 값을 확인해야 한다. 물 부하의 σ는 보정 후 결과(문 앞 장 분포)에 거의 영향이 없으므로 원고에는 "약 77–78, 1.2–1.4 S/m"처럼 범위와 온도를 함께 쓰는 편이 안전하다.

**SAR 조직 등가 액체(참고)**: 2450 MHz 머리 등가 액체 εr 39.2, σ 1.80 S/m. 3GPP TS 34.114 머리 팬텀 표에서 확인했다. IEEE 1528 표 자체는 보지 못했다. 몸통용 목표값(52.7 / 1.95)은 **미확인**. 확인 수준: 2차 인용.

### 2.5 IEC/IEEE 62704-1:2017

- 제목: Determining the peak spatial-average specific absorption rate (SAR) in the human body from wireless communications devices, 30 MHz to 6 GHz – Part 1: General requirements for using the finite-difference time-domain (FDTD) method for SAR calculations.
- IEC와 IEEE 공동 발간, 2017-10, Edition 1.0. 범위 30 MHz–6 GHz. 정육면체 체적의 첨두 공간평균 SAR 산출 절차와 FDTD 소프트웨어 검증 절차를 정한다. SAR 한도는 정하지 않는다. IEC 웹스토어 publication 34411, 안정 일자 2023, 판매처에 따라 81–86쪽. 개정 프로젝트(100 kHz–10 GHz로 확대, 2025-06-19 PAR 승인, 2017판 대체 예정)가 진행 중이다. 확인 수준: 2차 인용(판매처·IEEE PAR 페이지 검색 결과).
- **"공기 10 % 이하" 규칙: 미확인.** 평균 정육면체가 몸 밖으로 나갈 때의 허용 비율을 검색으로 확인하지 못했다. 원고 3.5절의 "(공기 10% 이하)"는 원문 확인 전까지 빼거나, CST SAR 후처리 설정에서 실제로 고른 평균 방식 이름(예: IEEE/IEC 62704-1)만 적는 것이 안전하다.

### 2.6 비교 문헌

**(a) Lopez-Iturri 외 2015**
- Lopez-Iturri P, de Miguel-Bilbao S, Aguirre E, Azpilicueta L, Falcone F, Ramos V. Estimation of radiofrequency power leakage from microwave ovens for dosimetric assessment at nonionizing radiation exposure levels. BioMed Research International 2015:603260 (2015년 2월). DOI 10.1155/2015/603260, PMID 25705676, PMC4331164. 오픈 액세스(CC BY). 확인 수준: 초록.
- 무엇을 했나: 실내 공간에서 가정용 전자레인지 누설을 추정. 전파(full-wave) 해석(CST Microwave Studio)과 자체 3차원 광선 추적(ray launching) 코드를 결합하고, 오븐을 시간·주파수에 따라 변하는 누설원으로 다뤘다. 개인 선량계 EME Spy 121과 스펙트럼 분석기로 측정해 비교했고 "good agreement"라고 썼다. ICNIRP 일반인·직업인 E 기준레벨과 비교했다.
- 인용할 결론: "the highest electric field values can be found in the nearest zone of the oven, particularly in front of the door"(문을 통한 누설이 주 경로), 오븐 뒤쪽에도 작게 퍼진다. 확인 수준: 원문(발췌, 초록).
- **수치 미확인**: 측정·계산 전계 값(V/m), 거리, ICNIRP 대비 비율. 다른 논문(SDR 저가 측정, ResearchGate)이 이 논문을 인용하며 쓴 "2476 MHz에서 최대 0.032 V/m"는 이 논문의 결과가 아니다.

**(b) BfS(독일 연방방사선방호청)**
- 쪽: "Mikrowellenkochgeräte"(https://www.bfs.de/DE/themen/emf/hff/quellen/mikrowelle/mikrowelle_node.html), 영문 "Microwave ovens", BfS 안내지(Infoblatt) 보관본(archiv.bge.de).
- 검색 결과에 인용된 내용
  - 기기 사양의 방출 한도: 표면에서 5 cm 거리에서 5 mW/cm²(50 W/m²).
  - "Im Mittel lag die Leckstrahlung bei 1 % des festgelegten Grenzwertes" — 기준점이 한 곳에서는 "an der Geräteoberfläche"(기기 표면), 다른 곳에서는 "in einem Abstand von 5 Zentimeter"로 나온다. 원문 확인 후 한쪽으로 쓸 것.
  - 측정 시점은 1997년 11월. 기술이 거의 변하지 않아 지금도 유효하다고 본다.
  - 안내지: "In 30 Zentimetern Entfernung ist z.B. noch etwa fünf bis zehn Prozent der an der Oberfläche des Gerätes gemessenen Mikrowellenintensität vorhanden."
  - "Bei technisch einwandfreien Geräten besteht ... keine gesundheitliche Gefahr, auch nicht für Schwangere und Kleinkinder."
- 확인 수준: 원문(발췌).
- **정정**: "1 m에서 1/30–1/100"은 BfS 문장으로 확인되지 않았다. 독일 지역 신문(echo24)과 블로그가 쓴 표현이다. 원고 5절의 "(5 cm 기준의 약 1%, 1 m에서 1/30–1/100)"은 BfS 출처로 쓰면 안 된다. BfS로 쓸 수 있는 것은 "평균 1 %"와 "30 cm에서 표면 강도의 5–10 %"다.

**(c) 1973 Am J Public Health 63(3):193 — 저자는 Matthews가 아니다**
- Oates WH Jr, Snellings DD Jr, Wilson EF. Microwave oven survey results in Arkansas during 1970. American Journal of Public Health 63(3):193–198, 1973년 3월. DOI 10.2105/AJPH.63.3.193, PMID 4687866, PMC1775150. PubMed에는 초록이 없다. 확인 수준: 초록(서지 레코드).
- 검색 발췌 내용: 1970년 아칸소에서 찾은 오븐의 약 45 %를 Narda 측정기로 조사(인터록 점검, 문을 닫은 상태 누설 측정). 일부가 당시 업계 자율 기준 10 mW/cm²를 넘었다. 가정용 1대가 인터록 시험 중 200 mW/cm² 초과. 1970년 1월 미국 내 사용 대수 약 95,000대(가정 50,000, 상업 45,000). 확인 수준: 원문(발췌). 조사 대수와 초과 비율은 **미확인**.
- 같은 시기 비교: 1971년 캘리포니아 오렌지 카운티 조사에서 가정용 7 %, 상업용 23 %가 10 mW/cm² 초과(Health Physics 1971, 2차 인용).
- 원고 사용 시 주의: 1971년 연방 기준(21 CFR 1030.10) 시행 이전 제품의 조사다.

**(d) Oizumi, Laakso, Hirata 2012 — 학술지 논문이 아니라 IEICE 기술연구보고(학회 발표)**
- Oizumi T, Laakso I, Hirata A. Comparison of temperature elevation in the human eyes for different microwave exposure scenarios. IEICE 기술연구보고, EST2012-4, 2012-06-01 발표(나고야공업대학). https://ken.ieice.org/ken/paper/20120601o0S9/ . 권·호(vol. 112, no. …)와 쪽은 **미확인**. 확인 수준: 초록.
- 초록 요지: 강한 원거리장·근거리장 노출에서 수정체, 눈 주위 피부, 심부 온도 상승을 수치 인체 모형으로 계산. 평면파 노출에서는 심부 가열이 결정 요인, 눈 국부 노출에서는 피부 가열이 결정 요인이고, 수정체 온도는 열 통증 문턱에 이르지 않았다(주파수 전반).
- 학술지판: Oizumi T, Laakso I, Hirata A 외. FDTD analysis of temperature elevation in the lens of human and rabbit models due to near-field and far-field exposures at 2.45 GHz. Radiation Protection Dosimetry 155(3):284–291, 2013(2013-02-06 온라인). 확인 수준: 초록(EMF-Portal, Scinapse 서지). 전체 저자 목록과 DOI는 **미확인**. 원고에는 학술지판을 우선 인용할 것.
- 추가로 찾은 관련 문헌(원고 2.3절에 유용): Hirata A, Ushio G, Shiozawa T. Calculation of temperature rises in the human eye exposed to EM waves in the ISM frequency bands. IEICE Transactions on Communications E83-B(3):541–548, 2000년 3월. 초록 요지: 2.4 GHz에서만 안구 내 체액(초록 표현 "eye humor") 영역에 hot spot이 생겼고(900 MHz, 5.8 GHz에서는 없음), 평균 SAR 최댓값은 기준 이하였으며, 5.0 mW/cm²(관리환경 기준) 노출에서 최대 온도 상승은 5.8 GHz에서 0.26 °C로 백내장 문턱(3 °C)보다 훨씬 낮았다. 확인 수준: 초록. DOI는 URL 형식상 10.1587/e83-b_3_541로 보이나 미확인.

**(e) Oleson 외 1994**
- Oleson J, Samulski T, Clegg S, Das S, Grant W. Heating rate modeling and measurements in phantom and in vivo of the human upper extremity in a defective 2450 MHz microwave oven. Journal of Microwave Power and Electromagnetic Energy 29(2):101–108, 1994. DOI 10.1080/08327823.1994.11688237, PMID 8083785. 확인 수준: 초록.
- 내용: 인터록 스위치를 일부러 우회한 오븐에서 팬텀 가열률 측정, 자원자 팔의 피부 온도·온감·통증, 열화상, 손의 SAR 유한요소 모형. 초록 문장: "Moderately severe pain was experienced at the fingertips after 5 sec of exposure", 비가역 손상(손끝, 엄지·새끼두덩의 국소 열손상)에는 약 9초가 더 필요하다고 추정. 확인 수준: 원문(발췌, 초록). 측정 가열률 수치는 **미확인**.
- 원고 사용: "인터록이 고장 나 문을 연 채 작동하는 경우"의 위험 근거. 정상 누설과는 다른 상황(손을 조리실 안에 넣은 노출)임을 밝힐 것.

**(f) Sensors 문 메쉬 누설 모델링 논문 (PMC3522981)**
- López Iturri P, Nazábal JA, Azpilicueta L, Rodriguez P, Beruete M, Fernández-Valdivielso C, Falcone F. Impact of high power interference sources in planning and deployment of wireless sensor networks and devices in the 2.4 GHz frequency band in heterogeneous environments. Sensors 12(11):15689–15708, 2012-11-12. DOI 10.3390/s121115689, PMC3522981. 확인 수준: 초록.
- 내용: 전자레인지 누설이 2.4 GHz ISM 대역 802.15.4(ZigBee) 센서망에 주는 간섭. 초록 문장: 누설은 "depending strongly on the reflection coefficient and filtering properties of the metallic mesh embedded in the microwave oven door". 오븐 장을 해석해 등가 방사원으로 바꾸고 자체 3차원 광선 추적으로 실내 전체 누설을 추정, 채널·패킷 측정으로 검증. 채널 선택과 배치 전략이 성능·에너지에 중요하다는 결론. 확인 수준: 원문(발췌, 초록). 메쉬 투과 계수 값과 해석 도구 이름은 **미확인**.

**(g) UT Austin ICC 2011 와이파이 간섭 논문**
- Nassar M, Lin XE, Evans BL. Stochastic modeling of microwave oven interference in WLANs. Proc. IEEE International Conference on Communications (ICC 2011), Kyoto, 2011-06-05~09. 저자 사본: https://users.ece.utexas.edu/~bevans/papers/2011/microwave/WiFiInterferenceICC2011Paper.pdf . UT Austin과 Intel. 확인 수준: 초록.
- 내용: 802.11b/g/n이 쓰는 2.4 GHz 대역에서 오븐 간섭은 AP의 송신을 막거나 수신 비트 오류를 크게 늘린다. 거리·주파수에 따른 통계-물리 간섭 모형을 세우고 측정으로 검증했으며, High-Low 모형보다 정확하고 정보율 한계가 최대 5 bit/s/Hz 높아진다고 썼다. 오븐 간섭은 수십 ms 지속되고 OFDM 심벌은 μs 단위다.
- 배경(2차): 마그네트론은 60 Hz 교류의 반 주기에만 동작해 약 50 % 듀티, 16.7 ms 주기의 간섭을 낸다(IEEE 802.11-98/240, NTIA 측정 요약).
- **미확인**: 기존 조사 보고서에 적힌 "누설 약 20 dBm" 수치, DOI, 쪽수.
- 원고 사용: "와이파이를 방해할 만큼의 누설"과 "인체 기준"은 다른 크기의 문제라는 대비. 수치를 인용하려면 원문 확인 필요.

**(h) 이번에 추가로 찾은 문헌 (원고 2.3절 비교표 후보)**
- Tian R, Wei J-C, Lu M. The numerical assessment of RF human exposure to microwave ovens with contact-type doors. Electronics 14(5):873, 2025-02-23. DOI 10.3390/electronics14050873. COMSOL로 흉곽·심장·단극 심박조율기와 접촉형 문 오븐을 모형화. SAR10g와 온도 상승은 가까울수록, 문 틈이 클수록 커지고, 최악 조건(거리 100 mm, 틈 0.3 mm)에서도 ICNIRP 한도보다 훨씬 낮았다. 심박조율기 전극 유도 전압 5.322 mV가 ISO 14117의 단극 감도 설정 2 mV를 넘었다. 확인 수준: 초록(저자명은 ResearchGate 목록 검색 요약 1회로 2차). 원고의 연구와 가장 가까운 최근 수치 해석이므로 원문 확인을 권한다.
- Foster KR, Adair ER. Modeling thermal responses in human subjects following extended exposure to radiofrequency energy. BioMedical Engineering OnLine 3:4, 2004-02-28. DOI 10.1186/1475-925X-3-4. 100 / 450 / 2450 MHz 45분 노출에 Hardy-Stolwijk 체온조절 모형을 적용해 자원자 측정과 비교했다. 표 1의 2450 MHz 노출 조건은 입사 전력밀도 270 / 350 / 500 / 700 W/m²이고, 그림 1은 350 W/m²에서 자원자 7명의 피부·심부 온도 변화와 모형을 비교한다. 표 2의 2450 MHz 조직 유전율(피부 38−10.7j, 지방 5.3−0.77j, 근육 53−13j)은 2.4절에 썼다. 확인 수준: 초록 + 표 발췌(검색 요약). 원고에서 "법정 누설 상한(50 W/m², 5 cm)보다 훨씬 높은 350 W/m² 전신 노출을 자원자가 통제 실험으로 받은 사례"로 쓰려면, 그 실험의 원 논문(Adair 등)을 원문으로 확인해야 한다.
- 스위스 연방보건청(BAG/FOPH) 전자레인지 팩트시트(https://www.bag.admin.ch/dam/en/sd-web/JbnegZr3mAZv/faktenblatt-mikrowellenofen.pdf): 최대 누설 5 mW/cm²(5 cm), 하우징 가까이(0–5 cm)의 높은 강도가 30 cm에서는 허용치보다 10배 이상 낮아진다, 문 실이 손상되거나 더러우면 누설이 커질 수 있다. 확인 수준: 2차 인용(검색 2회 일치). 같은 팩트시트에 "30 cm 전신 SAR 0.0056 W/kg (기준 0.08 W/kg), 직접 접촉 시에만 기준 초과"가 있다는 검색 요약이 1회 나왔으나 재검색에서 확인되지 않았다. **미확인**. 확인되면 원고의 결과와 직접 비교할 수 있는 값이다.
- Alhekail(2001, 사우디 오븐 106대 중 1대만 5 mW/cm² 초과)와 1992년 독일 130대 조사(모두 1 mW/cm² 미만)는 스페인어 리뷰의 2차 인용으로만 봤다. **미확인**.

### 2.7 국립전파연구원 생활 속 전자파 FAQ (30 cm, 7.2 %)

- 쪽: 국립전파연구원 "생활 속의 전자파 FAQ", https://www.rra.go.kr/ko/license/D_e_faq.do?fa_type=a&fa_category=electronic (차단).
- 검색 결과가 전한 내용: "전자레인지 샘플을 측정한 결과, 60 Hz의 전자파 노출량은 30㎝ 이격거리에서 전자파 인체보호기준 대비 약 3.5% 수준이고 2.4㎓는 기준 대비 약 7.2% 수준", 그리고 "전자레인지 뒤편 부근 등 전력을 많이 쓰는 부품 근처에서 노출량이 더 높다". 국립전파연구원 "전자파 오해와 진실" 표의 전면 30 cm 자기장 3.5 %와 일치한다(그 표에는 2.4 GHz 값이 없다). 확인 수준: 2차 인용(검색 요약 1회. 문장이 원문 그대로인지는 미확인).
- 무엇을 가리키나: 전자레인지 **표본 측정**에서 30 cm 거리의 노출을 두 대역(60 Hz 전원 자기장, 2.4 GHz 대역 마이크로파)으로 나눠 기준 대비 비율로 낸 값이다. 기존 조사 보고서의 "전자레인지 한정인지 불명확"은 해소됐다(전자레인지 측정값).
- **미확인**: 측정 대수·제품, 측정 위치(정면 여부), 그리고 7.2 %가 **전기장 세기 비**인지 **전력밀도 비**인지. 전기장 비라면 전력밀도로는 0.52 %(0.052 W/m²)이고, 전력밀도 비라면 0.72 W/m²다(조사자 계산, 10 W/m² 기준). 원고에서 시뮬레이션 결과와 비교하려면 이 구분이 필요하다.

### 2.8 마그네트론 출력과 WR-340 도파관

**WR-340**
- 내부 치수 3.40 × 1.70 in = 86.36 × 43.18 mm, 권장 대역 2.20–3.30 GHz, TE10 차단 1.736 GHz, 다음 모드 차단 3.471 GHz. 같은 규격을 R26(IEC), WG9A(영국)로 부른다. everythingrf, microwave-link의 규격표. 확인 수준: 2차 인용.
- 조사자 계산: f_c = c/(2a) = 1.7357 GHz(사양서의 1.737은 반올림 차이, 원고에는 1.736 GHz로 쓰는 것이 맞다). TE20과 TE01의 차단은 둘 다 3.471 GHz라 2.45 GHz에서는 TE10 단일 모드. 2.45 GHz 관내 파장 173.4 mm, 1/4 관내 파장 43.3 mm(원고 43.4 mm와 일치).
- 2.45 GHz 장비에서 마그네트론 출력을 WR-340으로 전달하는 예: arXiv 2602.08477(고출력 마이크로파 대드론 시스템 해석 논문). 2차 인용.

**가정용 마그네트론 출력**
- 2차 출처들: 소비자용 출력 650–1200 W(백과사전 항목 인용), 400–1200 W(Q&A 사이트), 1982년 백과사전 350–750 W, 명판 예시 700 W(1988 Sharp, 2005 GoldStar), 입력 전력 1–1.5 kW에 출력 약 600–700 W. 권위 있는 기관 출처(FDA, Health Canada)에서는 확인하지 못했다. 확인 수준: 2차 인용(약함).
- 출력 측정 방법 표준: IEC 60705:2024(Edition 5.0, 가정용 전자레인지 성능 측정, "마이크로파 출력 결정" 조항 포함). 2차 인용.
- 권고: 원고의 "내부 전력은 수백 와트에서 1 kW 수준"은 일반 서술로 무난하다. 수치가 필요하면 국내 판매 제품 한두 개의 명판·설명서(예: 정격 고주파 출력 700 W, 1000 W)를 직접 인용하는 편이 확실하다. 이 연구는 누설을 측정 기준에 맞춰 보정하므로 마그네트론 출력은 결과에 들어가지 않는다는 점도 함께 쓴다.

---

## 3. 원고(`paper_draft.md`)와 대조한 정정·주의 사항

| 위치 | 원고 표현 | 확인 결과와 제안 |
|---|---|---|
| 1장 2문단 | IEC 60335-2-25도 "같은 거리에서 같은 수준" | IEC는 50 mm 이상에서 50 W/m²(=5 mW/cm²)로 사용 중 기준과 같은 수준(2차). 판매 전 10 W/m²는 일본·미국 국가별 차이로 표기됨. "같은 거리(5 cm)에서 5 mW/cm²와 같은 50 W/m²"로 쓰는 편이 정확하다 |
| 1장 3문단 | 국내 2 GHz 이상 전력밀도 10 W/m² | 2차 확인. 평균 시간은 쓰지 말 것(미확인) |
| 2.1절 | "물 부하 275 mL, 5 cm, 프로브 면적" | 275 mL와 5 cm는 21 CFR 조건(원문 발췌). 프로브 면적(25 cm²)은 연방 조문에서 미확인 |
| 3.1절 | "IEC 누설 시험의 물 부하(약 275 mL)" | 근거 없음. "미국 21 CFR 1030.10의 시험 부하(275 ± 15 mL, 20 ± 5 °C)"로 바꿀 것 |
| 3.1절 | 물 εr 77.5, σ 1.40 S/m | 25 °C 데바이 계산값은 약 77, 1.25 S/m. 온도와 출처를 적거나 범위로 쓸 것(미확인) |
| 표 1 | 피질골 11.4/0.394, 유리체 68.2/2.48, 수정체 48.1/1.53 | 2.45 GHz 값 출처 미확인. 회백질 48.9/1.81은 Gabriel 매개변수 계산과 일치. 피부·지방·근육은 Foster & Adair 2004의 2450 MHz 값과 일치(소수 둘째 자리까지는 미확인) |
| 3.5절 | "IEEE/IEC 62704-1 정육면체 평균(공기 10% 이하)" | 표준 서지는 확인, "공기 10 %" 규칙은 미확인 |
| 2.3절 | "Oizumi 등 2012" | IEICE 기술연구보고(EST2012-4). 학술지판 Radiat Prot Dosimetry 155(3):284–291(2013)을 함께 또는 대신 인용 |
| 2.3절 | "1973 가정용 오븐 실태 조사" | Oates, Snellings, Wilson(1973), 1970년 아칸소 조사. 가정용만이 아니라 가정·상업용 포함 |
| 5장 | "선행 측정(5 cm 기준의 약 1%, 1 m에서 1/30–1/100)" | BfS로 확인되는 것은 "평균 1 %"와 "30 cm에서 표면 강도의 5–10 %". 1 m 수치는 BfS 출처가 아님 |
| 2.3절 | "국립전파연구원 FAQ(30 cm에서 기준의 7.2%)" | 전자레인지 표본, 30 cm, 2.4 GHz 대역 7.2 %(60 Hz는 3.5 %). 비율의 물리량은 미확인 |

---

## 4. 참고문헌 (제안 형식: 저자, 연도, 제목, 학술지, 권(호), 쪽, DOI/URL)

[ ]는 미확인 또는 주의 사항이다. 공모전 양식이 정해지면 그에 맞춰 바꾼다.

**법령·표준·기관 자료**
1. 과학기술정보통신부 (2019). 전자파인체보호기준 (과학기술정보통신부고시 제2019-4호, 2019. 1. 16. 일부개정). 국가법령정보센터. https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000175532 [별표 1·3 원문 미열람, 2024년 이후 개정 여부 미확인]
2. 국립전파연구원. 전자파 흡수율(SAR) 기준. https://www.rra.go.kr/ko/license/D_b_benchmark.do [접속일 기재 필요]
3. 국립전파연구원. 전자파 인체보호기준(전자파 배우기). https://www.rra.go.kr/emf/wrongfact/knowing/index08.do
4. 국립전파연구원. 생활 속의 전자파 FAQ. https://www.rra.go.kr/ko/license/D_e_faq.do?fa_type=a&fa_category=electronic [FAQ 문장 원문 미열람]
5. 국가기술표준원 (2022). 전기용품 안전기준 KC 60335-2-25 (국가기술표준원고시 제2022-16호, 시행 2022. 2. 16.). 국가법령정보센터. https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000209324 [누설 조항 미확인]
6. U.S. Food and Drug Administration. 21 CFR 1030.10 Microwave ovens. Electronic Code of Federal Regulations. https://www.ecfr.gov/current/title-21/chapter-I/subchapter-J/part-1030/section-1030.10
7. IEC (2024). IEC 60335-2-25:2024 Household and similar electrical appliances – Safety – Part 2-25: Particular requirements for microwave ovens, including combination microwave ovens (Ed. 8.0). Geneva: IEC. https://webstore.iec.ch/en/publication/66759 [32절 원문 미열람]
8. IEC, IEEE (2017). IEC/IEEE 62704-1:2017 Determining the peak spatial-average specific absorption rate (SAR) in the human body from wireless communications devices, 30 MHz to 6 GHz – Part 1: General requirements for using the finite-difference time-domain (FDTD) method for SAR calculations (Ed. 1.0). https://webstore.iec.ch/publication/34411
9. International Commission on Non-Ionizing Radiation Protection (ICNIRP) (2020). Guidelines for limiting exposure to electromagnetic fields (100 kHz to 300 GHz). Health Physics, 118(5), 483–524. https://doi.org/10.1097/HP.0000000000001210
10. ICNIRP (1998). Guidelines for limiting exposure to time-varying electric, magnetic, and electromagnetic fields (up to 300 GHz). Health Physics, 74(4), 494–522. [권·호·쪽은 검색 확인, 제목은 검색 결과에서 직접 보지 못함. DOI 미확인]
11. Bundesamt für Strahlenschutz (BfS). Mikrowellenkochgeräte. https://www.bfs.de/DE/themen/emf/hff/quellen/mikrowelle/mikrowelle_node.html [접속일 기재 필요]
12. Bundesamt für Strahlenschutz (BfS). Infoblatt Mikrowellengeräte [보관본]. https://archiv.bge.de/archiv/www.asse.bund.de/SharedDocs/Downloads/BfS/DE/broschueren/emf/info-mikrowellengeraetee808.pdf [발행 연도 미확인]
13. Bundesamt für Gesundheit (BAG/FOPH). Faktenblatt Mikrowellenofen (Microwave oven fact sheet). https://www.bag.admin.ch/dam/en/sd-web/JbnegZr3mAZv/faktenblatt-mikrowellenofen.pdf [발행 연도 미확인]
14. Health Canada (2000). Radiation leakage of before-sale and used microwave ovens. https://www.canada.ca/en/health-canada/services/environmental-workplace-health/reports-publications/radiation/radiation-leakage-before-sale-used-microwave-ovens-health-canada-2000.html

**학술 문헌**
15. Foster, K. R., & Adair, E. R. (2004). Modeling thermal responses in human subjects following extended exposure to radiofrequency energy. BioMedical Engineering OnLine, 3, 4. https://doi.org/10.1186/1475-925X-3-4
16. Gabriel, C., Gabriel, S., & Corthout, E. (1996). The dielectric properties of biological tissues: I. Literature survey. Physics in Medicine and Biology, 41(11), 2231–2249. https://doi.org/10.1088/0031-9155/41/11/001 [DOI 형식 추정, PMID 8938024]
17. Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: II. Measurements in the frequency range 10 Hz to 20 GHz. Physics in Medicine and Biology, 41(11), 2251–2269. https://doi.org/10.1088/0031-9155/41/11/002
18. Gabriel, S., Lau, R. W., & Gabriel, C. (1996). The dielectric properties of biological tissues: III. Parametric models for the dielectric spectrum of tissues. Physics in Medicine and Biology, 41(11), 2271–2293. https://doi.org/10.1088/0031-9155/41/11/003 [DOI 형식 추정, PMID 8938026]
19. Hirata, A., Ushio, G., & Shiozawa, T. (2000). Calculation of temperature rises in the human eye exposed to EM waves in the ISM frequency bands. IEICE Transactions on Communications, E83-B(3), 541–548. https://global.ieice.org/en_transactions/communications/10.1587/e83-b_3_541/_p [DOI 미확인]
20. Lopez-Iturri, P., de Miguel-Bilbao, S., Aguirre, E., Azpilicueta, L., Falcone, F., & Ramos, V. (2015). Estimation of radiofrequency power leakage from microwave ovens for dosimetric assessment at nonionizing radiation exposure levels. BioMed Research International, 2015, 603260. https://doi.org/10.1155/2015/603260
21. López Iturri, P., Nazábal, J. A., Azpilicueta, L., Rodriguez, P., Beruete, M., Fernández-Valdivielso, C., & Falcone, F. (2012). Impact of high power interference sources in planning and deployment of wireless sensor networks and devices in the 2.4 GHz frequency band in heterogeneous environments. Sensors, 12(11), 15689–15708. https://doi.org/10.3390/s121115689
22. Nassar, M., Lin, X. E., & Evans, B. L. (2011). Stochastic modeling of microwave oven interference in WLANs. In Proceedings of the IEEE International Conference on Communications (ICC 2011), Kyoto, Japan, 5–9 June 2011. https://users.ece.utexas.edu/~bevans/papers/2011/microwave/WiFiInterferenceICC2011Paper.pdf [DOI·쪽 미확인]
23. Oates, W. H., Jr., Snellings, D. D., Jr., & Wilson, E. F. (1973). Microwave oven survey results in Arkansas during 1970. American Journal of Public Health, 63(3), 193–198. https://doi.org/10.2105/AJPH.63.3.193
24. Oizumi, T., Laakso, I., & Hirata, A. (2012). Comparison of temperature elevation in the human eyes for different microwave exposure scenarios. 電子情報通信学会技術研究報告 (IEICE Technical Report), EST2012-4. https://ken.ieice.org/ken/paper/20120601o0S9/ [권·호·쪽 미확인]
25. Oizumi, T., Laakso, I., Hirata, A., 외 (2013). FDTD analysis of temperature elevation in the lens of human and rabbit models due to near-field and far-field exposures at 2.45 GHz. Radiation Protection Dosimetry, 155(3), 284–291. [전체 저자, DOI 미확인]
26. Oleson, J., Samulski, T., Clegg, S., Das, S., & Grant, W. (1994). Heating rate modeling and measurements in phantom and in vivo of the human upper extremity in a defective 2450 MHz microwave oven. Journal of Microwave Power and Electromagnetic Energy, 29(2), 101–108. https://doi.org/10.1080/08327823.1994.11688237
27. Tian, R., Wei, J.-C., & Lu, M. (2025). The numerical assessment of RF human exposure to microwave ovens with contact-type doors. Electronics, 14(5), 873. https://doi.org/10.3390/electronics14050873 [저자명 2차 확인]

**데이터베이스·기타**
28. IT'IS Foundation. Tissue properties database, Version 5.0. https://doi.org/10.13099/VIP21000-05-0 [저자 목록·발행 연도 미확인. 실제로 쓴 버전으로 바꿀 것]
29. IFAC-CNR. Dielectric properties of body tissues (Gabriel 4-Cole-Cole 모형 계산기). https://niremf.ifac.cnr.it/tissprop/
30. Reding, J., Zimmermann, J. 외. OSS-DBS v2 (ossdbs 0.5.8, GPL-3.0) dielectric_model/colecole4.py — Gabriel 회백질·백질·뇌척수액·혈액 4-Cole-Cole 매개변수. https://pypi.org/project/ossdbs/ [회백질 값 계산에 사용. 원고에는 Gabriel III부를 인용하고, 이 패키지는 계산 검증용 메모로만 남길 것]

---

## 5. 남은 미확인 항목

1. 국내 고시 별표 1·3의 원문 문장과 평균 시간(6분 여부), 2024년 이후 개정 여부. 국부 SAR 기준이 전자레인지 같은 가전에 법적으로 적용되는지.
2. ICNIRP 2020 표 6의 2–6 GHz 국부 기준레벨(40 W/m² 추정).
3. 21 CFR 1030.10의 검출기 개구(25 cm²) 규정.
4. IEC 60335-2-25 32절 원문(50 W/m², 50 mm)과 누설 시험 부하. KC 60335-2-25의 누설 조항.
5. 2.45 GHz 물성: 피질골, 유리체, 수정체(피질/핵 구분)의 정확한 값. 근육·피부·지방의 소수 둘째 자리 값(52.7/1.74, 38.0/1.46, 5.28/0.105). 조직 밀도. 20 °C 물의 ε′, σ.
6. IEC/IEEE 62704-1의 "공기 10 %" 평균 규칙.
7. Lopez-Iturri 2015의 측정·계산 전계 수치.
8. Oates 1973의 조사 대수와 기준 초과 비율.
9. Oizumi 2012 기술보고의 권·호·쪽, 2013 학술지판의 전체 저자와 DOI. Hirata 2000의 DOI.
10. Nassar 2011의 "20 dBm" 수치, DOI, 쪽.
11. 국립전파연구원 FAQ 7.2 %의 물리량(전기장 비 또는 전력밀도 비)과 측정 조건.
12. BAG 팩트시트의 "30 cm 전신 SAR 0.0056 W/kg" 문장.
13. 가정용 마그네트론 출력의 권위 있는 출처(기관 자료 또는 제품 명판).
14. BfS "평균 1 %"의 기준점(표면인지 5 cm인지).
