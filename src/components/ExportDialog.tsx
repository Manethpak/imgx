import { useEffect, useState } from "react";
import type { ExportFormat, ProcessedImage } from "../types/image";
import { exportFormats } from "../types/image";
import {
  copyBlobImage,
  copyBlobBase64,
  downloadBlob,
  formatExtension,
  formatLabel,
  reEncodeAs,
} from "../lib/image/export";
import { formatBytes } from "../lib/image/load";

type ExportDialogProps = {
  result: ProcessedImage;
  baseName: string;
  quality: number;
  onClose: () => void;
  onToast: (message: string) => void;
};

export function ExportDialog({
  result,
  baseName,
  quality,
  onClose,
  onToast,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    result.type as ExportFormat,
  );
  const [isEncoding, setIsEncoding] = useState(false);
  const [previewSize, setPreviewSize] = useState(formatBytes(result.size));
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);

  async function getBlob(): Promise<Blob> {
    if (selectedFormat === result.type) {
      return result.blob;
    }
    return reEncodeAs(result, selectedFormat, quality);
  }

  async function handleDownload() {
    setIsEncoding(true);
    try {
      const blob = await getBlob();
      const ext = formatExtension(selectedFormat);
      downloadBlob(blob, `${baseName}.${ext}`);
      onToast(`Downloaded as .${ext}`);
    } catch {
      onToast("Download failed");
    } finally {
      setIsEncoding(false);
    }
  }

  async function handleCopy() {
    setIsEncoding(true);
    try {
      const blob = await getBlob();
      await copyBlobBase64(blob);
      onToast("Base64 copied to clipboard");
    } catch {
      onToast("Copy failed");
    } finally {
      setIsEncoding(false);
    }
  }

  async function handleCopyImage() {
    setIsEncoding(true);
    try {
      const blob = selectedFormat === "image/png"
        ? await getBlob()
        : await reEncodeAs(result, "image/png", quality);
      await copyBlobImage(blob);
      onToast("Image copied to clipboard");
    } catch {
      onToast("Image copy failed");
    } finally {
      setIsEncoding(false);
    }
  }

  // Keep the displayed output size in sync with the selected export format.
  useEffect(() => {
    let cancelled = false;

    async function calculatePreviewSize() {
      if (selectedFormat === result.type) {
        setPreviewSize(formatBytes(result.size));
        setIsCalculatingSize(false);
        return;
      }

      setIsCalculatingSize(true);
      try {
        const blob = await reEncodeAs(result, selectedFormat, quality);
        if (!cancelled) setPreviewSize(formatBytes(blob.size));
      } catch {
        if (!cancelled) setPreviewSize("Size unavailable");
      } finally {
        if (!cancelled) setIsCalculatingSize(false);
      }
    }

    void calculatePreviewSize();

    return () => {
      cancelled = true;
    };
  }, [quality, result, selectedFormat]);

  return (
    <aside className="export-mini-bar slide-up" aria-label="Export options">
      <div className="export-mini-bar__summary">
        <strong>Export</strong>
        <span>
          {result.width}x{result.height} &middot; {isCalculatingSize ? "Calculating size…" : previewSize}
        </span>
        {selectedFormat === "image/x-icon" && (
          <span className="export-mini-bar__note">
            ICO: {Math.min(result.width, result.height, 256)}px max
          </span>
        )}
      </div>

      <div className="format-picker" aria-label="Export format">
        {exportFormats.map((fmt) => (
          <button
            key={fmt}
            type="button"
            className={`format-chip ${selectedFormat === fmt ? "format-chip--active" : ""}`}
            onClick={() => setSelectedFormat(fmt)}
          >
            .{formatExtension(fmt)}
            <span className="format-chip__label">{formatLabel(fmt)}</span>
          </button>
        ))}
      </div>

      <div className="export-actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => void handleDownload()}
          disabled={isEncoding}
        >
          Download .{formatExtension(selectedFormat)}
        </button>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void handleCopyImage()}
          disabled={isEncoding}
        >
          Copy image
        </button>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void handleCopy()}
          disabled={isEncoding}
        >
          Copy base64
        </button>

        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close export options"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
