import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react'

type DropScreenProps = {
  isImporting: boolean
  onFile: (file: File) => void
  onBase64: (raw: string) => void
}

export function DropScreen({ isImporting, onFile, onBase64 }: DropScreenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showBase64, setShowBase64] = useState(false)
  const [base64Value, setBase64Value] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when shown
  useEffect(() => {
    if (showBase64 && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [showBase64])

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  function handleBase64Submit() {
    if (base64Value.trim()) {
      onBase64(base64Value.trim())
    }
  }

  return (
    <div className="drop-screen fade-in">
      <div className="drop-screen__content">
        <label
          className={`drop-area ${isDragging ? 'drop-area--active' : ''} ${isImporting ? 'drop-area--loading' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />

          <div className="drop-area__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <strong className="drop-area__title">
            {isImporting ? 'Loading...' : 'Drop image here'}
          </strong>
          <span className="drop-area__hint">or click to browse</span>
        </label>

        <div className="drop-screen__alt">
          <button
            type="button"
            className={`link-button ${showBase64 ? 'link-button--active' : ''}`}
            onClick={() => setShowBase64(!showBase64)}
          >
            {showBase64 ? 'Hide base64 input' : 'Paste base64 instead'}
          </button>

          <span className="drop-screen__formats">PNG, JPEG, WebP &middot; up to 25 MB &middot; Ctrl+V to paste</span>
        </div>

        {showBase64 && (
          <div className="base64-import slide-down">
            <textarea
              ref={textareaRef}
              className="base64-import__input"
              placeholder="Paste base64 string or data URL..."
              value={base64Value}
              onChange={(e) => setBase64Value(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleBase64Submit()
                }
              }}
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleBase64Submit}
              disabled={!base64Value.trim() || isImporting}
            >
              Load
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
