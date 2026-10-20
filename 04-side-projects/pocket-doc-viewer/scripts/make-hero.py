"""docs/screenshots/*.png 를 이어 붙여 README 이미지(docs/hero.png, docs/edit.png)를 만든다."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DOCS = Path(__file__).resolve().parent.parent / "docs"
SETS = {
    "hero.png": [("home", "첫 화면"), ("pdf", "PDF"), ("docx", "Word"), ("xlsx", "Excel"), ("pptx", "PowerPoint"), ("hwpx-form", "한글 HWPX (공공 서식)")],
    "edit.png": [("edit-hwpx-form", "한글 서식 빈칸 채우기"), ("edit-docx", "Word 글자 고치기"), ("edit-xlsx", "Excel 값·수식"), ("edit-pdf", "PDF 필기·회전"), ("save-sheet", "저장 (원래 형식 그대로)")],
}
FONTS = ["/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"]

W, PAD, TOP = 300, 24, 10
font = next((ImageFont.truetype(f, 22) for f in FONTS if Path(f).exists()), ImageFont.load_default())


def compose(out_name, shots):
    first = Image.open(DOCS / "screenshots" / f"{shots[0][0]}.png")
    H = int(first.height * W / first.width)
    out = Image.new("RGB", (PAD + len(shots) * (W + PAD), H + TOP + 60), (243, 244, 247))
    d = ImageDraw.Draw(out)
    for i, (name, label) in enumerate(shots):
        im = Image.open(DOCS / "screenshots" / f"{name}.png").convert("RGB").resize((W, H), Image.LANCZOS)
        x = PAD + i * (W + PAD)
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, H - 1], radius=26, fill=255)
        out.paste(im, (x, TOP + 8), mask)
        d.rounded_rectangle([x - 1, TOP + 7, x + W, TOP + 8 + H], radius=26, outline=(200, 204, 212), width=2)
        d.text((x + (W - d.textlength(label, font=font)) / 2, TOP + H + 20), label, fill=(60, 64, 76), font=font)
    out.save(DOCS / out_name, optimize=True)
    print(out_name, "saved")


for name, shots in SETS.items():
    if all((DOCS / "screenshots" / f"{n}.png").exists() for n, _ in shots):
        compose(name, shots)
