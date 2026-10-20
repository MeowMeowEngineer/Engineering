// 편집 후 저장한 파일이 원래 형식 그대로 다시 열리는지(왕복) 확인한다.
// EDIT_OUT 환경 변수를 주면 저장본을 그 폴더에 남겨 Word·Excel 호환 검사(LibreOffice, python 라이브러리)에 쓴다.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { parseDocx, type DocxPara } from '../src/lib/docx'
import { parseHwpx, paraText } from '../src/lib/hwpx'
import { parsePptx } from '../src/lib/pptx'
import { applyPdfEdits, emptyEdits } from '../src/lib/pdfEdit'
import { parseCellInput, XlsxEditor } from '../src/lib/xlsxEdit'

const sample = (name: string) => new Uint8Array(readFileSync(join(__dirname, '..', 'public', 'samples', name)))
const OUT = process.env.EDIT_OUT
const keep = (name: string, bytes: Uint8Array) => {
  if (!OUT) return
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, name), bytes)
}

describe('HWPX 편집', () => {
  it('글자를 고치고 빈 칸을 채워 저장하면 다시 열린다', async () => {
    const doc = await parseHwpx(sample('sample.hwpx'))
    const paras = doc.sections[0].pages.flat()
    const title = paras.flatMap((p) => p.items).find((i) => i.type === 'text' && i.text.includes('HWPX 샘플'))
    expect(title?.type === 'text' && title.slot).toBeTruthy()
    if (title?.type === 'text') title.slot!.set('수정한 제목입니다')
    // 표의 빈 칸이 아니라 '서울' 칸을 고치고, 빈 문단에 글자를 넣는다
    const table = paras.flatMap((p) => p.items).find((i) => i.type === 'table')
    if (table?.type !== 'table') throw new Error('표 없음')
    const seoul = table.table.cells.find((c) => c.row === 1 && c.col === 0)!.paras[0].items[0]
    if (seoul.type === 'text') seoul.slot!.set('서울특별시')
    const empty = paras.find((p) => p.items.length === 1 && p.items[0].type === 'text' && p.items[0].text === '' && p.items[0].slot)
    expect(empty).toBeTruthy()
    const emptyItem = empty!.items[0]
    if (emptyItem.type === 'text') emptyItem.slot!.set('빈 문단에 새로 쓴 글')
    expect(doc.zip.dirty).toBe(true)

    const saved = await doc.zip.save()
    keep('edited.hwpx', saved)

    // mimetype은 첫 항목이고 압축하지 않는다
    expect(new TextDecoder().decode(saved.slice(30, 38))).toBe('mimetype')
    expect(saved[8] | (saved[9] << 8)).toBe(0) // 압축 방식 0 = STORE

    const again = await parseHwpx(saved)
    const texts = again.sections[0].pages.flat().map(paraText)
    expect(texts).toContain('수정한 제목입니다')
    expect(texts).toContain('빈 문단에 새로 쓴 글')
    expect(texts.join('\n')).toContain('서울특별시')
    // 고친 문단의 줄 배치 정보는 지워 한글이 다시 계산하게 한다
    const xml = await (await JSZip.loadAsync(saved)).file('Contents/section0.xml')!.async('string')
    const p = xml.slice(xml.lastIndexOf('<hp:p ', xml.indexOf('수정한 제목입니다')), xml.indexOf('</hp:p>', xml.indexOf('수정한 제목입니다')))
    expect(p).not.toContain('linesegarray')
  })
})

describe('PPTX 편집', () => {
  it('제목과 표 글자를 고쳐 저장하면 다시 열린다', async () => {
    const doc = await parsePptx(sample('sample.pptx'))
    const runs = doc.slides.flatMap((s) => s.elements).flatMap((e) =>
      e.kind === 'shape' ? (e.text?.paragraphs ?? []).flatMap((p) => p.runs) : e.kind === 'table' ? e.rows.flatMap((r) => r.cells.flatMap((c) => c.text.paragraphs.flatMap((p) => p.runs))) : [],
    )
    runs.find((r) => r.text === '포켓 문서 뷰어')!.slot!.set('바뀐 발표 제목')
    runs.find((r) => r.text === '대구')!.slot!.set('광주')
    const saved = await doc.zip.save()
    keep('edited.pptx', saved)
    const again = await parsePptx(saved)
    const all = JSON.stringify(again.slides.map((s) => s.elements))
    expect(all).toContain('바뀐 발표 제목')
    expect(all).toContain('광주')
    expect(all).not.toContain('"대구"')
  })
})

describe('DOCX 편집', () => {
  it('글자 조각과 표 칸을 고쳐 저장하면 서식이 남는다', async () => {
    const doc = await parseDocx(sample('sample.docx'))
    const paras = doc.blocks.filter((b): b is DocxPara => b.kind === 'p')
    const bold = paras.flatMap((p) => p.runs).find((r) => r.text === 'Word(.docx)')!
    expect(bold.bold).toBe(true)
    bold.slot!.set('워드 문서')
    const table = doc.blocks.find((b) => b.kind === 'table')
    if (table?.kind !== 'table') throw new Error('표 없음')
    const cell = table.rows[1][0].blocks[0]
    if (cell.kind === 'p') cell.runs[0].slot!.set(' 서울 ')
    const saved = await doc.zip.save()
    keep('edited.docx', saved)
    const xml = await (await JSZip.loadAsync(saved)).file('word/document.xml')!.async('string')
    // 굵게 서식이 붙은 같은 run 안에 고친 글자가 들어 있어야 한다
    expect(xml).toMatch(/<w:b\/><\/w:rPr><w:t>워드 문서<\/w:t>/)
    expect(xml).toContain('xml:space="preserve"> 서울 </w:t>')
    const again = await parseDocx(saved)
    expect(JSON.stringify(again.blocks)).toContain('워드 문서')
  })
})

describe('XLSX 편집', () => {
  it('숫자·글자·수식을 넣고 저장하면 서식과 다른 시트가 남는다', async () => {
    const ed = await XlsxEditor.load(sample('sample.xlsx'))
    await ed.setCell('매출', 'B4', parseCellInput('999'))
    await ed.setCell('매출', 'A4', parseCellInput('서울(수정)'))
    await ed.setCell('매출', 'H10', parseCellInput('새 칸'))
    await ed.setCell('매출', 'F4', parseCellInput('=SUM(B4:E4)'))
    await ed.setCell('직원', 'A2', parseCellInput(''))
    const saved = await ed.save()
    keep('edited.xlsx', saved)
    const zip = await JSZip.loadAsync(saved)
    const sheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string')
    expect(sheet).toMatch(/<c r="B4"[^>]*><v>999<\/v><\/c>/)
    expect(sheet).toContain('<c r="F4"')
    expect(sheet).toContain('<f>SUM(B4:E4)</f>')
    expect(sheet).toMatch(/<c r="H10" t="inlineStr"><is><t>새 칸<\/t><\/is><\/c>/)
    // 머리글 칸의 서식(s=)은 그대로
    const header = /<c r="A3" s="(\d+)"/.exec(sheet)
    expect(header).toBeTruthy()
    const wb = await zip.file('xl/workbook.xml')!.async('string')
    expect(wb).toContain('fullCalcOnLoad="1"')
  })
})

describe('저장 형식', () => {
  it('브라우저가 XML 선언을 붙여도 선언은 한 번만 들어간다', async () => {
    // 크롬의 XMLSerializer는 선언을 붙이고 jsdom은 붙이지 않는다. 크롬처럼 흉내 낸다
    const original = XMLSerializer.prototype.serializeToString
    XMLSerializer.prototype.serializeToString = function (node: Node) {
      return '<?xml version="1.0" standalone="yes"?>' + original.call(this, node)
    }
    try {
      const doc = await parseHwpx(sample('sample.hwpx'))
      const t = doc.sections[0].pages.flat().flatMap((p) => p.items).find((i) => i.type === 'text' && i.slot && i.text)
      if (t?.type === 'text') t.slot!.set('선언 검사')
      const saved = await doc.zip.save()
      const xml = await (await JSZip.loadAsync(saved)).file('Contents/section0.xml')!.async('string')
      expect(xml.match(/<\?xml/g)).toHaveLength(1)
      expect(xml.startsWith('<?xml')).toBe(true)
    } finally {
      XMLSerializer.prototype.serializeToString = original
    }
  })
})

describe('PDF 편집', () => {
  it('필기·회전·쪽 삭제를 저장한다', async () => {
    const edits = emptyEdits()
    edits.marks.set(0, [{ kind: 'ink', points: [[100, 700], [200, 650], [300, 700]], color: '#d93a3a', width: 2, opacity: 1 }])
    edits.rotate.set(1, 90)
    edits.remove.add(2)
    const saved = await applyPdfEdits(sample('sample.pdf'), edits)
    keep('edited.pdf', saved)
    const pdf = await PDFDocument.load(saved)
    expect(pdf.getPageCount()).toBe(2)
    expect(pdf.getPage(1).getRotation().angle).toBe(90)
  })
})
