import { useEffect, useMemo, useState } from 'react'
import * as XLSX from '@e965/xlsx'
import * as cptable from '@e965/xlsx/dist/cpexcel.full.mjs'
import { decodeText, extOf } from '../lib/detect'
import { errorMessage, type ViewerProps } from './common'

// 예전 .xls(BIFF5)의 한글은 코드 페이지 949로 저장되어 있다
XLSX.set_cptable(cptable)

const MAX_ROWS = 3000
const MAX_COLS = 150

interface Grid {
  rows: number
  cols: number
  firstRow: number
  firstCol: number
  truncated: boolean
  colWidths: number[]
  rowHeights: (number | undefined)[]
  cells: Map<string, { text: string; numeric: boolean; rowSpan: number; colSpan: number }>
  covered: Set<string>
}

function buildGrid(ws: XLSX.WorkSheet): Grid | null {
  if (!ws['!ref']) return null
  const range = XLSX.utils.decode_range(ws['!ref'])
  const rows = Math.min(range.e.r - range.s.r + 1, MAX_ROWS)
  const cols = Math.min(range.e.c - range.s.c + 1, MAX_COLS)
  const truncated = range.e.r - range.s.r + 1 > MAX_ROWS || range.e.c - range.s.c + 1 > MAX_COLS

  const covered = new Set<string>()
  const spans = new Map<string, { rowSpan: number; colSpan: number }>()
  for (const m of ws['!merges'] ?? []) {
    spans.set(`${m.s.r}:${m.s.c}`, { rowSpan: m.e.r - m.s.r + 1, colSpan: m.e.c - m.s.c + 1 })
    for (let r = m.s.r; r <= m.e.r; r++)
      for (let c = m.s.c; c <= m.e.c; c++) if (r !== m.s.r || c !== m.s.c) covered.add(`${r}:${c}`)
  }

  const cells: Grid['cells'] = new Map()
  for (let r = range.s.r; r < range.s.r + rows; r++) {
    for (let c = range.s.c; c < range.s.c + cols; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined
      const span = spans.get(`${r}:${c}`)
      if (!cell && !span) continue
      cells.set(`${r}:${c}`, {
        text: cell ? XLSX.utils.format_cell(cell) : '',
        numeric: cell?.t === 'n',
        rowSpan: span?.rowSpan ?? 1,
        colSpan: span?.colSpan ?? 1,
      })
    }
  }

  const colInfo = ws['!cols'] ?? []
  const rowInfo = ws['!rows'] ?? []
  return {
    rows,
    cols,
    firstRow: range.s.r,
    firstCol: range.s.c,
    truncated,
    colWidths: Array.from({ length: cols }, (_, i) => {
      const ci = colInfo[range.s.c + i]
      if (ci?.hidden) return 0
      return Math.round(ci?.wpx ?? (ci?.wch ? ci.wch * 7 + 5 : 84))
    }),
    rowHeights: Array.from({ length: rows }, (_, i) => {
      const ri = rowInfo[range.s.r + i]
      return ri?.hidden ? 0 : ri?.hpx
    }),
    cells,
    covered,
  }
}

export default function SheetViewer({ bytes, name, zoom, onStatus }: ViewerProps) {
  const [active, setActive] = useState(0)
  const { book, error } = useMemo(() => {
    try {
      const ext = extOf(name)
      const wb =
        ext === 'csv' || ext === 'tsv' || ext === 'txt'
          ? XLSX.read(decodeText(bytes), { type: 'string', FS: ext === 'tsv' ? '\t' : undefined, raw: true })
          : XLSX.read(bytes, { type: 'array', cellDates: true, cellNF: true, dense: false })
      return { book: wb, error: undefined }
    } catch (e) {
      return { book: null, error: errorMessage(e) }
    }
  }, [bytes, name])

  const sheetName = book?.SheetNames[active]
  const grid = useMemo(() => (book && sheetName ? buildGrid(book.Sheets[sheetName]) : null), [book, sheetName])

  useEffect(() => {
    if (book) onStatus?.(`${active + 1} / ${book.SheetNames.length}시트`)
  }, [book, active, onStatus])

  if (error) return <div className="viewer-message">표 문서를 열 수 없습니다.<small>{error}</small></div>
  if (!book) return <div className="viewer-message">불러오는 중…</div>

  return (
    <div className="sheet">
      <div className="sheet-scroll">
        {grid ? <SheetTable grid={grid} zoom={zoom} /> : <div className="viewer-message">빈 시트입니다.</div>}
        {grid?.truncated && (
          <p className="sheet-note">
            표가 커서 앞부분({MAX_ROWS.toLocaleString()}행, {MAX_COLS}열)만 표시합니다.
          </p>
        )}
      </div>
      {book.SheetNames.length > 1 && (
        <nav className="sheet-tabs" aria-label="시트">
          {book.SheetNames.map((n, i) => (
            <button key={n} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
              {n}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

function SheetTable({ grid, zoom }: { grid: Grid; zoom: number }) {
  const colNames = grid.colWidths.map((_, i) => XLSX.utils.encode_col(grid.firstCol + i))
  return (
    <table className="sheet-table" style={{ zoom }}>
      <colgroup>
        <col style={{ width: 44 }} />
        {grid.colWidths.map((w, i) => (
          <col key={i} style={{ width: w }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className="corner" />
          {colNames.map((c, i) => (
            <th key={c} style={grid.colWidths[i] === 0 ? { display: 'none' } : undefined}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: grid.rows }, (_, ri) => {
          const r = grid.firstRow + ri
          const h = grid.rowHeights[ri]
          if (h === 0) return null
          return (
            <tr key={r} style={h ? { height: h } : undefined}>
              <th>{r + 1}</th>
              {Array.from({ length: grid.cols }, (_, ci) => {
                const c = grid.firstCol + ci
                const key = `${r}:${c}`
                if (grid.covered.has(key)) return null
                const cell = grid.cells.get(key)
                const hidden = grid.colWidths[ci] === 0
                return (
                  <td
                    key={key}
                    rowSpan={cell && cell.rowSpan > 1 ? cell.rowSpan : undefined}
                    colSpan={cell && cell.colSpan > 1 ? cell.colSpan : undefined}
                    className={cell?.numeric ? 'num' : undefined}
                    style={hidden ? { display: 'none' } : undefined}
                  >
                    {cell?.text}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
