// src/repositories/contentRepository.js
// =============================================================
// Multi-subject content repository.
// Support 3 subject: ppkn, hukum, komputer.
// Setiap modul di-tag dengan subjectId untuk filtering.
// =============================================================

import subjectsConfig from '../assets/subjects.json'
import rawPPKn from '../assets/materi.json'
import rawHukum from '../assets/hukum.json'
import rawKomputer from '../assets/komputer.json'

import { validateContent } from './contentValidator'

// ═══════════════════════════════════════════════════════════
// Storage helpers untuk active subject
// ═══════════════════════════════════════════════════════════
const ACTIVE_SUBJECT_KEY = 'ppkn-active-subject'

export function getActiveSubjectId() {
  try {
    const stored = localStorage.getItem(ACTIVE_SUBJECT_KEY)
    if (stored && subjectsConfig.subjects.some((s) => s.id === stored)) {
      return stored
    }
  } catch {
    /* noop */
  }
  return subjectsConfig.defaultSubject || 'ppkn'
}

export function setActiveSubjectId(subjectId) {
  if (!subjectsConfig.subjects.some((s) => s.id === subjectId)) {
    console.warn(`[ContentRepo] Subject "${subjectId}" tidak dikenal.`)
    return false
  }
  try {
    localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectId)
  } catch {
    /* noop */
  }
  return true
}

// ═══════════════════════════════════════════════════════════
// Load & tag content per subject
// ═══════════════════════════════════════════════════════════
function normalizeContent(raw) {
  if (!raw) return { modules: [], finalTest: null }
  if (Array.isArray(raw)) {
    // Legacy: raw adalah array modul
    return { modules: raw, finalTest: null }
  }
  return {
    modules: raw.modules || [],
    finalTest: raw.finalTest || null,
    contentVersion: raw.contentVersion || '0.0.0',
    updatedAt: raw.updatedAt || null,
  }
}

function tagSubject(content, subjectId) {
  const modules = (content.modules || []).map((m) => ({
    ...m,
    subjectId,
  }))
  return {
    ...content,
    subjectId,
    modules,
  }
}

let cachedContents = null

function loadAllContent() {
  if (cachedContents) return cachedContents

  const contents = {
    ppkn: tagSubject(normalizeContent(rawPPKn), 'ppkn'),
    hukum: tagSubject(normalizeContent(rawHukum), 'hukum'),
    komputer: tagSubject(normalizeContent(rawKomputer), 'komputer'),
  }

  // ═══ Validasi tiap subject (warning saja, tidak crash) ═══
  for (const [subjectId, content] of Object.entries(contents)) {
    if (!content.modules?.length) {
      // Subject kosong = valid (belum diisi)
      continue
    }
    try {
      validateContent({
        contentVersion: content.contentVersion,
        modules: content.modules,
        finalTest: content.finalTest,
      })
    } catch (e) {
      console.warn(`[ContentRepo] Validasi subject "${subjectId}" gagal:`, e.message)
    }
  }

  cachedContents = contents
  return cachedContents
}
/**
 * Reset cache — berguna setelah edit content di Content Builder
 * agar data ter-reload fresh.
 */
export function clearCache() {
  cachedContents = null
}

/**
 * Get RAW content per subject (untuk Content Builder).
 * Berbeda dari getModulesBySubject yang sudah di-tag.
 * Ini mengembalikan objek asli yang bisa diedit.
 */
export function getRawContent(subjectId) {
  const contents = loadAllContent()
  const c = contents[subjectId]
  if (!c) return null
  // Return deep copy agar tidak mutate cache
  return JSON.parse(
    JSON.stringify({
      contentVersion: c.contentVersion,
      updatedAt: c.updatedAt,
      subjectId: c.subjectId,
      modules: c.modules || [],
      finalTest: c.finalTest || null,
    }),
  )
}

/**
 * Cek apakah subject punya konten (untuk badge di UI).
 */
export function hasContent(subjectId) {
  const contents = loadAllContent()
  const c = contents[subjectId]
  return !!c && ((c.modules?.length || 0) > 0 || c.finalTest)
}

/**
 * Get statistik singkat per subject.
 */
export function getSubjectStats(subjectId) {
  const contents = loadAllContent()
  const c = contents[subjectId]
  if (!c) return { modules: 0, finalQuestions: 0, sections: 0 }
  const modules = c.modules || []
  return {
    modules: modules.length,
    finalQuestions: c.finalTest?.questions?.length || 0,
    sections: modules.reduce((sum, m) => sum + (m.sections?.length || 0), 0),
  }
}

// ═══════════════════════════════════════════════════════════
// Subjects
// ═══════════════════════════════════════════════════════════
export function getAllSubjects() {
  return subjectsConfig.subjects || []
}

export function getSubjectById(subjectId) {
  return (subjectsConfig.subjects || []).find((s) => s.id === subjectId) || null
}

export function getSubjectByFile(filename) {
  return (subjectsConfig.subjects || []).find((s) => s.file === filename) || null
}

// ═══════════════════════════════════════════════════════════
// Modules
// ═══════════════════════════════════════════════════════════

/**
 * Semua modul dari SEMUA subject (untuk analytics lintas subject).
 */
export function getAllModules() {
  const contents = loadAllContent()
  return Object.values(contents).flatMap((c) => c.modules || [])
}

/**
 * Modul hanya dari subject tertentu.
 */
export function getModulesBySubject(subjectId) {
  const contents = loadAllContent()
  const content = contents[subjectId]
  if (!content) return []
  return content.modules || []
}

/**
 * Modul dari subject AKTIF (default: ppkn).
 * Ini backward-compatible dengan semua kode lama yang memanggil getAllModules().
 */
export function getActiveModules() {
  return getModulesBySubject(getActiveSubjectId())
}

/**
 * Cari modul by ID di semua subject.
 */
export function getModuleById(moduleId) {
  const contents = loadAllContent()
  for (const content of Object.values(contents)) {
    const found = (content.modules || []).find((m) => m.id === moduleId)
    if (found) return found
  }
  return null
}

/**
 * Cari modul dalam subject tertentu (lebih cepat & eksplisit).
 */
export function getModuleInSubject(subjectId, moduleId) {
  const modules = getModulesBySubject(subjectId)
  return modules.find((m) => m.id === moduleId) || null
}

// ═══════════════════════════════════════════════════════════
// Lessons & Questions (unchanged, filter via module)
// ═══════════════════════════════════════════════════════════
export function getLessonById(moduleId, lessonId) {
  const mod = getModuleById(moduleId)
  if (!mod) return null
  return mod.sections?.find((s) => s.id === lessonId) || null
}

export function getFreeTestQuestions(moduleId) {
  const mod = getModuleById(moduleId)
  return mod?.freeTest?.questions || []
}

export function getPostTestQuestions(moduleId) {
  const mod = getModuleById(moduleId)
  return mod?.postTest?.questions || []
}

// ═══════════════════════════════════════════════════════════
// Final Test — PER SUBJECT
// ═══════════════════════════════════════════════════════════

/**
 * Soal final test untuk subject tertentu.
 * Default: subject aktif.
 */
export function getFinalTestQuestions(subjectId = getActiveSubjectId()) {
  const contents = loadAllContent()
  return contents[subjectId]?.finalTest?.questions || []
}

/**
 * Metadata final test untuk subject tertentu.
 */
export function getFinalTestMeta(subjectId = getActiveSubjectId()) {
  const contents = loadAllContent()
  const ft = contents[subjectId]?.finalTest
  if (!ft) return null
  return {
    id: ft.id,
    judul: ft.judul,
    passingScore: ft.passingScore,
    totalQuestions: (ft.questions || []).length,
  }
}

/**
 * Cek apakah subject tertentu punya final test.
 */
export function hasFinalTest(subjectId = getActiveSubjectId()) {
  const contents = loadAllContent()
  return !!contents[subjectId]?.finalTest
}

// ═══════════════════════════════════════════════════════════
// Lookup question by ID (lintas subject)
// ═══════════════════════════════════════════════════════════
export function findQuestionById(questionId) {
  const contents = loadAllContent()

  for (const [subjectId, content] of Object.entries(contents)) {
    // Cari di final test
    const finalQ = content.finalTest?.questions?.find((q) => q.id === questionId)
    if (finalQ) {
      return { ...finalQ, source: 'final', subjectId, moduleId: finalQ.moduleId }
    }

    // Cari di modul
    for (const mod of content.modules || []) {
      const fq = mod.freeTest?.questions?.find((q) => q.id === questionId)
      if (fq) return { ...fq, source: 'free', subjectId, moduleId: mod.id }

      const pq = mod.postTest?.questions?.find((q) => q.id === questionId)
      if (pq) return { ...pq, source: 'post', subjectId, moduleId: mod.id }
    }
  }
  return null
}

// ═══════════════════════════════════════════════════════════
// Metadata
// ═══════════════════════════════════════════════════════════
export function getContentMeta(subjectId = null) {
  const contents = loadAllContent()

  if (subjectId) {
    const c = contents[subjectId]
    return {
      subjectId,
      contentVersion: c?.contentVersion || '0.0.0',
      updatedAt: c?.updatedAt || null,
      totalModules: c?.modules?.length || 0,
      totalFinalQuestions: c?.finalTest?.questions?.length || 0,
    }
  }

  // Aggregated lintas subject
  return {
    contentVersion: subjectsConfig.contentVersion || '0.0.0',
    subjects: Object.keys(contents).length,
    totalModules: Object.values(contents).reduce((sum, c) => sum + (c.modules?.length || 0), 0),
  }
}

export default {
  getActiveSubjectId,
  setActiveSubjectId,
  getAllSubjects,
  getSubjectById,
  getSubjectByFile,
  getAllModules,
  getModulesBySubject,
  getActiveModules,
  getModuleById,
  getModuleInSubject,
  getLessonById,
  getFreeTestQuestions,
  getPostTestQuestions,
  getFinalTestQuestions,
  getFinalTestMeta,
  hasFinalTest,
  findQuestionById,
  getContentMeta,
  clearCache, // ← BARU
  getRawContent, // ← BARU
  hasContent, // ← BARU
  getSubjectStats,
}
