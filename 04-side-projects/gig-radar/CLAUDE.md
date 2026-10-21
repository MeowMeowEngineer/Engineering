# 작업 규칙

- 원본은 `src/rf.html`과 `src/ai.html`입니다. 고친 뒤에는 `./build-apk.sh && python3 build.py`로 앱과 웹을 모두 다시 만들고 `public/`까지 커밋합니다. `public/`을 직접 고치지 않습니다.
- `src/*.html`은 Artifact로도 올립니다. `<!doctype>`, `<html>`, `<head>`, `<body>` 태그를 넣지 않습니다(Artifact와 `build.py`가 붙입니다). `<!-- site-nav -->`, `<!-- app-download -->` 자리표시는 지우지 않습니다.
  - RF: https://claude.ai/artifact/U1nsuMd342ToxM2cW3zKFg
  - AI: https://claude.ai/artifact/KYMzauoAkPrAzNz8icz2nS
- 공고를 페이지에 직접 적지 않습니다. 각 사이트의 검색 결과로 연결합니다.
- 보수·조건처럼 출처가 있는 내용은 footer 출처 목록과 기준일을 같이 고칩니다. 확인하지 못한 단가는 적지 않습니다.
- 앱 버전을 올릴 때는 `VERSION_CODE`, `VERSION_NAME`을 올려 빌드합니다(`build-apk.sh` 기본값도 같이 고칩니다).
- 커밋 작성자는 `MeowMeowEngineer <123224214+MeowMeowEngineer@users.noreply.github.com>`로 합니다. Vercel이 작성자를 확인합니다.
- 휴대폰 폭(390px)에서 가로로 넘치는지 확인합니다. 그리드 칸에는 `minmax(0, 1fr)`을 씁니다.
