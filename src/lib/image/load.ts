import { supportedMimeTypes, type ImportedImage, type SupportedMimeType } from '../../types/image'

const MAX_FILE_SIZE = 25 * 1024 * 1024

function isSupportedMimeType(value: string): value is SupportedMimeType {
  return supportedMimeTypes.includes(value as SupportedMimeType)
}

function detectMimeTypeFromBase64(base64: string): SupportedMimeType {
  const normalized = base64.replace(/\s/g, '')

  if (normalized.startsWith('/9j/')) {
    return 'image/jpeg'
  }

  if (normalized.startsWith('iVBORw0KGgo')) {
    return 'image/png'
  }

  if (normalized.startsWith('UklGR')) {
    return 'image/webp'
  }

  return 'image/png'
}

function createImageRecord(file: File, url: string, source: ImportedImage['source']): Promise<ImportedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        file,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size,
        type: file.type as SupportedMimeType,
        source,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this image. Try another file or format.'))
    }

    image.src = url
  })
}

function validateFile(file: File) {
  if (!isSupportedMimeType(file.type)) {
    throw new Error('Use a PNG, JPEG, or WebP image.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Use an image smaller than 25 MB for the first build.')
  }
}

export async function loadImageFromFile(file: File): Promise<ImportedImage> {
  validateFile(file)
  const url = URL.createObjectURL(file)
  return createImageRecord(file, url, 'file')
}

export async function loadImageFromBase64(input: string): Promise<ImportedImage> {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new Error('Paste a base64 string or data URL.')
  }

  const dataUrl = trimmed.startsWith('data:image/')
    ? trimmed
    : `data:${detectMimeTypeFromBase64(trimmed)};base64,${trimmed.replace(/\s/g, '')}`

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)

  if (!match) {
    throw new Error('The pasted value is not a valid image base64 string.')
  }

  const mimeType = match[1]
  const encoded = match[2].replace(/\s/g, '')

  if (!isSupportedMimeType(mimeType)) {
    throw new Error('Only PNG, JPEG, and WebP base64 inputs are supported right now.')
  }

  let bytes: Uint8Array

  try {
    const decoded = atob(encoded)
    bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0))
  } catch {
    throw new Error('The pasted base64 content could not be decoded.')
  }

  const copiedBytes = new Uint8Array(bytes.length)
  copiedBytes.set(bytes)
  const file = new File([copiedBytes], `pasted-image.${mimeType.split('/')[1]}`, { type: mimeType })
  validateFile(file)
  const url = URL.createObjectURL(file)

  return createImageRecord(file, url, 'base64')
}

export function revokeImageUrl(url: string) {
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}
