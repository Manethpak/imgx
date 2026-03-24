import { useCallback, useEffect, useState, type DragEvent } from "react";
import "./App.css";
import { ColorPanel } from "./components/ColorPanel";
import { DropScreen } from "./components/DropScreen";
import { ExportDialog } from "./components/ExportDialog";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Preview } from "./components/Preview";
import { Toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import {
  loadImageFromBase64,
  loadImageFromFile,
  revokeImageUrl,
} from "./lib/image/load";
import {
  createDefaultOptions,
  processImage,
  updateOptionsForImage,
} from "./lib/image/process";
import {
  addRecent,
  buildRecentEntry,
  clearRecents,
  loadRecents,
  removeRecent,
} from "./lib/image/recents";
import type {
  EditorOptions,
  ImportedImage,
  ProcessedImage,
  RecentEntry,
} from "./types/image";

function App() {
  const [image, setImage] = useState<ImportedImage | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [options, setOptions] = useState<EditorOptions>(() =>
    createDefaultOptions(),
  );
  const [isImporting, setIsImporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"resize" | "crop" | null>(
    null,
  );
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  // Load recents from IndexedDB on mount
  useEffect(() => {
    loadRecents()
      .then(setRecents)
      .catch(() => {/* IDB unavailable, silently skip */})
  }, []);

  // Persist a newly imported image to recents
  const saveToRecents = useCallback(async (imported: ImportedImage) => {
    try {
      const entry = await buildRecentEntry(imported.file, imported.width, imported.height);
      await addRecent(entry);
      setRecents(await loadRecents());
    } catch {
      // Non-fatal — recents are a convenience feature
    }
  }, []);

  // Import file
  const importFile = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const next = await loadImageFromFile(file);
      setImage((prev) => {
        if (prev) revokeImageUrl(prev.url);
        return next;
      });
      setOptions((prev) => updateOptionsForImage(next, prev));
      void saveToRecents(next);
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Could not load that image.",
      );
    } finally {
      setIsImporting(false);
    }
  }, [saveToRecents]);

  // Import base64
  const importBase64 = useCallback(async (raw: string) => {
    setIsImporting(true);
    try {
      const next = await loadImageFromBase64(raw);
      setImage((prev) => {
        if (prev) revokeImageUrl(prev.url);
        return next;
      });
      setOptions((prev) => updateOptionsForImage(next, prev));
      void saveToRecents(next);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not decode base64.");
    } finally {
      setIsImporting(false);
    }
  }, [saveToRecents]);

  // Re-open an image from the recents list
  const openRecent = useCallback(async (entry: RecentEntry) => {
    await importFile(entry.blob as File);
  }, [importFile]);

  // Remove one recent entry
  const handleRemoveRecent = useCallback(async (id: string) => {
    try {
      await removeRecent(id);
      setRecents((prev) => prev.filter((e) => e.id !== id));
    } catch {/* ignore */}
  }, []);

  // Clear all recents
  const handleClearRecents = useCallback(async () => {
    try {
      await clearRecents();
      setRecents([]);
    } catch {/* ignore */}
  }, []);

  // Clipboard paste — works on both screens
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await importFile(file);
          }
          return;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [importFile]);

  // Global drop handler for editor mode
  useEffect(() => {
    if (!image) return; // DropScreen handles its own drops

    function preventDrop(e: DragEvent | Event) {
      e.preventDefault();
    }

    async function handleDrop(e: DragEvent | Event) {
      e.preventDefault();
      const file = (e as DragEvent<Element>).dataTransfer?.files?.[0];
      if (file?.type.startsWith("image/")) {
        await importFile(file);
      }
    }

    window.addEventListener("dragover", preventDrop);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", preventDrop);
      window.removeEventListener("drop", handleDrop);
    };
  }, [image, importFile]);

  // Auto-process
  useEffect(() => {
    if (!image) {
      setResult((prev) => {
        if (prev) revokeImageUrl(prev.url);
        return null;
      });
      return;
    }

    let cancelled = false;
    const id = window.setTimeout(async () => {
      setIsProcessing(true);
      try {
        const next = await processImage(image, options);
        if (cancelled) {
          revokeImageUrl(next.url);
          return;
        }
        setResult((prev) => {
          if (prev) revokeImageUrl(prev.url);
          return next;
        });
      } catch (err) {
        if (!cancelled)
          setToast(err instanceof Error ? err.message : "Processing failed.");
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [image, options]);

  // Resize field helper (aspect ratio lock)
  function setResizeField(field: "width" | "height", value: number) {
    setOptions((cur) => {
      const v = Math.max(1, value || 1);
      if (!image || !cur.resize.keepAspectRatio) {
        return { ...cur, resize: { ...cur.resize, [field]: v } };
      }
      const ratio = image.width / image.height;
      return {
        ...cur,
        resize: {
          ...cur.resize,
          width: field === "width" ? v : Math.max(1, Math.round(v * ratio)),
          height: field === "height" ? v : Math.max(1, Math.round(v / ratio)),
        },
      };
    });
  }

  function clearImage() {
    setImage((c) => {
      if (c) revokeImageUrl(c.url);
      return null;
    });
    setResult((c) => {
      if (c) revokeImageUrl(c.url);
      return null;
    });
    setOptions(createDefaultOptions());
    setShowExport(false);
    setActivePanel(null);
    setColorPanelOpen(false);
  }

  // Derive base name for export
  const baseName = image?.file.name.replace(/\.[^.]+$/, "") ?? "image";

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        {!image ? (
          <DropScreen
            isImporting={isImporting}
            onFile={(f) => void importFile(f)}
            onBase64={(s) => void importBase64(s)}
            recents={recents}
            onOpenRecent={(entry) => void openRecent(entry)}
            onRemoveRecent={(id) => void handleRemoveRecent(id)}
            onClearRecents={() => void handleClearRecents()}
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
              activePanel={activePanel}
              onActivePanelChange={setActivePanel}
              colorPanelOpen={colorPanelOpen}
              onToggleColorPanel={() => setColorPanelOpen((v) => !v)}
            />
            <Preview
              image={image}
              result={result}
              isProcessing={isProcessing}
              cropActive={activePanel === "crop"}
              crop={options.crop}
              onCropChange={(next) =>
                setOptions((cur) => ({ ...cur, crop: next }))
              }
            />
            {colorPanelOpen && (
              <ColorPanel
                color={options.color}
                onChange={(next) => setOptions((cur) => ({ ...cur, color: next }))}
                onClose={() => setColorPanelOpen(false)}
              />
            )}
          </div>
        )}
      </main>

      {showExport && result && (
        <ExportDialog
          result={result}
          baseName={baseName}
          quality={options.output.quality}
          onClose={() => setShowExport(false)}
          onToast={(msg) => {
            setToast(msg);
            setShowExport(false);
          }}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <Footer />
    </div>
  );
}

export default App;
