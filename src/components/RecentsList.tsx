import { useEffect, useState } from 'react'
import type { RecentEntry } from '../types/image'
import { formatBytes } from '../lib/image/load'

type RecentsListProps = {
  entries: RecentEntry[]
  onOpen: (entry: RecentEntry) => void
  onRemove: (id: string) => void
  onClearAll: () => void
}

function RecentThumbnail({ entry }: { entry: RecentEntry }) {
  const [src] = useState(() => URL.createObjectURL(entry.blob))

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(src)
    }
  }, [src])

  return <img src={src} alt={entry.name} className="recent-item__thumb" draggable={false} />
}

export function RecentsList({ entries, onOpen, onRemove, onClearAll }: RecentsListProps) {
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
          <div key={`${entry.id}:${entry.addedAt}`} className="recent-item" title={entry.name}>
            <button
              type="button"
              className="recent-item__thumb-btn"
              onClick={() => onOpen(entry)}
              aria-label={`Open ${entry.name}`}
            >
              <RecentThumbnail entry={entry} />
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
