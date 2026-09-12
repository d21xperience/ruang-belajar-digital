// src/repositories/contentValidator.js
// =============================================================
// Validasi konten sebelum dipakai. Error ditampilkan jelas
// agar tidak ada "silent failure" saat JSON salah.
// =============================================================

function fail(msg) {
  const error = new Error(`[Content Validation] ${msg}`)
  // Lempar supaya terlihat saat development
  throw error
}

function validateQuestion(q, ctx, seenIds) {
  if (!q.id) fail(`${ctx}: soal tanpa id`)
  if (seenIds.has(q.id)) fail(`${ctx}: id soal duplikat → "${q.id}"`)
  seenIds.add(q.id)

  if (!q.pertanyaan || typeof q.pertanyaan !== 'string') {
    fail(`${ctx} / soal ${q.id}: "pertanyaan" kosong atau bukan string`)
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    fail(`${ctx} / soal ${q.id}: minimal 2 opsi jawaban`)
  }

  const optionIds = new Set()
  for (const opt of q.options) {
    if (!opt.id) fail(`${ctx} / soal ${q.id}: ada opsi tanpa id`)
    if (optionIds.has(opt.id)) {
      fail(`${ctx} / soal ${q.id}: id opsi duplikat → "${opt.id}"`)
    }
    if (!opt.text || typeof opt.text !== 'string') {
      fail(`${ctx} / soal ${q.id} / opsi ${opt.id}: text kosong`)
    }
    optionIds.add(opt.id)
  }

  if (!q.correctOptionId) {
    fail(`${ctx} / soal ${q.id}: tidak ada "correctOptionId"`)
  }
  if (!optionIds.has(q.correctOptionId)) {
    fail(
      `${ctx} / soal ${q.id}: correctOptionId "${q.correctOptionId}" tidak ditemukan pada options [${[...optionIds].join(', ')}]`,
    )
  }

  if (!q.pembahasan || typeof q.pembahasan !== 'string') {
    fail(`${ctx} / soal ${q.id}: wajib punya "pembahasan"`)
  }
}

export function validateContent(content) {
  if (!content || typeof content !== 'object') {
    fail('content bukan object valid')
  }
  if (!Array.isArray(content.modules) || content.modules.length === 0) {
    fail('content.modules kosong atau bukan array')
  }

  const seenModuleIds = new Set()
  const allQuestionIds = new Set()

  for (const mod of content.modules) {
    if (!mod.id) fail(`modul tanpa id (index ${content.modules.indexOf(mod)})`)
    if (seenModuleIds.has(mod.id)) fail(`id modul duplikat → "${mod.id}"`)
    seenModuleIds.add(mod.id)

    if (!mod.judul) fail(`modul ${mod.id}: tanpa judul`)
    if (!Array.isArray(mod.sections)) fail(`modul ${mod.id}: sections harus array`)

    // Validasi lesson
    const seenLessonIds = new Set()
    for (const sec of mod.sections) {
      if (!sec.id) fail(`modul ${mod.id}: ada section tanpa id`)
      if (seenLessonIds.has(sec.id)) {
        fail(`modul ${mod.id}: id section duplikat → "${sec.id}"`)
      }
      seenLessonIds.add(sec.id)
      if (!sec.judul) fail(`modul ${mod.id} / section ${sec.id}: tanpa judul`)
    }

    // Validasi freeTest & postTest (opsional, tapi jika ada harus valid)
    for (const testKey of ['freeTest', 'postTest']) {
      const t = mod[testKey]
      if (!t) continue
      if (!Array.isArray(t.questions)) {
        fail(`modul ${mod.id} / ${testKey}: questions harus array`)
      }
      for (const q of t.questions) {
        validateQuestion(q, `modul ${mod.id} / ${testKey}`, allQuestionIds)
      }
    }
  }

  // Validasi final test jika ada
  if (content.finalTest) {
    if (!Array.isArray(content.finalTest.questions)) {
      fail('finalTest.questions harus array')
    }
    // Cek jumlah sesuai ekspektasi (longgar: hanya warning jika berbeda)
    const expectedCount = 35
    if (content.finalTest.questions.length !== expectedCount) {
      console.warn(
        `[Content Validation] finalTest memiliki ${content.finalTest.questions.length} soal, ` +
          `ekspektasi ${expectedCount}. Ini bukan error fatal, tapi cek ulang.`,
      )
    }
    for (const q of content.finalTest.questions) {
      validateQuestion(q, 'finalTest', allQuestionIds)
    }
  }

  return true
}

export default { validateContent }
