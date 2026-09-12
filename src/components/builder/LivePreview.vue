<template>
  <div class="live-preview">
    <!-- ══════ HEADER MODUL ══════ -->
    <q-card flat bordered class="preview-header">
      <div class="ph-top">
        <div class="mono-tag">👁️ PREVIEW MODE — Tampilan Siswa</div>
        <div class="ph-warn" v-if="warningCount > 0">
          <q-icon name="warning" size="16px" />
          {{ warningCount }} peringatan
        </div>
      </div>
      <h2 class="ph-title">{{ activeModule.judul || '(Judul belum diisi)' }}</h2>
      <p v-if="activeModule.deskripsi" class="ph-desc">{{ activeModule.deskripsi }}</p>

      <div class="ph-meta">
        <span class="meta-chip">ID: {{ activeModule.id }}</span>
        <span class="meta-chip">Urutan: {{ activeModule.urutan }}</span>
        <span class="meta-chip">KKM: {{ activeModule.passingScore ?? 80 }}</span>
        <span class="meta-chip">{{ activeModule.sections?.length || 0 }} section</span>
      </div>

      <div v-if="activeModule.tujuanPembelajaran?.length" class="ph-tujuan">
        <div class="mono-tag">TUJUAN PEMBELAJARAN</div>
        <ul>
          <li v-for="(t, i) in activeModule.tujuanPembelajaran" :key="i">{{ t }}</li>
        </ul>
      </div>
    </q-card>

    <!-- ══════ CONTROLS ══════ -->
    <div class="preview-controls">
      <q-toggle v-model="showAnswers" dense label="Tampilkan kunci jawaban (mode penulis)" color="positive" />
      <div v-if="showAnswers" class="controls-hint">
        Kunci jawaban akan ditandai dengan ✅
      </div>
    </div>

    <!-- ══════ SUB-TABS ══════ -->
    <q-tabs v-model="previewTab" dense align="left" class="preview-tabs">
      <q-tab name="materi" icon="menu_book" label="Materi" />
      <q-tab name="free" icon="quiz" label="Free Test" />
      <q-tab name="post" icon="assignment" label="Post Test" />
    </q-tabs>

    <q-tab-panels v-model="previewTab" animated keep-alive>
      <!-- ═══════════════ TAB MATERI ═══════════════ -->
      <q-tab-panel name="materi" class="panel-no-pad">
        <div v-if="!sections.length" class="empty-preview">
          <q-icon name="menu_book" size="32px" color="grey-5" />
          <p>Belum ada section. Tambahkan section di Form Editor.</p>
        </div>

        <div v-else class="materi-layout">
          <!-- Sidebar daftar section -->
          <aside class="section-nav">
            <div v-for="(sec, i) in sections" :key="sec.id || i" class="section-nav-item"
              :class="{ 'section-nav-item--active': i === activeSectionIndex }" @click="activeSectionIndex = i">
              <span class="sn-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="sn-title">{{ sec.judul || '(Tanpa judul)' }}</span>
              <q-icon v-if="!sec.konten || !hasContent(sec)" name="warning" size="14px" color="warning" class="sn-warn">
                <q-tooltip>Konten masih kosong</q-tooltip>
              </q-icon>
            </div>
          </aside>

          <!-- Konten utama -->
          <article v-if="currentSection" class="section-content">
            <div class="sc-head">
              <div class="mono-tag">
                BAGIAN {{ activeSectionIndex + 1 }} DARI {{ sections.length }}
              </div>
              <h3 class="sc-title">{{ currentSection.judul || '(Tanpa judul)' }}</h3>
            </div>

            <!-- Render blok multimedia -->
            <div v-if="normalizedBlocks.length" class="sc-body">
              <MateriRenderer :blocks="normalizedBlocks" />
            </div>
            <div v-else class="sc-empty">
              <q-icon name="article" size="24px" color="grey-5" />
              Konten section ini masih kosong.
            </div>

            <!-- Poin Penting -->
            <div v-if="currentSection.poinPenting?.length" class="sc-callout">
              <div class="mono-tag">POIN PENTING</div>
              <ul>
                <li v-for="(p, i) in currentSection.poinPenting" :key="i">{{ p }}</li>
              </ul>
            </div>

            <!-- Kata Kunci -->
            <div v-if="currentSection.kataKunci?.length" class="sc-keywords">
              <div class="mono-tag">KATA KUNCI</div>
              <div class="keyword-list">
                <span v-for="(kw, i) in currentSection.kataKunci" :key="i" class="keyword-tag">{{ kw }}</span>
              </div>
            </div>
          </article>
        </div>
      </q-tab-panel>

      <!-- ═══════════════ TAB FREE TEST ═══════════════ -->
      <q-tab-panel name="free">
        <QuizPreview :title="'Free Test'" :subtitle="'Tes diagnostik — tidak menentukan kelulusan modul'"
          :questions="activeModule.freeTest?.questions || []" :show-answers="showAnswers"
          :empty-message="'Belum ada soal Free Test. Tambahkan di Form Editor bagian Free Test.'" />
      </q-tab-panel>

      <!-- ═══════════════ TAB POST TEST ═══════════════ -->
      <q-tab-panel name="post">
        <QuizPreview :title="'Post Test'"
          :subtitle="`Tes penguasaan — KKM ${activeModule.postTest?.passingScore ?? activeModule.passingScore ?? 80}`"
          :questions="activeModule.postTest?.questions || []" :show-answers="showAnswers"
          :empty-message="'Belum ada soal Post Test. Tambahkan di Form Editor bagian Post Test.'" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import 'katex/dist/katex.min.css'
import MateriRenderer from '../materi/MateriRenderer.vue'
import QuizPreview from './QuizPreview.vue'
import { normalizeContent } from '../../utils/contentNormalizer'

const props = defineProps({
  activeModule: { type: Object, required: true },
})

// ══════ State ══════
const previewTab = ref('materi')
const showAnswers = ref(false)
const activeSectionIndex = ref(0)

// ══════ Computed ══════
const sections = computed(() => props.activeModule.sections || [])

const currentSection = computed(() => sections.value[activeSectionIndex.value] || null)

const normalizedBlocks = computed(() => {
  if (!currentSection.value) return []
  return normalizeContent(currentSection.value.konten).map((b, i) => ({
    ...b,
    _id: b._id || `preview-${i}`,
  }))
})

// Cek apakah section punya konten
function hasContent(sec) {
  if (!sec.konten) return false
  if (typeof sec.konten === 'string') return sec.konten.trim().length > 0
  if (Array.isArray(sec.konten)) {
    return sec.konten.some((item) => {
      if (typeof item === 'string') return item.trim().length > 0
      if (item?.type === 'divider') return true
      return item?.text || item?.src || item?.items?.length || item?.rows?.length
    })
  }
  return false
}

// Hitung peringatan di seluruh modul
const warningCount = computed(() => {
  let count = 0
  // Section kosong
  for (const sec of sections.value) {
    if (!hasContent(sec)) count++
  }
  // Soal Free Test
  for (const q of props.activeModule.freeTest?.questions || []) {
    if (!q.pertanyaan?.trim()) count++
    if (!q.options?.length || q.options.some((o) => !o.text?.trim())) count++
    if (!q.correctOptionId) count++
  }
  // Soal Post Test
  for (const q of props.activeModule.postTest?.questions || []) {
    if (!q.pertanyaan?.trim()) count++
    if (!q.options?.length || q.options.some((o) => !o.text?.trim())) count++
    if (!q.correctOptionId) count++
  }
  return count
})

// Reset section index kalau modul berubah
watch(() => props.activeModule.id, () => {
  activeSectionIndex.value = 0
  previewTab.value = 'materi'
})
</script>

<style scoped>
.live-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ══════ Header Modul ══════ */
.preview-header {
  padding: 20px;
  background: linear-gradient(135deg, #F4F6F8 0%, #FFFFFF 100%);
  border-left: 4px solid var(--gold-500, #C9A227);
}

.ph-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ph-warn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: #8A6A14;
  background: #FFF4D6;
  padding: 3px 10px;
  border-radius: 12px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.ph-title {
  font-size: 1.4rem;
  color: var(--navy-900, #0B1F33);
  margin: 0 0 6px;
  line-height: 1.3;
}

.ph-desc {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  margin: 0 0 12px;
}

.ph-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.meta-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  padding: 3px 10px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 12px;
  color: var(--ink-500, #5B6B7C);
}

.ph-tujuan {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fff;
  border-left: 3px solid var(--gold-500, #C9A227);
  border-radius: 4px;
}

.ph-tujuan ul {
  margin: 6px 0 0;
  padding-left: 20px;
  line-height: 1.65;
}

/* ══════ Controls ══════ */
.preview-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

.controls-hint {
  font-size: 0.75rem;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
}

/* ══════ Sub-Tabs ══════ */
.preview-tabs {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

:deep(.panel-no-pad) {
  padding: 0;
}

/* ══════ Layout Materi ══════ */
.materi-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  min-height: 400px;
}

/* Section nav */
.section-nav {
  border-right: 1px solid var(--border, #D8DEE5);
  padding-right: 12px;
}

.section-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-bottom: 4px;
  transition: background 0.15s;
}

.section-nav-item:hover {
  background: var(--paper, #F4F6F8);
}

.section-nav-item--active {
  background: var(--gold-100, #F3E7C4);
  color: #8A6A14;
  font-weight: 600;
}

.sn-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: var(--ink-500, #5B6B7C);
}

.sn-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sn-warn {
  flex-shrink: 0;
}

/* Section content */
.section-content {
  padding-left: 4px;
  min-width: 0;
}

.sc-head {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--gold-500, #C9A227);
}

.sc-title {
  font-size: 1.25rem;
  color: var(--navy-900, #0B1F33);
  margin: 4px 0 0;
}

.sc-body {
  line-height: 1.75;
}

.sc-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
  background: var(--paper, #F4F6F8);
  border-radius: 4px;
  font-size: 0.9rem;
}

.sc-callout {
  margin-top: 24px;
  padding: 14px 18px;
  background: var(--paper, #F4F6F8);
  border-left: 3px solid var(--gold-500, #C9A227);
  border-radius: 4px;
}

.sc-callout ul {
  margin: 6px 0 0;
  padding-left: 20px;
  line-height: 1.7;
}

.sc-keywords {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px dashed var(--border, #D8DEE5);
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
  background: var(--gold-100, #F3E7C4);
  color: #8A6A14;
  border-radius: 12px;
}

/* ══════ Empty ══════ */
.empty-preview {
  padding: 60px 20px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  background: #fff;
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
}

.empty-preview p {
  margin: 12px 0 0;
}

/* ══════ Responsive ══════ */
@media (max-width: 800px) {
  .materi-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .section-nav {
    border-right: none;
    border-bottom: 1px solid var(--border, #D8DEE5);
    padding-right: 0;
    padding-bottom: 12px;
    max-height: 180px;
    overflow-y: auto;
  }
}
</style>
