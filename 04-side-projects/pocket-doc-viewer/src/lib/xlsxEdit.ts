// Excel(XLSX) 셀 수정. SheetJS로 다시 쓰면 무료판은 서식(글꼴·테두리·색)을 잃으므로,
// 원본 시트 XML의 해당 <c> 요소만 고쳐 나머지 서식·차트·다른 시트를 그대로 둔다.

import { all, attr, kid, kids } from './xml'
import { createLike, XML_NS, ZipDoc } from './zipdoc'

const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/

export type CellInput =
  | { kind: 'empty' }
  | { kind: 'number'; value: number }
  | { kind: 'formula'; formula: string }
  | { kind: 'text'; value: string }

/** 입력한 글자를 Excel처럼 해석한다: =로 시작하면 수식, 숫자 모양이면 숫자 */
export function parseCellInput(input: string): CellInput {
  if (input === '') return { kind: 'empty' }
  if (input.startsWith('=') && input.length > 1) return { kind: 'formula', formula: input.slice(1) }
  const t = input.trim()
  if (NUMBER.test(t)) return { kind: 'number', value: Number(t) }
  return { kind: 'text', value: input }
}

export function colIndex(letters: string): number {
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function splitAddr(addr: string): { col: number; row: number } {
  const m = /^([A-Z]+)(\d+)$/i.exec(addr)
  if (!m) throw new Error(`잘못된 셀 주소: ${addr}`)
  return { col: colIndex(m[1]), row: Number(m[2]) }
}

function relId(el: Element): string {
  for (const a of Array.from(el.attributes)) if (a.localName === 'id' && a.prefix) return a.value
  return ''
}

/** 통합 문서에서 calcPr이 와야 하는 자리 (이 요소들보다 앞) */
const AFTER_CALCPR = ['oleSize', 'customWorkbookViews', 'pivotCaches', 'smartTagPr', 'smartTagTypes', 'webPublishing', 'fileRecoveryPr', 'webPublishObjects', 'extLst']

export class XlsxEditor {
  readonly zip: ZipDoc
  private sheets = new Map<string, string>()
  private calcChainDropped = false

  private constructor(zip: ZipDoc) {
    this.zip = zip
  }

  static async load(data: ArrayBuffer | Uint8Array): Promise<XlsxEditor> {
    const ed = new XlsxEditor(await ZipDoc.load(data))
    const wb = await ed.zip.xml('xl/workbook.xml')
    const rels = await ed.zip.xml('xl/_rels/workbook.xml.rels')
    const targets = new Map<string, string>()
    for (const r of all(rels, 'Relationship')) {
      const t = attr(r, 'Target') ?? ''
      targets.set(attr(r, 'Id') ?? '', t.startsWith('/') ? t.slice(1) : 'xl/' + t)
    }
    for (const s of all(wb, 'sheet')) {
      const part = targets.get(relId(s))
      if (part) ed.sheets.set(attr(s, 'name') ?? '', part)
    }
    return ed
  }

  get dirty() {
    return this.zip.dirty
  }

  async setCell(sheetName: string, addr: string, input: CellInput): Promise<void> {
    const part = this.sheets.get(sheetName)
    if (!part) throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`)
    const doc = await this.zip.xml(part)
    const sheetData = all(doc, 'sheetData')[0]
    if (!sheetData) throw new Error('시트 데이터가 없습니다')
    const ref = addr.toUpperCase()
    const { col, row } = splitAddr(ref)

    // 행 찾기 (없으면 번호 순서에 맞춰 만든다)
    let rowEl = kids(sheetData, 'row').find((r) => Number(attr(r, 'r')) === row)
    if (!rowEl) {
      if (input.kind === 'empty') return
      rowEl = createLike(sheetData, 'row')
      rowEl.setAttribute('r', String(row))
      const next = kids(sheetData, 'row').find((r) => Number(attr(r, 'r')) > row) ?? null
      sheetData.insertBefore(rowEl, next)
    }
    // spans는 선택 속성이라 지워도 되고, 남겨 두면 범위를 벗어난 새 칸과 어긋날 수 있다
    rowEl.removeAttribute('spans')

    // 칸 찾기 (없으면 열 순서에 맞춰 만든다)
    let cell = kids(rowEl, 'c').find((c) => (attr(c, 'r') ?? '').toUpperCase() === ref)
    if (!cell) {
      if (input.kind === 'empty') return
      cell = createLike(rowEl, 'c')
      cell.setAttribute('r', ref)
      const next = kids(rowEl, 'c').find((c) => splitAddr(attr(c, 'r') ?? 'A1').col > col) ?? null
      rowEl.insertBefore(cell, next)
    }

    const hadFormula = !!kid(cell, 'f')
    // 같은 수식을 여러 칸이 나눠 쓰는(shared formula) 첫 칸이면 다른 칸이 깨지므로 막는다
    const f = kid(cell, 'f')
    if (f && attr(f, 't') === 'shared' && attr(f, 'ref')) {
      throw new Error('여러 칸이 함께 쓰는 수식의 시작 칸이라 이 앱에서는 고칠 수 없습니다. Excel에서 고쳐 주세요.')
    }
    for (const c of Array.from(cell.children)) {
      if (['f', 'v', 'is'].includes(c.localName)) c.remove()
    }
    cell.removeAttribute('t')

    switch (input.kind) {
      case 'number': {
        const v = createLike(cell, 'v')
        v.textContent = String(input.value)
        cell.appendChild(v)
        break
      }
      case 'text': {
        // 공유 문자열 표를 건드리지 않도록 셀 안에 직접 넣는다 (Excel이 열 때 정리한다)
        cell.setAttribute('t', 'inlineStr')
        const is = createLike(cell, 'is')
        const t = createLike(cell, 't')
        t.textContent = input.value
        if (/^\s|\s$|\n/.test(input.value)) t.setAttributeNS(XML_NS, 'xml:space', 'preserve')
        is.appendChild(t)
        cell.appendChild(is)
        break
      }
      case 'formula': {
        const fe = createLike(cell, 'f')
        fe.textContent = input.formula
        cell.appendChild(fe)
        break
      }
      case 'empty':
        break
    }
    this.zip.touch(part)
    if (hadFormula || input.kind === 'formula') await this.recalcOnOpen()
  }

  /**
   * 수식을 바꾸면 계산 순서표(calcChain)가 맞지 않게 되어 Excel이 '복구' 창을 띄운다.
   * 순서표를 지우고(Excel이 다시 만든다) 열 때 전체를 다시 계산하도록 표시한다.
   */
  private async recalcOnOpen() {
    if (this.calcChainDropped) return
    this.calcChainDropped = true
    if (this.zip.has('xl/calcChain.xml')) {
      this.zip.remove('xl/calcChain.xml')
      const rels = await this.zip.xml('xl/_rels/workbook.xml.rels')
      for (const r of all(rels, 'Relationship')) if (attr(r, 'Type')?.endsWith('/calcChain')) r.remove()
      this.zip.touch('xl/_rels/workbook.xml.rels')
      const types = await this.zip.xml('[Content_Types].xml')
      for (const o of all(types, 'Override')) if (attr(o, 'PartName') === '/xl/calcChain.xml') o.remove()
      this.zip.touch('[Content_Types].xml')
    }
    const wb = await this.zip.xml('xl/workbook.xml')
    const root = wb?.documentElement
    if (!root) return
    let calcPr = kid(root, 'calcPr')
    if (!calcPr) {
      const sheets = kid(root, 'sheets')
      calcPr = createLike(sheets ?? root, 'calcPr')
      const before = Array.from(root.children).find((c) => AFTER_CALCPR.includes(c.localName)) ?? null
      root.insertBefore(calcPr, before)
    }
    calcPr.setAttribute('fullCalcOnLoad', '1')
    this.zip.touch('xl/workbook.xml')
  }

  save(): Promise<Uint8Array> {
    return this.zip.save()
  }
}
