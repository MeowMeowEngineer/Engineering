# 전자레인지 누설 SAR 해석: CST 매크로 사용 안내

전체 연구 설계는 `../전자레인지 누설 SAR 시뮬레이션 사양서.md`를 따른다. 이 폴더는 그 사양서의 모델을 CST에서 바로 만드는 매크로다.
매크로는 CST 없이 작성했고 실행 검증을 하지 않았다. 실행 중 오류가 나면 해당 블록만 GUI로 만들거나 키워드를 고친다.

## 파일
| 파일 | 내용 |
|---|---|
| `01_setup_oven.bas` | 단위, 경계, 재질 9종, 파라미터, 전자레인지(본체, 캐비티, 문 틈, WR-340 도파관, 프로브, 물 275 g), 이산 포트, 모니터 |
| `02_adult_phantom.bas` | 성인 단순화 모형 (약 74 kg), 파라미터 `d_adult` = 문 ~ 몸통 앞면 거리 |
| `03_child_phantom.bas` | 아동 단순화 모형 (약 22 kg, 6~7세), 파라미터 `d_child` = 문 ~ 얼굴 앞면 거리 |
| `preview_geometry.py` | 같은 치수로 배치도를 그리고 모형 질량 계산 (`python3 preview_geometry.py 500 50`) |
| `preview_adult.png`, `preview_child.png` | 배치도 (성인 500 mm, 아동 50 mm) |

## 프로젝트 구성 (3개)
1. `oven_only`: 01만 실행 → **보정용**
2. `oven_adult`: 01 + 02 → `d_adult` = 300 / 500 / 1000 파라미터 스윕
3. `oven_child`: 01 + 03 → `d_child` = 50 / 100 파라미터 스윕

## 실행 순서
1. 새 프로젝트(MW & RF & Optical > Antennas 등 아무 템플릿, 또는 빈 프로젝트) → Macros > Run Macro → `01_setup_oven.bas`
2. 모델 확인: 문(oven:door)이 본체와 떨어져 있고, 문 뒤 1 mm·가장자리 1 mm 틈이 보이는지. 포트가 도파관 윗벽과 프로브 사이에 있는지.
3. 메쉬 (GUI에서 설정):
   - 전역: Cells per wavelength 15 이상
   - 문 틈: `oven:door`와 본체 문 주변에 local mesh, 최대 셀 0.5 mm (틈 1 mm에 셀 2개 이상)
   - 인체: component 전체 local mesh, 최대 셀 2 mm, 눈 주변 1 mm
4. 해석: Time Domain, 포트 1 여기, 정상상태 -40 dB. 공진 캐비티라 오래 걸리면 Frequency Domain 솔버(2.45 GHz 단일 주파수)도 고려.
5. 사람 모형 프로젝트는 01 실행 후 02 또는 03 실행 → Parameter Sweep으로 거리 변경.

## 보정 (oven_only)
1. 2.45 GHz E-field 모니터에서 평면 y = 50 mm(문 바깥 5 cm)의 |E| 최댓값을 찾는다. 범위는 문 영역 x ±200, z 880~1170.
2. CST 값은 peak이므로 E_rms = E_peak / √2. CST 기본 정규화는 stimulated power 0.5 W (peak 1 W)인지 확인.
3. 시나리오 배율 k = (E_target / E_rms,sim)²
   - A 정상 제품: E_target = 13.7 V/m (0.5 W/m² = 0.05 mW/cm²)
   - B 법정 상한: E_target = 137 V/m (50 W/m² = 5 mW/cm²)
4. 같은 포트 입력이면 사람 모형 프로젝트의 모든 SAR·손실값에 k를 곱한다 (SAR ∝ 입력 전력).
   - 사람이 있으면 누설 분포가 조금 바뀐다. 아동 5 cm 시나리오는 보정 평면과 얼굴이 겹치므로 반드시 oven_only의 k를 쓴다.
5. 기준 도달 배수 = 기준값 / (시나리오 A의 SAR).

## SAR 계산 (사람 모형 프로젝트)
- Post-Processing > Template Based Post-Processing > 2D and 3D Field Results > SAR
  - 손실 모니터: `loss (f=2.45)`
  - 평균 질량 1 g, 10 g 각각, 평균 방법 IEEE/IEC 62704-1
  - 출력: 최대 국부 SAR(1 g, 10 g), 전신 평균 SAR(전체 흡수 전력 / 모형 질량)
- 눈 SAR: 재질별 손실(Loss and Q / power loss per material 또는 per solid)에서 `Eye_vitreous`+`Eye_lens` 흡수 전력 / 눈 질량
- 비교 기준(국내 일반인, 원문 확인 필요): 전신 0.08 W/kg, 머리·몸통 1 g 1.6 W/kg, 2.45 GHz 전력밀도 약 10 W/m²

## 결과 기록 표 (이걸 논문 세션으로 돌려줄 것)
| 프로젝트 | 거리 | 보정 E_rms (5 cm, sim) | k_A | 전신 SAR (sim) | 1 g 최대 | 10 g 최대 | 눈 SAR | 몸 앞 전력밀도 |
|---|---|---|---|---|---|---|---|---|
| oven_only | - | | | - | - | - | - | - |
| oven_adult | 300 | | | | | | | |
| oven_adult | 500 | | | | | | | |
| oven_adult | 1000 | | | | | | | |
| oven_child | 50 | | | | | | | |
| oven_child | 100 | | | | | | | |

함께 기록: 셀 수, 최소 셀 크기, 솔버, 계산 시간, 에너지 수렴 값, CST 버전.

## 모델 한계 (논문 "한계" 절에 쓸 것)
- 문 초크와 타공 메쉬를 모델링하지 않았다. 누설 절대값은 보정으로 맞추고, 모델은 문 둘레에서 새는 분포의 모양만 제공한다.
- 인체는 원기둥·구 조합의 단순화 모형이다. 해부학적 voxel 모형(CST Bio Models 등)과 차이가 있다.
- 바닥, 조리대, 벽 반사는 넣지 않았다.
- 조직 물성은 2.45 GHz 단일 주파수 상수값이다.
