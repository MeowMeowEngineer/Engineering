"""paper_liner.md의 표 1–3을 PNG로 만든다(라이너 스콜라에 이미지로 넣기 위함).

캡션은 이미지에 넣지 않는다. 라이너 스콜라에서 표 위에 텍스트로 붙인다.
"""
import os
import re
import subprocess
import sys

from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "tables")
CHROME = sorted(p for p in (os.path.join("/opt/pw-browsers", d, "chrome-linux", "chrome")
                            for d in os.listdir("/opt/pw-browsers") if d.startswith("chromium-")) if os.path.exists(p))[0]
CSS = """
body { margin: 0; padding: 12px; background: #fff; font-family: "Noto Serif CJK KR", serif; color: #111; }
table { border-collapse: collapse; font-size: 15px; line-height: 1.45; width: WIDTHpx; }
th, td { padding: 6px 9px; vertical-align: top; text-align: left; border-bottom: 0.8px solid #999; }
thead th { border-top: 1.6px solid #000; border-bottom: 1.2px solid #000; background: #f2f2f2; font-weight: 700; }
tbody tr:last-child td { border-bottom: 1.6px solid #000; }
td.num, th.num { text-align: right; white-space: nowrap; }
"""


def md_tables(md):
    """(캡션, 표 마크다운) 목록."""
    out = []
    for m in re.finditer(r'<p class="tcap">(.*?)</p>\s*\n\s*\n((?:\|.*\n)+)', md):
        out.append((m.group(1), m.group(2)))
    return out


def to_html(tbl, width):
    rows = [r.strip().strip("|").split("|") for r in tbl.strip().splitlines()]
    head, body = rows[0], rows[2:]
    numeric = re.compile(r"^[\d.,–\-%≥≤ ]+$")
    # 본문 칸이 모두 숫자인 열만 오른쪽 정렬(머리글 포함)
    num_col = [all(numeric.match(r[j].strip()) for r in body) for j in range(len(head))]
    cls = lambda j: ' class="num"' if num_col[j] else ""
    h = "<tr>" + "".join(f"<th{cls(j)}>{c.strip()}</th>" for j, c in enumerate(head)) + "</tr>"
    b = "".join("<tr>" + "".join(f"<td{cls(j)}>{c.strip()}</td>" for j, c in enumerate(r)) + "</tr>"
                for r in body)
    return (f"<!doctype html><meta charset='utf-8'><style>{CSS.replace('WIDTH', str(width))}</style>"
            f"<table><thead>{h}</thead><tbody>{b}</tbody></table>")


def shoot(html, png, width):
    path = png.replace(".png", ".html")
    open(path, "w", encoding="utf-8").write(html)
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=3", f"--window-size={width + 24},1400",
                    f"--screenshot={png}", f"file://{path}"], check=True, capture_output=True)
    os.remove(path)
    im = Image.open(png).convert("RGB")
    bbox = ImageChops.difference(im, Image.new("RGB", im.size, "white")).getbbox()
    pad = 24
    im.crop((max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, im.width),
             min(bbox[3] + pad, im.height))).save(png, dpi=(300, 300))


if __name__ == "__main__":
    md = open(os.path.join(HERE, "paper_liner.md"), encoding="utf-8").read()
    os.makedirs(OUT, exist_ok=True)
    for i, (cap, tbl) in enumerate(md_tables(md), 1):
        png = os.path.join(OUT, f"table{i}.png")
        shoot(to_html(tbl, 900), png, 900)
        print(png, Image.open(png).size, "|", cap)
    sys.exit(0)
