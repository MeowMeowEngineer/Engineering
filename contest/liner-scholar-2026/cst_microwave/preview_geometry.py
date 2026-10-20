"""CST 매크로와 같은 치수로 전자레인지와 인체 모형을 그려 배치를 확인하고 모형 질량을 계산한다.

사용: python3 preview_geometry.py [d_adult] [d_child]   (기본 500, 50, 단위 mm)
출력: preview_adult.png, preview_child.png, 콘솔에 질량
"""
import sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Ellipse

# 01_setup_oven.bas 파라미터
Wc, Hc, Dc, Zc, H_ov = 330, 220, 330, 1025, 290
W_left, W_right, t_back, t_d, g, ov = 50, 150, 29, 20, 1, 25
a_wg, b_wg, L_wg, lg4, h_pr = 86.36, 43.18, 110, 43.4, 30
z_wg = Zc + 50
y_cav = -(t_d + g + Dc / 2)

OVEN = {  # name: (x1,x2,y1,y2,z1,z2)
    "body": (-Wc/2-W_left, Wc/2+W_right, -(t_d+g+Dc+t_back), 0, Zc-H_ov/2, Zc+H_ov/2),
    "cavity": (-Wc/2, Wc/2, -(t_d+g+Dc), -(t_d+g), Zc-Hc/2, Zc+Hc/2),
    "door": (-Wc/2-ov, Wc/2+ov, -t_d, 0, Zc-Hc/2-ov, Zc+Hc/2+ov),
    "wg": (Wc/2-5, Wc/2+L_wg, y_cav-a_wg/2, y_cav+a_wg/2, z_wg-b_wg/2, z_wg+b_wg/2),
}
WATER = (0, y_cav, 45, Zc-Hc/2, Zc-Hc/2+43)  # xc, yc, r, z1, z2
PROBE = (Wc/2+L_wg-lg4, y_cav, 2, z_wg+b_wg/2-1-h_pr, z_wg+b_wg/2-1)

RHO = {"Skin": 1109, "Fat": 911, "Muscle": 1090, "Bone": 1908, "Brain": 1045, "Vitreous": 1005, "Lens": 1076}


def person(kind, d):
    """주요 부피 요소 목록. (형태, 재질, 치수...) 바깥층 기준으로 그리기 + 층별 질량 계산용."""
    if kind == "adult":
        y = d + 110
        head = (0, y, 1620, [95, 93, 90, 84])
        eye = (32, y - 77, 1630, 12)
        torso = (y, 850, 1450, [(170, 110), (168, 108), (158, 98)])
        neck = (y, 1450, 1560, 55, 53)
        arms = (212, y, 800, 1430, 40, 38)
        legs = (90, y, 0, 850, 65, 63)
    else:
        y = d + 85
        head = (0, y, 1040, [85, 83, 81, 77])
        eye = (28, y - 68, 1045, 11)
        torso = (y, 560, 900, [(110, 75), (108, 73), (101, 66)])
        neck = (y, 900, 975, 35, 33)
        arms = (140, y, 530, 890, 28, 26)
        legs = (55, y, 0, 560, 45, 43)
    return dict(head=head, eye=eye, torso=torso, neck=neck, arms=arms, legs=legs)


def mass(p):
    v = lambda r: 4/3*np.pi*r**3
    hx, hy, hz, R = p["head"]
    ex, ey, ez, er = p["eye"]
    m = 0.0
    shells = [v(R[0])-v(R[1]), v(R[1])-v(R[2]), v(R[2])-v(R[3]), v(R[3])]
    for vol, mat in zip(shells, ["Skin", "Fat", "Bone", "Brain"]):
        m += vol * RHO[mat]
    m += 2 * v(er) * (RHO["Vitreous"] - RHO["Brain"])  # 눈이 대체한 부분 근사 보정
    y, z1, z2, layers = p["torso"]
    h = z2 - z1
    e = [np.pi*a*b*h for a, b in layers]
    m += (e[0]-e[1])*RHO["Skin"] + (e[1]-e[2])*RHO["Fat"] + e[2]*RHO["Muscle"]
    for key, n in (("neck", 1), ("arms", 2), ("legs", 2)):
        t = p[key]
        z1, z2, ro, ri = t[-4], t[-3], t[-2], t[-1]
        h = z2 - z1
        m += n * (np.pi*(ro**2-ri**2)*h*RHO["Skin"] + np.pi*ri**2*h*RHO["Muscle"])
    return m * 1e-9  # mm^3*kg/m^3 -> kg


def draw(ax, view, p):
    # view: "side"(y-z), "front"(x-z), "top"(x-y)
    idx = {"side": (2, 4), "front": (0, 4), "top": (0, 2)}[view]
    i, j = idx
    style = {"body": ("0.6", 1.0), "cavity": ("white", 1.0), "wg": ("white", 1.0), "door": ("0.25", 1.0)}
    for name in ("body", "cavity", "wg", "door"):
        b = OVEN[name]
        if view == "front" and name in ("cavity", "wg"):
            continue
        ax.add_patch(Rectangle((b[i], b[j]), b[i+1]-b[i], b[j+1]-b[j],
                               fc=style[name][0], ec="k", lw=0.6, zorder=1 if name == "body" else 2,
                               alpha=0.35 if view == "front" else 1.0))
    xc, yc, r, z1, z2 = WATER
    if view == "side":
        ax.add_patch(Rectangle((yc-r, z1), 2*r, z2-z1, fc="#5b8def", ec="k", lw=0.5, zorder=3))
        ax.add_patch(Rectangle((PROBE[1]-2, PROBE[3]), 4, PROBE[4]-PROBE[3], fc="k", zorder=3))
    elif view == "top":
        ax.add_patch(Circle((xc, yc), r, fc="#5b8def", ec="k", lw=0.5, zorder=3))
        ax.add_patch(Circle((PROBE[0], PROBE[1]), 3, fc="k", zorder=3))

    skin = "#f2c6a0"
    hx, hy, hz, R = p["head"]
    ex, ey, ez, er = p["eye"]
    y, z1, z2, layers = p["torso"]
    ny, nz1, nz2, nr, _ = p["neck"]
    ax_, ay, az1, az2, ar, _ = p["arms"]
    lx, ly, lz1, lz2, lr, _ = p["legs"]
    if view == "side":
        for xx in (lx,):
            ax.add_patch(Rectangle((ly-lr, lz1), 2*lr, lz2-lz1, fc=skin, ec="k", lw=0.5))
        ax.add_patch(Rectangle((y-layers[0][1], z1), 2*layers[0][1], z2-z1, fc=skin, ec="k", lw=0.5))
        ax.add_patch(Rectangle((ay-ar, az1), 2*ar, az2-az1, fc="#e8b48a", ec="k", lw=0.5))
        ax.add_patch(Rectangle((ny-nr, nz1), 2*nr, nz2-nz1, fc=skin, ec="k", lw=0.5))
        ax.add_patch(Circle((hy, hz), R[0], fc=skin, ec="k", lw=0.5))
        ax.add_patch(Circle((ey, ez), er, fc="#7fb3e6", ec="k", lw=0.5))
    elif view == "front":
        for s in (-1, 1):
            ax.add_patch(Rectangle((s*lx-lr, lz1), 2*lr, lz2-lz1, fc=skin, ec="k", lw=0.5))
            ax.add_patch(Rectangle((s*ax_-ar, az1), 2*ar, az2-az1, fc=skin, ec="k", lw=0.5))
            ax.add_patch(Circle((s*ex, ez), er, fc="#7fb3e6", ec="k", lw=0.5, zorder=6))
        ax.add_patch(Rectangle((-layers[0][0], z1), 2*layers[0][0], z2-z1, fc=skin, ec="k", lw=0.5))
        ax.add_patch(Rectangle((-nr, nz1), 2*nr, nz2-nz1, fc=skin, ec="k", lw=0.5))
        ax.add_patch(Circle((0, hz), R[0], fc=skin, ec="k", lw=0.5, zorder=5))
    else:
        ax.add_patch(Ellipse((0, y), 2*layers[0][0], 2*layers[0][1], fc=skin, ec="k", lw=0.5))
        for s in (-1, 1):
            ax.add_patch(Circle((s*ax_, ay), ar, fc=skin, ec="k", lw=0.5))
        ax.add_patch(Circle((0, hy), R[0], fc=skin, ec="k", lw=0.5, alpha=0.6))
        for s in (-1, 1):
            ax.add_patch(Circle((s*ex, ey), er, fc="#7fb3e6", ec="k", lw=0.5))


def render(kind, d, fn):
    p = person(kind, d)
    fig, axs = plt.subplots(1, 3, figsize=(15, 6.2))
    titles = {"side": "Side (y-z)", "front": "Front (x-z, viewed from person)", "top": "Top (x-y)"}
    lims = {"side": ((-420, d+400), (-20, 1800)), "front": ((-450, 450), (-20, 1800)), "top": ((-450, 450), (-420, d+400))}
    for ax, view in zip(axs, ("side", "front", "top")):
        draw(ax, view, p)
        ax.set_xlim(*lims[view][0]); ax.set_ylim(*lims[view][1])
        ax.set_aspect("equal"); ax.grid(alpha=0.3)
        ax.set_title(titles[view])
        ax.set_xlabel({"side": "y (mm)", "front": "x (mm)", "top": "x (mm)"}[view])
        ax.set_ylabel({"side": "z (mm)", "front": "z (mm)", "top": "y (mm)"}[view])
        if view == "side":
            ax.axvline(50, color="r", ls="--", lw=0.8)
            ax.text(55, 1750, "calibration plane y=50", color="r", fontsize=8)
    label = "Adult, torso front" if kind == "adult" else "Child, face front"
    fig.suptitle(f"{label} {d:.0f} mm from door  |  phantom mass ~{mass(p):.1f} kg")
    fig.tight_layout()
    fig.savefig(fn, dpi=110)
    return p


if __name__ == "__main__":
    for f in ("NanumGothic", "Noto Sans CJK KR", "Noto Sans KR"):
        if any(f in x.name for x in matplotlib.font_manager.fontManager.ttflist):
            plt.rcParams["font.family"] = f
            break
    plt.rcParams["axes.unicode_minus"] = False
    da = float(sys.argv[1]) if len(sys.argv) > 1 else 500
    dc = float(sys.argv[2]) if len(sys.argv) > 2 else 50
    pa = render("adult", da, "preview_adult.png")
    pc = render("child", dc, "preview_child.png")
    print(f"adult mass ~ {mass(pa):.1f} kg, child mass ~ {mass(pc):.1f} kg")
