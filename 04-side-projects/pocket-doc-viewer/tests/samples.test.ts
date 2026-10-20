import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeText, detectType, UnsupportedError } from '../src/lib/detect'
import { parseHwpx, paraText, solveColumnWidths } from '../src/lib/hwpx'
import { parsePptx } from '../src/lib/pptx'

const sample = (name: string) => new Uint8Array(readFileSync(join(__dirname, '..', 'public', 'samples', name)))

describe('형식 판별', () => {
  it.each([
    ['sample.pdf', 'pdf', 'PDF'],
    ['sample.docx', 'word', 'DOCX'],
    ['sample.xlsx', 'sheet', 'XLSX'],
    ['sample.pptx', 'slide', 'PPTX'],
    ['sample.hwpx', 'hwpx', 'HWPX'],
    ['sample.csv', 'sheet', 'CSV'],
  ])('%s → %s', async (file, kind, label) => {
    expect(await detectType(file, sample(file))).toEqual({ kind, label })
  })

  it('확장자가 없어도 내용으로 판별한다 (안드로이드 공유 파일)', async () => {
    expect((await detectType('msf:1234', sample('sample.docx'))).kind).toBe('word')
    expect((await detectType('document', sample('sample.hwpx'))).kind).toBe('hwpx')
    expect((await detectType('', sample('sample.pdf'))).kind).toBe('pdf')
  })

  it('확장자가 틀려도 내용을 믿는다', async () => {
    expect((await detectType('report.pdf', sample('sample.pptx'))).kind).toBe('slide')
  })

  it('알 수 없는 바이너리는 지원하지 않는다고 알린다', async () => {
    const junk = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0x00])
    await expect(detectType('a.bin', junk)).rejects.toBeInstanceOf(UnsupportedError)
  })
})

describe('텍스트 인코딩', () => {
  it('UTF-8과 EUC-KR(CP949)을 모두 읽는다', () => {
    expect(decodeText(new TextEncoder().encode('지역,1분기'))).toBe('지역,1분기')
    // "한글" in EUC-KR
    expect(decodeText(new Uint8Array([0xc7, 0xd1, 0xb1, 0xdb]))).toBe('한글')
  })
})

describe('HWPX', () => {
  it('문단·표·쪽 설정을 읽는다', async () => {
    const doc = await parseHwpx(sample('sample.hwpx'))
    expect(doc.sections).toHaveLength(1)
    const sec = doc.sections[0]
    expect(sec.page.width).toBe(59528) // A4 210mm
    const paras = sec.pages.flat()
    const texts = paras.map(paraText).filter((t) => t.trim())
    expect(texts[0]).toBe('포켓 문서 뷰어 HWPX 샘플')
    const table = paras.flatMap((p) => p.items).find((i) => i.type === 'table')
    expect(table?.type).toBe('table')
    if (table?.type !== 'table') return
    expect(table.table.rowCount).toBe(4)
    expect(table.table.colCount).toBe(5)
    const cell = table.table.cells.find((c) => c.row === 1 && c.col === 0)
    expect(cell && paraText(cell.paras[0])).toBe('서울')
  })

  it('병합 셀이 있어도 열 너비를 구한다', () => {
    const widths = solveColumnWidths(
      [
        { col: 0, colSpan: 2, width: 3000 },
        { col: 0, colSpan: 1, width: 1000 },
        { col: 2, colSpan: 1, width: 500 },
      ],
      3,
      3500,
    )
    expect(widths).toEqual([1000, 2000, 500])
  })
})

describe('PPTX', () => {
  it('슬라이드 크기·도형·표·그림을 읽는다', async () => {
    const doc = await parsePptx(sample('sample.pptx'))
    expect(doc.width).toBe(12191695) // 13.333in
    expect(doc.slides).toHaveLength(4)

    const title = doc.slides[0].elements.find((e) => e.kind === 'shape' && e.text)
    expect(title?.kind === 'shape' && title.text?.paragraphs[0].runs[0].text).toBe('포켓 문서 뷰어')
    // 제목 글자 크기는 마스터의 titleStyle에서 상속된다 (기본 44pt)
    expect(title?.kind === 'shape' && title.text?.paragraphs[0].runs[0].sizePt).toBe(44)

    const body = doc.slides[1].elements.filter((e) => e.kind === 'shape' && e.text)
    const bullets = body.flatMap((e) => (e.kind === 'shape' ? (e.text?.paragraphs ?? []) : [])).filter((p) => p.bullet)
    expect(bullets.length).toBeGreaterThanOrEqual(5)

    const shapes = doc.slides[2].elements
    const rounded = shapes.filter((e) => e.kind === 'shape' && e.geom === 'roundRect')
    expect(rounded).toHaveLength(3)
    expect(rounded[0].kind === 'shape' && rounded[0].fill).toBe('#2f6fde')
    expect(shapes.some((e) => e.kind === 'image')).toBe(true)

    const table = doc.slides[3].elements.find((e) => e.kind === 'table')
    expect(table?.kind === 'table' && table.rows).toHaveLength(4)
  })
})
