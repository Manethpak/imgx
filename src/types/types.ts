export type ImageFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
  format: ImageFormat;
}

export interface ProcessedImage {
  url: string;
  width: number;
  height: number;
  size: number;
  format: ImageFormat;
  blob: Blob;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

export interface CompressOptions {
  quality: number; // 0-100
}

export interface ConvertOptions {
  format: ImageFormat;
  quality?: number;
}

export type ToolType =
  | "resize"
  | "compress"
  | "convert"
  | "transform"
  | "filter";

export interface Base64Result {
  dataUrl: string;
  base64: string;
  size: number;
}

/** Combined rotate, flip, skew */
export interface TransformOptions {
  angle: number; // degrees
  horizontal: boolean;
  vertical: boolean;
  skewX: number; // degrees
  skewY: number;
}

export interface FilterOptions {
  opacity?: number; // 0-1
  brightness?: number;
  contrast?: number;
  grayscale?: number;
  sepia?: number;
  invert?: number;
  blur?: number; // px
}

/** Pipeline options: one set per stage, applied in order */
export interface PipelineOptions {
  resize: ResizeOptions;
  compress: CompressOptions;
  convert: ConvertOptions;
  transform: TransformOptions;
  filter: FilterOptions;
}
