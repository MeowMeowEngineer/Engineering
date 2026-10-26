"""CST 3-D 화면(오븐, 근역장 배치, 평면파 배치)에 한글 라벨을 달아 그림 하나로 묶는다.

입력: ../ieee/fig_setup_3d_{oven,nearfield,planewave}.png (mw_shot2/3, CST 화면 저장)
출력: fig_setup_3d_labeled.png
라벨 좌표는 원본 픽셀 좌표다.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

plt.rcParams.update({"font.family": "Noto Serif CJK KR", "font.size": 7.5})
HERE = os.path.dirname(os.path.abspath(__file__))
IEEE = os.path.join(HERE, "..", "ieee")

oven = Image.open(os.path.join(IEEE, "fig_setup_3d_oven.png")).convert("RGB")
nf = Image.open(os.path.join(IEEE, "fig_setup_3d_nearfield.png")).convert("RGB")
pw = Image.open(os.path.join(IEEE, "fig_setup_3d_planewave.png")).convert("RGB").crop((0, 0, 1492, 4300))

ims = [oven, nf, pw]
ratios = [im.width / im.height for im in ims]
H = 2.55
fig = plt.figure(figsize=(7.16, H + 0.55))
axs = fig.subplots(1, 3, gridspec_kw={"width_ratios": ratios, "wspace": 0.12})
for ax, im in zip(axs, ims):
    ax.imshow(im)
    ax.set_axis_off()

BOX = dict(boxstyle="round,pad=0.2", fc="white", ec="0.3", lw=0.5, alpha=0.92)
ARR = dict(arrowstyle="-", color="0.15", lw=0.6)


def lab(ax, text, xy, xytext):
    ax.annotate(text, xy=xy, xytext=xytext, ha="center", va="center", bbox=BOX, arrowprops=ARR)


a, b, c = axs
# (a) v2 오븐: 수평으로 자른 사선 시점, 문이 아래쪽
lab(a, "급전부\n(도파관)", (505, 590), (300, 230))
lab(a, "조리실", (1150, 260), (1150, 120))
lab(a, "회전접시", (700, 900), (560, 830))
lab(a, "물 부하", (920, 670), (1180, 520))
lab(a, "문 타공판", (900, 1120), (870, 1330))
lab(a, "λ/4 초크 홈", (455, 1075), (310, 1300))
# (b) 근역장: 아동 상반신과 v1 오븐, 얼굴–문 5 cm
lab(b, "아동 복셀 모델\n(상반신 단면)", (300, 250), (250, 1080))
lab(b, "문", (820, 400), (880, 960))
lab(b, "급전부", (1300, 140), (1550, 330))
lab(b, "물 부하", (1300, 650), (1550, 950))
b.annotate("", xy=(612, 560), xytext=(790, 560), arrowprops=dict(arrowstyle="<->", color="#d1495b", lw=0.9))
b.text(700, 520, "5 cm", ha="center", va="bottom", color="#d1495b", fontsize=7.5)
# (c) 평면파: 성인 측면 단면, 오른쪽 빨간 선이 입사면
lab(c, "진행 방향", (1100, 3590), (900, 4050))

for ax, t in zip(axs, "abc"):
    ax.text(0.5, -0.06, f"({t})", transform=ax.transAxes, ha="center", va="top", fontsize=8.5)
fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.12)
fig.savefig(os.path.join(HERE, "fig_setup_3d_labeled.png"), dpi=300)
print("saved")
