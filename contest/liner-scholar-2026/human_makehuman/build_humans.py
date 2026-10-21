"""MakeHuman(MPFB2) 기본 메쉬와 매크로 타깃으로 성인·아동 인체 외형 STL을 만든다.

- 기본 메쉬와 타깃: makehumancommunity/mpfb2 (자산 CC0). 경로는 --mpfb 로 지정.
- 매크로 계산은 MPFB2 TargetService.calculate_target_stack_from_macro_info_dict 와 같은 규칙.
- 나이 슬라이더 ↔ 나이: 0 = 1세, 0.1875 = 11세, 0.5 = 25세, 1 = 90세 (MakeHuman 규칙).
- 좌표 변환: MakeHuman (x, y위, z앞, 단위 dm) → CST (x, z위, -y앞, 단위 mm). 사람은 -y 방향(오븐 쪽)을 본다.
- 출력: 발바닥 z=0, 몸 중심 x=0, 몸 앞면 y=0. CST에서 y 방향으로 거리만큼 평행이동해 쓴다.

사용: python3 -I build_humans.py --mpfb /path/to/mpfb2/src/mpfb/data
"""
import argparse
import gzip
import json
import os

import numpy as np
import trimesh

SUBJECTS = {
    # 이름: 나이(세), 목표 키(mm), 목표 체중(kg). 한국 기준값 [확인 필요]
    # eye_r: 안구(유리체) 반지름 mm, 나이별 안축장/2 근사 [확인 필요]
    "adult_male": dict(age=30.0, height=1720.0, mass=74.0, eye_r=12.0),
    "child_7y": dict(age=7.0, height=1220.0, mass=24.0, eye_r=11.2),
    "child_3y": dict(age=3.0, height=960.0, mass=14.5, eye_r=10.5),
}
ARM_ANGLE_DEG = 12.0  # 팔을 몸 옆으로 내렸을 때 수직에서 바깥으로 벌어진 각
ARM_BONES = ["upperarm01", "upperarm02", "lowerarm01", "lowerarm02", "wrist",
             "metacarpal1", "metacarpal2", "metacarpal3", "metacarpal4"] + \
            [f"finger{i}-{j}" for i in range(1, 6) for j in range(1, 4)]
DENSITY = 1050.0  # kg/m^3, 인체 평균 밀도 근사 (체중 맞춤용)


def age_to_slider(years):
    if years < 11:
        return (years - 1) / 10 * 0.1875
    if years < 25:
        return 0.1875 + (years - 11) / 14 * 0.3125
    return 0.5 + (years - 25) / 65 * 0.5


def interpolate(macro, name, value):
    out = []
    for p in macro["macrotargets"][name]["parts"]:
        lo, hi = p["lowest"], p["highest"]
        if lo < value < hi:
            pct = (value - lo) / (hi - lo)
            if p["low"]:
                out.append((p["low"], round(1 - pct, 4)))
            if p["high"]:
                out.append((p["high"], round(pct, 4)))
    return out


def target_stack(macro, info, cutoff=0.01):
    c = {k: interpolate(macro, k, info[k]) for k in ["gender", "age", "muscle", "weight", "proportions", "height"]}
    t = []
    for race, rw in info["race"].items():
        if rw > 1e-4:
            for a, aw in c["age"]:
                for g, gw in c["gender"]:
                    if g != "universal" and rw * gw * aw > cutoff:
                        t.append((f"macrodetails/{race}-{g}-{a}", rw * gw * aw))
    for g, gw in c["gender"]:
        for a, aw in c["age"]:
            for m, mw in c["muscle"]:
                for w, ww in c["weight"]:
                    wt = gw * aw * mw * ww
                    if wt > cutoff:
                        t.append((f"macrodetails/universal-{g}-{a}-{m}-{w}", wt))
                    for h, hw in c["height"]:
                        if wt * hw > cutoff:
                            t.append((f"macrodetails/height/{g}-{a}-{m}-{w}-{h}", wt * hw))
                    for pr, pw in c["proportions"]:
                        if wt * pw > cutoff and a != "baby":
                            t.append((f"macrodetails/proportions/{g}-{a}-{m}-{w}-{pr}", wt * pw))
    return t


def load_obj(path):
    verts, faces, groups = [], [], {}
    cur = None
    with open(path) as f:
        for line in f:
            if line.startswith("v "):
                verts.append([float(x) for x in line.split()[1:4]])
            elif line.startswith("g "):
                cur = line.split()[1]
            elif line.startswith("f "):
                idx = [int(tok.split("/")[0]) - 1 for tok in line.split()[1:]]
                groups.setdefault(cur, []).append(idx)
    return np.array(verts), groups


def load_target(data_dir, name):
    path = os.path.join(data_dir, "targets", name + ".target.gz")
    with gzip.open(path, "rt") as f:
        rows = [ln.split() for ln in f if ln.strip() and not ln.startswith("#")]
    idx = np.array([int(r[0]) for r in rows], dtype=int)
    d = np.array([[float(x) for x in r[1:4]] for r in rows]).reshape(-1, 3)
    return idx, d


def group_center(v, groups, name):
    ids = sorted({i for f in groups[name] for i in f})
    return v[ids].mean(axis=0)


def rotation_between(a, b):
    a, b = a / np.linalg.norm(a), b / np.linalg.norm(b)
    k = np.cross(a, b)
    s, c = np.linalg.norm(k), float(np.dot(a, b))
    if s < 1e-9:
        return np.eye(3)
    k = k / s
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + s * K + (1 - c) * K @ K


def pose_arms_down(v, groups, weights):
    """팔 사슬(위팔~손가락)을 어깨 관절 기준으로 회전해 몸 옆으로 내린다 (선형 블렌드 스키닝)."""
    v = v.copy()
    n = len(v)
    for side, sign in (("L", 1.0), ("R", -1.0)):
        w = np.zeros(n)
        for b in ARM_BONES:
            for idx, wt in weights.get(f"{b}.{side}", []):
                w[idx] += wt
        w = np.clip(w, 0, 1)
        sl = side.lower()
        pivot = group_center(v, groups, f"joint-{sl}-shoulder")
        hand = group_center(v, groups, f"joint-{sl}-hand")
        a = np.radians(ARM_ANGLE_DEG)
        target = np.array([sign * np.sin(a), -np.cos(a), 0.0])  # MakeHuman 좌표: y 위, x 왼쪽(+)
        R = rotation_between(hand - pivot, target)
        moved = (v - pivot) @ R.T + pivot
        v = v + w[:, None] * (moved - v)
    return v


def build(data_dir, base_v, groups, macro, years, weight_slider, weights):
    info = dict(gender=1.0, age=age_to_slider(years), muscle=0.5, weight=weight_slider,
                proportions=0.5, height=0.5, race={"asian": 1.0, "caucasian": 0.0, "african": 0.0})
    v = base_v.copy()
    for name, w in target_stack(macro, info):
        idx, d = load_target(data_dir, name)
        v[idx] += w * d
    v = pose_arms_down(v, groups, weights)
    # 좌표 변환 (dm → mm, y위 → z위, z앞 → -y앞)
    p = np.column_stack([v[:, 0], -v[:, 2], v[:, 1]]) * 100.0
    tris = []
    for quad in groups["body"]:
        tris.append([quad[0], quad[1], quad[2]])
        if len(quad) == 4:
            tris.append([quad[0], quad[2], quad[3]])
    body = trimesh.Trimesh(p, np.array(tris), process=True)
    body.remove_unreferenced_vertices()
    eyes = {}
    for side in ("l", "r"):
        ids = sorted({i for f in groups[f"helper-{side}-eye"] for i in f})
        pts = p[ids]
        c = pts.mean(axis=0)
        eyes[side] = dict(center=c)
    return body, eyes


def finish(body, eyes, height_mm, eye_r):
    trimesh.repair.fill_holes(body)
    trimesh.repair.fix_normals(body)
    s = height_mm / (body.bounds[1, 2] - body.bounds[0, 2])
    body.apply_scale(s)
    for e in eyes.values():
        e["center"] = e["center"] * s
        e["radius"] = eye_r
    lo, hi = body.bounds
    shift = np.array([-(lo[0] + hi[0]) / 2, -lo[1], -lo[2]])
    body.apply_translation(shift)
    for e in eyes.values():
        e["center"] = e["center"] + shift
    return body, eyes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mpfb", required=True, help="mpfb2/src/mpfb/data")
    ap.add_argument("--out", default=os.path.dirname(os.path.abspath(__file__)))
    args = ap.parse_args()
    macro = json.load(open(os.path.join(args.mpfb, "targets", "macrodetails", "macro.json")))
    base_v, groups = load_obj(os.path.join(args.mpfb, "3dobjs", "base.obj"))
    weights = json.load(open(os.path.join(args.mpfb, "rigs", "standard", "weights.default.json")))["weights"]
    summary = {}
    for name, s in SUBJECTS.items():
        # 체중 슬라이더를 이분법으로 찾아 목표 체중에 맞춘다 (키는 균일 스케일로 맞춤)
        lo_w, hi_w = 0.0, 1.0
        for _ in range(14):
            mid = (lo_w + hi_w) / 2
            body, eyes = finish(*build(args.mpfb, base_v, groups, macro, s["age"], mid, weights), s["height"], s["eye_r"])
            m = body.volume * 1e-9 * DENSITY
            if m < s["mass"]:
                lo_w = mid
            else:
                hi_w = mid
        body.export(os.path.join(args.out, f"{name}.stl"))
        lo, hi = body.bounds
        vv = body.vertices
        H = hi[2]
        ez = eyes["l"]["center"][2]

        def ymin(sel):
            return round(float(vv[sel, 1].min()), 1)

        anchors = dict(
            y_front_face=ymin((vv[:, 2] > ez - 120) & (np.abs(vv[:, 0]) < 100)),
            y_front_chest=ymin((vv[:, 2] > 0.65 * H) & (vv[:, 2] < 0.75 * H) & (np.abs(vv[:, 0]) < 0.12 * H)),
            y_front_abdomen=ymin((vv[:, 2] > 0.52 * H) & (vv[:, 2] < 0.62 * H) & (np.abs(vv[:, 0]) < 0.12 * H)),
            y_front_toes=ymin(vv[:, 2] < 0.05 * H),
        )
        # 자기 교차(팔과 몸통 겹침) 점검: 메쉬 부피와 복셀 채움 부피 비교
        vox = body.voxelized(pitch=3.0).fill()
        overlap_pct = round(100 * (body.volume - vox.volume) / body.volume, 2)
        summary[name] = dict(
            anchors_mm=anchors, mesh_vs_voxel_volume_diff_pct=overlap_pct,
            age_years=s["age"], weight_slider=round(mid, 4),
            height_mm=round(float(hi[2] - lo[2]), 1), width_mm=round(float(hi[0] - lo[0]), 1),
            depth_mm=round(float(hi[1] - lo[1]), 1),
            volume_L=round(body.volume * 1e-6, 2), mass_kg_at_1050=round(m, 2),
            surface_m2=round(body.area * 1e-6, 3), watertight=bool(body.is_watertight),
            triangles=int(len(body.faces)),
            eyes={k: dict(center_mm=[round(float(x), 1) for x in e["center"]], vitreous_radius_mm=e["radius"])
                  for k, e in eyes.items()},
        )
        print(name, json.dumps(summary[name], ensure_ascii=False))
    json.dump(summary, open(os.path.join(args.out, "humans_summary.json"), "w"), indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
