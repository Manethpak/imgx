import { useState } from 'react'
import type { EditorOptions, ImportedImage } from '../types/image'
import { formatBytes } from '../lib/image/load'

type ActivePanel = 'resize' | 'crop' | null

type ToolbarProps = {
  image: ImportedImage
  options: EditorOptions
  onChange: (next: EditorOptions) => void
  onResizeField: (field: 'width' | 'height', value: number) => void
  onExport: () => void
  onNewImage: () => void
  isProcessing: boolean
  activePanel: ActivePanel
  onActivePanelChange: (panel: ActivePanel) => void
}

export function Toolbar({
  image,
  options,
  onChange,
  onResizeField,
  onExport,
  onNewImage,
  isProcessing,
  activePanel,
  onActivePanelChange,
}: ToolbarProps) {
  const [draftQuality, setDraftQuality] = useState<number | null>(null)

  const displayQuality = draftQuality ?? options.output.quality

  function togglePanel(panel: NonNullable<ActivePanel>) {
    onActivePanelChange(activePanel === panel ? null : panel)
  }

  function cycleRotation() {
    const next = ((options.transform.rotate + 90) % 360) as EditorOptions['transform']['rotate']
    onChange({ ...options, transform: { ...options.transform, rotate: next } })
  }

  return (
    <div className="toolbar fade-in">
      {/* Image info */}
      <div className="toolbar__info">
        <span className="toolbar__filename" title={image.file.name}>{image.file.name}</span>
        <span className="toolbar__meta">
          {image.width}x{image.height} &middot; {formatBytes(image.size)} &middot; {image.type.replace('image/', '').toUpperCase()}
        </span>
      </div>

      {/* Quick actions */}
      <div className="toolbar__actions">
        {/* Rotate */}
        <button
          type="button"
          className="toolbar-btn"
          onClick={cycleRotation}
          title={`Rotate (${options.transform.rotate}°)`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          <span>{options.transform.rotate}°</span>
        </button>

        {/* Flip H */}
        <button
          type="button"
          className={`toolbar-btn ${options.transform.flipHorizontal ? 'toolbar-btn--active' : ''}`}
          onClick={() => onChange({ ...options, transform: { ...options.transform, flipHorizontal: !options.transform.flipHorizontal } })}
          title="Flip horizontal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h3" />
            <path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" />
            <line x1="12" y1="20" x2="12" y2="4" />
          </svg>
          <span>Flip H</span>
        </button>

        {/* Flip V */}
        <button
          type="button"
          className={`toolbar-btn ${options.transform.flipVertical ? 'toolbar-btn--active' : ''}`}
          onClick={() => onChange({ ...options, transform: { ...options.transform, flipVertical: !options.transform.flipVertical } })}
          title="Flip vertical"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
            <path d="M8 3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h3" />
            <path d="M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" />
            <line x1="12" y1="20" x2="12" y2="4" />
          </svg>
          <span>Flip V</span>
        </button>

        <div className="toolbar__sep" />

        {/* Resize */}
        <button
          type="button"
          className={`toolbar-btn ${activePanel === 'resize' ? 'toolbar-btn--active' : ''}`}
          onClick={() => togglePanel('resize')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          <span>Resize</span>
        </button>

        {/* Crop */}
        <button
          type="button"
          className={`toolbar-btn ${activePanel === 'crop' ? 'toolbar-btn--active' : ''}`}
          onClick={() => togglePanel('crop')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.13 1L6 16a2 2 0 002 2h15" />
            <path d="M1 6.13L16 6a2 2 0 012 2v15" />
          </svg>
          <span>Crop</span>
        </button>

        <div className="toolbar__sep" />

        {/* Quality */}
        <div className="toolbar-quality">
          <label className="toolbar-quality__label">
            Quality
            <span className="toolbar-quality__value">{displayQuality}%</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={displayQuality}
            onChange={(e) => setDraftQuality(Number(e.target.value))}
            onPointerUp={(e) => {
              const value = Number((e.target as HTMLInputElement).value)
              setDraftQuality(null)
              onChange({ ...options, output: { ...options.output, quality: value } })
            }}
            className="toolbar-quality__slider"
          />
        </div>

        <div className="toolbar__sep" />

        {/* Export */}
        <button type="button" className="btn btn--primary btn--sm" onClick={onExport} disabled={isProcessing}>
          Export
        </button>

        <button type="button" className="btn btn--ghost btn--sm" onClick={onNewImage}>
          New
        </button>
      </div>

      {/* Expandable panels */}
      {activePanel === 'resize' && (
        <div className="toolbar-panel slide-down">
          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={options.resize.enabled}
              onChange={(e) => onChange({ ...options, resize: { ...options.resize, enabled: e.target.checked } })}
            />
            <span>Enable resize</span>
          </label>

          <div className="toolbar-panel__fields">
            <label className="field-compact">
              <span>W</span>
              <input
                type="number"
                min="1"
                value={options.resize.width}
                onChange={(e) => onResizeField('width', Number(e.target.value))}
              />
            </label>
            <label className="field-compact">
              <span>H</span>
              <input
                type="number"
                min="1"
                value={options.resize.height}
                onChange={(e) => onResizeField('height', Number(e.target.value))}
              />
            </label>
          </div>

          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={options.resize.keepAspectRatio}
              onChange={(e) => onChange({ ...options, resize: { ...options.resize, keepAspectRatio: e.target.checked } })}
            />
            <span>Lock aspect ratio</span>
          </label>
        </div>
      )}

      {activePanel === 'crop' && (
        <div className="toolbar-panel slide-down">
          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={options.crop.enabled}
              onChange={(e) => onChange({ ...options, crop: { ...options.crop, enabled: e.target.checked } })}
            />
            <span>Enable crop</span>
          </label>
          <span className="toolbar-panel__hint">Drag handles on the preview to set the crop region.</span>
        </div>
      )}
    </div>
  )
}
