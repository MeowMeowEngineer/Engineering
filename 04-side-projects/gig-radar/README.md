# 일감 레이더

전공과 기술을 살리는 프리랜서·파트타임 일감을 분야별로 모은 정적 사이트와 안드로이드 앱입니다. 페이지는 두 개입니다.

| 페이지 | 주소 | 내용 |
|---|---|---|
| RF 일감 레이더 | `/` | 전파·안테나·레이다 전공으로 할 수 있는 일 8개 분야: AI 전공 평가, 안테나·RF 설계 외주, 레이다 신호처리, RF 측정, R&D 제안서, 특허 검토, 전문가 자문, 과외 |
| 생성형 AI 긱 보드 | `/ai/` | AI오투오(o2osolution.ai)가 하는 협상 AI, 마케팅 자동화, AI 콘텐츠 생성과 같은 종류의 일 5개 분야 |

각 분야에는 하는 일, 필요한 기술, 공개 공고의 보수, 실제 검색 결과로 가는 링크가 있습니다. 공고 자체는 금방 마감되므로 페이지에 적지 않습니다. 찾은 공고는 '내 지원 목록'에 저장하면 마감일 순으로 정렬됩니다.

- 주소: https://gig-radar.vercel.app (지금은 모든 페이지 noindex)
- Artifact 판: [RF 일감 레이더](https://claude.ai/artifact/U1nsuMd342ToxM2cW3zKFg), [생성형 AI 긱 보드](https://claude.ai/artifact/KYMzauoAkPrAzNz8icz2nS). claude.ai에서는 지원 목록이 계정에 저장됩니다.

## 구조

| 경로 | 내용 |
|---|---|
| `src/rf.html`, `src/ai.html` | 원본. Artifact에 올리는 파일과 같습니다 |
| `build.py` | 원본을 완전한 문서로 감쌉니다. `python3 build.py`는 `public/`(웹, PWA 포함), `python3 build.py app`은 `build/www/`(앱용) |
| `assets/sw.js` | 서비스 워커. 한 번 연 페이지는 인터넷 없이도 열립니다 |
| `assets/icons/`, `tools/icons.py` | 아이콘과 아이콘 생성 스크립트(Pillow) |
| `android/` | WebView 앱. 페이지를 앱 안에 넣고, 공고 링크는 휴대폰 브라우저로 엽니다 |
| `build-apk.sh` | Gradle 없이 APK를 만들어 `public/download/gig-radar.apk`에 둡니다 |
| `public/` | 빌드 결과. Vercel이 그대로 배포합니다 |

## 명령

```bash
python3 build.py                                   # 웹만 다시 만들기
./build-apk.sh && python3 build.py                 # 앱까지 다시 만들기
python3 -m http.server 8853 --directory public     # http://127.0.0.1:8853
```

APK 빌드에는 JDK 17 이상과 Ubuntu 패키지 `aapt apksigner zipalign android-sdk-platform-23 dalvik-exchange`가 필요합니다.

```bash
sudo apt-get install -y aapt apksigner zipalign android-sdk-platform-23 dalvik-exchange
```

## 앱 서명 키

`android/gig-radar.keystore`는 저장소에 넣지 않습니다(`.gitignore`). 키가 없으면 `build-apk.sh`가 새로 만들고, 그 경우 이전에 설치한 앱 위에 덮어 설치할 수 없어 앱을 지우고 다시 설치해야 합니다. 같은 키를 계속 쓰려면 키 파일을 따로 보관하고 `KEYSTORE=경로 KEYSTORE_PASS=암호 ./build-apk.sh`로 빌드합니다.

## 배포 (Vercel)

1. https://vercel.com/new 에서 GitHub 저장소 `gig-radar`를 Import 합니다.
2. Project Name은 `gig-radar`로 둡니다. 이 이름이 주소(`gig-radar.vercel.app`)가 됩니다. 이미 쓰이는 이름이면 다른 이름으로 만든 뒤 Settings → Domains에 원하는 `*.vercel.app` 주소를 추가하고, `build.py`의 `SITE_URL`을 그 주소로 바꿔 다시 빌드합니다.
3. Framework Preset은 `Other`, Build Command는 비우고, Output Directory는 `public`으로 둡니다(`vercel.json`에도 적혀 있습니다).
4. Deploy를 누릅니다. 그 뒤로는 `main`에 push할 때마다 자동으로 배포됩니다.
5. `gig-radar-…-jangstar-5887.vercel.app` 같은 배포별 주소는 Vercel에 로그인한 사람만 열립니다. 남에게는 `gig-radar.vercel.app`을 보냅니다.

검색엔진에 노출하려면 `vercel.json`의 `X-Robots-Tag` 헤더, `build.py`의 robots 메타와 `robots.txt` 내용을 지운 뒤 다시 빌드해 push합니다.
