import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { parseDocx, type DocxBlock, type DocxDocument, type DocxPara, type DocxRun, type DocxTable } from '../lib/docx'
import { errorMessage, fitScale, useWidth, type ViewerProps } from './common'
import { EditableText } from './Editable'
import { EditingContext } from './editing'

/** twip(1/1440 inch) → CSS px */
const tw = (v: number) => v / 15
const PT_PX = 4 / 3

function runCss(r: DocxRun): CSSProperties {
  return {
    fontWeight: r.bold ? 700 : undefined,
    fontStyle: r.italic ? 'italic' : undefined,
    textDecoration: [r.underline ? 'underline' : '', r.strike ? 'line-through' : ''].join(' ').trim() || undefined,
    fontSize: r.sizePt ? r.sizePt * PT_PX : undefined,
    color: r.color,
    background: r.highlight,
  }
}

/** Word 편집 화면. 줄 배치는 간단히 그리지만, 글자는 원본 문서의 그 자리(w:t)를 직접 고친다 */
export default function DocxEditView({ bytes, zoom, onDirty, saverRef }: ViewerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const [doc, setDoc] = useState<DocxDocument | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let parsed: DocxDocument | undefined
    let cancelled = false
    parseDocx(bytes).then(
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

  useEffect(() => {
    if (!doc) return
    const unsubscribe = doc.zip.subscribe(() => onDirty?.(doc.zip.dirty))
    if (saverRef) saverRef.current = async () => ({ bytes: await doc.zip.save() })
    return () => {
      unsubscribe()
      if (saverRef) saverRef.current = null
    }
  }, [doc, onDirty, saverRef])

  if (error) return <div className="viewer-message">Word 문서를 편집할 수 없습니다.<small>{error}</small></div>
  if (!doc) return <div ref={ref} className="viewer-message">편집 준비 중…</div>

  const pageW = tw(doc.pageWidth)
  return (
    <div ref={ref} className="docx-edit-outer">
      <p className="edit-hint">글자를 눌러 고치세요. 줄 배치는 간단히 보이며, 저장하면 원래 서식 그대로 Word 문서에 반영됩니다.</p>
      <EditingContext.Provider value>
        <div className="docx-edit is-editing" style={{ zoom: fitScale(width, pageW) * zoom }}>
          <div
            className="paper docx-edit-page"
            style={{
              width: pageW,
              padding: `${tw(doc.margins.top)}px ${tw(doc.margins.right)}px ${tw(doc.margins.bottom)}px ${tw(doc.margins.left)}px`,
            }}
          >
            <Blocks blocks={doc.blocks} />
          </div>
        </div>
      </EditingContext.Provider>
    </div>
  )
}

function Blocks({ blocks }: { blocks: DocxBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (b.kind === 'p' ? <Para key={i} p={b} /> : <Table key={i} t={b} />))}
    </>
  )
}

function Para({ p }: { p: DocxPara }) {
  return (
    <div
      className="docx-edit-p"
      style={{
        textAlign: p.align,
        paddingLeft: tw(p.left + (p.bullet ? 360 : 0)),
        textIndent: tw(p.firstLine),
        marginTop: tw(p.before),
        marginBottom: tw(p.after),
        fontSize: p.sizePt * PT_PX,
      }}
    >
      {p.bullet && <span className="docx-bullet">{p.bullet} </span>}
      {p.runs.map((r, i) =>
        r.image ? (
          <img key={i} src={r.image.src} alt="" style={{ width: r.image.width, height: r.image.height, maxWidth: '100%' }} />
        ) : r.tab ? (
          <span key={i} className="hwpx-tab" />
        ) : r.br ? (
          <br key={i} />
        ) : (
          <EditableText key={i} slot={r.slot} text={r.text} style={runCss(r)} />
        ),
      )}
    </div>
  )
}

function Table({ t }: { t: DocxTable }) {
  const total = t.colWidths.reduce((a, b) => a + b, 0)
  return (
    <table className="docx-edit-table" style={{ width: total ? tw(total) : '100%' }}>
      {total > 0 && (
        <colgroup>
          {t.colWidths.map((w, i) => (
            <col key={i} style={{ width: tw(w) }} />
          ))}
        </colgroup>
      )}
      <tbody>
        {t.rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((c, ci) => (
              <td
                key={ci}
                colSpan={c.span > 1 ? c.span : undefined}
                rowSpan={c.rowSpan > 1 ? c.rowSpan : undefined}
                style={{ background: c.shade }}
              >
                <Blocks blocks={c.blocks} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
