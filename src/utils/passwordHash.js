// src/utils/passwordHash.js
// =============================================================
// SHA-256 hash untuk password guru.
// Catatan: crypto.subtle hanya tersedia di HTTPS atau localhost.
// =============================================================

export async function sha256(text) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback: hash sederhana (tidak aman — hanya agar dev tidak crash)
    console.warn('[Auth] crypto.subtle tidak tersedia, pakai fallback hash')
    return simpleHash(String(text))
  }
  const buf = new TextEncoder().encode(String(text))
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function simpleHash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return 'fallback-' + Math.abs(h).toString(16)
}

export default { sha256 }
