// src/utils/htmlEscape.js
// =============================================================
// Escape HTML entities untuk mencegah XSS.
// =============================================================

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, (ch) => ENTITY_MAP[ch] || ch)
}

export default { escapeHtml }
