// src/composables/useMediaLibrary.js
// =============================================================
// Scan konten → agregasi semua media yang dipakai (image, audio,
// video poster) dengan deduplikasi by src.
// =============================================================

import { normalizeContent } from '../utils/contentNormalizer'

/**
 * @param {Object} content - { modules: [...] }
 * @returns {Array<MediaItem>}
 */
export function scanMedia(content) {
  const map = new Map() // key: src

  const modules = content?.modules || []
  for (const mod of modules) {
    for (const sec of mod.sections || []) {
      const blocks = normalizeContent(sec.konten)
      blocks.forEach((block, i) => {
        // ═══ Image block ═══
        if (block.type === 'image' && block.src) {
          addUsage(map, block.src, 'image', {
            moduleId: mod.id,
            sectionId: sec.id,
            blockIndex: i,
            role: 'image',
            alt: block.alt || '',
          })
        }
        // ═══ Audio block ═══
        else if (block.type === 'audio' && block.src) {
          addUsage(map, block.src, 'audio', {
            moduleId: mod.id,
            sectionId: sec.id,
            blockIndex: i,
            role: 'audio',
          })
        }
        // ═══ Video block (poster image) ═══
        else if (block.type === 'video' && block.poster) {
          addUsage(map, block.poster, 'image', {
            moduleId: mod.id,
            sectionId: sec.id,
            blockIndex: i,
            role: 'video-poster',
          })
        }
      })
    }
  }

  return [...map.values()].sort((a, b) => (b.size || 0) - (a.size || 0))
}

function addUsage(map, src, type, usage) {
  const existing = map.get(src)
  if (existing) {
    existing.usage.push(usage)
    return
  }
  map.set(src, {
    id: makeId(src),
    src,
    type,
    isBase64: typeof src === 'string' && src.startsWith('data:'),
    size: estimateSize(src),
    mime: extractMime(src),
    usage: [usage],
  })
}

function makeId(src) {
  // Hash sederhana untuk key stabil
  let h = 5381
  const sample = src.length > 500 ? src.slice(0, 200) + src.slice(-200) : src
  for (let i = 0; i < sample.length; i++) {
    h = ((h << 5) + h + sample.charCodeAt(i)) | 0
  }
  return `m-${Math.abs(h).toString(36)}`
}

function estimateSize(src) {
  if (typeof src !== 'string' || !src.startsWith('data:')) return null
  const comma = src.indexOf(',')
  if (comma < 0) return 0
  const b64 = src.slice(comma + 1)
  const padding = (b64.match(/=/g) || []).length
  return Math.floor((b64.length * 3) / 4 - padding)
}

function extractMime(src) {
  if (typeof src !== 'string') return null
  if (!src.startsWith('data:')) return null
  const m = /^data:([^;]+)/.exec(src)
  return m ? m[1] : null
}

/**
 * Total bytes semua media (hanya base64 yang terhitung).
 */
export function computeTotalSize(items) {
  return items.reduce((sum, item) => sum + (item.size || 0), 0)
}

/**
 * Format bytes → human readable.
 */
export function formatBytes(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/**
 * Hapus src dari semua blok yang mereferensikannya.
 * Mengembalikan { removed: number } — jumlah blok yang dibersihkan.
 * MUTASI langsung pada content.modules.
 */
export function removeMediaFromContent(content, src) {
  let removed = 0
  const modules = content?.modules || []

  for (const mod of modules) {
    for (const sec of mod.sections || []) {
      if (!Array.isArray(sec.konten)) continue

      const nextBlocks = []
      let sectionModified = false

      for (const raw of sec.konten) {
        // Legacy string → keep
        if (typeof raw === 'string') {
          nextBlocks.push(raw)
          continue
        }
        if (!raw || typeof raw !== 'object') {
          nextBlocks.push(raw)
          continue
        }

        let mutated = false

        // Image block
        if (raw.type === 'image' && raw.src === src) {
          nextBlocks.push({ ...raw, src: '', alt: raw.alt || '', caption: raw.caption || '' })
          mutated = true
        }
        // Audio block
        else if (raw.type === 'audio' && raw.src === src) {
          nextBlocks.push({ ...raw, src: '' })
          mutated = true
        }
        // Video block poster
        else if (raw.type === 'video' && raw.poster === src) {
          nextBlocks.push({ ...raw, poster: '' })
          mutated = true
        }

        if (mutated) {
          removed++
          sectionModified = true
        } else {
          nextBlocks.push(raw)
        }
      }

      if (sectionModified) {
        sec.konten = nextBlocks
      }
    }
  }

  return { removed }
}

export default { scanMedia, computeTotalSize, formatBytes, removeMediaFromContent }
