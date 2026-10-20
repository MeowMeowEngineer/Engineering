import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { errorMessage, fitScale, sanitizeLinks, useWidth, type ViewerProps } from './common'
import DocxEditView from './DocxEditView'

/** 보기: docx-preview(원본에 가까운 배치) · 편집: 직접 만든 편집 화면 */
export default function DocxViewer(props: ViewerProps) {
  return props.editing ? <DocxEditView {...props} /> : <DocxPreview {...props} />
}

function DocxPreview({ bytes, zoom, onStatus }: ViewerProps) {
  const outer = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const width = useWidth(outer)
  const [pageWidth, setPageWidth] = useState(0)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const el = host.current!
    let cancelled = false
    el.replaceChildren()
    renderAsync(new Blob([bytes as Uint8Array<ArrayBuffer>]), el, undefined, {
      className: 'docx',
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      // 문서 안에 들어 있는 HTML 조각(altChunk)은 스크립트가 섞일 수 있어 그리지 않는다
      renderAltChunks: false,
      renderComments: false,
      useBase64URL: false,
      experimental: true,
    })
      .then(() => {
        if (cancelled) return
        sanitizeLinks(el)
        const pages = el.querySelectorAll<HTMLElement>('section.docx')
        setPageWidth(Math.max(0, ...Array.from(pages).map((p) => p.offsetWidth)))
        onStatus?.(`${pages.length}쪽`)
        setLoading(false)
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [bytes, onStatus])

  const scale = pageWidth ? fitScale(width, pageWidth) * zoom : 1

  return (
    <div ref={outer} className="docx-outer">
      {error && <div className="viewer-message">Word 문서를 열 수 없습니다.<small>{error}</small></div>}
      {loading && !error && <div className="viewer-message">불러오는 중…</div>}
      <div ref={host} className="docx-host" style={{ zoom: scale, visibility: loading ? 'hidden' : 'visible' }} />
    </div>
  )
}
