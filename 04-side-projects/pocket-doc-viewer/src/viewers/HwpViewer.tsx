import { useEffect, useRef, useState } from 'react'
import { Viewer as HWPViewer } from 'hwp.js'
import { errorMessage, fitScale, useWidth, type ViewerProps } from './common'

/** 한글 5.0 바이너리(.hwp). 해석과 쪽 배치는 hwp.js가 하고, 여기서는 화면 폭 맞춤만 한다 */
export default function HwpViewer({ bytes, zoom, onStatus }: ViewerProps) {
  const outer = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const width = useWidth(outer)
  const [pageWidth, setPageWidth] = useState(0)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const el = host.current!
    el.replaceChildren()
    let viewer: HWPViewer | undefined
    try {
      viewer = new HWPViewer(el, bytes, { type: 'array' })
      // hwp.js는 자체 머리줄(인쇄·정보 버튼)과 스크롤 영역을 만든다.
      // 머리줄은 앱 툴바와 겹치므로 숨기고, 스크롤은 앱 화면이 맡도록 펼친다
      const root = el.firstElementChild as HTMLElement | null
      const content = root?.lastElementChild as HTMLElement | null
      if (root && content) {
        for (const child of Array.from(root.children) as HTMLElement[]) {
          if (child !== content) child.style.display = 'none'
        }
        Object.assign(root.style, { height: 'auto', overflow: 'visible', background: 'transparent' })
        Object.assign(content.style, { height: 'auto', overflow: 'visible', padding: '0' })
      }
      const pages = Array.from(content?.children ?? []) as HTMLElement[]
      for (const p of pages) p.classList.add('paper', 'hwp-page')
      setPageWidth(Math.max(0, ...pages.map((p) => p.offsetWidth)))
      onStatus?.(`${pages.length}쪽`)
    } catch (e) {
      setError(errorMessage(e))
    }
    return () => {
      try {
        viewer?.distory()
      } catch {
        // 이미 지워진 경우
      }
      el.replaceChildren()
    }
  }, [bytes, onStatus])

  const scale = pageWidth ? fitScale(width, pageWidth) * zoom : 1
  return (
    <div ref={outer} className="hwp-outer">
      {error && (
        <div className="viewer-message">
          한글(HWP) 문서를 열 수 없습니다.
          <small>
            {error}
            <br />
            배포용·암호 문서는 지원하지 않습니다. 한글에서 .hwpx로 저장하면 더 정확하게 볼 수 있습니다.
          </small>
        </div>
      )}
      <div ref={host} className="hwp-host" style={{ zoom: scale }} />
    </div>
  )
}
