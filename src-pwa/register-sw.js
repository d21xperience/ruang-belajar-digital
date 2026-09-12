// src-pwa/register-sw.js
// =============================================================
// Registrasi Service Worker untuk Quasar v3+ (native API).
// TIDAK pakai 'register-service-worker' library (sudah deprecated).
// =============================================================

if (process.env.MODE === 'pwa' && process.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = 'sw.js'

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[PWA] Service worker terdaftar:', registration.scope)

        // Cek update tiap 1 jam
        setInterval(() => registration.update(), 60 * 60 * 1000)
      })
      .catch((err) => {
        console.warn('[PWA] Registrasi service worker gagal:', err.message)
      })

    // Handle update saat runtime
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service worker diperbarui.')
    })
  })

  // Notifikasi saat online/offline
  window.addEventListener('online', () => {
    console.log('[PWA] Kembali online.')
  })

  window.addEventListener('offline', () => {
    console.log('[PWA] Mode offline aktif.')
  })
}
