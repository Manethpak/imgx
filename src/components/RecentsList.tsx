import { useEffect, useRef, useState } from 'react'
import type { RecentEntry } from '../types/image'
import { formatBytes } from '../lib/image/load'

type RecentsListProps = {
  entries: RecentEntry[]
  onOpen: (entry: RecentEntry) => void
  onRemove: (id: string) => void
  onClearAll: () => void
}

export function RecentsList({ entries, onOpen, onRemove, onClearAll }: RecentsListProps) {
  // Map of id → object URL for thumbnail previews (created lazily, revoked on unmount)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const urlsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const entry of entries) {
      if (urlsRef.current[entry.id]) {
        next[entry.id] = urlsRef.current[entry.id]
      } else {
        next[entry.id] = URL.createObjectURL(entry.blob)
      }
    }

    // Revoke URLs that are no longer needed
    for (const [id, url] of Object.entries(urlsRef.current)) {
      if (!next[id]) URL.revokeObjectURL(url)
    }

    urlsRef.current = next
    setThumbUrls({ ...next })

    return () => {
      for (const url of Object.values(urlsRef.current)) {
        URL.revokeObjectURL(url)
      }
      urlsRef.current = {}
    }
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div className="recents slide-down">
      <div className="recents__header">
        <span className="recents__title">Recent</span>
        <button
          type="button"
          className="recents__clear"
          onClick={onClearAll}
          title="Clear all recents"
        >
          Clear all
        </button>
      </div>

      <div className="recents__grid">
        {entries.map((entry) => (
          <div key={entry.id} className="recent-item" title={entry.name}>
            <button
              type="button"
              className="recent-item__thumb-btn"
              onClick={() => onOpen(entry)}
              aria-label={`Open ${entry.name}`}
            >
              {thumbUrls[entry.id] && (
                <img
                  src={thumbUrls[entry.id]}
                  alt={entry.name}
                  className="recent-item__thumb"
                  draggable={false}
                />
              )}
            </button>

            <div className="recent-item__info">
              <span className="recent-item__name">{entry.name}</span>
              <span className="recent-item__meta">
                {entry.width}×{entry.height} · {formatBytes(entry.size)}
              </span>
            </div>

            <button
              type="button"
              className="recent-item__remove"
              onClick={() => onRemove(entry.id)}
              aria-label={`Remove ${entry.name} from recents`}
              title="Remove"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
