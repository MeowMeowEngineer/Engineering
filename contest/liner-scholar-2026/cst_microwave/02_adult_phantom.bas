' ============================================================================
' 02_adult_phantom.bas
' 성인 단순화 인체 모형 (키 약 1.72 m), 전자레인지 정면에 서 있는 자세
'
' 사용법: 01_setup_oven.bas 실행한 프로젝트에서 Macros > Run Macro > 이 파일
'         거리는 파라미터 d_adult (문 바깥 면 ~ 몸통 앞면, mm)로 바꾼다: 300 / 500 / 1000
'
' 구성 (모두 component "adult"):
'   몸통: 타원기둥 3층 (피부 2 mm / 지방 10 mm / 근육)
'   머리: 구 4층 (피부 2 / 지방 3 / 뼈 6 / 뇌), 눈 2개 (유리체 구 + 수정체 원기둥)
'   목, 팔, 다리: 피부 2 mm + 근육 원기둥
'   바닥, 조리대, 옷은 모델링하지 않는다.
'
' 치수 근거: 성인 남성 평균 체형을 단순화한 값. 전신 평균 SAR을 쓰려면 모형 질량을 기록할 것.
' ============================================================================

Option Explicit

Const C As String = "adult"

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

' Ins(a, b): b를 a 안에 끼워 넣는다 (a에서 b와 겹치는 부분 제거, b는 유지)
Sub Ins(a As String, b As String)
    AddToHistory "boolean insert shapes: " & C & ":" & a & ", " & C & ":" & b, _
        "Solid.Insert " & Q(C & ":" & a) & ", " & Q(C & ":" & b)
End Sub

Sub Main
    StoreParameter "d_adult", "500"        ' 문 바깥 면 ~ 몸통 앞면 거리
    StoreParameter "ya", "d_adult+110"     ' 몸 중심축 y (몸통 앞뒤 반지름 110)

    ' ---------------- 머리 (중심 z=1620) ----------------
    ' 1) 피부 구를 먼저 꽉 찬 구로 만들고, 목을 그 구에 맞춰 잘라낸 뒤 층을 만든다
    MkSph "head_skin", "Skin", "95", "0", "ya", "1620"

    ' ---------------- 목 (머리 구 안까지 올라오게 만든 뒤 잘라냄) ----------------
    MkCylZ "neck_skin", "Skin", "55", "1450", "1560", "0", "ya"
    MkCylZ "neck_muscle", "Muscle", "53", "1450", "1560", "0", "ya"
    Ins "neck_skin", "neck_muscle"
    Ins "neck_skin", "head_skin"
    Ins "neck_muscle", "head_skin"

    ' 머리 층 구조
    MkSph "head_fat", "Fat", "93", "0", "ya", "1620"
    MkSph "head_bone", "Bone_cortical", "90", "0", "ya", "1620"
    MkSph "head_brain", "Brain_grey", "84", "0", "ya", "1620"
    Ins "head_skin", "head_fat"
    Ins "head_fat", "head_bone"
    Ins "head_bone", "head_brain"

    ' ---------------- 눈 (중심 x=+-32, z=1630, 머리 중심에서 앞으로 77 mm) ----------------
    Dim side As Variant, xs As String, tag As String
    For Each side In Array("R", "L")
        If side = "R" Then xs = "32" Else xs = "-32"
        tag = CStr(side)
        MkSph "eye_" & tag, "Eye_vitreous", "12", xs, "ya-77", "1630"
        Ins "head_skin", "eye_" & tag
        Ins "head_fat", "eye_" & tag
        Ins "head_bone", "eye_" & tag
        Ins "head_brain", "eye_" & tag
        ' 수정체: 지름 9 mm, 두께 4 mm, 눈 앞면에서 3 mm 안쪽
        MkCylY "lens_" & tag, "Eye_lens", "4.5", "ya-86", "ya-82", xs, "1630"
        Ins "eye_" & tag, "lens_" & tag
    Next side

    ' ---------------- 몸통 (z 850~1450) ----------------
    MkECylZ "torso_skin", "Skin", "170", "110", "850", "1450", "0", "ya"
    MkECylZ "torso_fat", "Fat", "168", "108", "850", "1450", "0", "ya"
    MkECylZ "torso_muscle", "Muscle", "158", "98", "850", "1450", "0", "ya"
    Ins "torso_skin", "torso_fat"
    Ins "torso_fat", "torso_muscle"

    ' ---------------- 팔 (x=+-212, z 800~1430) ----------------
    For Each side In Array("R", "L")
        If side = "R" Then xs = "212" Else xs = "-212"
        tag = CStr(side)
        MkCylZ "arm_skin_" & tag, "Skin", "40", "800", "1430", xs, "ya"
        MkCylZ "arm_muscle_" & tag, "Muscle", "38", "800", "1430", xs, "ya"
        Ins "arm_skin_" & tag, "arm_muscle_" & tag
    Next side

    ' ---------------- 다리 (x=+-90, z 0~850) ----------------
    For Each side In Array("R", "L")
        If side = "R" Then xs = "90" Else xs = "-90"
        tag = CStr(side)
        MkCylZ "leg_skin_" & tag, "Skin", "65", "0", "850", xs, "ya"
        MkCylZ "leg_muscle_" & tag, "Muscle", "63", "0", "850", xs, "ya"
        Ins "leg_skin_" & tag, "leg_muscle_" & tag
    Next side
End Sub
