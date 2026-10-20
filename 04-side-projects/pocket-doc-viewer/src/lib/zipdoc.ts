// ZIP+XML 문서(DOCX·XLSX·PPTX·HWPX)를 원본 그대로 두고 고친 부분만 바꿔 저장한다.
// 문서를 새로 만들지 않고 원본 XML을 직접 고치기 때문에, 이 앱이 모르는 서식·개체도 그대로 남아
// Word·Excel·PowerPoint·한글에서 다시 열어도 원래 모습이 유지된다.

import JSZip from 'jszip'
import { parseXml } from './xml'

const XML_DECL = /^\s*(<\?xml[^>]*\?>)/

export class ZipDoc {
  readonly zip: JSZip
  private docs = new Map<string, { doc: Document; decl: string }>()
  private dirtyParts = new Set<string>()
  private removed = new Set<string>()
  private listeners = new Set<() => void>()

  private constructor(zip: JSZip) {
    this.zip = zip
  }

  static async load(data: ArrayBuffer | Uint8Array): Promise<ZipDoc> {
    return new ZipDoc(await JSZip.loadAsync(data))
  }

  /** 고친 내용이 생길 때마다 불린다. 돌려준 함수로 해제한다 */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private changed() {
    for (const fn of this.listeners) fn()
  }

  has(part: string): boolean {
    return !!this.zip.file(part) && !this.removed.has(part)
  }

  /** 파트를 XML로 읽는다. 같은 파트는 같은 Document를 돌려주므로 고친 내용이 유지된다 */
  async xml(part: string): Promise<Document | null> {
    const hit = this.docs.get(part)
    if (hit) return hit.doc
    const f = this.zip.file(part)
    if (!f || this.removed.has(part)) return null
    const text = await f.async('string')
    const doc = parseXml(text)
    this.docs.set(part, { doc, decl: XML_DECL.exec(text)?.[1] ?? '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' })
    return doc
  }

  /** 이 파트를 고쳤다고 표시한다 */
  touch(part: string) {
    this.dirtyParts.add(part)
    this.changed()
  }

  remove(part: string) {
    this.removed.add(part)
    this.dirtyParts.delete(part)
    this.changed()
  }

  get dirty(): boolean {
    return this.dirtyParts.size > 0 || this.removed.size > 0
  }

  async save(): Promise<Uint8Array> {
    const ser = new XMLSerializer()
    for (const part of this.dirtyParts) {
      const entry = this.docs.get(part)
      if (!entry) continue
      // 브라우저(크롬)는 XML 선언을 스스로 붙이고 jsdom은 붙이지 않는다. 있으면 떼고 원본 선언을 한 번만 붙인다
      // (선언이 두 번 들어가면 Word·Excel·한글이 파일을 열지 못한다)
      const body = ser.serializeToString(entry.doc).replace(XML_DECL, '').replace(/^\s+/, '')
      // 기존 항목을 덮어쓰면 ZIP 안의 순서가 그대로 유지된다
      this.zip.file(part, entry.decl + '\r\n' + body)
    }
    for (const part of this.removed) this.zip.remove(part)
    // HWPX·ODF 규칙: mimetype은 첫 항목이고 압축하지 않는다
    const mimetype = this.zip.file('mimetype')
    if (mimetype) this.zip.file('mimetype', await mimetype.async('uint8array'), { compression: 'STORE' })
    const out = await this.zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      mimeType: 'application/zip',
    })
    this.dirtyParts.clear()
    this.removed.clear()
    return out
  }
}

/** 부모와 같은 네임스페이스·접두사로 요소를 만든다 (w:r, a:r, hp:t 등) */
export function createLike(like: Element, localName: string): Element {
  const name = like.prefix ? `${like.prefix}:${localName}` : localName
  return like.ownerDocument.createElementNS(like.namespaceURI, name)
}

export const XML_NS = 'http://www.w3.org/XML/1998/namespace'

/** 문서 안 글자 한 조각을 고치는 손잡이. 화면은 get/set만 알면 된다 */
export interface TextSlot {
  get(): string
  set(value: string): void
}
