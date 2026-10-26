---
title: "작동 중인 전자레인지 앞에 서 있으면 해로운가: 노출 기준, 누설 측정, 인체 흡수 해석의 비교 검토"
---

<p class="contest">제1회 라이너 스콜라 연구공모전</p>

<p class="author">장은성</p>

<p class="date">작성일: 2026년 11월 ○일</p>

## 초록

"작동 중인 전자레인지 앞에 서 있으면 해롭다"는 통념을, 해로움을 인체보호기준이 막으려는 열적 영향으로 정의하고 노출 기준의 근거, 누설의 실측 수준, 인체 흡수와 온도 상승의 세 주제로 나누어 검토하였다. 기준 문서와 체계적 문헌고찰, 누설 측정 자료, 인체 흡수 계산 연구를 비교하고, 문헌에 없는 "실제 사용 거리에서 사람이 흡수하는 양"은 3차원 전자기 해석으로 보완하였다. 확인된 위해는 조직 가열이며, 동물 실험의 문턱은 몸 1 kg당 흡수 전력인 비흡수율(SAR)로 전신 평균 약 4 W/kg, 일반인 기준은 그 1/50인 0.08 W/kg이다. 측정 자료에서 가정용 제품의 누설은 평균적으로 사용 중 허용 상한(문 외면 5 cm에서 50 W/m²)의 약 1%였다. 이 수준의 정상 제품 앞 30 cm–1 m에 선 성인과 7세 아동의 SAR은 기준의 2% 미만, 온도 상승은 0.003 °C 미만이었고, 문에 얼굴을 5–10 cm까지 댄 아동도 기준의 약 1% 이하였다. 국내 측정값을 가장 불리하게 읽어도 기준의 10% 미만이었다. 따라서 정상 제품에 대해 이 통념은 지지되지 않는다. 다만 누설이 허용 상한 부근인 제품에 가장 보수적인 가정을 겹치면 기준에 근접하거나 넘을 수 있어, 통념은 문이 손상되어 누설이 커진 제품에 한해 조건부로 성립할 수 있다.

## 제1장 서론

### 제1절 연구의 배경과 목적

전자레인지는 2.45 GHz 마이크로파로 음식 속 물을 데운다. 같은 전자파가 문틈으로 새어 사람도 데우거나 해칠 수 있다는 걱정은 오래되었고, "돌아가는 동안 앞에 서 있지 말라"는 조언이 지금도 흔하다. 반면 2.45 GHz 광자의 에너지는 약 10⁻⁵ eV로 분자 결합을 끊기에 턱없이 작아, 확인된 위해는 열적 작용으로 좁혀진다. 이 글에서 "해롭다"는 인체보호기준이 막으려는 열적 영향, 즉 몸이 흡수하는 전력이나 그로 인한 온도 상승이 기준 또는 생리적 문턱을 넘는 것으로 정의한다. 즉 이 통념의 검증은 "누설된 에너지가 몸을 의미 있게 데울 만큼인가"라는 양의 문제이다.

이 문제가 쉽게 풀리지 않는 이유는 두 계통의 기준이 서로 다른 양을 규정하기 때문이다. 제품 방출 기준은 오븐 외면 5 cm에서 전력밀도(단위 면적을 지나는 전자파 전력, W/m²)를 판매 전 10 W/m², 사용 중 50 W/m² 이하로 제한한다 [1], [2]. 인체보호기준은 몸 1 kg이 흡수하는 전력인 비흡수율(SAR, W/kg)을 제한한다 [3], [4]. 5 cm의 측정값은 사람이 서는 위치의 노출도, 몸이 흡수하는 양도 직접 알려 주지 않는다.

이 글이 답할 연구 질문은 다음과 같다. **"정상 동작하는 가정용 전자레인지 앞 30 cm–1 m에 선 성인과, 문에 얼굴을 5–10 cm까지 댄 아동이 흡수하는 전자파 에너지와 그로 인한 온도 상승은 인체보호기준과 열적 영향 문턱에 비해 어느 수준인가?"**

### 제2절 검토한 문헌과 방법

1.  연구의 범위

> 대상은 2.45 GHz 가정용 전자레인지의 문 누설이며, 누설 크기는 정상 제품 수준과 사용 중 허용 상한 수준을 모두 다루었다. 비열적 영향(암, 자각 증상)은 2024년 WHO 의뢰 체계적 문헌고찰 [5], [6]과 국제암연구소(IARC) 분류 [7]로 검토하되, 이들 근거의 대부분이 머리에 대고 쓰는 휴대전화 노출에서 나왔다는 점을 함께 고려하였다. 휴대전화 노출의 개별 연구는 노출 조건이 달라 따로 비교하지 않았다. 인터록(문이 열리면 전원을 끊는 장치) 고장으로 문이 열린 채 동작하는 상황은 결론의 범위 밖으로 두고 참고로만 다루었다.

2.  연구의 방법

> **문헌 검토.** 2026년 10월 19–22일에 웹 검색엔진과 학술 데이터베이스 서지 레코드(PubMed, IEEE Xplore, IOP, 출판사 페이지)를 통해 "microwave oven leakage survey", "microwave oven leakage SAR", "2.45 GHz whole-body SAR child plane wave", "lens temperature 2.45 GHz", "ICNIRP basic restriction rationale", "전자레인지 전자파 누설" 등의 검색어로 1970–2025년 문헌(방법론 고전 문헌 제외)을 찾았다. 포함 기준은 (1) 가정용 전자레인지 누설의 측정·해석, (2) 2.45 GHz 부근 인체 흡수 또는 온도 계산, (3) 기준 문서와 그 근거 문헌이다. 상당수 문헌은 원문 전문이 아니라 초록, 서지 레코드, 기관 안내문 발췌 수준에서 확인하였고, 그 범위에서만 인용하였다. KCI, RISS, DBpia는 검색하지 못하였다. [라이너 스콜라 활용: 실제로 사용한 단계(예: 문헌 탐색 검색어와 검색일, 서지·인용 대조, 연구 결과 비교)와 용도를 기입] 문헌 탐색, 서지 확인과 초안 작성에는 AI 도구(Anthropic Claude)도 사용하였으며, 모든 수치와 결론은 저자가 원자료와 대조하여 검토하였다.
>
> **수치 해석.** 문헌에는 "실제 사용 거리에서 사람이 흡수하는 양"을 직접 다룬 연구가 드물어, 상용 전자기장 시뮬레이터(시간영역 유한적분법) [8]로 이를 계산하였다. 국내에서도 판매되는 23 L 단독형 제품 계열의 공개 사양 [9]에 맞추어 오븐을 두 가지로 만들었다. 하나는 문 둘레 전체가 새는 단순 문(누설을 크게 잡는 모델)이고, 다른 하나는 유리, 타공판(작은 구멍이 뚫린 금속판), λ/4 초크(문 둘레로 새는 전자파를 상쇄하는 홈)를 넣은 실제 문이다(그림 1). 누설 크기는 방출 기준의 시험 조건(물 275 mL 부하, 외면 5 cm)에서 전계로 환산한 점 최댓값을 정상 제품 수준 0.5 W/m²(시나리오 A, 허용 상한의 1%)와 허용 상한 50 W/m²(시나리오 B)로 맞추었다. 모든 결과는 누설 크기에 비례하므로 다른 누설 수준으로 바로 환산할 수 있다.
>
> 인체는 해부학적 복셀(3차원 화소) 모델인 성인 남성(38세, 176 cm)과 7세 여아(115 cm) [8]를 썼다. 30 cm 이상에서는 오븐 단독 해석에서 전력 흐름과 전계 환산값이 4% 이내로 같아, 인체에 정면 평면파(한 방향으로 고르게 진행하는 전자파)를 쬐어 1 W/m²당 SAR을 구하고 몸 앞 전력밀도를 곱하였다. 몸 앞 전력밀도는 실제 문의 몸 앞 평균(현실적 추정)과 단순 문의 몸 앞 최댓값(몸 전체가 가장 센 곳의 세기를 받는다는 보수적 가정) 두 가지를 썼다. 얼굴을 문에 댄 5–10 cm는 오븐(단순 문)과 아동 상반신을 함께 해석하였다. SAR은 국제 표준의 1 g·10 g 정육면체 평균으로 구하고, 전신 평균은 시뮬레이터가 계산한 조직 질량으로 나누었다. 온도 상승은 Pennes 생체 열전달 방정식 [10]의 2차원 정상상태 해와, 30분간 열 손실이 없다는 단열 가정(심부 체온의 상한)으로 추정하였다.

<p class="fig"><img src="fig_setup_3d_labeled.png" alt="그림 1"></p>
<p class="fcap">그림 1. 전자기장 시뮬레이터로 구성한 해석 환경. (a) 실제 문 모델: 23 L 오븐을 높이 중간에서 수평으로 자른 사선 시점(아래쪽이 문). 문에는 타공판과 문 둘레의 λ/4 초크 홈이 있고, 조리실에는 회전접시와 물 부하 275 mL, 옆벽에는 도파관 급전부가 있다. (b) 문에 얼굴을 댄 아동의 근접 해석: 7세 여아 복셀 모델의 상반신과 단순 문 오븐, 얼굴–문 약 5 cm. (c) 30 cm 이상에 선 성인의 해석: 성인 남성 복셀 모델에 오븐 쪽에서 평면파를 쬔다(빨간 선: 입사면, 보라 화살표: 진행 방향, 초록 화살표: 전계). (b), (c)의 인체는 측면 단면이며 색은 조직 종류(회색 뇌, 빨강 심장, 갈색 간 등)이다 [8]. 출처: 본 연구(전자기장 시뮬레이터 화면).</p>

## 제2장 주제별 분석

### 제1절 '해롭다'의 기준: 열적 영향 문턱과 노출 기준

노출 기준은 동물 실험에서 확인된 가열 문턱에서 출발한다. ICNIRP가 정리한 실험에서 학습 과제를 하던 쥐와 원숭이는 전신 평균 SAR 약 4 W/kg에서 과제를 멈추었고, 이때 심부 체온은 약 1 °C 올랐다 [11]. 국제비전리방사선방호위원회(ICNIRP)는 이를 건강 영향 문턱으로 보고 일반인에 1/50을 적용해 전신 0.08 W/kg을 기본 제한(몸 안에서 넘지 말아야 할 값)으로 정하였고, 2020년 개정에서도 유지하였다 [3], [11]. 몸 밖에서 재기 쉬운 참고 수준(2.45 GHz에서 전력밀도 10 W/m²)은 기본 제한을 지키도록 정한 값이다 [3]. 국내 기준도 전신 0.08 W/kg이며, 국부 기준은 머리·몸통 1 g 평균 1.6 W/kg으로 ICNIRP의 10 g 평균 2 W/kg보다 엄격한 편이다 [3], [4]. 두 계통의 기준을 표 1에 정리하였다. 이 글의 SAR 비교는 기본 제한값과의 물리적 비교이며, 국부 기준이 가전제품에 법적으로 적용된다는 뜻은 아니다. 또 기준의 평균 시간(전신 30분, 국부 6분)은 보통 수 분인 조리 시간보다 길어, 실제 노출에는 여유가 더 있다.

<p class="tcap">표 1. 두 계통의 기준 (출처: [1]–[4], [11] 정리)</p>

| 기준 | 무엇을 제한하나 | 한도 |
|---|---|---|
| 제품 방출 기준 [1], [2] | 오븐 외면 5 cm의 전력밀도 | 사용 중 50 W/m² (미국은 판매 전 10 W/m²) |
| 인체보호기준, 전신 [3], [4] | 몸 전체 평균 SAR | 0.08 W/kg (문턱 4 W/kg [11]의 1/50) |
| 인체보호기준, 국부 [3], [4] | 몸 일부의 SAR | 1.6 W/kg (국내, 1 g 평균) / 2 W/kg (ICNIRP, 10 g 평균) |

눈은 혈류가 적어 따로 연구되었다. 2.45 GHz를 100분 쬔 토끼에서 수정체가 약 41 °C에 이를 때 백내장이 생겼고 [12], 사람 눈 모델 계산에서는 백내장 문턱을 수정체 온도 상승 약 3 °C로 본다 [13]. 참고로 성인 남성의 기초대사량은 약 80 W(1.1 W/kg)이므로 [14], 전신 기준 0.08 W/kg은 몸이 가만히 있어도 내는 열의 약 7%이다.

비열적 영향에 대해서는 근거가 엇갈린다. IARC는 2011년 무선주파수 전자기장을 "사람에게 발암 가능성이 있는" 2B군으로 분류하였는데, 주로 휴대전화 장기 사용자의 신경교종 위험 증가 보고에 근거하였다 [7]. 반면 2024년 WHO 의뢰 체계적 문헌고찰은 일반인 노출과 암 [5], 자각 증상 [6] 사이에 일관된 관련을 찾지 못하였다. 두 근거 모두 머리에 대고 쓰는 휴대전화 노출이 중심이어서 몸에서 떨어진 전자레인지 누설에 그대로 옮기기 어렵다. 따라서 비열적 영향은 현재 근거로 판단을 유보하며, 이 글의 정량 비교는 근거가 일치하는 열적 기준에 한정한다. 즉 SAR은 기본 제한과, 온도 상승은 문턱(1 °C)과 비교한다.

### 제2절 전자레인지는 얼마나 새는가: 측정 자료와 해석

초기 측정 조사는 통념이 생긴 배경을 보여 준다. 연방 방출 기준이 시행되기 전인 1970년 미국 아칸소주 조사에서는 일부 제품이 당시 업계 자율 기준(100 W/m²)을 넘었다 [15]. 기준 시행 후 캐나다 보건부의 2000년 조사에서는 판매 전 제품 60대가 모두 기준을 지켰고, 사용 중 제품 약 100대 중 1대만 사용 중 허용 상한을 넘었다 [16]. 독일 연방방사선방호청(BfS)은 1997년 측정에서 가정용 제품의 누설이 평균적으로 허용 상한의 약 1%였고, 30 cm에서는 표면 값의 5–10%로 줄어든다고 안내한다 [17]. 국내에서는 국립전파연구원이 전자레인지 표본을 30 cm에서 측정해 2.4 GHz 대역 노출이 인체보호기준의 약 7.2%라고 안내하였다 [18]. 누설의 공간 분포를 계산·측정한 연구도 있으나 인체 흡수는 산출하지 않았다 [19].

이 자료들은 시대, 표본 수, 측정 위치(표면, 5 cm, 30 cm)와 측정량이 달라 수치를 그대로 합칠 수 없다. BfS의 1%는 기준점(표면 또는 5 cm)이 자료마다 다르고, 국내 7.2%는 전계의 비인지 전력밀도의 비인지 밝혀져 있지 않다. 공통점은 기준 시행 이후 제품의 누설이 허용 상한보다 훨씬 낮고 거리에 따라 빠르게 준다는 것이다. 측정 자료와 뒤에서 다룰 계산 연구의 핵심 결과를 표 2에 정리하였다.

<p class="tcap">표 2. 주제별 선행 자료의 핵심 결과 (출처: 각 문헌)</p>

| 주제 | 자료 | 핵심 결과 |
|---|---|---|
| 누설 측정 | 미국 1970년 조사 [15] | 기준 시행 전, 일부 제품이 당시 업계 기준 초과 |
| 누설 측정 | 캐나다 2000년 조사 [16] | 사용 중 약 100대 중 1대만 허용 상한 초과 |
| 누설 측정 | 독일 BfS 안내 [17] | 평균 누설은 허용 상한의 약 1%, 30 cm에서 5–10%로 감소 |
| 누설 측정 | 국내 국립전파연구원 안내 [18] | 30 cm에서 인체보호기준의 약 7.2% |
| 흡수·온도 계산 | 접촉형 문, 흉부 [20] | 10 cm 이내에서도 기준보다 매우 낮음(심박조율기 간섭은 가능) |
| 흡수·온도 계산 | 눈, 50 W/m² [13] | 최대 온도 상승 0.26 °C, 백내장 문턱(약 3 °C)보다 훨씬 낮음 |
| 흡수·온도 계산 | 아동 전신, 평면파 [21], [22] | 참고 수준에서 아동은 기준을 약 30–45% 넘을 수 있음 |

해석에서 실제 문의 누설장은 30, 50, 100 cm에서 5 cm 값의 6.5%, 2.9%, 1.1%로 줄어 BfS 안내의 5–10%와 부합하였다(그림 2). 다만 BfS의 기준점(표면)과 해석의 기준점(5 cm)이 달라 엄밀한 검증은 아니다. 단순 문은 26%, 13%, 3.9%로, 남은 비율이 실제 문의 3.5–4.5배였다. 30 cm에서 정상 제품의 최대 전력밀도는 실제 문 0.033 W/m², 단순 문 0.13 W/m²였다. 국내 7.2%를 전계의 비로 읽으면 0.052 W/m²로 이 범위 안에 들고, 전력밀도의 비로 읽으면 0.72 W/m²로 그 5–22배이다. 해석은 측정값을 읽는 데 두 가지 주의점도 보여 준다. 첫째, 5 cm는 전계와 자계의 비가 자유공간 값(377 Ω)과 다른 근역장이어서, 전계로 환산한 전력밀도가 실제 전력 흐름보다 최대 1.9배 컸다. 둘째, 누설은 거리 제곱보다 완만하게 줄어, 5 cm 값에 역제곱 법칙을 적용하면 단순 문에서 30 cm–1 m 노출을 10–15배 과소평가한다. 즉 5 cm 측정값은 그대로 인체 노출로 읽을 수 없다.

<p class="fig"><img src="../ieee/fig_leakage.png" alt="그림 2"></p>
<p class="fcap">그림 2. 누설장 해석 결과. (a) 실제 문 모델의 문 외면 5 cm 평면 전계 분포(dB, 평면 최댓값 기준). (b) 평면 최댓값의 거리 감쇠(5 cm 값 대비, %). 회색 구간은 BfS 안내값(30 cm에서 표면 값의 5–10%) [17]. 출처: 본 연구 해석.</p>

### 제3절 몸은 얼마나 흡수하고 얼마나 데워지는가

선행 계산 연구는 특정 상황의 흡수와 온도를 다루었다(표 2 아래쪽). 접촉형 문 앞 10 cm 이내의 흉부 모델에서 국부 SAR(10 g)과 온도 상승은 기준보다 매우 낮았으나, 같은 연구에서 심박조율기 전극의 유도 전압은 기기의 감도 설정을 넘었다 [20]. 눈 모델에 50 W/m²를 쬔 계산에서 ISM 대역의 최대 온도 상승은 0.26 °C(5.8 GHz)로 백내장 문턱(약 3 °C)보다 훨씬 낮았다 [13]. 아동에 대해서는 같은 전력밀도에서 아동의 전신 SAR이 성인보다 크고, 참고 수준에서 기본 제한을 약 30% [21]에서 최대 45% [22]까지 넘을 수 있다는 보고가 있으며, 그 폭은 인체 모델과 자세에 따라 달라진다 [23], [24]. GHz 대역 흡수는 체표면적에 지배되고 아동은 체중당 체표면적이 크기 때문이다 [25], [26]. 이 연구들은 대상(흉부, 눈, 전신), 지표(10 g, 1 g, 전신 평균, 온도), 노출 조건이 서로 달라 수치를 그대로 비교할 수 없고, 실제 전자레인지 앞 거리에서의 흡수량은 제시하지 않았다.


해석에서도 입사 1 W/m²당 전신 SAR은 아동이 성인의 1.6–1.7배였고, 참고 수준에서 아동은 기본 제한의 109%로 선행 연구와 방향은 같으나 초과 폭은 작았다(정면 입사만 다룬 탓으로 보인다). 흡수는 오븐 쪽 피부 1–2 cm에 몰렸고, 국부 최댓값은 코 등 얼굴 돌출부에 나타났다. 그러나 전자레인지 누설은 참고 수준보다 훨씬 낮다. 정상 제품 앞 30 cm–1 m에서 성인의 전신 SAR은 기본 제한의 0.014–0.90%, 머리·몸통 1 g SAR은 0.026–1.6%였고, 아동은 각각 1.4%, 약 1% 이하였다. 상황별 결과를 그림 4에 한눈에 정리하였다. 가장 보수적인 가정에서 기본 제한에 닿으려면 누설이 정상 제품보다 전신 SAR은 72배(아동), 머리·몸통 1 g SAR은 62배(성인) 이상 늘어야 한다. 인체 모델에 따라 머리 1 g SAR이 최대 15% 달라, 이를 반영하면 이 배수는 54배이다. 국내 측정값을 전력밀도의 비(0.72 W/m²)로 읽어 몸 전체에 고르게 쬔다고 가정해도 SAR은 기본 제한의 9% 이하였다. 국부 온도 상승은 성인 0.0024 °C, 아동 0.0013 °C로 체온계 눈금(0.1 °C)의 약 1/40 이하였고, 심부 체온 상승은 30분 단열 가정에서도 0.0006 °C 이하였다(그림 4(b)).


문에 얼굴을 댄 아동은 근역장이어서 평면파로 대신할 수 없다. 오븐과 아동 상반신을 함께 푼 결과, 정상 제품에서 머리 1 g SAR은 얼굴 5 cm에서 기본 제한의 0.54%, 10 cm에서 0.84%였고, 수정체 온도 상승은 0.0002 °C로 백내장 문턱(약 3 °C)의 약 1/10,000이었다. 국부 SAR은 10 cm가 5 cm보다 컸다. 누설 빔이 거리에 따라 위아래로 퍼져 턱 쪽 노출이 커졌기 때문이며, 근역장에서는 "가까울수록 크다"가 성립하지 않을 수 있다. 같은 5 cm 누설을 평면파로 가정하면 머리 1 g SAR은 7.4배, 피부 온도 상승은 4.1배 과대평가되었다. 흡수와 온도 상승은 문을 향한 이마, 코, 입, 턱의 피부와 그 바로 아래에 몰렸고, 머리 안쪽(뇌)은 낮았다(그림 3).

<p class="fig"><img src="fig_nf_simple.png" alt="그림 3"></p>
<p class="fcap">그림 3. 얼굴을 문에서 5 cm에 둔 7세 아동의 측면 단면(허용 상한 제품 기준). (a) 몸이 흡수하는 전력(점 SAR, W/kg, 로그 척도), (b) 그로 인한 온도 상승(°C). 왼쪽 회색 띠가 문이다. 흡수와 온도 상승은 문을 향한 이마·코·입 주변 피부에 몰리고 머리 안쪽은 낮다. 정상 제품의 값은 모두 이의 1/100이다. 출처: 본 연구 해석.</p>


누설이 사용 중 허용 상한인 제품(시나리오 B)에서는 결과가 달라진다. 근접 아동의 머리 1 g SAR은 기본 제한의 54–84%였다. 30 cm 평면파 해석에서 누설이 많은 단순 문을 가정하고 몸 앞 최대 세기가 몸 전체에 고르게 닿는다고 보면, 성인 머리·몸통 1 g SAR이 162%, 아동 전신 SAR이 139%로 기본 제한을 넘었다. 실제 문과 몸 앞 평균을 쓰면 각각 13%, 6.5%였다. 판매 전 한도(10 W/m²)의 제품이라면 같은 보수적 가정에서도 각각 32%, 28%이다. 온도 상승은 허용 상한에서도 0.25 °C 이하였다.

<p class="fig"><img src="fig_summary_liner.png" alt="그림 4"></p>
<p class="fcap">그림 4. 상황별 결과 요약. (a) 몸이 흡수하는 전력(SAR)을 인체보호기준 대비 %로 나타낸 값, (b) 국부 최대 온도 상승(°C). 파란 막대는 정상 제품, 빨간 막대는 누설이 사용 중 허용 상한인 제품이다. 30 cm와 1 m는 몸 전체가 가장 센 누설을 받는다는 보수적 가정의 값이며, 현실적인 추정은 이보다 약 10–20배 작다. 가로축은 로그 눈금이다. 출처: 본 연구 해석.</p>

## 제3장 논의

세 주제의 근거는 정상 제품에 대해 한 방향을 가리킨다. 기준 문헌은 확인된 위해가 가열이며 그 문턱이 약 4 W/kg라고 하고, 측정 자료는 기준 시행 이후 제품의 누설이 허용 상한보다 훨씬 낮다고 하며, 해석은 그 수준의 누설이 사람에게 기본 제한의 2% 미만, 0.003 °C 미만의 온도 상승을 준다고 보였다. 접촉형 문과 눈을 다룬 선행 계산 [20], [13]도 같은 방향이었다(표 2). 다만 해석의 누설 크기를 측정 평균(1%)에 맞추었으므로 측정과 해석의 일치는 독립된 검증이 아니며, 독립적으로 비교된 것은 거리 감쇠의 경향뿐이다. 그럼에도 국내 측정값을 가장 불리하게 읽어도 기본 제한의 10% 미만이어서 결론의 여유는 크다.

그럼에도 통념이 남은 이유는 세 가지로 보인다. 연방 기준 시행 전에는 실제로 기준을 넘는 제품이 있었고 [15], 5 cm 방출 기준값을 사람이 받는 노출로 오해하기 쉬우며, 실제 위해 사례도 있다. 인터록이 고장 난 오븐에 손을 넣으면 5초 만에 통증이 생겼다 [27]. 그러나 이는 문이 열린 채 동작한 고장 상황으로, 문이 닫힌 제품 앞에 서 있는 것과는 노출 조건이 근본적으로 다르다.

통념이 성립할 수 있는 조건은 누설이 사용 중 허용 상한 부근인 제품이다. 이 수준은 법적으로 허용되지만 실제 제품에서는 드물고 [16], 문 실이나 이음새가 손상되거나 더러워지면 누설이 커질 수 있다 [28]. 이런 제품에 가장 보수적인 가정을 겹치면 국부·전신 기본 제한에 근접하거나 넘을 수 있다. 아동 연구 [21]–[24]가 보인 "참고 수준이 아동에게 덜 보수적"이라는 결과는 본 해석에서도 같은 방향이었으나, 정상 제품의 누설은 30 cm에서도 참고 수준보다 약 77배 이상 낮아 정상 제품에 대한 결론을 바꾸지 않는다. 한편 심박조율기 사용자에서는 기준 이하의 노출에서도 기기 간섭 가능성이 보고되어 [20], 열적 기준과는 다른 관점의 평가가 필요하다.

검토한 근거에는 한계가 있다. 측정 자료는 대부분 1970–2000년대 북미·유럽 자료이고, 상당수 문헌은 초록과 기관 안내문 수준에서 확인하였으며, 국내 학술 데이터베이스는 검색하지 못하였다. 해석의 한계는 다음과 같다. (1) 실제 시험은 크기가 있는 검출기로 공간 평균한 값을 읽으므로, 점 최댓값으로 한 보정은 누설을 작게 잡았을 수 있다. (2) 30 cm–1 m에서 평면파 등가는 근사이며, 정면 입사만 다루었다(입사 방향에 따라 전신 SAR은 약 ±25% 달라질 수 있다 [29]). (3) 오븐 형상은 하나이고, 아동 근접 해석은 단순 문과 한 배치(얼굴이 문 중심에서 옆으로 14 mm)만 다루었다. (4) 아동 모델의 주 연조직에는 시뮬레이터 기본 설정에 따라 지방 물성이 지정되었고, 전신 SAR을 원래 체중으로 나누면 7–10% 커진다. (5) 격자 수렴, 불확도 분석, 실측 검증을 하지 않았다. (6) 온도는 단면 밖 열전도를 무시한 2차원 해석이다. 정상 제품의 여유(최소 약 50배)는 이 불확도들보다 훨씬 크지만, 허용 상한 제품의 수치(54–84%, 139–162%)는 불확도 범위 안에 있으므로 "기준에 근접하거나 넘을 수 있다"는 정성적 판단으로만 읽어야 한다. 업소용 고출력 기기나 임신부 등에는 따로 확인이 필요하다.

## 제4장 결론

연구 질문에 대한 답은 다음과 같다. 정상 동작하는 가정용 전자레인지 앞 30 cm–1 m에 선 성인과 아동의 SAR은 기본 제한의 2% 미만, 문에 얼굴을 5–10 cm까지 댄 아동도 약 1% 이하였고, 온도 상승은 열적 영향 문턱(1 °C)의 수백분의 일 이하였다. 국내 측정값을 가장 불리하게 읽어도 기준의 10% 미만이었고, 기준에 닿으려면 누설이 정상 제품의 50배 이상이 되어야 한다. 따라서 **"작동 중인 전자레인지 앞에 서 있으면 해롭다"는 통념은 정상 제품에 대해 지지되지 않는다.** 이 통념은 **문이 손상되어 누설이 사용 중 허용 상한 부근까지 커진 제품에서만 조건부로 성립할 수 있다.** 인터록 고장으로 문이 열린 채 동작하는 경우는 이와 별개의 실제 위험이며, 비열적 영향은 현재 근거로 판단을 유보한다. 실용적인 조언은 "앞에 서 있지 말라"가 아니라 "문이 손상되었거나 문을 연 채 작동하는 전자레인지는 쓰지 말라"이다.

## 참고문헌

[1] U.S. Food and Drug Administration. (n.d.). *21 CFR 1030.10 Microwave ovens*. Electronic Code of Federal Regulations. Retrieved October 20, 2026, from https://www.ecfr.gov/current/title-21/chapter-I/subchapter-J/part-1030/section-1030.10

[2] International Electrotechnical Commission. (2024). *IEC 60335-2-25:2024 Household and similar electrical appliances – Safety – Part 2-25: Particular requirements for microwave ovens, including combination microwave ovens* (Ed. 8.0). https://webstore.iec.ch/en/publication/66759

[3] International Commission on Non-Ionizing Radiation Protection. (2020). Guidelines for limiting exposure to electromagnetic fields (100 kHz to 300 GHz). *Health Physics, 118*(5), 483–524. https://doi.org/10.1097/HP.0000000000001210

[4] 과학기술정보통신부. (2019). *전자파인체보호기준* (과학기술정보통신부고시 제2019-4호). 국가법령정보센터. https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000175532

[5] Karipidis, K., et al. (2024). The effect of exposure to radiofrequency fields on cancer risk in the general and working population: A systematic review of human observational studies. *Environment International, 191*, 108983. https://doi.org/10.1016/j.envint.2024.108983

[6] Bosch-Capblanch, X., et al. (2024). The effects of radiofrequency electromagnetic fields exposure on human self-reported symptoms: A systematic review of human experimental studies. *Environment International, 187*, 108612. https://doi.org/10.1016/j.envint.2024.108612

[7] Baan, R., Grosse, Y., Lauby-Secretan, B., El Ghissassi, F., Bouvard, V., Benbrahim-Tallaa, L., Guha, N., Islami, F., Galichet, L., & Straif, K. (2011). Carcinogenicity of radiofrequency electromagnetic fields. *The Lancet Oncology, 12*(7), 624–626. https://doi.org/10.1016/S1470-2045(11)70147-4

[8] 전자기장 시뮬레이터 제조사. (2019). *전자기장 시뮬레이터 사용자 설명서: 인체 모델 자료(Biological Data)* (버전 2019.7).

[9] Coolblue. (n.d.). *Samsung MS23K3513AW/EN* [Product specifications]. Retrieved October 22, 2026, from https://www.coolblue.be/en/product/945727/samsung-ms23k3513aw-en.html

[10] Pennes, H. H. (1948). Analysis of tissue and arterial blood temperatures in the resting human forearm. *Journal of Applied Physiology, 1*(2), 93–122. https://doi.org/10.1152/jappl.1948.1.2.93

[11] International Commission on Non-Ionizing Radiation Protection. (1998). Guidelines for limiting exposure to time-varying electric, magnetic, and electromagnetic fields (up to 300 GHz). *Health Physics, 74*(4), 494–522. https://www.icnirp.org/cms/upload/publications/ICNIRPemfgdl.pdf

[12] Guy, A. W., Lin, J. C., Kramar, P. O., & Emery, A. F. (1975). Effect of 2450-MHz radiation on the rabbit eye. *IEEE Transactions on Microwave Theory and Techniques, 23*(6), 492–498. https://doi.org/10.1109/TMTT.1975.1128603

[13] Hirata, A., Ushio, G., & Shiozawa, T. (2000). Calculation of temperature rises in the human eye exposed to EM waves in the ISM frequency bands. *IEICE Transactions on Communications, E83-B*(3), 541–548. https://global.ieice.org/en_transactions/communications/10.1587/e83-b_3_541/_p

[14] FAO/WHO/UNU. (2004). *Human energy requirements: Report of a Joint FAO/WHO/UNU Expert Consultation* (FAO Food and Nutrition Technical Report Series No. 1). FAO. https://www.fao.org/4/y5686e/y5686e00.htm

[15] Oates, W. H., Jr., Snellings, D. D., Jr., & Wilson, E. F. (1973). Microwave oven survey results in Arkansas during 1970. *American Journal of Public Health, 63*(3), 193–198. https://doi.org/10.2105/AJPH.63.3.193

[16] Health Canada. (2000). *Radiation leakage of before-sale and used microwave ovens*. Retrieved October 20, 2026, from https://www.canada.ca/en/health-canada/services/environmental-workplace-health/reports-publications/radiation/radiation-leakage-before-sale-used-microwave-ovens-health-canada-2000.html

[17] Bundesamt für Strahlenschutz. (n.d.). *Mikrowellenkochgeräte*. Retrieved October 20, 2026, from https://www.bfs.de/DE/themen/emf/hff/quellen/mikrowelle/mikrowelle_node.html

[18] 국립전파연구원. (n.d.). *생활 속의 전자파 FAQ*. 2026년 10월 20일 검색, https://www.rra.go.kr/ko/license/D_e_faq.do?fa_type=a&fa_category=electronic

[19] Lopez-Iturri, P., de Miguel-Bilbao, S., Aguirre, E., Azpilicueta, L., Falcone, F., & Ramos, V. (2015). Estimation of radiofrequency power leakage from microwave ovens for dosimetric assessment at nonionizing radiation exposure levels. *BioMed Research International, 2015*, 603260. https://doi.org/10.1155/2015/603260

[20] Tian, R., Wei, J.-C., & Lu, M. (2025). The numerical assessment of RF human exposure to microwave ovens with contact-type doors. *Electronics, 14*(5), 873. https://doi.org/10.3390/electronics14050873

[21] Wang, J., Fujiwara, O., Kodera, S., & Watanabe, S. (2006). FDTD calculation of whole-body average SAR in adult and child models for frequencies from 30 MHz to 3 GHz. *Physics in Medicine and Biology, 51*(17), 4119–4127. https://doi.org/10.1088/0031-9155/51/17/001

[22] Bakker, J. F., Paulides, M. M., Christ, A., Kuster, N., & van Rhoon, G. C. (2010). Assessment of induced SAR in children exposed to electromagnetic plane waves between 10 MHz and 5.6 GHz. *Physics in Medicine and Biology, 55*(11), 3115–3130. https://doi.org/10.1088/0031-9155/55/11/009

[23] Uusitupa, T., Laakso, I., Ilvonen, S., & Nikoskinen, K. (2010). SAR variation study from 300 to 5000 MHz for 15 voxel models including different postures. *Physics in Medicine and Biology, 55*(4), 1157–1176. https://doi.org/10.1088/0031-9155/55/4/017

[24] Piuzzi, E., Bernardi, P., Cavagnaro, M., Pisa, S., & Lin, J. C. (2011). Analysis of adult and child exposure to uniform plane waves at mobile communication systems frequencies (900 MHz–3 GHz). *IEEE Transactions on Electromagnetic Compatibility, 53*(1), 38–47. https://doi.org/10.1109/TEMC.2010.2053376

[25] Hirata, A., Kodera, S., Wang, J., & Fujiwara, O. (2007). Dominant factors influencing whole-body average SAR due to far-field exposure in whole-body resonance frequency and GHz regions. *Bioelectromagnetics, 28*(6), 484–487. https://doi.org/10.1002/bem.20335

[26] Flintoft, I. D., Robinson, M. P., Melia, G. C. R., Dawson, J. F., & Marvin, A. C. (2014). Average absorption cross-section of the human body measured at 1–12 GHz in a reverberant chamber: Results of a human volunteer study. *Physics in Medicine and Biology, 59*(13), 3297–3317. https://doi.org/10.1088/0031-9155/59/13/3297

[27] Oleson, J., Samulski, T., Clegg, S., Das, S., & Grant, W. (1994). Heating rate modeling and measurements in phantom and in vivo of the human upper extremity in a defective 2450 MHz microwave oven. *Journal of Microwave Power and Electromagnetic Energy, 29*(2), 101–108. https://doi.org/10.1080/08327823.1994.11688237

[28] Bundesamt für Gesundheit. (n.d.). *Faktenblatt Mikrowellenofen*. Retrieved October 20, 2026, from https://www.bag.admin.ch/dam/en/sd-web/JbnegZr3mAZv/faktenblatt-mikrowellenofen.pdf

[29] Kientega, T., et al. (2011). A surrogate model to assess the whole body SAR induced by multiple plane waves at 2.4 GHz. *Annals of Telecommunications, 66*, 419–428. https://doi.org/10.1007/s12243-011-0261-z
