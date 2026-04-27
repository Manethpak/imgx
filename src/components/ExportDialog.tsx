import { useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    result.type as ExportFormat,
  );
  const [isEncoding, setIsEncoding] = useState(false);
  const [base64Output, setBase64Output] = useState("");

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

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

  // Compute preview size
  const isNativeFormat = selectedFormat === result.type;
  const previewSize = isNativeFormat ? formatBytes(result.size) : null;

  return (
    <div className="export-backdrop fade-in" onClick={handleBackdropClick}>
      <div className="export-dialog slide-up" ref={dialogRef}>
        <div className="export-dialog__header">
          <h2>Export</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
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

        {/* Format picker */}
        <div className="format-picker">
          {exportFormats.map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={`format-chip ${selectedFormat === fmt ? "format-chip--active" : ""}`}
              onClick={() => {
                setSelectedFormat(fmt);
                setBase64Output("");
              }}
            >
              .{formatExtension(fmt)}
              <span className="format-chip__label">{formatLabel(fmt)}</span>
            </button>
          ))}
        </div>

        {previewSize && (
          <p className="export-dialog__size">
            {result.width}x{result.height} &middot; {previewSize}
          </p>
        )}

        {selectedFormat === "image/x-icon" && (
          <p className="export-dialog__note">
            ICO will be resized to {Math.min(result.width, result.height, 256)}
            px (max 256px).
          </p>
        )}

        {/* Actions */}
        <div className="export-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleDownload()}
            disabled={isEncoding}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download .{formatExtension(selectedFormat)}
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void handleCopyImage()}
            disabled={isEncoding}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy image
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void handleCopy()}
            disabled={isEncoding}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy base64
          </button>
        </div>

        {base64Output && (
          <textarea
            className="export-base64 slide-down"
            readOnly
            value={base64Output}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        )}
      </div>
    </div>
  );
}
