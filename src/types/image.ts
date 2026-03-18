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

export type ResizeOptions = {
  enabled: boolean
  width: number
  height: number
  keepAspectRatio: boolean
}

export type CropOptions = {
  enabled: boolean
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

export type OutputOptions = {
  format: SupportedMimeType
  quality: number
}

export type EditorOptions = {
  resize: ResizeOptions
  crop: CropOptions
  transform: TransformOptions
  output: OutputOptions
}
