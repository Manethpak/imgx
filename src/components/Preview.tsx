import { useState } from 'react'
import type { ImportedImage, ProcessedImage } from '../types/image'
import { formatBytes } from '../lib/image/load'

type PreviewProps = {
  image: ImportedImage
  result: ProcessedImage | null
  isProcessing: boolean
}

export function Preview({ image, result, isProcessing }: PreviewProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  const displayUrl = showOriginal ? image.url : (result?.url ?? image.url)
  const displayLabel = showOriginal ? 'Original' : 'Output'

  const savings =
    result && image.size > 0
      ? Math.round(((image.size - result.size) / image.size) * 100)
      : null

  return (
    <div className="preview fade-in">
      <div className="preview__frame checkerboard">
        <img
          src={displayUrl}
          alt={displayLabel}
          className="preview__image"
          key={displayUrl}
        />

        {isProcessing && (
          <div className="preview__processing">
            <div className="spinner" />
          </div>
        )}
      </div>

      <div className="preview__bar">
        <button
          type="button"
          className={`preview-toggle ${!showOriginal ? 'preview-toggle--active' : ''}`}
          onClick={() => setShowOriginal(false)}
        >
          Output
          {result && (
            <span className="preview-toggle__meta">
              {result.width}x{result.height} &middot; {formatBytes(result.size)}
              {savings !== null && (
                <span className={`badge ${savings > 0 ? 'badge--positive' : 'badge--negative'}`}>
                  {savings > 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
                </span>
              )}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`preview-toggle ${showOriginal ? 'preview-toggle--active' : ''}`}
          onClick={() => setShowOriginal(true)}
        >
          Original
          <span className="preview-toggle__meta">
            {image.width}x{image.height} &middot; {formatBytes(image.size)}
          </span>
        </button>
      </div>
    </div>
  )
}
