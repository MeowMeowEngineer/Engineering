import { useEffect, useRef, useState } from 'react'
// legacy 빌드: 최신 JS 기능이 없는 예전 안드로이드 WebView·삼성 인터넷에서도 동작하도록 폴리필이 들어 있다
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { errorMessage, fitScale, useCurrentPage, useWidth, type ViewerProps } from './common'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// 워커는 assets/ 아래에서 돌기 때문에 상대 경로가 엇나간다. 문서 기준 절대 주소로 바꿔 넘긴다
const ASSETS = new URL(import.meta.env.BASE_URL + 'pdfjs/', document.baseURI).href
/** 캔버스 한 장의 최대 픽셀 수. 휴대폰 메모리를 넘기지 않도록 제한한다 */
const MAX_CANVAS_PIXELS = 12_000_000

interface PageSize {
  w: number
  h: number
}

export default function PdfViewer({ bytes, zoom, onStatus }: ViewerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [sizes, setSizes] = useState<PageSize[]>([])
  const [error, setError] = useState<string>()
  const [needsPassword, setNeedsPassword] = useState<((pw: string) => void) | null>(null)

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
      if (!cancelled) setNeedsPassword(() => update)
    }
    task.promise.then(
      async (d) => {
        const list: PageSize[] = []
        for (let i = 1; i <= d.numPages; i++) {
          const vp = (await d.getPage(i)).getViewport({ scale: 1 })
          list.push({ w: vp.width, h: vp.height })
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

  if (error) return <div className="viewer-message">PDF를 열 수 없습니다.<small>{error}</small></div>

  const baseWidth = sizes.length ? Math.max(...sizes.map((s) => s.w)) : 0
  const scale = fitScale(width, baseWidth) * zoom

  return (
    <div ref={ref} className="pdf-pages">
      {needsPassword && <PasswordPrompt onSubmit={(pw) => needsPassword(pw)} />}
      {!doc && !needsPassword && <div className="viewer-message">불러오는 중…</div>}
      {doc &&
        sizes.map((s, i) => (
          <PdfPage key={i} doc={doc} pageNumber={i + 1} size={s} scale={scale} />
        ))}
    </div>
  )
}

function PdfPage({
  doc,
  pageNumber,
  size,
  scale,
}: {
  doc: PDFDocumentProxy
  pageNumber: number
  size: PageSize
  scale: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(false)

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

  return (
    <div
      ref={box}
      className="paper pdf-page"
      style={{ width: size.w * scale, height: size.h * scale }}
      aria-label={`${pageNumber}쪽`}
    >
      <canvas ref={canvas} />
    </div>
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
