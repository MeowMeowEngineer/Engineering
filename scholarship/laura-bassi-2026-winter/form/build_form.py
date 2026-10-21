"""Fill the Winter 2026 Laura Bassi form from ../application_form.md.

The Spring 2026 form (template_spring2026.pdf) is the base. Its two essay boxes, the round
checkbox and the date are covered and redrawn; name, e-mail, institution and degree stay as
submitted in spring. --department replaces the department cell.

Run: python3 build_form.py [--version A|B] [--date 2026.11.10] [--department "..."]
Writes ep_bassi_scholarship_form_winter2026.pdf, or ..._DRAFT.pdf while any [CONFIRM: ...]
placeholder is left (placeholders are highlighted yellow).
"""
import argparse
import datetime
import re
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import black, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE / "template_spring2026.pdf"
ANSWERS = HERE.parent / "application_form.md"
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"

# boxes as (x0, y0, x1, y1) in points from the top-left corner, measured on the spring form
ESSAY_BOX = {0: (36.5, 363.0, 555.5, 721.0), 1: (36.5, 98.5, 555.5, 430.0)}
DEPT_BOX = (210.0, 270.5, 384.0, 296.5)
SPRING_BOX = (101.5, 471.0, 119.0, 488.5)
WINTER_BOX = (101.5, 535.5, 119.0, 553.0)
DATE_AREA = (386.0, 599.0, 497.0, 618.0)
DATE_BASELINE = 615.0
PAD = 4.0
PLACEHOLDER = re.compile(r"\[CONFIRM:[^\]]*\]")


def essays(version):
    text = ANSWERS.read_text(encoding="utf-8")
    out = []
    for n in (1, 2):
        m = re.search(rf"^### {version}{n}\.[^\n]*\n(.*?)(?=^### |^---|\Z)", text, re.M | re.S)
        out.append([p.strip().replace("`", "") for p in m.group(1).split("\n\n") if p.strip()])
    return out


def smart_quotes(s):
    s = re.sub(r'"(?=\w)', "\u201c", s)
    s = s.replace('"', "\u201d")
    return re.sub(r"(?<=\w)'", "\u2019", s)


def markup(par):
    """Escape a paragraph, curl its quotes and highlight its placeholders."""
    par = smart_quotes(par)
    pieces, last = [], 0
    for m in PLACEHOLDER.finditer(par):
        pieces.append(escape(par[last:m.start()]))
        pieces.append(f'<font backColor="#fff176">{escape(m.group(0))}</font>')
        last = m.end()
    pieces.append(escape(par[last:]))
    return "".join(pieces)


def style(size):
    return ParagraphStyle("essay", fontName="Serif", fontSize=size, leading=size * 1.25,
                          spaceAfter=size * 0.6)


def layout(paras, size, width):
    st = style(size)
    flow = [Paragraph(markup(p), st) for p in paras]
    heights = [f.wrap(width, 10_000)[1] for f in flow]
    return flow, sum(heights) + st.spaceAfter * (len(flow) - 1)


def fit_size(blocks):
    """Largest common font size (12 pt down) at which every essay fits its box."""
    size = 12.0
    while size > 8:
        if all(layout(paras, size, x1 - x0 - 2 * PAD)[1] <= y1 - y0 - 2 * PAD
               for paras, (x0, y0, x1, y1) in blocks):
            return size
        size -= 0.25
    raise SystemExit("essays do not fit the boxes even at 8 pt")


def cover(c, H, box, inset=1.0):
    x0, y0, x1, y1 = box
    c.setFillColor(white)
    c.rect(x0 + inset, H - y1 + inset, x1 - x0 - 2 * inset, y1 - y0 - 2 * inset, stroke=0, fill=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default="A", choices=["A", "B"])
    ap.add_argument("--date", default=datetime.date.today().strftime("%Y.%m.%d"))
    ap.add_argument("--department")
    args = ap.parse_args()

    pdfmetrics.registerFont(TTFont("Serif", SERIF))
    template = PdfReader(TEMPLATE)
    W = float(template.pages[0].mediabox.width)
    H = float(template.pages[0].mediabox.height)
    texts = essays(args.version)
    size = fit_size([(texts[i], ESSAY_BOX[i]) for i in (0, 1)])

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(W, H))
    for page in (0, 1):
        x0, y0, x1, y1 = ESSAY_BOX[page]
        cover(c, H, ESSAY_BOX[page])
        flow, _ = layout(texts[page], size, x1 - x0 - 2 * PAD)
        y = H - y0 - PAD
        for f in flow:
            _, h = f.wrap(x1 - x0 - 2 * PAD, 10_000)
            f.drawOn(c, x0 + PAD, y - h)
            y -= h + style(size).spaceAfter
        if page == 0 and args.department:
            cover(c, H, DEPT_BOX)
            dsize = 13.0
            while pdfmetrics.stringWidth(args.department, "Serif", dsize) > DEPT_BOX[2] - DEPT_BOX[0] - 2 * PAD:
                dsize -= 0.5
            c.setFillColor(black)
            c.setFont("Serif", dsize)
            c.drawString(DEPT_BOX[0] + PAD, H - 289.5, args.department)
        if page == 1:
            # move the check from Spring to Winter and redraw the spring box border
            c.setFillColor(white)
            c.rect(SPRING_BOX[0] - 2, H - SPRING_BOX[3] - 1.5, 21.5, 21, stroke=0, fill=1)
            c.setStrokeColor(black)
            c.setLineWidth(1.2)
            bx0, by0, bx1, by1 = SPRING_BOX
            c.rect(bx0 + 0.6, H - by1 + 0.6, bx1 - bx0 - 1.2, by1 - by0 - 1.2, stroke=1, fill=0)
            wx0, wy0, wx1, wy1 = WINTER_BOX
            c.setLineWidth(2.2)
            c.setLineCap(1)
            c.setLineJoin(1)
            tick = c.beginPath()
            tick.moveTo(wx0 + 3.8, H - (wy0 + wy1) / 2)
            tick.lineTo(wx0 + 7.3, H - wy1 + 4.0)
            tick.lineTo(wx1 - 3.3, H - wy0 - 3.3)
            c.drawPath(tick, stroke=1, fill=0)
            # date
            cover(c, H, DATE_AREA, inset=0)
            c.setFillColor(black)
            c.setFont("Serif", 19.5)
            c.drawString(DATE_AREA[0] + 1.5, H - DATE_BASELINE, args.date)
        c.showPage()
    c.save()

    overlay = PdfReader(BytesIO(buf.getvalue()))
    writer = PdfWriter()
    for page, layer in zip(template.pages, overlay.pages):
        page.merge_page(layer)
        writer.add_page(page)
    draft = any(PLACEHOLDER.search(p) for paras in texts for p in paras)
    out = HERE / f"ep_bassi_scholarship_form_winter2026{'_DRAFT' if draft else ''}.pdf"
    with open(out, "wb") as fh:
        writer.write(fh)
    print(f"{out.name}: version {args.version}, essay font {size} pt, date {args.date}"
          + (", placeholders left" if draft else ""))


if __name__ == "__main__":
    main()
