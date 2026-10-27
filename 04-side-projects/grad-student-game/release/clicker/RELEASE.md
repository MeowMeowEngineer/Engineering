# 대학원생 키우기 · Google Play 출시 절차

클리커(`../../prototype`)를 Capacitor로 감싸 안드로이드 앱(AAB)으로 낸다. 이 폴더에는 출시 빌드, 아이콘, 스토어 그래픽, 등록 문구, 개인정보처리방침이 있다. AAB 빌드와 Play Console 작업은 개발자 PC에서 직접 한다.

| 항목 | 값 |
|---|---|
| 패키지 이름(applicationId) | `io.github.meowmeowengineer.gradstudent` — 한 번 올리면 바꿀 수 없다 |
| 버전 | `app.json`의 `versionName` 1.0.0, `versionCode` 1 |
| SDK | compileSdk 36, targetSdk 36, minSdk 24 (안드로이드 7.0 이상) |
| Capacitor | 8.5.3 |
| 권한 | INTERNET(Capacitor 기본값. 게임은 인터넷 없이 돈다) |

## 0. 출시 빌드가 웹 버전과 다른 점

`build.js`가 `window.__GRAD_RELEASE__ = true`를 넣으면 게임 화면이 아래처럼 바뀐다.

- 랭킹 탭과 클라우드 저장을 뺀다. 둘 다 claude.ai 런타임에서만 돈다.
- 상점에서 광고 버튼과 가상 결제 상품을 뺀다. 출석 보상과 커피 쿠폰은 남는다.
- 방치 보상 창에 광고 2배 버튼이 없다.
- 글꼴(IBM Plex Sans KR, Black Han Sans, Nanum Pen Script, SIL OFL)을 앱 안에 넣어 인터넷 없이도 같은 글꼴로 그린다.
- 콘텐츠 보안 정책으로 외부 주소 요청을 막는다.

광고나 결제를 나중에 넣으려면 AdMob·Play 결제 SDK를 붙이고, 데이터 보안 답변과 개인정보처리방침을 먼저 고쳐야 한다.

## 1. 준비물

- Node.js 20 이상
- Android Studio (최신 안정판). 설치할 때 Android SDK Platform 36과 Build-Tools를 함께 받는다.
- JDK 21 (Android Studio에 들어 있는 JBR을 쓰면 된다)
- Google Play Console 개발자 계정 (등록비 25달러, 한 번만 낸다)

> 이 저장소를 만든 클라우드 환경에서는 `dl.google.com`이 막혀 있어 Android SDK를 받지 못했다. 그래서 AAB는 여기서 만들지 않았다. 웹 파일, 아이콘, 안드로이드 프로젝트 설정까지는 준비돼 있다.

## 2. 업로드 키 만들기 (처음 한 번)

Play 앱 서명을 쓰면 Google이 실제 앱 서명 키를 보관하고, 개발자는 업로드 키로 AAB에 서명해 올린다. 업로드 키를 잃어버리면 Play Console에서 재설정을 요청할 수 있다.

```bash
cd release/clicker/android
keytool -genkeypair -v -keystore upload-key.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

같은 폴더에 `keystore.properties`를 만든다.

```properties
storeFile=upload-key.jks
storePassword=키스토어 비밀번호
keyAlias=upload
keyPassword=키 비밀번호
```

- `android/app/build.gradle`이 이 파일을 읽어 release 빌드에 서명한다. 파일이 없으면 서명하지 않은 AAB가 나온다.
- `upload-key.jks`와 `keystore.properties`는 `android/.gitignore`에 들어 있어 커밋되지 않는다. 비밀번호 관리자나 백업 드라이브에 따로 보관한다.

## 3. AAB 만들기

```bash
cd release/clicker
npm install
npm run sync          # build.js로 www/를 만들고 android/에 복사한다
cd android
./gradlew bundleRelease   # Windows는 gradlew.bat bundleRelease
```

결과 파일: `android/app/build/outputs/bundle/release/app-release.aab`

Android Studio를 쓰려면 `npm run open`으로 프로젝트를 열고 Build → Generate Signed App Bundle / APK → Android App Bundle을 고른다.

### 휴대전화에서 먼저 확인하기

USB 디버깅을 켠 휴대전화를 연결하고 Android Studio에서 Run을 누른다. 다음을 확인한다.

- 첫 실행에 성별 선택 창이 뜨고, 글꼴이 손글씨체와 제목체로 보인다.
- 비행기 모드에서도 게임이 열린다.
- 앱을 닫았다가 몇 분 뒤 열면 방치 보상 창이 뜬다.
- 상태 표시줄과 내비게이션 바가 게임 화면을 가리지 않는다.
- 뒤로 가기 버튼을 누르면 앱이 닫힌다.

### 다음 버전을 낼 때

1. `app.json`의 `versionCode`를 1 올리고 `versionName`을 바꾼다(예: 2, "1.0.1"). Play는 같은 versionCode를 두 번 받지 않는다.
2. `npm run sync` 후 `./gradlew bundleRelease`.
3. 게임 코드를 고쳤다면 `node ../../prototype/qa.js`와 `npm run build && NODE_PATH=$(npm root -g) node qa-release.js`가 모두 PASS인지 먼저 확인한다.

### 아이콘·스크린샷을 다시 만들 때

```bash
npm run build
NODE_PATH=$(npm root -g) node make-icons.js   # assets/, store/, android/app/src/main/res/ 아이콘·스플래시
npm run build                                 # 새 아이콘을 www/에 반영
NODE_PATH=$(npm root -g) node qa-release.js   # 출시 빌드 점검 + store/screenshots/ 재생성
```

## 4. 개인정보처리방침 올리기

Play는 공개된 개인정보처리방침 URL을 요구한다.

1. `store/privacy-policy.html`의 `[연락 이메일 주소]`를 문의받을 주소로 바꾼다.
2. 로그인 없이 열리는 주소에 올린다. 예: GitHub Pages(공개 저장소), Notion 공개 페이지, 개인 블로그.
3. 그 주소를 Play Console → 정책 → 앱 콘텐츠 → 개인정보처리방침에 넣는다.

## 5. Play Console 등록

### 5-1. 앱 만들기

Play Console → 앱 만들기

- 앱 이름: 대학원생 키우기
- 기본 언어: 한국어 – ko-KR
- 앱 또는 게임: 게임
- 유료 또는 무료: 무료 (한 번 무료로 내면 유료로 바꿀 수 없다)
- 개발자 프로그램 정책·미국 수출 법규 동의

### 5-2. 앱 콘텐츠 (정책 → 앱 콘텐츠)

| 항목 | 답변 |
|---|---|
| 개인정보처리방침 | 4절에서 올린 URL |
| 앱 액세스 권한 | 모든 기능을 제한 없이 사용할 수 있음 (로그인 없음) |
| 광고 | 아니요, 광고가 없음 |
| 콘텐츠 등급 | 아래 5-3 |
| 타겟층 | 만 18세 이상 (대학원생 대상. 13세 미만을 고르지 않으면 가족 정책 심사를 받지 않는다) |
| 뉴스 앱 | 아니요 |
| 데이터 보안 | 아래 5-4 |
| 정부 앱 | 아니요 |
| 금융 기능 | 해당 없음 |
| 건강 | 해당 없음 |

### 5-3. 콘텐츠 등급 설문 (IARC)

- 카테고리: 게임
- 폭력, 공포, 성적 콘텐츠, 비속어: 없음
- 마약·술·담배: 없음 (커피와 에너지 드링크만 나온다)
- 도박·모의 도박: 없음. 도감 항목은 논문을 쓰거나 방문객을 맞을 때 확률로 얻는다. 돈을 걸거나 현금으로 사는 무작위 뽑기가 없다.
- 사용자 간 소통, 사용자 제작 콘텐츠 공유: 없음
- 위치 공유: 없음
- 디지털 상품 구매: 없음

예상 등급은 전체이용가다.

### 5-4. 데이터 보안 설문

| 질문 | 답변 |
|---|---|
| 필수 사용자 데이터 유형을 수집하거나 공유하나요? | 아니요 |

근거: 게임 진행 상황은 기기 안(웹뷰 localStorage)에만 저장하고 어디로도 보내지 않는다. 계정, 분석 도구, 광고, 오류 보고 SDK가 없다. `qa-release.js`가 게임을 하는 동안 외부 요청이 0건인지 확인한다.

나중에 Firebase, AdMob, 오류 보고 도구 같은 SDK를 붙이면 그 SDK가 보내는 데이터를 다시 신고해야 한다.

### 5-5. 스토어 등록정보

`store/listing.md`의 이름, 간단한 설명, 자세한 설명을 붙여 넣고 그래픽을 올린다.

- 앱 아이콘: `store/icon-512.png`
- 그래픽 이미지: `store/feature-graphic-1024x500.png`
- 휴대전화 스크린샷: `store/screenshots/*.png` (5장)
- 카테고리: 시뮬레이션
- 연락처 이메일: 필수

### 5-6. 테스트 후 프로덕션

2023년 11월 이후 만든 **개인** 개발자 계정은 프로덕션에 바로 낼 수 없다. 비공개 테스트에 테스터 12명 이상이 14일 연속으로 참여해야 프로덕션 신청 버튼이 열린다. 조직 계정은 이 조건이 없다.

1. 테스트 및 출시 → 테스트 → 비공개 테스트 → 트랙 만들기
2. 테스터: 이메일 목록(Google 계정) 또는 Google 그룹에 12명 이상 넣는다. 연구실 동료에게 부탁하기 좋다.
3. 새 버전 만들기 → Play 앱 서명 사용 → `app-release.aab` 업로드 → 출시 노트 작성 → 검토 시작
4. 승인되면 테스트 참여 링크를 테스터에게 보낸다. 테스터는 링크에서 참여를 누르고 앱을 설치한 뒤 14일 동안 지우지 않는다.
5. 14일이 지나면 대시보드 → 프로덕션 액세스 신청. 테스트 중 받은 의견과 고친 내용을 묻는 설문에 답한다.
6. 승인되면 프로덕션 트랙에 같은 AAB(또는 고친 버전)를 올린다. 심사는 보통 며칠 걸린다.

## 6. 출시 전 확인 목록

- [ ] 패키지 이름 `io.github.meowmeowengineer.gradstudent`가 맞는지 확인 (바꾸려면 `app.json`, `capacitor.config.json`, `android/app/build.gradle`의 namespace·applicationId, `android/app/src/main/java/` 아래 폴더 경로, `android/app/src/main/res/values/strings.xml`을 함께 바꾼다)
- [ ] 업로드 키와 `keystore.properties`를 만들고 따로 백업
- [ ] `node ../../prototype/qa.js` 전부 PASS
- [ ] `npm run build && NODE_PATH=$(npm root -g) node qa-release.js` 전부 PASS
- [ ] 실제 휴대전화에서 3절의 확인 항목 통과
- [ ] 개인정보처리방침에 이메일을 넣고 공개 URL에 올림
- [ ] 비공개 테스트 테스터 12명 확보

## 파일 안내

| 파일 | 내용 |
|---|---|
| `app.json` | 앱 이름, 설명, 버전, 색. 빌드 스크립트와 Gradle이 함께 읽는다 |
| `build.js` | 프로토타입을 출시용 `www/`로 만든다 |
| `make-icons.js` | 아이콘, 스플래시, 스토어 그래픽을 그린다 |
| `qa-release.js` | 출시 빌드 점검(인터넷 차단 상태)과 스토어 스크린샷 |
| `capacitor.config.json` | Capacitor 설정 |
| `android/` | 안드로이드 프로젝트 (`npx cap add android`로 만들고 버전·서명 설정을 고침) |
| `store/` | 스토어 등록 문구, 개인정보처리방침, 그래픽 |
