// 앱 아이콘·스플래시·스토어 그래픽을 SVG로 그려 PNG로 만든다: NODE_PATH=$(npm root -g) node make-icons.js
// 크로미움(Playwright)으로 그린다. 결과: assets/(웹 아이콘), store/(스토어 그래픽), android 리소스(있으면)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = __dirname;
const APP = require('./app.json');

// 학사모를 쓰고 다크서클이 내려온 대학원생. scale·dy로 적응형 아이콘 안전 영역(가운데 66%)에 맞춘다
function character(scale, dy) {
  return '<g transform="translate(256 ' + (256 + (dy || 0)) + ') scale(' + scale + ') translate(-256 -256)">' +
    // 어깨와 체크셔츠
    '<path d="M96 512 Q100 392 256 384 Q412 392 416 512 Z" fill="#b5574f"/>' +
    '<path d="M150 512 V410 M210 512 V392 M302 512 V392 M362 512 V410 M110 450 H402 M100 490 H412" stroke="#ffffff55" stroke-width="10"/>' +
    // 얼굴
    '<rect x="226" y="330" width="60" height="64" fill="#e8b994"/>' +
    '<circle cx="256" cy="268" r="112" fill="#f3cba8"/>' +
    // 머리카락
    '<path d="M146 250 Q150 160 256 156 Q362 160 366 250 Q330 205 256 208 Q182 205 146 250 Z" fill="#2a2a33"/>' +
    // 학사모
    '<polygon points="256,70 432,140 256,210 80,140" fill="#1b2838"/>' +
    '<path d="M150 168 V214 Q256 250 362 214 V168 L256 210 Z" fill="#26344a"/>' +
    '<path d="M256 140 L400 150 V232" stroke="#e0b030" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    '<circle cx="400" cy="240" r="14" fill="#e0b030"/>' +
    // 뿔테 안경과 다크서클
    '<circle cx="212" cy="276" r="34" fill="#ffffff66" stroke="#1b2838" stroke-width="10"/>' +
    '<circle cx="300" cy="276" r="34" fill="#ffffff66" stroke="#1b2838" stroke-width="10"/>' +
    '<path d="M246 276 H266" stroke="#1b2838" stroke-width="10"/>' +
    '<circle cx="212" cy="278" r="8" fill="#1b2838"/><circle cx="300" cy="278" r="8" fill="#1b2838"/>' +
    '<path d="M190 318 Q212 328 234 318 M278 318 Q300 328 322 318" stroke="#9a6c8f" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    // 지친 입
    '<path d="M236 348 Q256 340 276 348" stroke="#a0574a" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    // 커피 잔과 김
    '<rect x="352" y="378" width="70" height="80" rx="10" fill="#ffffff" stroke="#1b2838" stroke-width="7"/>' +
    '<path d="M422 396 Q452 400 448 424 Q446 444 422 442" stroke="#1b2838" stroke-width="7" fill="none"/>' +
    '<rect x="360" y="392" width="54" height="16" fill="#7a4a2a"/>' +
    '<path d="M372 366 Q362 350 374 336 M394 366 Q384 350 396 336" stroke="#ffffffcc" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    '</g>';
}
const BG = '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f58c4"/><stop offset="1" stop-color="#1a347d"/></linearGradient></defs>';
const icon = (round) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' + BG + (round ? '<circle cx="256" cy="256" r="256" fill="url(#bg)"/>' : '<rect width="512" height="512" rx="96" fill="url(#bg)"/>') + '<clipPath id="c">' + (round ? '<circle cx="256" cy="256" r="256"/>' : '<rect width="512" height="512" rx="96"/>') + '</clipPath><g clip-path="url(#c)">' + character(0.92, 22) + '</g></svg>';
const full = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' + BG + '<rect width="512" height="512" fill="url(#bg)"/>' + character(0.92, 22) + '</svg>';
// 적응형 아이콘 전경: 투명 배경, 안전 영역(가운데 66%) 안에 들어가게 줄인다
const fg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(256 256) scale(0.62) translate(-256 -256)">' + character(1, 0) + '</g></svg>';
const maskable = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' + BG + '<rect width="512" height="512" fill="url(#bg)"/><g transform="translate(256 256) scale(0.78) translate(-256 -256)">' + character(1, 0) + '</g></svg>';
const feature = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500">' + BG.replace('id="bg"', 'id="bg"') + '<rect width="1024" height="500" fill="url(#bg)"/>' +
  '<g transform="translate(640 40) scale(0.86)">' + character(1, 0) + '</g>' +
  '<text x="70" y="210" font-family="Black Han Sans" font-size="92" fill="#ffffff">대학원생 키우기</text>' +
  '<text x="74" y="290" font-family="Nanum Pen Script" font-size="54" fill="#ffd98a">석사 막내에서 살아있는 교과서까지</text>' +
  '<text x="74" y="360" font-family="IBM Plex Sans KR" font-weight="600" font-size="30" fill="#d9e4ff">탭하고 · 논문 쓰고 · 심사를 통과하는 방치형 게임</text></svg>';
const splash = (w, h) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"><rect width="' + w + '" height="' + h + '" fill="' + APP.backgroundColor + '"/><g transform="translate(' + (w / 2 - 128) + ' ' + (h / 2 - 160) + ') scale(0.5)">' + icon(false).replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g></svg>';

const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

(async () => {
  // 글꼴을 읽으려면 www/fonts와 같은 출처(file://)에서 열어야 한다
  const fontCss = fs.existsSync(path.join(ROOT, 'www', 'fonts', 'fonts.css')) ? 'fonts/fonts.css' : null;
  const tmp = path.join(ROOT, 'www', '_icon.html');
  fs.mkdirSync(path.join(ROOT, 'www'), { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  async function png(svg, w, h, out) {
    await p.setViewportSize({ width: w, height: h });
    fs.writeFileSync(tmp, '<!doctype html><html><head><meta charset="utf-8">' + (fontCss ? '<link rel="stylesheet" href="' + fontCss + '">' : '') + '<style>html,body{margin:0;background:transparent}svg{display:block;width:' + w + 'px;height:' + h + 'px}</style></head><body>' + svg + '</body></html>');
    await p.goto('file://' + tmp);
    await p.evaluate(async () => { await Promise.all(['400 20px "Black Han Sans"', '400 20px "Nanum Pen Script"', '600 20px "IBM Plex Sans KR"'].map((f) => document.fonts.load(f, '대학원생 키우기 석사 막내에서 살아있는 교과서까지 탭하고 논문 쓰고 심사를 통과하는 방치형 게임'))); await document.fonts.ready; });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  }
  await png(icon(false), 192, 192, path.join(ROOT, 'assets', 'icon-192.png'));
  await png(icon(false), 512, 512, path.join(ROOT, 'assets', 'icon-512.png'));
  await png(maskable, 512, 512, path.join(ROOT, 'assets', 'icon-maskable-512.png'));
  // 스토어 아이콘은 32비트 PNG 512×512(모서리는 Play가 둥글게 깎는다)
  await png(full, 512, 512, path.join(ROOT, 'store', 'icon-512.png'));
  await png(feature, 1024, 500, path.join(ROOT, 'store', 'feature-graphic-1024x500.png'));
  if (fs.existsSync(ANDROID_RES)) {
    for (const [d, k] of Object.entries(DENS)) {
      await png(icon(false), 48 * k, 48 * k, path.join(ANDROID_RES, 'mipmap-' + d, 'ic_launcher.png'));
      await png(icon(true), 48 * k, 48 * k, path.join(ANDROID_RES, 'mipmap-' + d, 'ic_launcher_round.png'));
      await png(fg, 108 * k, 108 * k, path.join(ANDROID_RES, 'mipmap-' + d, 'ic_launcher_foreground.png'));
    }
    // 적응형 아이콘 배경색
    const bgXml = path.join(ANDROID_RES, 'values', 'ic_launcher_background.xml');
    fs.writeFileSync(bgXml, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#2346A3</color>\n</resources>\n');
    // 스플래시(세로·가로, 밀도별). Capacitor 템플릿의 drawable*/splash.png를 덮어쓴다
    for (const dir of fs.readdirSync(ANDROID_RES).filter((x) => x.startsWith('drawable'))) {
      const f = path.join(ANDROID_RES, dir, 'splash.png');
      if (!fs.existsSync(f)) continue;
      const m = dir.match(/(land|port)?-?(mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi)?$/);
      const k = DENS[m && m[2]] || 1, land = dir.includes('land');
      const w = Math.round((land ? 480 : 320) * k), h = Math.round((land ? 320 : 480) * k);
      await png(splash(w, h), w, h, f);
    }
    console.log('안드로이드 아이콘·스플래시 갱신');
  }
  await b.close();
  fs.rmSync(tmp, { force: true });
  console.log('아이콘·스토어 그래픽 생성');
})();
