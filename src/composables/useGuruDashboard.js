// src/composables/useGuruDashboard.js
// =============================================================
// Agregasi analytics per subject dalam kelas aktif.
// Filter by subjectId agar statistik fokus per mata pelajaran.
// =============================================================

import { computed } from 'vue'
import contentRepo from '../repositories/contentRepository'
import repo from '../repositories/guruStateRepository'

/**
 * @param {Object} state - reactive object dari guruStateRepository.loadState()
 * @param {import('vue').Ref<string>} subjectIdRef - ref ke subject aktif
 */
export function useGuruDashboard(state, subjectIdRef) {
  // ═══ Modul untuk subject aktif ═══
  const modules = computed(() => {
    const sid = subjectIdRef?.value
    if (!sid) return []
    const list = contentRepo.getModulesBySubject(sid)
    return [...list].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
  })

  const subjectMeta = computed(() => {
    const sid = subjectIdRef?.value
    if (!sid) return null
    return contentRepo.getSubjectById(sid) || null
  })

  // ═══ Siswa kelas aktif ═══
  const students = computed(() => {
    if (!state || !state.activeClassId) return []
    return repo.getStudents(state, state.activeClassId)
  })

  // ═══ Ringkasan per siswa — HANYA hitung modul dari subject aktif ═══
  const studentSummaries = computed(() =>
    students.value.map((s) => {
      // Ambil progress modul dari subject aktif saja
      const allModulesProgress = s.progress?.modules || {}
      const subjectModules = {}

      for (const mod of modules.value) {
        if (allModulesProgress[mod.id]) {
          subjectModules[mod.id] = allModulesProgress[mod.id]
        }
      }

      const passed = modules.value.filter(
        (m) => subjectModules[m.id]?.passed
      ).length

      const postScores = modules.value
        .map((m) => subjectModules[m.id]?.postTestBestScore)
        .filter((n) => typeof n === 'number' && n > 0)

      const avg = postScores.length
        ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
        : 0

      // Final test juga per subject — cek subjectId di state siswa
      const ftAll = s.progress?.finalTests || {}
      const ft = ftAll[subjectIdRef?.value] || {}

      return {
        key: s.key,
        name: s.name,
        class: s.class,
        nis: s.nis,
        // Subject-scoped data
        passed,
        totalModules: modules.value.length,
        avgPostScore: avg,
        finalScore: ft.bestScore || 0,
        finalCompleted: !!ft.completed,
        finalAttempts: ft.attempts || 0,
        // Full data untuk dialog detail
        allModulesProgress: allModulesProgress,
        allFinalTests: ftAll,
        // Meta
        lastImportedAt: s.lastImportedAt,
        hasAnyProgress: Object.keys(subjectModules).length > 0,
      }
    })
  )

  // ═══ Stats global kelas — untuk subject aktif ═══
  const stats = computed(() => {
    const list = studentSummaries.value
    const total = list.length
    if (!total) {
      return { total: 0, avg: 0, passedAll: 0, finalDone: 0, avgFinal: 0, started: 0 }
    }
    const withProgress = list.filter((s) => s.hasAnyProgress)
    const avg = withProgress.length
      ? Math.round(
          withProgress.reduce((sum, x) => sum + x.avgPostScore, 0) / withProgress.length
        )
      : 0
    const passedAll = list.filter(
      (s) => s.totalModules > 0 && s.passed === s.totalModules
    ).length
    const finalDone = list.filter((s) => s.finalCompleted).length
    const finalScores = list.map((s) => s.finalScore).filter((n) => n > 0)
    const avgFinal = finalScores.length
      ? Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length)
      : 0
    return {
      total,
      avg,
      passedAll,
      finalDone,
      avgFinal,
      started: withProgress.length,
    }
  })

  // ═══ Penyelesaian per modul ═══
  const moduleCompletion = computed(() =>
    modules.value.map((m) => {
      const total = studentSummaries.value.length
      const passed = studentSummaries.value.filter(
        (s) => s.allModulesProgress[m.id]?.passed
      ).length
      const scores = studentSummaries.value
        .map((s) => s.allModulesProgress[m.id]?.postTestBestScore)
        .filter((n) => typeof n === 'number' && n > 0)
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
      return {
        moduleId: m.id,
        label: m.judulShort || `Modul ${m.urutan}`,
        judul: m.judul,
        total,
        passed,
        percent: total ? Math.round((passed / total) * 100) : 0,
        avgPostScore: avg,
      }
    })
  )

  // ═══ Histogram distribusi rata-rata skor ═══
  const scoreHistogram = computed(() => {
    const buckets = [
      { label: '0–20', min: 0, max: 20, count: 0 },
      { label: '21–40', min: 21, max: 40, count: 0 },
      { label: '41–60', min: 41, max: 60, count: 0 },
      { label: '61–80', min: 61, max: 80, count: 0 },
      { label: '81–100', min: 81, max: 100, count: 0 },
    ]
    for (const s of studentSummaries.value) {
      if (!s.hasAnyProgress || !s.avgPostScore) continue
      const b = buckets.find(
        (bk) => s.avgPostScore >= bk.min && s.avgPostScore <= bk.max
      )
      if (b) b.count++
    }
    const max = Math.max(1, ...buckets.map((b) => b.count))
    return buckets.map((b) => ({ ...b, percent: Math.round((b.count / max) * 100) }))
  })

  // ═══ Siswa perlu bantuan ═══
  const needsHelp = computed(() =>
    [...studentSummaries.value]
      .filter((s) => s.hasAnyProgress && s.avgPostScore > 0 && s.avgPostScore < 70)
      .sort((a, b) => a.avgPostScore - b.avgPostScore)
      .slice(0, 10)
  )

  // ═══ Modul tersulit ═══
  const weakestModules = computed(() =>
    [...moduleCompletion.value]
      .filter((m) => m.total > 0 && m.avgPostScore > 0)
      .sort((a, b) => a.avgPostScore - b.avgPostScore)
      .slice(0, 3)
  )

  return {
    modules,
    subjectMeta,
    students,
    studentSummaries,
    stats,
    moduleCompletion,
    scoreHistogram,
    needsHelp,
    weakestModules,
  }
}

export default { useGuruDashboard }
