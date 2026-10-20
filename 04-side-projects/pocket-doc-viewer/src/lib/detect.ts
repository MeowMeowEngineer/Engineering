import JSZip from 'jszip'
import * as CFB from 'cfb'

export type DocKind = 'pdf' | 'word' | 'sheet' | 'slide' | 'hwp' | 'hwpx' | 'text'

export interface DocType {
  kind: DocKind
  /** 화면에 보여줄 형식 이름 (PDF, DOCX, XLSX ...) */
  label: string
}

export class UnsupportedError extends Error {}

const EXT_LABEL: Record<string, DocType> = {
  pdf: { kind: 'pdf', label: 'PDF' },
  docx: { kind: 'word', label: 'DOCX' },
  docm: { kind: 'word', label: 'DOCX' },
  xlsx: { kind: 'sheet', label: 'XLSX' },
  xlsm: { kind: 'sheet', label: 'XLSX' },
  xls: { kind: 'sheet', label: 'XLS' },
  ods: { kind: 'sheet', label: 'ODS' },
  csv: { kind: 'sheet', label: 'CSV' },
  tsv: { kind: 'sheet', label: 'TSV' },
  pptx: { kind: 'slide', label: 'PPTX' },
  ppsx: { kind: 'slide', label: 'PPTX' },
  hwp: { kind: 'hwp', label: 'HWP' },
  hwpx: { kind: 'hwpx', label: 'HWPX' },
  txt: { kind: 'text', label: 'TXT' },
  md: { kind: 'text', label: 'MD' },
  log: { kind: 'text', label: 'TXT' },
  json: { kind: 'text', label: 'JSON' },
  xml: { kind: 'text', label: 'XML' },
}

export const ACCEPT = [
  ...Object.keys(EXT_LABEL).map((e) => '.' + e),
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/vnd.hancom.hwpx',
  'text/csv',
  'text/plain',
].join(',')

export function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim())
  return m ? m[1].toLowerCase() : ''
}

function startsWith(bytes: Uint8Array, sig: number[], at = 0): boolean {
  if (bytes.length < at + sig.length) return false
  return sig.every((b, i) => bytes[at + i] === b)
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let s = ''
  for (let i = start; i < Math.min(end, bytes.length); i++) s += String.fromCharCode(bytes[i])
  return s
}

const LEGACY = {
  doc: '예전 Word 형식(.doc)은 아직 지원하지 않습니다. Word에서 .docx로 저장한 뒤 열어 주세요.',
  ppt: '예전 PowerPoint 형식(.ppt)은 아직 지원하지 않습니다. .pptx로 저장한 뒤 열어 주세요.',
  encrypted: '암호가 걸린 문서는 열 수 없습니다. 원본 프로그램에서 암호를 해제한 뒤 열어 주세요.',
  hwp3: '한글 97 이전 형식(HWP 3.0)은 지원하지 않습니다.',
}

/**
 * 확장자보다 파일 내용(매직 바이트)을 먼저 본다.
 * 안드로이드의 '다른 앱으로 열기'로 들어온 파일은 이름이 없거나 확장자가 틀린 경우가 많기 때문이다.
 */
export async function detectType(name: string, bytes: Uint8Array): Promise<DocType> {
  const ext = extOf(name)

  if (ascii(bytes, 0, 1024).includes('%PDF-')) return EXT_LABEL.pdf

  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    const zip = await JSZip.loadAsync(bytes)
    const mimetype = zip.file('mimetype') ? (await zip.file('mimetype')!.async('string')).trim() : ''
    if (mimetype.includes('hwp') || zip.file('Contents/content.hpf')) return EXT_LABEL.hwpx
    if (zip.file('word/document.xml')) return EXT_LABEL.docx
    if (zip.file('xl/workbook.xml') || zip.file('xl/workbook.bin')) return EXT_LABEL.xlsx
    if (zip.file('ppt/presentation.xml')) return EXT_LABEL.pptx
    if (mimetype === 'application/vnd.oasis.opendocument.spreadsheet') return EXT_LABEL.ods
    throw new UnsupportedError('압축(zip) 파일이지만 지원하는 문서 형식이 아닙니다.')
  }

  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    const cfb = CFB.read(bytes, { type: 'array' })
    const names = new Set(cfb.FileIndex.map((f) => f.name))
    if (names.has('FileHeader') && (names.has('BodyText') || names.has('DocInfo'))) return EXT_LABEL.hwp
    if (names.has('Workbook') || names.has('Book')) return EXT_LABEL.xls
    if (names.has('EncryptedPackage')) throw new UnsupportedError(LEGACY.encrypted)
    if (names.has('WordDocument')) throw new UnsupportedError(LEGACY.doc)
    if (names.has('PowerPoint Document')) throw new UnsupportedError(LEGACY.ppt)
    throw new UnsupportedError('지원하지 않는 오피스 문서 형식입니다.')
  }

  if (ascii(bytes, 0, 17) === 'HWP Document File') throw new UnsupportedError(LEGACY.hwp3)

  const byExt = EXT_LABEL[ext]
  if (byExt && (byExt.kind === 'sheet' || byExt.kind === 'text')) return byExt
  if (looksLikeText(bytes)) return EXT_LABEL.txt

  throw new UnsupportedError(
    ext ? `.${ext} 파일은 지원하지 않습니다.` : '어떤 형식의 파일인지 알 수 없습니다.',
  )
}

function looksLikeText(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 4096)
  if (n === 0) return true
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return false
  return true
}

/** UTF-8로 읽어 보고 깨지면 EUC-KR(CP949)로 읽는다. 국내 CSV는 대부분 CP949로 저장된다. */
export function decodeText(bytes: Uint8Array): string {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) return new TextDecoder('utf-8').decode(bytes.subarray(3))
  if (startsWith(bytes, [0xff, 0xfe])) return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  if (startsWith(bytes, [0xfe, 0xff])) return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('euc-kr').decode(bytes)
  }
}
