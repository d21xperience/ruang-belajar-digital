<template>
  <div class="subject-card" :style="{ '--subject-color': subject.color }">
    <!-- Icon & judul -->
    <div class="sc-head">
      <div class="sc-icon">
        <q-icon :name="subject.icon" size="28px" />
      </div>
      <div class="sc-title-wrap">
        <h3 class="sc-title">{{ subject.judul }}</h3>
        <div class="sc-tingkat">{{ subject.metadata?.tingkat || 'Umum' }}</div>
      </div>
    </div>

    <!-- Deskripsi -->
    <p class="sc-desc">{{ subject.deskripsi }}</p>

    <!-- Stats -->
    <div class="sc-stats">
      <div class="sc-stat">
        <span class="sc-stat-num">{{ moduleCount }}</span>
        <span class="sc-stat-label">Modul</span>
      </div>
      <div class="sc-stat-divider" />
      <div class="sc-stat">
        <span class="sc-stat-num">{{ finalQuestionCount }}</span>
        <span class="sc-stat-label">Soal Final</span>
      </div>
      <div class="sc-stat-divider" />
      <div class="sc-stat">
        <span class="sc-stat-num">{{ passingScore }}</span>
        <span class="sc-stat-label">KKM</span>
      </div>
    </div>

    <!-- Preview modul (jika ada) -->
    <div v-if="previewModules.length" class="sc-preview">
      <div class="sc-preview-label">Isi modul:</div>
      <ul class="sc-preview-list">
        <li v-for="mod in previewModules" :key="mod.id">
          <span class="sc-preview-num">{{ String(mod.urutan).padStart(2, '0') }}</span>
          <span class="sc-preview-name">{{ mod.judulShort || mod.judul }}</span>
        </li>
      </ul>
    </div>
    <div v-else class="sc-preview sc-preview--empty">
      <q-icon name="hourglass_empty" size="16px" />
      Konten sedang disiapkan
    </div>

    <!-- CTA -->
    <button type="button" class="sc-cta" :disabled="!hasContent" @click="onClick">
      <span>{{ hasContent ? 'Jelajahi' : 'Segera Hadir' }}</span>
      <q-icon v-if="hasContent" name="arrow_forward" size="18px" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import contentRepo from '../../repositories/contentRepository'
import LEARNING_CONFIG from '../../config/learning.js'

const props = defineProps({
  subject: { type: Object, required: true },
})

const emit = defineEmits(['select'])

const modules = computed(() => contentRepo.getModulesBySubject(props.subject.id))

const moduleCount = computed(() => modules.value.length)

const finalQuestionCount = computed(() => {
  const meta = contentRepo.getFinalTestMeta(props.subject.id)
  return meta?.totalQuestions || 0
})

const passingScore = computed(() => {
  const meta = contentRepo.getFinalTestMeta(props.subject.id)
  return meta?.passingScore ?? LEARNING_CONFIG.passingScore
})

const previewModules = computed(() => modules.value.slice(0, 3))

const hasContent = computed(() => modules.value.length > 0)

function onClick() {
  if (!hasContent.value) return
  emit('select', props.subject.id)
}
</script>

<style scoped>
.subject-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #FFFFFF;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 12px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.subject-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--subject-color, #C9A227);
}

.subject-card:hover {
  border-color: var(--subject-color, #C9A227);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

/* ═══ Head ═══ */
.sc-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.sc-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--subject-color, #C9A227) 15%, transparent);
  color: var(--subject-color, #C9A227);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-title-wrap {
  flex: 1;
  min-width: 0;
}

.sc-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
  margin: 0 0 2px;
  line-height: 1.3;
}

.sc-tingkat {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: var(--ink-500, #5B6B7C);
  letter-spacing: 0.04em;
}

/* ═══ Deskripsi ═══ */
.sc-desc {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--ink-500, #5B6B7C);
  margin: 0 0 16px;
  flex: 1;
}

/* ═══ Stats ═══ */
.sc-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  margin-bottom: 14px;
  border-top: 1px dashed var(--border, #D8DEE5);
  border-bottom: 1px dashed var(--border, #D8DEE5);
}

.sc-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sc-stat-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
}

.sc-stat-label {
  font-size: 0.68rem;
  color: var(--ink-500, #5B6B7C);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sc-stat-divider {
  width: 1px;
  height: 24px;
  background: var(--border, #D8DEE5);
}

/* ═══ Preview ═══ */
.sc-preview {
  margin-bottom: 16px;
}

.sc-preview-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--ink-500, #5B6B7C);
  margin-bottom: 6px;
}

.sc-preview-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sc-preview-list li {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 0.8rem;
}

.sc-preview-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: var(--subject-color, #C9A227);
  font-weight: 700;
}

.sc-preview-name {
  color: var(--ink-900, #1B2733);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-preview--empty {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 10px 12px;
  background: var(--paper, #F4F6F8);
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
}

/* ═══ CTA ═══ */
.sc-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px 16px;
  background: var(--subject-color, #C9A227);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  min-height: 44px;
}

.sc-cta:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.sc-cta:active:not(:disabled) {
  transform: translateY(0);
}

.sc-cta:focus-visible {
  outline: 2px solid var(--navy-900, #0B1F33);
  outline-offset: 2px;
}

.sc-cta:disabled {
  background: var(--border, #D8DEE5);
  color: var(--ink-500, #5B6B7C);
  cursor: not-allowed;
}
</style>
