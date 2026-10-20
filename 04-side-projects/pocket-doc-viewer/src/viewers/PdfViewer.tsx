import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
// legacy 빌드: 최신 JS 기능이 없는 예전 안드로이드 WebView·삼성 인터넷에서도 동작하도록 폴리필이 들어 있다
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PageViewport, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { applyPdfEdits, emptyEdits, type PdfMark } from '../lib/pdfEdit'
import { errorMessage, fitScale, useCurrentPage, useWidth, type ViewerProps } from './common'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// 워커는 assets/ 아래에서 돌기 때문에 상대 경로가 엇나간다. 문서 기준 절대 주소로 바꿔 넘긴다
const ASSETS = new URL(import.meta.env.BASE_URL + 'pdfjs/', document.baseURI).href
/** 캔버스 한 장의 최대 픽셀 수. 휴대폰 메모리를 넘기지 않도록 제한한다 */
const MAX_CANVAS_PIXELS = 12_000_000

interface PageSize {
  w: number
  h: number
  /** 배율 1의 화면 좌표 ↔ PDF 좌표 변환용 */
  vp: PageViewport
}

type Tool = 'hand' | 'pen' | 'marker' | 'text'

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'hand', label: '이동' },
  { id: 'pen', label: '펜' },
  { id: 'marker', label: '형광펜' },
  { id: 'text', label: '글자' },
]
const PEN_COLORS = ['#111111', '#d93a3a', '#2b62c9']
const MARKER = { color: '#ffd400', width: 14, opacity: 0.4 }
const TEXT_SIZE = 16

/** 화면에 그릴 때의 표시. 좌표는 배율 1의 화면 좌표(pt)이며, 저장할 때 PDF 좌표로 바꾼다 */
type Mark = PdfMark

export default function PdfViewer({ bytes, zoom, onStatus, editing, onDirty, saverRef }: ViewerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [sizes, setSizes] = useState<PageSize[]>([])
  const [error, setError] = useState<string>()
  const [needsPassword, setNeedsPassword] = useState<((pw: string) => void) | null>(null)
  const [encrypted, setEncrypted] = useState(false)

  const [tool, setTool] = useState<Tool>('hand')
  const [color, setColor] = useState(PEN_COLORS[0])
  const [marks, setMarks] = useState<Map<number, Mark[]>>(new Map())
  const [history, setHistory] = useState<number[]>([])
  const [rotate, setRotate] = useState<Map<number, number>>(new Map())
  const [removed, setRemoved] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    // pdf.js는 넘겨받은 버퍼를 워커로 옮기므로 사본을 넘긴다
    const task = pdfjs.getDocument({
      data: bytes.slice(),
      cMapUrl: ASSETS + 'cmaps/',
      cMapPacked: true,
      standardFontDataUrl: ASSETS + 'standard_fonts/',
      wasmUrl: ASSETS + 'wasm/',
      iccUrl: ASSETS + 'iccs/',
      enableXfa: false,
    })
    task.onPassword = (update: (pw: string) => void) => {
      if (cancelled) return
      setEncrypted(true)
      setNeedsPassword(() => update)
    }
    task.promise.then(
      async (d) => {
        const list: PageSize[] = []
        for (let i = 1; i <= d.numPages; i++) {
          const vp = (await d.getPage(i)).getViewport({ scale: 1 })
          list.push({ w: vp.width, h: vp.height, vp })
        }
        if (cancelled) return
        setNeedsPassword(null)
        setSizes(list)
        setDoc(d)
      },
      (e) => !cancelled && setError(errorMessage(e)),
    )
    return () => {
      cancelled = true
      void task.destroy()
    }
  }, [bytes])

  const current = useCurrentPage(ref, '.pdf-page', doc ? sizes.length : 0)

  useEffect(() => {
    if (sizes.length) onStatus?.(`${current} / ${sizes.length}쪽`)
  }, [current, sizes.length, onStatus])

  useEffect(() => {
    onDirty?.([...marks.values()].some((m) => m.length) || rotate.size > 0 || removed.size > 0)
  }, [marks, rotate, removed, onDirty])

  useEffect(() => {
    if (!saverRef) return
    saverRef.current = async () => {
      if (encrypted) throw new Error('암호가 걸린 PDF는 편집 내용을 저장할 수 없습니다.')
      const edits = emptyEdits()
      for (const [i, list] of marks) {
        const vp = sizes[i]?.vp
        if (!vp) continue
        const toPdf = (x: number, y: number) => vp.convertToPdfPoint(x, y) as [number, number]
        edits.marks.set(
          i,
          list.map((m) =>
            m.kind === 'ink' ? { ...m, points: m.points.map(([x, y]) => toPdf(x, y)) } : { ...m, ...xy(toPdf(m.x, m.y)) },
          ),
        )
      }
      edits.rotate = rotate
      edits.remove = removed
      return { bytes: await applyPdfEdits(bytes, edits) }
    }
    return () => {
      saverRef.current = null
    }
  }, [saverRef, marks, rotate, removed, sizes, bytes, encrypted])

  if (error) return <div className="viewer-message">PDF를 열 수 없습니다.<small>{error}</small></div>

  const baseWidth = sizes.length ? Math.max(...sizes.map((s) => s.w)) : 0
  const scale = fitScale(width, baseWidth) * zoom

  const addMark = (page: number, m: Mark) => {
    setMarks((prev) => new Map(prev).set(page, [...(prev.get(page) ?? []), m]))
    setHistory((h) => [...h, page])
  }
  const undo = () => {
    const page = history[history.length - 1]
    if (page === undefined) return
    setHistory((h) => h.slice(0, -1))
    setMarks((prev) => new Map(prev).set(page, (prev.get(page) ?? []).slice(0, -1)))
  }

  return (
    <div ref={ref} className={`pdf-pages${editing ? ' is-editing' : ''}`}>
      {needsPassword && <PasswordPrompt onSubmit={(pw) => needsPassword(pw)} />}
      {!doc && !needsPassword && <div className="viewer-message">불러오는 중…</div>}
      {editing && encrypted && <p className="edit-hint">암호가 걸린 PDF는 편집할 수 없습니다.</p>}
      {doc &&
        sizes.map((s, i) => (
          <div key={i} className="pdf-page-wrap">
            <PdfPage
              doc={doc}
              pageNumber={i + 1}
              size={s}
              scale={scale}
              editing={!!editing && !encrypted}
              tool={tool}
              color={color}
              marks={marks.get(i) ?? []}
              removed={removed.has(i)}
              onMark={(m) => addMark(i, m)}
            />
            {editing && !encrypted && (
              <div className="pdf-page-tools">
                <span>{i + 1}쪽</span>
                {!!rotate.get(i) && <span className="badge-soft">저장하면 {rotate.get(i)}° 회전</span>}
                <button
                  className="chip"
                  onClick={() => setRotate((prev) => new Map(prev).set(i, ((prev.get(i) ?? 0) + 90) % 360))}
                >
                  ↻ 회전
                </button>
                <button
                  className="chip"
                  disabled={!removed.has(i) && removed.size >= sizes.length - 1}
                  onClick={() =>
                    setRemoved((prev) => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      return next
                    })
                  }
                >
                  {removed.has(i) ? '되살리기' : '쪽 삭제'}
                </button>
              </div>
            )}
          </div>
        ))}
      {editing && doc && !encrypted && (
        <div className="pdf-toolbar" role="toolbar" aria-label="PDF 편집 도구">
          {TOOLS.map((t) => (
            <button key={t.id} className={`chip${tool === t.id ? ' on' : ''}`} aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
              {t.label}
            </button>
          ))}
          <span className="pdf-colors">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                className={`swatch${color === c ? ' on' : ''}`}
                style={{ background: c }}
                aria-label={`색 ${c}`}
                onClick={() => setColor(c)}
              />
            ))}
          </span>
          <button className="chip" onClick={undo} disabled={history.length === 0}>
            ↶ 되돌리기
          </button>
        </div>
      )}
    </div>
  )
}

function xy([x, y]: [number, number]) {
  return { x, y }
}

function PdfPage({
  doc,
  pageNumber,
  size,
  scale,
  editing,
  tool,
  color,
  marks,
  removed,
  onMark,
}: {
  doc: PDFDocumentProxy
  pageNumber: number
  size: PageSize
  scale: number
  editing: boolean
  tool: Tool
  color: string
  marks: Mark[]
  removed: boolean
  onMark: (m: Mark) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(false)
  const [live, setLive] = useState<[number, number][] | null>(null)
  const [draftAt, setDraftAt] = useState<{ x: number; y: number } | null>(null)
  const [draftText, setDraftText] = useState('')

  // 화면 근처에 온 쪽만 그린다. 멀어지면 캔버스를 비워 메모리를 돌려준다
  useEffect(() => {
    const el = box.current!
    const nearObs = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '150% 0px' })
    nearObs.observe(el)
    return () => nearObs.disconnect()
  }, [])

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    if (!near) {
      c.width = c.height = 0
      return
    }
    let task: RenderTask | undefined
    let cancelled = false
    // 두 손가락 확대 중에는 매번 다시 그리지 않고 잠시 멈췄을 때 그린다
    const timer = setTimeout(async () => {
      const page = await doc.getPage(pageNumber)
      if (cancelled) return
      let ratio = (window.devicePixelRatio || 1) * scale
      const pixels = size.w * size.h * ratio * ratio
      if (pixels > MAX_CANVAS_PIXELS) ratio *= Math.sqrt(MAX_CANVAS_PIXELS / pixels)
      const vp = page.getViewport({ scale: ratio })
      const off = document.createElement('canvas')
      off.width = Math.floor(vp.width)
      off.height = Math.floor(vp.height)
      task = page.render({ canvas: off, viewport: vp })
      try {
        await task.promise
      } catch {
        return
      }
      if (cancelled) return
      c.width = off.width
      c.height = off.height
      c.getContext('2d')!.drawImage(off, 0, 0)
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
      task?.cancel()
    }
  }, [near, scale, doc, pageNumber, size])

  const point = (e: ReactPointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * size.w, ((e.clientY - r.top) / r.height) * size.h]
  }

  const drawing = editing && !removed && tool !== 'hand'

  return (
    <div
      ref={box}
      className={`paper pdf-page${removed ? ' pdf-removed' : ''}`}
      style={{ width: size.w * scale, height: size.h * scale }}
      aria-label={`${pageNumber}쪽`}
    >
      <canvas ref={canvas} />
      <svg
        className="pdf-ink"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        style={{ pointerEvents: drawing ? 'auto' : 'none', touchAction: drawing ? 'none' : undefined }}
        onPointerDown={(e) => {
          if (!drawing || !e.isPrimary) return
          if (tool === 'text') {
            const [x, y] = point(e)
            setDraftAt({ x, y })
            setDraftText('')
            return
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          setLive([point(e)])
        }}
        onPointerMove={(e) => {
          if (!live || !e.isPrimary) return
          const p = point(e)
          setLive((pts) => (pts ? [...pts, p] : pts))
        }}
        onPointerUp={() => {
          if (!live) return
          onMark(
            tool === 'marker'
              ? { kind: 'ink', points: live, ...MARKER }
              : { kind: 'ink', points: live, color, width: 2, opacity: 1 },
          )
          setLive(null)
        }}
        onPointerCancel={() => setLive(null)}
      >
        {marks.map((m, i) => (m.kind === 'ink' ? <Ink key={i} {...m} /> : <TextMark key={i} {...m} />))}
        {live && (tool === 'marker' ? <Ink points={live} {...MARKER} /> : <Ink points={live} color={color} width={2} opacity={1} />)}
      </svg>
      {removed && <div className="pdf-removed-label">저장하면 이 쪽이 삭제됩니다</div>}
      {draftAt && (
        <form
          className="pdf-text-draft"
          style={{ left: draftAt.x * scale, top: draftAt.y * scale }}
          onSubmit={(e) => {
            e.preventDefault()
            if (draftText.trim()) onMark({ kind: 'text', x: draftAt.x, y: draftAt.y, text: draftText, sizePt: TEXT_SIZE, color })
            setDraftAt(null)
          }}
        >
          <textarea
            id={`pdf-text-${pageNumber}`}
            autoFocus
            rows={2}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="넣을 글자"
          />
          <div>
            <button type="button" className="chip" onClick={() => setDraftAt(null)}>
              취소
            </button>
            <button type="submit" className="chip on">
              넣기
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Ink({ points, color, width, opacity }: { points: [number, number][]; color: string; width: number; opacity: number }) {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <path
      d={points.length === 1 ? `${d} l0.01 0` : d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function TextMark({ x, y, text, sizePt, color }: { x: number; y: number; text: string; sizePt: number; color: string }) {
  return (
    <text x={x} y={y} fill={color} fontSize={sizePt} dominantBaseline="hanging" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {text.split('\n').map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? sizePt * 0.1 : sizePt * 1.3}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function PasswordPrompt({ onSubmit }: { onSubmit: (pw: string) => void }) {
  const [pw, setPw] = useState('')
  return (
    <form
      className="viewer-message"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(pw)
      }}
    >
      암호가 걸린 PDF입니다.
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="암호" autoFocus />
      <button type="submit" className="btn primary">열기</button>
    </form>
  )
}
