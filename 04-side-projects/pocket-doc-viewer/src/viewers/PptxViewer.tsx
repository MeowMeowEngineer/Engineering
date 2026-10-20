import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { parsePptx, type Line, type PptxDocument, type Slide, type SlideElement, type TextBody } from '../lib/pptx'
import { errorMessage, fitScale, useCurrentPage, useWidth, type ViewerProps } from './common'
import { EditableText } from './Editable'
import { EditingContext } from './editing'

const EMU_PX = 1 / 9525
const PT_PX = 4 / 3

const px = (emu: number) => emu * EMU_PX

function fontStack(face?: string) {
  const fallback = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif'
  return face ? `"${face}", ${fallback}` : fallback
}

export default function PptxViewer({ bytes, zoom, onStatus, editing, onDirty, saverRef }: ViewerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const [doc, setDoc] = useState<PptxDocument | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let parsed: PptxDocument | undefined
    let cancelled = false
    parsePptx(bytes).then(
      (d) => {
        parsed = d
        if (cancelled) d.objectUrls.forEach(URL.revokeObjectURL)
        else setDoc(d)
      },
      (e) => !cancelled && setError(errorMessage(e)),
    )
    return () => {
      cancelled = true
      parsed?.objectUrls.forEach(URL.revokeObjectURL)
    }
  }, [bytes])

  const current = useCurrentPage(ref, '.slide-wrap', doc?.slides.length ?? 0)

  useEffect(() => {
    if (doc) onStatus?.(`${current} / ${doc.slides.length}장`)
  }, [doc, current, onStatus])

  useEffect(() => {
    if (!doc) return
    const unsubscribe = doc.zip.subscribe(() => onDirty?.(doc.zip.dirty))
    if (saverRef) saverRef.current = async () => ({ bytes: await doc.zip.save() })
    return () => {
      unsubscribe()
      if (saverRef) saverRef.current = null
    }
  }, [doc, onDirty, saverRef])

  if (error) return <div className="viewer-message">PowerPoint 문서를 열 수 없습니다.<small>{error}</small></div>

  const scale = doc ? fitScale(width, px(doc.width)) * zoom : 1
  return (
    <EditingContext.Provider value={!!editing}>
    <div ref={ref} className={`slides${editing ? ' is-editing' : ''}`}>
      {!doc && <div className="viewer-message">불러오는 중…</div>}
      {doc?.slides.map((s) => (
        <SlideView key={s.index} slide={s} w={px(doc.width)} h={px(doc.height)} scale={scale} />
      ))}
    </div>
    </EditingContext.Provider>
  )
}

function SlideView({
  slide,
  w,
  h,
  scale,
}: {
  slide: Slide
  w: number
  h: number
  scale: number
}) {
  return (
    <figure className="slide-wrap">
      <div className="paper slide-frame" style={{ width: w * scale, height: h * scale }}>
        <div className="slide" style={{ width: w, height: h, background: slide.background, transform: `scale(${scale})` }}>
          {slide.elements.map((el, i) => (
            <ElementView key={i} el={el} />
          ))}
        </div>
      </div>
      <figcaption>
        {slide.index}
        {slide.notes && (
          <details>
            <summary>발표자 노트</summary>
            <p>{slide.notes}</p>
          </details>
        )}
      </figcaption>
    </figure>
  )
}

function boxStyle(el: SlideElement): CSSProperties {
  return {
    left: px(el.x),
    top: px(el.y),
    width: Math.max(px(el.w), 1),
    height: Math.max(px(el.h), 1),
    transform: el.rot ? `rotate(${el.rot}deg)` : undefined,
  }
}

function lineCss(l?: Line): string | undefined {
  if (!l) return undefined
  return `${Math.max(px(l.widthEmu), 0.75)}px ${l.dash ? 'dashed' : 'solid'} ${l.color}`
}

/** CSS 배경 값에서 SVG에 쓸 단색을 꺼낸다 */
function solidOf(fill?: string): string | undefined {
  if (!fill) return undefined
  if (fill.startsWith('#') || fill.startsWith('rgb')) return fill
  return /(#[0-9a-f]{6}|rgba?\([^)]*\))/i.exec(fill)?.[1]
}

function ElementView({ el }: { el: SlideElement }) {
  switch (el.kind) {
    case 'image':
      return (
        <img
          className="sl-el"
          src={el.src}
          alt=""
          draggable={false}
          style={{
            ...boxStyle(el),
            border: lineCss(el.line),
            transform: [el.rot ? `rotate(${el.rot}deg)` : '', el.flipH ? 'scaleX(-1)' : '', el.flipV ? 'scaleY(-1)' : '']
              .join(' ')
              .trim() || undefined,
          }}
        />
      )
    case 'table':
      return <TableView el={el} />
    case 'placeholder':
      return (
        <div className="sl-el sl-placeholder" style={boxStyle(el)}>
          {el.label}
        </div>
      )
    case 'shape':
      return <ShapeView el={el} />
  }
}

function ShapeView({ el }: { el: Extract<SlideElement, { kind: 'shape' }> }) {
  const w = px(el.w)
  const h = px(el.h)
  const cssShapes: Record<string, string | undefined> = {
    rect: undefined,
    roundRect: `${Math.min(w, h) * ((el.adj ?? 16667) / 100000)}px`,
    ellipse: '50%',
    flowChartProcess: undefined,
    flowChartAlternateProcess: `${Math.min(w, h) * 0.17}px`,
    snipRoundRect: undefined,
  }
  const useCss = el.geom in cssShapes
  const svg = useCss ? null : geometrySvg(el.geom, w, h, el, solidOf(el.fill))
  const flip = [el.flipH ? 'scaleX(-1)' : '', el.flipV ? 'scaleY(-1)' : ''].join(' ').trim()

  return (
    <div className="sl-el" style={boxStyle(el)}>
      {useCss ? (
        <div
          className="sl-fill"
          style={{ background: el.fill, border: lineCss(el.line), borderRadius: cssShapes[el.geom] }}
        />
      ) : (
        svg && (
          <svg className="sl-fill" width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ transform: flip || undefined, overflow: 'visible' }}>
            {svg}
          </svg>
        )
      )}
      {el.text && <TextView body={el.text} />}
    </div>
  )
}

function geometrySvg(geom: string, w: number, h: number, el: { line?: Line }, fill?: string): ReactNode {
  const stroke = el.line?.color ?? 'none'
  const sw = el.line ? Math.max(px(el.line.widthEmu), 0.75) : 0
  const common = { fill: fill ?? 'none', stroke, strokeWidth: sw, strokeDasharray: el.line?.dash ? `${sw * 4} ${sw * 3}` : undefined }
  const poly = (pts: number[][]) => <polygon points={pts.map((p) => p.join(',')).join(' ')} {...common} />
  const a = Math.min(w, h)
  switch (geom) {
    case 'line':
    case 'straightConnector1':
    case 'bentConnector2':
    case 'bentConnector3':
    case 'curvedConnector3':
      return <line x1={0} y1={0} x2={w} y2={h} stroke={el.line?.color ?? '#000'} strokeWidth={Math.max(sw, 1)} />
    case 'triangle':
      return poly([[w / 2, 0], [w, h], [0, h]])
    case 'rtTriangle':
      return poly([[0, 0], [w, h], [0, h]])
    case 'diamond':
      return poly([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])
    case 'parallelogram':
      return poly([[a * 0.25, 0], [w, 0], [w - a * 0.25, h], [0, h]])
    case 'trapezoid':
      return poly([[a * 0.25, 0], [w - a * 0.25, 0], [w, h], [0, h]])
    case 'pentagon':
    case 'homePlate':
      return poly([[0, 0], [w - a * 0.5, 0], [w, h / 2], [w - a * 0.5, h], [0, h]])
    case 'chevron':
      return poly([[0, 0], [w - a * 0.5, 0], [w, h / 2], [w - a * 0.5, h], [0, h], [a * 0.5, h / 2]])
    case 'hexagon':
      return poly([[a * 0.25, 0], [w - a * 0.25, 0], [w, h / 2], [w - a * 0.25, h], [a * 0.25, h], [0, h / 2]])
    case 'octagon': {
      const c = a * 0.29
      return poly([[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]])
    }
    case 'rightArrow':
      return poly([[0, h * 0.25], [w - a * 0.5, h * 0.25], [w - a * 0.5, 0], [w, h / 2], [w - a * 0.5, h], [w - a * 0.5, h * 0.75], [0, h * 0.75]])
    case 'leftArrow':
      return poly([[w, h * 0.25], [a * 0.5, h * 0.25], [a * 0.5, 0], [0, h / 2], [a * 0.5, h], [a * 0.5, h * 0.75], [w, h * 0.75]])
    case 'upArrow':
      return poly([[w * 0.25, h], [w * 0.25, a * 0.5], [0, a * 0.5], [w / 2, 0], [w, a * 0.5], [w * 0.75, a * 0.5], [w * 0.75, h]])
    case 'downArrow':
      return poly([[w * 0.25, 0], [w * 0.75, 0], [w * 0.75, h - a * 0.5], [w, h - a * 0.5], [w / 2, h], [0, h - a * 0.5], [w * 0.25, h - a * 0.5]])
    case 'plus':
    case 'mathPlus': {
      const t = a * 0.25
      return poly([[t, 0], [w - t, 0], [w - t, t], [w, t], [w, h - t], [w - t, h - t], [w - t, h], [t, h], [t, h - t], [0, h - t], [0, t], [t, t]].map(([x, y]) => [x, y]))
    }
    case 'star5': {
      const pts: number[][] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.5 : 0.2
        const ang = -Math.PI / 2 + (i * Math.PI) / 5
        pts.push([w / 2 + Math.cos(ang) * w * r, h / 2 + Math.sin(ang) * h * r * 1.05])
      }
      return poly(pts)
    }
    default:
      return <rect x={0} y={0} width={w} height={h} {...common} />
  }
}

function TextView({ body }: { body: TextBody }) {
  const [t, r, b, l] = body.insets.map(px)
  return (
    <div
      className="sl-text"
      style={{
        padding: `${t}px ${r}px ${b}px ${l}px`,
        justifyContent: body.anchor === 'middle' ? 'center' : body.anchor === 'bottom' ? 'flex-end' : 'flex-start',
        whiteSpace: body.wrap ? 'pre-wrap' : 'pre',
        writingMode: body.vertical ? 'vertical-rl' : undefined,
      }}
    >
      {body.paragraphs.map((p, i) => {
        const size = Math.max(p.endSizePt, ...p.runs.map((r) => r.sizePt)) * body.fontScale * PT_PX
        const hanging = p.bullet ? px(p.indentEmu) : 0
        return (
          <p
            key={i}
            style={{
              textAlign: p.align,
              paddingLeft: px(p.marginLeftEmu),
              textIndent: px(p.indentEmu),
              lineHeight: p.lineSpacingPct ? (p.lineSpacingPct / 100) * 1.2 : 1.2,
              marginTop: p.spaceBeforePt ? p.spaceBeforePt * PT_PX : 0,
              marginBottom: p.spaceAfterPt ? p.spaceAfterPt * PT_PX : 0,
              fontSize: size,
            }}
          >
            {p.bullet && (
              <span
                className="sl-bullet"
                style={{
                  color: p.bulletColor ?? p.runs[0]?.color,
                  fontSize: (p.runs[0]?.sizePt ?? p.endSizePt) * body.fontScale * PT_PX,
                  width: hanging < 0 ? -hanging : undefined,
                }}
              >
                {p.bullet}
              </span>
            )}
            {p.runs.every((r) => !r.text && !r.slot) && '\u200b'}
            {p.runs.map((run, j) =>
              run.br ? (
                <br key={j} />
              ) : (
                <EditableText
                  key={j}
                  slot={run.slot}
                  text={run.text}
                  style={{
                    fontSize: run.sizePt * body.fontScale * PT_PX,
                    fontWeight: run.bold ? 700 : undefined,
                    fontStyle: run.italic ? 'italic' : undefined,
                    textDecoration: [run.underline ? 'underline' : '', run.strike ? 'line-through' : ''].join(' ').trim() || undefined,
                    color: run.color ?? '#000',
                    fontFamily: fontStack(run.font),
                    verticalAlign: run.baseline ? (run.baseline > 0 ? 'super' : 'sub') : undefined,
                  }}
                />
              ),
            )}
          </p>
        )
      })}
    </div>
  )
}

function TableView({ el }: { el: Extract<SlideElement, { kind: 'table' }> }) {
  return (
    <table className="sl-el sl-table" style={{ left: px(el.x), top: px(el.y), width: px(el.colWidths.reduce((a, b) => a + b, 0)) }}>
      <colgroup>
        {el.colWidths.map((w, i) => (
          <col key={i} style={{ width: px(w) }} />
        ))}
      </colgroup>
      <tbody>
        {el.rows.map((row, ri) => (
          <tr key={ri} style={{ height: px(row.h) }}>
            {row.cells.map((c, ci) =>
              c.hidden ? null : (
                <td
                  key={ci}
                  colSpan={c.gridSpan > 1 ? c.gridSpan : undefined}
                  rowSpan={c.rowSpan > 1 ? c.rowSpan : undefined}
                  style={{
                    background: c.fill,
                    borderLeft: lineCss(c.borders.l) ?? '1px solid #fff',
                    borderRight: lineCss(c.borders.r) ?? '1px solid #fff',
                    borderTop: lineCss(c.borders.t) ?? '1px solid #fff',
                    borderBottom: lineCss(c.borders.b) ?? '1px solid #fff',
                    verticalAlign: c.text.anchor === 'middle' ? 'middle' : c.text.anchor === 'bottom' ? 'bottom' : 'top',
                  }}
                >
                  <TextView body={{ ...c.text, anchor: 'top' }} />
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
