# Laura Bassi Scholarship 2026 겨울 지원 자료

마감 2026-11-15 · 결과 발표 2026-12-04

## 파일

| 파일 | 내용 |
|---|---|
| [form/ep_bassi_scholarship_form_winter2026_DRAFT.pdf](form/ep_bassi_scholarship_form_winter2026_DRAFT.pdf) | 제출용 신청서 초안. 노란 표시가 채울 항목 |
| [cv/CV_JangEunsung_LauraBassi.pdf](cv/CV_JangEunsung_LauraBassi.pdf) | 업로드용 CV 2쪽 |
| [cv/CV_JangEunsung_LauraBassi.docx](cv/CV_JangEunsung_LauraBassi.docx) | 봄 CV에 새 실적을 넣은 수정본 |
| [application_form.md](application_form.md) | 신청서 칸별 입력값과 에세이 원문. A안(권장)과 B안(대안) |
| [form/build_form.py](form/build_form.py) | application_form.md의 에세이로 신청서 PDF를 다시 만드는 스크립트 |
| [form/template_spring2026.pdf](form/template_spring2026.pdf) | 봄 제출본. build_form.py가 바탕으로 쓰는 원본 |

## 봄 지원서와 비교

올려주신 신청서는 Spring 2026 회차(2026-03-06 서명) 제출본입니다. 그때 원고는 IEEE IoT-J 논문 "Design of Dual Polarized Distributed FMCW Radar System with High Gain Lens Array Antenna for Through the Wall Human Detection Application"이었습니다. 이 논문은 CV에 2025년 게재로 올라 있습니다. 이 장학금은 원고 교정을 지원하므로, 이번에는 아직 교정이 필요한 원고를 내세우는 편이 사실과 맞고 설득력도 높습니다.

- **A안 (권장)**: IoT-J 이후 원고. APMC 2025(머신러닝 거리 빈 선택)와 2026 동계 한국전자파학회(대역 에너지 차 기반 채널 결합)를 하나의 처리 흐름으로 묶어 측면 이동 탐지를 측정으로 검증하는 저널 원고로 가정했습니다. 봄 에세이에 쓰신 사실(직교 편파 노드 2개, 편파 합성, 콘크리트 벽)과 연구 과제명을 넣었습니다.
- **B안**: 심사 중인 동축 케이블 논문. 원고가 이미 있어 리뷰 뒤 수정본 교정에 바로 쓸 수 있습니다.

봄 에세이는 "significantly improve", "new insights", "Overall, ..."처럼 근거 없는 수식어와 요약 문장이 많았습니다. 새 에세이는 구체적인 사건(2022년 광주 화정동 붕괴), 본인 논문별 기여, 측정 비교 항목으로 채웠습니다.

## CV에서 바꾼 것

봄 CV(DOCX)의 서식을 그대로 두고 아래만 넣었습니다.

- Journal Papers 2번: Eunsung Jang, Eunsung You, and Jeong-Wook Kim, "Coaxial Cable Loss Reduction through Uniform Air-Hole PTFE Dielectric Fabricated by Ram Extrusion," under review.
- Conference Papers 4번: 2026 KICS Summer Conference, C-band ISAC 렌즈 결합 적층 패치 안테나 단위 셀. 제목은 직역했습니다.
- Awards & Honors: 2026 Master's Excellence Scholarship (Science & Engineering).
- RESEARCH PROJECTS가 1·2쪽에 걸쳐 끊겨서 2쪽 첫머리로 옮기고, 빈 줄 2개를 지워 2쪽을 유지했습니다.

BK21 우수논문상은 이번 메시지에 "2025"로 적혀 있었지만, 봄 CV와 포트폴리오가 모두 2026이라 2026으로 두었습니다.

## 신청서 PDF

봄 제출본 PDF 위에 덮어 쓰는 방식입니다. 에세이 칸 2개, 회차 체크(Spring → Winter), 날짜만 바뀌고 이름·이메일·기관·학과·학위는 봄 값 그대로입니다. 에세이는 12pt Liberation Serif(Times 계열)로 들어갑니다.

`[CONFIRM: ...]` 항목을 application_form.md에서 채운 뒤 다시 만듭니다. 자리표시자가 하나라도 남으면 파일 이름에 `_DRAFT`가 붙습니다.

```
python3 form/build_form.py --version A --date 2026.11.10
python3 form/build_form.py --version A --department "Electrical and Computer Engineering"   # 학과 칸을 바꿀 때
soffice --headless --convert-to pdf --outdir cv cv/CV_JangEunsung_LauraBassi.docx         # CV PDF
```

## 양식 확인 결과

- 제출물: 신청서와 CV를 포털에서 함께 올립니다.
- 에세이 2개, 각 250단어 이내: 원고의 목적, 연구가 분야에 주는 도움.
- 신청비: 자율 납부 USD 10.00. 낼 수 없는 지원자는 누구나 포털의 면제(fee waiver)를 쓸 수 있습니다. (앞선 초안에 "첫 지원자만"이라고 적었던 것은 틀렸습니다.)
- 심사는 덜 다뤄진 주제(neglected topics)인지를 봅니다. 두 에세이 모두 기존 연구가 빠뜨린 경우를 문장으로 밝혔습니다.
- editing.press는 작업 환경의 네트워크 정책에서 막혀 포털 화면은 직접 확인하지 못했습니다.

## 제출 전 확인할 것

1. application_form.md의 `[CONFIRM: ...]`를 모두 채웁니다. A안 기준 투고 저널, 투고 시기, 벽 종류, 피험자 수·동작, 핵심 수치입니다.
2. 채운 뒤 단어 수를 다시 셉니다. 자리표시자를 뺀 지금 단어 수는 A1 205, A2 231, B1 174, B2 184입니다.
3. 학과 이름: 신청서는 "Artificial Intelligence Convergence", CV는 "Ph.D. Course in Electrical and Computer Engineering"입니다. 같은 지원서 안에서 하나로 맞춥니다.
4. 새 공저자 영문 표기(Seung-Hyuk Choi, Min-Jun Cho, Sung-Hoon Kim)와 KICS 논문 영문 제목을 확인합니다.
5. 2026 가을 학기 TA처럼 봄 이후 추가된 경력이 있으면 CV에 넣습니다.
6. A2의 일반론 두 문장("구조 현장은 탐지견·음향 탐지기·카메라에 의존한다", "벽 투과 레이다는 대부분 단일 레이다·단일 편파를 쓴다")이 본인 문헌 조사와 맞는지 봅니다. 화정동 붕괴 날짜와 실종자 수는 보도로 확인했습니다.
7. 제출하는 날짜로 `--date`를 넣어 신청서를 다시 만듭니다.
