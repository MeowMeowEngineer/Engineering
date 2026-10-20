# 📄 포켓 문서 뷰어 (Pocket Doc Viewer)

휴대폰에서 **워드·엑셀·피피티·PDF·한글** 문서를 바로 여는 무료 문서 뷰어입니다. React로 만들었고, 웹 앱(PWA)과 안드로이드 앱(APK) 두 가지로 배포합니다.

문서는 **기기 안에서만** 열립니다. 서버로 보내지 않고, 광고·회원가입·인터넷 연결이 필요 없습니다. 안드로이드 앱은 인터넷 권한도 저장소 권한도 요청하지 않습니다.

<img src="docs/hero.png" alt="포켓 문서 뷰어 화면: 첫 화면, PDF, Word, Excel, PowerPoint, 한글" width="100%">

## 휴대폰에서 바로 써 보기

| 방법 | 설치 |
|---|---|
| **웹 앱** | GitHub Pages 주소를 휴대폰 브라우저로 열고 메뉴의 **홈 화면에 추가**를 누르면 앱처럼 설치됩니다. 한 번 열면 오프라인에서도 동작합니다. |
| **안드로이드 APK** | 릴리스 페이지에서 `pocket-doc-viewer.apk`를 받아 설치합니다. 처음 한 번은 '출처를 알 수 없는 앱 설치'를 허용해야 합니다. 설치 후에는 파일 관리자·카카오톡·메일에서 문서를 **열기/공유 → 포켓 문서 뷰어**로 바로 열 수 있습니다. |

웹 앱 배포와 APK 빌드는 [`.github/workflows/build.yml`](.github/workflows/build.yml)이 자동으로 합니다. 이 폴더를 독립 저장소로 옮기면 바로 동작합니다(저장소 Settings → Pages → Source를 **GitHub Actions**로 지정).

## 지원 형식

| 형식 | 확장자 | 렌더링 방식 |
|---|---|---|
| PDF | `.pdf` | [pdf.js](https://github.com/mozilla/pdf.js) (legacy 빌드). 한글 CID 글꼴용 CMap을 앱 안에 넣어 오프라인에서도 글자가 깨지지 않음. 암호 PDF 지원 |
| Word | `.docx` | [docx-preview](https://github.com/VolodymyrBaydalka/docxjs) |
| Excel | `.xlsx` `.xls` `.ods` `.csv` `.tsv` | [SheetJS](https://sheetjs.com) + 직접 만든 표 화면 (병합 셀, 열 너비, 시트 탭, 행·열 머리글 고정). CSV는 UTF-8/EUC-KR 자동 판별 |
| PowerPoint | `.pptx` | **직접 만든 PPTX 렌더러** ([src/lib/pptx.ts](src/lib/pptx.ts)) |
| 한글 | `.hwpx` | **직접 만든 HWPX 렌더러** ([src/lib/hwpx.ts](src/lib/hwpx.ts)) |
| 한글 | `.hwp` (5.0) | [hwp.js](https://github.com/hahnlee/hwp.js) |
| 텍스트 | `.txt` `.md` `.json` 등 | UTF-8/EUC-KR 자동 판별 |

예전 바이너리 형식(`.doc`, `.ppt`), 암호가 걸린 오피스 문서, HWP 3.0은 열 수 없는 이유를 안내합니다.

## 직접 구현한 부분

### PPTX 렌더러
PowerPoint 파일(ZIP 안의 XML)을 해석해 슬라이드 좌표 그대로 HTML/SVG로 그립니다.
- **상속 해석**: 슬라이드 → 레이아웃 → 마스터 순으로 placeholder 위치, 글자 크기·색, 글머리 기호, 배경을 찾아 내려갑니다. 마스터·레이아웃의 로고나 장식 도형도 함께 그립니다.
- **테마 색**: `schemeClr`를 clrMap과 테마로 풀고, `lumMod`·`lumOff`·`tint`·`shade`·`alpha` 변형을 HSL 계산으로 적용합니다.
- **도형**: 사각형·둥근 사각형·타원은 CSS로, 삼각형·화살표·별·육각형 등은 SVG로 그립니다. 그룹 도형의 자식 좌표계 변환, 회전·뒤집기, 그라데이션, 그림 채우기, 표(병합 셀), 발표자 노트를 지원합니다.

### HWPX 렌더러
한글 문서 표준(OWPML, KS X 6101)을 직접 해석합니다.
- `header.xml`의 글자 모양(크기, 색, 굵게, 글꼴), 문단 모양(정렬, 여백, 들여쓰기·내어쓰기, 줄 간격), 테두리·배경을 읽어 CSS로 옮깁니다.
- **표**: 셀 병합이 많은 공공기관 서식도 깨지지 않도록, 병합되지 않은 셀로 열 너비를 먼저 정하고 병합 셀로 남은 열을 채우는 방식으로 열 너비를 역산합니다.
- **쪽 나눔**: 한글이 저장해 둔 줄 배치 정보(`lineseg`)의 세로 위치가 다시 작아지는 지점을 찾아, 한글 프로그램과 같은 위치에서 쪽을 나눕니다.

### 형식 판별
확장자보다 **파일 내용(매직 바이트)** 을 먼저 봅니다. 안드로이드에서 다른 앱이 넘겨준 파일은 이름이 `msf:1234`처럼 확장자가 없거나 틀린 경우가 많기 때문입니다. ZIP이면 안의 구성 파일로 DOCX/XLSX/PPTX/HWPX를, OLE 복합 문서면 스트림 이름으로 HWP/XLS/DOC/PPT를 구분합니다.

### 휴대폰 사용성
- 두 손가락 확대·축소(손가락 사이 지점을 기준으로 확대), 화면 폭 맞춤, 확대 단계 버튼
- PDF는 화면 근처의 쪽만 그리고 멀어진 쪽의 캔버스는 비워 메모리를 아낍니다. 확대하는 동안에는 다시 그리기를 잠시 미룹니다.
- 최근 문서 12개를 기기 안(IndexedDB)에만 저장, 다크 모드, 노치·제스처 영역(safe area) 대응
- 안드로이드 뒤로 가기 버튼, 브라우저 뒤로 가기로 문서 닫기

## 보안

다른 사람이 보낸 문서를 여는 앱이므로, 문서가 악성이어도 피해가 없도록 설계했습니다.
- **콘텐츠 보안 정책(CSP)**: 앱 자신의 스크립트만 실행하고(`script-src 'self'`), 외부로 통신하지 못하게 막습니다(`connect-src 'self'`). 문서 안에 스크립트가 숨어 있어도 실행되지 않습니다.
- 문서 안의 링크는 `http(s)`·`mailto`만 남기고 `javascript:` 링크는 제거합니다. Word 문서에 끼워 넣은 HTML 조각(altChunk)은 그리지 않습니다.
- pdf.js는 알려진 임의 코드 실행 취약점([GHSA-hq66-cqwq-w95j](https://github.com/advisories/GHSA-hq66-cqwq-w95j))이 고쳐진 6.x를 씁니다. PPTX 미리보기 라이브러리 후보였던 `pptx-preview`는 소스가 비공개이고 XSS 취약점이 있는 의존성을 포함하고 있어, 쓰지 않고 렌더러를 직접 만들었습니다.
- 안드로이드 앱은 권한을 하나도 요청하지 않습니다. 다른 앱이 넘겨준 문서는 그 순간 허락된 읽기 권한으로만 읽습니다.

## 구조

```
src/
├─ App.tsx                 첫 화면, 문서 화면, 툴바, 파일 열기 흐름
├─ usePinchZoom.ts         두 손가락 확대
├─ lib/
│  ├─ detect.ts            매직 바이트 기반 형식 판별, 텍스트 인코딩 판별
│  ├─ pptx.ts              PPTX 해석기 (직접 구현)
│  ├─ hwpx.ts              HWPX 해석기 (직접 구현)
│  ├─ xml.ts               네임스페이스와 무관한 XML 탐색 도우미
│  ├─ recent.ts            최근 문서 (IndexedDB)
│  └─ native.ts            안드로이드 '열기/공유' 연동, 뒤로 가기
└─ viewers/                형식별 뷰어 (처음 열 때 내려받는 지연 로딩)
android/                   Capacitor 안드로이드 프로젝트
└─ .../OpenedFilePlugin.java  다른 앱이 넘겨준 content:// 문서 읽기
scripts/
├─ make-samples.py         데모·테스트용 샘플 문서 생성 (docx, xlsx, pptx, pdf, hwpx, csv)
├─ make-icons.py           앱 아이콘·스플래시 생성
└─ screenshots.mjs         휴대폰 화면 크기로 형식별 화면 촬영 + 콘솔 오류 검사
```

## 개발

```bash
npm install
npm run dev          # 개발 서버
npm test             # 단위 테스트 (형식 판별, HWPX·PPTX 해석)
npm run build        # dist/ 에 PWA 빌드
npm run android:apk  # Android SDK가 있으면 APK 빌드
```

`main` 브랜치에 올리면 GitHub Actions가 린트, 단위 테스트, 휴대폰 화면 스모크 테스트를 거쳐 웹 앱을 GitHub Pages에 배포하고 APK를 빌드해 릴리스에 올립니다. APK는 저장소에 들어 있는 공개 디버그 키로 서명하므로 새 버전이 이전 설치본 위에 업데이트됩니다(구글 플레이 배포용 키는 아닙니다).

## 기술

`React 19` `TypeScript` `Vite` `PWA (Workbox)` `Capacitor (Android)` `pdf.js` `docx-preview` `SheetJS` `hwp.js` `JSZip` `Vitest` `Playwright` `GitHub Actions`

## 라이선스

MIT. 사용한 라이브러리는 각자의 라이선스(pdf.js·docx-preview·SheetJS·hwp.js: Apache-2.0, JSZip: MIT)를 따릅니다.
