// src/composables/useLearningAnalytics.js
// =============================================================
// Agregasi data dari learningStateRepository untuk analitik.
// =============================================================

import { computed } from 'vue'
import repo from '../repositories/learningStateRepository'
import contentRepo from '../repositories/contentRepository'
import LEARNING_CONFIG from '../config/learning.js'

export function useLearningAnalytics(state) {
  // ─── Ordered modules ───
  const orderedModules = computed(() =>
    [...contentRepo.getAllModules()].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)),
  )

  // ─── Attempts (semua) ───
  const attempts = computed(() => state.value?.attempts || [])

  // ─── Filter per tipe ───
  const postAttempts = computed(() => attempts.value.filter((a) => a.type === 'post'))
  const freeAttempts = computed(() => attempts.value.filter((a) => a.type === 'free'))
  const finalAttempts = computed(() => attempts.value.filter((a) => a.type === 'final'))

  // ─── Stats global ───
  const overall = computed(() => {
    const all = attempts.value.filter((a) => typeof a.score === 'number')
    if (!all.length) {
      return { count: 0, avg: 0, best: 0, worst: 0 }
    }
    const scores = all.map((a) => a.score)
    return {
      count: all.length,
      avg: Math.round(scores.reduce((s, n) => s + n, 0) / scores.length),
      best: Math.max(...scores),
      worst: Math.min(...scores),
    }
  })

  // ─── Progres modul ───
  const moduleProgress = computed(() =>
    orderedModules.value.map((mod) => {
      const p = repo.getModuleProgress(state.value, mod.id)
      const modPostAttempts = postAttempts.value.filter((a) => a.moduleId === mod.id)
      const modFreeAttempts = freeAttempts.value.filter((a) => a.moduleId === mod.id)
      return {
        moduleId: mod.id,
        urutan: mod.urutan,
        judul: mod.judul,
        judulShort: mod.judulShort || `Modul ${mod.urutan}`,
        passed: p.passed,
        postTestAttempts: p.postTestAttempts || 0,
        postTestBestScore: p.postTestBestScore || 0,
        freeTestCompleted: p.freeTestCompleted,
        freeTestBestScore: p.freeTestBestScore || 0,
        postHistory: modPostAttempts.map((a) => a.score),
        freeHistory: modFreeAttempts.map((a) => a.score),
        passingScore:
          mod.postTest?.passingScore ?? mod.passingScore ?? LEARNING_CONFIG.passingScore,
      }
    }),
  )

  // ─── Score progression series (line chart) ───
  // Setiap modul → array skor post test dalam urutan waktu
  const scoreProgression = computed(() => {
    return moduleProgress.value
      .filter((m) => m.postHistory.length > 0)
      .map((m) => ({
        moduleId: m.moduleId,
        label: m.judulShort,
        scores: m.postHistory,
        best: m.postTestBestScore,
        passed: m.passed,
        passingScore: m.passingScore,
      }))
  })

  // ─── Final test state ───
  const finalTest = computed(() => {
    const ft = state.value?.finalTest || {}
    return {
      attempts: ft.attempts || 0,
      bestScore: ft.bestScore || 0,
      completed: ft.completed || false,
      lastAttemptAt: ft.lastAttemptAt || null,
      history: finalAttempts.value.map((a) => a.score),
    }
  })

  // ─── Timeline (semua attempt, terbaru dulu) ───
  const timeline = computed(() => {
    return [...attempts.value]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 20)
      .map((a) => {
        const mod = orderedModules.value.find((m) => m.id === a.moduleId)
        return {
          ...a,
          label:
            a.type === 'final'
              ? 'Final Test'
              : `${mod?.judulShort || a.moduleId} — ${a.type === 'free' ? 'Free Test' : 'Post Test'}`,
        }
      })
  })

  // ─── Overall mastery (dari final test attempt terakhir, jika ada) ───
  const moduleMastery = computed(() => {
    // Pakai per-modul: average post test score / passing score
    return moduleProgress.value.map((m) => {
      const avg = m.postHistory.length
        ? Math.round(m.postHistory.reduce((s, n) => s + n, 0) / m.postHistory.length)
        : 0
      const percent = m.passingScore ? Math.round((avg / m.passingScore) * 100) : 0
      return {
        moduleId: m.moduleId,
        label: m.judulShort,
        avgScore: avg,
        percent: Math.min(100, percent),
        passed: m.passed,
      }
    })
  })

  // ─── Weakest modules (perlu perhatian) ───
  const weakestModules = computed(() => {
    return [...moduleMastery.value]
      .filter((m) => m.avgScore > 0)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3)
  })

  return {
    orderedModules,
    attempts,
    postAttempts,
    freeAttempts,
    finalAttempts,
    overall,
    moduleProgress,
    scoreProgression,
    finalTest,
    timeline,
    moduleMastery,
    weakestModules,
  }
}

export default { useLearningAnalytics }
