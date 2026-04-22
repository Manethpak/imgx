import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorPreset } from '../types/image'

type Props = {
    presets: EditorPreset[]
    onSave: () => void
    onApply: (preset: EditorPreset) => void
    onRemove: (id: string) => void
    onClose: () => void
}

export function PresetPanel({ presets, onSave, onApply, onRemove, onClose }: Props) {
    const panelRef = useRef<HTMLDivElement>(null)
    const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
    const [pos, setPos] = useState({ x: window.innerWidth - 350, y: 130 })

    const clamp = useCallback((x: number, y: number) => {
        const el = panelRef.current
        if (!el) return { x, y }
        const w = el.offsetWidth
        const h = el.offsetHeight
        return {
            x: Math.min(Math.max(0, x), window.innerWidth - w),
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

        function onUp() {
            dragState.current = null
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [clamp])

    function startDrag(e: React.MouseEvent) {
        if ((e.target as HTMLElement).closest('button')) return
        e.preventDefault()
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: pos.x,
            originY: pos.y,
        }
    }

    return (
        <div ref={panelRef} className="preset-panel" style={{ left: pos.x, top: pos.y }}>
            <div className="preset-panel__titlebar" onMouseDown={startDrag}>
                <span className="preset-panel__title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16" />
                        <path d="M4 12h16" />
                        <path d="M4 17h10" />
                        <path d="M17 15l3 3-3 3" />
                    </svg>
                    Saved Presets
                </span>

                <div className="preset-panel__titlebar-actions">
                    <button
                        type="button"
                        className="preset-panel__save"
                        onClick={onSave}
                        title="Save current settings as a preset"
                    >
                        Save current
                    </button>
                    <button
                        type="button"
                        className="preset-panel__close"
                        onClick={onClose}
                        aria-label="Close presets panel"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="preset-panel__body">
                {presets.length === 0 ? (
                    <p className="preset-panel__empty">
                        No presets yet. Save your current configuration to reuse it later.
                    </p>
                ) : (
                    <div className="preset-panel__list">
                        {presets.map((preset) => (
                            <div key={preset.id} className="preset-panel-item">
                                <button
                                    type="button"
                                    className="preset-panel-item__main"
                                    onClick={() => onApply(preset)}
                                    title={`Apply ${preset.name}`}
                                >
                                    <span className="preset-panel-item__name">{preset.name}</span>
                                    <span className="preset-panel-item__meta">
                                        {new Date(preset.createdAt).toLocaleDateString()}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="preset-panel-item__remove"
                                    onClick={() => onRemove(preset.id)}
                                    aria-label={`Remove ${preset.name}`}
                                    title="Remove preset"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
