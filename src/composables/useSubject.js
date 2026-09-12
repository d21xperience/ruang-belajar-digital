// src/composables/useSubject.js
// =============================================================
// Reactive state untuk subject aktif.
// Defensive: fallback jika contentRepo tidak lengkap.
// =============================================================

import { ref, computed } from 'vue'
import contentRepo from '../repositories/contentRepository'
import subjectsConfig from '../assets/subjects.json'

// ═══════════════════════════════════════════════════════════
// Constants — fallback jika repo tidak punya
// ═══════════════════════════════════════════════════════════
const ACTIVE_SUBJECT_KEY = 'ppkn-active-subject'
const DEFAULT_SUBJECT = subjectsConfig.defaultSubject || 'ppkn'

// ═══════════════════════════════════════════════════════════
// Safe wrappers — cek function exist sebelum panggil
// ═══════════════════════════════════════════════════════════
function safeGetActiveSubjectId() {
  // Priority 1: pakai repo jika ada
  if (typeof contentRepo.getActiveSubjectId === 'function') {
    try {
      return contentRepo.getActiveSubjectId()
    } catch (e) {
      console.warn('[useSubject] getActiveSubjectId error:', e)
    }
  }

  // Priority 2: baca langsung dari localStorage
  try {
    const stored = localStorage.getItem(ACTIVE_SUBJECT_KEY)
    if (stored && subjectsConfig.subjects.some((s) => s.id === stored)) {
      return stored
    }
  } catch {
    /* noop */
  }

  // Priority 3: default
  return DEFAULT_SUBJECT
}

function safeSetActiveSubjectId(subjectId) {
  // Priority 1: pakai repo jika ada
  if (typeof contentRepo.setActiveSubjectId === 'function') {
    try {
      return contentRepo.setActiveSubjectId(subjectId)
    } catch (e) {
      console.warn('[useSubject] setActiveSubjectId error:', e)
    }
  }

  // Priority 2: set langsung ke localStorage
  if (!subjectsConfig.subjects.some((s) => s.id === subjectId)) {
    console.warn(`[useSubject] Subject "${subjectId}" tidak dikenal.`)
    return false
  }
  try {
    localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectId)
    return true
  } catch {
    return false
  }
}

function safeGetAllSubjects() {
  if (typeof contentRepo.getAllSubjects === 'function') {
    try {
      return contentRepo.getAllSubjects()
    } catch (e) {
      console.warn('[useSubject] getAllSubjects error:', e)
    }
  }
  return subjectsConfig.subjects || []
}

function safeGetSubjectById(subjectId) {
  if (typeof contentRepo.getSubjectById === 'function') {
    try {
      return contentRepo.getSubjectById(subjectId)
    } catch (e) {
      console.warn('[useSubject] getSubjectById error:', e)
    }
  }
  return (subjectsConfig.subjects || []).find((s) => s.id === subjectId) || null
}

function safeGetModulesBySubject(subjectId) {
  if (typeof contentRepo.getModulesBySubject === 'function') {
    try {
      return contentRepo.getModulesBySubject(subjectId)
    } catch (e) {
      console.warn('[useSubject] getModulesBySubject error:', e)
    }
  }
  // Fallback: kalau tidak ada, coba getModulesBySubject via getAllModules + filter
  if (typeof contentRepo.getAllModules === 'function') {
    try {
      const all = contentRepo.getAllModules()
      return all.filter((m) => m.subjectId === subjectId)
    } catch {
      /* noop */
    }
  }
  return []
}

// ═══════════════════════════════════════════════════════════
// Module-level state (shared singleton)
// ═══════════════════════════════════════════════════════════
const activeSubjectId = ref(safeGetActiveSubjectId())

// ═══════════════════════════════════════════════════════════
// Composable
// ═══════════════════════════════════════════════════════════
export function useSubject() {
  const subjects = computed(() => safeGetAllSubjects())

  const activeSubject = computed(() => {
    return safeGetSubjectById(activeSubjectId.value) || safeGetAllSubjects()[0] || null
  })

  const activeModules = computed(() => {
    const list = safeGetModulesBySubject(activeSubjectId.value)
    return [...list].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
  })

  function setActive(id) {
    const ok = safeSetActiveSubjectId(id)
    if (ok) activeSubjectId.value = id
    return ok
  }

  return {
    activeSubjectId,
    activeSubject,
    subjects,
    activeModules,
    setActive,
  }
}

export default { useSubject }
