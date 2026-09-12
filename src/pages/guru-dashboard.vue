<route lang="yaml">
meta:
  requiresAuth: true
</route>
<template>
  <q-page class="guru-page">
    <div class="guru-wrap no-print">
      <!-- ══════ TOPBAR ══════ -->
      <div class="page-topbar">
        <q-btn flat dense icon="arrow_back" label="Kembali" @click="$router.push('/')" />
        <!-- ═══ SUBJECT SELECTOR ═══ -->
        <div class="topbar-subject">
          <span class="ts-label">Subject:</span>
          <q-btn-dropdown class="ts-dropdown" :label="activeSubject?.judul || 'Pilih'"
            :icon="activeSubject?.icon || 'category'" outline dense no-caps>
            <q-list style="min-width: 240px;">
              <q-item v-for="subj in subjects" :key="subj.id" clickable v-close-popup
                :active="subj.id === activeSubjectId" active-class="ts-item--active" @click="selectSubject(subj.id)">
                <q-item-section avatar>
                  <q-icon :name="subj.icon" :color="subj.color" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ subj.judul }}</q-item-label>
                </q-item-section>
                <q-item-section v-if="subj.id === activeSubjectId" side>
                  <q-icon name="check" color="positive" size="18px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div class="topbar-actions">
          <q-btn class="btn-ghost-tech" outline icon="group_add" label="Kelola Kelas" @click="classDialogOpen = true" />
          <!-- <q-btn class="btn-ghost-tech" outline icon="group_add" label="Kelola Kelas" @click="classDialogOpen = true" /> -->
          <q-btn class="btn-primary-tech" unelevated icon="upload_file" label="Import File Siswa" :loading="importing"
            @click="triggerImport" />
          <q-btn v-if="stats.total > 0" class="btn-ghost-tech" outline icon="picture_as_pdf" label="Laporan PDF"
            @click="exportReport" />
          <q-btn flat dense icon="logout" label="Logout" color="negative" @click="confirmLogout" />
          <input ref="fileInputRef" type="file" accept="application/json,.json" multiple style="display: none"
            @change="handleImportFiles" />
        </div>
      </div>

      <h1 class="page-title">
        Dashboard Guru
        <span v-if="activeSubject" class="page-title-subject">
          · {{ activeSubject.judul }}
        </span>
        <span v-if="currentUser" class="welcome-text">
          · 👋Halo, {{ currentUser.nama.split(',')[0] }}
        </span>
      </h1>

      <p class="page-subtitle">
        Lihat ringkasan hasil belajar siswa per kelas. Import file progres
        yang dikirim siswa untuk memperbarui data.
      </p>

      <!-- ══════ CLASS SELECTOR ══════ -->
      <div v-if="state.classes.length" class="class-selector">
        <q-chip v-for="c in state.classes" :key="c.id" clickable :selected="c.id === state.activeClassId"
          class="class-chip" @click="setActiveClass(c.id)">
          <q-icon name="school" size="16px" class="q-mr-xs" />
          {{ c.nama }}
          <q-badge v-if="c.tahunAjaran" color="gold" text-color="navy-900" class="q-ml-sm" :label="c.tahunAjaran" />
        </q-chip>
      </div>

      <!-- ══════ EMPTY STATES ══════ -->
      <q-card v-if="!state.classes.length" flat bordered class="empty-card">
        <q-icon name="school" size="48px" color="grey-5" />
        <h2 class="empty-title">Belum ada kelas</h2>
        <p class="empty-desc">
          Mulai dengan membuat kelas (mis. X TKJ 1, Tahun Ajaran 2026/2027),
          lalu import file progres siswa ke kelas tersebut.
        </p>
        <q-btn class="btn-primary-tech" unelevated icon="add" label="Buat Kelas Pertama"
          @click="classDialogOpen = true" />
      </q-card>

      <q-card v-else-if="!students.length" flat bordered class="empty-card">
        <q-icon name="upload_file" size="48px" color="grey-5" />
        <h2 class="empty-title">Belum ada data siswa</h2>
        <p class="empty-desc">
          Kelas <b>{{ activeClass?.nama }}</b> belum memiliki data siswa.
          Minta siswa mengirim file <code>.json</code> progres mereka,
          lalu import di sini.
        </p>
        <q-btn class="btn-primary-tech" unelevated icon="upload_file" label="Import File Siswa"
          @click="triggerImport" />
      </q-card>

      <!-- ══════ MAIN DASHBOARD ══════ -->
      <template v-else>
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">TOTAL SISWA</div>
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-caption">{{ stats.started }} sudah mulai</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">RATA-RATA POST TEST</div>
            <div class="stat-value">{{ stats.avg }}</div>
            <div class="stat-caption">
              {{ activeSubject?.judul || 'subject' }}
            </div>
          </div>
          <div class="stat-card stat-card--highlight">
            <div class="stat-label">TUNTAS SEMUA MODUL</div>
            <div class="stat-value">
              {{ stats.passedAll }}<span class="stat-unit">/{{ stats.total }}</span>
            </div>
            <div class="stat-caption">
              dari {{ modules.length }} modul
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">FINAL TEST SELESAI</div>
            <div class="stat-value">
              {{ stats.finalDone }}<span class="stat-unit">/{{ stats.total }}</span>
            </div>
            <div class="stat-caption">
              {{ stats.avgFinal > 0 ? `Rata-rata ${stats.avgFinal}` : '—' }}
            </div>
          </div>
        </div>

        <!-- Penyelesaian per Modul -->
        <q-card flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Penyelesaian per Modul</h2>
            <p class="card-subtitle">Berapa siswa yang lulus tiap modul.</p>
          </div>
          <div class="module-bars">
            <div v-for="m in moduleCompletion" :key="m.moduleId" class="mb-row">
              <div class="mb-label">{{ m.label }}</div>
              <div class="mb-bar-wrap">
                <div class="mb-bar" :class="barClass(m.percent)" :style="{ width: m.percent + '%' }">
                  <span v-if="m.percent >= 20" class="mb-percent">{{ m.percent }}%</span>
                </div>
              </div>
              <div class="mb-count">{{ m.passed }}/{{ m.total }}</div>
            </div>
          </div>
        </q-card>

        <!-- Histogram Distribusi Skor -->
        <q-card flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Distribusi Skor Post Test</h2>
            <p class="card-subtitle">Sebaran rata-rata skor Post Test per siswa.</p>
          </div>
          <div class="histogram">
            <div v-for="(b, i) in scoreHistogram" :key="i" class="hist-col">
              <div class="hist-bar-wrap">
                <div class="hist-bar" :style="{ height: b.percent + '%' }">
                  <span v-if="b.count > 0" class="hist-count">{{ b.count }}</span>
                </div>
              </div>
              <div class="hist-label">{{ b.label }}</div>
            </div>
          </div>
        </q-card>

        <!-- Rekomendasi -->
        <q-card v-if="weakestModules.length" flat bordered class="analytics-card analytics-card--gold">
          <div class="card-head">
            <h2 class="card-title">📌 Rekomendasi Kelas</h2>
          </div>
          <p class="rec-text">
            Modul dengan rata-rata skor terendah di kelas ini:
          </p>
          <ul class="rec-list">
            <li v-for="m in weakestModules" :key="m.moduleId">
              <b>{{ m.label }}</b> — {{ m.judul }}
              (rata-rata {{ m.avgPostScore }})
            </li>
          </ul>
          <p class="rec-text">
            Pertimbangkan untuk mereview materi modul-modul tersebut
            di kelas sebelum siswa lanjut ke modul berikutnya.
          </p>
        </q-card>

        <!-- Siswa Perlu Bantuan -->
        <q-card v-if="needsHelp.length" flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">⚠️ Siswa Perlu Bantuan</h2>
            <p class="card-subtitle">
              Siswa dengan rata-rata Post Test di bawah 70.
            </p>
          </div>
          <div class="help-list">
            <div v-for="s in needsHelp" :key="s.key" class="help-item">
              <div class="help-name">
                <b>{{ s.name }}</b>
                <span v-if="s.nis" class="help-nis">({{ s.nis }})</span>
              </div>
              <div class="help-meta">
                Rata-rata: <b>{{ s.avgPostScore }}</b> ·
                Selesai: {{ s.passed }}/{{ s.totalModules }} modul
              </div>
            </div>
          </div>
        </q-card>

        <!-- Daftar Semua Siswa -->
        <q-card flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Daftar Siswa</h2>
            <p class="card-subtitle">
              {{ students.length }} siswa di kelas {{ activeClass?.nama }}.
              Klik baris untuk detail.
            </p>
          </div>
          <q-list separator class="student-list">
            <q-item v-for="s in sortedStudents" :key="s.key" clickable @click="viewStudent(s)">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="36px">
                  {{ initials(s.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="student-name">{{ s.name }}</q-item-label>
                <q-item-label caption>
                  {{ s.passed }}/{{ s.totalModules }} modul ·
                  Rata-rata {{ s.avgPostScore }} ·
                  Final {{ s.finalScore || '—' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat dense round icon="delete" color="negative" @click.stop="confirmRemoveStudent(s)" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Reset (expand) -->
        <q-expansion-item icon="settings" label="Pengaturan Lanjutan" caption="Reset seluruh data guru"
          class="reset-expand">
          <div class="reset-content">
            <p class="reset-warning">
              Menghapus <b>seluruh</b> data kelas dan siswa dari perangkat ini.
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <q-btn outline color="negative" label="Reset Semua Data" icon="delete_forever" @click="confirmReset" />
          </div>
        </q-expansion-item>
      </template>
    </div>

    <!-- ══════ CLASS MANAGER DIALOG ══════ -->
    <ClassManagerDialog v-model="classDialogOpen" :state="state" @create-class="onCreateClass"
      @update-class="onUpdateClass" @delete-class="onDeleteClass" />

    <!-- ══════ STUDENT DETAIL DIALOG ══════ -->
    <q-dialog v-model="studentDetailOpen">
      <q-card v-if="selectedStudent" class="student-detail-card">
        <div class="sd-head">
          <h3>{{ selectedStudent.name }}</h3>
          <q-btn flat dense round icon="close" @click="studentDetailOpen = false" />
        </div>
        <div class="sd-meta">
          <div v-if="selectedStudent.nis">NIS: {{ selectedStudent.nis }}</div>
          <div>Kelas: {{ selectedStudent.class }}</div>
          <div>Terakhir import: {{ formatDate(selectedStudent.lastImportedAt) }}</div>
          <div v-if="selectedStudent.subjects?.length">
            Subject terdaftar:
            <span v-for="(sid, i) in selectedStudent.subjects" :key="sid">
              <b>{{ subjectName(sid) }}</b><span v-if="i < selectedStudent.subjects.length - 1">, </span>
            </span>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- ═══ PROGRES MODUL — SUBJECT AKTIF ═══ -->
        <div class="sd-section">
          <div class="mono-tag">
            PROGRES MODUL — {{ activeSubject?.judul }}
          </div>
          <div v-if="!modules.length" class="sd-empty">
            Belum ada modul untuk subject ini.
          </div>
          <div v-else>
            <div v-for="m in modules" :key="m.id" class="sd-module-row">
              <span>{{ m.judulShort || `Modul ${m.urutan}` }}</span>
              <span v-if="selectedStudent.allModulesProgress[m.id]?.passed" class="sd-pass">
                ✓ Lulus ({{ selectedStudent.allModulesProgress[m.id].postTestBestScore }})
              </span>
              <span v-else-if="selectedStudent.allModulesProgress[m.id]?.postTestAttempts > 0" class="sd-warn">
                {{ selectedStudent.allModulesProgress[m.id].postTestBestScore || 0 }} · {{
                  selectedStudent.allModulesProgress[m.id].postTestAttempts }}×
              </span>
              <span v-else class="sd-pending">— Belum</span>
            </div>
          </div>
        </div>

        <!-- ═══ FINAL TEST — SUBJECT AKTIF ═══ -->
        <div class="sd-section">
          <div class="mono-tag">FINAL TEST — {{ activeSubject?.judul }}</div>
          <div v-if="currentFinalTest?.completed" class="sd-pass">
            ✓ Lulus — Skor {{ currentFinalTest.bestScore }}
          </div>
          <div v-else-if="currentFinalTest?.bestScore > 0" class="sd-warn">
            Belum lulus — Best {{ currentFinalTest.bestScore }}
            ({{ currentFinalTest.attempts }}×)
          </div>
          <div v-else class="sd-pending">Belum dikerjakan</div>
        </div>
      </q-card>
    </q-dialog>

    <!-- ══════ PDF TARGET ══════ -->
    <Teleport to="body">
      <div v-if="exporting" ref="pdfTargetRef" class="guru-pdf-target">
        <div class="pdf-header">
          <div class="pdf-brand">
            E-Modul · Laporan Kelas · {{ activeSubject?.judul }}
          </div>
          <h1 class="pdf-title">{{ activeClass?.nama }}</h1>
          <div class="pdf-meta">
            {{ activeSubject?.judul }} ·
            Tahun Ajaran {{ activeClass?.tahunAjaran || '—' }} ·
            Dicetak {{ currentDateLabel }}
          </div>
        </div>

        <h2 class="pdf-section-title">Ringkasan Kelas</h2>
        <table class="pdf-table">
          <tbody>
            <tr>
              <td>Total siswa</td>
              <td><b>{{ stats.total }}</b></td>
            </tr>
            <tr>
              <td>Rata-rata Post Test</td>
              <td><b>{{ stats.avg }}</b></td>
            </tr>
            <tr>
              <td>Tuntas semua modul</td>
              <td><b>{{ stats.passedAll }} / {{ stats.total }}</b></td>
            </tr>
            <tr>
              <td>Final Test selesai</td>
              <td><b>{{ stats.finalDone }} / {{ stats.total }}</b></td>
            </tr>
            <tr>
              <td>Rata-rata Final Test</td>
              <td><b>{{ stats.avgFinal }}</b></td>
            </tr>
          </tbody>
        </table>

        <h2 class="pdf-section-title">Penyelesaian per Modul</h2>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Modul</th>
              <th>Lulus</th>
              <th>Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in moduleCompletion" :key="m.moduleId">
              <td>{{ m.label }} — {{ m.judul }}</td>
              <td>{{ m.passed }} / {{ m.total }} ({{ m.percent }}%)</td>
              <td>{{ m.avgPostScore }}</td>
            </tr>
          </tbody>
        </table>

        <h2 class="pdf-section-title">Daftar Siswa</h2>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Modul Lulus</th>
              <th>Rata-rata</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sortedStudents" :key="s.key">
              <td>{{ s.name }}</td>
              <td>{{ s.passed }} / {{ s.totalModules }}</td>
              <td>{{ s.avgPostScore }}</td>
              <td>{{ s.finalScore || '—' }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="weakestModules.length" class="pdf-callout">
          <h3>Rekomendasi</h3>
          <p>
            Modul dengan rata-rata terendah:
            <b>{{weakestModules.map((m) => m.label).join(', ')}}</b>.
          </p>
        </div>

        <div class="pdf-footer">
          E-Modul Pendidikan Pancasila · SMK Pasundan Jatinangor
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="exporting" class="guru-loading no-print">
        <q-spinner-dots size="48px" color="primary" />
        <div class="loading-text">Menyiapkan laporan…</div>
      </div>
    </Teleport>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useQuasar } from 'quasar'
import repo from '../repositories/guruStateRepository'
import { useGuruDashboard } from '../composables/useGuruDashboard'
import { usePdfExport } from '../composables/usePdfExport'
import { validateShareFile } from '../composables/useStudentShare'
import ClassManagerDialog from '../components/guru/ClassManagerDialog.vue'
import { useAuth } from '../composables/useAuth'
const { currentUser, logout } = useAuth()
const $q = useQuasar()
import contentRepo from '../repositories/contentRepository'
// ══════ State ══════
const state = reactive(repo.loadState())
// const activeClassId = ref(state.activeClassId)
const classDialogOpen = ref(false)
const importing = ref(false)
const fileInputRef = ref(null)
const studentDetailOpen = ref(false)
const selectedStudent = ref(null)
const pdfTargetRef = ref(null)

const { exporting, exportElementToPdf } = usePdfExport()

// ══════ Analytics ══════
const activeClass = computed(() =>
  state.classes.find((c) => c.id === state.activeClassId) || null
)
const currentFinalTest = computed(() => {
  if (!selectedStudent.value || !activeSubjectId.value) return null
  return selectedStudent.value.allFinalTests?.[activeSubjectId.value] || null
})

function subjectName(subjectId) {
  return contentRepo.getSubjectById(subjectId)?.judul || subjectId
}
const {
  students,
  studentSummaries,
  stats,
  moduleCompletion,
  scoreHistogram,
  needsHelp,
  weakestModules,
} = useGuruDashboard(state)

const sortedStudents = computed(() =>
  [...studentSummaries.value].sort((a, b) => a.name.localeCompare(b.name))
)

const currentDateLabel = computed(() => {
  const d = new Date()
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
})

// ══════ Actions ══════
function setActiveClass(id) {
  repo.setActiveClass(state, id)
  // activeClassId.value = id
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleImportFiles(event) {
  const files = [...(event.target.files || [])]
  event.target.value = ''
  if (!files.length) return

  if (!state.activeClassId) {
    $q.notify({ type: 'warning', message: 'Pilih kelas terlebih dahulu.', position: 'top' })
    return
  }

  importing.value = true
  let success = 0
  let failed = 0
  const errors = []

  for (const file of files) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      validateShareFile(data)

      // Deteksi subject dari student share data (kalau ada)
      const detectedSubjectId = data.subjectId
        || detectSubjectFromProgress(data.progress)

      // Inject subjectId untuk repo
      repo.addStudentImport(state, state.activeClassId, {
        ...data,
        subjectId: detectedSubjectId,
      })
      success++
    } catch (e) {
      failed++
      errors.push(`${file.name}: ${e.message}`)
    }
  }

  importing.value = false

  if (success > 0) {
    $q.notify({
      type: 'positive',
      message: `${success} file berhasil diimport${failed ? `, ${failed} gagal` : ''}.`,
      position: 'top',
      timeout: 4000,
    })
  }
  if (failed > 0) {
    $q.notify({
      type: 'negative',
      message: `Gagal import: ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} lainnya)` : ''}`,
      position: 'top',
      timeout: 6000,
    })
  }
}

function detectSubjectFromProgress(progress) {
  const modules = progress?.modules || {}
  const ids = Object.keys(modules)
  if (!ids.length) return 'ppkn'

  for (const id of ids) {
    if (id.startsWith('hukum-')) return 'hukum'
    if (id.startsWith('komputer-')) return 'komputer'
  }
  return 'ppkn'
}

function onCreateClass({ nama, tahunAjaran }) {
  repo.createClass(state, nama, tahunAjaran)
  $q.notify({ type: 'positive', message: `Kelas "${nama}" dibuat.`, position: 'top' })
}

function onUpdateClass({ id, patch }) {
  repo.updateClass(state, id, patch)
  $q.notify({ type: 'positive', message: 'Kelas diperbarui.', position: 'top' })
}

function onDeleteClass(id) {
  repo.deleteClass(state, id)
  $q.notify({ type: 'info', message: 'Kelas dihapus.', position: 'top' })
}

function viewStudent(s) {
  // Ambil data lengkap dari repo (bukan summary)
  const fullStudent = repo.getStudents(state, state.activeClassId).find(
    (x) => x.key === s.key
  )
  if (!fullStudent) return

  // Enrich dengan full progress data
  selectedStudent.value = {
    ...s,
    allModulesProgress: fullStudent.progress?.modules || {},
    allFinalTests: fullStudent.progress?.finalTests || {},
    subjects: fullStudent.subjects || [],
  }
  studentDetailOpen.value = true
}

function confirmRemoveStudent(s) {
  $q.dialog({
    title: 'Hapus Siswa',
    message: `Hapus data "${s.name}" dari kelas ini?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
  }).onOk(() => {
    repo.removeStudent(state, state.activeClassId, s.key)
    $q.notify({ type: 'info', message: 'Siswa dihapus.', position: 'top' })
  })
}

function confirmReset() {
  $q.dialog({
    title: 'Reset Semua Data Guru',
    message: 'Menghapus SELURUH data kelas dan siswa. Tidak dapat dibatalkan.',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Reset', color: 'negative', unelevated: true },
  }).onOk(() => {
    const fresh = repo.resetState()
    Object.assign(state, fresh)
    $q.notify({ type: 'info', message: 'Data guru direset.', position: 'top' })
  })
}

async function exportReport() {
  exporting.value = true
  await new Promise((r) => setTimeout(r, 300))
  try {
    const subjectLabel = activeSubject.value?.judul || 'Umum'
    const classLabel = activeClass.value?.nama || 'kelas'
    await exportElementToPdf(pdfTargetRef.value, {
      filename: `laporan-${classLabel}-${subjectLabel}`.toLowerCase().replace(/\s+/g, '-'),
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  } finally {
    await new Promise((r) => setTimeout(r, 150))
    exporting.value = false
  }
}

// ══════ Helpers ══════
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() || '').join('')
}

function barClass(percent) {
  if (percent >= 80) return 'mb-bar--high'
  if (percent >= 60) return 'mb-bar--mid'
  if (percent > 0) return 'mb-bar--low'
  return 'mb-bar--empty'
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function confirmLogout() {
  $q.dialog({
    title: 'Logout',
    message: 'Keluar dari dashboard guru?',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Logout', color: 'negative', unelevated: true },
  }).onOk(() => {
    logout()
    $q.notify({ type: 'info', message: 'Anda telah logout.', position: 'top' })
    window.location.replace('/')
  })
}
const ACTIVE_SUBJECT_KEY = 'guru-dashboard-subject'
const subjects = computed(() => contentRepo.getAllSubjects())

const activeSubjectId = ref(
  (() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SUBJECT_KEY)
      if (stored && subjects.value.some((s) => s.id === stored)) return stored
    } catch { /* noop */ }
    return 'ppkn'
  })()
)


const activeSubject = computed(() =>
  subjects.value.find((s) => s.id === activeSubjectId.value) || null
)
function selectSubject(subjectId) {
  if (subjectId === activeSubjectId.value) return
  activeSubjectId.value = subjectId
  try {
    localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectId)
  } catch { /* noop */ }
  $q.notify({
    type: 'info',
    icon: activeSubject.value?.icon,
    message: `Menampilkan analytics: ${activeSubject.value?.judul}`,
    position: 'top',
    timeout: 1500,
  })
}



</script>

<style scoped>
.welcome-text {
  font-size: 0.9rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 400;
}

.guru-page {
  background: var(--paper, #F4F6F8);
  min-height: 100vh;
}

.guru-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}

.page-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.topbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.6rem;
  margin: 0 0 6px;
  color: var(--navy-900, #0B1F33);
}

.page-subtitle {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  margin-bottom: 20px;
}

.btn-primary-tech {
  background: var(--gold-500, #C9A227);
  color: var(--navy-900, #0B1F33);
  font-weight: 600;
  border-radius: 4px;
}

.btn-ghost-tech {
  color: var(--navy-700, #16324F);
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 4px;
}

/* Class selector */
.class-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.class-chip {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  cursor: pointer;
}

.class-chip.q-chip--selected {
  background: var(--gold-100, #F3E7C4);
  color: #8A6A14;
  border-color: var(--gold-500, #C9A227);
}

/* Empty state */
.empty-card {
  padding: 48px 24px;
  text-align: center;
}

.empty-title {
  font-size: 1.15rem;
  margin: 12px 0 8px;
  color: var(--navy-900, #0B1F33);
}

.empty-desc {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  max-width: 520px;
  margin: 0 auto 20px;
}

.empty-desc code {
  background: var(--paper, #F4F6F8);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.85em;
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 16px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

.stat-card--highlight {
  background: linear-gradient(135deg, #FFF9E6, #FFFFFF);
  border-color: var(--gold-500, #C9A227);
}

.stat-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  color: var(--ink-500, #5B6B7C);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--navy-900, #0B1F33);
}

.stat-unit {
  font-size: 0.9rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 400;
}

/* Analytics cards */
.analytics-card {
  padding: 20px;
  margin-bottom: 16px;
  border-radius: 8px;
}

.analytics-card--gold {
  border-left: 4px solid var(--gold-500, #C9A227);
}

.card-head {
  margin-bottom: 14px;
}

.card-title {
  font-size: 1.1rem;
  color: var(--navy-900, #0B1F33);
  margin: 0 0 4px;
}

.card-subtitle {
  font-size: 0.82rem;
  color: var(--ink-500, #5B6B7C);
  margin: 0;
}

/* Module bars */
.module-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mb-row {
  display: grid;
  grid-template-columns: 140px 1fr 60px;
  gap: 12px;
  align-items: center;
}

.mb-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
}

.mb-bar-wrap {
  height: 18px;
  background: #E0E6EC;
  border-radius: 3px;
  overflow: hidden;
}

.mb-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  transition: width 0.4s;
}

.mb-bar--high {
  background: #21ba45;
}

.mb-bar--mid {
  background: #C9A227;
}

.mb-bar--low {
  background: #f2c037;
}

.mb-bar--empty {
  background: #B0B8C0;
}

.mb-percent {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #fff;
  font-weight: 700;
}

.mb-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.85rem;
  text-align: right;
  color: var(--ink-900, #1B2733);
}

/* Histogram */
.histogram {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  align-items: end;
  height: 180px;
  padding: 0 4px;
}

.hist-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.hist-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.hist-bar {
  width: 100%;
  background: linear-gradient(180deg, #C9A227, #E8CD6F);
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height 0.4s;
}

.hist-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
  padding-top: 2px;
}

.hist-label {
  font-size: 0.75rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 6px;
  font-family: 'IBM Plex Mono', monospace;
}

/* Recommendations */
.rec-text {
  color: var(--ink-900, #1B2733);
  line-height: 1.6;
  margin: 0 0 8px;
}

.rec-list {
  margin: 0 0 12px;
  padding-left: 20px;
  line-height: 1.7;
  color: var(--ink-900, #1B2733);
}

/* Help list */
.help-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-item {
  padding: 10px 12px;
  background: #FFF9E6;
  border-left: 3px solid #F2C037;
  border-radius: 4px;
}

.help-name {
  font-size: 0.95rem;
  color: var(--navy-900, #0B1F33);
}

.help-nis {
  color: var(--ink-500, #5B6B7C);
  font-size: 0.85rem;
  margin-left: 4px;
}

.help-meta {
  font-size: 0.82rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 4px;
}

/* Student list */
.student-list {
  background: #fff;
}

.student-name {
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
}

/* Reset */
.reset-expand {
  margin-top: 16px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

.reset-content {
  padding: 16px;
}

.reset-warning {
  color: var(--red-500, #A6403F);
  font-size: 0.85rem;
  margin-bottom: 12px;
  line-height: 1.6;
}

/* Student detail */
.student-detail-card {
  width: 90vw;
  max-width: 460px;
  padding: 20px;
}

.sd-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sd-head h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--navy-900, #0B1F33);
}

.sd-meta {
  font-size: 0.85rem;
  color: var(--ink-500, #5B6B7C);
  line-height: 1.7;
}

.sd-section {
  margin-bottom: 14px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
  margin-bottom: 6px;
}

.sd-module-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 0.88rem;
  border-bottom: 1px dashed var(--border, #D8DEE5);
}

.sd-pass {
  color: #15663A;
  font-weight: 600;
}

.sd-warn {
  color: #8A6A14;
}

.sd-pending {
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
}

/* ═══ PDF Target ═══ */
.guru-pdf-target {
  position: fixed;
  top: 0;
  left: 0;
  width: 794px;
  min-height: 100px;
  background: #fff;
  color: #1B2733;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.55;
  padding: 40px;
  z-index: 999998;
}

.pdf-header {
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 2px solid #C9A227;
}

.pdf-brand {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: #C9A227;
  margin-bottom: 4px;
}

.pdf-title {
  font-size: 22px;
  color: #0B1F33;
  margin: 0 0 6px;
}

.pdf-meta {
  font-size: 11px;
  color: #5B6B7C;
  font-family: 'IBM Plex Mono', monospace;
}

.pdf-section-title {
  font-size: 15px;
  color: #16324F;
  margin: 20px 0 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid #D8DEE5;
}

.pdf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-bottom: 12px;
}

.pdf-table th,
.pdf-table td {
  padding: 7px 10px;
  text-align: left;
  border-bottom: 1px solid #E8ECEF;
}

.pdf-table th {
  background: #F4F6F8;
  font-weight: 700;
  color: #0B1F33;
}

.pdf-callout {
  margin: 16px 0;
  padding: 12px 16px;
  background: #FFF9E6;
  border-left: 3px solid #C9A227;
  border-radius: 4px;
}

.pdf-callout h3 {
  margin: 0 0 6px;
  font-size: 13px;
  color: #0B1F33;
}

.pdf-footer {
  margin-top: 30px;
  padding-top: 14px;
  border-top: 1px solid #D8DEE5;
  font-size: 10px;
  color: #5B6B7C;
  text-align: center;
  font-family: 'IBM Plex Mono', monospace;
}

/* Loading */
.guru-loading {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.loading-text {
  margin-top: 12px;
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
  font-size: 1.05rem;
}

@media (max-width: 640px) {
  .mb-row {
    grid-template-columns: 100px 1fr 50px;
    gap: 8px;
  }

  .mb-label {
    font-size: 0.78rem;
  }
}

/* ══════════ SUBJECT SELECTOR ══════════ */
.topbar-subject {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  margin-right: 12px;
}

.ts-label {
  font-size: 0.78rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 600;
}

.ts-dropdown {
  color: var(--navy-700, #16324F);
  border-color: var(--border, #D8DEE5);
}

.ts-item--active {
  background: var(--gold-100, #F3E7C4);
}

.page-title-subject {
  font-size: 0.9rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 400;
  margin-left: 4px;
}

.stat-caption {
  font-size: 0.72rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 4px;
}

.sd-empty {
  padding: 12px;
  text-align: center;
  font-size: 0.82rem;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
  background: var(--paper, #F4F6F8);
  border-radius: 4px;
}

@media (max-width: 640px) {
  .topbar-subject {
    width: 100%;
    order: 2;
    margin: 8px 0;
  }

  .ts-dropdown {
    flex: 1;
  }
}
</style>
