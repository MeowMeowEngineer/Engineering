// 출시용 웹 파일(www/)을 만든다: node build.js
// 프로토타입(../../prototype)의 index.html·engine.js를 그대로 쓰고, 앱에 맞게 아래만 바꾼다.
//   - 출시 모드(window.__GRAD_RELEASE__): 랭킹·클라우드 저장·가상 결제·광고를 뺀다
//   - Google Fonts 대신 앱 안에 넣은 글꼴(@fontsource, SIL OFL)을 쓴다. 인터넷이 없어도 글꼴이 보인다
//   - 문서 머리(charset, viewport, 아이콘, 매니페스트, 콘텐츠 보안 정책)를 붙인다
const fs = require('fs'), path = require('path');
const ROOT = __dirname, SRC = path.join(ROOT, '..', '..', 'prototype'), OUT = path.join(ROOT, 'www');
const APP = require('./app.json');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });

// 1. 글꼴: 쓰는 굵기의 woff2 조각만 복사하고 CSS 경로를 fonts/로 바꾼다
const FONTS = [['black-han-sans', '400'], ['ibm-plex-sans-kr', '400'], ['ibm-plex-sans-kr', '600'], ['nanum-pen-script', '400']];
let fontCss = '/* 글꼴: @fontsource (SIL Open Font License 1.1). 라이선스는 fonts/LICENSE-*.txt */\n';
for (const [pkg, w] of FONTS) {
  const dir = path.join(ROOT, 'node_modules', '@fontsource', pkg);
  let css = fs.readFileSync(path.join(dir, w + '.css'), 'utf8');
  // woff 대체 경로는 빼고 woff2만 남긴다(안드로이드 웹뷰는 woff2를 읽는다)
  css = css.replace(/, url\(\.\/files\/[^)]+\.woff\) format\('woff'\)/g, '');
  for (const m of css.matchAll(/url\(\.\/files\/([^)]+\.woff2)\)/g)) fs.copyFileSync(path.join(dir, 'files', m[1]), path.join(OUT, 'fonts', m[1]));
  fontCss += css.replace(/url\(\.\/files\//g, 'url(./') + '\n';
  const lic = path.join(dir, 'LICENSE');
  if (fs.existsSync(lic)) fs.copyFileSync(lic, path.join(OUT, 'fonts', 'LICENSE-' + pkg + '.txt'));
}
fs.writeFileSync(path.join(OUT, 'fonts', 'fonts.css'), fontCss);

// 2. 게임 화면: 프로토타입 조각에서 외부 글꼴 링크와 claude.ai 전용 메타를 빼고 문서로 감싼다
let body = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const title = (body.match(/<title>([^<]*)<\/title>/) || [, APP.name])[1];
body = body
  .replace(/<title>[^<]*<\/title>\n?/, '')
  .replace(/<meta name="claude:[^>]*>\n?/g, '')
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '');
if (/https?:\/\/(?!localhost)/.test(body.replace(/https:\/\/claude\.ai[^'"]*/g, ''))) {
  const hits = body.match(/https?:\/\/[^'"\s)]+/g).filter((u) => !u.startsWith('https://claude.ai'));
  if (hits.length) console.warn('주의: 외부 주소가 남아 있다 →', [...new Set(hits)].join(', '));
}
const head = [
  '<!doctype html>',
  '<html lang="ko">',
  '<head>',
  '<meta charset="utf-8">',
  // contain: 안드로이드 상태 표시줄·내비게이션 바 밑으로 화면이 들어가지 않게 한다
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=contain">',
  '<meta name="theme-color" content="' + APP.themeColor + '">',
  "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'\">",
  '<title>' + title + '</title>',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" href="icons/icon-192.png">',
  '<link rel="stylesheet" href="fonts/fonts.css">',
  '<script>window.__GRAD_RELEASE__ = true; window.__GRAD_VERSION__ = ' + JSON.stringify(APP.versionName) + ';</script>',
  '</head>',
  '<body>',
].join('\n');
const tail = [
  // 웹(PWA)으로 열 때만 오프라인 캐시를 켠다. 앱(Capacitor)은 파일이 이미 기기에 있다
  "<script>if ('serviceWorker' in navigator && !window.Capacitor && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});</script>",
  '</body>',
  '</html>',
].join('\n');
fs.writeFileSync(path.join(OUT, 'index.html'), head + '\n' + body + '\n' + tail + '\n');
fs.copyFileSync(path.join(SRC, 'engine.js'), path.join(OUT, 'engine.js'));

// 3. 아이콘(make-icons.js가 만든 것)
fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(OUT, 'icons', f));

// 4. 웹 앱 매니페스트와 서비스 워커(웹·TWA로 낼 때 쓴다)
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: APP.name, short_name: APP.shortName, description: APP.description, lang: 'ko', start_url: './', scope: './',
  display: 'standalone', orientation: 'portrait', background_color: APP.backgroundColor, theme_color: APP.themeColor,
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
const files = [];
(function walk(d, rel) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f), r = rel ? rel + '/' + f : f; if (fs.statSync(p).isDirectory()) walk(p, r); else if (!r.endsWith('.txt')) files.push('./' + r); } })(OUT, '');
fs.writeFileSync(path.join(OUT, 'sw.js'), [
  '// 오프라인 캐시: 처음 열 때 게임 파일을 모두 저장하고, 이후에는 저장본을 먼저 쓴다',
  "const CACHE = 'grad-clicker-" + APP.versionName + "';",
  'const FILES = ' + JSON.stringify(['./'].concat(files)) + ';',
  "self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));",
  "self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));",
  "self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET') return; e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });",
].join('\n') + '\n');

const size = files.reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
console.log('www/ 생성: 파일 ' + files.length + '개, ' + (size / 1048576).toFixed(1) + 'MB · 버전 ' + APP.versionName + ' (' + APP.versionCode + ')');
