"""그림 2(라이너판): 단순 문과 실제 문의 측면 단면 전계 지도(../ieee/fig_leakage_v2.png 위 줄)에 문 이름을 붙인다."""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

plt.rcParams.update({"font.family": "Noto Serif CJK KR", "font.size": 9})
HERE = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(HERE, "..", "ieee", "fig_leakage_v2.png")).convert("RGB")
top = src.crop((0, 0, src.width, 525))
fig = plt.figure(figsize=(7.16, 7.16 * top.height / top.width))
ax = fig.add_axes([0, 0, 1, 1])
ax.imshow(top)
ax.set_axis_off()
BOX = dict(boxstyle="round,pad=0.25", fc="white", ec="none", alpha=0.9)
ax.text(880, 30, "단순 문", ha="right", va="top", fontsize=8, bbox=BOX)
ax.text(1915, 30, "실제 문", ha="right", va="top", fontsize=8, bbox=BOX)
fig.savefig(os.path.join(HERE, "fig_leak_liner.png"), dpi=300)
print("saved")
