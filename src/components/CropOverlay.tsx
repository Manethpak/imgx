import { useCallback, useEffect, useRef, useState } from 'react'
import type { CropOptions, ImportedImage } from '../types/image'

type Handle =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se'
  | 'move'

type DragState = {
  handle: Handle
  startPointerX: number
  startPointerY: number
  startCrop: CropOptions
}

type Props = {
  image: ImportedImage
  imgRef: React.RefObject<HTMLImageElement | null>
  crop: CropOptions
  onChange: (next: CropOptions) => void
}

const MIN_SIZE = 8

export function CropOverlay({ image, imgRef, crop, onChange }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<CropOptions>(crop)
  const dragRef = useRef<DragState | null>(null)

  // Keep draft in sync when crop prop changes externally (e.g. new image loaded)
  useEffect(() => {
    setDraft(crop)
  }, [crop])

  // Returns CSS % positions relative to the image dimensions
  const toStyle = (c: CropOptions) => ({
    left:   `${(c.x          / image.width)  * 100}%`,
    top:    `${(c.y          / image.height) * 100}%`,
    width:  `${(c.width      / image.width)  * 100}%`,
    height: `${(c.height     / image.height) * 100}%`,
  })

  const onPointerDown = useCallback(
    (e: React.PointerEvent, handle: Handle) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = {
        handle,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startCrop: { ...draft },
      }
    },
    [draft],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      const img = imgRef.current
      if (!img) return

      const r = img.getBoundingClientRect()
      const scaleX = image.width  / r.width
      const scaleY = image.height / r.height

      const dx = (e.clientX - drag.startPointerX) * scaleX
      const dy = (e.clientY - drag.startPointerY) * scaleY
      const { handle, startCrop } = drag
      let { x, y, width, height } = startCrop

      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

      if (handle === 'move') {
        x = clamp(Math.round(x + dx), 0, image.width  - width)
        y = clamp(Math.round(y + dy), 0, image.height - height)
      } else {
        if (handle.includes('w')) {
          const nx = clamp(Math.round(x + dx), 0, x + width - MIN_SIZE)
          width += x - nx
          x = nx
        } else if (handle.includes('e')) {
          width = clamp(Math.round(width + dx), MIN_SIZE, image.width - x)
        }
        if (handle.includes('n')) {
          const ny = clamp(Math.round(y + dy), 0, y + height - MIN_SIZE)
          height += y - ny
          y = ny
        } else if (handle.includes('s')) {
          height = clamp(Math.round(height + dy), MIN_SIZE, image.height - y)
        }
      }

      setDraft((prev) => ({ ...prev, x, y, width, height }))
    },
    [image.width, image.height, imgRef],
  )

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setDraft((d) => {
      onChange(d)
      return d
    })
  }, [onChange])

  const rectStyle = toStyle(draft)
  const { x, y, width, height } = draft

  return (
    <div
      ref={overlayRef}
      className="crop-overlay"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Four dim panels around the crop rect */}
      <div className="crop-shade crop-shade--top"    style={{ height: toStyle(draft).top }} />
      <div className="crop-shade crop-shade--bottom" style={{ top: `calc(${toStyle(draft).top} + ${toStyle(draft).height})` }} />
      <div className="crop-shade crop-shade--left"   style={{ top: toStyle(draft).top, height: toStyle(draft).height, width: toStyle(draft).left }} />
      <div className="crop-shade crop-shade--right"  style={{ top: toStyle(draft).top, height: toStyle(draft).height, left: `calc(${toStyle(draft).left} + ${toStyle(draft).width})` }} />

      {/* Crop rect */}
      <div
        className="crop-rect"
        style={rectStyle}
        onPointerDown={(e) => onPointerDown(e, 'move')}
      >
        {/* Rule-of-thirds lines */}
        <div className="crop-grid">
          <div className="crop-grid__v" style={{ left: '33.33%' }} />
          <div className="crop-grid__v" style={{ left: '66.66%' }} />
          <div className="crop-grid__h" style={{ top: '33.33%' }} />
          <div className="crop-grid__h" style={{ top: '66.66%' }} />
        </div>

        {/* 8 handles */}
        {(['nw','n','ne','w','e','sw','s','se'] as Handle[]).map((h) => (
          <div
            key={h}
            className={`crop-handle crop-handle--${h}`}
            onPointerDown={(e) => onPointerDown(e, h)}
          />
        ))}

        {/* Size label inside the rect */}
        <div className="crop-size-label">
          {Math.round(width)} × {Math.round(height)}
        </div>
      </div>

      {/* Origin label top-left corner of rect */}
      <div
        className="crop-pos-label"
        style={{ left: rectStyle.left, top: rectStyle.top }}
      >
        {Math.round(x)}, {Math.round(y)}
      </div>
    </div>
  )
}
