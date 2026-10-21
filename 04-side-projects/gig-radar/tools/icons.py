"""앱·사이트 아이콘(레이더 파면과 표적 점)을 만든다. 실행: python3 tools/icons.py (Pillow 필요)"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG, FG, BLIP = (15, 27, 42, 255), (111, 168, 240, 255), (242, 184, 102, 255)


def icon(n, rounded=True):
    s = 1024
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, s - 1, s - 1], fill=BG)
    cx, cy = s * 0.5, s * 0.80
    for r in (0.17, 0.32, 0.47):
        R = s * r
        d.arc([cx - R, cy - R, cx + R, cy + R], start=215, end=325, fill=FG, width=int(s * 0.045))
    w = s * 0.035
    d.rectangle([cx - w, cy - s * 0.05, cx + w, cy + s * 0.08], fill=FG)
    bx, by, br = s * 0.5, s * 0.19, s * 0.06
    d.ellipse([bx - br, by - br, bx + br, by + br], fill=BLIP)
    return im.resize((n, n), Image.LANCZOS)


out = ROOT / "assets" / "icons"
out.mkdir(parents=True, exist_ok=True)
for n in (180, 192, 512):
    icon(n).save(out / f"icon-{n}.png")
icon(512, rounded=False).save(out / "maskable-512.png")
for name, n in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
    p = ROOT / "android" / "res" / f"mipmap-{name}"
    p.mkdir(parents=True, exist_ok=True)
    icon(n).save(p / "ic_launcher.png")
print("icons ok")
