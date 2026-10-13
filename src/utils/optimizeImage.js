const MAX_SIZE = 800            // px, lado más largo
const TARGET_BYTES = 100 * 1024 // peso objetivo
const START_QUALITY = 0.82
const MIN_QUALITY = 0.5

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

export async function optimizeImage(
  file,
  { maxSize = MAX_SIZE, targetBytes = TARGET_BYTES } = {}
) {
  // 'from-image' respeta la rotación EXIF (fotos de celular que salen giradas)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF' // evita fondo negro en PNG con transparencia
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Intenta WebP; si el navegador no lo soporta, cae a JPEG
  let type = 'image/webp'
  let quality = START_QUALITY
  let blob = await canvasToBlob(canvas, type, quality)

  if (!blob || blob.type !== 'image/webp') {
    type = 'image/jpeg'
    blob = await canvasToBlob(canvas, type, quality)
  }

  // Baja la calidad de a poco hasta llegar al peso objetivo
  while (blob.size > targetBytes && quality > MIN_QUALITY) {
    quality = Math.round((quality - 0.07) * 100) / 100
    blob = await canvasToBlob(canvas, type, quality)
  }

  return blob
}