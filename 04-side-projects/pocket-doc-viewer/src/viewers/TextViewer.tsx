import { useMemo } from 'react'
import { decodeText } from '../lib/detect'
import type { ViewerProps } from './common'

const MAX_CHARS = 2_000_000

export default function TextViewer({ bytes, zoom, onStatus }: ViewerProps) {
  const text = useMemo(() => {
    const t = decodeText(bytes)
    const lines = t.split('\n').length
    queueMicrotask(() => onStatus?.(`${lines.toLocaleString()}줄`))
    return t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) + '\n\n… (너무 길어 앞부분만 표시합니다)' : t
  }, [bytes, onStatus])
  return (
    <pre className="text-view" style={{ fontSize: `${14 * zoom}px` }}>
      {text}
    </pre>
  )
}
