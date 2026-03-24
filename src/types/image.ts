export const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export type SupportedMimeType = (typeof supportedMimeTypes)[number]

/** Formats available for export (superset of input formats) */
export const exportFormats = ['image/webp', 'image/png', 'image/jpeg', 'image/x-icon'] as const

export type ExportFormat = (typeof exportFormats)[number]

export type ImportSource = 'file' | 'base64'

export type ImportedImage = {
  file: File
  url: string
  width: number
  height: number
  size: number
  type: SupportedMimeType
  source: ImportSource
}

export type ProcessedImage = {
  blob: Blob
  url: string
  width: number
  height: number
  size: number
  type: SupportedMimeType
}

export type ImageInputError = {
  title: string
  message: string
}

/** A single entry in the recents list stored in IndexedDB. */
export type RecentEntry = {
  id: string
  name: string
  type: SupportedMimeType
  size: number
  width: number
  height: number
  addedAt: number   // Unix ms timestamp
  blob: Blob        // The original file blob — stored natively in IDB
}

export type ResizeOptions = {
  width: number
  height: number
  keepAspectRatio: boolean
}

export type CropOptions = {
  x: number
  y: number
  width: number
  height: number
}

export type TransformOptions = {
  rotate: 0 | 90 | 180 | 270
  flipHorizontal: boolean
  flipVertical: boolean
}

export type ColorOptions = {
  // ctx.filter-based adjustments
  brightness: number      // -100 to 100  (0 = neutral)
  contrast: number        // -100 to 100  (0 = neutral)
  saturation: number      // -100 to 100  (0 = neutral)
  hueRotate: number       // 0 to 360 deg
  blur: number            // 0 to 20 px
  grayscale: number       // 0 to 100 %
  sepia: number           // 0 to 100 %
  invert: boolean
  // Simulated via ctx.filter
  temperature: number     // -100 (cool/blue) to 100 (warm/orange)
  tint: number            // -100 (green) to 100 (magenta)
  exposure: number        // -100 to 100  (multiplicative brightness)
  // Pixel-manipulation effects
  vignette: number        // 0 to 100
  noise: number           // 0 to 100
  sharpen: number         // 0 to 100
}

export type OutputOptions = {
  format: SupportedMimeType
  quality: number
}

export type EditorOptions = {
  resize: ResizeOptions
  crop: CropOptions
  transform: TransformOptions
  color: ColorOptions
  output: OutputOptions
}
