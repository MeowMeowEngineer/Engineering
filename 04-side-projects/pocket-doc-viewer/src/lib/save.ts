// 고친 문서를 기기에 저장하거나 다른 앱으로 보낸다.
// 웹: 파일 저장 창(지원 브라우저) 또는 다운로드, 공유 시트(Web Share)
// 안드로이드 앱: 시스템 '다른 이름으로 저장' 창(SAF), 공유 시트
import { registerPlugin } from '@capacitor/core'
import { isNative } from './native'

interface SaveFilePlugin {
  save(opts: { name: string; mime: string; data: string }): Promise<{ saved: boolean }>
  share(opts: { name: string; mime: string; data: string }): Promise<void>
}

const OpenedFile = registerPlugin<SaveFilePlugin>('OpenedFile')

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  hwpx: 'application/hwp+zip',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  md: 'text/markdown',
  json: 'application/json',
}

export function mimeOf(name: string): string {
  return MIME[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'
}

function toBase64(bytes: Uint8Array): string {
  let s = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(s)
}

export type SaveResult = 'saved' | 'downloaded' | 'cancelled'

export async function saveToDevice(name: string, bytes: Uint8Array): Promise<SaveResult> {
  const mime = mimeOf(name)
  if (isNative()) {
    const { saved } = await OpenedFile.save({ name, mime, data: toBase64(bytes) })
    return saved ? 'saved' : 'cancelled'
  }
  type Picker = (o: object) => Promise<FileSystemFileHandle>
  const picker = (window as unknown as { showSaveFilePicker?: Picker }).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({ suggestedName: name })
      const w = await handle.createWritable()
      await w.write(bytes as Uint8Array<ArrayBuffer>)
      await w.close()
      return 'saved'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // 보안 정책 등으로 막히면 아래 다운로드로 넘어간다
    }
  }
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'downloaded'
}

export function canShare(name: string): boolean {
  if (isNative()) return true
  try {
    const file = new File([new Uint8Array(1)], name, { type: mimeOf(name) })
    return !!navigator.canShare?.({ files: [file] })
  } catch {
    return false
  }
}

export async function shareFile(name: string, bytes: Uint8Array): Promise<void> {
  const mime = mimeOf(name)
  if (isNative()) return OpenedFile.share({ name, mime, data: toBase64(bytes) })
  const file = new File([bytes as Uint8Array<ArrayBuffer>], name, { type: mime })
  await navigator.share({ files: [file], title: name })
}
