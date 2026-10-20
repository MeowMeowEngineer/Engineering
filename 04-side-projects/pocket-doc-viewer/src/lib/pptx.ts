// PPTX(PresentationML) 해석기.
// 슬라이드 → 레이아웃 → 마스터 순으로 상속되는 위치·글자 모양·배경을 풀어
// 절대 좌표(EMU)로 배치된 도형 목록으로 바꾼다. 1 EMU = 1/914400 inch.

import { all, attr, bool, first, kid, kids, num, parseXml, path } from './xml'
import { createLike, ZipDoc, type TextSlot } from './zipdoc'

export interface Run {
  text: string
  sizePt: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  color?: string
  font?: string
  br?: boolean
  baseline?: number
  /** 편집 손잡이 (슬라이드 자체의 글자에만 있다. 레이아웃·마스터 글자는 모든 슬라이드에 영향을 주므로 고치지 않는다) */
  slot?: TextSlot
}

export interface Paragraph {
  align: 'left' | 'center' | 'right' | 'justify'
  level: number
  bullet?: string
  bulletColor?: string
  indentEmu: number
  marginLeftEmu: number
  lineSpacingPct?: number
  spaceBeforePt?: number
  spaceAfterPt?: number
  runs: Run[]
  /** 빈 문단 높이를 맞추기 위한 글자 크기 */
  endSizePt: number
}

export interface TextBody {
  anchor: 'top' | 'middle' | 'bottom'
  insets: [number, number, number, number]
  wrap: boolean
  vertical: boolean
  fontScale: number
  paragraphs: Paragraph[]
}

export interface Line {
  color: string
  widthEmu: number
  dash?: boolean
}

interface Box {
  x: number
  y: number
  w: number
  h: number
  rot: number
  flipH: boolean
  flipV: boolean
}

export interface TableCell {
  text: TextBody
  fill?: string
  gridSpan: number
  rowSpan: number
  hidden: boolean
  borders: { l?: Line; r?: Line; t?: Line; b?: Line }
}

export type SlideElement =
  | (Box & { kind: 'shape'; geom: string; fill?: string; line?: Line; text?: TextBody; adj?: number })
  | (Box & { kind: 'image'; src: string; line?: Line })
  | (Box & { kind: 'table'; colWidths: number[]; rows: { h: number; cells: TableCell[] }[] })
  | (Box & { kind: 'placeholder'; label: string })

export interface Slide {
  index: number
  background: string
  elements: SlideElement[]
  notes?: string
}

export interface PptxDocument {
  width: number
  height: number
  slides: Slide[]
  objectUrls: string[]
  zip: ZipDoc
}

// ---------------------------------------------------------------- 패키지 읽기

/** sldId처럼 일반 id와 r:id를 함께 가진 요소에서 관계 id(r:id)만 꺼낸다 */
function relId(el: Element): string {
  for (const a of Array.from(el.attributes)) if (a.localName === 'id' && a.prefix) return a.value
  return ''
}

type Rels = Map<string, { target: string; type: string }>

function dirOf(p: string) {
  return p.slice(0, p.lastIndexOf('/') + 1)
}

function resolvePath(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = (dirOf(base) + target).split('/')
  const out: string[] = []
  for (const s of parts) {
    if (s === '..') out.pop()
    else if (s !== '.' && s !== '') out.push(s)
  }
  return out.join('/')
}

class Pkg {
  private relCache = new Map<string, Rels>()
  private media = new Map<string, string>()
  readonly objectUrls: string[] = []
  readonly doc: ZipDoc
  private get zip() {
    return this.doc.zip
  }
  constructor(doc: ZipDoc) {
    this.doc = doc
  }

  xml(name: string): Promise<Document | null> {
    return this.doc.xml(name)
  }

  async rels(part: string): Promise<Rels> {
    if (this.relCache.has(part)) return this.relCache.get(part)!
    const relPath = dirOf(part) + '_rels/' + part.slice(part.lastIndexOf('/') + 1) + '.rels'
    const doc = await this.xml(relPath)
    const map: Rels = new Map()
    for (const r of all(doc, 'Relationship')) {
      const external = attr(r, 'TargetMode') === 'External'
      map.set(attr(r, 'Id') ?? '', {
        target: external ? '' : resolvePath(part, attr(r, 'Target') ?? ''),
        type: attr(r, 'Type') ?? '',
      })
    }
    this.relCache.set(part, map)
    return map
  }

  async relTarget(part: string, typeSuffix: string): Promise<string | undefined> {
    for (const r of (await this.rels(part)).values()) if (r.type.endsWith(typeSuffix)) return r.target
    return undefined
  }

  async mediaUrl(part: string, rid: string | null): Promise<string | undefined> {
    if (!rid) return undefined
    const target = (await this.rels(part)).get(rid)?.target
    if (!target) return undefined
    if (this.media.has(target)) return this.media.get(target)
    const f = this.zip.file(target)
    if (!f) return undefined
    const ext = target.split('.').pop()?.toLowerCase() ?? ''
    const type =
      ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext === 'emf' || ext === 'wmf' ? 'x-' + ext : ext}`
    const url = URL.createObjectURL(new Blob([await f.async('arraybuffer')], { type }))
    this.objectUrls.push(url)
    this.media.set(target, url)
    return url
  }
}

// ---------------------------------------------------------------- 색

interface Theme {
  colors: Map<string, string>
  majorFont?: string
  minorFont?: string
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function hslToRgb([h, s, l]: number[]): number[] {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

/** lumMod·lumOff·tint·shade·alpha 같은 색 변형을 적용한다 */
export function applyColorMods(hex: string, el: Element): string {
  let rgb = hexToRgb(hex)
  let alpha = 1
  for (const m of Array.from(el.children)) {
    const v = num(m, 'val', 100000) / 100000
    switch (m.localName) {
      case 'lumMod': {
        const [h, s, l] = rgbToHsl(rgb)
        rgb = hslToRgb([h, s, Math.min(1, l * v)]) as typeof rgb
        break
      }
      case 'lumOff': {
        const [h, s, l] = rgbToHsl(rgb)
        rgb = hslToRgb([h, s, Math.max(0, Math.min(1, l + v))]) as typeof rgb
        break
      }
      case 'tint':
        rgb = rgb.map((c) => c + (255 - c) * (1 - v)) as typeof rgb
        break
      case 'shade':
        rgb = rgb.map((c) => c * v) as typeof rgb
        break
      case 'alpha':
        alpha = v
        break
    }
  }
  const out = rgbToHex(rgb)
  if (alpha >= 0.999) return out
  const [r, g, b] = hexToRgb(out)
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`
}

const PRESET: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  gray: '#808080',
  grey: '#808080',
}

interface Scope {
  pkg: Pkg
  theme: Theme
  /** 마스터의 clrMap (bg1 → lt1 ...) */
  clrMap: Map<string, string>
  /** 도형 style에서 오는 placeholder 색 (phClr) */
  phClr?: string
  /** 글자를 고칠 수 있는 파트 (슬라이드 본문을 읽을 때만 있다) */
  editPart?: string
}

function runSlot(t: Element, sc: Scope): TextSlot | undefined {
  const part = sc.editPart
  if (!part) return undefined
  return {
    get: () => t.textContent ?? '',
    set(v) {
      if (v === t.textContent) return
      t.textContent = v
      sc.pkg.doc.touch(part)
    },
  }
}

/** 빈 문단(비어 있는 제목·본문 틀 등)에 a:r을 새로 만들어 글자를 넣는 손잡이 */
function emptyParaSlot(p: Element, sc: Scope): TextSlot | undefined {
  const part = sc.editPart
  if (!part) return undefined
  let t: Element | null = null
  return {
    get: () => t?.textContent ?? '',
    set(v) {
      if (!t) {
        if (!v) return
        const r = createLike(p, 'r')
        const end = kid(p, 'endParaRPr')
        const rPr = createLike(p, 'rPr')
        // 문단 끝 글자 모양(endParaRPr)을 그대로 이어받는다
        if (end) {
          for (const a of Array.from(end.attributes)) rPr.setAttributeNS(a.namespaceURI, a.name, a.value)
          for (const c of Array.from(end.childNodes)) rPr.appendChild(c.cloneNode(true))
        }
        t = createLike(p, 't')
        r.append(rPr, t)
        p.insertBefore(r, end)
      }
      t.textContent = v
      sc.pkg.doc.touch(part)
    },
  }
}

function colorOf(el: Element | null | undefined, sc: Scope): string | undefined {
  if (!el) return undefined
  const c = Array.from(el.children).find((x) =>
    ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'scrgbClr', 'hslClr'].includes(x.localName),
  )
  if (!c) return undefined
  let base: string | undefined
  switch (c.localName) {
    case 'srgbClr':
      base = '#' + (attr(c, 'val') ?? '000000')
      break
    case 'sysClr':
      base = '#' + (attr(c, 'lastClr') ?? (attr(c, 'val') === 'window' ? 'ffffff' : '000000'))
      break
    case 'prstClr':
      base = PRESET[attr(c, 'val') ?? ''] ?? '#000000'
      break
    case 'scrgbClr':
      base = rgbToHex(['r', 'g', 'b'].map((k) => (num(c, k, 0) / 100000) * 255))
      break
    case 'schemeClr': {
      const key = attr(c, 'val') ?? ''
      if (key === 'phClr') base = sc.phClr
      else base = sc.theme.colors.get(sc.clrMap.get(key) ?? key)
      break
    }
  }
  return base ? applyColorMods(base, c) : undefined
}

/** solidFill / gradFill / noFill 을 CSS 배경 값으로 */
function fillOf(spPr: Element | null, sc: Scope): string | undefined | null {
  if (!spPr) return undefined
  if (kid(spPr, 'noFill')) return null
  const solid = kid(spPr, 'solidFill')
  if (solid) return colorOf(solid, sc)
  const grad = kid(spPr, 'gradFill')
  if (grad) {
    const stops = all(grad, 'gs')
      .map((gs) => ({ pos: num(gs, 'pos', 0) / 1000, color: colorOf(gs, sc) }))
      .filter((s) => s.color)
      .sort((a, b) => a.pos - b.pos)
    if (stops.length === 0) return undefined
    if (stops.length === 1) return stops[0].color
    const ang = num(kid(grad, 'lin'), 'ang', 0) / 60000
    return `linear-gradient(${ang + 90}deg, ${stops.map((s) => `${s.color} ${s.pos}%`).join(', ')})`
  }
  return undefined
}

function lineOf(ln: Element | null, sc: Scope): Line | null | undefined {
  if (!ln) return undefined
  if (kid(ln, 'noFill')) return null
  const color = colorOf(kid(ln, 'solidFill'), sc)
  if (!color) return undefined
  const dash = attr(kid(ln, 'prstDash'), 'val')
  return { color, widthEmu: num(ln, 'w', 12700), dash: !!dash && dash !== 'solid' }
}

// ---------------------------------------------------------------- 상속 (placeholder)

interface PhInfo {
  type: string
  idx?: string
}

function phOf(sp: Element): PhInfo | undefined {
  const nv = Array.from(sp.children).find((c) => c.localName.startsWith('nv'))
  const ph = path(nv, 'nvPr', 'ph')
  if (!ph) return undefined
  return { type: attr(ph, 'type') ?? 'body', idx: attr(ph, 'idx') ?? undefined }
}

function phGroup(type: string): 'title' | 'body' | 'other' {
  if (type === 'title' || type === 'ctrTitle') return 'title'
  if (type === 'body' || type === 'subTitle' || type === 'obj') return 'body'
  return 'other'
}

function findPh(tree: Element | null, ph: PhInfo): Element | null {
  if (!tree) return null
  const sps = kids(tree, 'sp')
  if (ph.idx !== undefined) {
    const byIdx = sps.find((s) => phOf(s)?.idx === ph.idx)
    if (byIdx) return byIdx
  }
  const byType = sps.find((s) => phOf(s)?.type === ph.type)
  if (byType) return byType
  const g = phGroup(ph.type)
  return sps.find((s) => {
    const t = phOf(s)?.type
    return t !== undefined && phGroup(t) === g && g !== 'other'
  }) ?? null
}

interface Layer {
  part: string
  tree: Element | null
}

interface SlideCtx extends Scope {
  part: string
  layout: Layer
  master: Layer
  txStyles: Element | null
  defaultTextStyle: Element | null
}

// ---------------------------------------------------------------- 위치

function xfrmOf(el: Element | null): Box | undefined {
  const x = el ? kid(el, 'xfrm') : null
  const off = kid(x, 'off')
  const ext = kid(x, 'ext')
  if (!x || !off || !ext) return undefined
  return {
    x: num(off, 'x', 0),
    y: num(off, 'y', 0),
    w: num(ext, 'cx', 0),
    h: num(ext, 'cy', 0),
    rot: num(x, 'rot', 0) / 60000,
    flipH: bool(x, 'flipH') ?? false,
    flipV: bool(x, 'flipV') ?? false,
  }
}

type Transform = (b: Box) => Box
const identity: Transform = (b) => b

function groupTransform(grpSpPr: Element | null, parent: Transform): Transform {
  const x = kid(grpSpPr, 'xfrm')
  const off = kid(x, 'off')
  const ext = kid(x, 'ext')
  const chOff = kid(x, 'chOff')
  const chExt = kid(x, 'chExt')
  if (!off || !ext || !chOff || !chExt) return parent
  const sx = num(chExt, 'cx', 1) ? num(ext, 'cx', 0) / num(chExt, 'cx', 1) : 1
  const sy = num(chExt, 'cy', 1) ? num(ext, 'cy', 0) / num(chExt, 'cy', 1) : 1
  return (b) =>
    parent({
      ...b,
      x: num(off, 'x', 0) + (b.x - num(chOff, 'x', 0)) * sx,
      y: num(off, 'y', 0) + (b.y - num(chOff, 'y', 0)) * sy,
      w: b.w * sx,
      h: b.h * sy,
    })
}

// ---------------------------------------------------------------- 글자

/** lvl1pPr ~ lvl9pPr 를 우선순위대로 모은 목록 */
type LevelSources = (Element | null)[]

function lvlPPr(src: Element | null, level: number): Element | null {
  return kid(src, `lvl${level + 1}pPr`)
}

function pick<T>(sources: LevelSources, level: number, get: (pPr: Element) => T | undefined): T | undefined {
  for (const s of sources) {
    const p = lvlPPr(s, level)
    if (!p) continue
    const v = get(p)
    if (v !== undefined) return v
  }
  return undefined
}

function fontFace(rPr: Element | null, sc: Scope): string | undefined {
  const latin = attr(kid(rPr, 'ea'), 'typeface') || attr(kid(rPr, 'latin'), 'typeface')
  if (!latin) return undefined
  if (latin === '+mj-lt' || latin === '+mj-ea') return sc.theme.majorFont
  if (latin === '+mn-lt' || latin === '+mn-ea') return sc.theme.minorFont
  return latin
}

function parseTextBody(
  txBody: Element | null,
  sc: Scope,
  sources: LevelSources,
  bodyPrChain: (Element | null)[],
  styleColor?: string,
): TextBody | undefined {
  if (!txBody) return undefined
  const bodyPrs = [kid(txBody, 'bodyPr'), ...bodyPrChain]
  const bp = (name: string) => {
    for (const b of bodyPrs) {
      const v = attr(b, name)
      if (v != null) return v
    }
    return null
  }
  const anchor = bp('anchor')
  const autofit = path(txBody, 'bodyPr', 'normAutofit')
  const vert = bp('vert')
  const shapeSources = [kid(txBody, 'lstStyle'), ...sources]

  const paragraphs: Paragraph[] = kids(txBody, 'p').map((p) => {
    const pPr = kid(p, 'pPr')
    const level = num(pPr, 'lvl', 0)
    const getP = <T,>(fn: (e: Element) => T | undefined) => (pPr ? fn(pPr) : undefined) ?? pick(shapeSources, level, fn)
    const algn = getP((e) => attr(e, 'algn') ?? undefined)
    const sizeOf = (rPr: Element | null) =>
      (num(rPr, 'sz') ?? getP((e) => num(kid(e, 'defRPr'), 'sz')) ?? 1800) / 100
    const runs: Run[] = []
    for (const r of Array.from(p.children)) {
      if (r.localName === 'br') {
        runs.push({ text: '', sizePt: sizeOf(kid(r, 'rPr')), br: true })
        continue
      }
      if (r.localName !== 'r' && r.localName !== 'fld') continue
      const rPr = kid(r, 'rPr')
      const def = (fn: (d: Element) => string | null | undefined) => {
        const own = rPr ? fn(rPr) : undefined
        if (own != null) return own
        return getP((e) => {
          const d = kid(e, 'defRPr')
          return d ? (fn(d) ?? undefined) : undefined
        })
      }
      const color =
        colorOf(kid(rPr, 'solidFill'), sc) ??
        getP((e) => colorOf(path(e, 'defRPr', 'solidFill'), sc)) ??
        styleColor
      const u = def((d) => attr(d, 'u'))
      const strike = def((d) => attr(d, 'strike'))
      const tEl = kid(r, 't')
      runs.push({
        text: tEl?.textContent ?? '',
        slot: tEl && r.localName === 'r' ? runSlot(tEl, sc) : undefined,
        sizePt: sizeOf(rPr),
        bold: def((d) => attr(d, 'b')) === '1',
        italic: def((d) => attr(d, 'i')) === '1',
        underline: !!u && u !== 'none',
        strike: !!strike && strike !== 'noStrike',
        color,
        font: fontFace(rPr, sc) ?? getP((e) => fontFace(kid(e, 'defRPr'), sc)),
        baseline: num(rPr, 'baseline'),
      })
    }

    if (!runs.some((r) => !r.br)) {
      const slot = emptyParaSlot(p, sc)
      if (slot) runs.push({ text: '', sizePt: sizeOf(kid(p, 'endParaRPr')), slot })
    }

    const buNone = getP((e) => (kid(e, 'buNone') ? true : kid(e, 'buChar') || kid(e, 'buAutoNum') ? false : undefined))
    const buChar = getP((e) => attr(kid(e, 'buChar'), 'char') ?? (kid(e, 'buAutoNum') ? '•' : undefined))
    const hasText = runs.some((r) => r.text.trim())
    const lnPct = getP((e) => num(path(e, 'lnSpc', 'spcPct'), 'val'))
    const endRPr = kid(p, 'endParaRPr')
    return {
      align: algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : algn === 'just' || algn === 'dist' ? 'justify' : 'left',
      level,
      bullet: !buNone && buChar && hasText ? buChar : undefined,
      bulletColor: getP((e) => colorOf(kid(e, 'buClr'), sc)),
      indentEmu: getP((e) => num(e, 'indent')) ?? 0,
      marginLeftEmu: getP((e) => num(e, 'marL')) ?? 0,
      lineSpacingPct: lnPct !== undefined ? lnPct / 1000 : undefined,
      spaceBeforePt: getP((e) => num(path(e, 'spcBef', 'spcPts'), 'val')) !== undefined ? getP((e) => num(path(e, 'spcBef', 'spcPts'), 'val'))! / 100 : undefined,
      spaceAfterPt: getP((e) => num(path(e, 'spcAft', 'spcPts'), 'val')) !== undefined ? getP((e) => num(path(e, 'spcAft', 'spcPts'), 'val'))! / 100 : undefined,
      runs,
      endSizePt: sizeOf(endRPr),
    }
  })

  return {
    anchor: anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top',
    insets: [
      Number(bp('tIns') ?? 45720),
      Number(bp('rIns') ?? 91440),
      Number(bp('bIns') ?? 45720),
      Number(bp('lIns') ?? 91440),
    ],
    wrap: bp('wrap') !== 'none',
    vertical: !!vert && vert !== 'horz',
    fontScale: autofit ? num(autofit, 'fontScale', 100000) / 100000 : 1,
    paragraphs,
  }
}

// ---------------------------------------------------------------- 도형

async function parseTree(
  tree: Element | null,
  ctx: SlideCtx,
  layer: 'slide' | 'layout' | 'master',
  tf: Transform,
  out: SlideElement[],
) {
  if (!tree) return
  const part = layer === 'slide' ? ctx.part : layer === 'layout' ? ctx.layout.part : ctx.master.part
  const sc: Scope = layer === 'slide' ? { ...ctx, editPart: part } : ctx

  for (const el of Array.from(tree.children)) {
    const name = el.localName
    if (name === 'grpSp') {
      await parseTree(el, ctx, layer, groupTransform(kid(el, 'grpSpPr'), tf), out)
      continue
    }
    if (name === 'AlternateContent') {
      const choice = kid(el, 'Choice') ?? kid(el, 'Fallback')
      if (choice) await parseTree(choice, ctx, layer, tf, out)
      continue
    }

    const ph = phOf(el)
    // 레이아웃·마스터의 placeholder(제목 틀 등)는 슬라이드가 채울 자리이므로 그리지 않는다
    if (layer !== 'slide' && ph) continue

    const layoutPh = ph ? findPh(ctx.layout.tree, ph) : null
    const masterPh = ph ? findPh(ctx.master.tree, ph) : null
    const spPr = kid(el, 'spPr')
    const box = xfrmOf(spPr) ?? xfrmOf(kid(layoutPh, 'spPr')) ?? xfrmOf(kid(masterPh, 'spPr'))

    if (name === 'sp' || name === 'cxnSp') {
      if (!box) continue
      const style = kid(el, 'style')
      const styleFill = colorOf(kid(style, 'fillRef'), sc)
      const styleLine = colorOf(kid(style, 'lnRef'), sc)
      const styleFont = colorOf(kid(style, 'fontRef'), sc)

      let fill = fillOf(spPr, sc)
      if (fill === undefined) fill = fillOf(kid(layoutPh, 'spPr'), sc) ?? fillOf(kid(masterPh, 'spPr'), sc)
      if (fill === undefined && num(kid(style, 'fillRef'), 'idx', 0) > 0) fill = styleFill
      const blip = path(spPr, 'blipFill', 'blip')
      if (blip) {
        const url = await ctx.pkg.mediaUrl(part, attr(blip, 'embed'))
        if (url) fill = `center / cover no-repeat url("${url}")`
      }

      let line = lineOf(kid(spPr, 'ln'), sc)
      if (line === undefined && num(kid(style, 'lnRef'), 'idx', 0) > 0 && styleLine) {
        line = { color: styleLine, widthEmu: num(kid(spPr, 'ln'), 'w', 9525) }
      }

      const group = ph ? phGroup(ph.type) : 'other'
      const txKey = group === 'title' ? 'titleStyle' : group === 'body' ? 'bodyStyle' : 'otherStyle'
      const sources: LevelSources = [
        kid(kid(layoutPh, 'txBody'), 'lstStyle'),
        kid(kid(masterPh, 'txBody'), 'lstStyle'),
        kid(ctx.txStyles, txKey),
        ...(group === 'other' ? [ctx.defaultTextStyle] : []),
      ]
      const text = parseTextBody(
        kid(el, 'txBody'),
        sc,
        sources,
        [path(layoutPh, 'txBody', 'bodyPr'), path(masterPh, 'txBody', 'bodyPr')],
        styleFont,
      )
      const geomEl = kid(spPr, 'prstGeom')
      const geom = name === 'cxnSp' ? 'line' : (attr(geomEl, 'prst') ?? (kid(spPr, 'custGeom') ? 'rect' : 'rect'))
      const adj = num(all(geomEl, 'gd').find((g) => attr(g, 'name') === 'adj'), 'fmla')
      const adjVal = adj ?? Number(/val (\d+)/.exec(attr(all(geomEl, 'gd')[0], 'fmla') ?? '')?.[1] ?? NaN)
      out.push({
        kind: 'shape',
        ...tf(box),
        geom,
        fill: fill ?? undefined,
        line: line ?? undefined,
        text: text && text.paragraphs.some((p) => p.runs.some((r) => r.text || r.slot)) ? text : undefined,
        adj: Number.isFinite(adjVal) ? adjVal : undefined,
      })
    } else if (name === 'pic') {
      if (!box) continue
      const blip = path(el, 'blipFill', 'blip')
      const url = await ctx.pkg.mediaUrl(part, attr(blip, 'embed'))
      if (url) out.push({ kind: 'image', ...tf(box), src: url, line: lineOf(kid(spPr, 'ln'), sc) ?? undefined })
    } else if (name === 'graphicFrame') {
      const fb = xfrmOf(el) ?? box
      if (!fb) continue
      const data = path(el, 'graphic', 'graphicData')
      const tbl = kid(data, 'tbl')
      if (tbl) {
        out.push({ kind: 'table', ...tf(fb), ...parseTable(tbl, ctx, sc) })
      } else {
        const uri = attr(data, 'uri') ?? ''
        out.push({
          kind: 'placeholder',
          ...tf(fb),
          label: uri.includes('chart') ? '차트' : uri.includes('diagram') ? 'SmartArt' : '개체',
        })
      }
    }
  }
}

function parseTable(tbl: Element, ctx: SlideCtx, sc: Scope) {
  const tblPr = kid(tbl, 'tblPr')
  const firstRow = bool(tblPr, 'firstRow') ?? false
  const bandRow = bool(tblPr, 'bandRow') ?? false
  const accent = ctx.theme.colors.get('accent1') ?? '#4472c4'
  const colWidths = kids(kid(tbl, 'tblGrid'), 'gridCol').map((g) => num(g, 'w', 0))
  const white = '#ffffff'
  const rows = kids(tbl, 'tr').map((tr, ri) => ({
    h: num(tr, 'h', 0),
    cells: kids(tr, 'tc').map((tc) => {
      const tcPr = kid(tc, 'tcPr')
      const header = firstRow && ri === 0
      // 표 스타일(tableStyleId)은 기본 '보통 스타일 2 - 강조 1'과 비슷하게 흉내 낸다
      const styleFill = header ? accent : bandRow && (ri - (firstRow ? 1 : 0)) % 2 === 0 ? applyColorMods(accent, fakeMods(0.2)) : applyColorMods(accent, fakeMods(0.1))
      const ownFill = fillOf(tcPr, sc)
      const text = parseTextBody(kid(tc, 'txBody'), sc, [], [])
      if (text) {
        text.insets = [num(tcPr, 'marT', 45720), num(tcPr, 'marR', 91440), num(tcPr, 'marB', 45720), num(tcPr, 'marL', 91440)]
        const a = attr(tcPr, 'anchor')
        text.anchor = a === 'ctr' ? 'middle' : a === 'b' ? 'bottom' : 'top'
        for (const p of text.paragraphs)
          for (const r of p.runs) {
            if (header && !r.color) r.color = white
            if (header) r.bold = true
          }
      }
      const bl = (n: string) => lineOf(kid(tcPr, n), sc) ?? undefined
      return {
        text: text ?? { anchor: 'top', insets: [0, 0, 0, 0], wrap: true, vertical: false, fontScale: 1, paragraphs: [] },
        fill: ownFill === null ? undefined : (ownFill ?? styleFill),
        gridSpan: num(tc, 'gridSpan', 1),
        rowSpan: num(tc, 'rowSpan', 1),
        hidden: bool(tc, 'hMerge') === true || bool(tc, 'vMerge') === true,
        borders: { l: bl('lnL'), r: bl('lnR'), t: bl('lnT'), b: bl('lnB') },
      } satisfies TableCell
    }),
  }))
  return { colWidths, rows }
}

/** 강조색을 연하게 만드는 tint 변형을 흉내 내는 가짜 요소 */
function fakeMods(tint: number): Element {
  const doc = parseXml(`<c xmlns:a="a"><a:tint val="${Math.round(tint * 100000)}"/></c>`)
  return doc.documentElement
}

// ---------------------------------------------------------------- 배경

async function backgroundOf(cSld: Element | null, part: string, ctx: SlideCtx): Promise<string | undefined> {
  const bg = kid(cSld, 'bg')
  if (!bg) return undefined
  const bgPr = kid(bg, 'bgPr')
  if (bgPr) {
    const blip = path(bgPr, 'blipFill', 'blip')
    if (blip) {
      const url = await ctx.pkg.mediaUrl(part, attr(blip, 'embed'))
      if (url) return `center / cover no-repeat url("${url}")`
    }
    return fillOf(bgPr, ctx) ?? undefined
  }
  const ref = kid(bg, 'bgRef')
  if (ref) return colorOf(ref, ctx)
  return undefined
}

// ---------------------------------------------------------------- 진입점

async function loadTheme(pkg: Pkg, masterPart: string): Promise<Theme> {
  const themePart = await pkg.relTarget(masterPart, '/theme')
  const doc = themePart ? await pkg.xml(themePart) : null
  const colors = new Map<string, string>()
  const scheme = first(doc, 'clrScheme')
  for (const c of kids(scheme)) {
    const srgb = kid(c, 'srgbClr')
    const sys = kid(c, 'sysClr')
    const v = srgb ? attr(srgb, 'val') : sys ? (attr(sys, 'lastClr') ?? (attr(sys, 'val') === 'window' ? 'FFFFFF' : '000000')) : null
    if (v) colors.set(c.localName, '#' + v)
  }
  const fonts = first(doc, 'fontScheme')
  return {
    colors,
    majorFont: attr(path(fonts, 'majorFont', 'ea'), 'typeface') || attr(path(fonts, 'majorFont', 'latin'), 'typeface') || undefined,
    minorFont: attr(path(fonts, 'minorFont', 'ea'), 'typeface') || attr(path(fonts, 'minorFont', 'latin'), 'typeface') || undefined,
  }
}

export async function parsePptx(data: ArrayBuffer | Uint8Array): Promise<PptxDocument> {
  const pkg = new Pkg(await ZipDoc.load(data))
  const presPart = 'ppt/presentation.xml'
  const pres = await pkg.xml(presPart)
  if (!pres) throw new Error('presentation.xml이 없는 PPTX 파일입니다')
  const sldSz = first(pres, 'sldSz')
  const width = num(sldSz, 'cx', 12192000)
  const height = num(sldSz, 'cy', 6858000)
  const presRels = await pkg.rels(presPart)
  const defaultTextStyle = first(pres, 'defaultTextStyle')

  const slideParts = all(first(pres, 'sldIdLst'), 'sldId')
    .map((s) => presRels.get(relId(s))?.target)
    .filter((t): t is string => !!t)

  const themes = new Map<string, Theme>()
  const slides: Slide[] = []

  for (const [index, part] of slideParts.entries()) {
    const slideDoc = await pkg.xml(part)
    if (!slideDoc) continue
    const sld = slideDoc.documentElement
    if (attr(sld, 'show') === '0') continue
    const layoutPart = (await pkg.relTarget(part, '/slideLayout')) ?? ''
    const masterPart = (await pkg.relTarget(layoutPart, '/slideMaster')) ?? ''
    const layoutDoc = await pkg.xml(layoutPart)
    const masterDoc = await pkg.xml(masterPart)
    if (!themes.has(masterPart)) themes.set(masterPart, await loadTheme(pkg, masterPart))

    const clrMap = new Map<string, string>()
    const cm = first(masterDoc, 'clrMap')
    for (const a of Array.from(cm?.attributes ?? [])) clrMap.set(a.localName, a.value)
    const override = path(sld, 'clrMapOvr', 'overrideClrMapping')
    for (const a of Array.from(override?.attributes ?? [])) clrMap.set(a.localName, a.value)

    const ctx: SlideCtx = {
      pkg,
      theme: themes.get(masterPart)!,
      clrMap,
      part,
      layout: { part: layoutPart, tree: path(layoutDoc?.documentElement, 'cSld', 'spTree') },
      master: { part: masterPart, tree: path(masterDoc?.documentElement, 'cSld', 'spTree') },
      txStyles: first(masterDoc, 'txStyles'),
      defaultTextStyle,
    }

    const elements: SlideElement[] = []
    const showMaster = (el: Element | null | undefined) => attr(el, 'showMasterSp') !== '0'
    if (showMaster(sld) && showMaster(layoutDoc?.documentElement)) {
      await parseTree(ctx.master.tree, ctx, 'master', identity, elements)
    }
    if (showMaster(sld)) await parseTree(ctx.layout.tree, ctx, 'layout', identity, elements)
    await parseTree(path(sld, 'cSld', 'spTree'), ctx, 'slide', identity, elements)

    const background =
      (await backgroundOf(kid(sld, 'cSld'), part, ctx)) ??
      (await backgroundOf(kid(layoutDoc?.documentElement, 'cSld'), layoutPart, ctx)) ??
      (await backgroundOf(kid(masterDoc?.documentElement, 'cSld'), masterPart, ctx)) ??
      ctx.theme.colors.get(clrMap.get('bg1') ?? 'lt1') ??
      '#ffffff'

    const notesPart = await pkg.relTarget(part, '/notesSlide')
    const notesDoc = notesPart ? await pkg.xml(notesPart) : null
    const notes = notesDoc
      ? kids(path(notesDoc.documentElement, 'cSld', 'spTree'), 'sp')
          .filter((sp) => phOf(sp)?.type === 'body')
          .map((sp) => all(sp, 't').map((t) => t.textContent).join(''))
          .join('\n')
          .trim() || undefined
      : undefined

    slides.push({ index: index + 1, background, elements, notes })
  }

  return { width, height, slides, objectUrls: pkg.objectUrls, zip: pkg.doc }
}
