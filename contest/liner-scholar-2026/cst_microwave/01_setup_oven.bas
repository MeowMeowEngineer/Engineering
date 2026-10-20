' ============================================================================
' 01_setup_oven.bas
' 전자레인지 누설 SAR 해석 - 1단계: 단위, 경계, 재질, 파라미터, 전자레인지 모델, 포트, 모니터
'
' 사용법: 새 CST MWS 프로젝트(빈 템플릿) > Macros > Run Macro > 이 파일
'         모든 명령은 AddToHistory로 기록되므로 History List에서 수정/재실행 가능
'
' 좌표계 (단위 mm):
'   x = 좌우 (문 중심 x=0), y = 앞뒤 (문 바깥 면 y=0, 오븐은 y<0, 사람은 y>0),
'   z = 높이 (바닥 z=0, 오븐 바닥 z=880 = 조리대 높이)
'
' 모델 개요:
'   - 오븐 본체 PEC, 내부 캐비티 330x220x330, 물 부하 275 g (IEC 60335-2-25 시험 부하) [확인 필요]
'   - 급전: 캐비티 오른쪽 벽의 WR-340 도파관 + 프로브(마그네트론 안테나 모사) + 이산 포트
'   - 문: 본체와 떨어진 PEC 판. 문 뒤 1 mm, 문 가장자리 1 mm 틈(g)으로 누설 경로를 만든다.
'     초크와 타공 메쉬는 모델링하지 않는다. 누설 크기는 보정(calibration)으로 맞추고,
'     이 모델은 "누설 분포의 모양"을 만드는 등가 누설원으로 쓴다.
'
' 주의: CST 버전에 따라 일부 명령 키워드가 다를 수 있다. 오류가 나면 해당 블록만 GUI로 만들어도 된다.
' ============================================================================

Option Explicit

Function Q(s As String) As String
    Q = Chr(34) & s & Chr(34)
End Function

Function L(s As String) As String
    L = s & vbLf
End Function

Sub MkMaterial(nm As String, eps As String, kap As String, rho As String, r As String, g As String, b As String)
    Dim s As String
    s = L("With Material") & L(".Reset") & L(".Name " & Q(nm)) & _
        L(".FrqType ""all""") & L(".Type ""Normal""") & _
        L(".Epsilon " & Q(eps)) & L(".Mu ""1""") & L(".Kappa " & Q(kap)) & _
        L(".Rho " & Q(rho)) & L(".Colour " & Q(r) & ", " & Q(g) & ", " & Q(b)) & _
        L(".Create") & "End With"
    AddToHistory "define material: " & nm, s
End Sub

Sub MkBrick(nm As String, comp As String, mat As String, x1 As String, x2 As String, y1 As String, y2 As String, z1 As String, z2 As String)
    Dim s As String
    s = L("With Brick") & L(".Reset") & L(".Name " & Q(nm)) & L(".Component " & Q(comp)) & L(".Material " & Q(mat)) & _
        L(".Xrange " & Q(x1) & ", " & Q(x2)) & L(".Yrange " & Q(y1) & ", " & Q(y2)) & L(".Zrange " & Q(z1) & ", " & Q(z2)) & _
        L(".Create") & "End With"
    AddToHistory "define brick: " & comp & ":" & nm, s
End Sub

Sub MkCylZ(nm As String, comp As String, mat As String, r As String, z1 As String, z2 As String, xc As String, yc As String)
    Dim s As String
    s = L("With Cylinder") & L(".Reset") & L(".Name " & Q(nm)) & L(".Component " & Q(comp)) & L(".Material " & Q(mat)) & _
        L(".OuterRadius " & Q(r)) & L(".InnerRadius ""0""") & L(".Axis ""z""") & _
        L(".Zrange " & Q(z1) & ", " & Q(z2)) & L(".Xcenter " & Q(xc)) & L(".Ycenter " & Q(yc)) & _
        L(".Segments ""0""") & L(".Create") & "End With"
    AddToHistory "define cylinder: " & comp & ":" & nm, s
End Sub

Sub Subt(a As String, b As String)
    AddToHistory "boolean subtract shapes: " & a & ", " & b, "Solid.Subtract " & Q(a) & ", " & Q(b)
End Sub

Sub Main
    ' ---------------- 단위, 주파수, 솔버, 경계 ----------------
    AddToHistory "define units", _
        L("With Units") & L(".Geometry ""mm""") & L(".Frequency ""GHz""") & L(".Time ""ns""") & "End With"
    AddToHistory "define frequency range", "Solver.FrequencyRange ""2.3"", ""2.6"""
    AddToHistory "change solver type", "ChangeSolverType ""HF Time Domain"""
    AddToHistory "define boundaries", _
        L("With Boundary") & _
        L(".Xmin ""expanded open""") & L(".Xmax ""expanded open""") & _
        L(".Ymin ""expanded open""") & L(".Ymax ""expanded open""") & _
        L(".Zmin ""expanded open""") & L(".Zmax ""expanded open""") & _
        L(".Xsymmetry ""none""") & L(".Ysymmetry ""none""") & L(".Zsymmetry ""none""") & _
        "End With"

    ' ---------------- 재질 (2.45 GHz 단일 주파수 값) ----------------
    ' 조직 물성: Gabriel 모델 / IT'IS DB 근사값. 논문에 쓰기 전 IT'IS DB 원값으로 교체 [확인 필요]
    ' 형식: 이름, 비유전율, 도전율(S/m), 밀도(kg/m^3), 색
    MkMaterial "Water_load", "77.5", "1.40", "1000", "0.3", "0.5", "1.0"
    MkMaterial "Skin", "38.0", "1.46", "1109", "0.95", "0.75", "0.6"
    MkMaterial "Fat", "5.28", "0.105", "911", "1.0", "1.0", "0.6"
    MkMaterial "Muscle", "52.7", "1.74", "1090", "0.8", "0.3", "0.3"
    MkMaterial "Bone_cortical", "11.4", "0.394", "1908", "0.95", "0.95", "0.9"
    MkMaterial "Brain_grey", "48.9", "1.81", "1045", "0.85", "0.6", "0.7"
    MkMaterial "Eye_vitreous", "68.2", "2.48", "1005", "0.4", "0.7", "0.9"
    MkMaterial "Eye_lens", "48.1", "1.53", "1076", "0.2", "0.3", "0.8"

    ' ---------------- 파라미터 ----------------
    StoreParameter "Wc", "330"          ' 캐비티 폭 (x)
    StoreParameter "Hc", "220"          ' 캐비티 높이 (z)
    StoreParameter "Dc", "330"          ' 캐비티 깊이 (y)
    StoreParameter "Zc", "1025"         ' 캐비티/문 중심 높이 (조리대 880 + 오븐 높이/2)
    StoreParameter "H_ov", "290"        ' 오븐 외형 높이
    StoreParameter "W_left", "50"       ' 캐비티 왼쪽 벽 두께
    StoreParameter "W_right", "150"     ' 캐비티 오른쪽 (조작부, 도파관 공간)
    StoreParameter "t_back", "29"       ' 뒷벽 두께
    StoreParameter "t_d", "20"          ' 문 두께
    StoreParameter "g", "1"             ' 문 틈 (문 뒤, 문 가장자리 공통)
    StoreParameter "ov", "25"           ' 문이 캐비티 개구부를 덮는 겹침 폭
    StoreParameter "a_wg", "86.36"      ' WR-340 넓은 변 (y)
    StoreParameter "b_wg", "43.18"      ' WR-340 좁은 변 (z)
    StoreParameter "L_wg", "110"        ' 도파관 길이 (캐비티 벽에서 단락면까지)
    StoreParameter "z_wg", "Zc+50"      ' 도파관 중심 높이
    StoreParameter "lg4", "43.4"        ' 2.45 GHz 관내파장/4 (단락면에서 프로브까지)
    StoreParameter "h_pr", "30"         ' 프로브 길이
    StoreParameter "r_pr", "2"          ' 프로브 반지름
    StoreParameter "y_cav", "-(t_d+g+Dc/2)"   ' 캐비티 중심 y

    ' ---------------- 오븐 본체 ----------------
    MkBrick "body", "oven", "PEC", "-Wc/2-W_left", "Wc/2+W_right", "-(t_d+g+Dc+t_back)", "0", "Zc-H_ov/2", "Zc+H_ov/2"

    ' 캐비티
    MkBrick "cavity", "oven", "Vacuum", "-Wc/2", "Wc/2", "-(t_d+g+Dc)", "-(t_d+g)", "Zc-Hc/2", "Zc+Hc/2"
    Subt "oven:body", "oven:cavity"

    ' 문이 들어갈 자리 (문보다 사방 g만큼 크고, 깊이 t_d+g)
    MkBrick "pocket", "oven", "Vacuum", "-Wc/2-ov-g", "Wc/2+ov+g", "-(t_d+g)", "0", "Zc-Hc/2-ov-g", "Zc+Hc/2+ov+g"
    Subt "oven:body", "oven:pocket"

    ' 도파관 통로 (캐비티 오른쪽 벽에서 +x 방향, 캐비티와 5 mm 겹쳐 연결)
    MkBrick "wg", "oven", "Vacuum", "Wc/2-5", "Wc/2+L_wg", "y_cav-a_wg/2", "y_cav+a_wg/2", "z_wg-b_wg/2", "z_wg+b_wg/2"
    Subt "oven:body", "oven:wg"

    ' 문 (본체와 접촉하지 않는 PEC 판 -> 문 뒤 g, 가장자리 g 틈이 누설 경로)
    MkBrick "door", "oven", "PEC", "-Wc/2-ov", "Wc/2+ov", "-t_d", "0", "Zc-Hc/2-ov", "Zc+Hc/2+ov"

    ' 급전 프로브 (도파관 윗벽에서 아래로, 단락면에서 lg4 떨어진 위치, 윗벽과 1 mm 간격)
    MkCylZ "probe", "oven", "PEC", "r_pr", "z_wg+b_wg/2-1-h_pr", "z_wg+b_wg/2-1", "Wc/2+L_wg-lg4", "y_cav"

    ' 물 부하 275 g (반지름 45, 높이 43 -> 약 274 mL), 캐비티 바닥 중앙
    MkCylZ "water", "oven", "Water_load", "45", "Zc-Hc/2", "Zc-Hc/2+43", "0", "y_cav"

    ' ---------------- 포트 ----------------
    ' 도파관 윗벽(z_wg+b_wg/2)과 프로브 윗면(z_wg+b_wg/2-1) 사이 이산 포트
    AddToHistory "define discrete port: 1", _
        L("With DiscretePort") & L(".Reset") & L(".PortNumber ""1""") & L(".Type ""SParameter""") & _
        L(".Label ""magnetron""") & L(".Impedance ""50""") & L(".VoltagePortImpedance ""0.0""") & _
        L(".Voltage ""1.0""") & L(".Current ""1.0""") & _
        L(".SetP1 ""False"", ""Wc/2+L_wg-lg4"", ""y_cav"", ""z_wg+b_wg/2""") & _
        L(".SetP2 ""False"", ""Wc/2+L_wg-lg4"", ""y_cav"", ""z_wg+b_wg/2-1""") & _
        L(".InvertDirection ""False""") & L(".LocalCoordinates ""False""") & L(".Monitor ""True""") & _
        L(".Radius ""0.0""") & L(".Wire """"") & L(".Position ""end1""") & _
        L(".Create") & "End With"

    ' ---------------- 모니터 (2.45 GHz) ----------------
    AddToHistory "define monitor: e-field (f=2.45)", _
        L("With Monitor") & L(".Reset") & L(".Name ""e-field (f=2.45)""") & L(".Dimension ""Volume""") & _
        L(".Domain ""Frequency""") & L(".FieldType ""Efield""") & L(".MonitorValue ""2.45""") & _
        L(".Create") & "End With"
    AddToHistory "define monitor: h-field (f=2.45)", _
        L("With Monitor") & L(".Reset") & L(".Name ""h-field (f=2.45)""") & L(".Dimension ""Volume""") & _
        L(".Domain ""Frequency""") & L(".FieldType ""Hfield""") & L(".MonitorValue ""2.45""") & _
        L(".Create") & "End With"
    AddToHistory "define monitor: loss (f=2.45)", _
        L("With Monitor") & L(".Reset") & L(".Name ""loss (f=2.45)""") & L(".Dimension ""Volume""") & _
        L(".Domain ""Frequency""") & L(".FieldType ""Powerloss""") & L(".MonitorValue ""2.45""") & _
        L(".Create") & "End With"

    ' 시간영역 정상상태 수렴 기준 (공진 캐비티라 -40 dB 권장)
    AddToHistory "define solver steady state", _
        L("With Solver") & L(".SteadyStateLimit ""-40""") & "End With"
End Sub
