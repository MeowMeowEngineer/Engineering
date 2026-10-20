import { useEffect, useMemo, useRef } from 'react'
import { decodeText } from '../lib/detect'
import type { ViewerProps } from './common'

const MAX_CHARS = 2_000_000

export default function TextViewer({ bytes, zoom, onStatus, editing, onDirty, saverRef }: ViewerProps) {
  const full = useMemo(() => decodeText(bytes), [bytes])
  const draft = useRef(full)

  useEffect(() => {
    onStatus?.(`${full.split('\n').length.toLocaleString()}줄`)
  }, [full, onStatus])

  useEffect(() => {
    if (!saverRef) return
    // 저장은 UTF-8로 한다 (EUC-KR로 열린 파일도 UTF-8로 바뀐다)
    saverRef.current = async () => ({ bytes: new TextEncoder().encode(draft.current) })
    return () => {
      saverRef.current = null
    }
  }, [saverRef])

  if (editing) {
    return (
      <textarea
        id="text-editor"
        className="text-view text-edit"
        style={{ fontSize: `${14 * zoom}px` }}
        defaultValue={full}
        spellCheck={false}
        onChange={(e) => {
          draft.current = e.target.value
          onDirty?.(e.target.value !== full)
        }}
      />
    )
  }

  const text = full.length > MAX_CHARS ? full.slice(0, MAX_CHARS) + '\n\n… (너무 길어 앞부분만 표시합니다)' : full
  return (
    <pre className="text-view" style={{ fontSize: `${14 * zoom}px` }}>
      {text}
    </pre>
  )
}
