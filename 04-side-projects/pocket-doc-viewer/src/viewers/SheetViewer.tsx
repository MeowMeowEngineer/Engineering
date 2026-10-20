import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from '@e965/xlsx'
import * as cptable from '@e965/xlsx/dist/cpexcel.full.mjs'
import { decodeText, extOf } from '../lib/detect'
import { parseCellInput, XlsxEditor, type CellInput } from '../lib/xlsxEdit'
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

/** 편집 화면에서는 A1부터, 아래·오른쪽에 빈 칸을 더 붙여 새 값을 넣을 수 있게 한다 */
function buildGrid(ws: XLSX.WorkSheet, editing: boolean): Grid | null {
  if (!ws['!ref'] && !editing) return null
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  if (editing) {
    range.s = { r: 0, c: 0 }
    range.e = { r: range.e.r + 20, c: Math.max(range.e.c + 3, 7) }
  }
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

/** 저장 방식: xlsx는 원본 XML을 고치고, 나머지는 SheetJS로 같은 형식으로 다시 쓴다 */
type SaveMode = 'xlsx' | 'xls' | 'ods' | 'csv' | 'tsv'

function saveModeOf(bytes: Uint8Array, name: string): SaveMode {
  const ext = extOf(name)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return ext === 'ods' ? 'ods' : 'xlsx'
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) return 'xls'
  return ext === 'tsv' ? 'tsv' : 'csv'
}

/** 화면에 보이는 SheetJS 시트도 같은 값으로 바꾼다 */
function applyToSheet(ws: XLSX.WorkSheet, addr: string, input: CellInput) {
  if (input.kind === 'empty') delete ws[addr]
  else if (input.kind === 'number') ws[addr] = { t: 'n', v: input.value }
  else if (input.kind === 'text') ws[addr] = { t: 's', v: input.value }
  else ws[addr] = { t: 's', v: '=' + input.formula, f: input.formula }
  const { r, c } = XLSX.utils.decode_cell(addr)
  const range = XLSX.utils.decode_range(ws['!ref'] ?? addr)
  range.s.r = Math.min(range.s.r, r)
  range.s.c = Math.min(range.s.c, c)
  range.e.r = Math.max(range.e.r, r)
  range.e.c = Math.max(range.e.c, c)
  ws['!ref'] = XLSX.utils.encode_range(range)
}

function rawValue(cell: XLSX.CellObject | undefined): string {
  if (!cell) return ''
  if (cell.f) return '=' + cell.f
  if (cell.v instanceof Date) return cell.w ?? XLSX.utils.format_cell(cell)
  return cell.v == null ? '' : String(cell.v)
}

export default function SheetViewer({ bytes, name, zoom, onStatus, editing, onDirty, saverRef }: ViewerProps) {
  const [active, setActive] = useState(0)
  const [rev, setRev] = useState(0)
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [input, setInput] = useState('')
  const [editError, setEditError] = useState<string>()
  const editor = useRef<Promise<XlsxEditor> | null>(null)
  const mode = useMemo(() => saveModeOf(bytes, name), [bytes, name])
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
  const grid = useMemo(() => {
    // 시트 객체는 제자리에서 고치므로, 고칠 때마다 올리는 rev로 다시 계산한다
    void rev
    return book && sheetName ? buildGrid(book.Sheets[sheetName], !!editing) : null
  }, [book, sheetName, editing, rev])

  useEffect(() => {
    if (!saverRef || !book) return
    saverRef.current = async () => {
      switch (mode) {
        case 'xlsx':
          return { bytes: editor.current ? await (await editor.current).save() : bytes }
        case 'csv':
        case 'tsv': {
          const ws = book.Sheets[book.SheetNames[0]]
          // BOM을 붙여야 Excel이 한글 CSV를 UTF-8로 바르게 연다
          const text = '\ufeff' + XLSX.utils.sheet_to_csv(ws, { FS: mode === 'tsv' ? '\t' : ',' })
          return { bytes: new TextEncoder().encode(text) }
        }
        default:
          return { bytes: new Uint8Array(XLSX.write(book, { type: 'array', bookType: mode === 'xls' ? 'biff8' : 'ods' })) }
      }
    }
    return () => {
      saverRef.current = null
    }
  }, [saverRef, book, mode, bytes])

  const select = (r: number, c: number) => {
    if (!book || !sheetName) return
    setSel({ r, c })
    setEditError(undefined)
    setInput(rawValue(book.Sheets[sheetName][XLSX.utils.encode_cell({ r, c })]))
  }

  const commit = async () => {
    if (!book || !sheetName || !sel) return
    const addr = XLSX.utils.encode_cell(sel)
    const ws = book.Sheets[sheetName]
    if (input === rawValue(ws[addr])) return
    const parsed = parseCellInput(input)
    try {
      if (mode === 'xlsx') {
        editor.current ??= XlsxEditor.load(bytes)
        await (await editor.current).setCell(sheetName, addr, parsed)
      }
      applyToSheet(ws, addr, parsed)
      setRev((v) => v + 1)
      onDirty?.(true)
      setEditError(undefined)
    } catch (e) {
      setEditError(errorMessage(e))
    }
  }

  useEffect(() => {
    if (book) onStatus?.(`${active + 1} / ${book.SheetNames.length}시트`)
  }, [book, active, onStatus])

  if (error) return <div className="viewer-message">표 문서를 열 수 없습니다.<small>{error}</small></div>
  if (!book) return <div className="viewer-message">불러오는 중…</div>

  return (
    <div className="sheet">
      {editing && (
        <div className="formula-bar">
          {sel ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void commit()
              }}
            >
              <span className="addr">{XLSX.utils.encode_cell(sel)}</span>
              <input
                id="cell-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="값 또는 =수식"
                autoComplete="off"
                enterKeyHint="done"
              />
              <button type="submit" className="btn primary">
                입력
              </button>
            </form>
          ) : (
            <p>고칠 칸을 누르세요. =로 시작하면 수식으로 저장되고, Excel에서 열 때 다시 계산됩니다.</p>
          )}
          {editError && <p className="error">{editError}</p>}
          {mode !== 'xlsx' && (
            <p className="muted">
              {mode.toUpperCase()} 형식은 표 내용만 다시 써서 저장합니다. 글꼴·색 같은 서식은 사라질 수 있습니다.
            </p>
          )}
        </div>
      )}
      <div className="sheet-scroll">
        {grid ? (
          <SheetTable grid={grid} zoom={zoom} selected={editing ? sel : null} onSelect={editing ? select : undefined} />
        ) : (
          <div className="viewer-message">빈 시트입니다.</div>
        )}
        {grid?.truncated && (
          <p className="sheet-note">
            표가 커서 앞부분({MAX_ROWS.toLocaleString()}행, {MAX_COLS}열)만 표시합니다.
          </p>
        )}
      </div>
      {book.SheetNames.length > 1 && (
        <nav className="sheet-tabs" aria-label="시트">
          {book.SheetNames.map((n, i) => (
            <button
              key={n}
              className={i === active ? 'on' : ''}
              onClick={() => {
                setActive(i)
                setSel(null)
              }}
            >
              {n}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

function SheetTable({
  grid,
  zoom,
  selected,
  onSelect,
}: {
  grid: Grid
  zoom: number
  selected?: { r: number; c: number } | null
  onSelect?: (r: number, c: number) => void
}) {
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
                    className={[cell?.numeric ? 'num' : '', selected?.r === r && selected?.c === c ? 'sel' : ''].join(' ').trim() || undefined}
                    style={hidden ? { display: 'none' } : undefined}
                    onClick={onSelect ? () => onSelect(r, c) : undefined}
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
