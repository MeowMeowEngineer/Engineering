# 라이너 스콜라 제출 안내 (마감 11/8(일) 23:59)

공식 가이드: 원고는 **라이너 스콜라에서 작성**하고 **[내보내기] → PDF**로 제출한다. 권장 분량은 참고문헌 제외 공백 포함 약 10,000자(PDF 약 5쪽).

- 원고: `paper_liner.md` (본문 약 9,000자, 그림 7, 표 3). 미리보기: `paper_liner_preview.pdf` (이 파일은 제출용이 아님)
- 그림 파일(번호순): `../ieee/fig_geometry.png`(1), `../ieee/fig_voxel_models.png`(2), `../ieee/fig_leakage.png`(3), `../ieee/fig_sar_maps.png`(4), `../ieee/fig_sar_margin.png`(5), `../ieee/fig_temperature.png`(6), `fig_nf_maps_combined.png`(7)
- 표 이미지: `tables/table1.png`–`table3.png`(표 1–3, 300 dpi). 캡션은 이미지에 없으므로 표 위에 텍스트로 붙인다. 원고 표를 고치면 `python3 make_table_images.py`로 다시 만든다.
- 파일 이름: `제1회 라이너 스콜라 연구공모전_작동 중인 전자레인지 앞에 서 있으면 해로운가_장은성.pdf`

## 1. 라이너 스콜라에서 먼저 할 일 (제1장 제2절의 활용 기록을 사실로 만들기)

가이드는 "실제로 라이너 스콜라를 활용한 단계와 용도"를 밝히라고 하고, "실제로 수행한 범위만 작성"하라고 한다. 지금 원고의 문헌 조사는 웹 검색과 Claude로 했으므로, 라이너 스콜라 활용 문장은 직접 사용한 뒤에 채운다.

1. 라이너 스콜라에서 아래 검색을 실행하고 검색일을 적는다.
   - microwave oven radiation leakage survey
   - microwave oven leakage human exposure SAR
   - 2.45 GHz whole-body SAR child plane wave
   - lens temperature 2.45 GHz cataract
   - radiofrequency exposure systematic review WHO 2024
2. 결과에서 원고의 참고문헌이 나오는지, 빠진 중요한 문헌(특히 최근 측정 조사, 국내 연구)이 있는지 본다. 새 문헌을 넣으면 알려 주면 본문에 반영한다.
3. 아래 2절의 참고문헌 목록을 라이너 스콜라로 하나씩 대조한다(제목, 저자, 연도, DOI).
4. 제1장 제2절의 `[라이너 스콜라 활용: ...]` 괄호를 실제 내용으로 바꾼다. 예: "라이너 스콜라(검색일 2026. 11. ○.)로 위 검색어의 문헌을 탐색해 선정 문헌을 보완하고, 참고문헌의 서지와 인용 내용을 원문과 대조하였다."

같은 문단의 "AI 도구(Anthropic Claude)도 사용하였으며" 문장은 사실이다. 지울지 여부는 본인이 정하되, 가이드의 "실제로 수행한 범위" 요구를 생각하면 남기는 쪽을 권한다.

## 2. 참고문헌 확인 목록

상태: ✅ DOI/URL을 검색 결과로 확인 · ⚠ 형식상 추정 또는 미확인 → 라이너 스콜라로 대조 필요

| 번호 | 문헌 | 상태 | 확인할 것 |
|---|---|---|---|
| [1] | 21 CFR 1030.10 | ✅ URL | |
| [2] | IEC 60335-2-25:2024 | ✅ URL | |
| [3] | ICNIRP 2020 | ✅ DOI | |
| [4] | 전자파인체보호기준 2019-4 | ⚠ | 2024년 이후 개정 여부, URL |
| [5] | Karipidis 2024 | ⚠ DOI | DOI, 저자 표기 |
| [6] | Bosch-Capblanch 2024 | ⚠ DOI | DOI, 저자 표기 |
| [7] | CST 2019 | ✅ (설치본 도움말) | |
| [8] | Coolblue 사양 | ✅ URL | 가능하면 삼성 공식 자료로 교체 |
| [9] | Pennes 1948 | ⚠ DOI | DOI |
| [10] | ICNIRP 1998 | ⚠ URL | URL, 4 W/kg·1 °C 서술 |
| [11] | Guy 1975 | ⚠ DOI | DOI, 41 °C·138 W/kg 수치 |
| [12] | FAO/WHO/UNU 2004 | ⚠ URL | URL, 식(11.472W+873.1) |
| [13] | Oates 1973 | ✅ DOI | 기준 초과 비율 |
| [14] | Health Canada 2000 | ✅ URL | 60대/약 100대/1대 |
| [15] | BfS | ✅ URL | 1%, 5–10% 문장 |
| [16] | Lopez-Iturri 2015 | ✅ DOI | |
| [17] | Tian 2025 | ✅ DOI | 저자명 |
| [18] | Hirata 2000 | ⚠ URL | DOI |
| [19] | Wang 2006 | ✅ DOI | |
| [20] | Bakker 2010 | ✅ DOI | 공저자 |
| [21] | Uusitupa 2010 | ✅ DOI | |
| [22] | Piuzzi 2011 | ✅ DOI(1회 확인) | DOI |
| [23] | Hirata 2007 | ✅ DOI | |
| [24] | Flintoft 2014 | ✅ DOI | |
| [25] | Oleson 1994 | ✅ DOI | 5초 통증 서술 |

## 3. 라이너 스콜라에 옮기는 순서

1. 새 문서에 제목, 이름, 작성일을 넣는다.
2. 초록부터 제4장까지 `paper_liner.md`의 문단을 그대로 붙여 넣는다. 장·절 제목은 가이드 형식(제1장, 제1절)을 유지한다.
3. 표 1–3은 `tables/table1.png`–`table3.png`를 이미지로 넣고, 그 위에 캡션("표 1. ...")을 텍스트로 붙인다.
4. 그림 1–3을 넣고 캡션을 붙인다. 내보낸 PDF에서 글자와 수치가 읽히는지 확인한다(가이드 요구).
5. 참고문헌을 붙여 넣는다.
6. [내보내기] → PDF, 위 파일 이름으로 저장 후 제출.
