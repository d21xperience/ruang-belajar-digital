// src/utils/contentNormalizer.js
// =============================================================
// Normalisasi sections[].konten ke format ContentBlock[].
// Mendukung backward compatibility dengan skema lama (string[]).
// =============================================================

export function normalizeContent(konten) {
  if (!konten) return []

  // Legacy: single string
  if (typeof konten === 'string') {
    return konten.trim() ? [{ type: 'paragraph', text: konten }] : []
  }

  if (!Array.isArray(konten)) return []

  // Legacy: array of strings → array of paragraph blocks
  return konten
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim() ? { type: 'paragraph', text: item } : null
      }
      if (item && typeof item === 'object' && item.type) {
        return item
      }
      return null
    })
    .filter(Boolean)
}

export default { normalizeContent }
