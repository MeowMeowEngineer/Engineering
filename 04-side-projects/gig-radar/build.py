"""src/*.html(Artifact 원본)을 완전한 문서로 감싸 사이트와 앱 자산을 만든다.

python3 build.py          → public/ (Vercel 배포용, PWA 포함)
python3 build.py app      → build/www/ (안드로이드 앱에 넣는 파일, 서비스 워커 없음)
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys

ROOT = Path(__file__).parent
SITE_URL = "https://gig-radar.vercel.app"
SITE_NAME = "일감 레이더"
APK_NAME = "gig-radar.apk"
THEME = "#0F1B2A"

PAGES = [
    {
        "src": "rf.html", "out": "index.html", "path": "/",
        "description": "전파·안테나·레이다 전공을 살리는 프리랜서·파트타임 일감. AI 전공 평가, 안테나 설계 외주, RF 측정, 특허 검토, 전문가 자문까지 분야별 검색 링크와 지원 목록.",
        "nav": [("RF 전공 일감", None), ("생성형 AI 일감", "ai/")],
    },
    {
        "src": "ai.html", "out": "ai/index.html", "path": "/ai/",
        "description": "AI오투오가 하는 협상 AI, 마케팅 자동화, AI 콘텐츠 생성과 같은 종류의 일을 프리랜서·파트타임으로 찾는 검색 링크 모음과 지원 목록.",
        "nav": [("RF 전공 일감", "../"), ("생성형 AI 일감", None)],
    },
]

NAV_STYLE = """<style>
.site-nav { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; font-size: 14px; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.site-nav .brand { font-weight: 700; margin-right: auto; }
.site-nav a { color: var(--muted); text-decoration: none; padding: 2px 0; border-bottom: 2px solid transparent; }
.site-nav a:hover { color: var(--accent); }
.site-nav [aria-current="page"] { color: var(--ink); border-bottom-color: var(--accent); font-weight: 500; }
.app-get { display: grid; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 18px; }
.app-get ol { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; font-size: 14px; }
.app-get .get { justify-self: start; display: inline-block; text-decoration: none; font-weight: 500; border-radius: 6px; padding: 8px 14px; background: var(--accent); color: var(--accent-ink); }
</style>"""

APP_SECTION = """<section aria-labelledby="h-app" class="app-get">
    <h2 id="h-app">앱으로 쓰기</h2>
    <p class="muted">두 방법 모두 RF 전공 일감과 생성형 AI 일감 페이지가 함께 들어 있습니다. 지원 목록은 설치한 기기 안에만 저장됩니다.</p>
    <a class="get" href="/download/{apk}" download>안드로이드 앱 받기 (.apk)</a>
    <ol>
      <li><b>안드로이드 앱</b>: 위 버튼으로 받은 파일을 열고, '출처를 알 수 없는 앱 설치'를 이 브라우저에 허용한 뒤 설치합니다.</li>
      <li><b>홈 화면에 추가</b>: 크롬은 메뉴(⋮) → '홈 화면에 추가', 아이폰 사파리는 공유 버튼 → '홈 화면에 추가'를 누릅니다.</li>
    </ol>
  </section>"""


def nav_html(items):
    parts = ['<nav class="site-nav" aria-label="사이트 메뉴"><span class="brand">' + SITE_NAME + "</span>"]
    for label, href in items:
        if href is None:
            parts.append('<span aria-current="page">' + label + "</span>")
        else:
            parts.append('<a href="' + href + '">' + label + "</a>")
    return "".join(parts) + "</nav>"


def render(page, target, version):
    src = (ROOT / "src" / page["src"]).read_text(encoding="utf-8")
    split = src.index('<div class="wrap">')
    head, body = src[:split], src[split:]
    head = re.sub(r'<meta name="claude:viewport-fit-sides"[^>]*>\n?', "", head)
    title = re.search(r"<title>(.*?)</title>", head).group(1)
    depth = page["out"].count("/")
    up = "../" * depth

    body = body.replace("<!-- site-nav -->", nav_html(page["nav"]))
    body = body.replace("<!-- app-download -->", APP_SECTION.format(apk=APK_NAME) if target == "web" else "")

    meta = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        '<meta name="description" content="' + page["description"] + '">',
        '<meta name="theme-color" content="' + THEME + '">',
        '<link rel="icon" href="' + up + 'icons/favicon.svg" type="image/svg+xml">',
    ]
    if target == "web":
        meta += [
            '<meta name="robots" content="noindex, nofollow">',
            '<link rel="canonical" href="' + SITE_URL + page["path"] + '">',
            '<meta property="og:type" content="website">',
            '<meta property="og:site_name" content="' + SITE_NAME + '">',
            '<meta property="og:locale" content="ko_KR">',
            '<meta property="og:title" content="' + title + '">',
            '<meta property="og:description" content="' + page["description"] + '">',
            '<meta property="og:url" content="' + SITE_URL + page["path"] + '">',
            '<link rel="manifest" href="/manifest.webmanifest">',
            '<link rel="apple-touch-icon" href="/icons/icon-180.png">',
            '<meta name="apple-mobile-web-app-title" content="' + SITE_NAME + '">',
        ]
    reset = """<style>
:root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>"""
    sw = ""
    if target == "web":
        sw = ("<script>if ('serviceWorker' in navigator) { window.addEventListener('load', function () { "
              "navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }</script>\n")
    return ("<!doctype html>\n<html lang=\"ko\">\n<head>\n" + "\n".join(meta) + "\n" + reset + "\n"
            + head.strip() + "\n" + NAV_STYLE + "\n</head>\n<body>\n" + body.strip() + "\n" + sw
            + "<!-- build " + version + " -->\n</body>\n</html>\n")


def main():
    target = "app" if len(sys.argv) > 1 and sys.argv[1] == "app" else "web"
    out = ROOT / ("build/www" if target == "app" else "public")
    srcs = b"".join((ROOT / "src" / p["src"]).read_bytes() for p in PAGES)
    version = hashlib.sha256(srcs).hexdigest()[:10]

    keep_apk = None
    apk = out / "download" / APK_NAME
    if target == "web" and apk.exists():
        keep_apk = apk.read_bytes()
    if out.exists():
        shutil.rmtree(out)
    for p in PAGES:
        f = out / p["out"]
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(render(p, target, version), encoding="utf-8")
    shutil.copytree(ROOT / "assets" / "icons", out / "icons")

    if target == "web":
        (out / "manifest.webmanifest").write_text(json.dumps({
            "name": SITE_NAME, "short_name": SITE_NAME, "lang": "ko",
            "description": PAGES[0]["description"],
            "start_url": "/", "scope": "/", "display": "standalone",
            "background_color": THEME, "theme_color": THEME,
            "icons": [
                {"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                {"src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            ],
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        sw = (ROOT / "assets" / "sw.js").read_text(encoding="utf-8").replace("__VERSION__", version)
        (out / "sw.js").write_text(sw, encoding="utf-8")
        (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
        if keep_apk:
            apk.parent.mkdir(parents=True, exist_ok=True)
            apk.write_bytes(keep_apk)
    print(target, out.relative_to(ROOT), "version", version)


if __name__ == "__main__":
    main()
