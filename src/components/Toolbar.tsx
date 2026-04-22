import { useEffect, useId, useRef, useState } from 'react'
import type { EditorOptions, ImportedImage } from '../types/image'
import { formatBytes } from '../lib/image/load'
import { DEFAULT_COLOR } from '../lib/image/process'
import { CropIcon, FlipHorizontalIcon, FlipVerticalIcon, MoveDiagonal, MoveDiagonalIcon, PaletteIcon, Redo2Icon, RotateCcwIcon, SwatchBookIcon, Undo2Icon } from 'lucide-react'

type ActivePanel = 'resize' | 'crop' | null

const CROP_PRESETS = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
] as const

type ToolbarProps = {
  image: ImportedImage
  options: EditorOptions
  presetsCount: number
  canUndo: boolean
  canRedo: boolean
  onChange: (next: EditorOptions) => void
  onResizeField: (field: 'width' | 'height', value: number) => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onNewImage: () => void
  isProcessing: boolean
  activePanel: ActivePanel
  onActivePanelChange: (panel: ActivePanel) => void
  colorPanelOpen: boolean
  presetPanelOpen: boolean
  onTogglePresetPanel: () => void
  onToggleColorPanel: () => void
}

export function Toolbar({
  image,
  options,
  presetsCount,
  canUndo,
  canRedo,
  onChange,
  onResizeField,
  onUndo,
  onRedo,
  onExport,
  onNewImage,
  isProcessing,
  activePanel,
  onActivePanelChange,
  colorPanelOpen,
  presetPanelOpen,
  onTogglePresetPanel,
  onToggleColorPanel,
}: ToolbarProps) {
  const [draftQuality, setDraftQuality] = useState<number | null>(null)
  const [isQualityPopoverOpen, setIsQualityPopoverOpen] = useState(false)
  const qualityPopoverId = useId()
  const qualityPopoverRef = useRef<HTMLDivElement | null>(null)

  const displayQuality = draftQuality ?? options.output.quality

  // Check if any color adjustment is non-default
  const colorActive = (Object.keys(DEFAULT_COLOR) as (keyof typeof DEFAULT_COLOR)[])
    .some(k => options.color[k] !== DEFAULT_COLOR[k])

  function togglePanel(panel: NonNullable<ActivePanel>) {
    onActivePanelChange(activePanel === panel ? null : panel)
  }

  function cycleRotation() {
    const next = ((options.transform.rotate + 90) % 360) as EditorOptions['transform']['rotate']
    onChange({ ...options, transform: { ...options.transform, rotate: next } })
  }

  function setQuality(value: number) {
    const next = Math.min(100, Math.max(1, Math.round(value)))
    setDraftQuality(next)
  }

  function commitQuality(value: number) {
    const next = Math.min(100, Math.max(1, Math.round(value)))
    setDraftQuality(null)
    onChange({ ...options, output: { ...options.output, quality: next } })
  }

  function commitDraftQuality() {
    commitQuality(displayQuality)
  }

  useEffect(() => {
    if (!isQualityPopoverOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!qualityPopoverRef.current?.contains(event.target as Node)) {
        setIsQualityPopoverOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsQualityPopoverOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isQualityPopoverOpen])

  function applyCropPreset(ratio: number | null) {
    if (ratio === null) {
      onChange({
        ...options,
        crop: { x: 0, y: 0, width: image.width, height: image.height },
      })
      return
    }

    let width = image.width
    let height = Math.round(width / ratio)

    if (height > image.height) {
      height = image.height
      width = Math.round(height * ratio)
    }

    onChange({
      ...options,
      crop: {
        x: Math.round((image.width - width) / 2),
        y: Math.round((image.height - height) / 2),
        width,
        height,
      },
    })
  }

  return (
    <div className="toolbar fade-in">
      {/* Image info */}
      <div className="toolbar__info">
        <span className="toolbar__filename" title={image.file.name}>{image.file.name}</span>
        <span className="toolbar__meta">
          {image.width}×{image.height} &middot; {formatBytes(image.size)} &middot; {image.type.replace('image/', '').toUpperCase()}
        </span>
      </div>

      {/* Quick actions */}
      <div className="toolbar__actions">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2Icon size={18} />
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2Icon size={18} />
        </button>

        <div className="toolbar__sep" />

        {/* Rotate */}
        <button
          type="button"
          className="toolbar-btn"
          onClick={cycleRotation}
          title={`Rotate (${options.transform.rotate}°)`}
        >
          <RotateCcwIcon size={18} />
          <span>{options.transform.rotate}°</span>
        </button>

        {/* Flip H */}
        <button
          type="button"
          className={`toolbar-btn ${options.transform.flipHorizontal ? 'toolbar-btn--active' : ''}`}
          onClick={() => onChange({ ...options, transform: { ...options.transform, flipHorizontal: !options.transform.flipHorizontal } })}
          title="Flip horizontal"
        >
          <FlipHorizontalIcon size={18} />
          <span>Flip H</span>
        </button>

        {/* Flip V */}
        <button
          type="button"
          className={`toolbar-btn ${options.transform.flipVertical ? 'toolbar-btn--active' : ''}`}
          onClick={() => onChange({ ...options, transform: { ...options.transform, flipVertical: !options.transform.flipVertical } })}
          title="Flip vertical"
        >
          <FlipVerticalIcon size={18} />
          <span>Flip V</span>
        </button>

        <div className="toolbar__sep" />

        {/* Resize */}
        <button
          type="button"
          className={`toolbar-btn ${activePanel === 'resize' ? 'toolbar-btn--active' : ''}`}
          onClick={() => togglePanel('resize')}
        >
          <MoveDiagonalIcon size={18} />
          <span>Resize</span>
        </button>

        {/* Crop */}
        <button
          type="button"
          className={`toolbar-btn ${activePanel === 'crop' ? 'toolbar-btn--active' : ''}`}
          onClick={() => togglePanel('crop')}
        >
          <CropIcon size={18} />
          <span>Crop</span>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${colorPanelOpen || colorActive ? 'toolbar-btn--active' : ''}`}
          onClick={onToggleColorPanel}
          title="Color adjustments"
        >
          {/* palette icon */}
          <PaletteIcon size={18} />
          <span>Colors</span>
          {colorActive && <span className="toolbar-btn__dot" />}
        </button>

        <div className="toolbar__sep" />

        {/* Quality */}
        <div className="toolbar-quality" ref={qualityPopoverRef}>
          <button
            type="button"
            className={`toolbar-btn ${isQualityPopoverOpen ? 'toolbar-btn--active' : ''}`}
            onClick={() => setIsQualityPopoverOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={isQualityPopoverOpen}
            aria-controls={qualityPopoverId}
            title="Adjust quality"
          >
            <span>Quality</span>
            <span className="toolbar-quality__value">{displayQuality}%</span>
          </button>

          {isQualityPopoverOpen && (
            <div className="toolbar-quality__popover" id={qualityPopoverId} role="dialog" aria-label="Quality controls">
              <input
                id="quality-slider"
                type="range"
                min="1"
                max="100"
                value={displayQuality}
                onChange={(e) => setQuality(Number(e.target.value))}
                onPointerUp={commitDraftQuality}
                onKeyUp={commitDraftQuality}
                onBlur={commitDraftQuality}
                className="toolbar-quality__slider"
                aria-label="Quality slider"
              />
            </div>
          )}
        </div>

        <div className="toolbar__sep" />

        {/* Preset — opens floating panel */}
        <button
          type="button"
          className={`toolbar-btn ${presetPanelOpen ? 'toolbar-btn--active' : ''}`}
          onClick={onTogglePresetPanel}
          title="Saved presets"
        >
          <SwatchBookIcon size={18} />
          <span>Presets</span>
          {presetsCount > 0 && <span className="toolbar-btn__dot" />}
        </button>

        <div className="toolbar__sep" />

        {/* Export */}
        <button type="button" className="btn btn--primary btn--sm" onClick={onExport} disabled={isProcessing}>
          Export
        </button>

        <button type="button" className="btn btn--ghost btn--sm" onClick={onNewImage}>
          Clear
        </button>
      </div>

      {/* Expandable panels */}
      {activePanel === 'resize' && (
        <div className="toolbar-panel slide-down">
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

          <label className="field-select">
            <span>Fit</span>
            <select
              value={options.canvas.fit}
              onChange={(e) => onChange({
                ...options,
                canvas: {
                  ...options.canvas,
                  fit: e.target.value as EditorOptions['canvas']['fit'],
                },
              })}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>

          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={options.canvas.background === 'transparent'}
              onChange={(e) => onChange({
                ...options,
                canvas: {
                  ...options.canvas,
                  background: e.target.checked
                    ? 'transparent'
                    : options.canvas.background === 'transparent'
                      ? '#f5f6ef'
                      : options.canvas.background,
                },
              })}
            />
            <span>Transparent bg</span>
          </label>

          <label className="field-color">
            <span>Fill</span>
            <input
              type="color"
              value={options.canvas.background === 'transparent' ? '#f5f6ef' : options.canvas.background}
              disabled={options.canvas.background === 'transparent'}
              onChange={(e) => onChange({
                ...options,
                canvas: { ...options.canvas, background: e.target.value },
              })}
            />
          </label>

          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={() => onChange({
              ...options,
              resize: { width: image.width, height: image.height, keepAspectRatio: true },
              canvas: { ...options.canvas, fit: 'cover' },
            })}
            title="Reset resize to original dimensions"
          >
            Reset
          </button>
        </div>
      )}

      {activePanel === 'crop' && (
        <div className="toolbar-panel slide-down">
          <span className="toolbar-panel__hint">Drag handles on the preview to set the crop region.</span>
          <div className="toolbar-panel__chips">
            {CROP_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="toolbar-chip"
                onClick={() => applyCropPreset(preset.ratio)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={() => onChange({
              ...options,
              crop: { x: 0, y: 0, width: image.width, height: image.height },
            })}
            title="Reset crop to full image"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
