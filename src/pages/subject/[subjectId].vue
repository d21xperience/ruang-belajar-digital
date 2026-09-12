<template>
  <q-page class="subject-page">
    <!-- ══════ SUBJECT TIDAK DITEMUKAN ══════ -->
    <div v-if="!subject" class="not-found-wrap">
      <q-card flat bordered class="not-found-card">
        <q-icon name="search_off" size="48px" color="grey-5" />
        <h2 class="nf-title">Subject tidak ditemukan</h2>
        <p class="nf-desc">
          Subject "{{ subjectId }}" tidak terdaftar di platform ini.
        </p>
        <q-btn class="btn-primary-tech" unelevated label="Kembali ke Beranda" icon="home" @click="$router.push('/')" />
      </q-card>
    </div>

    <!-- ══════ SUBJECT CONTENT ══════ -->
    <template v-else>
      <!-- HERO SUBJECT -->
      <section class="subject-hero" :style="{ '--subject-color': subject.color }" data-tour-subject="hero">
        <div class="sh-inner">
          <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" class="sh-back" @click="$router.push('/')" />

          <div class="sh-content">
            <div class="sh-icon">
              <q-icon :name="subject.icon" size="40px" />
            </div>
            <div class="sh-meta">
              <div class="sh-tingkat">{{ subject.metadata?.tingkat || 'Umum' }}</div>
              <h1 class="sh-title">{{ subject.judul }}</h1>
              <p class="sh-desc">{{ subject.deskripsi }}</p>
              <div class="sh-stats">
                <span class="sh-stat">
                  <b>{{ modules.length }}</b> modul
                </span>
                <span class="sh-stat-dot">·</span>
                <span class="sh-stat">
                  KKM <b>{{ passingScore }}</b>
                </span>
                <span v-if="finalQuestionCount" class="sh-stat-dot">·</span>
                <span v-if="finalQuestionCount" class="sh-stat">
                  <b>{{ finalQuestionCount }}</b> soal final
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PROGRESS (jika ada) -->
      <section v-if="hasProgress" class="subject-progress" data-tour-subject="progress">
        <div class="sp-inner">
          <div class="sp-head">
            <span class="mono-tag">PROGRES ANDA</span>
            <span class="sp-percent">{{ globalProgress.percent }}%</span>
          </div>
          <div class="sp-ruler">
            <div v-for="(mod) in modules" :key="mod.id" class="sp-tick" :class="{
              'sp-tick--done': moduleStatus(mod.id) === 'passed',
              'sp-tick--active': moduleStatus(mod.id) === 'active',
              'sp-tick--locked': moduleStatus(mod.id) === 'locked',
            }" />
          </div>
          <div class="sp-caption">
            {{ globalProgress.passedModules }} dari {{ modules.length }} modul selesai
          </div>
        </div>
      </section>

      <!-- DAFTAR MODUL -->
      <section class="subject-modules" data-tour-subject="modules">
        <div class="sm-inner">
          <div class="sm-head">
            <h2 class="sm-title">Daftar Modul</h2>
            <p class="sm-subtitle">Urut sesuai tahapan belajar</p>
          </div>

          <div v-if="!modules.length" class="sm-empty">
            <q-icon name="hourglass_empty" size="40px" color="grey-5" />
            <h3>Konten sedang disiapkan</h3>
            <p>Modul untuk subject ini belum tersedia. Silakan kembali lagi nanti.</p>
            <q-btn class="btn-primary-tech" unelevated label="Kembali ke Beranda" icon="home"
              @click="$router.push('/')" />
          </div>

          <div v-else class="sm-list">
            <div v-for="(mod, index) in modules" :key="mod.id" class="sm-row"
              :data-tour-subject="index === 0 ? 'module-card-first' : null">
              <!-- Node -->
              <div class="sm-node-col">
                <div class="sm-node" :class="`sm-node--${moduleStatus(mod.id)}`">
                  <q-icon v-if="moduleStatus(mod.id) === 'passed'" name="check" size="18px" />
                  <q-icon v-else-if="moduleStatus(mod.id) === 'locked'" name="lock" size="16px" />
                  <span v-else class="mono-tag">{{ String(index + 1).padStart(2, '0') }}</span>
                </div>
                <div v-if="index < modules.length - 1" class="sm-connector" />
              </div>

              <!-- Card -->
              <q-card flat bordered class="sm-card" :class="`sm-card--${moduleStatus(mod.id)}`">
                <div class="sm-card-head">
                  <span class="mono-tag">MODUL {{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="sm-pill" :class="`sm-pill--${moduleStatus(mod.id)}`">
                    {{ statusLabel(mod.id) }}
                  </span>
                </div>
                <h3 class="sm-module-title">{{ mod.judul }}</h3>
                <p class="sm-module-desc">{{ mod.deskripsi }}</p>

                <div v-if="moduleStatus(mod.id) === 'locked'" class="sm-lock-note">
                  Selesaikan modul sebelumnya dengan nilai ≥ KKM {{ passingScore }}.
                </div>

                <q-btn v-else class="sm-btn"
                  :class="moduleStatus(mod.id) === 'passed' ? 'btn-ghost-tech' : 'btn-primary-tech'" unelevated
                  :outline="moduleStatus(mod.id) === 'passed'" :label="buttonLabel(mod.id)" icon-right="chevron_right"
                  @click="openModule(mod.id)" />
              </q-card>
            </div>
          </div>

          <!-- FINAL TEST -->
          <div v-if="modules.length && finalTestUnlocked" class="sm-final" data-tour-subject="final">
            <q-card flat bordered class="sm-final-card">
              <div class="sm-final-left">
                <div class="mono-tag">EVALUASI AKHIR</div>
                <h3 class="sm-final-title">Final Test — {{ subject.judul }}</h3>
                <p class="sm-final-desc">
                  Semua modul telah lulus KKM. Saatnya mengukur capaian akhir Anda
                  mencakup seluruh materi subject ini.
                </p>
                <div v-if="finalTestState.bestScore > 0" class="sm-final-best">
                  Skor terbaik: <b>{{ finalTestState.bestScore }}</b> ·
                  Percobaan: <b>{{ finalTestState.attempts }}</b>
                </div>
              </div>
              <div class="sm-final-right">
                <q-btn class="btn-primary-tech" unelevated
                  :label="finalTestState.attempts > 0 ? 'Ulangi Final Test' : 'Mulai Final Test'" icon="flag"
                  @click="$router.push('/final-test')" />
              </div>
            </q-card>
          </div>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubject } from '../../composables/useSubject'
import { useLearningProgress } from '../../composables/useLearningProgress'
import contentRepo from '../../repositories/contentRepository'
import LEARNING_CONFIG from '../../config/learning.js'

const route = useRoute()
const router = useRouter()

const subjectId = computed(() => route.params.subjectId)

// ═══ Set subject aktif saat halaman dibuka ═══
const { setActive } = useSubject()

onMounted(() => {
  if (subjectId.value) {
    setActive(subjectId.value)
  }
})

// ═══ Data subject ═══
const subject = computed(() => contentRepo.getSubjectById(subjectId.value))

const modules = computed(() => {
  const list = contentRepo.getModulesBySubject(subjectId.value)
  return [...list].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
})

const passingScore = computed(() => {
  const meta = contentRepo.getFinalTestMeta(subjectId.value)
  return meta?.passingScore ?? LEARNING_CONFIG.passingScore
})

const finalQuestionCount = computed(() => {
  const meta = contentRepo.getFinalTestMeta(subjectId.value)
  return meta?.totalQuestions || 0
})

// ═══ Progress ═══
const {
  globalProgress,
  finalTestUnlocked,
  finalTestState,
  moduleStatus,
} = useLearningProgress()

const hasProgress = computed(() => globalProgress.value.passedModules > 0)

// ═══ Label helpers ═══
function statusLabel(moduleId) {
  const s = moduleStatus(moduleId)
  return {
    passed: '✓ Lulus KKM',
    active: '▶ Sedang Belajar',
    available: '○ Belum Mulai',
    locked: '🔒 Terkunci',
  }[s]
}

function buttonLabel(moduleId) {
  const s = moduleStatus(moduleId)
  if (s === 'passed') return 'Tinjau Ulang'
  if (s === 'active') return 'Lanjutkan Belajar'
  return 'Mulai Belajar'
}

function openModule(moduleId) {
  router.push(`/materi/${moduleId}`)
}
</script>

<style scoped>
.subject-page {
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
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500);
}

/* ══════════ NOT FOUND ══════════ */
.not-found-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  min-height: 70vh;
}

.not-found-card {
  max-width: 480px;
  padding: 40px 32px;
  text-align: center;
  border-radius: 8px;
}

.nf-title {
  font-size: 1.3rem;
  margin: 12px 0 8px;
  color: var(--navy-900);
}

.nf-desc {
  color: var(--ink-500);
  line-height: 1.6;
  margin-bottom: 20px;
}

/* ══════════ SUBJECT HERO ══════════ */
.subject-hero {
  background: linear-gradient(135deg, #0B1F33 0%, #16324F 100%);
  padding: 24px 24px 40px;
  border-bottom: 4px solid var(--subject-color, #C9A227);
}

.sh-inner {
  max-width: 960px;
  margin: 0 auto;
}

.sh-back {
  color: #C7D2DC;
  margin-bottom: 16px;
}

.sh-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.sh-icon {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--subject-color, #C9A227) 25%, transparent);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--subject-color, #C9A227) 50%, transparent);
}

.sh-meta {
  flex: 1;
  min-width: 0;
}

.sh-tingkat {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: var(--subject-color, #C9A227);
  margin-bottom: 4px;
}

.sh-title {
  font-size: 1.8rem;
  color: #FFFFFF;
  margin: 0 0 8px;
  line-height: 1.2;
}

.sh-desc {
  color: #C7D2DC;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 12px;
  max-width: 60ch;
}

.sh-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 0.82rem;
  color: #9FB0C0;
}

.sh-stat b {
  color: #FFFFFF;
}

.sh-stat-dot {
  color: #5B6B7C;
}

/* ══════════ SUBJECT PROGRESS ══════════ */
.subject-progress {
  max-width: 960px;
  margin: -20px auto 0;
  padding: 0 24px;
  position: relative;
  z-index: 2;
}

.sp-inner {
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.sp-percent {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--gold-500);
}

.sp-ruler {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.sp-tick {
  flex: 1;
  height: 8px;
  background: var(--border);
  border-radius: 2px;
}

.sp-tick--done {
  background: var(--gold-500);
}

.sp-tick--active {
  background: #E8CD6F;
}

.sp-tick--locked {
  background: var(--red-100);
}

.sp-caption {
  font-size: 0.8rem;
  color: var(--ink-500);
}

/* ══════════ MODULES ══════════ */
.subject-modules {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

.sm-head {
  margin-bottom: 24px;
}

.sm-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 4px;
}

.sm-subtitle {
  color: var(--ink-500);
  font-size: 0.9rem;
  margin: 0;
}

.sm-empty {
  padding: 60px 24px;
  text-align: center;
  background: #FFFFFF;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.sm-empty h3 {
  margin: 12px 0 6px;
  color: var(--navy-900);
  font-size: 1.1rem;
}

.sm-empty p {
  color: var(--ink-500);
  margin-bottom: 20px;
  line-height: 1.6;
}

.sm-list {
  display: flex;
  flex-direction: column;
}

.sm-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 20px;
}

.sm-node-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sm-node {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: #FFFFFF;
  color: var(--ink-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sm-node--passed {
  background: var(--gold-500);
  border-color: var(--gold-500);
  color: var(--navy-900);
}

.sm-node--active {
  border-color: var(--navy-700);
  color: var(--navy-700);
  box-shadow: 0 0 0 3px rgba(22, 50, 79, 0.12);
}

.sm-node--locked {
  color: var(--red-500);
  border-color: var(--red-100);
  background: var(--red-100);
}

.sm-connector {
  width: 1px;
  flex: 1;
  min-height: 24px;
  background-image: linear-gradient(var(--border) 60%, transparent 40%);
  background-size: 1px 8px;
  margin-top: 4px;
}

.sm-card {
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 20px 22px;
  margin-bottom: 16px;
}

.sm-card--active {
  border-color: var(--navy-700);
  border-left: 3px solid var(--gold-500);
}

.sm-card--locked {
  background: #FAFBFC;
  color: var(--ink-500);
}

.sm-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.sm-pill {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 3px;
  background: #EEF1F4;
  color: var(--ink-500);
}

.sm-pill--passed {
  background: var(--gold-100);
  color: #8A6A14;
}

.sm-pill--active {
  background: #E5EBF1;
  color: var(--navy-700);
}

.sm-pill--locked {
  background: var(--red-100);
  color: var(--red-500);
}

.sm-module-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 6px;
}

.sm-module-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--ink-500);
  margin: 0 0 14px;
}

.sm-lock-note {
  font-size: 0.85rem;
  color: var(--red-500);
}

.sm-btn {
  border-radius: 4px;
}

/* ══════════ FINAL TEST ══════════ */
.sm-final {
  margin-top: 32px;
}

.sm-final-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  padding: 24px;
  border-radius: 10px;
  border-left: 4px solid var(--gold-500);
  align-items: center;
}

.sm-final-title {
  font-size: 1.2rem;
  color: var(--navy-900);
  margin: 6px 0 8px;
}

.sm-final-desc {
  color: var(--ink-500);
  line-height: 1.6;
  margin: 0 0 8px;
  font-size: 0.9rem;
}

.sm-final-best {
  font-size: 0.82rem;
  color: var(--ink-500);
}

/* ══════════ BUTTONS ══════════ */
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

/* ══════════ RESPONSIVE ══════════ */
@media (max-width: 640px) {
  .sh-content {
    flex-direction: column;
    gap: 14px;
  }

  .sh-icon {
    width: 56px;
    height: 56px;
  }

  .sh-title {
    font-size: 1.4rem;
  }

  .sm-final-card {
    grid-template-columns: 1fr;
  }

  .sm-final-right {
    display: flex;
  }

  .sm-final-right .q-btn {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
