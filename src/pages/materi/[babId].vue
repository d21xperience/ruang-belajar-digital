<template>
  <q-page class="materi-page">
    <!-- ═══════════════ GUARD: MODUL TERKUNCI ═══════════════ -->
    <div v-if="isLocked" class="locked-wrap">
      <q-card flat bordered class="locked-card">
        <q-icon name="lock" size="48px" class="locked-icon" />
        <h2 class="locked-title">Modul Terkunci</h2>
        <p class="locked-desc">
          Selesaikan modul sebelumnya dengan nilai ≥ KKM
          <b>{{ passingScore }}</b> untuk membuka modul ini.
        </p>
        <q-btn class="btn-primary-tech" unelevated label="Kembali ke Beranda" icon="home" @click="router.push('/')" />
      </q-card>
    </div>

    <!-- ═══════════════ KONTEN UTAMA ═══════════════ -->
    <template v-else>
      <!-- Drawer navigasi subbab (hanya saat stage materi) -->
      <q-drawer v-if="stage === 'materi' && activeSection" v-model="drawer" show-if-above :breakpoint="1023" side="left"
        bordered class="bab-drawer" data-tour-materi="content">
        <div class="drawer-head">
          <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" class="q-mb-sm full-width drawer-back-btn"
            @click="router.push('/')" />
          <div class="mono-tag drawer-bab-title">
            {{ moduleData?.judulShort || moduleData?.judul }}
          </div>
          <q-linear-progress :value="persentaseProgres / 100" class="q-mt-sm drawer-progress" size="8px" rounded />
          <div class="drawer-progress-caption">{{ persentaseProgres }}% Selesai</div>
        </div>

        <q-list separator>
          <q-item v-for="(sec, index) in moduleData?.sections || []" :key="sec.id" clickable
            :active="activeSectionId === sec.id" active-class="drawer-item--active" :disable="isSectionLocked(index)"
            @click="activeSectionId = sec.id">
            <q-item-section avatar>
              <q-icon :name="ikonSection(statusSection(sec.id, index))"
                :class="`icon-status-${statusSection(sec.id, index)}`" />
            </q-item-section>
            <q-item-section>{{ sec.judul }}</q-item-section>
          </q-item>
        </q-list>
      </q-drawer>

      <!-- Konten utama -->
      <div class="materi-container">
        <!-- Topbar mobile (hanya materi) -->
        <!-- <div v-if="stage === 'materi' && activeSection" class="mobile-topbar lt-md" data-tour-materi="content">
          <q-btn flat dense round icon="menu" aria-label="Buka daftar bagian" @click="drawer = !drawer" />
          <span class="mono-tag">{{ moduleData?.judulShort || moduleData?.judul }}</span>
        </div> -->

        <!-- STEPPER -->
        <div data-tour-materi="stepper">
          <LearningStepper :steps="stepperSteps" />
        </div>

        <!-- ═══════════════════════════════════════════════════════════
     FAB: Buka Daftar Bagian (mobile only)
     Selalu terlihat di kanan bawah layar saat scroll
     ═══════════════════════════════════════════════════════════ -->
        <q-btn v-if="stage === 'materi'" class="materi-fab lt-md" round unelevated color="primary" text-color="white"
          icon="menu" size="md" aria-label="Buka daftar bagian" @click="drawer = !drawer">
          <q-badge v-if="moduleData?.sections?.length" color="gold" text-color="navy-900" floating rounded>
            {{ completedSections.length }}/{{ moduleData.sections.length }}
          </q-badge>
          <q-tooltip anchor="center left" self="center right">
            Daftar bagian materi
          </q-tooltip>
        </q-btn>



        <!-- ─────── FREE TEST INTRO ─────── -->
        <q-card v-if="stage === 'free-intro'" flat bordered class="stage-card">
          <div class="mono-tag">TAHAP 1 — DIAGNOSTIK</div>
          <h2 class="stage-title">Free Test</h2>
          <p class="stage-desc">
            Free Test mengukur pengetahuan awal Anda. Hasilnya
            <b>tidak menentukan kelulusan</b> dan <b>tidak mengunci materi</b>.
            Anda dapat mengulang kapan saja.
          </p>
          <p class="stage-desc">
            Jumlah soal: <b>{{ freeQuiz.totalQuestions.value }}</b>
          </p>
          <div class="stage-actions">
            <q-btn class="btn-primary-tech" unelevated label="Mulai Free Test" icon="play_arrow"
              @click="startFreeTest" />
            <q-btn class="btn-ghost-tech" outline label="Lewati ke Materi" icon="menu_book" @click="skipToMateri" />
          </div>
        </q-card>

        <!-- ─────── FREE TEST QUESTIONS ─────── -->
        <q-card v-else-if="stage === 'free'" flat bordered class="stage-card">
          <div class="quiz-head">
            <span class="mono-tag">
              SOAL {{ freeQuiz.currentIndex.value + 1 }} / {{ freeQuiz.totalQuestions.value }}
            </span>
            <span class="mono-tag">{{ freeQuiz.answeredCount.value }} terjawab</span>
          </div>

          <div class="dot-nav">
            <button v-for="(q, i) in freeQuiz.questions.value" :key="q.id" type="button" class="quiz-dot" :class="{
              'quiz-dot--current': i === freeQuiz.currentIndex.value,
              'quiz-dot--answered': freeQuiz.answers.value[q.id] !== undefined,
            }" :aria-label="`Ke soal ${i + 1}`" @click="freeQuiz.goto(i)">{{ i + 1 }}</button>
          </div>

          <QuizQuestion v-if="freeQuiz.currentQuestion.value" :question="freeQuiz.currentQuestion.value"
            :index="freeQuiz.currentIndex.value" :total="freeQuiz.totalQuestions.value"
            :selected-option-id="freeQuiz.answers.value[freeQuiz.currentQuestion.value.id] || null"
            @select="(optId) => freeQuiz.selectAnswer(freeQuiz.currentQuestion.value.id, optId)" />

          <div class="quiz-nav">
            <q-btn class="btn-ghost-tech" outline label="Sebelumnya" icon="chevron_left"
              :disable="freeQuiz.currentIndex.value === 0" @click="freeQuiz.prev" />
            <q-btn v-if="freeQuiz.currentIndex.value < freeQuiz.totalQuestions.value - 1" class="btn-primary-tech"
              unelevated label="Berikutnya" icon-right="chevron_right" @click="freeQuiz.next" />
            <q-btn v-else class="btn-primary-tech" unelevated label="Selesai & Lihat Hasil" icon-right="send"
              @click="submitFreeTest" />
          </div>
        </q-card>

        <!-- ─────── FREE RESULT ─────── -->
        <QuizResult v-else-if="stage === 'free-result'" :result="lastResult">
          <template #actions>
            <q-btn class="btn-primary-tech" unelevated label="Lanjut ke Materi" icon-right="chevron_right"
              @click="goToMateriFromFree" />
            <q-btn class="btn-ghost-tech" outline label="Ulangi Free Test" icon="replay" @click="startFreeTest" />
          </template>
        </QuizResult>

        <!-- ─────── MATERI (BACA) ─────── -->
        <q-card v-else-if="stage === 'materi' && activeSection" flat bordered class="stage-card materi-card">
          <div class="materi-baca">
            <div class="mono-tag">
              BAGIAN {{ activeSectionIndex + 1 }} DARI {{ moduleData.sections.length }}
            </div>
            <h2 class="materi-title">{{ activeSection.judul }}</h2>

            <div class="materi-body">
              <!-- <p v-for="(par, i) in kontenParagraf" :key="i">{{ par }}</p> -->
              <MateriRenderer :blocks="normalizedKonten" />
            </div>

            <div v-if="activeSection.poinPenting?.length" class="materi-callout">
              <div class="mono-tag callout-label">POIN PENTING</div>
              <ul>
                <li v-for="(poin, i) in activeSection.poinPenting" :key="i">{{ poin }}</li>
              </ul>
            </div>

            <div v-if="activeSection.kataKunci?.length" class="materi-keywords">
              <div class="mono-tag">KATA KUNCI</div>
              <div class="keyword-list">
                <span v-for="(kw, i) in activeSection.kataKunci" :key="i" class="keyword-tag">{{ kw }}</span>
              </div>
            </div>

            <div class="materi-nav" data-tour-materi="nav">
              <div class="materi-nav-seconday">
                <q-btn class="btn-ghost-tech" outline label="Sebelumnya" icon="chevron_left"
                  :disable="activeSectionIndex === 0" @click="prevSection" />
                <q-btn-dropdown class="btn-ghost-tech" outline icon="picture_as_pdf"
                  :label="progress ? progressLabel : 'PDF'" data-tour-materi="pdf-btn" :loading="exporting">
                  <q-list>
                    <q-item clickable v-close-popup :disable="exporting" @click="downloadActiveSectionPdf">
                      <q-item-section avatar><q-icon name="article" /></q-item-section>
                      <q-item-section>
                        <q-item-label>Bagian Ini Saja</q-item-label>
                        <q-item-label caption>{{ activeSection?.judul }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup :disable="exporting" @click="downloadWholeModulePdf">
                      <q-item-section avatar><q-icon name="menu_book" /></q-item-section>
                      <q-item-section>
                        <q-item-label>Seluruh Modul</q-item-label>
                        <q-item-label caption>{{ moduleData?.judul }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>


              </div>



              <q-btn class="btn-primary-tech" unelevated
                :label="isLastSection ? 'Lanjut ke Post Test' : 'Sudah Paham, Lanjutkan'" icon-right="chevron_right"
                @click="markSectionDone" />
            </div>
          </div>
        </q-card>

        <!-- ─────── POST TEST INTRO ─────── -->
        <q-card v-else-if="stage === 'post-intro'" flat bordered class="stage-card">
          <div class="mono-tag">TAHAP 3 — MASTERY CHECK</div>
          <h2 class="stage-title">Post Test</h2>
          <p class="stage-desc">
            Post Test menentukan kelulusan modul. Anda harus mencapai nilai minimal
            <b>KKM {{ passingScore }}</b> untuk membuka modul berikutnya.
          </p>
          <p class="stage-desc">
            Jumlah soal: <b>{{ postQuiz.totalQuestions.value }}</b>
          </p>

          <div v-if="moduleProgress && moduleProgress.postTestAttempts > 0" class="post-history">
            <div class="mono-tag">RIWAYAT</div>
            <div>
              Percobaan: <b>{{ moduleProgress.postTestAttempts }}</b> ·
              Skor terbaik: <b>{{ moduleProgress.postTestBestScore }}</b>
            </div>
          </div>

          <div class="stage-actions">
            <q-btn class="btn-primary-tech" unelevated label="Mulai Post Test" icon="assignment"
              @click="startPostTest" />
            <q-btn class="btn-ghost-tech" outline label="Review Materi Lagi" icon="menu_book" @click="reviewMateri" />
          </div>
        </q-card>

        <!-- ─────── POST TEST QUESTIONS ─────── -->
        <q-card v-else-if="stage === 'post'" flat bordered class="stage-card">
          <div class="quiz-head">
            <span class="mono-tag">
              SOAL {{ postQuiz.currentIndex.value + 1 }} / {{ postQuiz.totalQuestions.value }}
            </span>
            <span class="mono-tag">{{ postQuiz.answeredCount.value }} terjawab</span>
          </div>

          <div class="dot-nav">
            <button v-for="(q, i) in postQuiz.questions.value" :key="q.id" type="button" class="quiz-dot" :class="{
              'quiz-dot--current': i === postQuiz.currentIndex.value,
              'quiz-dot--answered': postQuiz.answers.value[q.id] !== undefined,
            }" :aria-label="`Ke soal ${i + 1}`" @click="postQuiz.goto(i)">{{ i + 1 }}</button>
          </div>

          <QuizQuestion v-if="postQuiz.currentQuestion.value" :question="postQuiz.currentQuestion.value"
            :index="postQuiz.currentIndex.value" :total="postQuiz.totalQuestions.value"
            :selected-option-id="postQuiz.answers.value[postQuiz.currentQuestion.value.id] || null"
            @select="(optId) => postQuiz.selectAnswer(postQuiz.currentQuestion.value.id, optId)" />

          <div class="quiz-nav">
            <q-btn class="btn-ghost-tech" outline label="Sebelumnya" icon="chevron_left"
              :disable="postQuiz.currentIndex.value === 0" @click="postQuiz.prev" />
            <q-btn v-if="postQuiz.currentIndex.value < postQuiz.totalQuestions.value - 1" class="btn-primary-tech"
              unelevated label="Berikutnya" icon-right="chevron_right" @click="postQuiz.next" />
            <q-btn v-else class="btn-primary-tech" unelevated label="Kumpulkan" icon-right="send"
              @click="submitPostTest" />
          </div>
        </q-card>

        <!-- ─────── POST RESULT ─────── -->
        <QuizResult v-else-if="stage === 'post-result'" :result="lastResult">
          <template #actions>
            <template v-if="!lastResult.passed">
              <q-btn class="btn-primary-tech" unelevated label="Coba Lagi" icon="replay" @click="retryPost" />
              <q-btn class="btn-ghost-tech" outline label="Review Materi" icon="menu_book" @click="reviewMateri" />
            </template>
            <template v-else>
              <q-btn v-if="nextModule" class="btn-primary-tech" unelevated
                :label="`Lanjut ke ${nextModule.judulShort || nextModule.judul}`" icon-right="chevron_right"
                @click="goNextModule" />
              <q-btn v-else class="btn-primary-tech" unelevated label="Ke Final Test" icon-right="flag"
                @click="router.push('/final-test')" />
              <q-btn class="btn-ghost-tech" outline label="Kembali ke Beranda" icon="home" @click="router.push('/')" />
            </template>
          </template>
        </QuizResult>

        <!-- ─────── FALLBACK ─────── -->
        <q-card v-else flat bordered class="stage-card">
          <div class="materi-empty">
            Konten belum tersedia untuk bagian ini.
          </div>
        </q-card>
      </div>
    </template>


    <!-- ═══════════════════════════════════════════════════════════
     PDF EXPORT — Target & overlay Teleport terpisah
     ═══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="pdf-fade">
        <div v-if="pdfExportMode" ref="pdfTargetRef" class="pdf-target">
          <!-- MODE: SECTION -->
          <template v-if="pdfExportMode === 'section' && activeSection">
            <div class="pdf-header">
              <div class="pdf-brand">
                E-Modul PPKn · {{ moduleData.judulShort || moduleData.judul }}
              </div>
              <h1 class="pdf-title">{{ activeSection.judul }}</h1>
            </div>

            <MateriRenderer :blocks="normalizedKonten" />

            <div v-if="activeSection.poinPenting?.length" class="pdf-callout">
              <h3>Poin Penting</h3>
              <ul>
                <li v-for="(p, i) in activeSection.poinPenting" :key="i">{{ p }}</li>
              </ul>
            </div>

            <div v-if="activeSection.kataKunci?.length" class="pdf-keywords">
              <b>Kata Kunci:</b> {{ activeSection.kataKunci.join(', ') }}
            </div>

            <div class="pdf-footer">
              E-Modul Pendidikan Pancasila · Kelas X SMK
            </div>
          </template>

          <!-- MODE: MODULE -->
          <template v-else-if="pdfExportMode === 'module' && moduleData">
            <div class="pdf-cover">
              <div class="pdf-brand">E-Modul PPKn · Kelas X SMK</div>
              <h1 class="pdf-cover-title">{{ moduleData.judul }}</h1>
              <p class="pdf-cover-desc">{{ moduleData.deskripsi }}</p>

              <div v-if="moduleData.tujuanPembelajaran?.length" class="pdf-tujuan">
                <h3>Tujuan Pembelajaran</h3>
                <ul>
                  <li v-for="(t, i) in moduleData.tujuanPembelajaran" :key="i">{{ t }}</li>
                </ul>
              </div>
            </div>

            <div v-for="(sec, idx) in moduleData.sections" :key="sec.id" class="pdf-section">
              <h2 class="pdf-section-title">{{ idx + 1 }}. {{ sec.judul }}</h2>

              <MateriRenderer :blocks="normalizeContent(sec.konten)" />

              <div v-if="sec.poinPenting?.length" class="pdf-callout">
                <h3>Poin Penting</h3>
                <ul>
                  <li v-for="(p, i) in sec.poinPenting" :key="i">{{ p }}</li>
                </ul>
              </div>

              <div v-if="sec.kataKunci?.length" class="pdf-keywords">
                <b>Kata Kunci:</b> {{ sec.kataKunci.join(', ') }}
              </div>
            </div>

            <div class="pdf-footer">
              E-Modul Pendidikan Pancasila · Kelas X SMK
            </div>
          </template>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="pdf-fade">
        <div v-if="pdfExportMode" ref="pdfTargetRef" class="pdf-target">
          <q-spinner-dots size="48px" color="primary" />
          <div class="pdf-loading-text">Membuat PDF…</div>
          <div class="pdf-loading-sub">Mohon tunggu sebentar</div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════ Tour Overlay (materi) ══════ -->
    <TourOverlay />
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import 'katex/dist/katex.min.css'
import contentRepo from '@/repositories/contentRepository'
import LEARNING_CONFIG from '@/config/learning.js'
import { useQuiz } from '@/composables/useQuiz'
import { useLearningProgress } from '@/composables/useLearningProgress'
import QuizQuestion from '@/components/QuizQuestion.vue'
import QuizResult from '@/components/QuizResult.vue'
import LearningStepper from '@/components/LearningStepper.vue'
import MateriRenderer from '@/components/materi/MateriRenderer.vue'
import { normalizeContent } from '@/utils/contentNormalizer'
import { usePdfExport } from '@/composables/usePdfExport'
import { useOnboarding } from '../../composables/useOnboarding'
import TourOverlay from '../../components/onboarding/TourOverlay.vue'

const { maybeAutoStart } = useOnboarding()


const { exporting, exportElementToPdf } = usePdfExport()

// ─── PDF export state ───
const pdfExportMode = ref(null) // null | 'section' | 'module'
const pdfTargetRef = ref(null)


const props = defineProps({
  babId: { type: String, required: true },
})

const router = useRouter()
const $q = useQuasar()
const passingScore = LEARNING_CONFIG.passingScore

const { isUnlocked, moduleProgress, recordFreeTest, recordPostTest } =
  useLearningProgress()

// ───── Data modul ─────
const moduleData = computed(() => contentRepo.getModuleById(props.babId))
const isLocked = computed(() => !isUnlocked(props.babId))

// ───── Drawer (hanya saat stage materi) ─────
const drawer = ref(false)

// ───── State machine ─────
// 'free-intro' | 'free' | 'free-result'
// 'materi'
// 'post-intro' | 'post' | 'post-result'
const stage = ref('materi')

// ───── Subbab ─────
const activeSectionId = ref('')
const completedSections = ref([])

const activeSection = computed(
  () => moduleData.value?.sections?.find((s) => s.id === activeSectionId.value) || null
)

const activeSectionIndex = computed(
  () => moduleData.value?.sections?.findIndex((s) => s.id === activeSectionId.value) ?? -1
)

const isLastSection = computed(
  () => activeSectionIndex.value === (moduleData.value?.sections?.length ?? 0) - 1
)

const allSectionsDone = computed(() =>
  moduleData.value
    ? completedSections.value.length >= moduleData.value.sections.length
    : false
)

const persentaseProgres = computed(() => {
  if (!moduleData.value) return 0
  const total = moduleData.value.sections.length + 2 // + Free Test + Post Test
  let done = completedSections.value.length
  if (moduleProgress.value?.freeTestCompleted) done += 1
  if (moduleProgress.value?.passed) done += 1
  return Math.round((done / total) * 100)
})

// const kontenParagraf = computed(() => {
//   const konten = activeSection.value?.konten
//   if (!konten) return []
//   return Array.isArray(konten) ? konten : [konten]
// })
const normalizedKonten = computed(() => {
  return normalizeContent(activeSection.value?.konten)
})
// ───── Quiz ─────
const freeQuiz = useQuiz({
  getQuestions: () => contentRepo.getFreeTestQuestions(props.babId),
  shuffleQuestions: true,
  shuffleOptions: true,
})

const postQuiz = useQuiz({
  getQuestions: () => contentRepo.getPostTestQuestions(props.babId),
  shuffleQuestions: true,
  shuffleOptions: true,
})

const lastResult = ref(null)

// ───── Modul berikutnya ─────
const nextModule = computed(() => {
  const all = contentRepo.getAllModules()
  const idx = all.findIndex((m) => m.id === props.babId)
  return all[idx + 1] || null
})

// ───── Stepper ─────
const stepperSteps = computed(() => {
  const p = moduleProgress.value || {}
  const hasPost = (moduleData.value?.postTest?.questions?.length ?? 0) > 0
  return [
    {
      key: 'free',
      label: 'Free Test',
      status: p.freeTestCompleted
        ? 'done'
        : stage.value.startsWith('free')
          ? 'active'
          : 'available',
    },
    {
      key: 'materi',
      label: 'Materi',
      status: allSectionsDone.value
        ? 'done'
        : stage.value === 'materi'
          ? 'active'
          : 'available',
    },
    {
      key: 'post',
      label: 'Post Test',
      status: p.passed
        ? 'done'
        : stage.value.startsWith('post')
          ? 'active'
          : allSectionsDone.value && hasPost
            ? 'available'
            : 'locked',
    },
  ]
})

// ───── Inisialisasi ─────
function initFromModule() {
  if (!moduleData.value) return

  activeSectionId.value = moduleData.value.sections[0]?.id || ''
  completedSections.value = readCompletedSections()
  drawer.value = $q.screen.gt.sm

  const p = moduleProgress.value || {}
  const hasFree = (moduleData.value.freeTest?.questions?.length ?? 0) > 0
  const hasPost = (moduleData.value.postTest?.questions?.length ?? 0) > 0

  if (hasFree && !p.freeTestCompleted) {
    stage.value = 'free-intro'
  } else if (p.passed) {
    stage.value = 'materi'
  } else if (allSectionsDone.value && hasPost) {
    stage.value = 'post-intro'
  } else {
    stage.value = 'materi'
  }
}

// ═══ State untuk track apakah tour materi sudah dijadwalkan ═══
let cancelTourWait = null

onMounted(() => {
  initFromModule()

  // ═══════════════════════════════════════════════════════════
  // Tour materi: TUNGGU sampai stage === 'materi'
  // karena target (stepper, content, nav, pdf) hanya ada di stage itu
  // ═══════════════════════════════════════════════════════════
  cancelTourWait = maybeAutoStart('materi', {
    delayMs: 800,
    waitFor: () => stage.value === 'materi',
    maxWaitMs: 10000,   // tunggu max 10 detik
    pollMs: 400,
  })
})

onUnmounted(() => {
  if (typeof cancelTourWait === 'function') cancelTourWait()
})

watch(() => props.babId, initFromModule)

// ───── Subbab logic ─────
function isSectionLocked(index) {
  if (index === 0) return false
  const prevId = moduleData.value?.sections?.[index - 1]?.id
  return prevId ? !completedSections.value.includes(prevId) : false
}

function statusSection(id, index) {
  if (completedSections.value.includes(id)) return 'selesai'
  if (isSectionLocked(index)) return 'terkunci'
  if (id === activeSectionId.value) return 'aktif'
  return 'tersedia'
}

function ikonSection(status) {
  const map = {
    selesai: 'check_circle',
    terkunci: 'lock',
    aktif: 'play_circle_filled',
    tersedia: 'radio_button_unchecked',
  }
  return map[status] || 'radio_button_unchecked'
}

function markSectionDone() {
  if (!completedSections.value.includes(activeSectionId.value)) {
    completedSections.value = [...completedSections.value, activeSectionId.value]
    persistCompletedSections()
  }

  if (isLastSection.value) {
    const hasPost = (moduleData.value?.postTest?.questions?.length ?? 0) > 0
    if (hasPost) {
      stage.value = 'post-intro'
      postQuiz.prepare()
    }
  } else {
    const next = moduleData.value.sections[activeSectionIndex.value + 1]
    if (next) activeSectionId.value = next.id
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function prevSection() {
  const prev = moduleData.value?.sections?.[activeSectionIndex.value - 1]
  if (prev) activeSectionId.value = prev.id
}

const completedKey = () => `sections-done-${props.babId}`

function persistCompletedSections() {
  try {
    localStorage.setItem(completedKey(), JSON.stringify(completedSections.value))
  } catch {
    /* localStorage tidak tersedia, abaikan */
  }
}

function readCompletedSections() {
  try {
    const raw = localStorage.getItem(completedKey())
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ───── Free Test ─────
function startFreeTest() {
  freeQuiz.prepare()
  stage.value = 'free'
}

function skipToMateri() {
  stage.value = 'materi'
}

function submitFreeTest() {
  if (!freeQuiz.allAnswered.value) {
    $q.dialog({
      title: 'Belum semua dijawab',
      message: `Anda masih memiliki ${freeQuiz.unansweredCount.value} soal yang belum dijawab. Yakin ingin mengumpulkan?`,
      cancel: { label: 'Kembali', flat: true },
      ok: { label: 'Kumpulkan', unelevated: true, color: 'primary' },
    }).onOk(doSubmitFree)
    return
  }
  doSubmitFree()
}

function doSubmitFree() {
  const result = freeQuiz.submit(0)
  recordFreeTest(props.babId, result.score)
  lastResult.value = result
  stage.value = 'free-result'
}

function goToMateriFromFree() {
  stage.value = 'materi'
}

// ───── Post Test ─────
function startPostTest() {
  postQuiz.prepare()
  stage.value = 'post'
}

function submitPostTest() {
  if (!postQuiz.allAnswered.value) {
    $q.dialog({
      title: 'Belum semua dijawab',
      message: `Anda masih memiliki ${postQuiz.unansweredCount.value} soal yang belum dijawab. Yakin ingin mengumpulkan?`,
      cancel: { label: 'Kembali', flat: true },
      ok: { label: 'Kumpulkan', unelevated: true, color: 'primary' },
    }).onOk(doSubmitPost)
    return
  }
  doSubmitPost()
}

function doSubmitPost() {
  const passing =
    moduleData.value?.postTest?.passingScore ??
    moduleData.value?.passingScore ??
    passingScore
  const result = postQuiz.submit(passing)
  recordPostTest(props.babId, result.score)
  lastResult.value = result
  stage.value = 'post-result'
}

function retryPost() {
  postQuiz.prepare()
  stage.value = 'post'
}

function reviewMateri() {
  stage.value = 'materi'
  activeSectionId.value = moduleData.value?.sections?.[0]?.id || ''
}

function goNextModule() {
  if (nextModule.value) router.push(`/materi/${nextModule.value.id}`)
  else router.push('/')
}

// ═══════════════════════════════════════════════════════════
// PDF Export
// ═══════════════════════════════════════════════════════════

async function downloadActiveSectionPdf() {
  if (!activeSection.value || !moduleData.value) return
  pdfExportMode.value = 'section'
  await nextTick()
  await new Promise((r) => setTimeout(r, 300))

  try {
    await exportElementToPdf(pdfTargetRef.value, {
      filename: `${moduleData.value.id}-${activeSection.value.id}`,
    })
  } catch (err) {
    console.error('[PDF] Error:', err)
    $q.notify({
      type: 'negative',
      message: `Gagal membuka dialog PDF: ${err.message}`,
      position: 'top',
    })
  } finally {
    // ═══ Delay kecil sebelum unmount — beri kesempatan browser
    //     menyelesaikan proses print sepenuhnya
    await new Promise((r) => setTimeout(r, 150))
    pdfExportMode.value = null
  }
}

async function downloadWholeModulePdf() {
  if (!moduleData.value) return

  pdfExportMode.value = 'module'

  await nextTick()
  await new Promise((r) => setTimeout(r, 600)) // modul = lebih banyak konten, tunggu lebih lama

  try {
    await exportElementToPdf(pdfTargetRef.value, {
      filename: `${moduleData.value.id}-${slugify(moduleData.value.judul)}.pdf`,
    })
    $q.notify({ type: 'positive', message: 'PDF modul berhasil dibuat.', position: 'top' })
  } catch (err) {
    console.error('[PDF Export] Error:', err)
    $q.notify({
      type: 'negative',
      message: `Gagal generate PDF: ${err.message}`,
      position: 'top',
    })
  } finally {
    pdfExportMode.value = null
  }
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
const progress = ref()
const progressLabel = computed(() => {
  return {
    'menyiapkan': 'Menyiapkan…',
    'menunggu gambar': 'Menunggu gambar…',
    'menunggu font': 'Menunggu font…',
    'render': 'Merender…',
  }[progress.value] || 'PDF'
})

</script>

<style scoped>
.pdf-fade-leave-active {
  transition: opacity 0.2s ease;
}

.pdf-fade-leave-to {
  opacity: 0;
}

/* ═════════════════════════════════════════════════════════════
   PDF TARGET
   Di layar: fixed overlay di atas konten (visible sementara)
   Di print: diteleport ke atas dokumen via @media print di app.scss
   ═════════════════════════════════════════════════════════════ */
.pdf-target {
  position: fixed;
  top: 0;
  left: 0;
  width: 794px;
  /* A4 width at 96dpi */
  min-height: 100px;
  background: #FFFFFF;
  color: #1B2733;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.65;
  padding: 40px;
  z-index: 999998;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.materi-page {
  --navy-900: #0B1F33;
  --navy-700: #16324F;
  --gold-500: #C9A227;
  --gold-100: #F3E7C4;
  --red-500: #A6403F;
  --red-100: #F1DCDB;
  --paper: #F4F6F8;
  --ink-900: #1B2733;
  --ink-500: #5B6B7C;
  --border: #D8DEE5;
  min-height: 100vh;
  background: var(--paper);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink-900);
}

.mono-tag {
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500);
}

/* ─── Locked ─── */
.locked-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 70vh;
}

.locked-card {
  max-width: 520px;
  padding: 32px;
  text-align: center;
  border-radius: 8px;
}

.locked-icon {
  color: var(--red-500);
}

.locked-title {
  font-size: 1.4rem;
  margin: 12px 0 8px;
  color: var(--navy-900);
}

.locked-desc {
  color: var(--ink-500);
  line-height: 1.6;
  margin-bottom: 20px;
}

/* ─── Drawer ─── */
.bab-drawer {
  background: #fff;
}

.drawer-head {
  padding: 16px;
  background: linear-gradient(180deg, var(--navy-900) 0%, var(--navy-700) 100%);
  text-align: center;
}

.drawer-back-btn {
  color: #fff;
}

.drawer-bab-title {
  color: var(--gold-500);
}

.drawer-progress :deep(.q-linear-progress__track) {
  background: rgba(255, 255, 255, 0.15);
}

.drawer-progress :deep(.q-linear-progress__model) {
  background: var(--gold-500);
}

.drawer-progress-caption {
  color: #9FB0C0;
  font-size: 0.8rem;
  margin-top: 6px;
}

.drawer-item--active {
  background: var(--gold-100);
  color: var(--navy-900);
  font-weight: 600;
}

.icon-status-selesai {
  color: #21ba45;
}

.icon-status-terkunci {
  color: var(--ink-500);
}

.icon-status-aktif {
  color: var(--gold-500);
}

.icon-status-tersedia {
  color: var(--ink-500);
}

/* ─── Container ─── */
.materi-container {
  max-width: 820px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}

/* ═════════════════════════════════════════════════════════════
   FAB — Floating Action Button (mobile only)
   Posisi kanan atas, sejajar dengan header
   ═════════════════════════════════════════════════════════════ */
.materi-fab {
  position: fixed !important;
  top: 0px;
  /* ← tepat di bawah header */
  right: 0px;
  bottom: auto;
  /* ← hapus bottom lama */
  z-index: 1500;
  /* ← di atas konten, di bawah drawer */
  box-shadow: 0 4px 12px rgba(11, 31, 51, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}

.materi-fab:active {
  transform: scale(0.95);
}

.materi-fab:focus-visible {
  outline: 3px solid var(--gold-500, #C9A227);
  outline-offset: 2px;
}

/* Mobile: sedikit lebih kecil dan rapat */
@media (max-width: 640px) {
  .materi-fab {
    top: 56px;
    right: 10px;
  }
}

/* ─── Stage Card ─── */
.stage-card {
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.stage-title {
  font-size: 1.4rem;
  color: var(--navy-900);
  margin: 8px 0 12px;
}

.stage-desc {
  color: var(--ink-500);
  line-height: 1.7;
  margin: 0 0 12px;
}

.stage-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.post-history {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--paper);
  border-left: 3px solid var(--gold-500);
  border-radius: 4px;
  font-size: 0.9rem;
}

/* ─── Materi ─── */
.materi-card {
  padding: 28px;
}

.materi-title {
  font-size: 1.3rem;
  color: var(--navy-900);
  margin: 8px 0 16px;
}

.materi-body p {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--ink-900);
  margin: 0 0 14px;
}

.materi-callout {
  background: var(--paper);
  border-left: 3px solid var(--gold-500);
  border-radius: 4px;
  padding: 14px 18px;
  margin: 20px 0;
}

.callout-label {
  color: var(--gold-500);
  margin-bottom: 6px;
}

.materi-callout ul {
  margin: 0;
  padding-left: 20px;
}

.materi-callout li {
  margin-bottom: 4px;
}

.materi-keywords {
  margin: 16px 0;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.keyword-tag {
  font-size: 0.75rem;
  padding: 3px 10px;
  background: var(--gold-100);
  color: #8A6A14;
  border-radius: 12px;
}

.materi-nav,
.quiz-nav {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

/* ═════════════════════════════════════════════════════════════
   MATERI NAV — Responsive
   Desktop: 1 baris horizontal
   Mobile: 2 baris (secondary + primary)
   ═════════════════════════════════════════════════════════════ */
.materi-nav,
.quiz-nav {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border, #D8DEE5);
}

.materi-nav-secondary {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

/* Desktop: tombol lanjutkan melebar, secondary tidak */
.materi-nav-next {
  flex: 1;
  min-width: 200px;
}

/* ═══════ Mobile (≤ 640px) ═══════ */
@media (max-width: 640px) {
  .materi-nav {
    flex-direction: column;
    gap: 10px;
    padding-top: 16px;
    margin-top: 20px;
  }

  /* Baris 1: Prev + PDF side by side */
  .materi-nav-secondary {
    width: 100%;
    gap: 8px;
  }

  .materi-nav-secondary>* {
    flex: 1;
    min-width: 0;
  }

  /* Teks tombol prev tidak di-truncate */
  .materi-nav-secondary :deep(.q-btn__content) {
    white-space: normal;
    line-height: 1.2;
  }

  /* Baris 2: Lanjutkan full width */
  .materi-nav-next {
    width: 100%;
    min-width: 0;
    flex: none;
  }

  /* Tombol lebih tinggi = mudah ditekan */
  .materi-nav .q-btn {
    min-height: 44px;
  }
}


/* ─── Quiz ─── */
.quiz-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.dot-nav {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.quiz-dot {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--ink-500);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
}

.quiz-dot:hover {
  border-color: var(--navy-700);
}

.quiz-dot:focus-visible {
  outline: 2px solid var(--gold-500);
  outline-offset: 2px;
}

.quiz-dot--answered {
  background: var(--gold-100);
  border-color: var(--gold-500);
  color: var(--navy-900);
}

.quiz-dot--current {
  border-color: var(--navy-700);
  box-shadow: 0 0 0 2px rgba(22, 50, 79, 0.15);
}

.materi-empty {
  text-align: center;
  padding: 40px;
  color: var(--ink-500);
}

/* ─── Tombol ─── */
.btn-primary-tech {
  background: var(--gold-500);
  color: var(--navy-900);
  font-weight: 600;
  border-radius: 4px;
}

.btn-ghost-tech {
  color: var(--navy-700);
  border: 1px solid var(--border);
  border-radius: 4px;
}

/* ─── Fokus keyboard ─── */
:deep(.q-btn:focus-visible) {
  outline: 2px solid var(--gold-500);
  outline-offset: 2px;
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .stage-card {
    padding: 20px;
  }

  .materi-card {
    padding: 20px;
  }

  .materi-title {
    font-size: 1.15rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
