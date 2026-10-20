' ============================================================================
' 03_child_phantom.bas
' 아동 단순화 인체 모형 (키 약 1.13 m, 6~7세 수준), 전자레인지 문을 들여다보는 자세
'
' 사용법: 01_setup_oven.bas 실행한 프로젝트(성인 모형 없는 별도 사본)에서 실행
'         거리는 파라미터 d_child (문 바깥 면 ~ 얼굴 앞면, mm)로 바꾼다: 50 / 100
'         눈 높이(z=1045)가 문 중심(z=1025) 근처에 오도록 잡았다.
'
' 구성 (모두 component "child"):
'   몸통: 타원기둥 3층 (피부 2 / 지방 7 / 근육)
'   머리: 구 4층 (피부 2 / 지방 2 / 뼈 4 / 뇌), 눈 2개 (유리체 구 + 수정체 원기둥)
'   목, 팔, 다리: 피부 2 mm + 근육 원기둥
' ============================================================================

Option Explicit

Const C As String = "child"

Function Q(s As String) As String
    Q = Chr(34) & s & Chr(34)
End Function

Function L(s As String) As String
    L = s & vbLf
End Function

Sub MkCylZ(nm As String, mat As String, r As String, z1 As String, z2 As String, xc As String, yc As String)
    Dim s As String
    s = L("With Cylinder") & L(".Reset") & L(".Name " & Q(nm)) & L(".Component " & Q(C)) & L(".Material " & Q(mat)) & _
        L(".OuterRadius " & Q(r)) & L(".InnerRadius ""0""") & L(".Axis ""z""") & _
        L(".Zrange " & Q(z1) & ", " & Q(z2)) & L(".Xcenter " & Q(xc)) & L(".Ycenter " & Q(yc)) & _
        L(".Segments ""0""") & L(".Create") & "End With"
    AddToHistory "define cylinder: " & C & ":" & nm, s
End Sub

Sub MkCylY(nm As String, mat As String, r As String, y1 As String, y2 As String, xc As String, zc As String)
    Dim s As String
    s = L("With Cylinder") & L(".Reset") & L(".Name " & Q(nm)) & L(".Component " & Q(C)) & L(".Material " & Q(mat)) & _
        L(".OuterRadius " & Q(r)) & L(".InnerRadius ""0""") & L(".Axis ""y""") & _
        L(".Yrange " & Q(y1) & ", " & Q(y2)) & L(".Xcenter " & Q(xc)) & L(".Zcenter " & Q(zc)) & _
        L(".Segments ""0""") & L(".Create") & "End With"
    AddToHistory "define cylinder: " & C & ":" & nm, s
End Sub

Sub MkECylZ(nm As String, mat As String, rx As String, ry As String, z1 As String, z2 As String, xc As String, yc As String)
    Dim s As String
    s = L("With ECylinder") & L(".Reset") & L(".Name " & Q(nm)) & L(".Component " & Q(C)) & L(".Material " & Q(mat)) & _
        L(".Xradius " & Q(rx)) & L(".Yradius " & Q(ry)) & L(".Axis ""z""") & _
        L(".Zrange " & Q(z1) & ", " & Q(z2)) & L(".Xcenter " & Q(xc)) & L(".Ycenter " & Q(yc)) & _
        L(".Segments ""0""") & L(".Create") & "End With"
    AddToHistory "define ecylinder: " & C & ":" & nm, s
End Sub

Sub MkSph(nm As String, mat As String, r As String, xc As String, yc As String, zc As String)
    Dim s As String
    s = L("With Sphere") & L(".Reset") & L(".Name " & Q(nm)) & L(".Component " & Q(C)) & L(".Material " & Q(mat)) & _
        L(".Axis ""z""") & L(".CenterRadius " & Q(r)) & L(".TopRadius ""0""") & L(".BottomRadius ""0""") & _
        L(".Center " & Q(xc) & ", " & Q(yc) & ", " & Q(zc)) & L(".Segments ""0""") & L(".Create") & "End With"
    AddToHistory "define sphere: " & C & ":" & nm, s
End Sub

Sub Ins(a As String, b As String)
    AddToHistory "boolean insert shapes: " & C & ":" & a & ", " & C & ":" & b, _
        "Solid.Insert " & Q(C & ":" & a) & ", " & Q(C & ":" & b)
End Sub

Sub Main
    StoreParameter "d_child", "50"         ' 문 바깥 면 ~ 얼굴(머리 구) 앞면 거리
    StoreParameter "yk", "d_child+85"      ' 몸 중심축 y (머리 반지름 85)

    ' ---------------- 머리 (중심 z=1040) ----------------
    MkSph "head_skin", "Skin", "85", "0", "yk", "1040"

    ' ---------------- 목 ----------------
    MkCylZ "neck_skin", "Skin", "35", "900", "975", "0", "yk"
    MkCylZ "neck_muscle", "Muscle", "33", "900", "975", "0", "yk"
    Ins "neck_skin", "neck_muscle"
    Ins "neck_skin", "head_skin"
    Ins "neck_muscle", "head_skin"

    MkSph "head_fat", "Fat", "83", "0", "yk", "1040"
    MkSph "head_bone", "Bone_cortical", "81", "0", "yk", "1040"
    MkSph "head_brain", "Brain_grey", "77", "0", "yk", "1040"
    Ins "head_skin", "head_fat"
    Ins "head_fat", "head_bone"
    Ins "head_bone", "head_brain"

    ' ---------------- 눈 (중심 x=+-28, z=1045, 머리 중심에서 앞으로 68 mm) ----------------
    Dim side As Variant, xs As String, tag As String
    For Each side In Array("R", "L")
        If side = "R" Then xs = "28" Else xs = "-28"
        tag = CStr(side)
        MkSph "eye_" & tag, "Eye_vitreous", "11", xs, "yk-68", "1045"
        Ins "head_skin", "eye_" & tag
        Ins "head_fat", "eye_" & tag
        Ins "head_bone", "eye_" & tag
        Ins "head_brain", "eye_" & tag
        ' 수정체: 지름 8 mm, 두께 3.5 mm, 눈 앞면에서 2.5 mm 안쪽
        MkCylY "lens_" & tag, "Eye_lens", "4", "yk-76.5", "yk-73", xs, "1045"
        Ins "eye_" & tag, "lens_" & tag
    Next side

    ' ---------------- 몸통 (z 560~900) ----------------
    MkECylZ "torso_skin", "Skin", "110", "75", "560", "900", "0", "yk"
    MkECylZ "torso_fat", "Fat", "108", "73", "560", "900", "0", "yk"
    MkECylZ "torso_muscle", "Muscle", "101", "66", "560", "900", "0", "yk"
    Ins "torso_skin", "torso_fat"
    Ins "torso_fat", "torso_muscle"

    ' ---------------- 팔 (x=+-140, z 530~890) ----------------
    For Each side In Array("R", "L")
        If side = "R" Then xs = "140" Else xs = "-140"
        tag = CStr(side)
        MkCylZ "arm_skin_" & tag, "Skin", "28", "530", "890", xs, "yk"
        MkCylZ "arm_muscle_" & tag, "Muscle", "26", "530", "890", xs, "yk"
        Ins "arm_skin_" & tag, "arm_muscle_" & tag
    Next side

    ' ---------------- 다리 (x=+-55, z 0~560) ----------------
    For Each side In Array("R", "L")
        If side = "R" Then xs = "55" Else xs = "-55"
        tag = CStr(side)
        MkCylZ "leg_skin_" & tag, "Skin", "45", "0", "560", xs, "yk"
        MkCylZ "leg_muscle_" & tag, "Muscle", "43", "0", "560", xs, "yk"
        Ins "leg_skin_" & tag, "leg_muscle_" & tag
    Next side
End Sub
