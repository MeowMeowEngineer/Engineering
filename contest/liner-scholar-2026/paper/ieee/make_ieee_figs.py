"""IEEE 양식 그림 (그림 안 제목 없음, 세리프 8 pt, 두 단 폭 7.16 in, 패널 (a)(b)).

fig_sar_margin.pdf/png : (a) 거리별 전신 평균 SAR과 생리 기준선, (b) 기준 도달 배수
fig_temperature.pdf/png: (a) 심부 체온 상승, (b) 국부(피부) 최대 온도 상승

숫자 출처는 paper_ieee.md의 표 V, VI과 같다(paper_draft.md 4.3절·3.7절의 배수, 부록 B.8의 생체 열전달 결과).
범위의 한쪽 끝은 실제 문 구조(v2)·몸 앞 평균 조사, 다른 끝은 단순 문(v1)·몸 앞 최댓값 조사(불리한 편파)다.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.ticker import LogLocator, NullFormatter

plt.rcParams.update({
    "font.family": "Noto Serif CJK KR", "font.size": 8, "axes.unicode_minus": False,
    "axes.linewidth": 0.6, "xtick.major.width": 0.6, "ytick.major.width": 0.6,
    "xtick.minor.width": 0.4, "ytick.minor.width": 0.4, "xtick.direction": "in", "ytick.direction": "in",
    "xtick.top": True, "ytick.right": True, "legend.frameon": False, "legend.fontsize": 7.5,
    "mathtext.fontset": "stix",
})
OUT = os.path.dirname(os.path.abspath(__file__))
A_COL, B_COL, REF = "#1f5fbf", "#d1495b", "#333333"
W2 = 7.16  # IEEE 두 단 폭 (in)

LIMIT, THRESH, MASS, BMR_W = 0.08, 4.0, 73.97, 80.0
C_TISSUE, T_EXP = 3500.0, 1800.0
DIST = [30, 50, 100]
# 전신 평균 SAR 기준 도달 배수: (v2 몸앞평균, v1 몸앞최대)
MULT_WB = {30: (1385, 112), 50: (2447, 235), 100: (6999, 793)}  # Gustav, voxbundle
# 해부학 모형(Gustav) 국부 1 g 기준 도달 배수: (v1 몸앞평균, v1 몸앞최대)
MULT_LOC = {30: (766, 62), 50: (1353, 130), 100: (3870, 438)}  # Gustav 머리·몸통 1 g, voxbundle
# 국부(피부) 최대 온도 상승, 시나리오 A (degC): 부록 B.8
DT_LOCAL_A = {30: (0.00019, 0.0024), 50: (0.00011, 0.0011), 100: (0.000038, 0.00034)}  # Gustav 코 피부


def sar_rng(d, f):
    hi_mult, lo_mult = MULT_WB[d]
    return LIMIT * f / hi_mult, LIMIT * f / lo_mult


def panel(ax, s):
    ax.text(0.5, -0.25, s, transform=ax.transAxes, ha="center", va="top", fontsize=8.5)


def range_bars(ax, xs, rngs, col, marker_lo, marker_hi, dx):
    for x, (lo, hi) in zip(xs, rngs):
        ax.plot([x + dx, x + dx], [lo, hi], color=col, lw=2.2, solid_capstyle="butt", zorder=3)
        ax.plot(x + dx, lo, marker=marker_lo, ms=4.5, mfc="white", mec=col, mew=1.0, zorder=4)
        ax.plot(x + dx, hi, marker=marker_hi, ms=4.0, mfc=col, mec=col, zorder=4)


def fig_sar_margin():
    fig, (a, b) = plt.subplots(1, 2, figsize=(W2, 2.95), gridspec_kw={"width_ratios": [1, 1.15]})
    # (a) 전신 평균 SAR
    xs = range(len(DIST))
    range_bars(a, xs, [sar_rng(d, 1) for d in DIST], A_COL, "o", "s", -0.12)
    range_bars(a, xs, [sar_rng(d, 100) for d in DIST], B_COL, "o", "s", 0.12)
    a.set_yscale("log")
    a.set_ylim(5e-6, 20)
    a.set_xlim(-0.6, 2.6)
    a.set_xticks(list(xs))
    a.set_xticklabels([f"{d}" for d in DIST])
    a.set_xlabel("문에서 몸통 앞면까지 거리 (cm)")
    a.set_ylabel("전신 평균 SAR (W/kg)")
    a.yaxis.set_major_locator(LogLocator(base=10, numticks=10))
    for y, lab, ls in ((THRESH, "열적 영향 문턱 (4 W/kg)", "--"), (BMR_W / MASS, "안정 시 대사열 (1.1 W/kg)", ":"),
                       (LIMIT, "일반인 기본 제한 (0.08 W/kg)", "-")):
        a.axhline(y, color=REF, lw=0.8, ls=ls, zorder=1)
        a.text(2.55, y * 1.25, lab, ha="right", va="bottom", fontsize=6.8, color=REF)
    handles = [Line2D([], [], color=A_COL, lw=2.2, label="시나리오 A (정상 제품)"),
               Line2D([], [], color=B_COL, lw=2.2, label="시나리오 B (방출 상한)"),
               Line2D([], [], ls="", marker="o", mfc="white", mec="k", ms=4.5, label="v2 문, 몸 앞 평균 조사"),
               Line2D([], [], ls="", marker="s", mfc="k", mec="k", ms=4.0, label="v1 문, 몸 앞 최댓값 조사")]
    fig.legend(handles=handles, loc="upper center", ncol=4, fontsize=7, handlelength=1.8, columnspacing=1.6,
               bbox_to_anchor=(0.5, 1.0))
    panel(a, "(a)")

    # (b) 기준 도달 배수
    rows = [(f"전신 평균, {d} cm", *MULT_WB[d][::-1]) for d in DIST] + \
           [(f"머리·몸통 1 g, {d} cm", *MULT_LOC[d][::-1]) for d in DIST]
    for i, (lab, lo, hi) in enumerate(rows):
        y = len(rows) - 1 - i
        b.plot([lo, hi], [y, y], color="#555555", lw=4.5, solid_capstyle="butt", zorder=3)
        b.text(hi * 1.15, y, f"{lo:,}–{hi:,}", va="center", fontsize=6.8)
    b.set_xscale("log")
    b.set_xlim(0.5, 3e4)
    b.set_yticks(range(len(rows)))
    b.set_yticklabels([r[0] for r in rows][::-1], fontsize=7)
    b.set_ylim(-0.7, len(rows) - 0.3)
    b.axvline(1, color=A_COL, lw=1.0)
    b.axvline(100, color=B_COL, lw=1.0)
    b.text(1.1, len(rows) - 0.55, "A", color=A_COL, fontsize=7.5)
    b.text(110, len(rows) - 0.55, "B", color=B_COL, fontsize=7.5)
    b.axhline(2.5, color="#999999", lw=0.5)
    b.set_xlabel("기준 도달 배수 (시나리오 A 누설 대비)")
    b.tick_params(axis="y", which="both", right=False)
    panel(b, "(b)")
    fig.tight_layout(w_pad=1.5)
    fig.subplots_adjust(bottom=0.25, top=0.88)
    for ext in ("pdf", "png"):
        fig.savefig(os.path.join(OUT, f"fig_sar_margin.{ext}"), dpi=300)
    plt.close(fig)


def fig_temperature():
    fig, (a, b) = plt.subplots(1, 2, figsize=(W2, 2.75))
    xs = range(len(DIST))
    for ax, kind in ((a, "core"), (b, "local")):
        for f, col, dx in ((1, A_COL, -0.12), (100, B_COL, 0.12)):
            rngs = []
            for d in DIST:
                if kind == "core":
                    lo_sar, hi_sar = sar_rng(d, f)
                    rngs.append((lo_sar / THRESH, hi_sar * T_EXP / C_TISSUE))
                else:
                    lo, hi = DT_LOCAL_A[d]
                    rngs.append((lo * f, hi * f))
            range_bars(ax, xs, rngs, col, "o", "s", dx)
        ax.set_yscale("log")
        ax.set_ylim(1e-6, 5)
        ax.set_xlim(-0.6, 2.6)
        ax.set_xticks(list(xs))
        ax.set_xticklabels([f"{d}" for d in DIST])
        ax.set_xlabel("문에서 몸통 앞면까지 거리 (cm)")
        for y, lab, ls in ((1.0, "1 °C", "--"), (0.1, "0.1 °C (체온계 분해능)", ":")):
            ax.axhline(y, color=REF, lw=0.8, ls=ls)
            ax.text(2.55, y * 1.25, lab, ha="right", va="bottom", fontsize=6.8, color=REF)
    a.set_ylabel("심부 체온 상승 (°C)")
    b.set_ylabel("국부 최대 온도 상승 (°C)")
    handles = [Line2D([], [], color=A_COL, lw=2.2, label="시나리오 A (정상 제품)"),
               Line2D([], [], color=B_COL, lw=2.2, label="시나리오 B (방출 상한)"),
               Line2D([], [], ls="", marker="o", mfc="white", mec="k", ms=4.5, label="하한 추정"),
               Line2D([], [], ls="", marker="s", mfc="k", mec="k", ms=4.0, label="상한 추정")]
    fig.legend(handles=handles, loc="upper center", ncol=4, fontsize=7, handlelength=1.8, columnspacing=1.6,
               bbox_to_anchor=(0.5, 1.0))
    panel(a, "(a)")
    panel(b, "(b)")
    fig.tight_layout(w_pad=2.0)
    fig.subplots_adjust(bottom=0.25, top=0.87)
    for ext in ("pdf", "png"):
        fig.savefig(os.path.join(OUT, f"fig_temperature.{ext}"), dpi=300)
    plt.close(fig)


if __name__ == "__main__":
    fig_sar_margin()
    fig_temperature()
