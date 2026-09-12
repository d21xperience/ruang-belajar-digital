// src/repositories/guruStateRepository.js
// =============================================================
// Storage guru: kelas + siswa + progress. Permanen di localStorage.
// =============================================================

import storageAdapter from './storageAdapter'

const STATE_KEY = 'ppkn-guru-v1'
const SCHEMA_VERSION = 1

function emptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    classes: [], // [{ id, nama, tahunAjaran, createdAt }]
    students: {}, // { [classId]: { [studentKey]: {...} } }
    activeClassId: null,
    updatedAt: null,
  }
}

export function loadState() {
  const raw = storageAdapter.getJSON(STATE_KEY, null)
  if (!raw || typeof raw !== 'object') return emptyState()
  const safe = { ...emptyState(), ...raw }
  if (!Array.isArray(safe.classes)) safe.classes = []
  if (!safe.students || typeof safe.students !== 'object') safe.students = {}

  // ═══ Migrasi: konversi progress.finalTest → progress.finalTests ═══
  for (const classId of Object.keys(safe.students)) {
    const studentsInClass = safe.students[classId] || {}
    for (const key of Object.keys(studentsInClass)) {
      const s = studentsInClass[key]
      if (s?.progress?.finalTest && !s.progress.finalTests) {
        // Format lama → format baru
        s.progress.finalTests = { ppkn: s.progress.finalTest }
        delete s.progress.finalTest
      }
      if (s?.progress && !s.progress.finalTests) {
        s.progress.finalTests = {}
      }
    }
  }

  return safe
}

export function saveState(state) {
  state.updatedAt = new Date().toISOString()
  storageAdapter.setJSON(STATE_KEY, state)
}

export function resetState() {
  storageAdapter.remove(STATE_KEY)
  return emptyState()
}

// ─────────────────────────── Classes ───────────────────────────
export function createClass(state, nama, tahunAjaran = '') {
  const id = `cls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  state.classes.push({
    id,
    nama: String(nama).trim(),
    tahunAjaran: String(tahunAjaran).trim(),
    createdAt: new Date().toISOString(),
  })
  if (!state.activeClassId) state.activeClassId = id
  saveState(state)
  return id
}

export function updateClass(state, id, patch) {
  const cls = state.classes.find((c) => c.id === id)
  if (!cls) return
  if (patch.nama !== undefined) cls.nama = String(patch.nama).trim()
  if (patch.tahunAjaran !== undefined) cls.tahunAjaran = String(patch.tahunAjaran).trim()
  saveState(state)
}

export function deleteClass(state, id) {
  state.classes = state.classes.filter((c) => c.id !== id)
  delete state.students[id]
  if (state.activeClassId === id) {
    state.activeClassId = state.classes[0]?.id || null
  }
  saveState(state)
}

export function setActiveClass(state, id) {
  state.activeClassId = id
  saveState(state)
}

export function getActiveClass(state) {
  if (!state.activeClassId) return null
  return state.classes.find((c) => c.id === state.activeClassId) || null
}

// ─────────────────────────── Students ───────────────────────────
export function studentKey(name, cls) {
  const s = (str) =>
    String(str || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
  return `${s(name)}@${s(cls)}`
}

// ✅ SESUDAH
export function addStudentImport(state, classId, shareData) {
  if (!state.students[classId]) state.students[classId] = {}

  const student = shareData.student || {}
  const key = studentKey(student.name, student.class)
  const existing = state.students[classId][key]
  const now = new Date().toISOString()

  // ═══ Merge progress (jaga kompatibilitas dengan file lama) ═══
  const incomingProgress = shareData.progress || {}
  const incomingModules = incomingProgress.modules || {}
  const incomingFinal = incomingProgress.finalTest // format lama: single
  const incomingFinalTests = incomingProgress.finalTests || {} // format baru: per subject

  // Detect subject dari modul (via ID prefix) atau dari metadata
  const detectedSubjectId = shareData.subjectId || detectSubjectId(incomingModules)

  // Merge modules: gabung dengan existing
  const existingModules = existing?.progress?.modules || {}
  const mergedModules = { ...existingModules, ...incomingModules }

  // Merge final tests: per subject
  const existingFinalTests = existing?.progress?.finalTests || {}
  const mergedFinalTests = { ...existingFinalTests, ...incomingFinalTests }

  // Backward compat: kalau incoming pakai format lama (finalTest tunggal),
  // asumsikan itu PPKn (subject default)
  if (incomingFinal && !incomingFinalTests.ppkn) {
    mergedFinalTests.ppkn = incomingFinal
  }

  // Kalau detectedSubjectId ada tapi belum ada entry final test, cek shareData.finalTest
  if (detectedSubjectId && shareData.finalTest && !mergedFinalTests[detectedSubjectId]) {
    mergedFinalTests[detectedSubjectId] = shareData.finalTest
  }

  const record = {
    key,
    name: student.name || '(Tanpa nama)',
    class: student.class || '',
    nis: student.nis || '',
    firstImportedAt: existing?.firstImportedAt || now,
    lastImportedAt: now,
    importCount: (existing?.importCount || 0) + 1,
    // Simpan semua subjects yang pernah di-import siswa ini
    subjects: Array.from(
      new Set([...(existing?.subjects || []), ...(detectedSubjectId ? [detectedSubjectId] : [])]),
    ),
    progress: {
      modules: mergedModules,
      finalTests: mergedFinalTests,
    },
    contentVersion: shareData.contentVersion || null,
  }

  state.students[classId][key] = record
  saveState(state)
  return record
}

/**
 * Detect subject ID dari modules.
 * Strategi: cek prefix ID modul (module-, hukum-, komputer-)
 */
function detectSubjectId(modules) {
  const ids = Object.keys(modules || {})
  if (!ids.length) return null

  // Mapping prefix → subject ID
  const prefixMap = {
    'module-': 'ppkn', // legacy
    'hukum-': 'hukum',
    'komputer-': 'komputer',
  }

  for (const id of ids) {
    for (const [prefix, subjectId] of Object.entries(prefixMap)) {
      if (id.startsWith(prefix)) return subjectId
    }
  }

  // Fallback: default ke ppkn
  return 'ppkn'
}

export function removeStudent(state, classId, studentKey) {
  if (state.students[classId] && state.students[classId][studentKey]) {
    delete state.students[classId][studentKey]
    saveState(state)
    return true
  }
  return false
}

export function getStudents(state, classId) {
  if (!state || !classId) return []
  return Object.values(state.students?.[classId] || {})
}

export default {
  loadState,
  saveState,
  resetState,
  createClass,
  updateClass,
  deleteClass,
  setActiveClass,
  getActiveClass,
  addStudentImport,
  removeStudent,
  getStudents,
  studentKey,
}
