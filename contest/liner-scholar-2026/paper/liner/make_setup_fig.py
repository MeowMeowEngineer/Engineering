"""그림 1(라이너판): 해석 환경.

위 줄: 오븐 3-D 그림 두 장(../ieee/fig_setup_3d_oven.png, 라벨 포함, 해석 모델 좌표로 그림).
아래 줄: 아동 근접 해석 배치(fig_setup_3d_nearfield.png), 성인 평면파 배치(fig_setup_3d_planewave.png).
아래 줄 라벨 좌표는 원본 픽셀 좌표다.
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
pw = Image.open(os.path.join(IEEE, "fig_setup_3d_planewave.png")).convert("RGB").crop((0, 0, 1342, 4000))

W = 7.16
top_h = W * oven.height / oven.width
bot_h = 2.5
fig = plt.figure(figsize=(W, top_h + bot_h + 0.35))
gs = fig.add_gridspec(2, 3, height_ratios=[top_h, bot_h],
                      width_ratios=[nf.width / nf.height, pw.width / pw.height, 0.9], hspace=0.12, wspace=0.05)
ax0 = fig.add_subplot(gs[0, :])
ax0.imshow(oven)
ax1 = fig.add_subplot(gs[1, 0])
ax1.imshow(nf)
ax2 = fig.add_subplot(gs[1, 1])
ax2.imshow(pw)
for ax in (ax0, ax1, ax2):
    ax.set_axis_off()

BOX = dict(boxstyle="round,pad=0.2", fc="white", ec="0.3", lw=0.5, alpha=0.95)
ARR = dict(arrowstyle="-", color="0.15", lw=0.6)


def lab(ax, text, xy, xytext):
    ax.annotate(text, xy=xy, xytext=xytext, ha="center", va="center", bbox=BOX, arrowprops=ARR)


# (c) 아동 근접 해석: 얼굴이 문 바깥면에서 약 5 cm
lab(ax1, "7세 아동\n(상반신 단면)", (300, 700), (330, 1080))
lab(ax1, "오븐 문", (720, 450), (600, 950))
lab(ax1, "급전부", (1200, 290), (1500, 330))
lab(ax1, "물 부하", (1200, 660), (1500, 950))
ax1.annotate("", xy=(548, 430), xytext=(692, 430), arrowprops=dict(arrowstyle="<->", color="#d1495b", lw=1.0))
ax1.text(620, 395, "5 cm", ha="center", va="bottom", color="#d1495b", fontsize=8)
# (d) 성인 평면파 해석: 오른쪽 빨간 선이 입사면, 보라 화살표가 진행 방향, 초록 화살표가 전계
for text, xy, xytext in (("평면파 입사면", (1270, 1800), (2300, 1800)),
                         ("전계 방향", (1272, 3200), (2300, 2900)),
                         ("진행 방향", (1050, 3372), (2300, 3700))):
    ax2.annotate(text, xy=xy, xytext=xytext, ha="left", va="center", bbox=BOX, arrowprops=ARR,
                 annotation_clip=False)

ax0.text(0.5, -0.02, "", transform=ax0.transAxes)
ax1.text(0.5, -0.04, "(c)", transform=ax1.transAxes, ha="center", va="top", fontsize=8.5)
ax2.text(0.5, -0.04, "(d)", transform=ax2.transAxes, ha="center", va="top", fontsize=8.5)
fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.06)
fig.savefig(os.path.join(HERE, "fig_setup_3d_labeled.png"), dpi=300)
print("saved")
