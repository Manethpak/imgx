import type { RecentEntry } from '../../types/image'

const DB_NAME = 'imgx-recents'
const DB_VERSION = 1
const STORE = 'recents'
const MAX_ENTRIES = 10

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('addedAt', 'addedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const req = fn(store)
    t.oncomplete = () => resolve(req ? req.result : undefined)
    t.onerror = () => reject(t.error)
  })
}

/** Load all recent entries sorted newest-first. */
export async function loadRecents(): Promise<RecentEntry[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const store = t.objectStore(STORE)
    const req = store.getAll()
    req.onsuccess = () => {
      const rows = (req.result as RecentEntry[]).sort(
        (a, b) => b.addedAt - a.addedAt,
      )
      resolve(rows)
    }
    req.onerror = () => reject(req.error)
  })
}

/** Persist a new entry, evicting the oldest if over the limit. */
export async function addRecent(entry: RecentEntry): Promise<void> {
  const db = await openDb()

  // Put the new entry
  await tx(db, 'readwrite', (store) => store.put(entry))

  // Enforce max count — delete oldest entries beyond the cap
  const all = await loadRecents() // already sorted newest-first
  if (all.length > MAX_ENTRIES) {
    const toDelete = all.slice(MAX_ENTRIES)
    for (const old of toDelete) {
      await tx(db, 'readwrite', (store) => store.delete(old.id))
    }
  }
}

/** Remove a single entry by id. */
export async function removeRecent(id: string): Promise<void> {
  const db = await openDb()
  await tx(db, 'readwrite', (store) => store.delete(id))
}

/** Wipe all entries. */
export async function clearRecents(): Promise<void> {
  const db = await openDb()
  await tx(db, 'readwrite', (store) => store.clear())
}

/** Build a RecentEntry from an ImportedImage (reads blob from the object URL). */
export async function buildRecentEntry(
  file: File,
  width: number,
  height: number,
): Promise<RecentEntry> {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    type: file.type as RecentEntry['type'],
    size: file.size,
    width,
    height,
    addedAt: Date.now(),
    blob: file,
  }
}
