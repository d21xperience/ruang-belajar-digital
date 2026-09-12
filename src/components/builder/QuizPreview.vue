<template>
  <div class="quiz-preview">
    <!-- Header -->
    <div class="qp-header">
      <h3 class="qp-title">{{ title }}</h3>
      <p class="qp-subtitle">{{ subtitle }}</p>
      <div class="qp-stats">
        <span class="stat-chip">{{ questions.length }} soal</span>
        <span v-if="warnCount > 0" class="stat-chip stat-chip--warn">
          ⚠ {{ warnCount }} masalah
        </span>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="!questions.length" class="qp-empty">
      <q-icon name="quiz" size="32px" color="grey-5" />
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- List soal -->
    <div v-else class="qp-list">
      <div v-for="(q, i) in questions" :key="q.id || i" class="qp-question"
        :class="{ 'qp-question--warn': hasWarning(q) }">
        <!-- Header soal -->
        <div class="qq-head">
          <div class="qq-num">
            <span class="mono-tag">SOAL {{ String(i + 1).padStart(2, '0') }}</span>
            <span v-if="q.concept" class="qq-concept">{{ q.concept }}</span>
            <span v-if="q.difficulty" class="qq-diff" :class="`qq-diff--${q.difficulty}`">
              {{ difficultyLabel(q.difficulty) }}
            </span>
          </div>
          <q-icon v-if="hasWarning(q)" name="warning" size="16px" color="warning">
            <q-tooltip>{{ warningText(q) }}</q-tooltip>
          </q-icon>
        </div>

        <!-- Pertanyaan -->
        <div class="qq-text" :class="{ 'qq-text--empty': !q.pertanyaan?.trim() }">
          {{ q.pertanyaan?.trim() || '(Pertanyaan belum diisi)' }}
        </div>

        <!-- Opsi -->
        <div v-if="q.options?.length" class="qq-options">
          <div v-for="opt in q.options" :key="opt.id" class="qq-option" :class="{
            'qq-option--correct': showAnswers && opt.id === q.correctOptionId,
            'qq-option--empty': !opt.text?.trim(),
          }">
            <span class="qq-marker">{{ opt.id }}</span>
            <span class="qq-opt-text">
              {{ opt.text?.trim() || '(kosong)' }}
            </span>
            <q-icon v-if="showAnswers && opt.id === q.correctOptionId" name="check_circle" size="18px"
              color="positive" />
          </div>
        </div>
        <div v-else class="qq-options-empty">(belum ada opsi jawaban)</div>

        <!-- Pembahasan (hanya tampil jika showAnswers) -->
        <div v-if="showAnswers" class="qq-pembahasan">
          <div class="mono-tag">PEMBAHASAN</div>
          <p :class="{ 'qq-pembahasan--empty': !q.pembahasan?.trim() }">
            {{ q.pembahasan?.trim() || '(belum ada pembahasan)' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  questions: { type: Array, required: true },
  showAnswers: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'Belum ada soal.' },
})

const warnCount = computed(() =>
  props.questions.filter((q) => hasWarning(q)).length
)

function hasWarning(q) {
  if (!q.pertanyaan?.trim()) return true
  if (!q.options?.length) return true
  if (q.options.some((o) => !o.text?.trim())) return true
  if (!q.correctOptionId) return true
  return false
}

function warningText(q) {
  const issues = []
  if (!q.pertanyaan?.trim()) issues.push('pertanyaan kosong')
  if (!q.options?.length) issues.push('tidak ada opsi')
  else if (q.options.some((o) => !o.text?.trim())) issues.push('ada opsi kosong')
  if (!q.correctOptionId) issues.push('jawaban benar belum dipilih')
  return issues.join(', ')
}

function difficultyLabel(d) {
  return { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' }[d] || d
}
</script>

<style scoped>
.quiz-preview {
  padding: 16px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

/* Header */
.qp-header {
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--gold-500, #C9A227);
}

.qp-title {
  font-size: 1.2rem;
  color: var(--navy-900, #0B1F33);
  margin: 0 0 4px;
}

.qp-subtitle {
  color: var(--ink-500, #5B6B7C);
  font-size: 0.85rem;
  margin: 0 0 10px;
}

.qp-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stat-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  padding: 3px 10px;
  background: var(--paper, #F4F6F8);
  border-radius: 12px;
  color: var(--ink-500, #5B6B7C);
}

.stat-chip--warn {
  background: #FFF4D6;
  color: #8A6A14;
}

/* Empty */
.qp-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
}

.qp-empty p {
  margin: 12px 0 0;
  font-size: 0.9rem;
}

/* List soal */
.qp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qp-question {
  padding: 14px 16px;
  background: var(--paper, #F4F6F8);
  border: 1px solid transparent;
  border-left: 3px solid var(--gold-500, #C9A227);
  border-radius: 4px;
}

.qp-question--warn {
  border-left-color: #F2C037;
  background: #FFFCF3;
}

/* Header soal */
.qq-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.qq-num {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.qq-concept {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: var(--gold-100, #F3E7C4);
  color: #8A6A14;
  border-radius: 3px;
}

.qq-diff {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.qq-diff--easy {
  background: #E8F7EE;
  color: #15663A;
}

.qq-diff--medium {
  background: #FFF4D6;
  color: #8A6A14;
}

.qq-diff--hard {
  background: #FCE4E4;
  color: #A6403F;
}

/* Pertanyaan */
.qq-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
  line-height: 1.5;
  margin-bottom: 12px;
}

.qq-text--empty {
  font-style: italic;
  color: var(--ink-500, #5B6B7C);
  font-weight: 400;
}

/* Opsi */
.qq-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qq-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 4px;
  font-size: 0.92rem;
  transition: background 0.15s;
}

.qq-option--correct {
  background: #E8F7EE;
  border-color: #21ba45;
  font-weight: 600;
}

.qq-option--empty {
  font-style: italic;
  color: var(--ink-500, #5B6B7C);
}

.qq-marker {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper, #F4F6F8);
  border-radius: 3px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--navy-700, #16324F);
}

.qq-option--correct .qq-marker {
  background: #21ba45;
  color: #fff;
}

.qq-opt-text {
  flex: 1;
}

.qq-options-empty {
  padding: 10px;
  color: var(--red-500, #A6403F);
  font-style: italic;
  font-size: 0.85rem;
  background: var(--red-100, #F1DCDB);
  border-radius: 3px;
}

/* Pembahasan */
.qq-pembahasan {
  margin-top: 12px;
  padding: 12px 14px;
  background: #fff;
  border-left: 3px solid var(--navy-700, #16324F);
  border-radius: 3px;
}

.qq-pembahasan p {
  margin: 6px 0 0;
  line-height: 1.6;
  font-size: 0.9rem;
}

.qq-pembahasan--empty {
  font-style: italic;
  color: var(--ink-500, #5B6B7C);
}
</style>
