import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { parseHwpx, type Border, type BorderFill, type CharStyle, type HwpxDocument, type Para, type Table } from '../lib/hwpx'
import { errorMessage, fitScale, useWidth, type ViewerProps } from './common'
import { EditableText } from './Editable'
import { EditingContext } from './editing'

/** HWPUNIT(1/7200 inch) → CSS px(1/96 inch) */
const u = (v: number) => v / 75
const PT_PX = 4 / 3

const SERIF = /바탕|명조|궁서|Batang|Myeongjo|Gungsuh|serif/i

function fontFamily(face?: string) {
  const serif = face && SERIF.test(face)
  const fallback = serif
    ? '"Noto Serif KR", "Nanum Myeongjo", AppleMyungjo, Batang, serif'
    : '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif'
  return face ? `"${face}", ${fallback}` : fallback
}

function charCss(s: CharStyle): CSSProperties {
  return {
    fontSize: s.sizePt * PT_PX,
    color: s.color && s.color !== '#000000' ? s.color : undefined,
    fontWeight: s.bold ? 700 : undefined,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: [s.underline ? 'underline' : '', s.strike ? 'line-through' : ''].join(' ').trim() || undefined,
    fontFamily: fontFamily(s.font),
    background: s.shade && s.shade !== '#ffffff' ? s.shade : undefined,
    verticalAlign: s.script === 'sup' ? 'super' : s.script === 'sub' ? 'sub' : undefined,
  }
}

function borderCss(b: Border): string {
  if (b.style === 'none') return 'none'
  const w = Math.max(1, Math.round(b.widthMm * 3.78))
  return `${b.style === 'double' ? Math.max(3, w) : w}px ${b.style} ${b.color}`
}

function fillCss(bf?: BorderFill): CSSProperties {
  if (!bf) return {}
  return {
    borderLeft: borderCss(bf.left),
    borderRight: borderCss(bf.right),
    borderTop: borderCss(bf.top),
    borderBottom: borderCss(bf.bottom),
    background: bf.fill && bf.fill.toLowerCase() !== '#ffffff' ? bf.fill : undefined,
  }
}

export default function HwpxViewer({ bytes, zoom, onStatus, editing, onDirty, saverRef }: ViewerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const [doc, setDoc] = useState<HwpxDocument | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let parsed: HwpxDocument | undefined
    let cancelled = false
    parseHwpx(bytes).then(
      (d) => {
        parsed = d
        if (cancelled) d.objectUrls.forEach(URL.revokeObjectURL)
        else {
          setDoc(d)
          onStatus?.(`${d.sections.reduce((n, s) => n + s.pages.length, 0)}쪽`)
        }
      },
      (e) => !cancelled && setError(errorMessage(e)),
    )
    return () => {
      cancelled = true
      parsed?.objectUrls.forEach(URL.revokeObjectURL)
    }
  }, [bytes, onStatus])

  useEffect(() => {
    if (!doc) return
    const unsubscribe = doc.zip.subscribe(() => onDirty?.(doc.zip.dirty))
    if (saverRef) saverRef.current = async () => ({ bytes: await doc.zip.save() })
    return () => {
      unsubscribe()
      if (saverRef) saverRef.current = null
    }
  }, [doc, onDirty, saverRef])

  if (error) return <div className="viewer-message">한글(HWPX) 문서를 열 수 없습니다.<small>{error}</small></div>

  const pageWidth = doc ? Math.max(...doc.sections.map((s) => u(s.page.width))) : 0
  const scale = fitScale(width, pageWidth) * zoom
  return (
    <div ref={ref} className="hwpx-outer">
      {!doc && <div className="viewer-message">불러오는 중…</div>}
      {doc && (
        <EditingContext.Provider value={!!editing}>
        <div className={`hwpx${editing ? ' is-editing' : ''}`} style={{ zoom: scale }}>
          {doc.sections.map((sec, si) =>
            sec.pages.map((paras, pi) => (
              <div
                key={`${si}-${pi}`}
                className="paper hwpx-page"
                style={{
                  width: u(sec.page.width),
                  minHeight: u(sec.page.height),
                  padding: `${u(sec.page.top)}px ${u(sec.page.right)}px ${u(sec.page.bottom)}px ${u(sec.page.left)}px`,
                }}
              >
                {paras.map((p, i) => (
                  <ParaView key={i} p={p} />
                ))}
              </div>
            )),
          )}
        </div>
        </EditingContext.Provider>
      )}
    </div>
  )
}

function ParaView({ p }: { p: Para }) {
  const s = p.style
  const hanging = s.indent < 0 ? -s.indent : 0
  const lineHeight =
    s.lineSpacing.kind === 'percent' ? Math.max(1, s.lineSpacing.value / 100) * 1.0 : `${u(s.lineSpacing.value)}px`
  return (
    <div
      className="hwpx-p"
      style={{
        textAlign: s.align,
        paddingLeft: u(s.left + hanging),
        paddingRight: u(s.right),
        textIndent: u(s.indent),
        marginTop: u(s.prev),
        marginBottom: u(s.next),
        lineHeight,
        fontSize: p.baseSizePt * PT_PX,
      }}
    >
      {p.items.length === 0 && ' '}
      {p.items.map((it, i) => {
        switch (it.type) {
          case 'text':
            return <EditableText key={i} slot={it.slot} text={it.text} style={charCss(it.style)} />
          case 'tab':
            return <span key={i} className="hwpx-tab" />
          case 'br':
            return <br key={i} />
          case 'image':
            return (
              <img
                key={i}
                src={it.src}
                alt=""
                className="hwpx-img"
                style={{ width: it.width ? u(it.width) : undefined, height: it.height ? u(it.height) : undefined }}
              />
            )
          case 'box':
            return (
              <div key={i} className="hwpx-box" style={{ width: it.width ? u(it.width) : undefined }}>
                {it.paras.map((bp, j) => (
                  <ParaView key={j} p={bp} />
                ))}
              </div>
            )
          case 'table':
            return <TableView key={i} t={it.table} />
        }
      })}
    </div>
  )
}

function TableView({ t }: { t: Table }) {
  const rows: Table['cells'][] = Array.from({ length: t.rowCount }, () => [])
  for (const c of t.cells) rows[c.row]?.push(c)
  for (const r of rows) r.sort((a, b) => a.col - b.col)
  const total = t.colWidths.reduce((a, b) => a + b, 0)
  return (
    <table className="hwpx-table" style={{ width: u(total), ...fillCss(t.border) }}>
      <colgroup>
        {t.colWidths.map((w, i) => (
          <col key={i} style={{ width: u(w) }} />
        ))}
      </colgroup>
      <tbody>
        {rows.map((cells, ri) => (
          <tr key={ri}>
            {cells.map((c, ci) => (
              <td
                key={ci}
                rowSpan={c.rowSpan > 1 ? c.rowSpan : undefined}
                colSpan={c.colSpan > 1 ? c.colSpan : undefined}
                style={{
                  ...fillCss(c.border),
                  height: c.rowSpan === 1 && c.height ? u(c.height) : undefined,
                  verticalAlign: c.vAlign,
                  padding: c.padding.map((v) => `${u(v)}px`).join(' '),
                }}
              >
                {c.paras.map((p, i) => (
                  <ParaView key={i} p={p} />
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
