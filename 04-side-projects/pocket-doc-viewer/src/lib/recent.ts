// 최근 문서 목록. 파일은 이 기기의 IndexedDB에만 저장하며 어디로도 보내지 않는다.

export interface RecentEntry {
  id: string
  name: string
  label: string
  size: number
  openedAt: number
}

interface Stored extends RecentEntry {
  data: Blob
}

const DB = 'pocket-doc-viewer'
const STORE = 'recent'
const MAX_ITEMS = 12
/** 이보다 큰 파일은 최근 목록에 저장하지 않는다 */
export const MAX_STORE_BYTES = 40 * 1024 * 1024

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        t.oncomplete = () => {
          db.close()
          resolve(req ? req.result : undefined)
        }
        t.onerror = () => {
          db.close()
          reject(t.error)
        }
      }),
  )
}

export async function listRecent(): Promise<RecentEntry[]> {
  try {
    const items = ((await tx<Stored[]>('readonly', (s) => s.getAll())) ?? []) as Stored[]
    return items
      .map(({ data: _data, ...meta }) => meta)
      .sort((a, b) => b.openedAt - a.openedAt)
  } catch {
    return []
  }
}

export async function saveRecent(name: string, label: string, bytes: Uint8Array): Promise<void> {
  if (bytes.byteLength > MAX_STORE_BYTES) return
  try {
    // 같은 이름·크기는 같은 파일로 보고 덮어쓴다
    const id = `${name}:${bytes.byteLength}`
    const entry: Stored = {
      id,
      name,
      label,
      size: bytes.byteLength,
      openedAt: Date.now(),
      data: new Blob([bytes as Uint8Array<ArrayBuffer>]),
    }
    await tx('readwrite', (s) => {
      s.put(entry)
    })
    const all = await listRecent()
    for (const old of all.slice(MAX_ITEMS)) await removeRecent(old.id)
  } catch {
    // 시크릿 모드 등에서 저장이 막혀도 문서 보기는 계속한다
  }
}

export async function loadRecent(id: string): Promise<{ entry: RecentEntry; bytes: Uint8Array } | null> {
  const item = (await tx<Stored>('readonly', (s) => s.get(id))) as Stored | undefined
  if (!item) return null
  const { data, ...entry } = item
  return { entry, bytes: new Uint8Array(await data.arrayBuffer()) }
}

export async function removeRecent(id: string): Promise<void> {
  await tx('readwrite', (s) => {
    s.delete(id)
  })
}

export async function clearRecent(): Promise<void> {
  await tx('readwrite', (s) => {
    s.clear()
  })
}
