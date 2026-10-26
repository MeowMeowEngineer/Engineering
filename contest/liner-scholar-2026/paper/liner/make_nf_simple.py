"""그림 3(라이너판): 문에 얼굴을 댄 아동(5 cm)의 점 SAR과 온도 상승 측면 단면 두 장.

../ieee/fig_nf_sar_maps.png, fig_nf_bioheat.png (mw 생성)의 (a) 패널과 색 막대를 잘라 붙인다.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

plt.rcParams.update({"font.family": "Noto Serif CJK KR", "font.size": 8.5})
HERE = os.path.dirname(os.path.abspath(__file__))
IEEE = os.path.join(HERE, "..", "ieee")
sar = Image.open(os.path.join(IEEE, "fig_nf_sar_maps.png")).convert("RGB")
heat = Image.open(os.path.join(IEEE, "fig_nf_bioheat.png")).convert("RGB")
crops = [sar.crop((0, 0, 412, 555)), sar.crop((1552, 0, 1713, 601)),
         heat.crop((0, 0, 412, 565)), heat.crop((1552, 0, 1732, 615))]
fig = plt.figure(figsize=(6.0, 2.9))
axs = fig.subplots(1, 4, gridspec_kw={"width_ratios": [c.width / c.height for c in crops], "wspace": 0.02})
for ax, im in zip(axs, crops):
    ax.imshow(im)
    ax.set_axis_off()
axs[0].text(0.55, -0.04, "(a) 점 SAR", transform=axs[0].transAxes, ha="center", va="top", fontsize=9)
axs[2].text(0.55, -0.04, "(b) 온도 상승", transform=axs[2].transAxes, ha="center", va="top", fontsize=9)
fig.subplots_adjust(left=0.01, right=0.99, top=0.98, bottom=0.1)
fig.savefig(os.path.join(HERE, "fig_nf_simple.png"), dpi=300)
print("saved")
