<template>
  <q-page class="analitik-page">
    <!-- ═══════════════════════════════════════════════════════
         ANALYTICS DASHBOARD (visible)
         ═══════════════════════════════════════════════════════ -->
    <div class="analitik-wrap no-print">
      <!-- Topbar -->
      <div class="page-topbar">
        <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" @click="$router.push('/')" />
        <div class="topbar-actions">
          <q-btn class="btn-ghost-tech" outline icon="share" label="Bagikan ke Guru" :disable="!hasAnyData"
            @click="shareDialogOpen = true" />
          <q-btn class="btn-primary-tech" unelevated icon="picture_as_pdf" label="Export Laporan PDF"
            :disable="!hasAnyData" @click="exportReport" />
        </div>
      </div>

      <h1 class="page-title">Analitik Hasil Belajar</h1>
      <p class="page-subtitle">
        Pantau perkembangan skor, penguasaan materi, dan aktivitas belajar Anda.
      </p>

      <!-- Empty state -->
      <q-card v-if="!hasAnyData" flat bordered class="empty-card">
        <q-icon name="insights" size="48px" color="grey-5" />
        <h2 class="empty-title">Belum ada data untuk dianalisis</h2>
        <p class="empty-desc">
          Kerjakan Free Test atau Post Test terlebih dahulu untuk melihat
          grafik perkembangan dan analisis penguasaan materi.
        </p>
        <q-btn class="btn-primary-tech" unelevated icon="school" label="Mulai Belajar" @click="$router.push('/')" />
      </q-card>

      <template v-else>
        <!-- ══════════ STATS CARDS ══════════ -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">TOTAL PERCOBAAN</div>
            <div class="stat-value">{{ overall.count }}</div>
            <div class="stat-caption">Free + Post + Final</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">RATA-RATA SKOR</div>
            <div class="stat-value">{{ overall.avg }}</div>
            <div class="stat-caption">dari seluruh tes</div>
          </div>
          <div class="stat-card stat-card--highlight">
            <div class="stat-label">SKOR TERBAIK</div>
            <div class="stat-value">{{ overall.best }}</div>
            <div class="stat-caption">dari seluruh tes</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">MODUL SELESAI</div>
            <div class="stat-value">
              {{ globalProgress.passedModules }}<span class="stat-unit">/{{ globalProgress.totalModules }}</span>
            </div>
            <div class="stat-caption">{{ globalProgress.percent }}% progres</div>
          </div>
        </div>

        <!-- ══════════ PROGRESS CHART ══════════ -->
        <q-card flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Perkembangan Skor Post Test</h2>
            <p class="card-subtitle">
              Setiap titik = 1 percobaan Post Test. Garis putus-putus = KKM.
            </p>
          </div>
          <ProgressChart :series="scoreProgression" :passing-score="passingScore" />
        </q-card>

        <!-- ══════════ MASTERY PER MODUL ══════════ -->
        <q-card flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Penguasaan per Modul</h2>
            <p class="card-subtitle">
              Berdasarkan rata-rata skor Post Test tiap modul.
            </p>
          </div>
          <MasteryBars :items="moduleMastery" />

          <div v-if="weakestModules.length && weakestModules[0].percent < 100" class="recommendation">
            <div class="rec-label">📌 REKOMENDASI</div>
            <p>
              Modul yang perlu ditingkatkan:
              <b>{{weakestModules.map((m) => m.label).join(', ')}}</b>.
              Tinjau ulang materi dan kerjakan Post Test lagi.
            </p>
          </div>
        </q-card>

        <!-- ══════════ FINAL TEST STATS ══════════ -->
        <q-card v-if="finalTest.attempts > 0" flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Final Test</h2>
          </div>
          <div class="final-stats">
            <div class="final-stat">
              <span class="stat-label">PERCOBAAN</span>
              <span class="stat-value stat-value--sm">{{ finalTest.attempts }}</span>
            </div>
            <div class="final-stat">
              <span class="stat-label">SKOR TERBAIK</span>
              <span class="stat-value stat-value--sm">{{ finalTest.bestScore }}</span>
            </div>
            <div class="final-stat">
              <span class="stat-label">STATUS</span>
              <span class="final-status"
                :class="finalTest.completed ? 'final-status--passed' : 'final-status--pending'">
                {{ finalTest.completed ? '✓ Lulus' : 'Belum Lulus' }}
              </span>
            </div>
          </div>
          <div v-if="finalTest.history.length > 1" class="final-history">
            <div class="mono-tag">HISTORI SKOR</div>
            <div class="history-chips">
              <span v-for="(s, i) in finalTest.history" :key="i" class="history-chip">
                #{{ i + 1 }}: <b>{{ s }}</b>
              </span>
            </div>
          </div>
        </q-card>

        <!-- ══════════ TIMELINE ══════════ -->
        <q-card flat bordered class="analytics-card">
          <div class="card-head">
            <h2 class="card-title">Aktivitas Terbaru</h2>
            <p class="card-subtitle">20 percobaan terakhir.</p>
          </div>
          <div class="timeline">
            <div v-for="(t, i) in timeline" :key="i" class="timeline-item">
              <div class="timeline-dot" :class="{
                'timeline-dot--passed': t.passed,
                'timeline-dot--failed': t.passed === false,
              }" />
              <div class="timeline-body">
                <div class="timeline-label">{{ t.label }}</div>
                <div class="timeline-meta">
                  Skor: <b>{{ t.score }}</b> ·
                  {{ formatDate(t.at) }}
                </div>
              </div>
              <div class="timeline-score" :class="t.passed ? 'timeline-score--passed' : 'timeline-score--failed'">{{
                t.score }}</div>
            </div>
          </div>
        </q-card>

        <!-- ══════════ RESET (di balik expand) ══════════ -->
        <q-expansion-item icon="settings" label="Pengaturan Lanjutan" caption="Reset seluruh progres belajar"
          class="reset-expand">
          <div class="reset-content">
            <p class="reset-warning">
              Menghapus seluruh progres (semua modul, attempt, dan skor)
              dan mengembalikan aplikasi ke kondisi awal.
            </p>
            <q-btn outline color="negative" label="Reset Progres" icon="delete_forever" @click="confirmReset" />
          </div>
        </q-expansion-item>
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         PDF REPORT TARGET — Teleport ke body
         ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="exporting" ref="pdfTargetRef" class="analitik-pdf-target">
        <!-- Header -->
        <div class="pdf-header">
          <div class="pdf-brand">E-Modul PPKn · Laporan Analitik</div>
          <h1 class="pdf-title">Laporan Hasil Belajar</h1>
          <div class="pdf-meta">
            Dicetak: {{ currentDateLabel }}
          </div>
        </div>

        <!-- Ringkasan -->
        <h2 class="pdf-section-title">Ringkasan</h2>
        <table class="pdf-table">
          <tbody>
            <tr>
              <td>Total percobaan</td>
              <td><b>{{ overall.count }}</b></td>
            </tr>
            <tr>
              <td>Rata-rata skor</td>
              <td><b>{{ overall.avg }}</b></td>
            </tr>
            <tr>
              <td>Skor terbaik</td>
              <td><b>{{ overall.best }}</b></td>
            </tr>
            <tr>
              <td>Modul selesai</td>
              <td><b>{{ globalProgress.passedModules }} / {{ globalProgress.totalModules }}</b> ({{
                globalProgress.percent
              }}%)</td>
            </tr>
            <tr v-if="finalTest.attempts > 0">
              <td>Final Test</td>
              <td><b>{{ finalTest.bestScore }}</b> ({{ finalTest.attempts }}× percobaan)</td>
            </tr>
          </tbody>
        </table>

        <!-- Penguasaan per modul -->
        <h2 class="pdf-section-title">Penguasaan per Modul</h2>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Modul</th>
              <th>Rata-rata</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in moduleMastery" :key="m.moduleId">
              <td>{{ m.label }}</td>
              <td>{{ m.avgScore }} / 100</td>
              <td>
                <span v-if="m.passed">✓ Lulus</span>
                <span v-else>Belum Lulus</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Rekomendasi -->
        <div v-if="weakestModules.length && weakestModules[0].percent < 100" class="pdf-callout">
          <h3>📌 Rekomendasi</h3>
          <p>
            Modul yang perlu ditingkatkan:
            <b>{{weakestModules.map((m) => m.label).join(', ')}}</b>.
          </p>
        </div>

        <!-- Riwayat Post Test per modul -->
        <h2 class="pdf-section-title">Riwayat Skor Post Test</h2>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Modul</th>
              <th>Urutan skor (percobaan)</th>
              <th>Terbaik</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in scoreProgression" :key="s.moduleId">
              <td>{{ s.label }}</td>
              <td class="mono">{{ s.scores.join(' → ') }}</td>
              <td><b>{{ s.best }}</b></td>
            </tr>
          </tbody>
        </table>

        <!-- Footer -->
        <div class="pdf-footer">
          E-Modul Pendidikan Pancasila · Kelas X SMK · SMK Pasundan Jatinangor
        </div>
      </div>
    </Teleport>

    <!-- Loading overlay -->
    <Teleport to="body">
      <div v-if="exporting" class="analitik-loading no-print">
        <q-spinner-dots size="48px" color="primary" />
        <div class="loading-text">Menyiapkan laporan…</div>
        <div class="loading-sub">Dialog print akan segera terbuka</div>
      </div>
    </Teleport>

    <ShareDialog v-model="shareDialogOpen" />

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useLearningProgress } from '../composables/useLearningProgress'
import { useLearningAnalytics } from '../composables/useLearningAnalytics'
import { usePdfExport } from '../composables/usePdfExport'
import LEARNING_CONFIG from '../config/learning.js'
import ProgressChart from '../components/analytics/ProgressChart.vue'
import MasteryBars from '../components/analytics/MasteryBars.vue'
import ShareDialog from '../components/analytics/ShareDialog.vue'

const $q = useQuasar()
const passingScore = LEARNING_CONFIG.passingScore
const shareDialogOpen = ref(false)

const { state, globalProgress, resetProgress } = useLearningProgress()
const analytics = useLearningAnalytics(state)
const { exporting, exportElementToPdf } = usePdfExport()

const pdfTargetRef = ref(null)

const {
  overall,
  scoreProgression,
  finalTest,
  timeline,
  moduleMastery,
  weakestModules,
} = analytics

// ══════ Computed ══════
const hasAnyData = computed(() => {
  return state.value?.attempts?.length > 0 ||
    globalProgress.value.passedModules > 0
})

const currentDateLabel = computed(() => {
  const d = new Date()
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
})

// ══════ Actions ══════
async function exportReport() {
  exporting.value = true
  // Tunggu render target
  await new Promise((r) => setTimeout(r, 300))
  try {
    await exportElementToPdf(pdfTargetRef.value, {
      filename: `laporan-analitik-ppkn-${new Date().toISOString().slice(0, 10)}`,
    })
  } catch (err) {
    console.error('[Analytics PDF] Error:', err)
    $q.notify({
      type: 'negative',
      message: `Gagal export laporan: ${err.message}`,
      position: 'top',
    })
  } finally {
    await new Promise((r) => setTimeout(r, 150))
    exporting.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
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
/* ══════════════ ANALYTICS PAGE ══════════════ */
.analitik-page {
  background: var(--paper, #F4F6F8);
  min-height: 100vh;
}

.analitik-wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}

.page-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
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

/* ══════════════ EMPTY ══════════════ */
.empty-card {
  padding: 48px 24px;
  text-align: center;
}

.empty-title {
  font-size: 1.2rem;
  margin: 12px 0 8px;
  color: var(--navy-900, #0B1F33);
}

.empty-desc {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto 20px;
}

/* ══════════════ STATS ══════════════ */
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
  line-height: 1.1;
}

.stat-value--sm {
  font-size: 1.3rem;
}

.stat-unit {
  font-size: 0.9rem;
  color: var(--ink-500, #5B6B7C);
  font-weight: 400;
  margin-left: 2px;
}

.stat-caption {
  font-size: 0.72rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 4px;
}

/* ══════════════ CARDS ══════════════ */
.analytics-card {
  padding: 20px;
  margin-bottom: 16px;
  border-radius: 8px;
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

/* ══════════════ RECOMMENDATION ══════════════ */
.recommendation {
  margin-top: 20px;
  padding: 14px 18px;
  background: #FFF9E6;
  border-left: 3px solid var(--gold-500, #C9A227);
  border-radius: 4px;
}

.rec-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: #8A6A14;
  font-weight: 700;
  margin-bottom: 4px;
}

.recommendation p {
  margin: 0;
  color: var(--ink-900, #1B2733);
  line-height: 1.6;
}

/* ══════════════ FINAL TEST ══════════════ */
.final-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.final-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--paper, #F4F6F8);
  border-radius: 4px;
}

.final-status {
  font-weight: 700;
  font-size: 0.9rem;
}

.final-status--passed {
  color: #15663A;
}

.final-status--pending {
  color: #8A6A14;
}

.final-history {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border, #D8DEE5);
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: var(--ink-500, #5B6B7C);
  margin-bottom: 6px;
}

.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.history-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  padding: 3px 10px;
  background: var(--paper, #F4F6F8);
  border-radius: 12px;
  color: var(--ink-500, #5B6B7C);
}

.history-chip b {
  color: var(--navy-900, #0B1F33);
}

/* ══════════════ TIMELINE ══════════════ */
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: grid;
  grid-template-columns: 14px 1fr 50px;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border, #D8DEE5);
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #B0B8C0;
}

.timeline-dot--passed {
  background: #21ba45;
}

.timeline-dot--failed {
  background: #f2c037;
}

.timeline-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
}

.timeline-meta {
  font-size: 0.75rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 2px;
}

.timeline-score {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  text-align: right;
}

.timeline-score--passed {
  color: #15663A;
}

.timeline-score--failed {
  color: #8A6A14;
}

/* ══════════════ RESET ══════════════ */
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

/* ═════════════════════════════════════════════════════════════
   PDF REPORT TARGET
   ═════════════════════════════════════════════════════════════ */
.analitik-pdf-target {
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

.pdf-table .mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
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

.pdf-callout p {
  margin: 0;
  line-height: 1.5;
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

/* ══════════════ LOADING OVERLAY ══════════════ */
.analitik-loading {
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

.loading-sub {
  font-size: 0.85rem;
  color: var(--ink-500, #5B6B7C);
}

.topbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-ghost-tech {
  color: var(--navy-700, #16324F);
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 4px;
}
</style>
