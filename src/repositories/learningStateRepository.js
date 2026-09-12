// src/repositories/learningStateRepository.js
// =============================================================
// Menyimpan state belajar user: progres modul, hasil tes, attempt.
// Terpisah total dari konten. Migrasi otomatis dari localStorage
// lama (lulus-*, skor-*, subbab-selesai-*).
// =============================================================

import storageAdapter from './storageAdapter'
import LEARNING_CONFIG from '../config/learning.js'

const STATE_KEY = LEARNING_CONFIG.storageNamespace

function emptyState() {
  return {
    schemaVersion: LEARNING_CONFIG.schemaVersion,
    modules: {}, // { "module-01": { freeTestCompleted, freeTestBestScore, postTestAttempts, postTestBestScore, passed, lastAttemptAt } }
    finalTest: {
      attempts: 0,
      bestScore: 0,
      completed: false,
      lastAttemptAt: null,
    },
    attempts: [], // riwayat attempt (terbatas)
    updatedAt: null,
  }
}

// ---------- Public API ----------

export function loadState() {
  const raw = storageAdapter.getJSON(STATE_KEY, null)
  if (!raw) {
    const migrated = tryMigrateLegacy()
    const initial = migrated || emptyState()
    saveState(initial)
    return initial
  }
  // Normalisasi field yang mungkin hilang
  return { ...emptyState(), ...raw }
}

export function saveState(state) {
  state.updatedAt = new Date().toISOString()
  storageAdapter.setJSON(STATE_KEY, state)
}

export function resetState() {
  storageAdapter.remove(STATE_KEY)

  // Bersihkan juga key legacy supaya migrasi tidak "menghidupkan" data lama
  const legacyKeys = [
    ...storageAdapter.keysWithPrefix(LEARNING_CONFIG.legacyLulusPrefix),
    ...storageAdapter.keysWithPrefix(LEARNING_CONFIG.legacySkorPrefix),
    ...storageAdapter.keysWithPrefix(LEARNING_CONFIG.legacySubbabPrefix),
  ]
  for (const k of legacyKeys) storageAdapter.remove(k)

  const fresh = emptyState()
  saveState(fresh)
  return fresh
}

// ---------- Module progress ----------

export function getModuleProgress(state, moduleId) {
  return (
    state.modules[moduleId] || {
      freeTestCompleted: false,
      freeTestBestScore: 0,
      postTestAttempts: 0,
      postTestBestScore: 0,
      passed: false,
      lastAttemptAt: null,
    }
  )
}

export function recordFreeTest(state, moduleId, score) {
  const p = getModuleProgress(state, moduleId)
  p.freeTestCompleted = true
  p.freeTestBestScore = Math.max(p.freeTestBestScore || 0, score)
  p.lastAttemptAt = new Date().toISOString()
  state.modules[moduleId] = p
  pushAttempt(state, { type: 'free', moduleId, score, at: p.lastAttemptAt })
  saveState(state)
  return p
}

export function recordPostTest(state, moduleId, score, passingScore) {
  const p = getModuleProgress(state, moduleId)
  p.postTestAttempts = (p.postTestAttempts || 0) + 1
  p.postTestBestScore = Math.max(p.postTestBestScore || 0, score)
  p.lastAttemptAt = new Date().toISOString()

  if (score >= passingScore) {
    p.passed = true
  }
  state.modules[moduleId] = p
  pushAttempt(state, { type: 'post', moduleId, score, passed: p.passed, at: p.lastAttemptAt })
  saveState(state)
  return p
}

export function recordFinalTest(state, score, passingScore) {
  state.finalTest.attempts = (state.finalTest.attempts || 0) + 1
  state.finalTest.bestScore = Math.max(state.finalTest.bestScore || 0, score)
  state.finalTest.lastAttemptAt = new Date().toISOString()
  if (score >= passingScore) {
    state.finalTest.completed = true
  }
  pushAttempt(state, {
    type: 'final',
    score,
    passed: state.finalTest.completed,
    at: state.finalTest.lastAttemptAt,
  })
  saveState(state)
  return state.finalTest
}

// ---------- Unlock logic ----------

export function isModuleUnlocked(state, orderedModules, moduleIndex) {
  if (moduleIndex === 0) return true
  const prev = orderedModules[moduleIndex - 1]
  if (!prev) return false
  return !!getModuleProgress(state, prev.id).passed
}

export function isFinalTestUnlocked(state, orderedModules) {
  return orderedModules.every((m) => getModuleProgress(state, m.id).passed)
}

// ---------- Aggregate ----------

export function getGlobalProgress(state, orderedModules) {
  const total = orderedModules.length
  const passed = orderedModules.filter((m) => getModuleProgress(state, m.id).passed).length
  return {
    totalModules: total,
    passedModules: passed,
    percent: total ? Math.round((passed / total) * 100) : 0,
    finalTestUnlocked: passed === total,
  }
}

// ---------- Internals ----------

function pushAttempt(state, attempt) {
  state.attempts.push(attempt)
  if (state.attempts.length > LEARNING_CONFIG.maxAttemptsStored) {
    state.attempts = state.attempts.slice(-LEARNING_CONFIG.maxAttemptsStored)
  }
}

// ---------- Migrasi legacy: lulus-<id> / skor-<id> ----------

function tryMigrateLegacy() {
  const lulusKeys = storageAdapter.keysWithPrefix(LEARNING_CONFIG.legacyLulusPrefix)
  if (lulusKeys.length === 0) return null

  console.info('[learningStateRepository] Migrasi progres dari localStorage lama...')
  const state = emptyState()

  for (const key of lulusKeys) {
    // key format: "lulus-bab-1"
    const legacyId = key.slice(LEARNING_CONFIG.legacyLulusPrefix.length) // "bab-1"

    // Normalisasi ID legacy → ID baru (bab-1 → module-01)
    const newId = normalizeLegacyId(legacyId)
    if (!newId) continue

    const lulus = storageAdapter.get(key) === 'true'
    const skor = parseInt(storageAdapter.get(`skor-${legacyId}`) || '0', 10)

    state.modules[newId] = {
      freeTestCompleted: false,
      freeTestBestScore: 0,
      postTestAttempts: lulus ? 1 : 0,
      postTestBestScore: skor,
      passed: lulus,
      lastAttemptAt: new Date().toISOString(),
    }
  }

  saveState(state)
  console.info('[learningStateRepository] Migrasi selesai:', state.modules)
  return state
}

function normalizeLegacyId(legacyId) {
  // "bab-1" → "module-01", "bab-2" → "module-02", dst.
  const match = /^bab-(\d+)$/.exec(legacyId)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return `module-${String(n).padStart(2, '0')}`
}

export default {
  loadState,
  saveState,
  resetState,
  getModuleProgress,
  recordFreeTest,
  recordPostTest,
  recordFinalTest,
  isModuleUnlocked,
  isFinalTestUnlocked,
  getGlobalProgress,
}
