"""라이너판 결과 요약 그림: 상황별 SAR(기준 대비 %)과 국부 온도 상승(°C).

값은 모두 보수적 가정(단순 문, 몸 앞 최대 세기; 근접 해석은 결합 해석 값)의 최댓값이며
paper_ieee.md 표 VI·VII과 그림 4·5의 원자료와 같다. 허용 상한 제품 = 정상 제품 × 100.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter, LogLocator

plt.rcParams.update({
    "font.family": "Noto Serif CJK KR", "font.size": 8.5, "axes.linewidth": 0.6,
    "xtick.direction": "in", "ytick.direction": "in", "axes.unicode_minus": False,
})
HERE = os.path.dirname(os.path.abspath(__file__))
A_COL, B_COL, INK, MUTED = "#1f5fbf", "#d1495b", "#222222", "#666666"

# (상황, SAR 기준 대비 % (정상 제품), 국부 최대 온도 상승 °C (정상 제품))
# 검출기 면적(25 cm²) 평균으로 보정: 단순 문(v1) 결과 × 1/0.814 (mw detector_avg.json)
K_V1 = 1 / 0.814
ROWS = [(name, sar * K_V1, dt * K_V1) for name, sar, dt in [
    ("아동, 얼굴–문 5 cm", 0.54, 0.0014),
    ("아동, 얼굴–문 10 cm", 0.84, 0.0020),
    ("아동, 몸–문 30 cm", 1.39, 0.0013),
    ("성인, 몸–문 30 cm", 1.62, 0.0024),
    ("성인, 몸–문 1 m", 0.23, 0.00034),
]]
FACTOR_B = 100.0


def fmt(v, unit):
    if unit == "%":
        return f"{v:#.2g}%" if v < 10 else f"{v:.0f}%"
    return f"{v:#.2g} °C"


def panel(ax, col, unit, xmin, xmax, lines, xlabel):
    n = len(ROWS)
    h = 0.36
    for i, row in enumerate(ROWS):
        y = n - 1 - i
        a = row[col]
        b = a * FACTOR_B
        for val, dy, c in ((a, h / 2 + 0.02, A_COL), (b, -h / 2 - 0.02, B_COL)):
            ax.barh(y + dy, val - xmin, left=xmin, height=h, color=c, edgecolor="none")
            ax.text(val * 1.15, y + dy, fmt(val, unit), va="center", ha="left", fontsize=7.5, color=INK,
                    bbox=dict(boxstyle="square,pad=0.1", fc="white", ec="none"), zorder=3)
    for k, (x, lab, ls) in enumerate(lines):
        ax.axvline(x, color=INK, lw=0.9, ls=ls, zorder=0)
        ax.text(x, n - 0.25 + 0.42 * k, lab, ha="center", va="bottom", fontsize=7.5, color=INK,
                bbox=dict(boxstyle="square,pad=0.15", fc="white", ec="none"))
    ax.set_xscale("log")
    ax.set_xlim(xmin, xmax)
    ax.xaxis.set_major_locator(LogLocator(base=10, numticks=12))
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:g}"))
    ax.set_ylim(-0.6, n + 0.5)
    ax.set_yticks(range(n))
    ax.set_yticklabels([r[0] for r in ROWS][::-1])
    ax.tick_params(axis="y", length=0)
    ax.set_xlabel(xlabel)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)


fig, (a, b) = plt.subplots(1, 2, figsize=(7.16, 3.4), sharey=True, gridspec_kw={"wspace": 0.08})
panel(a, 1, "%", 0.05, 2000, [(100, "기준 (100%)", "-")], "SAR (기준 대비 %)")
panel(b, 2, "°C", 1e-4, 8, [(1.0, "열적 영향 문턱 1 °C", "-"), (0.1, "체온계 눈금 0.1 °C", ":")], "국부 최대 온도 상승 (°C)")
b.tick_params(axis="y", labelleft=False)
handles = [plt.Rectangle((0, 0), 1, 1, color=A_COL), plt.Rectangle((0, 0), 1, 1, color=B_COL)]
fig.legend(handles, ["정상 제품 (누설 = 허용 상한의 1%)", "허용 상한 제품 (누설 = 허용 상한)"],
           loc="upper center", ncol=2, frameon=False, fontsize=8, bbox_to_anchor=(0.55, 1.0))
for ax, t in ((a, "(a)"), (b, "(b)")):
    ax.text(0.5, -0.2, t, transform=ax.transAxes, ha="center", va="top", fontsize=9)
fig.subplots_adjust(left=0.17, right=0.98, top=0.88, bottom=0.2)
fig.savefig(os.path.join(HERE, "fig_summary_liner.png"), dpi=300)
fig.savefig(os.path.join(HERE, "fig_summary_liner.pdf"))
print("saved")
