"""오븐 v2 (삼성 MS23K3513AW 계열 치수) 단면 개략도."""
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle

STEEL, GLASS, PP, AIR, WATER, TT = "#8a8f96", "#9fd3e6", "#f1e3a0", "white", "#5b8def", "#cfe9f2"
fig, axs = plt.subplots(1, 3, figsize=(17, 6.4), gridspec_kw={"width_ratios": [1.3, 1.1, 1.0]})

# --- (a) 옆 단면 (y-z), 오븐 전체 ---
ax = axs[0]
ext_D, ext_H, cav_D, cav_H, T = 374, 275, 324, 211, 32
z0 = 0
ax.add_patch(Rectangle((-ext_D, z0), ext_D - T, ext_H, fc=STEEL, ec="k"))           # 본체
zc0 = z0 + (ext_H - cav_H) / 2
ax.add_patch(Rectangle((-T - 0.8 - cav_D, zc0), cav_D, cav_H, fc=AIR, ec="k"))     # 캐비티
ax.add_patch(Rectangle((-T, z0 + 5), T, ext_H - 10, fc=STEEL, ec="k"))              # 문 프레임
win_h = 150
zw0 = zc0 + (cav_H - win_h) / 2
ax.add_patch(Rectangle((-T, zw0), T, win_h, fc=AIR, ec="none"))                     # 창 개구
ax.add_patch(Rectangle((-T, zw0), 1.0, win_h, fc=PP, ec="k", lw=0.5))               # 안쪽 PP 커버
ax.add_patch(Rectangle((-T + 2, zw0), 0.3 * 4, win_h, fc="#555", ec="none"))        # 타공판(두께 과장)
ax.add_patch(Rectangle((-4, zw0 - 10), 4, win_h + 20, fc=GLASS, ec="k", lw=0.5))    # 바깥 유리
yc = -T - 0.8 - cav_D / 2
ax.add_patch(Rectangle((yc - 144, zc0 + 12), 288, 5, fc=TT, ec="k", lw=0.5))        # 회전접시
ax.add_patch(Rectangle((yc - 45, zc0 + 17), 90, 43, fc=WATER, ec="k", lw=0.5))      # 물 275 g
ax.set_xlim(-400, 40); ax.set_ylim(-15, 290); ax.set_aspect("equal")
ax.set_title("(a) Side section (y-z)  ext 489x275x374, cavity 330x211x324 mm")
ax.set_xlabel("y (mm, door outer face = 0)"); ax.set_ylabel("z (mm, oven bottom = 0)")

# --- (b) 문 실링 부분 확대 (초크) ---
ax = axs[1]
g, ov, cw, cd, so = 0.8, 25, 8, 28, 3
ax.add_patch(Rectangle((-60, -T - g - 40), 120, 40, fc=AIR, ec="none"))
ax.add_patch(Rectangle((0, -T - g - 40), 60, 40, fc=STEEL, ec="k"))                # 본체 플랜지(캐비티 바깥)
ax.text(-55, -T - g - 25, "cavity", fontsize=9)
ax.add_patch(Rectangle((-60, -T), 120, T, fc=STEEL, ec="k"))                      # 문 금속
ax.add_patch(Rectangle((-60, -T), 50, T, fc=AIR, ec="none"))                       # 창 쪽 개구
ax.add_patch(Rectangle((-60, -T + 2), 50, 0.3 * 4, fc="#555"))                      # 타공판
ax.add_patch(Rectangle((-60, -T), 50, 1, fc=PP, ec="k", lw=0.5))                   # PP 커버
ax.add_patch(Rectangle((-60, -4), 120, 4, fc=GLASS, ec="k", lw=0.5))               # 유리
ax.add_patch(Rectangle((8, -T), so, cd - cw, fc=AIR, ec="k", lw=0.5))              # 초크 입구 슬롯
ax.add_patch(Rectangle((8, -T + cd - cw), cw + 4, cw, fc=AIR, ec="k", lw=0.5))     # 초크 홈(접힘)
ax.add_patch(Rectangle((-60, -T - g), 120, g, fc="#ffb3b3", ec="none"))            # 문 틈
ax.annotate("door gap g=0.8 mm", (30, -T - g / 2), (25, -T - 20), fontsize=8, arrowprops=dict(arrowstyle="->"))
ax.annotate("lambda/4 choke\n(depth ~28 mm)", (14, -T + 12), (22, -T + 14), fontsize=8, arrowprops=dict(arrowstyle="->"))
ax.annotate("perforated steel\n0.3 mm, holes 1.5 mm", (-40, -T + 2.6), (-58, -T + 12), fontsize=8, arrowprops=dict(arrowstyle="->"))
ax.annotate("outer glass 4 mm", (-30, -2), (-58, 6), fontsize=8, arrowprops=dict(arrowstyle="->"))
ax.annotate("inner PP cover", (-50, -T + 0.5), (-58, -T - 12), fontsize=8, arrowprops=dict(arrowstyle="->"))
ax.axvline(0, color="r", ls=":", lw=0.8); ax.text(1, 12, "cavity opening edge", color="r", fontsize=7)
ax.set_xlim(-62, 62); ax.set_ylim(-T - 42, 18); ax.set_aspect("equal")
ax.set_title("(b) Door seal detail (radial r vs y), not to exact scale")
ax.set_xlabel("r (mm, outward from cavity edge)"); ax.set_ylabel("y (mm)")

# --- (c) 정면 ---
ax = axs[2]
W, H = 489, 275
ax.add_patch(Rectangle((0, 0), W, H, fc="#333", ec="k"))
ax.add_patch(Rectangle((W - 100, 0), 100, H, fc="#666", ec="k"))                  # 조작부
ax.add_patch(Rectangle((60, (H - 150) / 2), 250, 150, fc=GLASS, ec="k", alpha=0.6))  # 보이는 창
ax.add_patch(Rectangle((25, (H - 211) / 2), 330, 211, fc="none", ec="w", ls="--"))   # 캐비티 개구
ax.text(30, H - 22, "cavity opening 330x211 (dashed)", color="w", fontsize=8)
ax.text(W - 95, H / 2, "control\npanel", color="w", fontsize=8)
ax.set_xlim(-10, W + 10); ax.set_ylim(-10, H + 10); ax.set_aspect("equal")
ax.set_title("(c) Front view"); ax.set_xlabel("x (mm)")
fig.tight_layout(); fig.savefig("oven_v2_sections.png", dpi=110)
