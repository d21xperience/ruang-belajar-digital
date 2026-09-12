// src/composables/useImagePaste.js
// =============================================================
// Handle paste & drag-drop gambar di Content Builder.
// Kompresi client-side via canvas (resize + re-encode).
// =============================================================

const DEFAULT_MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.85
const SKIP_COMPRESS_BELOW = 300 * 1024 // 300 KB — di bawah ini biarkan asli

// ─── File → Data URL ───
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

// ─── Kompres gambar via canvas ───
async function compressImage(file) {
  // Kalau file kecil, langsung ke base64 tanpa re-encode
  if (file.size < SKIP_COMPRESS_BELOW) {
    return {
      src: await fileToDataUrl(file),
      originalSize: file.size,
      finalSize: file.size,
      compressed: false,
    }
  }

  const dataUrl = await fileToDataUrl(file)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // Resize jika melebihi batas
      if (width > DEFAULT_MAX_DIMENSION || height > DEFAULT_MAX_DIMENSION) {
        const ratio = Math.min(DEFAULT_MAX_DIMENSION / width, DEFAULT_MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Draw ke canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Konversi ke JPEG
      let compressed = canvas.toDataURL('image/jpeg', DEFAULT_QUALITY)

      // Hitung final size dari base64
      const finalSize = Math.round(((compressed.length - 'data:image/jpeg;base64,'.length) * 3) / 4)

      // Kalau ternyata lebih besar dari asli (misal PNG kecil → JPEG besar), pakai asli
      if (finalSize > file.size) {
        resolve({
          src: dataUrl,
          originalSize: file.size,
          finalSize: file.size,
          compressed: false,
        })
        return
      }

      resolve({
        src: compressed,
        originalSize: file.size,
        finalSize,
        compressed: true,
      })
    }
    img.onerror = () => {
      // Fallback: pakai data URL asli tanpa kompresi
      resolve({
        src: dataUrl,
        originalSize: file.size,
        finalSize: file.size,
        compressed: false,
      })
    }
    img.src = dataUrl
  })
}

// ─── Ekstrak gambar dari ClipboardEvent ───
function extractImagesFromClipboard(event) {
  const items = event.clipboardData?.items
  if (!items) return []
  const files = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }
  return files
}

// ─── Ekstrak gambar dari DataTransfer (drag-drop) ───
function extractImagesFromDataTransfer(dt) {
  if (!dt) return []
  if (!dt.files || !dt.files.length) return []
  return [...dt.files].filter((f) => f.type && f.type.startsWith('image/'))
}

// ─── Proses batch file ───
async function processImageFiles(files, onProgress) {
  const results = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length)
    const result = await compressImage(files[i])
    results.push(result)
  }
  return results
}

// ─── Format bytes → readable ───
function formatBytes(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

// ─── Composable ───
export function useImagePaste() {
  return {
    extractImagesFromClipboard,
    extractImagesFromDataTransfer,
    compressImage,
    processImageFiles,
    formatBytes,
  }
}

export default { useImagePaste }
