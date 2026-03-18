import type { EditorOptions, ImportedImage, ProcessedImage, SupportedMimeType } from '../../types/image'

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not process this image.'))
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: SupportedMimeType, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Could not create an image output.'))
      },
      type,
      type === 'image/png' ? undefined : quality,
    )
  })
}

function getResizeDimensions(sourceWidth: number, sourceHeight: number, options: EditorOptions['resize']) {
  if (!options.enabled) {
    return { width: sourceWidth, height: sourceHeight }
  }

  const width = Math.max(1, Math.round(options.width))
  const height = Math.max(1, Math.round(options.height))

  if (!options.keepAspectRatio) {
    return { width, height }
  }

  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height

  if (sourceRatio > targetRatio) {
    return { width, height: Math.max(1, Math.round(width / sourceRatio)) }
  }

  return { width: Math.max(1, Math.round(height * sourceRatio)), height }
}

function getCropRect(sourceWidth: number, sourceHeight: number, options: EditorOptions['crop']) {
  if (!options.enabled) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight }
  }

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

export async function processImage(source: ImportedImage, options: EditorOptions): Promise<ProcessedImage> {
  const image = await loadHtmlImage(source.url)
  const crop = getCropRect(source.width, source.height, options.crop)
  const resize = getResizeDimensions(crop.width, crop.height, options.resize)
  const rotateQuarterTurns = options.transform.rotate === 90 || options.transform.rotate === 270
  const outputWidth = rotateQuarterTurns ? resize.height : resize.width
  const outputHeight = rotateQuarterTurns ? resize.width : resize.height
  const workingCanvas = createCanvas(outputWidth, outputHeight)
  const context = workingCanvas.getContext('2d')

  if (!context) {
    throw new Error('Could not create a canvas context.')
  }

  if (options.output.format === 'image/jpeg') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, outputWidth, outputHeight)
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.translate(outputWidth / 2, outputHeight / 2)
  context.rotate((options.transform.rotate * Math.PI) / 180)
  context.scale(options.transform.flipHorizontal ? -1 : 1, options.transform.flipVertical ? -1 : 1)

  const drawWidth = resize.width
  const drawHeight = resize.height

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  )

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
      enabled: false,
      width: image?.width ?? 1200,
      height: image?.height ?? 800,
      keepAspectRatio: true,
    },
    crop: {
      enabled: false,
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
    output: {
      format: image?.type ?? 'image/webp',
      quality: 82,
    },
  }
}

export function updateOptionsForImage(image: ImportedImage, current?: EditorOptions): EditorOptions {
  if (!current) {
    return createDefaultOptions(image)
  }

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
