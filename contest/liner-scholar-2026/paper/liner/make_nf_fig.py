"""그림 3(라이너판): 문 앞 5 cm 아동의 점 SAR과 온도 상승. 색 눈금에 두 누설 조건의 값을 함께 적는다.

원본 ../ieee/fig_nf_simple_3d.png는 연구실 PC 해석 결과로 만든 고누설 조건 그림이다.
모델이 선형이라 저누설 조건은 분포가 같고 값만 1/100이므로, 패널은 두 개만 두고
색 눈금을 "고누설 값 (저누설 값)"으로 다시 쓴다. 좌표는 원본 픽셀 좌표다.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

plt.rcParams.update({"font.family": "Noto Serif CJK KR", "mathtext.fontset": "stix"})
HERE = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(HERE, "..", "ieee", "fig_nf_simple_3d.png")).convert("RGB")
H = src.height

# 원본을 SAR 패널(색 막대까지)과 온도 패널(색 막대까지)로 잘라, 눈금 숫자와 제목 자리를 새로 낸다.
LEFT = src.crop((0, 0, 645, H))         # (a) 점 SAR, 색 막대 오른쪽 끝 637
RIGHT = src.crop((820, 0, 1492, H))     # (b) 온도 상승, 색 막대 오른쪽 끝 1485
LW, RW = 935, 1020                      # 각 구역 너비(눈금 숫자 + 제목 포함)
W = LW + RW
canvas = Image.new("RGB", (W, H), "white")
canvas.paste(LEFT, (0, 0))
canvas.paste(RIGHT, (LW, 0))

DPI = 300
FS = 8.6
fig = plt.figure(figsize=(W / DPI, H / DPI), dpi=DPI)
ax = fig.add_axes([0, 0, 1, 1])
ax.imshow(canvas)
ax.set_xlim(0, W)
ax.set_ylim(H, 0)
ax.set_axis_off()

SAR_Y = [88, 261, 434, 608]                                   # 10^0 … 10^-3 눈금 높이
T_Y = [48, 128, 209, 289, 370, 450, 530, 611]                 # 0.14 … 0.00 눈금 높이
for y, e in zip(SAR_Y, (0, -1, -2, -3)):
    ax.text(653, y, rf"$10^{{{e}}}$ ($10^{{{e - 2}}}$)", ha="left", va="center", fontsize=FS)
for y, v in zip(T_Y, (0.14, 0.12, 0.10, 0.08, 0.06, 0.04, 0.02, 0.0)):
    ax.text(LW + 680, y, f"{v:.2f} ({v / 100:.4f})", ha="left", va="center", fontsize=FS)
for x, text in ((LW - 30, "점 SAR (W/kg): 고누설 (저누설)"), (W - 30, "온도 상승 (°C): 고누설 (저누설)")):
    ax.text(x, 330, text, rotation=90, ha="center", va="center", fontsize=FS)

fig.savefig(os.path.join(HERE, "fig_nf_liner.png"), dpi=DPI)
print("saved", W, H)
