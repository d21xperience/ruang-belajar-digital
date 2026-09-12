// src/utils/urlConverter.js
// =============================================================
// Konversi URL halaman → URL embed/langsung.
// Handle: Wikipedia, YouTube, Vimeo, Google Drive, Imgur.
// =============================================================

/**
 * Normalisasi URL gambar.
 * Contoh:
 *   - Wikipedia page → direct image URL
 *   - Imgur page → i.imgur.com
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  const u = url.trim()

  // ═══ Wikipedia/Wikimedia ═══
  // Format halaman: https://xx.wikipedia.org/wiki/File:Foo.jpg
  //                https://commons.wikimedia.org/wiki/File:Foo.jpg
  //                https://id.wikipedia.org/wiki/Berkas:Foo.jpg (Indonesian)
  // → konversi ke: https://upload.wikimedia.org/wikipedia/commons/...
  //
  // ⚠️ Konversi ini tidak bisa 100% otomatis karena butuh hash MD5 dari
  //    nama file untuk menentukan path di upload.wikimedia.org.
  //    Solusi: pakai Wikipedia REST API untuk resolve.
  //
  // Untuk simplicity, kita TIDAK fetch API — kita deteksi dan beri tahu user.

  // Deteksi halaman Wikipedia (bukan direct image)
  if (
    /(wikipedia\.org\/wiki\/(File|Berkas):)/i.test(u) ||
    /(commons\.wikimedia\.org\/wiki\/File:)/i.test(u)
  ) {
    return {
      url: u,
      warning:
        'URL ini adalah HALAMAN Wikipedia, bukan gambar langsung. ' +
        'Buka di tab baru → klik kanan gambar → "Copy image address" → paste di sini.',
      invalid: true,
    }
  }

  // Halaman imgur (bukan direct)
  // https://imgur.com/abc123 → https://i.imgur.com/abc123.jpg
  const imgurMatch = /^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/.exec(u)
  if (imgurMatch) {
    return {
      url: `https://i.imgur.com/${imgurMatch[1]}.jpg`,
      warning: null,
      invalid: false,
      converted: true,
    }
  }

  // Google Drive share link
  // https://drive.google.com/file/d/FILE_ID/view → https://drive.google.com/uc?id=FILE_ID
  const gdriveMatch = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.exec(u)
  if (gdriveMatch) {
    return {
      url: `https://drive.google.com/uc?id=${gdriveMatch[1]}`,
      warning:
        'Google Drive link mungkin tetap gagal karena CORS. ' +
        'Rekomendasi: simpan gambar di folder public/ aplikasi.',
      invalid: false,
      converted: true,
    }
  }

  return { url: u, warning: null, invalid: false }
}

/**
 * Normalisasi URL video.
 * Contoh:
 *   - https://www.youtube.com/watch?v=ABC123 → https://www.youtube.com/embed/ABC123
 *   - https://youtu.be/ABC123 → https://www.youtube.com/embed/ABC123
 *   - https://youtube.com/shorts/ABC123 → https://www.youtube.com/embed/ABC123
 */
export function normalizeVideoUrl(url) {
  if (!url || typeof url !== 'string') return url
  const u = url.trim()

  // ═══ YouTube ═══
  // Format yang valid untuk embed:
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID (privacy mode)
  if (/youtube(-nocookie)?\.com\/embed\//.test(u)) {
    return { url: u, warning: null, invalid: false }
  }

  // https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = /[?&]v=([a-zA-Z0-9_-]{11})/.exec(u)
  if (watchMatch) {
    return {
      url: `https://www.youtube.com/embed/${watchMatch[1]}`,
      warning: null,
      invalid: false,
      converted: true,
    }
  }

  // https://youtu.be/VIDEO_ID
  const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(u)
  if (shortMatch) {
    return {
      url: `https://www.youtube.com/embed/${shortMatch[1]}`,
      warning: null,
      invalid: false,
      converted: true,
    }
  }

  // https://www.youtube.com/shorts/VIDEO_ID
  const shortsMatch = /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/.exec(u)
  if (shortsMatch) {
    return {
      url: `https://www.youtube.com/embed/${shortsMatch[1]}`,
      warning: null,
      invalid: false,
      converted: true,
    }
  }

  // Halaman channel/playlist → tidak bisa di-embed
  if (/youtube\.com\/(playlist|channel|user|c\/)/.test(u)) {
    return {
      url: u,
      warning: 'URL playlist/channel tidak bisa di-embed. Gunakan URL video individual.',
      invalid: true,
    }
  }

  // ═══ Vimeo ═══
  // https://vimeo.com/123456789 → https://player.vimeo.com/video/123456789
  if (/vimeo\.com\/\d+/.test(u) && !/player\.vimeo\.com/.test(u)) {
    const m = /vimeo\.com\/(\d+)/.exec(u)
    if (m) {
      return {
        url: `https://player.vimeo.com/video/${m[1]}`,
        warning: null,
        invalid: false,
        converted: true,
      }
    }
  }

  return { url: u, warning: null, invalid: false }
}

/**
 * Cek apakah URL adalah halaman YouTube biasa.
 */
export function isYouTubePageUrl(url) {
  if (!url) return false
  return /youtube\.com\/(watch|shorts)/.test(url) || /youtu\.be\//.test(url)
}

/**
 * Cek apakah URL adalah halaman Wikipedia.
 */
export function isWikipediaPageUrl(url) {
  if (!url) return false
  return /wikipedia\.org\/wiki\/(File|Berkas):/i.test(url)
}

export default {
  normalizeImageUrl,
  normalizeVideoUrl,
  isYouTubePageUrl,
  isWikipediaPageUrl,
}
