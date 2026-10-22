"""IEEE 양식 그림 (그림 안 제목 없음, 세리프 8 pt, 두 단 폭 7.16 in, 패널 (a)(b)).

fig_sar_margin.pdf/png : (a) 거리별 전신 평균 SAR과 생리 기준선, (b) 기준 도달 배수
fig_temperature.pdf/png: (a) 심부 체온 상승, (b) 국부 최대 온도 상승

성인(Gustav)과 아동(Child)을 함께 그린다.
- 30–100 cm(몸통–문): 평면파 등가. W/m²당 SAR(표 V) × 오븐 단독장의 몸 앞 전력밀도.
  범위의 한쪽 끝은 실제 문 구조(v2)·몸 앞 평균 조사, 다른 끝은 단순 문(v1)·몸 앞 최댓값 조사(불리한 편파)다.
- 5, 10 cm(안면–문): 오븐과 Child 상반신을 함께 푼 근역장 해석(표 VII). 단일 값.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.ticker import LogLocator

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

LIMIT, LIMIT_LOC, THRESH, BMR_W = 0.08, 1.6, 4.0, 80.0
MASS = {"adult": 73.97, "child": 23.85}
C_TISSUE, T_EXP = 3500.0, 1800.0
DIST = [30, 50, 100]
NEAR = [5, 10]

# 입사 1 W/m²당 값, 두 편파 중 큰 값 (표 V, 그림 6)
PER_WB = {"adult": 0.0055, "child": 0.0087}      # 전신 평균 SAR (W/kg)
PER_LOC = {"adult": 0.197, "child": 0.128}       # 머리·몸통 1 g (W/kg)
PER_DT = {"adult": 0.0183, "child": 0.0104}      # 국부 최대 온도 상승 (K), 2-D Pennes
# 시나리오 A 몸 앞 전력밀도 (W/m²): (v2 몸 앞 평균, v1 몸 앞 최댓값). 시나리오 B는 ×100.
# 성인: 몸통 앞 |x| ≤ 170 mm, z 850–1450 mm (표 VI의 배수와 같은 값)
PD_A = {
    "adult": {30: (0.010502, 0.129870), 50: (0.0059442, 0.061896), 100: (0.0020782, 0.018342)},
    # 아동: 몸통 앞 |x| ≤ 105 mm, z 590–940 mm (몸통 470–940 중 오븐 단독 평면이 덮는 74 %), mw child_front.json
    "child": {30: (0.00602, 0.128), 50: (0.00339, 0.0625), 100: (0.00129, 0.0183)},
}
# 성인 기준 도달 배수 (v2 몸앞평균, v1 몸앞최대): 표 VI·본문과 같은 원자료 값 (voxbundle)
MULT_WB_ADULT = {30: (1385, 112), 50: (2447, 235), 100: (6999, 793)}
MULT_LOC_ADULT = {30: (766, 62), 50: (1353, 130), 100: (3870, 438)}
# 성인 국부 최대 온도 상승, 시나리오 A (°C): 원자료 값
DT_LOCAL_A_ADULT = {30: (0.00019, 0.0024), 50: (0.00011, 0.0011), 100: (0.000038, 0.00034)}
# 근역장(오븐 + Child 상반신), 시나리오 B. 시나리오 A는 1/100. 전신은 절단 모델 기준 하한.
NF_WB_B = {5: 0.0179, 10: 0.0169}
NF_LOC_B = {5: 0.861, 10: 1.35}
NF_DT_B = {5: 0.14, 10: 0.20}

SUBJ = ("adult", "child")
SUBJ_KO = {"adult": "성인", "child": "아동"}
SUBJ_LS = {"adult": "-", "child": (0, (1.0, 0.6))}


def pd_rng(s, d, f):
    lo, hi = PD_A[s][d]
    return lo * f, hi * f


def panel(ax, s, y=-0.25):
    ax.text(0.5, y, s, transform=ax.transAxes, ha="center", va="top", fontsize=8.5)


def range_bar(ax, x, lo, hi, col, ls):
    ax.plot([x, x], [lo, hi], color=col, lw=2.0, ls=ls, solid_capstyle="butt", zorder=3)
    ax.plot(x, lo, marker="o", ms=4.0, mfc="white", mec=col, mew=1.0, zorder=4)
    ax.plot(x, hi, marker="s", ms=3.6, mfc=col, mec=col, zorder=4)


def point(ax, x, y, col):
    ax.plot(x, y, marker="D", ms=4.0, mfc=col, mec=col, zorder=4)


def setup_dist_axis(ax):
    """근역장 5, 10 cm(아동 안면)와 30–100 cm(몸통)를 한 축에 둔다."""
    ticks = list(range(len(NEAR) + len(DIST)))
    ax.set_xticks(ticks)
    ax.set_xticklabels([f"{d}" for d in NEAR + DIST])
    ax.set_xlim(-0.6, len(ticks) - 0.4)
    ax.axvline(len(NEAR) - 0.5, color="#999999", lw=0.5)
    ax.set_xlabel("문까지 거리 (cm): 근역장은 안면, 그 외는 몸통 앞면")


def plot_ranges(ax, value):
    """value(s, d, f) -> (lo, hi). 30–100 cm 범위 막대 (성인, 아동 × A, B)."""
    offs = {("adult", 1): -0.27, ("adult", 100): -0.09, ("child", 1): 0.09, ("child", 100): 0.27}
    for i, d in enumerate(DIST):
        x0 = len(NEAR) + i
        for s in SUBJ:
            for f, col in ((1, A_COL), (100, B_COL)):
                lo, hi = value(s, d, f)
                range_bar(ax, x0 + offs[(s, f)], lo, hi, col, SUBJ_LS[s])


def plot_near(ax, val_b):
    for i, d in enumerate(NEAR):
        point(ax, i - 0.1, val_b[d] / 100, A_COL)
        point(ax, i + 0.1, val_b[d], B_COL)


def legend(fig, lo_lab, hi_lab):
    handles = [Line2D([], [], color=A_COL, lw=2.0, label="시나리오 A (정상 제품)"),
               Line2D([], [], color=B_COL, lw=2.0, label="시나리오 B (방출 상한)"),
               Line2D([], [], color="#555555", lw=2.0, label="성인 (Gustav)"),
               Line2D([], [], color="#555555", lw=2.0, ls=SUBJ_LS["child"], label="아동 (Child)"),
               Line2D([], [], ls="", marker="o", mfc="white", mec="k", ms=4.0, label=lo_lab),
               Line2D([], [], ls="", marker="s", mfc="k", mec="k", ms=3.6, label=hi_lab),
               Line2D([], [], ls="", marker="D", mfc="k", mec="k", ms=4.0, label="아동 근역장 해석")]
    fig.legend(handles=handles, loc="upper center", ncol=4, fontsize=7, handlelength=2.0, columnspacing=1.4,
               bbox_to_anchor=(0.5, 1.0))


def ref_lines(ax, lines):
    """lines: (y, 라벨, 선 모양, 위치). 위치 'r'은 오른쪽 위, 'l'은 근역장 구역 왼쪽(위 'lu' / 아래 'ld')."""
    for y, lab, ls, where in lines:
        ax.axhline(y, color=REF, lw=0.8, ls=ls, zorder=1)
        if where == "r":
            ax.text(len(NEAR) + len(DIST) - 0.45, y * 1.25, lab, ha="right", va="bottom", fontsize=6.8, color=REF)
        else:
            up = where == "lu"
            ax.text(-0.5, y * (1.25 if up else 0.8), lab, ha="left", va="bottom" if up else "top", fontsize=6.8,
                    color=REF, linespacing=1.0)


def fig_sar_margin():
    fig, (a, b) = plt.subplots(1, 2, figsize=(W2, 3.45), gridspec_kw={"width_ratios": [1, 1.0]})
    # (a) 전신 평균 SAR
    plot_ranges(a, lambda s, d, f: tuple(PER_WB[s] * p for p in pd_rng(s, d, f)))
    plot_near(a, NF_WB_B)
    a.set_yscale("log")
    a.set_ylim(5e-6, 20)
    setup_dist_axis(a)
    a.set_ylabel("전신 평균 SAR (W/kg)")
    a.yaxis.set_major_locator(LogLocator(base=10, numticks=10))
    ref_lines(a, ((THRESH, "열적 영향 문턱 (4 W/kg)", "--", "r"),
                  (BMR_W / MASS["adult"], "안정 시 대사열 (성인 1.1 W/kg)", ":", "r"),
                  (LIMIT, "일반인 기본 제한\n(0.08 W/kg)", "-", "lu")))
    legend(fig, "v2 문, 몸 앞 평균 조사", "v1 문, 몸 앞 최댓값 조사")
    panel(a, "(a)", -0.17)

    # (b) 기준 도달 배수 = 기준 / 시나리오 A 값
    rows = [(f"성인 전신, {d} cm", *MULT_WB_ADULT[d][::-1], "adult") for d in DIST] + \
           [(f"성인 머리·몸통 1 g, {d} cm", *MULT_LOC_ADULT[d][::-1], "adult") for d in DIST]
    for d in DIST:
        lo, hi = pd_rng("child", d, 1)
        rows.append((f"아동 전신, {d} cm", LIMIT / (PER_WB["child"] * hi), LIMIT / (PER_WB["child"] * lo), "child"))
    for d in DIST:
        lo, hi = pd_rng("child", d, 1)
        rows.append((f"아동 머리·몸통 1 g, {d} cm", LIMIT_LOC / (PER_LOC["child"] * hi),
                     LIMIT_LOC / (PER_LOC["child"] * lo), "child"))
    for d in NEAR:
        m = LIMIT_LOC / (NF_LOC_B[d] / 100)
        rows.append((f"아동 머리 1 g, 안면 {d} cm", m, m, "near"))
    n = len(rows)
    for i, (lab, lo, hi, s) in enumerate(rows):
        y = n - 1 - i
        if s == "near":
            b.plot(lo, y, marker="D", ms=4.0, color="#555555", zorder=3)
            b.text(lo * 1.35, y, f"{lo:,.0f}", va="center", fontsize=6.8)
        else:
            b.plot([lo, hi], [y, y], color="#555555", lw=4.0, ls=SUBJ_LS[s], solid_capstyle="butt", zorder=3)
            b.text(hi * 1.15, y, f"{lo:,.0f}–{hi:,.0f}", va="center", fontsize=6.8)
    b.set_xscale("log")
    b.set_xlim(0.5, 3e4)
    b.set_yticks(range(n))
    b.set_yticklabels([r[0] for r in rows][::-1], fontsize=6.8)
    b.set_ylim(-0.7, n - 0.3)
    b.axvline(1, color=A_COL, lw=1.0)
    b.axvline(100, color=B_COL, lw=1.0)
    b.text(1.1, n - 0.6, "A", color=A_COL, fontsize=7.5)
    b.text(110, n - 0.6, "B", color=B_COL, fontsize=7.5)
    for yb in (1.5, 4.5, 7.5, 10.5):
        b.axhline(yb, color="#999999", lw=0.5)
    b.set_xlabel("기준 도달 배수 (시나리오 A 누설 대비)")
    b.tick_params(axis="y", which="both", right=False)
    panel(b, "(b)", -0.17)
    fig.tight_layout(w_pad=1.5)
    fig.subplots_adjust(bottom=0.2, top=0.85)
    for ext in ("pdf", "png"):
        fig.savefig(os.path.join(OUT, f"fig_sar_margin.{ext}"), dpi=300)
    plt.close(fig)


def fig_temperature():
    fig, (a, b) = plt.subplots(1, 2, figsize=(W2, 2.95))

    def core(s, d, f):
        lo, hi = (PER_WB[s] * p for p in pd_rng(s, d, f))
        return lo / THRESH, hi * T_EXP / C_TISSUE

    def local(s, d, f):
        if s == "adult":
            return tuple(v * f for v in DT_LOCAL_A_ADULT[d])
        return tuple(PER_DT[s] * p for p in pd_rng(s, d, f))

    plot_ranges(a, core)
    for i, d in enumerate(NEAR):  # 근역장 심부: 하한(문턱 비례)–상한(30분 단열) 범위
        for f, col, dx in ((1, A_COL, -0.1), (100, B_COL, 0.1)):
            sar = NF_WB_B[d] * f / 100
            range_bar(a, i + dx, sar / THRESH, sar * T_EXP / C_TISSUE, col, SUBJ_LS["child"])
    plot_ranges(b, local)
    plot_near(b, NF_DT_B)
    for ax in (a, b):
        ax.set_yscale("log")
        ax.set_ylim(1e-6, 5)
        setup_dist_axis(ax)
        ref_lines(ax, ((1.0, "1 °C", "--", "r"),
                       (0.1, "0.1 °C (체온계 분해능)" if ax is a else "0.1 °C\n(체온계 분해능)", ":",
                        "lu" if ax is a else "ld")))
    a.set_ylabel("심부 체온 상승 (°C)")
    b.set_ylabel("국부 최대 온도 상승 (°C)")
    legend(fig, "하한 추정", "상한 추정")
    panel(a, "(a)")
    panel(b, "(b)")
    fig.tight_layout(w_pad=2.0)
    fig.subplots_adjust(bottom=0.25, top=0.80)
    for ext in ("pdf", "png"):
        fig.savefig(os.path.join(OUT, f"fig_temperature.{ext}"), dpi=300)
    plt.close(fig)


if __name__ == "__main__":
    fig_sar_margin()
    fig_temperature()
