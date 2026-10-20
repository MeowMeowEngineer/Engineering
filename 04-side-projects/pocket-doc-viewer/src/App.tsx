import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { ACCEPT, detectType, extOf, UnsupportedError, type DocKind, type DocType } from './lib/detect'
import { clearRecent, listRecent, loadRecent, removeRecent, saveRecent, type RecentEntry } from './lib/recent'
import { initNative, isNative } from './lib/native'
import type { Saver, ViewerProps } from './viewers/common'
import { canShare, saveToDevice, shareFile } from './lib/save'
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
  // 고친 내용이 남아 있으면 문서 화면이 닫기를 막고 확인 창을 띄운다
  const guard = useRef<(() => boolean) | null>(null)
  const setGuard = useCallback((fn: (() => boolean) | null) => {
    guard.current = fn
  }, [])

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
    if (guard.current?.()) return
    if (!isNative() && history.state?.doc) history.back()
    else setDoc(null)
  }, [])

  useEffect(() => {
    const onPop = () => {
      // 뒤로 가기 제스처로 나가려 할 때 저장 안 한 내용이 있으면 기록을 되돌려 놓고 확인 창을 띄운다
      if (docRef.current && guard.current?.()) history.pushState({ doc: true }, '')
      else setDoc(null)
    }
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
        if (!guard.current?.()) setDoc(null)
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

  if (doc) return <ViewerScreen doc={doc} onClose={close} setGuard={setGuard} />

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

/** 문서 화면이 닫히기 전에 확인할 것이 있으면 true를 돌려 닫기를 막는 함수를 등록한다 */
type SetGuard = (fn: (() => boolean) | null) => void

function ViewerScreen({ doc, onClose, setGuard }: { doc: OpenDoc; onClose: () => void; setGuard: SetGuard }) {
  const [zoom, setZoom] = useState(1)
  const [status, setStatus] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const Viewer = VIEWERS[doc.type.kind]
  usePinchZoom(scroller, zoom, setZoom)

  // 편집 상태
  const [file, setFile] = useState({ name: doc.name, bytes: doc.bytes, version: 0 })
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false) // 편집 화면에서 고친 내용이 있다
  const [unsaved, setUnsaved] = useState(false) // 고친 내용을 아직 기기에 저장하지 않았다
  const [applying, setApplying] = useState(false)
  const [sheet, setSheet] = useState<'save' | 'confirm' | null>(null)
  const [toast, setToast] = useState<string>()
  const saverRef = useRef<Saver | null>(null)
  const canEdit = doc.type.kind !== 'hwp'

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? undefined : t)), 3500)
  }, [])

  /** 편집 화면에서 고친 내용을 실제 파일로 만들어 다시 연다 (보이는 화면 = 저장될 파일) */
  const apply = async (): Promise<boolean> => {
    if (!dirty) return true
    const saver = saverRef.current
    if (!saver) return true
    setApplying(true)
    try {
      const out = await saver()
      setFile((f) => ({ name: out.name ?? f.name, bytes: out.bytes, version: f.version + 1 }))
      setDirty(false)
      setUnsaved(true)
      return true
    } catch (e) {
      flash(e instanceof Error ? e.message : String(e))
      return false
    } finally {
      setApplying(false)
    }
  }

  const toggleEdit = async () => {
    if (!canEdit) {
      flash('HWP(한글 바이너리) 문서는 보기만 됩니다. 한글에서 HWPX로 저장하면 고칠 수 있습니다.')
      return
    }
    if (!editing) {
      setEditing(true)
      return
    }
    if (await apply()) setEditing(false)
  }

  const openSave = async () => {
    if (await apply()) {
      setEditing(false)
      setSheet('save')
    }
  }

  const pending = dirty || unsaved
  useEffect(() => {
    if (!pending) return
    setGuard(() => {
      setSheet('confirm')
      return true
    })
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => {
      setGuard(null)
      window.removeEventListener('beforeunload', warn)
    }
  }, [pending, setGuard])

  const step = (dir: 1 | -1) => {
    const next =
      dir > 0 ? ZOOM_STEPS.find((z) => z > zoom + 0.01) : [...ZOOM_STEPS].reverse().find((z) => z < zoom - 0.01)
    if (next) setZoom(next)
  }

  useEffect(() => {
    document.title = `${file.name} - 포켓 문서 뷰어`
    return () => {
      document.title = '포켓 문서 뷰어'
    }
  }, [file.name])

  return (
    <div className={`viewer${editing ? ' editing' : ''}`}>
      <header className="toolbar">
        <button className="icon-btn" onClick={onClose} aria-label="닫기">
          ←
        </button>
        <FileBadge kind={doc.type.kind} label={doc.type.label} />
        <div className="title">
          <strong>{file.name}</strong>
          <small>{editing ? (dirty ? '고치는 중 · 아직 저장 안 됨' : '편집 중') : unsaved ? '수정됨 · 저장 필요' : status}</small>
        </div>
        {!editing && (
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
        )}
        <button className={`text-btn${editing ? ' strong' : ''}`} onClick={() => void toggleEdit()} disabled={applying}>
          {applying ? '반영 중…' : editing ? '완료' : '편집'}
        </button>
        {pending && (
          <button className="text-btn primary" onClick={() => void openSave()} disabled={applying}>
            저장
          </button>
        )}
      </header>
      <div ref={scroller} className={`viewer-body kind-${doc.type.kind}`}>
        <Suspense fallback={<div className="viewer-message">뷰어 준비 중…</div>}>
          <Viewer
            key={file.version}
            bytes={file.bytes}
            name={file.name}
            zoom={zoom}
            onStatus={setStatus}
            editing={editing}
            onDirty={setDirty}
            saverRef={saverRef}
          />
        </Suspense>
      </div>

      {sheet === 'save' && (
        <SaveSheet
          name={file.name}
          bytes={file.bytes}
          label={doc.type.label}
          onClose={() => setSheet(null)}
          onSaved={(msg) => {
            setUnsaved(false)
            setSheet(null)
            flash(msg)
          }}
          onError={flash}
        />
      )}
      {sheet === 'confirm' && (
        <div className="sheet-backdrop" onClick={() => setSheet(null)}>
          <div className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-title">저장하지 않은 수정 내용이 있습니다</h2>
            <p className="muted">닫으면 고친 내용이 사라집니다. 원본 파일은 그대로 남아 있습니다.</p>
            <div className="sheet-actions">
              <button className="btn primary" onClick={() => void openSave()}>
                저장하기
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  setGuard(null)
                  setSheet(null)
                  setDirty(false)
                  setUnsaved(false)
                  onClose()
                }}
              >
                저장하지 않고 닫기
              </button>
              <button className="btn" onClick={() => setSheet(null)}>
                계속 보기
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function SaveSheet({
  name,
  bytes,
  label,
  onClose,
  onSaved,
  onError,
}: {
  name: string
  bytes: Uint8Array
  label: string
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}) {
  const ext = extOf(name)
  const [base, setBase] = useState(name.slice(0, ext ? -(ext.length + 1) : undefined))
  const [busy, setBusy] = useState(false)
  const fileName = (base.trim() || '문서') + (ext ? '.' + ext : '')
  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true)
    try {
      const msg = await fn()
      if (msg) {
        void saveRecent(fileName, label, bytes)
        onSaved(msg)
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) onError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => e.preventDefault()}
      >
        <h2 id="save-title">고친 문서 저장</h2>
        <label className="field">
          <span>파일 이름</span>
          <span className="field-row">
            <input id="save-name" value={base} onChange={(e) => setBase(e.target.value)} autoComplete="off" />
            {ext && <span className="ext">.{ext}</span>}
          </span>
        </label>
        <p className="muted">
          원래 형식({label}) 그대로 저장하므로 {appFor(label)}에서 그대로 열립니다. 새 파일로 저장되며 원본은 바뀌지 않습니다.
        </p>
        <div className="sheet-actions">
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = await saveToDevice(fileName, bytes)
                return r === 'saved' ? '저장했습니다.' : r === 'downloaded' ? '다운로드 폴더에 저장했습니다.' : null
              })
            }
          >
            기기에 저장
          </button>
          {canShare(fileName) && (
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await shareFile(fileName, bytes)
                  return '공유했습니다.'
                })
              }
            >
              공유하기 (카카오톡·메일·드라이브)
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </form>
    </div>
  )
}

function appFor(label: string): string {
  switch (label) {
    case 'DOCX':
      return 'Word'
    case 'XLSX':
    case 'XLS':
    case 'CSV':
    case 'TSV':
      return 'Excel'
    case 'ODS':
      return 'LibreOffice·Excel'
    case 'PPTX':
      return 'PowerPoint'
    case 'HWPX':
      return '한글'
    case 'PDF':
      return 'PDF 프로그램'
    default:
      return '원래 프로그램'
  }
}
