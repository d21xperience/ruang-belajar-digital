<route lang="yaml">
meta:
  requiresAuth: true
</route>
<template>
  <q-page class="builder-page">
    <div class="builder-wrap">
      <div class="builder-topbar">
        <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" @click="$router.push('/')" />

        <!-- ═══════════════════════════════════════════════════════
             SUBJECT SELECTOR
             ═══════════════════════════════════════════════════════ -->
        <div class="subject-picker">
          <span class="subject-picker-label">Subject:</span>
          <q-btn-dropdown class="subject-dropdown" :label="activeSubject?.judul || 'Pilih Subject'"
            :icon="activeSubject?.icon || 'category'" outline dense no-caps :loading="loading">
            <q-list style="min-width: 260px;">
              <q-item v-for="subj in subjects" :key="subj.id" clickable v-close-popup
                :active="subj.id === selectedSubjectId" active-class="subject-item--active"
                @click="selectSubject(subj.id)">
                <q-item-section avatar>
                  <q-icon :name="subj.icon" :color="subj.color" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ subj.judul }}</q-item-label>
                  <q-item-label caption>
                    {{ subjectStats(subj.id).modules }} modul ·
                    {{ subjectStats(subj.id).finalQuestions }} soal final
                  </q-item-label>
                </q-item-section>
                <q-item-section v-if="subj.id === selectedSubjectId" side>
                  <q-icon name="check" color="positive" size="18px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <div class="topbar-right">
          <span class="mono-tag builder-version">
            v{{ workingContent.contentVersion }} ·
            {{ workingContent.modules.length }} modul
          </span>
          <q-btn flat dense icon="logout" label="Logout" color="negative" @click="confirmLogout" />
        </div>
      </div>

      <h1 class="builder-title">
        Content Builder
        <span v-if="activeSubject" class="builder-title-subject">
          — {{ activeSubject.judul }}
        </span>
      </h1>
      <p class="builder-subtitle">
        Editor materi & soal E-Modul. Pilih subject dari dropdown di atas untuk
        beralih konteks editing. Setiap subject disimpan di file JSON terpisah.
      </p>

      <q-tabs v-model="tab" dense class="q-mb-md builder-tabs" align="left">
        <q-tab name="form" icon="edit_note" label="Form Editor" />
        <q-tab name="preview" icon="visibility" label="Preview" />
        <q-tab name="media" icon="perm_media" label="Media" />
        <q-tab name="final" icon="flag" label="Final Test" />
        <q-tab name="paste" icon="content_paste" label="Paste Text" />
        <q-tab name="json" icon="code" label="JSON Preview" />
        <q-tab name="validate" icon="check_circle" label="Validasi" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated keep-alive>

        <!-- ═══════════════ TAB: FORM EDITOR ═══════════════ -->
        <q-tab-panel name="form">
          <div v-if="!workingContent.modules.length" class="empty-state">
            <q-icon name="inbox" size="40px" color="grey-5" />
            <p>Belum ada modul untuk subject <b>{{ activeSubject?.judul }}</b>.</p>
            <q-btn class="btn-primary-tech" unelevated icon="add" label="Tambah Modul Pertama" @click="addModule" />
          </div>

          <div v-else class="form-editor">
            <div class="editor-sidebar">
              <ModuleListSidebar :modules="workingContent.modules" :active-index="activeModuleIndex"
                @select="(i) => activeModuleIndex = i" @add-module="addModule" @delete="deleteModule"
                @reorder="reorderModule" />
            </div>

            <div v-if="activeModule" class="editor-panel">
              <ModuleMetaForm :module="activeModule" @update="({ key, value }) => updateModule(key, value)" />

              <q-card flat bordered class="editor-card q-mt-md">
                <div class="mono-tag q-mb-md">MATERI (SECTIONS)</div>
                <SectionListEditor :sections="activeModule.sections || []" @add="addSection" @update="updateSection"
                  @delete="deleteSection" @move-up="(i) => moveSection(i, -1)" @move-down="(i) => moveSection(i, 1)"
                  @reorder="({ from, to }) => reorderSection({ from, to })" />
              </q-card>

              <q-card flat bordered class="editor-card q-mt-md">
                <QuestionListEditor title="FREE TEST" :questions="activeModule.freeTest?.questions || []"
                  @add="addFreeQuestion" @update="(i, payload) => updateQuestion('freeTest', i, payload)"
                  @delete="(i) => deleteQuestion('freeTest', i)" @move-up="(i) => moveQuestion('freeTest', i, -1)"
                  @move-down="(i) => moveQuestion('freeTest', i, 1)"
                  @reorder="({ from, to }) => reorderQuestion('freeTest', from, to)" />
              </q-card>

              <q-card flat bordered class="editor-card q-mt-md">
                <QuestionListEditor title="POST TEST" :questions="activeModule.postTest?.questions || []"
                  :passing-score="activeModule.postTest?.passingScore ?? activeModule.passingScore"
                  @add="addPostQuestion" @update="(i, payload) => updateQuestion('postTest', i, payload)"
                  @delete="(i) => deleteQuestion('postTest', i)" @move-up="(i) => moveQuestion('postTest', i, -1)"
                  @move-down="(i) => moveQuestion('postTest', i, 1)"
                  @reorder="({ from, to }) => reorderQuestion('postTest', from, to)" />
              </q-card>

              <div class="editor-actions q-mt-lg">
                <q-btn class="btn-primary-tech" unelevated icon="download" label="Export JSON" @click="downloadJson" />
                <q-btn class="btn-ghost-tech" outline icon="refresh" label="Reset ke Konten Asli"
                  @click="confirmResetWorking" />
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- ═══════════════ TAB: PREVIEW ═══════════════ -->
        <q-tab-panel name="preview">
          <div v-if="!activeModule" class="empty-state">
            <q-icon name="visibility_off" size="40px" color="grey-5" />
            <p>Pilih modul di Form Editor terlebih dahulu untuk melihat preview.</p>
            <q-btn class="btn-primary-tech" unelevated icon="edit_note" label="Ke Form Editor" @click="tab = 'form'" />
          </div>
          <LivePreview v-else :active-module="activeModule" />
        </q-tab-panel>

        <!-- ═══════════════ TAB: MEDIA ═══════════════ -->
        <q-tab-panel name="media">
          <MediaManager :content="workingContent" :modules="workingContent.modules" @delete-media="handleDeleteMedia" />
        </q-tab-panel>

        <!-- ═══════════════ TAB: FINAL TEST ═══════════════ -->
        <q-tab-panel name="final">
          <FinalTestEditor :final-test="effectiveFinalTest" :modules="workingContent.modules"
            :expected-count="LEARNING_CONFIG.finalQuestionCount" @update-meta="updateFinalTestMeta"
            @add-question="addFinalQuestion" @update-question="updateFinalQuestion"
            @delete-question="deleteFinalQuestion" @move-question="moveFinalQuestion"
            @reorder-question="reorderFinalQuestion" />
        </q-tab-panel>

        <!-- ═══════════════ TAB: PASTE TEXT ═══════════════ -->
        <q-tab-panel name="paste">
          <q-input v-model="pastedText" type="textarea" outlined autogrow label="Tempelkan teks materi + soal"
            :input-style="{
              minHeight: '280px',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '0.85rem',
            }" />
          <q-expansion-item class="format-hint q-mt-md" icon="help_outline" label="Lihat format yang diharapkan">
            <pre class="format-pre">MODULE_ID: module-06
JUDUL: Judul Modul Baru
DESKRIPSI: Deskripsi singkat
KKM: 80

TUJUAN:
Memahami konsep X.
Mengidentifikasi Y.

SECTION: lesson-06-01
JUDUL_SECTION: A. Judul Subbab
KONTEN:
Paragraf pertama...
Paragraf kedua...
POIN:
Poin penting pertama.
Poin penting kedua.
KATA_KUNCI:
kata1, kata2, kata3

SOAL_FREE: q-ft-06-01
PERTANYAAN: Teks pertanyaan free test?
A. Pilihan A
B. Pilihan B
C. Pilihan C
D. Pilihan D
JAWABAN: B
PEMBAHASAN: Alasan jawaban benar.

SOAL_POST: q-pt-06-01
PERTANYAAN: Teks pertanyaan post test?
A. Pilihan A
B. Pilihan B
C. Pilihan C
D. Pilihan D
JAWABAN: A
PEMBAHASAN: Alasan jawaban benar.</pre>
          </q-expansion-item>
          <div class="editor-actions q-mt-md">
            <q-btn class="btn-primary-tech" unelevated icon="play_arrow" label="Parse Teks" @click="parsePasted" />
            <q-btn class="btn-ghost-tech" outline icon="auto_fix_high" label="Muat Contoh" @click="loadSample" />
            <q-btn class="btn-ghost-tech" outline icon="clear" label="Bersihkan" @click="pastedText = ''" />
          </div>
        </q-tab-panel>

        <!-- ═══════════════ TAB: JSON PREVIEW ═══════════════ -->
        <q-tab-panel name="json">
          <div class="json-head">
            <span class="mono-tag">
              Akan diekspor sebagai:
              <b>{{ exportFilename }}</b>
            </span>
            <q-btn dense flat size="sm" icon="content_copy" label="Copy" @click="copyJson" />
          </div>
          <q-input :model-value="jsonOutput" type="textarea" outlined autogrow readonly :input-style="{
            minHeight: '420px',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '0.72rem',
          }" />
          <div class="editor-actions q-mt-md">
            <q-btn class="btn-primary-tech" unelevated icon="download" :label="`Download ${exportFilename}`"
              @click="downloadJson" />
            <q-btn class="btn-ghost-tech" outline icon="upload_file" label="Import JSON" @click="triggerImport" />
            <input ref="fileInputRef" type="file" accept="application/json" style="display: none"
              @change="handleImportFile" />
          </div>
        </q-tab-panel>

        <!-- ═══════════════ TAB: VALIDASI ═══════════════ -->
        <q-tab-panel name="validate">
          <div class="validate-actions">
            <q-btn class="btn-primary-tech" unelevated icon="check_circle" label="Validasi Sekarang"
              @click="runValidation" />
          </div>
          <div v-if="validation.length === 0" class="validate-empty">
            Klik "Validasi Sekarang" untuk memeriksa konten subject
            <b>{{ activeSubject?.judul }}</b>.
          </div>
          <div v-else class="validate-list">
            <div v-for="(v, i) in validation" :key="i" class="validate-row" :class="`validate-row--${v.level}`">
              <q-icon :name="iconFor(v.level)" size="16px" />
              <span>{{ v.message }}</span>
            </div>
          </div>
        </q-tab-panel>

      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import contentRepo from '../repositories/contentRepository'
import { validateContent } from '../repositories/contentValidator'
import LEARNING_CONFIG from '../config/learning.js'
import { useAuth } from '../composables/useAuth'
import { useSubject } from '../composables/useSubject'
import { removeMediaFromContent } from '../composables/useMediaLibrary'

import ModuleListSidebar from '../components/builder/ModuleListSidebar.vue'
import ModuleMetaForm from '../components/builder/ModuleMetaForm.vue'
import SectionListEditor from '../components/builder/SectionListEditor.vue'
import QuestionListEditor from '../components/builder/QuestionListEditor.vue'
import FinalTestEditor from '../components/builder/FinalTestEditor.vue'
import LivePreview from '../components/builder/LivePreview.vue'
import MediaManager from '../components/builder/MediaManager.vue'

const $q = useQuasar()
const { logout } = useAuth()
const { subjects: allSubjects } = useSubject()

// ═══════════════════════════════════════════════════════════
// Subject selection
// ═══════════════════════════════════════════════════════════
const ACTIVE_SUBJECT_KEY = 'content-builder-subject'

const selectedSubjectId = ref(
  (() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SUBJECT_KEY)
      if (stored && allSubjects.value.some((s) => s.id === stored)) return stored
    } catch { /* noop */ }
    return 'ppkn'
  })()
)

const loading = ref(false)

const subjects = computed(() => allSubjects.value)

const activeSubject = computed(() =>
  subjects.value.find((s) => s.id === selectedSubjectId.value) || null
)

const exportFilename = computed(() => activeSubject.value?.file || 'materi.json')

function subjectStats(subjectId) {
  return contentRepo.getSubjectStats(subjectId)
}

// ═══════════════════════════════════════════════════════════
// Working content (per subject)
// ═══════════════════════════════════════════════════════════
const workingContent = reactive({
  contentVersion: '2.1.0',
  updatedAt: new Date().toISOString().slice(0, 10),
  subjectId: 'ppkn',
  modules: [],
  finalTest: null,
})

const tab = ref('form')
const activeModuleIndex = ref(0)
const pastedText = ref('')
const validation = ref([])
const fileInputRef = ref(null)

// ═══════════════════════════════════════════════════════════
// Computed
// ═══════════════════════════════════════════════════════════
const activeModule = computed(() => workingContent.modules[activeModuleIndex.value] || null)

const jsonOutput = computed(() => {
  const clean = stripInternalFields(workingContent)
  return JSON.stringify(clean, null, 2)
})

const effectiveFinalTest = computed(() => {
  if (workingContent.finalTest) return workingContent.finalTest
  return {
    id: 'final-test',
    judul: 'Final Test',
    passingScore: LEARNING_CONFIG.passingScore,
    questions: [],
  }
})

// ═══════════════════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════════════════
onMounted(() => loadFromRepository())

// ═══════════════════════════════════════════════════════════
// Load content per subject
// ═══════════════════════════════════════════════════════════
async function loadFromRepository() {
  loading.value = true
  try {
    // Gunakan repo method yang load raw content per subject
    const raw = contentRepo.getRawContent(selectedSubjectId.value)

    if (!raw) {
      // Subject kosong / belum ada file
      workingContent.contentVersion = '1.0.0'
      workingContent.updatedAt = new Date().toISOString().slice(0, 10)
      workingContent.subjectId = selectedSubjectId.value
      workingContent.modules.splice(0, workingContent.modules.length)
      workingContent.finalTest = null
      activeModuleIndex.value = 0
      return
    }

    applyContent(raw)
  } catch (e) {
    console.error('[ContentBuilder] Gagal load content:', e)
    $q.notify({
      type: 'negative',
      message: `Gagal memuat konten: ${e.message}`,
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

function applyContent(content) {
  workingContent.contentVersion = content.contentVersion || '1.0.0'
  workingContent.updatedAt = content.updatedAt || new Date().toISOString().slice(0, 10)
  workingContent.subjectId = selectedSubjectId.value
  workingContent.modules.splice(0, workingContent.modules.length, ...(content.modules || []))
  workingContent.finalTest = content.finalTest || null
  activeModuleIndex.value = 0
}

function selectSubject(subjectId) {
  if (subjectId === selectedSubjectId.value) return

  const subject = subjects.value.find((s) => s.id === subjectId)
  if (!subject) return

  // Warn jika ada perubahan belum disimpan? (Untuk sekarang langsung switch)
  selectedSubjectId.value = subjectId
  try {
    localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectId)
  } catch { /* noop */ }

  // Reset tab ke form
  tab.value = 'form'

  // Load konten subject baru
  loadFromRepository()

  $q.notify({
    type: 'info',
    icon: subject.icon,
    message: `Beralih ke ${subject.judul}`,
    position: 'top',
    timeout: 1500,
  })
}

// ═══════════════════════════════════════════════════════════
// Module CRUD
// ═══════════════════════════════════════════════════════════
function addModule() {
  const subjectId = selectedSubjectId.value
  const prefix = subjectId === 'ppkn' ? 'module' : subjectId

  // Cari nomor urut berikutnya dengan scan ID existing
  const existingNums = workingContent.modules
    .map((m) => {
      const match = new RegExp(`^${prefix}-(\\d+)$`).exec(m.id || '')
      return match ? parseInt(match[1], 10) : 0
    })
  const nextNum = Math.max(0, ...existingNums) + 1
  const padded = String(nextNum).padStart(2, '0')

  const newModule = {
    id: `${prefix}-${padded}`,
    urutan: workingContent.modules.length + 1,
    judul: `Modul ${nextNum} Baru`,
    judulShort: `Modul ${nextNum}`,
    deskripsi: '',
    tujuanPembelajaran: [],
    passingScore: LEARNING_CONFIG.passingScore,
    sections: [],
    freeTest: { id: `free-${prefix}-${padded}`, questions: [] },
    postTest: {
      id: `post-${prefix}-${padded}`,
      passingScore: LEARNING_CONFIG.passingScore,
      questions: [],
    },
    finalQuestionIds: [],
  }
  workingContent.modules.push(newModule)
  activeModuleIndex.value = workingContent.modules.length - 1
}

function deleteModule(index) {
  const mod = workingContent.modules[index]
  $q.dialog({
    title: 'Hapus Modul',
    message: `Yakin menghapus "${mod.judul}"? Tindakan ini tidak dapat dibatalkan.`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(() => {
    workingContent.modules.splice(index, 1)
    activeModuleIndex.value = Math.max(0, Math.min(activeModuleIndex.value, workingContent.modules.length - 1))
  })
}

function updateModule(key, value) {
  if (!activeModule.value) return
  activeModule.value[key] = value
}

function reorderModule({ from, to }) {
  if (from === to || from == null || to == null) return
  const arr = workingContent.modules
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
  arr.forEach((mod, i) => { mod.urutan = i + 1 })
  const movedId = moved.id
  const newIndex = arr.findIndex((m) => m.id === movedId)
  if (newIndex >= 0) activeModuleIndex.value = newIndex
}

// ═══════════════════════════════════════════════════════════
// Section CRUD
// ═══════════════════════════════════════════════════════════
function addSection() {
  if (!activeModule.value) return
  const mod = activeModule.value
  const seq = (mod.sections?.length || 0) + 1
  const modNum = String(mod.urutan).padStart(2, '0')
  mod.sections = mod.sections || []
  mod.sections.push({
    id: `lesson-${modNum}-${String(seq).padStart(2, '0')}`,
    judul: `Section ${seq} Baru`,
    konten: [{ type: 'paragraph', text: '' }],
    poinPenting: [],
    kataKunci: [],
  })
}

function updateSection(index, payload) {
  if (!activeModule.value?.sections) return
  const sec = activeModule.value.sections[index]
  if (!sec) return
  if (payload.key) sec[payload.key] = payload.value
  else Object.assign(sec, payload)
}

function deleteSection(index) {
  if (!activeModule.value?.sections) return
  $q.dialog({
    title: 'Hapus Section',
    message: 'Yakin menghapus section ini?',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
  }).onOk(() => {
    activeModule.value.sections.splice(index, 1)
  })
}

function moveSection(index, direction) {
  const arr = activeModule.value?.sections
  if (!arr) return
  const j = index + direction
  if (j < 0 || j >= arr.length) return
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
}

function reorderSection({ from, to }) {
  const arr = activeModule.value?.sections
  if (!arr) return
  if (from === to || from == null || to == null) return
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
}

// ═══════════════════════════════════════════════════════════
// Question CRUD
// ═══════════════════════════════════════════════════════════
function addFreeQuestion() { addQuestion('freeTest', 'ft') }
function addPostQuestion() { addQuestion('postTest', 'pt') }

function addQuestion(testKey, prefix) {
  const mod = activeModule.value
  if (!mod) return
  const modNum = String(mod.urutan).padStart(2, '0')
  if (!mod[testKey]) mod[testKey] = { questions: [] }
  if (!Array.isArray(mod[testKey].questions)) mod[testKey].questions = []
  const seq = mod[testKey].questions.length + 1
  mod[testKey].questions.push({
    id: `q-${prefix}-${modNum}-${String(seq).padStart(2, '0')}`,
    pertanyaan: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctOptionId: 'A',
    pembahasan: '',
    moduleId: mod.id,
    concept: '',
    difficulty: 'medium',
  })
}

function updateQuestion(testKey, index, payload) {
  const mod = activeModule.value
  if (!mod?.[testKey]?.questions) return
  const q = mod[testKey].questions[index]
  if (!q) return
  if (payload.key) q[payload.key] = payload.value
  else Object.assign(q, payload)
}

function deleteQuestion(testKey, index) {
  const mod = activeModule.value
  if (!mod?.[testKey]?.questions) return
  $q.dialog({
    title: 'Hapus Soal',
    message: 'Yakin menghapus soal ini?',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
  }).onOk(() => {
    mod[testKey].questions.splice(index, 1)
  })
}

function moveQuestion(testKey, index, direction) {
  const arr = activeModule.value?.[testKey]?.questions
  if (!arr) return
  const j = index + direction
  if (j < 0 || j >= arr.length) return
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
}

function reorderQuestion(testKey, from, to) {
  const arr = activeModule.value?.[testKey]?.questions
  if (!arr) return
  if (from === to || from == null || to == null) return
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
}

// ═══════════════════════════════════════════════════════════
// Final Test CRUD
// ═══════════════════════════════════════════════════════════
function ensureFinalTest() {
  if (!workingContent.finalTest) {
    workingContent.finalTest = {
      id: `final-test-${selectedSubjectId.value}`,
      judul: `Final Test — ${activeSubject.value?.judul || ''}`,
      passingScore: LEARNING_CONFIG.passingScore,
      questions: [],
    }
  }
  return workingContent.finalTest
}

function updateFinalTestMeta({ key, value }) {
  ensureFinalTest()
  workingContent.finalTest[key] = value
}

function addFinalQuestion() {
  const ft = ensureFinalTest()
  const seq = ft.questions.length + 1
  const defaultModuleId = workingContent.modules[0]?.id || ''
  ft.questions.push({
    id: `q-f-${String(seq).padStart(3, '0')}`,
    moduleId: defaultModuleId,
    concept: '',
    difficulty: 'medium',
    pertanyaan: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctOptionId: 'A',
    pembahasan: '',
  })
}

function updateFinalQuestion(index, payload) {
  const ft = ensureFinalTest()
  const q = ft.questions[index]
  if (!q) return
  if (payload.key) q[payload.key] = payload.value
  else Object.assign(q, payload)
}

function deleteFinalQuestion(index) {
  const ft = ensureFinalTest()
  $q.dialog({
    title: 'Hapus Soal Final',
    message: 'Yakin menghapus soal final ini?',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
  }).onOk(() => {
    ft.questions.splice(index, 1)
  })
}

function moveFinalQuestion(index, direction) {
  const ft = ensureFinalTest()
  const arr = ft.questions
  const j = index + direction
  if (j < 0 || j >= arr.length) return
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
}

function reorderFinalQuestion({ from, to }) {
  const ft = ensureFinalTest()
  if (from === to || from == null || to == null) return
  const [moved] = ft.questions.splice(from, 1)
  ft.questions.splice(to, 0, moved)
}

// ═══════════════════════════════════════════════════════════
// Media Manager
// ═══════════════════════════════════════════════════════════
function handleDeleteMedia({ src }) {
  const { removed } = removeMediaFromContent(workingContent, src)
  $q.notify({
    type: 'positive',
    message: `Media dihapus dari ${removed} tempat.`,
    position: 'top',
  })
}

// ═══════════════════════════════════════════════════════════
// Paste Text (Mode A)
// ═══════════════════════════════════════════════════════════
function loadSample() {
  pastedText.value = `MODULE_ID: module-06
JUDUL: Contoh Modul Baru
DESKRIPSI: Modul contoh hasil Content Builder.
KKM: 80

TUJUAN:
Memahami konsep dasar modul ini.
Mengidentifikasi contoh penerapan.

SECTION: lesson-06-01
JUDUL_SECTION: A. Subbab Pertama
KONTEN:
Ini paragraf pertama materi.
Ini paragraf kedua materi.
POIN:
Poin penting pertama.
Poin penting kedua.
KATA_KUNCI:
kata1, kata2, kata3

SOAL_FREE: q-ft-06-01
PERTANYAAN: Contoh pertanyaan free test?
A. Pilihan pertama
B. Pilihan kedua
C. Pilihan ketiga
D. Pilihan keempat
JAWABAN: B
PEMBAHASAN: Karena B adalah jawaban yang tepat.

SOAL_POST: q-pt-06-01
PERTANYAAN: Contoh pertanyaan post test?
A. Pilihan pertama
B. Pilihan kedua
C. Pilihan ketiga
D. Pilihan keempat
JAWABAN: A
PEMBAHASAN: Karena A adalah jawaban yang tepat.`
}

function parsePasted() {
  validation.value = []
  try {
    const mod = parseModuleText(pastedText.value)
    if (!mod) throw new Error('Tidak ada MODULE_ID yang terdeteksi.')

    workingContent.modules.push(mod)
    activeModuleIndex.value = workingContent.modules.length - 1

    try {
      validateContent({
        contentVersion: workingContent.contentVersion,
        modules: workingContent.modules,
        finalTest: workingContent.finalTest,
      })
      $q.notify({ type: 'positive', message: `Modul "${mod.judul}" berhasil ditambahkan.`, position: 'top' })
    } catch (err) {
      validation.value.push({ level: 'error', message: err.message })
      $q.notify({ type: 'warning', message: 'Modul ditambahkan, tetapi ada masalah validasi.', position: 'top' })
    }

    tab.value = 'form'
    pastedText.value = ''
  } catch (err) {
    validation.value = [{ level: 'error', message: err.message }]
    tab.value = 'validate'
  }
}

function parseModuleText(text) {
  // ... (fungsi parse sama seperti sebelumnya) ...
  // Untuk brevity, saya asumsikan Anda sudah punya fungsi ini dari iterasi sebelumnya.
  // Copy persis dari versi lama.
  const lines = text.split('\n')
  const mod = {
    id: null, urutan: null, judul: null, judulShort: '', deskripsi: '',
    tujuanPembelajaran: [], passingScore: LEARNING_CONFIG.passingScore,
    sections: [],
    freeTest: { id: '', questions: [] },
    postTest: { id: '', passingScore: LEARNING_CONFIG.passingScore, questions: [] },
    finalQuestionIds: [],
  }
  let currentSection = null
  let currentQuestion = null
  let currentTarget = null
  let buffer = []

  const flushBuffer = () => {
    if (!buffer.length) return
    const joined = buffer.join('\n').trim()
    buffer = []
    if (!joined) return
    if (currentTarget === 'konten' && currentSection) currentSection.konten.push(joined)
    else if (currentTarget === 'poin' && currentSection) {
      joined.split('\n').forEach((l) => l.trim() && currentSection.poinPenting.push(l.trim()))
    } else if (currentTarget === 'kataKunci' && currentSection) {
      joined.split(',').map((s) => s.trim()).filter(Boolean).forEach((k) => currentSection.kataKunci.push(k))
    } else if (currentTarget === 'tujuan') {
      joined.split('\n').forEach((l) => l.trim() && mod.tujuanPembelajaran.push(l.trim()))
    } else if (currentTarget === 'pembahasan' && currentQuestion) {
      currentQuestion.pembahasan = joined
    }
  }

  const flushSection = () => {
    flushBuffer()
    if (currentSection) { mod.sections.push(currentSection); currentSection = null }
  }

  const flushQuestion = () => {
    flushBuffer()
    if (currentQuestion) {
      if (currentQuestion._target === 'free') mod.freeTest.questions.push(currentQuestion.q)
      else mod.postTest.questions.push(currentQuestion.q)
      currentQuestion = null
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    const m = /^([A-Z_]+):\s*(.*)$/.exec(line)
    if (m) {
      const [, key, val] = m
      switch (key) {
        case 'MODULE_ID':
          flushQuestion(); flushSection()
          mod.id = val
          mod.urutan = parseInt(val.replace(/\D/g, ''), 10) || 99
          mod.judulShort = `Modul ${mod.urutan}`
          mod.freeTest.id = `free-${val}`
          mod.postTest.id = `post-${val}`
          break
        case 'JUDUL':
          if (!currentSection && !currentQuestion) mod.judul = val
          break
        case 'DESKRIPSI': mod.deskripsi = val; break
        case 'KKM':
          mod.passingScore = Number(val) || 80
          mod.postTest.passingScore = mod.passingScore
          break
        case 'TUJUAN': flushQuestion(); flushSection(); currentTarget = 'tujuan'; break
        case 'SECTION':
          flushQuestion(); flushSection()
          currentSection = { id: val, judul: '', konten: [], poinPenting: [], kataKunci: [] }
          break
        case 'JUDUL_SECTION':
          if (currentSection) currentSection.judul = val
          break
        case 'KONTEN': currentTarget = 'konten'; break
        case 'POIN': currentTarget = 'poin'; break
        case 'KATA_KUNCI': currentTarget = 'kataKunci'; break
        case 'SOAL_FREE':
          flushQuestion(); flushSection()
          currentQuestion = {
            _target: 'free',
            q: { id: val, pertanyaan: '', options: [], correctOptionId: '', pembahasan: '', moduleId: mod.id, concept: '', difficulty: 'medium' },
          }
          break
        case 'SOAL_POST':
          flushQuestion(); flushSection()
          currentQuestion = {
            _target: 'post',
            q: { id: val, pertanyaan: '', options: [], correctOptionId: '', pembahasan: '', moduleId: mod.id, concept: '', difficulty: 'medium' },
          }
          break
        case 'PERTANYAAN':
          if (currentQuestion) currentQuestion.q.pertanyaan = val
          break
        case 'JAWABAN':
          if (currentQuestion) currentQuestion.q.correctOptionId = val
          break
        case 'PEMBAHASAN': currentTarget = 'pembahasan'; break
        default:
          if (/^[A-F]$/.test(key) && currentQuestion) {
            currentQuestion.q.options.push({ id: key, text: val })
          }
      }
      continue
    }

    if (currentQuestion && /^[A-F]\.\s+/.test(line)) {
      const optId = line[0]
      const optText = line.slice(2).trim()
      currentQuestion.q.options.push({ id: optId, text: optText })
      continue
    }
    if (line) buffer.push(line)
  }

  flushQuestion(); flushSection()

  if (!mod.id) throw new Error('MODULE_ID wajib diisi.')
  if (!mod.judul) throw new Error('JUDUL wajib diisi.')
  if (!mod.sections.length) throw new Error('Minimal 1 section harus ada.')
  return mod
}

// ═══════════════════════════════════════════════════════════
// JSON Export / Import
// ═══════════════════════════════════════════════════════════
function stripInternalFields(content) {
  const clone = JSON.parse(JSON.stringify(content))

  function omitId(obj) {
    if (typeof obj !== 'object' || obj === null) return obj
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => key !== '_id')
    )
  }

  function cleanBlocks(arr) {
    if (!Array.isArray(arr)) return arr
    return arr.map(omitId)
  }

  if (Array.isArray(clone.modules)) {
    for (const mod of clone.modules) {
      if (Array.isArray(mod.sections)) {
        for (const sec of mod.sections) {
          if (Array.isArray(sec.konten)) {
            sec.konten = cleanBlocks(sec.konten)
          }
        }
      }
    }
  }
  return clone
}

function downloadJson() {
  const blob = new Blob([jsonOutput.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFilename.value
  a.click()
  URL.revokeObjectURL(url)
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonOutput.value)
    $q.notify({ type: 'positive', message: 'JSON tercopy ke clipboard.' })
  } catch {
    $q.notify({ type: 'negative', message: 'Gagal copy.' })
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result)
      applyContent(parsed)
      $q.notify({ type: 'positive', message: 'JSON berhasil diimpor.', position: 'top' })
      tab.value = 'form'
    } catch (err) {
      $q.notify({ type: 'negative', message: `Import gagal: ${err.message}`, position: 'top' })
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// ═══════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════
function runValidation() {
  validation.value = []
  try {
    validateContent({
      contentVersion: workingContent.contentVersion,
      modules: workingContent.modules,
      finalTest: workingContent.finalTest,
    })
    validation.value.push({ level: 'info', message: 'Konten valid. Tidak ada masalah ditemukan.' })
  } catch (err) {
    validation.value.push({ level: 'error', message: err.message })
  }
}

function iconFor(level) {
  return { info: 'check_circle', error: 'cancel', warning: 'warning' }[level] || 'info'
}

// ═══════════════════════════════════════════════════════════
// Reset & Logout
// ═══════════════════════════════════════════════════════════
function confirmResetWorking() {
  $q.dialog({
    title: 'Reset ke Konten Asli',
    message: `Semua perubahan yang belum di-export untuk subject "${activeSubject.value?.judul}" akan hilang. Yakin?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Reset', color: 'negative', unelevated: true },
  }).onOk(() => {
    loadFromRepository()
    $q.notify({ type: 'info', message: 'Konten direset ke versi asli.', position: 'top' })
  })
}

function confirmLogout() {
  $q.dialog({
    title: 'Logout',
    message: 'Keluar dari content builder?',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Logout', color: 'negative', unelevated: true },
  }).onOk(() => {
    logout()
    window.location.replace('/')
  })
}
</script>

<style scoped>
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.builder-page {
  background: var(--paper, #F4F6F8);
  min-height: 100vh;
}

.builder-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}

.builder-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.builder-version {
  opacity: 0.7;
}

.builder-title {
  font-size: 1.6rem;
  margin: 0 0 6px;
  color: var(--navy-900, #0B1F33);
}

.builder-subtitle {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  margin-bottom: 20px;
}

.builder-tabs {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

/* Form editor layout */
.form-editor {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  align-items: start;
}

.editor-sidebar {
  position: sticky;
  top: 16px;
}

.editor-panel {
  min-width: 0;
}

.editor-card {
  padding: 16px;
}

.editor-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Empty state */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  background: #fff;
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 8px;
}

.empty-state p {
  color: var(--ink-500, #5B6B7C);
  margin: 12px 0;
}

/* JSON preview */
.json-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

/* Format hint */
.format-hint {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

.format-pre {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 12px 16px;
  margin: 0;
  color: var(--ink-900, #1B2733);
}

/* Validation */
.validate-actions {
  margin-bottom: 14px;
}

.validate-empty {
  padding: 24px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  background: #fff;
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
}

.validate-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.validate-row--info {
  background: #E8F7EE;
  color: #15663A;
}

.validate-row--error {
  background: var(--red-100, #F1DCDB);
  color: var(--red-500, #A6403F);
}

.validate-row--warning {
  background: #FFF4D6;
  color: #8A6A14;
}

/* Buttons */
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

/* Responsive */
@media (max-width: 900px) {
  .form-editor {
    grid-template-columns: 1fr;
  }

  .editor-sidebar {
    position: static;
  }
}

.syntax-help {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

.syntax-content {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.syntax-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 14px;
  align-items: center;
  font-size: 0.85rem;
}

.syntax-row code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.78rem;
  background: var(--paper, #F4F6F8);
  padding: 2px 8px;
  border-radius: 3px;
  color: var(--red-500, #A6403F);
  border: 1px solid var(--border, #D8DEE5);
}

.syntax-section {
  margin-bottom: 14px;
}

.syntax-section:last-child {
  margin-bottom: 0;
}

.syntax-row .ok {
  color: #15663A;
  font-weight: 600;
}

.syntax-row .no {
  color: #A6403F;
  font-weight: 600;
}

.syntax-row .warn {
  color: #8A6A14;
  font-weight: 600;
}

/* ... style existing tetap ... */

/* ══════════ SUBJECT PICKER ══════════ */
.subject-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-picker-label {
  font-size: 0.78rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 600;
}

.subject-dropdown {
  color: var(--navy-700, #16324F);
  border-color: var(--border, #D8DEE5);
}

.subject-item--active {
  background: var(--gold-100, #F3E7C4);
}

.builder-title-subject {
  font-size: 0.9rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 400;
  margin-left: 4px;
}
</style>
