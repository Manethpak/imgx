import { useCallback, useEffect, useState, type DragEvent } from 'react'
import './App.css'
import { DropScreen } from './components/DropScreen'
import { ExportDialog } from './components/ExportDialog'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Preview } from './components/Preview'
import { Toast } from './components/Toast'
import { Toolbar } from './components/Toolbar'
import { loadImageFromBase64, loadImageFromFile, revokeImageUrl } from './lib/image/load'
import { createDefaultOptions, processImage, updateOptionsForImage } from './lib/image/process'
import type { EditorOptions, ImportedImage, ProcessedImage } from './types/image'

function App() {
  const [image, setImage] = useState<ImportedImage | null>(null)
  const [result, setResult] = useState<ProcessedImage | null>(null)
  const [options, setOptions] = useState<EditorOptions>(() => createDefaultOptions())
  const [isImporting, setIsImporting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (image) revokeImageUrl(image.url)
      if (result) revokeImageUrl(result.url)
    }
  }, [image, result])

  // Import file
  const importFile = useCallback(async (file: File) => {
    setIsImporting(true)
    try {
      const next = await loadImageFromFile(file)
      setImage((prev) => { if (prev) revokeImageUrl(prev.url); return next })
      setOptions((prev) => updateOptionsForImage(next, prev))
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not load that image.')
    } finally {
      setIsImporting(false)
    }
  }, [])

  // Import base64
  const importBase64 = useCallback(async (raw: string) => {
    setIsImporting(true)
    try {
      const next = await loadImageFromBase64(raw)
      setImage((prev) => { if (prev) revokeImageUrl(prev.url); return next })
      setOptions((prev) => updateOptionsForImage(next, prev))
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not decode base64.')
    } finally {
      setIsImporting(false)
    }
  }, [])

  // Clipboard paste — works on both screens
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) { e.preventDefault(); await importFile(file) }
          return
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [importFile])

  // Global drop handler for editor mode
  useEffect(() => {
    if (!image) return // DropScreen handles its own drops

    function preventDrop(e: DragEvent | Event) { e.preventDefault() }

    async function handleDrop(e: DragEvent | Event) {
      e.preventDefault()
      const file = (e as DragEvent<Element>).dataTransfer?.files?.[0]
      if (file?.type.startsWith('image/')) {
        await importFile(file)
      }
    }

    window.addEventListener('dragover', preventDrop)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', preventDrop)
      window.removeEventListener('drop', handleDrop)
    }
  }, [image, importFile])

  // Auto-process
  useEffect(() => {
    if (!image) {
      setResult((prev) => { if (prev) revokeImageUrl(prev.url); return null })
      return
    }

    let cancelled = false
    const id = window.setTimeout(async () => {
      setIsProcessing(true)
      try {
        const next = await processImage(image, options)
        if (cancelled) { revokeImageUrl(next.url); return }
        setResult((prev) => { if (prev) revokeImageUrl(prev.url); return next })
      } catch (err) {
        if (!cancelled) setToast(err instanceof Error ? err.message : 'Processing failed.')
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }, 100)

    return () => { cancelled = true; window.clearTimeout(id) }
  }, [image, options])

  // Resize field helper (aspect ratio lock)
  function setResizeField(field: 'width' | 'height', value: number) {
    setOptions((cur) => {
      const v = Math.max(1, value || 1)
      if (!image || !cur.resize.keepAspectRatio) {
        return { ...cur, resize: { ...cur.resize, [field]: v } }
      }
      const ratio = image.width / image.height
      return {
        ...cur,
        resize: {
          ...cur.resize,
          width: field === 'width' ? v : Math.max(1, Math.round(v * ratio)),
          height: field === 'height' ? v : Math.max(1, Math.round(v / ratio)),
        },
      }
    })
  }

  function clearImage() {
    setImage((c) => { if (c) revokeImageUrl(c.url); return null })
    setResult((c) => { if (c) revokeImageUrl(c.url); return null })
    setOptions(createDefaultOptions())
    setShowExport(false)
  }

  // File input handler for toolbar "New" re-import
  void 0 // placeholder

  // Derive base name for export
  const baseName = image?.file.name.replace(/\.[^.]+$/, '') ?? 'image'

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        {!image ? (
          <DropScreen
            isImporting={isImporting}
            onFile={(f) => void importFile(f)}
            onBase64={(s) => void importBase64(s)}
          />
        ) : (
          <div className="editor fade-in">
            <Toolbar
              image={image}
              options={options}
              onChange={setOptions}
              onResizeField={setResizeField}
              onExport={() => setShowExport(true)}
              onNewImage={clearImage}
              isProcessing={isProcessing}
            />
            <Preview
              image={image}
              result={result}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </main>

      {showExport && result && (
        <ExportDialog
          result={result}
          baseName={baseName}
          quality={options.output.quality}
          onClose={() => setShowExport(false)}
          onToast={(msg) => { setToast(msg); setShowExport(false) }}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <Footer />
    </div>
  )
}

export default App
