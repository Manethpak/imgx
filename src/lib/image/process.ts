import type { ColorOptions, EditorOptions, ImportedImage, ProcessedImage, SupportedMimeType } from '../../types/image'

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not process this image.'))
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: SupportedMimeType, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) { resolve(blob); return }
        reject(new Error('Could not create an image output.'))
      },
      type,
      type === 'image/png' ? undefined : quality,
    )
  })
}

function getResizeDimensions(sourceWidth: number, sourceHeight: number, options: EditorOptions['resize']) {
  const width = Math.max(1, Math.round(options.width))
  const height = Math.max(1, Math.round(options.height))

  if (!options.keepAspectRatio) return { width, height }

  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height

  if (sourceRatio > targetRatio) {
    return { width, height: Math.max(1, Math.round(width / sourceRatio)) }
  }
  return { width: Math.max(1, Math.round(height * sourceRatio)), height }
}

function getCropRect(sourceWidth: number, sourceHeight: number, options: EditorOptions['crop']) {
  const x = Math.min(Math.max(0, Math.round(options.x)), sourceWidth - 1)
  const y = Math.min(Math.max(0, Math.round(options.y)), sourceHeight - 1)
  const width = Math.min(Math.max(1, Math.round(options.width)), sourceWidth - x)
  const height = Math.min(Math.max(1, Math.round(options.height)), sourceHeight - y)
  return { x, y, width, height }
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Build a CSS filter string from ColorOptions that is applied to ctx.filter
 * BEFORE drawImage() so it is baked into the pixels that toBlob() captures.
 *
 * temperature / tint are simulated by chaining hue-rotate + saturate tweaks
 * into the same filter string — the real per-channel control is done later
 * in the pixel-manipulation pass.
 */
function buildCssFilter(c: ColorOptions): string {
  const parts: string[] = []

  // Brightness: 0 = neutral (100%), -100 → 0%, +100 → 200%
  parts.push(`brightness(${100 + c.brightness}%)`)

  // Contrast: same mapping
  parts.push(`contrast(${100 + c.contrast}%)`)

  // Saturation: 0 = neutral (100%), -100 → 0%, +100 → 200%
  parts.push(`saturate(${100 + c.saturation}%)`)

  // Hue rotation
  if (c.hueRotate !== 0) parts.push(`hue-rotate(${c.hueRotate}deg)`)

  // Grayscale
  if (c.grayscale > 0) parts.push(`grayscale(${c.grayscale}%)`)

  // Sepia
  if (c.sepia > 0) parts.push(`sepia(${c.sepia}%)`)

  // Invert
  if (c.invert) parts.push('invert(100%)')

  // Blur (applied via ctx.filter as well — will affect toBlob output)
  if (c.blur > 0) parts.push(`blur(${c.blur}px)`)

  return parts.join(' ')
}

/**
 * Per-pixel pass: exposure (multiplication), temperature/tint (RGB channel
 * offsets), vignette (radial darkening), noise (random grain), sharpen (3x3
 * convolution kernel). All operate on the already-drawn canvas.
 */
function applyPixelEffects(canvas: HTMLCanvasElement, c: ColorOptions) {
  const hasExposure = c.exposure !== 0
  const hasTemp = c.temperature !== 0
  const hasTint = c.tint !== 0
  const hasVignette = c.vignette > 0
  const hasNoise = c.noise > 0
  const hasSharpen = c.sharpen > 0

  if (!hasExposure && !hasTemp && !hasTint && !hasVignette && !hasNoise && !hasSharpen) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas

  // ── Sharpen via 3×3 unsharp-mask convolution ──────────────────────────────
  if (hasSharpen) {
    const src = ctx.getImageData(0, 0, width, height)
    const dst = ctx.createImageData(width, height)
    // strength scales the centre weight; edges weighted -strength/8 each
    const s = c.sharpen / 100  // 0..1
    const centre = 1 + 8 * s
    const edge = -s
    const kernel = [
      edge,   edge,   edge,
      edge,   centre, edge,
      edge,   edge,   edge,
    ]
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * width + (x + kx)) * 4
            const w = kernel[(ky + 1) * 3 + (kx + 1)]
            r += src.data[i]     * w
            g += src.data[i + 1] * w
            b += src.data[i + 2] * w
          }
        }
        const i = (y * width + x) * 4
        dst.data[i]     = Math.min(255, Math.max(0, r))
        dst.data[i + 1] = Math.min(255, Math.max(0, g))
        dst.data[i + 2] = Math.min(255, Math.max(0, b))
        dst.data[i + 3] = src.data[i + 3]
      }
    }
    // copy border pixels untouched
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          const i = (y * width + x) * 4
          dst.data[i]     = src.data[i]
          dst.data[i + 1] = src.data[i + 1]
          dst.data[i + 2] = src.data[i + 2]
          dst.data[i + 3] = src.data[i + 3]
        }
      }
    }
    ctx.putImageData(dst, 0, 0)
  }

  // ── Everything else (exposure, temperature, tint, vignette, noise) ─────────
  if (hasExposure || hasTemp || hasTint || hasVignette || hasNoise) {
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data
    const cx = width / 2
    const cy = height / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy)

    // Temperature: warm = boost R, cool = boost B
    // Map -100..100 → up to ±40 per channel
    const tempR = c.temperature > 0 ? (c.temperature / 100) * 40 : 0
    const tempB = c.temperature < 0 ? (-c.temperature / 100) * 40 : 0
    const tempG = 0 // temperature doesn't shift green

    // Tint: +tint = magenta (R+B up), −tint = green (G up)
    const tintR = c.tint > 0 ? (c.tint / 100) * 30 : 0
    const tintG = c.tint < 0 ? (-c.tint / 100) * 30 : 0
    const tintB = c.tint > 0 ? (c.tint / 100) * 20 : 0

    // Exposure: multiplicative — +100 = 2× brightness, −100 = 0×
    const expMult = c.exposure >= 0
      ? 1 + c.exposure / 100
      : 1 + c.exposure / 100   // same formula; exposure=-100 → mult=0

    const vigStrength = c.vignette / 100
    const noiseStrength = c.noise / 100

    // Seeded-ish noise: deterministic per pixel so results are stable
    // (Simple xorshift32 inline — no import needed)
    let seed = 0xDEADBEEF

    for (let i = 0; i < data.length; i += 4) {
      const pixelIdx = i / 4
      const px = pixelIdx % width
      const py = Math.floor(pixelIdx / width)

      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Exposure
      if (hasExposure) {
        r = r * expMult
        g = g * expMult
        b = b * expMult
      }

      // Temperature
      if (hasTemp) {
        r += tempR
        b += tempB
        g += tempG  // 0 — kept for symmetry
      }

      // Tint
      if (hasTint) {
        r += tintR
        g += tintG
        b += tintB
      }

      // Vignette — radial falloff; darkens corners
      if (hasVignette) {
        const dx = px - cx
        const dy = py - cy
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist  // 0..1
        // smooth cubic: starts attenuating at 40% radius
        const t = Math.max(0, (dist - 0.4) / 0.6)
        const factor = 1 - vigStrength * t * t * t
        r *= factor
        g *= factor
        b *= factor
      }

      // Noise — additive grain
      if (hasNoise) {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
        const grain = ((seed & 0xFF) / 255 - 0.5) * 2 * noiseStrength * 64
        r += grain
        g += grain
        b += grain
      }

      data[i]     = Math.min(255, Math.max(0, r))
      data[i + 1] = Math.min(255, Math.max(0, g))
      data[i + 2] = Math.min(255, Math.max(0, b))
    }
    ctx.putImageData(imgData, 0, 0)
  }
}

export async function processImage(source: ImportedImage, options: EditorOptions): Promise<ProcessedImage> {
  const image = await loadHtmlImage(source.url)
  const crop = getCropRect(source.width, source.height, options.crop)
  const resize = getResizeDimensions(crop.width, crop.height, options.resize)
  const rotateQuarterTurns = options.transform.rotate === 90 || options.transform.rotate === 270
  const outputWidth = rotateQuarterTurns ? resize.height : resize.width
  const outputHeight = rotateQuarterTurns ? resize.width : resize.height
  const workingCanvas = createCanvas(outputWidth, outputHeight)
  const ctx = workingCanvas.getContext('2d')

  if (!ctx) throw new Error('Could not create a canvas context.')

  if (options.output.format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputWidth, outputHeight)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // ── Apply CSS-based color filter BEFORE drawImage so it is baked in ──────
  const cssFilter = buildCssFilter(options.color)
  ctx.filter = cssFilter

  ctx.translate(outputWidth / 2, outputHeight / 2)
  ctx.rotate((options.transform.rotate * Math.PI) / 180)
  ctx.scale(options.transform.flipHorizontal ? -1 : 1, options.transform.flipVertical ? -1 : 1)

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    -resize.width / 2, -resize.height / 2, resize.width, resize.height,
  )

  // Reset filter so pixel reads are clean
  ctx.filter = 'none'
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  // ── Pixel-level effects (exposure, temp, tint, vignette, noise, sharpen) ─
  applyPixelEffects(workingCanvas, options.color)

  const blob = await canvasToBlob(workingCanvas, options.output.format, options.output.quality / 100)
  const url = URL.createObjectURL(blob)

  return {
    blob,
    url,
    width: outputWidth,
    height: outputHeight,
    size: blob.size,
    type: options.output.format,
  }
}

export function createDefaultOptions(image?: ImportedImage): EditorOptions {
  return {
    resize: {
      width: image?.width ?? 1200,
      height: image?.height ?? 800,
      keepAspectRatio: true,
    },
    crop: {
      x: 0,
      y: 0,
      width: image?.width ?? 1200,
      height: image?.height ?? 800,
    },
    transform: {
      rotate: 0,
      flipHorizontal: false,
      flipVertical: false,
    },
    color: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hueRotate: 0,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      invert: false,
      temperature: 0,
      tint: 0,
      exposure: 0,
      vignette: 0,
      noise: 0,
      sharpen: 0,
    },
    output: {
      format: image?.type ?? 'image/webp',
      quality: 82,
    },
  }
}

export function updateOptionsForImage(image: ImportedImage, current?: EditorOptions): EditorOptions {
  if (!current) return createDefaultOptions(image)

  return {
    ...current,
    resize: {
      ...current.resize,
      width: image.width,
      height: image.height,
    },
    crop: {
      ...current.crop,
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    },
    output: {
      ...current.output,
      format: image.type,
    },
  }
}

export const DEFAULT_COLOR: ColorOptions = {
  brightness: 0, contrast: 0, saturation: 0,
  hueRotate: 0, blur: 0, grayscale: 0,
  sepia: 0, invert: false,
  temperature: 0, tint: 0, exposure: 0,
  vignette: 0, noise: 0, sharpen: 0,
}
