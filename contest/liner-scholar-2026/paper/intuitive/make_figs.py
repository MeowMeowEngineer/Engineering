"""일반 독자용 직관 그림 3개. 숫자는 paper_draft.md의 표 3, 표 4, 표 2-2, 4.3절에서 가져왔다.

F1 safety_ladder.png   : 전신 평균 SAR을 건강영향 문턱·기준·체열과 한 사다리에 놓기 (성인, 30 cm)
F2 distance_gauge.png  : 거리별로 기준의 몇 %인가 (정상 제품 vs 법정 상한 제품)
F3 margin.png          : 누설이 정상 제품의 몇 배가 되어야 기준에 닿나 (30 cm)

범위의 아래 끝 = 실제 문 구조(v2), 몸 앞 평균 조사 / 위 끝 = 단순 문(v1), 몸 앞 최댓값 조사(가장 보수적).
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle
from matplotlib.ticker import FuncFormatter, LogLocator


def dec(v):
    """과학 표기 없이 유효숫자 2자리 소수로 (예: 0.000014)"""
    if v >= 1:
        return f"{v:g}"
    from math import floor, log10
    d = -int(floor(log10(v))) + 1
    return f"{v:.{d}f}"


def plain(v, _):
    if v >= 1:
        return f"{v:g}"
    from math import floor, log10
    return f"{v:.{-int(floor(log10(v) + 1e-9))}f}"

plt.rcParams.update({
    "font.family": "Noto Sans CJK KR", "axes.unicode_minus": False, "font.size": 11,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.edgecolor": "#8a8984", "axes.labelcolor": "#52514e",
    "xtick.color": "#52514e", "ytick.color": "#52514e",
})
INK, INK2, MUTED, GRID = "#0b0b0b", "#52514e", "#8a8984", "#e6e5e1"
A_COL, B_COL = "#2a78d6", "#eb6834"   # 정상 제품, 법정 상한 제품 (범주 1, 2번)
LIMIT_COL = "#0b0b0b"
OUT = os.path.dirname(os.path.abspath(__file__))

MASS = 74.16          # 성인 모형 질량 kg
LIMIT = 0.08          # 일반인 전신 평균 SAR 기준 W/kg
THRESH = 4.0          # 전신 SAR 건강영향 문턱 (ICNIRP, 체온 약 1도 상승) W/kg [확인 필요]
BMR_W = 80.0          # 성인 기초대사 열 약 80 W (하루 약 1,650 kcal) [일반 생리 값]

# 4.3절·3.7절의 성인 전신 평균 기준 도달 배수 (두 편파 중 불리한 쪽)
# key: 거리 cm -> (v2 몸앞평균, v2 몸앞최대, v1 몸앞평균, v1 몸앞최대)
MULT = {30: (1456, 541, 509, 117), 50: (2572, 1220, 766, 247), 100: (7358, 3274, 1810, 834)}


def sar_range(dist, scen):
    """정상 제품(A) 또는 법정 상한(B)의 전신 평균 SAR 범위 (W/kg): (현실적, 가장 보수적)"""
    v2m, _, _, v1x = MULT[dist]
    f = 1 if scen == "A" else 100
    return LIMIT * f / v2m, LIMIT * f / v1x


def fig1_ladder():
    fig, ax = plt.subplots(figsize=(8.6, 6.4))
    ax.set_yscale("log")
    ax.set_ylim(2e-5, 20)
    ax.set_xlim(0, 10)
    ax.grid(axis="y", color=GRID, lw=0.8, which="major")
    ax.set_xticks([])
    ax.spines["bottom"].set_visible(False)
    ax.set_ylabel("몸 전체 평균 흡수율, 전신 평균 SAR (W/kg, 로그 눈금)")

    def ref_line(y, text, sub, color=INK, ls="-"):
        ax.plot([0.3, 9.7], [y, y], color=color, lw=1.6, ls=ls)
        ax.text(0.35, y * 1.18, text, color=INK, fontsize=11, fontweight="bold", va="bottom")
        ax.text(0.35, y / 1.22, sub, color=INK2, fontsize=9, va="top")

    ref_line(THRESH, "건강 영향 문턱: 4 W/kg", f"30분 넘게 노출되면 체온이 약 1 °C 오르는 수준 · 몸 전체 약 {THRESH*MASS:.0f} W", MUTED, "--")
    ref_line(BMR_W / MASS, f"우리 몸이 가만히 있어도 내는 열: 약 {BMR_W/MASS:.1f} W/kg", f"기초대사 약 {BMR_W:.0f} W", MUTED, ":")
    ref_line(LIMIT, "일반인 기준: 0.08 W/kg", f"문턱의 1/50 · 몸 전체 약 {LIMIT*MASS:.1f} W", LIMIT_COL)

    for x, scen, col, title in ((3.2, "A", A_COL, "정상 제품"), (6.8, "B", B_COL, "누설이 법정 상한인 제품")):
        lo, hi = sar_range(30, scen)
        ax.bar(x, hi - lo, bottom=lo, width=0.9, color=col, zorder=3)
        ax.text(x + 0.62, (lo * hi) ** 0.5, f"{title}\n30 cm 앞 성인\n{lo:.5f}–{hi:.4f} W/kg\n= 기준의 {lo/LIMIT*100:.2g}–{hi/LIMIT*100:.2g}%\n몸 전체 흡수 {lo*MASS*1000:.0f}–{hi*MASS*1000:.0f} mW" if scen == "A"
                else f"{title}\n30 cm 앞 성인\n{lo:.4f}–{hi:.3f} W/kg\n= 기준의 {lo/LIMIT*100:.2g}–{hi/LIMIT*100:.2g}%\n몸 전체 흡수 {lo*MASS:.1f}–{hi*MASS:.1f} W",
                color=INK, fontsize=9.5, va="center")
    ax.yaxis.set_major_formatter(FuncFormatter(plain))
    fig.text(0.01, 0.01, "막대 아래 끝: 실제 문 구조, 몸 앞 평균 노출 / 위 끝: 단순 문, 몸 앞 최댓값 노출(가장 보수적). 기준·문턱: ICNIRP, 국내 인체보호기준.",
             fontsize=8.5, color=INK2)
    ax.set_title("전자레인지 30 cm 앞에 선 성인이 흡수하는 전자파, 어느 정도일까?", loc="left", fontsize=13, color=INK, pad=12)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(os.path.join(OUT, "safety_ladder.png"), dpi=200)
    plt.close(fig)


def person(ax, x, h=0.8, col="#c3c2b7"):
    ax.add_patch(Circle((x, h * 0.88), h * 0.1, fc=col, ec="none"))
    ax.add_patch(FancyBboxPatch((x - h * 0.11, h * 0.18), h * 0.22, h * 0.56, boxstyle="round,pad=0,rounding_size=0.03",
                                fc=col, ec="none"))
    ax.add_patch(Rectangle((x - h * 0.09, 0), h * 0.07, h * 0.2, fc=col, ec="none"))
    ax.add_patch(Rectangle((x + h * 0.02, 0), h * 0.07, h * 0.2, fc=col, ec="none"))


def fig2_distance():
    fig, (top, ax) = plt.subplots(2, 1, figsize=(8.6, 6.6), gridspec_kw={"height_ratios": [1, 3.2]}, sharex=True)
    pos = {30: 1, 50: 2, 100: 3}
    # 위: 그림 표지
    top.set_ylim(0, 1)
    top.axis("off")
    top.add_patch(FancyBboxPatch((0.05, 0.25), 0.42, 0.5, boxstyle="round,pad=0,rounding_size=0.05", fc="#52514e", ec="none"))
    top.add_patch(Rectangle((0.09, 0.32), 0.24, 0.36, fc="#8a8984", ec="none"))
    top.text(0.26, 0.82, "전자레인지", ha="center", fontsize=9, color=INK2)
    for d, x in pos.items():
        person(top, x)
        top.text(x, -0.08, f"{d} cm", ha="center", va="top", fontsize=11, color=INK, fontweight="bold")
    # 아래: 기준 대비 %
    ax.set_yscale("log")
    ax.set_ylim(0.002, 300)
    ax.set_xlim(0, 3.6)
    ax.axhline(100, color=LIMIT_COL, lw=1.6)
    ax.text(0.06, 120, "일반인 기준 (100%)", fontsize=10, color=INK, fontweight="bold")
    ax.axhline(1, color=MUTED, lw=0.8, ls=":")
    ax.text(0.06, 1.15, "기준의 1%", fontsize=9, color=INK2)
    ax.grid(axis="y", color=GRID, lw=0.8)
    for d, x in pos.items():
        for dx, scen, col in ((-0.16, "A", A_COL), (0.16, "B", B_COL)):
            lo, hi = (v / LIMIT * 100 for v in sar_range(d, scen))
            ax.bar(x + dx, hi - lo, bottom=lo, width=0.22, color=col, zorder=3)
            ax.text(x + dx, hi * 1.25, f"{hi:.2g}%", ha="center", fontsize=8.5, color=INK2)
            ax.text(x + dx, lo / 1.3, f"{lo:.2g}%", ha="center", va="top", fontsize=8.5, color=INK2)
    ax.set_xticks(list(pos.values()))
    ax.set_xticklabels([f"{d} cm" for d in pos])
    ax.set_ylabel("전신 평균 SAR, 기준 대비 % (로그 눈금)")
    h1 = Rectangle((0, 0), 1, 1, fc=A_COL)
    h2 = Rectangle((0, 0), 1, 1, fc=B_COL)
    ax.legend([h1, h2], ["정상 제품 (누설이 법정 상한의 약 1%)", "누설이 법정 상한인 제품"], loc="lower left", frameon=True,
              facecolor="white", edgecolor="none", fontsize=9.5)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:g}%"))
    top.set_title("거리별로 보면: 정상 제품은 어디에 서도 기준의 1% 아래", loc="left", fontsize=13, color=INK)
    fig.text(0.01, 0.005, "성인 기준(문에 얼굴을 댄 아동은 계산 중). 막대 범위: 실제 문 구조·몸 앞 평균 노출(아래 끝) ~ 단순 문·몸 앞 최댓값 노출(위 끝, 가장 보수적).",
             fontsize=8.5, color=INK2)
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(os.path.join(OUT, "distance_gauge.png"), dpi=200)
    plt.close(fig)


def fig3_margin():
    fig, ax = plt.subplots(figsize=(8.6, 4.4))
    ax.set_xscale("log")
    ax.set_xlim(0.5, 5000)
    rows = [
        ("전신 평균 SAR\n(성인 단순 모형)", 117, 1456, "실제 문 구조 기준 541–1,456배"),
        ("머리·몸통 국부 SAR 1 g\n(해부학 모형 Gustav, 단순 문)", 62, 267, "62배는 머리가 문 높이에 있다고 본 과한 가정"),
    ]
    for i, (lab, lo, hi, note) in enumerate(rows):
        y = 1 - i
        ax.barh(y, hi - lo, left=lo, height=0.34, color="#6b6a66", zorder=3)
        ax.text(lo, y - 0.22, f"{lo:,}배", ha="left", va="top", fontsize=9.5, color=INK2)
        ax.text(hi * 1.12, y, f"{hi:,}배", ha="left", va="center", fontsize=9.5, color=INK2)
        ax.text(hi * 1.12, y - 0.32, note, ha="left", va="center", fontsize=8.5, color=INK2)
    ax.set_yticks([1, 0])
    ax.set_yticklabels([r[0] for r in rows], fontsize=10)
    ax.set_ylim(-0.7, 1.7)
    for x, lab, col in ((1, "정상 제품\n(1배)", A_COL), (100, "법정 상한 제품\n(100배)", B_COL)):
        ax.axvline(x, color=col, lw=2, zorder=2)
        ax.text(x, 1.45, lab, ha="center", va="bottom", fontsize=9.5, color=INK, fontweight="bold",
                bbox=dict(fc="white", ec="none", pad=1.5))
    ax.annotate("", xy=(62, -0.55), xytext=(1, -0.55), arrowprops=dict(arrowstyle="->", color=A_COL, lw=1.6))
    ax.text(7.9, -0.5, "가장 보수적으로 잡아도 62배 이상 여유", ha="center", va="bottom", fontsize=9.5, color=INK)
    ax.set_xlabel("기준에 닿으려면 누설이 정상 제품의 몇 배가 되어야 하나 (로그 눈금, 30 cm)")
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}" if v >= 1 else f"{v:g}"))
    ax.grid(axis="x", color=GRID, lw=0.8)
    ax.set_title("안전 여유: 정상 제품 누설이 수십~수천 배 늘어야 기준에 닿는다", loc="left", fontsize=13, color=INK)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "margin.png"), dpi=200)
    plt.close(fig)


if __name__ == "__main__":
    fig1_ladder()
    fig2_distance()
    fig3_margin()


# ---------------------------------------------------------------------------
# F4 체온 변화: 심부 체온 상승을 두 방법으로 어림 (성인, 30 cm)
#   (1) 단열 상한: 몸이 열을 전혀 내보내지 못한다고 보고 30분 노출. dT = SAR * t / c
#   (2) 기준 비례: ICNIRP 문턱 "전신 SAR 4 W/kg ~ 심부 체온 +1 C"에 비례
# ---------------------------------------------------------------------------
C_TISSUE = 3500.0     # 인체 조직 평균 비열 J/(kg K) [근사, 확인 필요]
T_EXPOSE = 1800.0     # 30분 (ICNIRP 전신 평균 시간)


def dT_adiabatic(sar):
    return sar * T_EXPOSE / C_TISSUE


def dT_icnirp(sar):
    return sar / THRESH * 1.0


def fig4_temperature():
    fig, ax = plt.subplots(figsize=(8.6, 5.0))
    ax.set_xscale("log")
    ax.set_xlim(5e-6, 5)
    ax.xaxis.set_major_formatter(FuncFormatter(plain))
    ax.grid(axis="x", color=GRID, lw=0.8)
    rows = []
    for scen, col, name in (("A", A_COL, "정상 제품"), ("B", B_COL, "누설이 법정 상한인 제품")):
        lo, hi = sar_range(30, scen)
        rows.append((f"{name}\n(기준 비례 어림)", dT_icnirp(lo), dT_icnirp(hi), col))
        rows.append((f"{name}\n(열을 전혀 못 내보낸다고 본 30분 상한)", dT_adiabatic(lo), dT_adiabatic(hi), col))
    for i, (lab, lo, hi, col) in enumerate(rows):
        y = len(rows) - 1 - i
        ax.barh(y, hi - lo, left=lo, height=0.5, color=col, zorder=3)
        ax.text(hi * 1.15, y, f"{dec(lo)}–{dec(hi)} °C", va="center", fontsize=9.5, color=INK)
    ax.set_yticks(range(len(rows)))
    ax.set_yticklabels([r[0] for r in rows][::-1], fontsize=9.5)
    ax.set_ylim(-0.8, len(rows) + 0.4)
    for x, lab, ls in ((1.0, "건강 영향 문턱\n심부 체온 +1 °C", "--"), (0.1, "체온계 눈금\n0.1 °C", ":")):
        ax.axvline(x, color=INK if ls == "--" else MUTED, lw=1.5, ls=ls, zorder=2)
        ax.text(x, len(rows) - 0.35, lab, ha="center", va="bottom", fontsize=9, color=INK,
                bbox=dict(fc="white", ec="none", pad=1.5))
    ax.set_xlabel("심부 체온 상승 (°C, 로그 눈금)")
    ax.set_title("전자레인지 30 cm 앞 30분: 체온은 얼마나 오를까?", loc="left", fontsize=13, color=INK)
    fig.text(0.01, 0.01, f"성인. 기준 비례: 전신 SAR 4 W/kg ≈ +1 °C(ICNIRP)에 비례. 30분 상한: 조직 비열 {C_TISSUE:.0f} J/(kg·K), 열 손실 0으로 가정한 최대치.",
             fontsize=8.5, color=INK2)
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    fig.savefig(os.path.join(OUT, "temperature_core.png"), dpi=200)
    plt.close(fig)


if __name__ == "__main__":
    fig4_temperature()
