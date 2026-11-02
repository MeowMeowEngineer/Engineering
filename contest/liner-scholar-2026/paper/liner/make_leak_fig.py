"""그림 2(라이너판): 단순 문과 실제 문의 측면 단면 전계 지도(../ieee/fig_leakage_v2.png 위 줄)에 문 이름을 붙인다."""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
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
ax.text(880, 30, "단순 문 모델", ha="right", va="top", fontsize=8, bbox=BOX)
ax.text(1915, 30, "상세 문 모델", ha="right", va="top", fontsize=8, bbox=BOX)
# 컬러바 제목의 옛 용어(시나리오 B)를 라이너판 용어로 바꾼다(원본 픽셀 좌표)
ax.add_patch(Rectangle((2058, 70), 40, 343, fc="white", ec="none"))
ax.text(2078, 241, "전계 (V/m, 고누설 조건)", rotation=90, ha="center", va="center", fontsize=8.6)
fig.savefig(os.path.join(HERE, "fig_leak_liner.png"), dpi=300)
print("saved")
