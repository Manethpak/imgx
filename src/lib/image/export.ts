import type { ExportFormat, ProcessedImage } from '../../types/image'

// ── ICO encoder (single-image, uncompressed BITMAPINFOHEADER) ───────────

function createIcoBlob(canvas: HTMLCanvasElement): Blob {
  const size = Math.min(canvas.width, canvas.height, 256)

  const ico = document.createElement('canvas')
  ico.width = size
  ico.height = size
  const ctx = ico.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, size, size)

  const imageData = ctx.getImageData(0, 0, size, size)
  const pixels = imageData.data

  // BMP pixel rows are bottom-to-top, BGRA
  const bmpPixels = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcOffset = (y * size + x) * 4
      const dstOffset = ((size - 1 - y) * size + x) * 4
      bmpPixels[dstOffset] = pixels[srcOffset + 2]
      bmpPixels[dstOffset + 1] = pixels[srcOffset + 1]
      bmpPixels[dstOffset + 2] = pixels[srcOffset]
      bmpPixels[dstOffset + 3] = pixels[srcOffset + 3]
    }
  }

  const andRowBytes = Math.ceil(size / 8)
  const andPaddedRow = Math.ceil(andRowBytes / 4) * 4
  const andMask = new Uint8Array(andPaddedRow * size)

  const bmpInfoSize = 40
  const imageSize = bmpPixels.length + andMask.length
  const totalDataSize = bmpInfoSize + imageSize

  const buffer = new ArrayBuffer(6 + 16 + totalDataSize)
  const view = new DataView(buffer)

  // ICO header
  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, 1, true)

  // Directory entry
  const e = 6
  view.setUint8(e, size >= 256 ? 0 : size)
  view.setUint8(e + 1, size >= 256 ? 0 : size)
  view.setUint8(e + 2, 0)
  view.setUint8(e + 3, 0)
  view.setUint16(e + 4, 1, true)
  view.setUint16(e + 6, 32, true)
  view.setUint32(e + 8, totalDataSize, true)
  view.setUint32(e + 12, 22, true)

  // BITMAPINFOHEADER
  const b = 22
  view.setUint32(b, bmpInfoSize, true)
  view.setInt32(b + 4, size, true)
  view.setInt32(b + 8, size * 2, true)
  view.setUint16(b + 12, 1, true)
  view.setUint16(b + 14, 32, true)
  view.setUint32(b + 16, 0, true)
  view.setUint32(b + 20, imageSize, true)

  const arr = new Uint8Array(buffer)
  arr.set(bmpPixels, b + bmpInfoSize)
  arr.set(andMask, b + bmpInfoSize + bmpPixels.length)

  return new Blob([buffer], { type: 'image/x-icon' })
}

// ── Helpers ─────────────────────────────────────────────────────────────

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image for encoding.'))
    img.src = url
  })
}

// ── Re-encode to any export format ──────────────────────────────────────

export async function reEncodeAs(source: ProcessedImage, format: ExportFormat, quality: number): Promise<Blob> {
  const img = await loadHtmlImage(source.url)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, 0, 0)

  if (format === 'image/x-icon') {
    return createIcoBlob(canvas)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image.'))),
      format,
      format === 'image/png' ? undefined : quality / 100,
    )
  })
}

// ── Download / clipboard / base64 ───────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadProcessedImage(image: ProcessedImage, baseName: string) {
  const extension = image.type.split('/')[1]
  const link = document.createElement('a')
  link.href = image.url
  link.download = `${baseName}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not generate base64 output.'))
    reader.readAsDataURL(blob)
  })
}

export async function copyBlobBase64(blob: Blob): Promise<string> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard is not available in this browser.')
  }

  const dataUrl = await blobToDataUrl(blob)
  await navigator.clipboard.writeText(dataUrl)
  return dataUrl
}

export async function copyBase64ToClipboard(image: ProcessedImage) {
  return copyBlobBase64(image.blob)
}

// ── Format helpers ──────────────────────────────────────────────────────

export function formatExtension(format: ExportFormat): string {
  const map: Record<ExportFormat, string> = {
    'image/webp': 'webp',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/x-icon': 'ico',
  }
  return map[format]
}

export function formatLabel(format: ExportFormat): string {
  const map: Record<ExportFormat, string> = {
    'image/webp': 'WebP',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/x-icon': 'ICO',
  }
  return map[format]
}
