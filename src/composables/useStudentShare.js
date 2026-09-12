// src/composables/useStudentShare.js
// =============================================================
// Generate file JSON progres siswa untuk dibagikan ke guru.
// =============================================================

export function buildShareData(state, contentMeta, student, subjectId = 'ppkn') {
  return {
    format: 'ppkn-progress-share',
    version: 2, // ← bump version karena schema berubah
    subjectId, // ← BARU
    student: {
      name: String(student.name || '').trim(),
      class: String(student.class || '').trim(),
      nis: String(student.nis || '').trim(),
    },
    sharedAt: new Date().toISOString(),
    appVersion: '2.1.0',
    contentVersion: contentMeta?.contentVersion || '0.0.0',
    progress: {
      modules: state?.modules || {},
      finalTest: state?.finalTest || {}, // keep untuk backward compat
      finalTests: state?.finalTests || {}, // ← BARU
    },
  }
}

export function downloadShareFile(data) {
  const filename = buildFilename(data)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return filename
}

export function validateShareFile(data) {
  if (!data || typeof data !== 'object') throw new Error('Bukan file JSON yang valid.')
  if (data.format !== 'ppkn-progress-share') throw new Error('Format file tidak dikenali.')
  if (!data.student?.name) throw new Error('File tidak memiliki nama siswa.')
  if (!data.progress) throw new Error('File tidak memiliki data progres.')
  return true
}

function buildFilename(data) {
  const name = slug(data.student.name) || 'siswa'
  const cls = slug(data.student.class) || 'kelas'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `ppkn-progres-${name}-${cls}-${date}.json`
}

function slug(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

export default { buildShareData, downloadShareFile, validateShareFile }
