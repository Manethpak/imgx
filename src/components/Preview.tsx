import { useRef, useState } from "react";
import type {
  CropOptions,
  ImportedImage,
  ProcessedImage,
} from "../types/image";
import { formatBytes } from "../lib/image/load";
import { CropOverlay } from "./CropOverlay";

type PreviewProps = {
  image: ImportedImage;
  result: ProcessedImage | null;
  isProcessing: boolean;
  cropActive: boolean;
  crop: CropOptions;
  onCropChange: (next: CropOptions) => void;
};

export function Preview({
  image,
  result,
  isProcessing,
  cropActive,
  crop,
  onCropChange,
}: PreviewProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const displayUrl = showOriginal ? image.url : (result?.url ?? image.url);
  const displayLabel = showOriginal ? "Original" : "Output";

  const savings =
    result && image.size > 0
      ? Math.round(((image.size - result.size) / image.size) * 100)
      : null;

  // When crop is active, always show the original so the user crops the source
  const effectiveUrl = cropActive ? image.url : displayUrl;
  const effectiveLabel = cropActive ? "Original" : displayLabel;

  return (
    <div className="preview fade-in">
      <div className="preview__bar">
        <button
          type="button"
          className={`preview-toggle ${showOriginal ? "preview-toggle--active" : ""}`}
          onClick={() => setShowOriginal(true)}
          disabled={cropActive}
        >
          Original
          <span className="preview-toggle__meta">
            {image.width}x{image.height} &middot; {formatBytes(image.size)}
          </span>
        </button>

        <button
          type="button"
          className={`preview-toggle ${!showOriginal ? "preview-toggle--active" : ""}`}
          onClick={() => setShowOriginal(false)}
          disabled={cropActive}
        >
          Output
          {result && (
            <span className="preview-toggle__meta">
              {result.width}x{result.height} &middot; {formatBytes(result.size)}
              {savings !== null && (
                <span
                  className={`badge ${savings > 0 ? "badge--positive" : "badge--negative"}`}
                >
                  {savings > 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
                </span>
              )}
            </span>
          )}
        </button>
      </div>

      <div className="preview__frame checkerboard">
        <div className="preview__img-wrap">
          <img
            ref={imgRef}
            src={effectiveUrl}
            alt={effectiveLabel}
            className="preview__image"
            key={effectiveUrl}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
          {cropActive && (
            <CropOverlay
              image={image}
              imgRef={imgRef}
              crop={crop}
              onChange={onCropChange}
            />
          )}
        </div>

        {isProcessing && !cropActive && (
          <div className="preview__processing">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
