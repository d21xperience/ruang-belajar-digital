// src/config/learning.js
// =============================================================
// Konfigurasi terpusat sistem pembelajaran.
// JANGAN hard-code nilai KKM di tempat lain — impor dari sini.
// =============================================================

export const PASSING_SCORE = 80

export const LEARNING_CONFIG = Object.freeze({
  passingScore: PASSING_SCORE,
  storageNamespace: 'ppkn-progress-v2',
  legacyLulusPrefix: 'lulus-',
  legacySkorPrefix: 'skor-',
  legacySubbabPrefix: 'subbab-selesai-',
  schemaVersion: 1,
  // ═══ Multi-subject config ═══
  activeSubjectStorageKey: 'ppkn-active-subject',
  defaultSubject: 'ppkn',
  supportedSubjects: ['ppkn', 'hukum', 'komputer'],

  moduleCount: 5,
  finalQuestionCount: 35,
  maxAttemptsStored: 20, // batas riwayat attempt tersimpan
})

export default LEARNING_CONFIG
