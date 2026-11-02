"""그림 3(라이너판): ../ieee/fig_nf_simple_3d.png의 컬러바 제목을 라이너판 용어(고누설 조건)로 바꾼다.

원본 그림은 연구실 PC 해석 결과로 만든 것이라, 컬러바 제목 자리만 흰 상자로 덮고 다시 쓴다.
좌표는 원본 픽셀 좌표다.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from PIL import Image

plt.rcParams.update({"font.family": "Noto Serif CJK KR"})
HERE = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(HERE, "..", "ieee", "fig_nf_simple_3d.png")).convert("RGB")
W, H = src.size
DPI = 300
fig = plt.figure(figsize=(W / DPI, H / DPI), dpi=DPI)
ax = fig.add_axes([0, 0, 1, 1])
ax.imshow(src)
ax.set_axis_off()
# (x0, x1, y0, y1, 새 제목): 원본 제목의 글자 범위
for x0, x1, y0, y1, text in ((729, 770, 80, 533, "점 SAR (W/kg, 고누설 조건)"),
                             (1580, 1620, 89, 526, "온도 상승 (°C, 고누설 조건)")):
    ax.add_patch(Rectangle((x0, y0), x1 - x0, y1 - y0, fc="white", ec="none"))
    ax.text((x0 + x1) / 2, (y0 + y1) / 2, text, rotation=90, ha="center", va="center", fontsize=8.6)
fig.savefig(os.path.join(HERE, "fig_nf_liner.png"), dpi=DPI)
print("saved")
