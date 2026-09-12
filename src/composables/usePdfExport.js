// src/composables/usePdfExport.js
// =============================================================
// PDF export via browser's native print dialog.
// User memilih "Save as PDF" di dialog print.
//
// Kelebihan dibanding html2canvas:
//   ✅ 100% reliable
//   ✅ Vector text (bisa di-search di PDF)
//   ✅ Ukuran file kecil
//   ✅ Support gambar, font, table
// =============================================================

import { ref } from 'vue'

const DEBUG = true
function log(...args) {
  if (DEBUG) console.log('[PDF]', ...args)
}

// ─────────────────────────────────────────────────────────────
// Tunggu semua gambar dalam elemen selesai load
// ─────────────────────────────────────────────────────────────
async function waitForImages(root) {
  if (!root) return
  const images = Array.from(root.querySelectorAll('img'))
  log(`Menunggu ${images.length} gambar...`)
  if (!images.length) return

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise((resolve) => {
        const done = () => resolve()
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
        setTimeout(done, 5000)
      })
    }),
  )
}

async function waitForFonts() {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* noop */
    }
  }
}

async function waitForLayout() {
  await new Promise((r) => requestAnimationFrame(() => r()))
  await new Promise((r) => requestAnimationFrame(() => r()))
}

export function usePdfExport() {
  const exporting = ref(false)
  const progress = ref('')

  /**
   * @param {HTMLElement} element - target element yang akan dicetak
   * @param {Object} options
   * @param {string} [options.filename] - nama file (dipakai sebagai document title)
   */
  async function exportElementToPdf(element, options = {}) {
    log('═══════════ MULAI PRINT PDF ═══════════')
    if (!element) throw new Error('Elemen PDF tidak ditemukan.')

    const textLen = (element.innerText || '').length
    log('Dimensi target:', {
      offsetHeight: element.offsetHeight,
      childCount: element.children.length,
      textLength: textLen,
    })
    if (textLen < 5 && element.children.length === 0) {
      throw new Error('Target kosong — tidak ada konten.')
    }

    exporting.value = true
    try {
      progress.value = 'menyiapkan'
      await waitForLayout()

      progress.value = 'menunggu gambar'
      await waitForImages(element)

      progress.value = 'menunggu font'
      await waitForFonts()

      await waitForLayout()

      // ═══ Simpan title → ganti sementara untuk nama file PDF ═══
      const originalTitle = document.title
      const desiredTitle = (options.filename || 'materi.pdf').replace(/\.pdf$/i, '')
      document.title = desiredTitle

      progress.value = 'membuka dialog cetak'
      log('Membuka dialog print...')

      // ═══ Trigger print ═══
      // window.print() BLOCKING di sebagian besar browser — return
      // setelah dialog ditutup. Tidak perlu tunggu afterprint event.
      await new Promise((r) => setTimeout(r, 100))
      window.print()

      // ═══ Restore title langsung setelah print selesai ═══
      document.title = originalTitle

      log('✅ Proses print selesai.')
      return true
    } catch (e) {
      console.error('[PDF] ❌ Error:', e)
      throw e
    } finally {
      exporting.value = false
      progress.value = ''
    }
  }

  return { exporting, progress, exportElementToPdf }
}

export default { usePdfExport }
