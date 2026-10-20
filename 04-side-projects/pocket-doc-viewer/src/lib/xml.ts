// OOXML·OWPML 공용 XML 도우미. 접두사(a:, p:, hp:)는 파일마다 달라질 수 있으므로 localName으로만 찾는다.

export function parseXml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('XML을 해석할 수 없습니다')
  }
  return doc
}

/** 바로 아래 자식 중 이름이 일치하는 요소들 */
export function kids(el: Element | null | undefined, name?: string): Element[] {
  if (!el) return []
  const out: Element[] = []
  for (const c of Array.from(el.children)) {
    if (!name || c.localName === name) out.push(c)
  }
  return out
}

export function kid(el: Element | null | undefined, name: string): Element | null {
  if (!el) return null
  for (const c of Array.from(el.children)) {
    if (c.localName === name) return c
  }
  return null
}

/** kid(kid(kid(el, a), b), c) 를 path(el, a, b, c) 로 */
export function path(el: Element | null | undefined, ...names: string[]): Element | null {
  let cur: Element | null = el ?? null
  for (const n of names) {
    cur = kid(cur, n)
    if (!cur) return null
  }
  return cur
}

/** 모든 하위 요소 중 이름이 일치하는 요소들 (문서 순서) */
export function all(el: Element | Document | null | undefined, name: string): Element[] {
  if (!el) return []
  return Array.from(el.getElementsByTagNameNS('*', name))
}

export function first(el: Element | Document | null | undefined, name: string): Element | null {
  if (!el) return null
  return el.getElementsByTagNameNS('*', name)[0] ?? null
}

export function attr(el: Element | null | undefined, name: string): string | null {
  if (!el) return null
  // 접두사가 붙은 속성(r:embed 등)도 localName으로 찾는다
  if (el.hasAttribute(name)) return el.getAttribute(name)
  for (const a of Array.from(el.attributes)) {
    if (a.localName === name) return a.value
  }
  return null
}

export function num(el: Element | null | undefined, name: string, fallback: number): number
export function num(el: Element | null | undefined, name: string): number | undefined
export function num(el: Element | null | undefined, name: string, fallback?: number): number | undefined {
  const v = attr(el, name)
  if (v == null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** OOXML 불리언: "1", "true", "on" */
export function bool(el: Element | null | undefined, name: string): boolean | undefined {
  const v = attr(el, name)
  if (v == null) return undefined
  return v === '1' || v === 'true' || v === 'on'
}
