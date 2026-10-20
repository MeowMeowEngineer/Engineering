// Word(DOCX) 편집용 해석기.
// 보기 화면은 docx-preview가 그리고, 편집 화면은 이 해석기가 만든 모델로 그린다.
// 글자 조각마다 원본 XML의 w:t 위치를 기억해 두었다가, 고친 글자만 그 자리에 되돌려 놓는다.

import { all, attr, first, kid, kids, num, path } from './xml'
import { createLike, XML_NS, ZipDoc, type TextSlot } from './zipdoc'

const PART = 'word/document.xml'

export interface DocxRun {
  text: string
  slot?: TextSlot
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  sizePt?: number
  color?: string
  highlight?: string
  tab?: boolean
  br?: boolean
  image?: { src: string; width: number; height: number }
}

export interface DocxPara {
  kind: 'p'
  align: 'left' | 'center' | 'right' | 'justify'
  runs: DocxRun[]
  sizePt: number
  bullet?: string
  /** 들여쓰기·간격 (twip, 1/1440 inch) */
  left: number
  firstLine: number
  before: number
  after: number
}

export interface DocxCell {
  blocks: DocxBlock[]
  span: number
  rowSpan: number
  width?: number
  shade?: string
}

export interface DocxTable {
  kind: 'table'
  colWidths: number[]
  rows: DocxCell[][]
}

export type DocxBlock = DocxPara | DocxTable

export interface DocxDocument {
  blocks: DocxBlock[]
  pageWidth: number
  margins: { top: number; right: number; bottom: number; left: number }
  objectUrls: string[]
  zip: ZipDoc
}

interface RunProps {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  sizePt?: number
  color?: string
  highlight?: string
}

interface StyleDef {
  basedOn?: string
  rPr?: Element | null
  pPr?: Element | null
}

const HIGHLIGHT: Record<string, string> = {
  yellow: '#ffff00',
  green: '#00ff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  red: '#ff0000',
  blue: '#0000ff',
  lightGray: '#d3d3d3',
  darkGray: '#a9a9a9',
}

function onOff(el: Element | null): boolean | undefined {
  if (!el) return undefined
  const v = attr(el, 'val')
  return v === null || !['0', 'false', 'off'].includes(v)
}

function readRunProps(rPr: Element | null | undefined, into: RunProps) {
  if (!rPr) return
  const b = onOff(kid(rPr, 'b'))
  if (b !== undefined) into.bold = b
  const i = onOff(kid(rPr, 'i'))
  if (i !== undefined) into.italic = i
  const u = kid(rPr, 'u')
  if (u) into.underline = attr(u, 'val') !== 'none'
  const s = onOff(kid(rPr, 'strike'))
  if (s !== undefined) into.strike = s
  const sz = num(kid(rPr, 'sz'), 'val')
  if (sz) into.sizePt = sz / 2
  const color = attr(kid(rPr, 'color'), 'val')
  if (color && /^[0-9a-f]{6}$/i.test(color)) into.color = '#' + color
  const hl = attr(kid(rPr, 'highlight'), 'val')
  if (hl && HIGHLIGHT[hl]) into.highlight = HIGHLIGHT[hl]
}

class Ctx {
  styles = new Map<string, StyleDef>()
  defaultRPr: Element | null = null
  defaultPPr: Element | null = null
  defaultParaStyle?: string
  images = new Map<string, string>()
  objectUrls: string[] = []
  zip: ZipDoc
  constructor(zip: ZipDoc) {
    this.zip = zip
  }

  /** 스타일의 basedOn 사슬을 따라 위(기본)부터 차례로 적용한다 */
  styleChain(id: string | undefined): StyleDef[] {
    const out: StyleDef[] = []
    const seen = new Set<string>()
    while (id && !seen.has(id)) {
      seen.add(id)
      const s = this.styles.get(id)
      if (!s) break
      out.unshift(s)
      id = s.basedOn
    }
    return out
  }

  /** 글자 모양 해석 순서: 문서 기본값 → 문단 스타일 → 글자 스타일 → 직접 서식 */
  runProps(pStyle: string | undefined, rPr: Element | null): RunProps {
    const p: RunProps = {}
    readRunProps(this.defaultRPr, p)
    for (const s of this.styleChain(pStyle ?? this.defaultParaStyle)) readRunProps(s.rPr, p)
    for (const s of this.styleChain(attr(kid(rPr, 'rStyle'), 'val') ?? undefined)) readRunProps(s.rPr, p)
    readRunProps(rPr, p)
    return p
  }

  /** 문단 속성 하나를 직접 서식 → 스타일 → 문서 기본값 순으로 찾는다 */
  paraProp<T>(pPr: Element | null, get: (pPr: Element) => T | undefined): T | undefined {
    const own = pPr ? get(pPr) : undefined
    if (own !== undefined) return own
    const chain = this.styleChain(attr(kid(pPr, 'pStyle'), 'val') ?? this.defaultParaStyle)
    for (let i = chain.length - 1; i >= 0; i--) {
      const v = chain[i].pPr ? get(chain[i].pPr!) : undefined
      if (v !== undefined) return v
    }
    return this.defaultPPr ? get(this.defaultPPr) : undefined
  }
}

function textSlot(t: Element, ctx: Ctx): TextSlot {
  return {
    get: () => t.textContent ?? '',
    set(v) {
      if (v === t.textContent) return
      t.textContent = v
      // 앞뒤 공백이 사라지지 않도록
      if (/^\s|\s$/.test(v)) t.setAttributeNS(XML_NS, 'xml:space', 'preserve')
      ctx.zip.touch(PART)
    },
  }
}

/** 빈 문단에 w:r/w:t를 새로 만들어 글자를 넣는 손잡이. 문단 표시용 글자 모양(pPr/rPr)을 이어받는다 */
function emptyParaSlot(p: Element, ctx: Ctx): TextSlot {
  let t: Element | null = null
  return {
    get: () => t?.textContent ?? '',
    set(v) {
      if (!t) {
        if (!v) return
        const r = createLike(p, 'r')
        const markRPr = path(p, 'pPr', 'rPr')
        if (markRPr) {
          const rPr = createLike(p, 'rPr')
          for (const c of Array.from(markRPr.children)) {
            // 변경 추적 표시는 옮기지 않는다
            if (!['ins', 'del', 'moveFrom', 'moveTo', 'rPrChange'].includes(c.localName)) rPr.appendChild(c.cloneNode(true))
          }
          r.appendChild(rPr)
        }
        t = createLike(p, 't')
        t.setAttributeNS(XML_NS, 'xml:space', 'preserve')
        r.appendChild(t)
        p.appendChild(r)
      }
      t.textContent = v
      ctx.zip.touch(PART)
    },
  }
}

/** w:hyperlink, w:ins, w:sdt 같은 감싸는 요소 안까지 내려가 w:r을 모은다 */
function collectRuns(el: Element, out: Element[]) {
  for (const c of Array.from(el.children)) {
    switch (c.localName) {
      case 'r':
        out.push(c)
        break
      case 'hyperlink':
      case 'ins':
      case 'sdt':
      case 'sdtContent':
      case 'smartTag':
      case 'fldSimple':
      case 'customXml':
        collectRuns(c, out)
        break
    }
  }
}

function parsePara(p: Element, ctx: Ctx): DocxPara {
  const pPr = kid(p, 'pPr')
  const pStyle = attr(kid(pPr, 'pStyle'), 'val') ?? undefined
  const jc = ctx.paraProp(pPr, (e) => attr(kid(e, 'jc'), 'val') ?? undefined)
  const ind = (name: string) => ctx.paraProp(pPr, (e) => num(kid(e, 'ind'), name))
  const spacing = (name: string) => ctx.paraProp(pPr, (e) => num(kid(e, 'spacing'), name))
  const numbered = ctx.paraProp(pPr, (e) => (kid(e, 'numPr') ? true : undefined))

  const runEls: Element[] = []
  collectRuns(p, runEls)
  const runs: DocxRun[] = []
  for (const r of runEls) {
    const rPr = kid(r, 'rPr')
    const props = ctx.runProps(pStyle, rPr)
    for (const c of Array.from(r.children)) {
      switch (c.localName) {
        case 't':
          runs.push({ ...props, text: c.textContent ?? '', slot: textSlot(c, ctx) })
          break
        case 'tab':
          runs.push({ ...props, text: '', tab: true })
          break
        case 'br':
        case 'cr':
          if (attr(c, 'type') !== 'page') runs.push({ ...props, text: '', br: true })
          break
        case 'noBreakHyphen':
          runs.push({ ...props, text: '-' })
          break
        case 'drawing': {
          const blip = all(c, 'blip')[0]
          const id = attr(blip, 'embed')
          const ext = all(c, 'extent')[0]
          const src = id ? ctx.images.get(id) : undefined
          if (src) runs.push({ text: '', image: { src, width: num(ext, 'cx', 0) / 9525, height: num(ext, 'cy', 0) / 9525 } })
          break
        }
      }
    }
  }

  const base = ctx.runProps(pStyle, path(p, 'pPr', 'rPr'))
  if (!runs.some((r) => r.slot || r.image)) runs.push({ ...base, text: '', slot: emptyParaSlot(p, ctx) })

  const firstLine = ind('firstLine') ?? (ind('hanging') !== undefined ? -ind('hanging')! : 0)
  return {
    kind: 'p',
    align: jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : jc === 'both' || jc === 'distribute' ? 'justify' : 'left',
    runs,
    sizePt: base.sizePt ?? 11,
    bullet: numbered ? '•' : undefined,
    left: ind('left') ?? ind('start') ?? 0,
    firstLine,
    before: spacing('before') ?? 0,
    after: spacing('after') ?? 0,
  }
}

function parseTable(tbl: Element, ctx: Ctx): DocxTable {
  const colWidths = kids(kid(tbl, 'tblGrid'), 'gridCol').map((g) => num(g, 'w', 0))
  const rows: DocxCell[][] = []
  // 세로 병합(vMerge)은 시작 칸의 rowSpan을 늘리고 이어지는 칸은 그리지 않는다
  const openMerge = new Map<number, DocxCell>()
  for (const tr of kids(tbl, 'tr')) {
    const row: DocxCell[] = []
    let col = 0
    for (const tc of kids(tr, 'tc')) {
      const tcPr = kid(tc, 'tcPr')
      const span = num(kid(tcPr, 'gridSpan'), 'val', 1)
      const vMerge = kid(tcPr, 'vMerge')
      const fill = attr(kid(tcPr, 'shd'), 'fill')
      if (vMerge && attr(vMerge, 'val') !== 'restart') {
        const start = openMerge.get(col)
        if (start) start.rowSpan++
        col += span
        continue
      }
      const cell: DocxCell = {
        blocks: parseBlocks(tc, ctx),
        span,
        rowSpan: 1,
        width: num(kid(tcPr, 'tcW'), 'w'),
        shade: fill && /^[0-9a-f]{6}$/i.test(fill) ? '#' + fill : undefined,
      }
      if (vMerge) openMerge.set(col, cell)
      else openMerge.delete(col)
      row.push(cell)
      col += span
    }
    rows.push(row)
  }
  return { kind: 'table', colWidths, rows }
}

function parseBlocks(container: Element, ctx: Ctx): DocxBlock[] {
  const out: DocxBlock[] = []
  for (const c of Array.from(container.children)) {
    if (c.localName === 'p') out.push(parsePara(c, ctx))
    else if (c.localName === 'tbl') out.push(parseTable(c, ctx))
    else if (c.localName === 'sdt') out.push(...parseBlocks(kid(c, 'sdtContent') ?? c, ctx))
    else if (c.localName === 'customXml') out.push(...parseBlocks(c, ctx))
  }
  return out
}

export async function parseDocx(data: ArrayBuffer | Uint8Array): Promise<DocxDocument> {
  const zip = await ZipDoc.load(data)
  const doc = await zip.xml(PART)
  if (!doc) throw new Error('본문(word/document.xml)이 없는 DOCX 파일입니다')
  const ctx = new Ctx(zip)

  const styles = await zip.xml('word/styles.xml')
  ctx.defaultRPr = path(first(styles, 'docDefaults'), 'rPrDefault', 'rPr')
  ctx.defaultPPr = path(first(styles, 'docDefaults'), 'pPrDefault', 'pPr')
  for (const s of all(styles, 'style')) {
    const id = attr(s, 'styleId')
    if (!id) continue
    ctx.styles.set(id, { basedOn: attr(kid(s, 'basedOn'), 'val') ?? undefined, rPr: kid(s, 'rPr'), pPr: kid(s, 'pPr') })
    if (attr(s, 'type') === 'paragraph' && attr(s, 'default') === '1') ctx.defaultParaStyle = id
  }

  const rels = await zip.xml('word/_rels/document.xml.rels')
  for (const r of all(rels, 'Relationship')) {
    if (!attr(r, 'Type')?.endsWith('/image') || attr(r, 'TargetMode') === 'External') continue
    const target = 'word/' + (attr(r, 'Target') ?? '').replace(/^\.?\//, '').replace(/^\/word\//, '')
    const f = zip.zip.file(target)
    if (!f) continue
    const ext = target.split('.').pop()?.toLowerCase()
    const type = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    const url = URL.createObjectURL(new Blob([await f.async('arraybuffer')], { type }))
    ctx.objectUrls.push(url)
    ctx.images.set(attr(r, 'Id') ?? '', url)
  }

  const body = kid(doc.documentElement, 'body')
  const sectPr = kid(body, 'sectPr')
  const mar = kid(sectPr, 'pgMar')
  return {
    blocks: body ? parseBlocks(body, ctx) : [],
    pageWidth: num(kid(sectPr, 'pgSz'), 'w', 11906),
    margins: {
      top: num(mar, 'top', 1440),
      right: num(mar, 'right', 1440),
      bottom: num(mar, 'bottom', 1440),
      left: num(mar, 'left', 1440),
    },
    objectUrls: ctx.objectUrls,
    zip,
  }
}
