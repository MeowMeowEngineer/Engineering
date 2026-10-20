import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { ACCEPT, detectType, UnsupportedError, type DocKind, type DocType } from './lib/detect'
import { clearRecent, listRecent, loadRecent, removeRecent, saveRecent, type RecentEntry } from './lib/recent'
import { initNative, isNative } from './lib/native'
import type { ViewerProps } from './viewers/common'
import { usePinchZoom } from './usePinchZoom'

// 형식별 뷰어는 처음 열 때 내려받는다 (첫 화면을 가볍게)
const VIEWERS: Record<DocKind, ComponentType<ViewerProps>> = {
  pdf: lazy(() => import('./viewers/PdfViewer')),
  word: lazy(() => import('./viewers/DocxViewer')),
  sheet: lazy(() => import('./viewers/SheetViewer')),
  slide: lazy(() => import('./viewers/PptxViewer')),
  hwp: lazy(() => import('./viewers/HwpViewer')),
  hwpx: lazy(() => import('./viewers/HwpxViewer')),
  text: lazy(() => import('./viewers/TextViewer')),
}

const KIND_COLOR: Record<DocKind, string> = {
  pdf: 'var(--c-pdf)',
  word: 'var(--c-word)',
  sheet: 'var(--c-sheet)',
  slide: 'var(--c-slide)',
  hwp: 'var(--c-hwp)',
  hwpx: 'var(--c-hwp)',
  text: 'var(--c-text)',
}

const LABEL_KIND: Record<string, DocKind> = {
  PDF: 'pdf',
  DOCX: 'word',
  XLSX: 'sheet',
  XLS: 'sheet',
  ODS: 'sheet',
  CSV: 'sheet',
  TSV: 'sheet',
  PPTX: 'slide',
  HWP: 'hwp',
  HWPX: 'hwpx',
}

interface OpenDoc {
  name: string
  bytes: Uint8Array
  type: DocType
}

const SAMPLES: { file: string; title: string; kind: DocKind }[] = [
  { file: 'sample.pdf', title: 'PDF', kind: 'pdf' },
  { file: 'sample.docx', title: 'Word', kind: 'word' },
  { file: 'sample.xlsx', title: 'Excel', kind: 'sheet' },
  { file: 'sample.pptx', title: 'PPT', kind: 'slide' },
  { file: 'sample.hwpx', title: '한글', kind: 'hwpx' },
]

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(t: number) {
  const d = new Date(t)
  if (d.toDateString() === new Date().toDateString())
    return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default function App() {
  const [doc, setDoc] = useState<OpenDoc | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [recent, setRecent] = useState<RecentEntry[]>([])
  const docRef = useRef<OpenDoc | null>(null)
  useEffect(() => {
    docRef.current = doc
  }, [doc])

  const refreshRecent = useCallback(() => void listRecent().then(setRecent), [])
  useEffect(refreshRecent, [refreshRecent])

  const open = useCallback(
    async (name: string, bytes: Uint8Array, remember = true) => {
      setError(undefined)
      setBusy(true)
      try {
        const type = await detectType(name, bytes)
        setDoc({ name, bytes, type })
        // 브라우저 뒤로 가기로 문서를 닫을 수 있게 기록을 하나 쌓는다
        if (!isNative()) history.pushState({ doc: true }, '')
        if (remember) void saveRecent(name, type.label, bytes).then(refreshRecent)
      } catch (e) {
        setError(
          e instanceof UnsupportedError ? e.message : `파일을 열 수 없습니다. (${e instanceof Error ? e.message : e})`,
        )
      } finally {
        setBusy(false)
      }
    },
    [refreshRecent],
  )

  const openFile = useCallback(
    async (file: File) => open(file.name, new Uint8Array(await file.arrayBuffer())),
    [open],
  )

  const close = useCallback(() => {
    if (!isNative() && history.state?.doc) history.back()
    else setDoc(null)
  }, [])

  useEffect(() => {
    const onPop = () => setDoc(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // 안드로이드 앱: 다른 앱에서 '열기'로 넘어온 파일, 뒤로 가기 버튼
  useEffect(() => {
    let dispose = () => {}
    let disposed = false
    void initNative({
      onFile: (name, bytes) => void open(name, bytes),
      onError: setError,
      onBack: () => {
        if (!docRef.current) return false
        setDoc(null)
        return true
      },
    }).then((d) => (disposed ? d() : (dispose = d)))
    return () => {
      disposed = true
      dispose()
    }
  }, [open])

  // 설치한 PWA(데스크톱 크롬): 파일 탐색기의 '연결 프로그램'으로 열기
  useEffect(() => {
    type LaunchQueue = { setConsumer(cb: (p: { files: FileSystemFileHandle[] }) => void): void }
    const lq = (window as unknown as { launchQueue?: LaunchQueue }).launchQueue
    lq?.setConsumer(async ({ files }) => {
      if (files[0]) void openFile(await files[0].getFile())
    })
  }, [openFile])

  if (doc) return <ViewerScreen doc={doc} onClose={close} />

  return (
    <Home
      busy={busy}
      error={error}
      recent={recent}
      onFile={openFile}
      onSample={async (file) => {
        const res = await fetch(import.meta.env.BASE_URL + 'samples/' + file)
        void open(file, new Uint8Array(await res.arrayBuffer()), false)
      }}
      onRecent={async (id) => {
        const r = await loadRecent(id)
        if (r) void open(r.entry.name, r.bytes)
        else refreshRecent()
      }}
      onRemove={async (id) => {
        await removeRecent(id)
        refreshRecent()
      }}
      onClear={async () => {
        await clearRecent()
        refreshRecent()
      }}
    />
  )
}

function FileBadge({ kind, label }: { kind: DocKind; label: string }) {
  return (
    <span className="badge" style={{ background: KIND_COLOR[kind] }} aria-hidden>
      {label}
    </span>
  )
}

function Home(props: {
  busy: boolean
  error?: string
  recent: RecentEntry[]
  onFile: (f: File) => void
  onSample: (file: string) => void
  onRecent: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  return (
    <main
      className={`home${drag ? ' drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f) props.onFile(f)
      }}
    >
      <header className="home-head">
        <img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" width={48} height={48} />
        <div>
          <h1>포켓 문서 뷰어</h1>
          <p>워드 · 엑셀 · 피피티 · PDF · 한글을 휴대폰에서 바로</p>
        </div>
      </header>

      <section className="open-card">
        <button className="btn primary big" onClick={() => input.current?.click()} disabled={props.busy}>
          {props.busy ? '여는 중…' : '문서 열기'}
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) props.onFile(f)
            e.target.value = ''
          }}
        />
        <div className="formats">
          {['PDF', 'DOCX', 'XLSX', 'PPTX', 'HWP', 'HWPX', 'CSV'].map((l) => (
            <FileBadge key={l} kind={LABEL_KIND[l]} label={l} />
          ))}
        </div>
        {props.error && (
          <p className="error" role="alert">
            {props.error}
          </p>
        )}
      </section>

      <section>
        <h2>샘플로 체험하기</h2>
        <div className="samples">
          {SAMPLES.map((s) => (
            <button key={s.file} className="sample" onClick={() => props.onSample(s.file)}>
              <span className="sample-dot" style={{ background: KIND_COLOR[s.kind] }} />
              {s.title}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="row-between">
          <h2>최근 문서</h2>
          {props.recent.length > 0 && (
            <button className="link" onClick={props.onClear}>
              모두 지우기
            </button>
          )}
        </div>
        {props.recent.length === 0 ? (
          <p className="muted">열어 본 문서가 여기에 표시됩니다.</p>
        ) : (
          <ul className="recent">
            {props.recent.map((r) => (
              <li key={r.id}>
                <button className="recent-item" onClick={() => props.onRecent(r.id)}>
                  <FileBadge kind={LABEL_KIND[r.label] ?? 'text'} label={r.label} />
                  <span className="recent-name">{r.name}</span>
                  <span className="recent-meta">
                    {formatDate(r.openedAt)} · {formatSize(r.size)}
                  </span>
                </button>
                <button className="icon-btn" aria-label={`${r.name} 목록에서 지우기`} onClick={() => props.onRemove(r.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="privacy">
        🔒 문서는 이 기기 안에서만 열립니다. 서버로 보내지 않고, 광고·회원가입·인터넷 연결이 필요 없습니다.
      </footer>
    </main>
  )
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

function ViewerScreen({ doc, onClose }: { doc: OpenDoc; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const [status, setStatus] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const Viewer = VIEWERS[doc.type.kind]
  usePinchZoom(scroller, zoom, setZoom)

  const step = (dir: 1 | -1) => {
    const next =
      dir > 0 ? ZOOM_STEPS.find((z) => z > zoom + 0.01) : [...ZOOM_STEPS].reverse().find((z) => z < zoom - 0.01)
    if (next) setZoom(next)
  }

  useEffect(() => {
    document.title = `${doc.name} - 포켓 문서 뷰어`
    return () => {
      document.title = '포켓 문서 뷰어'
    }
  }, [doc.name])

  return (
    <div className="viewer">
      <header className="toolbar">
        <button className="icon-btn" onClick={onClose} aria-label="닫기">
          ←
        </button>
        <FileBadge kind={doc.type.kind} label={doc.type.label} />
        <div className="title">
          <strong>{doc.name}</strong>
          {status && <small>{status}</small>}
        </div>
        <div className="zoom">
          <button className="icon-btn" onClick={() => step(-1)} aria-label="축소">
            −
          </button>
          <button className="zoom-val" onClick={() => setZoom(1)} aria-label="화면에 맞추기">
            {Math.round(zoom * 100)}%
          </button>
          <button className="icon-btn" onClick={() => step(1)} aria-label="확대">
            +
          </button>
        </div>
      </header>
      <div ref={scroller} className={`viewer-body kind-${doc.type.kind}`}>
        <Suspense fallback={<div className="viewer-message">뷰어 준비 중…</div>}>
          <Viewer bytes={doc.bytes} name={doc.name} zoom={zoom} onStatus={setStatus} />
        </Suspense>
      </div>
    </div>
  )
}
