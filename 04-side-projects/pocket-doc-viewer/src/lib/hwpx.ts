// HWPX(OWPML, KS X 6101) 해석기.
// ZIP 안의 Contents/header.xml(글자·문단·테두리 모양)과 Contents/sectionN.xml(본문)을 읽어
// 화면에 그리기 쉬운 모델로 바꾼다. 단위는 모두 HWPUNIT(1/7200 inch)이다.

import JSZip from 'jszip'
import { all, attr, kid, kids, num, parseXml, path } from './xml'

export interface CharStyle {
  sizePt: number
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  font?: string
  shade?: string
  /** 위첨자/아래첨자 */
  script?: 'sup' | 'sub'
}

export interface ParaStyle {
  align: 'left' | 'right' | 'center' | 'justify'
  left: number
  right: number
  indent: number
  prev: number
  next: number
  /** 줄 간격. kind=percent면 %, fixed면 HWPUNIT */
  lineSpacing: { kind: 'percent' | 'fixed'; value: number }
}

export interface Border {
  style: 'none' | 'solid' | 'dashed' | 'dotted' | 'double'
  widthMm: number
  color: string
}

export interface BorderFill {
  left: Border
  right: Border
  top: Border
  bottom: Border
  fill?: string
}

export type Inline =
  | { type: 'text'; text: string; style: CharStyle }
  | { type: 'tab' }
  | { type: 'br' }
  | { type: 'table'; table: Table }
  | { type: 'image'; src: string; width: number; height: number }
  | { type: 'box'; width: number; paras: Para[]; border?: BorderFill }

export interface Para {
  style: ParaStyle
  items: Inline[]
  /** 이 문단 앞에서 새 쪽이 시작된다 */
  pageBreakBefore: boolean
  /** 빈 문단의 높이를 정할 글자 크기(pt) */
  baseSizePt: number
}

export interface Cell {
  row: number
  col: number
  rowSpan: number
  colSpan: number
  width: number
  height: number
  vAlign: 'top' | 'middle' | 'bottom'
  padding: [number, number, number, number]
  border?: BorderFill
  paras: Para[]
}

export interface Table {
  rowCount: number
  colCount: number
  colWidths: number[]
  cells: Cell[]
  border?: BorderFill
}

export interface PageSetup {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
}

export interface Section {
  page: PageSetup
  /** 쪽 단위로 나눈 문단 */
  pages: Para[][]
}

export interface HwpxDocument {
  title?: string
  sections: Section[]
  /** 그림에 쓰인 blob: URL. 화면을 닫을 때 해제해야 한다 */
  objectUrls: string[]
}

const A4: PageSetup = { width: 59528, height: 84188, left: 8504, right: 8504, top: 5668, bottom: 4252 }

const NO_BORDER: Border = { style: 'none', widthMm: 0, color: '#000' }

interface Header {
  chars: Map<string, CharStyle>
  paras: Map<string, ParaStyle>
  borders: Map<string, BorderFill>
}

const DEFAULT_CHAR: CharStyle = { sizePt: 10 }
const DEFAULT_PARA: ParaStyle = {
  align: 'justify',
  left: 0,
  right: 0,
  indent: 0,
  prev: 0,
  next: 0,
  lineSpacing: { kind: 'percent', value: 160 },
}

function color(v: string | null): string | undefined {
  if (!v || v === 'none') return undefined
  return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined
}

function parseBorder(el: Element | null): Border {
  if (!el) return NO_BORDER
  const type = (attr(el, 'type') ?? 'NONE').toUpperCase()
  const style: Border['style'] =
    type === 'NONE'
      ? 'none'
      : type.startsWith('DASH') || type === 'LONG_DASH'
        ? 'dashed'
        : type === 'DOT' || type === 'CIRCLE'
          ? 'dotted'
          : type.includes('DOUBLE') || type.includes('SLIM') || type.includes('THICK_')
            ? 'double'
            : 'solid'
  const widthMm = parseFloat(attr(el, 'width') ?? '0.12') || 0.12
  return { style, widthMm, color: color(attr(el, 'color')) ?? '#000000' }
}

function parseHeader(doc: Document): Header {
  const fonts = new Map<string, string>()
  for (const face of all(doc, 'fontface')) {
    if (attr(face, 'lang') !== 'HANGUL') continue
    for (const f of kids(face, 'font')) fonts.set(attr(f, 'id') ?? '', attr(f, 'face') ?? '')
  }

  const chars = new Map<string, CharStyle>()
  for (const cp of all(doc, 'charPr')) {
    const underline = kid(cp, 'underline')
    const strike = kid(cp, 'strikeout')
    const fontRef = kid(cp, 'fontRef')
    const style: CharStyle = {
      sizePt: num(cp, 'height', 1000) / 100,
      color: color(attr(cp, 'textColor')),
      shade: color(attr(cp, 'shadeColor')),
      bold: !!kid(cp, 'bold'),
      italic: !!kid(cp, 'italic'),
      underline: !!underline && attr(underline, 'type') !== 'NONE',
      strike: !!strike && !['NONE', null].includes(attr(strike, 'shape')),
      font: fonts.get(attr(fontRef, 'hangul') ?? '') || undefined,
      script: kid(cp, 'supscript') ? 'sup' : kid(cp, 'subscript') ? 'sub' : undefined,
    }
    chars.set(attr(cp, 'id') ?? '', style)
  }

  const paras = new Map<string, ParaStyle>()
  for (const pp of all(doc, 'paraPr')) {
    const align = (attr(kid(pp, 'align'), 'horizontal') ?? 'JUSTIFY').toUpperCase()
    // hp:switch 안의 case/default 중 아무거나 같은 값을 담고 있으므로 처음 나오는 것을 쓴다
    const margin = all(pp, 'margin')[0]
    const ls = all(pp, 'lineSpacing')[0]
    const mv = (name: string) => num(kid(margin, name), 'value', 0)
    const lsType = (attr(ls, 'type') ?? 'PERCENT').toUpperCase()
    paras.set(attr(pp, 'id') ?? '', {
      align:
        align === 'CENTER' ? 'center' : align === 'RIGHT' ? 'right' : align === 'LEFT' ? 'left' : 'justify',
      left: mv('left'),
      right: mv('right'),
      indent: mv('intent') || mv('indent'),
      prev: mv('prev'),
      next: mv('next'),
      lineSpacing:
        lsType === 'PERCENT'
          ? { kind: 'percent', value: num(ls, 'value', 160) }
          : { kind: 'fixed', value: num(ls, 'value', 1000) },
    })
  }

  const borders = new Map<string, BorderFill>()
  for (const bf of all(doc, 'borderFill')) {
    const brush = all(bf, 'winBrush')[0]
    borders.set(attr(bf, 'id') ?? '', {
      left: parseBorder(kid(bf, 'leftBorder')),
      right: parseBorder(kid(bf, 'rightBorder')),
      top: parseBorder(kid(bf, 'topBorder')),
      bottom: parseBorder(kid(bf, 'bottomBorder')),
      fill: color(attr(brush, 'faceColor')),
    })
  }

  return { chars, paras, borders }
}

interface Ctx {
  header: Header
  images: Map<string, string>
}

function textItems(t: Element, style: CharStyle, out: Inline[]) {
  let buf = ''
  const flush = () => {
    if (buf) out.push({ type: 'text', text: buf, style })
    buf = ''
  }
  for (const node of Array.from(t.childNodes)) {
    if (node.nodeType === 3) {
      buf += node.nodeValue ?? ''
      continue
    }
    if (node.nodeType !== 1) continue
    const name = (node as Element).localName
    if (name === 'tab') {
      flush()
      out.push({ type: 'tab' })
    } else if (name === 'lineBreak') {
      flush()
      out.push({ type: 'br' })
    } else if (name === 'nbSpace' || name === 'fwSpace') {
      buf += ' '
    } else if (name === 'hyphen') {
      buf += '-'
    }
  }
  flush()
}

function parseSubList(el: Element | null, ctx: Ctx): Para[] {
  return kids(el, 'p').map((p) => parsePara(p, ctx))
}

function parseTable(tbl: Element, ctx: Ctx): Table {
  const rowCount = num(tbl, 'rowCnt', 0)
  const colCount = num(tbl, 'colCnt', 0)
  const inMargin = kid(tbl, 'inMargin')
  const defPad: [number, number, number, number] = [
    num(inMargin, 'top', 141),
    num(inMargin, 'right', 510),
    num(inMargin, 'bottom', 141),
    num(inMargin, 'left', 510),
  ]
  const cells: Cell[] = []
  kids(tbl, 'tr').forEach((tr, ri) => {
    kids(tr, 'tc').forEach((tc, ci) => {
      const addr = kid(tc, 'cellAddr')
      const span = kid(tc, 'cellSpan')
      const sz = kid(tc, 'cellSz')
      const sub = kid(tc, 'subList')
      const cm = kid(tc, 'cellMargin')
      const ownMargin = attr(tc, 'hasMargin') === '1' && cm
      const va = (attr(sub, 'vertAlign') ?? 'CENTER').toUpperCase()
      cells.push({
        row: num(addr, 'rowAddr', ri),
        col: num(addr, 'colAddr', ci),
        rowSpan: Math.max(1, num(span, 'rowSpan', 1)),
        colSpan: Math.max(1, num(span, 'colSpan', 1)),
        width: num(sz, 'width', 0),
        height: num(sz, 'height', 0),
        vAlign: va === 'TOP' ? 'top' : va === 'BOTTOM' ? 'bottom' : 'middle',
        padding: ownMargin
          ? [num(cm, 'top', 141), num(cm, 'right', 510), num(cm, 'bottom', 141), num(cm, 'left', 510)]
          : defPad,
        border: ctx.header.borders.get(attr(tc, 'borderFillIDRef') ?? ''),
        paras: parseSubList(sub, ctx),
      })
    })
  })

  const rows = Math.max(rowCount, ...cells.map((c) => c.row + c.rowSpan))
  const cols = Math.max(colCount, ...cells.map((c) => c.col + c.colSpan))
  return {
    rowCount: rows,
    colCount: cols,
    colWidths: solveColumnWidths(cells, cols, num(kid(tbl, 'sz'), 'width', 0)),
    cells,
    border: ctx.header.borders.get(attr(tbl, 'borderFillIDRef') ?? ''),
  }
}

/**
 * 셀 너비(병합 셀 포함)에서 열 너비를 구한다.
 * 병합되지 않은 셀로 먼저 열 너비를 정하고, 병합 셀은 남은 너비를 빈 열에 나눠 준다.
 */
export function solveColumnWidths(cells: Pick<Cell, 'col' | 'colSpan' | 'width'>[], cols: number, tableWidth: number): number[] {
  const widths: (number | undefined)[] = new Array(cols).fill(undefined)
  for (const c of cells) if (c.colSpan === 1 && c.width > 0 && widths[c.col] === undefined) widths[c.col] = c.width
  // 병합 셀을 좁은 것부터 처리하면 정보가 더 많이 전달된다
  const spans = cells.filter((c) => c.colSpan > 1).sort((a, b) => a.colSpan - b.colSpan)
  for (let pass = 0; pass < 3; pass++) {
    for (const c of spans) {
      const idx = Array.from({ length: c.colSpan }, (_, i) => c.col + i).filter((i) => i < cols)
      const unknown = idx.filter((i) => widths[i] === undefined)
      if (unknown.length === 0) continue
      const known = idx.reduce((s, i) => s + (widths[i] ?? 0), 0)
      const rest = c.width - known
      if (rest > 0) for (const i of unknown) widths[i] = rest / unknown.length
    }
  }
  const knownSum = widths.reduce<number>((s, w) => s + (w ?? 0), 0)
  const missing = widths.filter((w) => w === undefined).length
  const fill = missing ? Math.max(1000, (tableWidth - knownSum) / missing) : 0
  return widths.map((w) => w ?? fill)
}

function parsePara(p: Element, ctx: Ctx): Para {
  const style = ctx.header.paras.get(attr(p, 'paraPrIDRef') ?? '') ?? DEFAULT_PARA
  const items: Inline[] = []
  const runs = kids(p, 'run')
  const baseSizePt = (ctx.header.chars.get(attr(runs[0], 'charPrIDRef') ?? '') ?? DEFAULT_CHAR).sizePt
  for (const run of runs) {
    const cs = ctx.header.chars.get(attr(run, 'charPrIDRef') ?? '') ?? DEFAULT_CHAR
    for (const child of Array.from(run.children)) {
      switch (child.localName) {
        case 't':
          textItems(child, cs, items)
          break
        case 'tbl':
          items.push({ type: 'table', table: parseTable(child, ctx) })
          break
        case 'pic': {
          const img = all(child, 'img')[0]
          const src = ctx.images.get(attr(img, 'binaryItemIDRef') ?? '')
          const sz = kid(child, 'curSz') ?? kid(child, 'sz')
          const width = num(sz, 'width', 0) || num(kid(child, 'sz'), 'width', 0)
          const height = num(sz, 'height', 0) || num(kid(child, 'sz'), 'height', 0)
          if (src) items.push({ type: 'image', src, width, height })
          break
        }
        case 'rect':
        case 'ellipse':
        case 'polygon':
        case 'container': {
          // 글상자: 도형 안의 글(drawText)만 꺼내 상자로 보여준다
          for (const dt of all(child, 'drawText')) {
            const sub = kid(dt, 'subList')
            const width = num(kid(child, 'sz'), 'width', 0)
            items.push({ type: 'box', width, paras: parseSubList(sub, ctx) })
          }
          break
        }
        case 'equation': {
          const script = kid(child, 'script')?.textContent?.trim()
          if (script) items.push({ type: 'text', text: script, style: { ...cs, italic: true } })
          break
        }
      }
    }
  }
  return { style, items, pageBreakBefore: attr(p, 'pageBreak') === '1', baseSizePt }
}

function firstLineVertPos(p: Element): number | undefined {
  const seg = kid(kid(p, 'linesegarray'), 'lineseg')
  return seg ? num(seg, 'vertpos', 0) : undefined
}

function parseSection(doc: Document, ctx: Ctx): Section {
  const root = doc.documentElement
  const pagePr = all(root, 'pagePr')[0]
  const margin = kid(pagePr, 'margin')
  let page: PageSetup = A4
  if (pagePr) {
    let width = num(pagePr, 'width', A4.width)
    let height = num(pagePr, 'height', A4.height)
    // NARROWLY = 가로 방향. width/height는 세로 기준으로 저장된다
    if (attr(pagePr, 'landscape') === 'NARROWLY' && width < height) [width, height] = [height, width]
    page = {
      width,
      height,
      left: num(margin, 'left', A4.left),
      right: num(margin, 'right', A4.right),
      top: num(margin, 'top', A4.top) + num(margin, 'header', 0),
      bottom: num(margin, 'bottom', A4.bottom) + num(margin, 'footer', 0),
    }
  }

  const pages: Para[][] = [[]]
  let lastPos = -1
  for (const p of kids(root, 'p')) {
    const para = parsePara(p, ctx)
    // 한글이 저장해 둔 줄 배치 정보(lineseg)의 세로 위치가 다시 작아지면 새 쪽이 시작된 것이다
    const pos = firstLineVertPos(p)
    const flowBreak = pos !== undefined && lastPos >= 0 && pos < lastPos
    if (pos !== undefined) lastPos = pos
    if ((para.pageBreakBefore || flowBreak) && pages[pages.length - 1].length > 0) pages.push([])
    pages[pages.length - 1].push(para)
  }
  return { page, pages }
}

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

export async function parseHwpx(data: ArrayBuffer | Uint8Array): Promise<HwpxDocument> {
  const zip = await JSZip.loadAsync(data)
  const read = async (name: string) => {
    const f = zip.file(name)
    return f ? f.async('string') : null
  }

  const hpfText = await read('Contents/content.hpf')
  const hpf = hpfText ? parseXml(hpfText) : null
  const manifest = new Map<string, { href: string; type: string }>()
  for (const item of all(hpf, 'item')) {
    manifest.set(attr(item, 'id') ?? '', { href: attr(item, 'href') ?? '', type: attr(item, 'media-type') ?? '' })
  }

  // 본문 순서: spine → 없으면 section 번호 순
  let sectionFiles = all(hpf, 'itemref')
    .map((r) => manifest.get(attr(r, 'idref') ?? '')?.href ?? '')
    .filter((h) => /section\d+\.xml$/i.test(h))
  if (sectionFiles.length === 0) {
    sectionFiles = Object.keys(zip.files)
      .filter((n) => /^Contents\/section\d+\.xml$/i.test(n))
      .sort((a, b) => Number(/(\d+)\.xml/.exec(a)![1]) - Number(/(\d+)\.xml/.exec(b)![1]))
  }
  if (sectionFiles.length === 0) throw new Error('본문(section)이 없는 HWPX 파일입니다')

  const headerText = await read('Contents/header.xml')
  const header = headerText ? parseHeader(parseXml(headerText)) : { chars: new Map(), paras: new Map(), borders: new Map() }

  const objectUrls: string[] = []
  const images = new Map<string, string>()
  for (const [id, item] of manifest) {
    const f = zip.file(item.href) ?? zip.file(item.href.replace(/^\//, ''))
    const ext = item.href.split('.').pop()?.toLowerCase() ?? ''
    if (!f || !(item.type.startsWith('image/') || MIME[ext])) continue
    const blob = new Blob([await f.async('arraybuffer')], { type: item.type.startsWith('image/') ? item.type : MIME[ext] })
    const url = URL.createObjectURL(blob)
    objectUrls.push(url)
    images.set(id, url)
  }

  const ctx: Ctx = { header, images }
  const sections: Section[] = []
  for (const name of sectionFiles) {
    const text = await read(name)
    if (text) sections.push(parseSection(parseXml(text), ctx))
  }

  const title = path(hpf?.documentElement, 'metadata', 'title')?.textContent?.trim() || undefined
  return { title, sections, objectUrls }
}

/** 미리보기·검색용: 문단의 글자만 이어 붙인다 */
export function paraText(p: Para): string {
  return p.items
    .map((i) =>
      i.type === 'text'
        ? i.text
        : i.type === 'tab'
          ? '\t'
          : i.type === 'table'
            ? i.table.cells.map((c) => c.paras.map(paraText).join(' ')).join(' | ')
            : i.type === 'box'
              ? i.paras.map(paraText).join(' ')
              : '',
    )
    .join('')
}
