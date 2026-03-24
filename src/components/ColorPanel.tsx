import { useCallback, useEffect, useRef, useState } from 'react'
import type { ColorOptions } from '../types/image'
import { DEFAULT_COLOR } from '../lib/image/process'

type SliderDef = {
  key: keyof ColorOptions
  label: string
  min: number
  max: number
  step: number
  unit: string
  isToggle?: false
}

type ToggleDef = {
  key: keyof ColorOptions
  label: string
  isToggle: true
}

type ControlDef = SliderDef | ToggleDef

type Section = {
  title: string
  controls: ControlDef[]
}

const SECTIONS: Section[] = [
  {
    title: 'Light',
    controls: [
      { key: 'exposure',   label: 'Exposure',   min: -100, max: 100, step: 1, unit: '' },
      { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1, unit: '' },
      { key: 'contrast',   label: 'Contrast',   min: -100, max: 100, step: 1, unit: '' },
    ],
  },
  {
    title: 'Color',
    controls: [
      { key: 'saturation',  label: 'Saturation',  min: -100, max: 100, step: 1,   unit: '' },
      { key: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1,   unit: '' },
      { key: 'tint',        label: 'Tint',        min: -100, max: 100, step: 1,   unit: '' },
      { key: 'hueRotate',   label: 'Hue',         min: 0,    max: 360, step: 1,   unit: '°' },
    ],
  },
  {
    title: 'Effects',
    controls: [
      { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, step: 1,   unit: '%' },
      { key: 'sepia',     label: 'Sepia',     min: 0, max: 100, step: 1,   unit: '%' },
      { key: 'vignette',  label: 'Vignette',  min: 0, max: 100, step: 1,   unit: '%' },
      { key: 'blur',      label: 'Blur',      min: 0, max: 20,  step: 0.5, unit: 'px' },
      { key: 'invert',    label: 'Invert',    isToggle: true },
    ],
  },
  {
    title: 'Detail',
    controls: [
      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, step: 1, unit: '' },
      { key: 'noise',   label: 'Noise',   min: 0, max: 100, step: 1, unit: '' },
    ],
  },
]

function formatValue(def: SliderDef, value: number): string {
  const sign = (def.min < 0 && value > 0) ? '+' : ''
  const v = def.step < 1 ? value.toFixed(1) : String(Math.round(value))
  return `${sign}${v}${def.unit}`
}

function isActive(color: ColorOptions): boolean {
  return (Object.keys(DEFAULT_COLOR) as (keyof ColorOptions)[]).some(k => color[k] !== DEFAULT_COLOR[k])
}

type Props = {
  color: ColorOptions
  onChange: (next: ColorOptions) => void
  onClose: () => void
}

export function ColorPanel({ color, onChange, onClose }: Props) {
  // Drag state
  const panelRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: 80 })

  // Clamp to viewport
  const clamp = useCallback((x: number, y: number) => {
    const el = panelRef.current
    if (!el) return { x, y }
    const w = el.offsetWidth
    const h = el.offsetHeight
    return {
      x: Math.min(Math.max(0, x), window.innerWidth  - w),
      y: Math.min(Math.max(0, y), window.innerHeight - h),
    }
  }, [])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      setPos(clamp(dragState.current.originX + dx, dragState.current.originY + dy))
    }
    function onUp() { dragState.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [clamp])

  function startDrag(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input, label')) return
    e.preventDefault()
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y }
  }

  function set<K extends keyof ColorOptions>(key: K, value: ColorOptions[K]) {
    onChange({ ...color, [key]: value })
  }

  const active = isActive(color)

  return (
    <div
      ref={panelRef}
      className="color-panel"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Title bar */}
      <div className="color-panel__titlebar" onMouseDown={startDrag}>
        <span className="color-panel__title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13.5" cy="6.5" r="2.5" />
            <circle cx="19" cy="13" r="2.5" />
            <circle cx="6.5" cy="15.5" r="2.5" />
            <path d="M17.5 8.5c-2 3.5-5.5 5.5-11 6" />
          </svg>
          Color Adjustments
        </span>
        <div className="color-panel__titlebar-actions">
          {active && (
            <button
              type="button"
              className="color-panel__reset-all"
              onClick={() => onChange({ ...DEFAULT_COLOR })}
              title="Reset all adjustments"
            >
              Reset all
            </button>
          )}
          <button type="button" className="color-panel__close" onClick={onClose} aria-label="Close color panel">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="color-panel__body">
        {SECTIONS.map((section) => (
          <div key={section.title} className="color-panel__section">
            <h3 className="color-panel__section-title">{section.title}</h3>

            {section.controls.map((ctrl) => {
              if (ctrl.isToggle) {
                const val = color[ctrl.key] as boolean
                return (
                  <label key={ctrl.key} className="color-panel__toggle">
                    <span className="color-panel__toggle-label">{ctrl.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={val}
                      className={`color-panel__switch ${val ? 'color-panel__switch--on' : ''}`}
                      onClick={() => set(ctrl.key as keyof ColorOptions, !val as ColorOptions[typeof ctrl.key])}
                    >
                      <span className="color-panel__switch-thumb" />
                    </button>
                  </label>
                )
              }

              const sliderDef = ctrl as SliderDef
              const val = color[sliderDef.key] as number
              const isNeutral = val === DEFAULT_COLOR[sliderDef.key]
              const pct = ((val - sliderDef.min) / (sliderDef.max - sliderDef.min)) * 100

              return (
                <div key={sliderDef.key} className="color-panel__row">
                  <div className="color-panel__row-header">
                    <span className="color-panel__row-label">{sliderDef.label}</span>
                    <div className="color-panel__row-right">
                      <span className={`color-panel__row-value ${!isNeutral ? 'color-panel__row-value--active' : ''}`}>
                        {formatValue(sliderDef, val)}
                      </span>
                      {!isNeutral && (
                        <button
                          type="button"
                          className="color-panel__row-reset"
                          onClick={() => set(sliderDef.key, DEFAULT_COLOR[sliderDef.key] as ColorOptions[typeof sliderDef.key])}
                          title={`Reset ${sliderDef.label}`}
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="color-panel__slider-wrap">
                    <input
                      type="range"
                      min={sliderDef.min}
                      max={sliderDef.max}
                      step={sliderDef.step}
                      value={val}
                      onChange={(e) => set(sliderDef.key, Number(e.target.value) as ColorOptions[typeof sliderDef.key])}
                      className="color-panel__slider"
                      style={{ '--pct': `${pct}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
