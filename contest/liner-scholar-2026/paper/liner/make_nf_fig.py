"""그림 3(라이너판): 문 앞 5 cm 아동의 점 SAR·온도 상승을 저누설(위)·고누설(아래) 두 줄로 보인다.

원본 ../ieee/fig_nf_simple_3d.png는 연구실 PC 해석 결과로 만든 고누설 조건 그림이다.
모델이 선형이라 저누설 조건은 분포가 같고 값만 1/100이므로, 같은 그림의 색 눈금 숫자와
컬러바 제목만 바꿔 위 줄을 만든다. 좌표는 원본 픽셀 좌표다.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from PIL import Image

plt.rcParams.update({"font.family": "Noto Serif CJK KR", "mathtext.fontset": "stix"})
HERE = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(HERE, "..", "ieee", "fig_nf_simple_3d.png")).convert("RGB")
W0, H0 = src.size
PAD = 50                      # 저누설 온도 눈금(0.0014 등)이 길어 오른쪽을 넓힌다
W, H = W0 + PAD, 2 * H0
canvas = Image.new("RGB", (W, H), "white")
canvas.paste(src, (0, 0))
canvas.paste(src, (0, H0))

DPI = 300
FS = 8.6
fig = plt.figure(figsize=(W / DPI, H / DPI), dpi=DPI)
ax = fig.add_axes([0, 0, 1, 1])
ax.imshow(canvas)
ax.set_xlim(0, W)
ax.set_ylim(H, 0)
ax.set_axis_off()


def white(x0, y0, x1, y1):
    ax.add_patch(Rectangle((x0, y0), x1 - x0, y1 - y0, fc="white", ec="none"))


def title(x0, x1, y0, y1, dy, text, xc=None):
    white(x0, y0 + dy, x1, y1 + dy)
    xc = (x0 + x1) / 2 if xc is None else xc
    ax.text(xc, (y0 + y1) / 2 + dy, text, rotation=90, ha="center", va="center", fontsize=FS)


SAR_TICKS = [(73, 103), (246, 277), (419, 450), (593, 623)]           # 10^0 … 10^-3
T_TICKS = [(36, 60), (116, 140), (197, 221), (277, 301), (357, 382), (438, 462), (518, 542), (599, 623)]

# 위 줄: 저누설 조건(값 × 1/100). 제목 상자를 먼저 그려 긴 눈금 숫자를 가리지 않게 한다
title(729, 770, 80, 533, 0, "점 SAR (W/kg, 저누설 조건)")
title(1578, 1622, 89, 526, 0, "온도 상승 (°C, 저누설 조건)", xc=1622 + PAD / 2 - 6)
for (y0, y1), e in zip(SAR_TICKS, (-2, -3, -4, -5)):
    white(650, y0 - 4, 722, y1 + 4)
    ax.text(653, (y0 + y1) / 2, rf"$10^{{{e}}}$", ha="left", va="center", fontsize=FS)
for (y0, y1), v in zip(T_TICKS, (0.0014, 0.0012, 0.0010, 0.0008, 0.0006, 0.0004, 0.0002, 0.0)):
    white(1496, y0 - 4, 1570, y1 + 4)
    ax.text(1500, (y0 + y1) / 2, f"{v:.4f}", ha="left", va="center", fontsize=FS)

# 아래 줄: 고누설 조건(원본 값), 패널 기호 (c), (d)
title(729, 770, 80, 533, H0, "점 SAR (W/kg, 고누설 조건)")
title(1578, 1622, 89, 526, H0, "온도 상승 (°C, 고누설 조건)", xc=1622 + PAD / 2 - 6)
for x0, x1, lab in ((340, 390, "(c)"), (1188, 1238, "(d)")):
    white(x0, 694 + H0, x1, 735 + H0)
    ax.text((x0 + x1) / 2, 714 + H0, lab, ha="center", va="center", fontsize=FS + 0.4)

fig.savefig(os.path.join(HERE, "fig_nf_liner.png"), dpi=DPI)
print("saved", W, H)
