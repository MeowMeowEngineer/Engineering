"""앱 아이콘(SVG, PNG)을 만든다. python3 scripts/make-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BLUE = (47, 111, 222)
BARS = [(217, 58, 58), (43, 98, 201), (29, 138, 78), (210, 86, 28), (28, 143, 192)]

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#2f6fde"/>
  <path d="M146 96h160l80 80v240a20 20 0 0 1-20 20H146a20 20 0 0 1-20-20V116a20 20 0 0 1 20-20z" fill="#fff"/>
  <path d="M306 96v60a20 20 0 0 0 20 20h60z" fill="#c9d8f6"/>
{bars}
</svg>
"""


def bars_svg():
    out = []
    for i, c in enumerate(BARS):
        w = [180, 210, 150, 196, 120][i]
        out.append(f'  <rect x="166" y="{214 + i * 36}" width="{w}" height="18" rx="9" fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}"/>')
    return "\n".join(out)


def draw(size: int, maskable: bool) -> Image.Image:
    s = 4  # 슈퍼샘플링
    big = size * s
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = big / 512
    if maskable:
        d.rectangle([0, 0, big, big], fill=BLUE)
        k *= 0.8
        off = big * 0.1
    else:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=112 * k, fill=BLUE)
        off = 0
    P = lambda x, y: (off + x * k, off + y * k)
    d.rounded_rectangle([*P(126, 96), *P(386, 436)], radius=20 * k, fill="white")
    d.polygon([P(306, 96), P(386, 176), P(386, 96)], fill=BLUE)
    d.polygon([P(306, 96), P(386, 176), P(306, 176)], fill=(201, 216, 246))
    for i, c in enumerate(BARS):
        w = [180, 210, 150, 196, 120][i]
        y = 214 + i * 36
        d.rounded_rectangle([*P(166, y), *P(166 + w, y + 18)], radius=9 * k, fill=c)
    return img.resize((size, size), Image.LANCZOS)


def foreground(size: int) -> Image.Image:
    """적응형 아이콘 전경: 108dp 캔버스 중앙 66dp 안에 문서 모양만 그린다 (배경색은 XML)"""
    full = draw(size * 4, True).resize((size, size), Image.LANCZOS)
    # maskable 아이콘에서 파란 배경을 투명하게 바꾼다
    px = full.load()
    for y in range(size):
        for x in range(size):
            r, g, b, a = px[x, y]
            if abs(r - BLUE[0]) < 12 and abs(g - BLUE[1]) < 12 and abs(b - BLUE[2]) < 12:
                px[x, y] = (0, 0, 0, 0)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = full.resize((int(size * 0.85), int(size * 0.85)), Image.LANCZOS)
    off = (size - inner.width) // 2
    canvas.paste(inner, (off, off), inner)
    return canvas


def android():
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    if not res.exists():
        return
    for d, n in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
        icon = draw(n, False)
        icon.save(res / f"mipmap-{d}" / "ic_launcher.png")
        icon.save(res / f"mipmap-{d}" / "ic_launcher_round.png")
        foreground(n * 108 // 48).save(res / f"mipmap-{d}" / "ic_launcher_foreground.png")
    for f in res.glob("drawable*/splash.png"):
        w, h = Image.open(f).size
        splash = Image.new("RGB", (w, h), (243, 244, 247))
        s = int(min(w, h) * 0.32)
        icon = draw(s, False)
        splash.paste(icon, ((w - s) // 2, (h - s) // 2), icon)
        splash.save(f)


if __name__ == "__main__":
    pub = ROOT / "public"
    (pub / "icon.svg").write_text(SVG.format(bars=bars_svg()))
    draw(192, False).save(pub / "icon-192.png")
    draw(512, False).save(pub / "icon-512.png")
    draw(512, True).save(pub / "icon-maskable-512.png")
    android()
    print("icons written")
