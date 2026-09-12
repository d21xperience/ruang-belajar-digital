<template>
  <q-page class="ppkn-page bg-paper">
    <!-- HERO -->
    <section class="hero" data-tour="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <div class="eyebrow-tech">Pendidikan Pancasila · Kelas X SMK</div>
          <h1 class="hero-title">Ruang Belajar Profil Pelajar Pancasila</h1>
          <p class="hero-desc">
            Selamat datang di Modul Pembelajaran Interaktif. Setiap modul: Free Test → Materi → Post Test (KKM {{
              passingScore }}).
            Lulus KKM untuk membuka modul berikutnya.
          </p>
          <div class="hero-actions">
            <q-btn class="btn-primary-tech" unelevated :label="nextActionLabel" icon="collections_bookmark"
              @click="goToNextModule" />
            <q-btn class="btn-ghost-tech" outline label="Analitik" icon="insights" @click="$router.push('/analitik')" />
            <q-btn class="btn-ghost-tech" outline label="Profil Guru" icon="account_circle"
              @click="$router.push('/tentang')" />
          </div>

        </div>

        <div data-tour="progress">
          <ProgressSummary :progress="globalProgress" :modules="orderedModules" :module-status="moduleStatus" />
        </div>
      </div>
    </section>

    <!-- FINAL TEST CARD (jika terbuka) -->
    <section v-if="finalTestUnlocked" class="final-section">
      <q-card flat bordered class="final-card">
        <div class="final-card__left">
          <div class="mono-tag">EVALUASI AKHIR</div>
          <h2 class="final-card__title">Final Test — 35 Soal</h2>
          <p class="final-card__desc">
            Semua modul telah lulus KKM. Saatnya mengukur capaian akhir Anda
            mencakup seluruh materi lima modul.
          </p>
          <div v-if="finalTestState.bestScore > 0" class="final-card__best">
            Skor terbaik: <b>{{ finalTestState.bestScore }}</b> ·
            Percobaan: <b>{{ finalTestState.attempts }}</b>
          </div>
        </div>
        <div class="final-card__right">
          <q-btn class="btn-primary-tech" unelevated
            :label="finalTestState.attempts > 0 ? 'Ulangi Final Test' : 'Mulai Final Test'" icon="flag"
            @click="$router.push('/final-test')" />
        </div>
      </q-card>
    </section>

    <!-- DAFTAR MODUL -->
    <section class="materi-section" data-tour="modules">
      <div class="section-header">
        <h2 class="section-title">Daftar Modul</h2>
        <p class="section-subtitle">Urut sesuai tahapan belajar</p>
      </div>

      <div class="module-list">
        <div v-for="(mod, index) in orderedModules" :key="mod.id" class="module-row">
          <div class="module-node-col">
            <div class="module-node" :class="`module-node--${moduleStatus(mod.id)}`">
              <q-icon v-if="moduleStatus(mod.id) === 'passed'" name="check" size="18px" />
              <q-icon v-else-if="moduleStatus(mod.id) === 'locked'" name="lock" size="16px" />
              <span v-else class="mono-tag">{{ String(index + 1).padStart(2, '0') }}</span>
            </div>
            <div v-if="index < orderedModules.length - 1" class="module-connector" />
          </div>

          <q-card flat bordered class="module-card" :class="`module-card--${moduleStatus(mod.id)}`">
            <div class="module-card-head">
              <span class="module-number mono-tag">MODUL {{ String(index + 1).padStart(2, '0') }}</span>
              <span class="status-pill" :class="`status-pill--${moduleStatus(mod.id)}`">
                {{ statusLabel(mod.id) }}
              </span>
            </div>
            <h3 class="module-title">{{ mod.judul }}</h3>
            <p class="module-desc">{{ mod.deskripsi }}</p>

            <div v-if="moduleStatus(mod.id) === 'locked'" class="module-lock-note">
              Selesaikan modul sebelumnya dengan nilai ≥ KKM {{ passingScore }} untuk membuka modul ini.
            </div>

            <q-btn v-else class="module-btn"
              :class="moduleStatus(mod.id) === 'passed' ? 'btn-ghost-tech' : 'btn-primary-tech'" unelevated
              :outline="moduleStatus(mod.id) === 'passed'" :label="buttonLabel(mod.id)" icon-right="chevron_right"
              @click="bukaMateri(mod.id)" />
          </q-card>
        </div>
      </div>
    </section>

    <!-- RESET PROGRES (disembunyikan di balik expand) -->
    <section class="reset-section">
      <q-expansion-item icon="settings" label="Pengaturan Lanjutan" caption="Reset progres belajar"
        header-class="text-grey-7">
        <div class="reset-content">
          <p class="reset-warning">
            Menghapus seluruh progres pembelajaran (semua modul, attempt, dan skor)
            dan mengembalikan aplikasi ke kondisi awal.
          </p>
          <q-btn outline color="negative" label="Reset Progres" icon="delete_forever" @click="confirmReset" />
        </div>
      </q-expansion-item>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import LEARNING_CONFIG from '../config/learning.js'
import { useLearningProgress } from '../composables/useLearningProgress'
import ProgressSummary from '../components/ProgressSummary.vue'

const router = useRouter()
const $q = useQuasar()
const passingScore = LEARNING_CONFIG.passingScore

const {
  orderedModules,
  globalProgress,
  finalTestUnlocked,
  finalTestState,
  moduleStatus,
  isUnlocked,
  resetProgress,
  refresh,
} = useLearningProgress()

onMounted(refresh)

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

function bukaMateri(moduleId) {
  if (!isUnlocked(moduleId)) return
  router.push(`/materi/${moduleId}`)
}

const nextActionLabel = computed(() => {
  if (finalTestUnlocked.value) return 'Ke Final Test'
  const active = orderedModules.value.find(
    (m) => moduleStatus(m.id) === 'active' || moduleStatus(m.id) === 'available'
  )
  return active ? 'Lanjutkan Belajar' : 'Lihat Modul'
})

function goToNextModule() {
  if (finalTestUnlocked.value) {
    router.push('/final-test')
    return
  }
  const active = orderedModules.value.find(
    (m) => moduleStatus(m.id) === 'active' || moduleStatus(m.id) === 'available'
  )
  if (active) router.push(`/materi/${active.id}`)
}

function confirmReset() {
  $q.dialog({
    title: 'Reset Progres',
    message: 'Apakah Anda yakin ingin menghapus seluruh progres pembelajaran? Tindakan ini tidak dapat dibatalkan.',
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Ya, Reset', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(() => {
    resetProgress()
    $q.notify({ type: 'positive', message: 'Progres berhasil direset.', position: 'top' })
  })
}
</script>

<style scoped>
/* ... (pertahankan style hero lama Anda) ... */
.ppkn-page {
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
}

.bg-paper {
  background-color: var(--paper);
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.hero {
  background: linear-gradient(180deg, var(--navy-900) 0%, var(--navy-700) 100%);
  padding: 56px 24px;
}

.hero-inner {
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 40px;
  align-items: center;
}

.eyebrow-tech {
  color: var(--gold-500);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  margin-bottom: 12px;
}

.hero-title {
  color: #fff;
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 14px 0;
  max-width: 22ch;
}

.hero-desc {
  color: #C7D2DC;
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 46ch;
  margin: 0 0 24px 0;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

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

.hero .btn-ghost-tech {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

.final-section {
  max-width: 1040px;
  margin: 24px auto 0;
  padding: 0 24px;
}

.final-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  padding: 24px;
  border-left: 4px solid var(--gold-500);
  align-items: center;
}

.final-card__title {
  font-size: 1.3rem;
  margin: 4px 0 8px;
  color: var(--navy-900);
}

.final-card__desc {
  color: var(--ink-500);
  line-height: 1.6;
  margin: 0 0 8px;
}

.final-card__best {
  font-size: 0.85rem;
  color: var(--ink-500);
}

.materi-section {
  max-width: 1040px;
  margin: 0 auto;
  padding: 48px 24px 40px;
}

.section-header {
  margin-bottom: 28px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 4px;
}

.section-subtitle {
  color: var(--ink-500);
  font-size: 0.9rem;
  margin: 0;
}

.module-list {
  display: flex;
  flex-direction: column;
}

.module-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 20px;
}

.module-node-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.module-node {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--ink-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-node--passed {
  background: var(--gold-500);
  border-color: var(--gold-500);
  color: var(--navy-900);
}

.module-node--active {
  border-color: var(--navy-700);
  color: var(--navy-700);
  box-shadow: 0 0 0 3px rgba(22, 50, 79, 0.12);
}

.module-node--locked {
  color: var(--red-500);
  border-color: var(--red-100);
  background: var(--red-100);
}

.module-connector {
  width: 1px;
  flex: 1;
  min-height: 24px;
  margin-top: 4px;
  background-image: linear-gradient(var(--border) 60%, transparent 40%);
  background-size: 1px 8px;
}

.module-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 20px 22px;
  margin-bottom: 16px;
}

.module-card--active {
  border-color: var(--navy-700);
  border-left: 3px solid var(--gold-500);
}

.module-card--locked {
  background: #FAFBFC;
  color: var(--ink-500);
}

.module-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.module-number {
  color: var(--ink-500);
}

.status-pill {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 3px;
  background: #EEF1F4;
  color: var(--ink-500);
}

.status-pill--passed {
  background: var(--gold-100);
  color: #8A6A14;
}

.status-pill--active {
  background: #E5EBF1;
  color: var(--navy-700);
}

.status-pill--locked {
  background: var(--red-100);
  color: var(--red-500);
}

.module-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 6px;
}

.module-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--ink-500);
  margin: 0 0 14px;
}

.module-lock-note {
  font-size: 0.85rem;
  color: var(--red-500);
}

.module-btn {
  border-radius: 4px;
}

.reset-section {
  max-width: 1040px;
  margin: 0 auto 40px;
  padding: 0 24px;
}

.reset-content {
  padding: 16px 8px;
}

.reset-warning {
  color: var(--red-500);
  font-size: 0.85rem;
  margin-bottom: 12px;
  line-height: 1.6;
}

@media (max-width: 720px) {
  .hero-inner {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 1.7rem;
  }

  .final-card {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
