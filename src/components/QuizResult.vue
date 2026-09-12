<template>
  <div class="quiz-result" :class="passed ? 'quiz-result--passed' : 'quiz-result--failed'">
    <q-icon :name="passed ? 'stars' : 'refresh'" size="44px" class="quiz-result__icon" />
    <div class="quiz-result__score">{{ result.score }}</div>
    <div class="quiz-result__label">
      {{ passed ? 'Selamat, Anda lulus!' : 'Belum mencapai KKM' }}
    </div>
    <div class="quiz-result__meta">
      <span>Benar: <b>{{ result.correct }}</b></span>
      <span>Salah: <b>{{ result.wrong }}</b></span>
      <span>Total: <b>{{ result.total }}</b></span>
      <span>KKM: <b>{{ result.passingScore }}</b></span>
    </div>

    <p class="quiz-result__desc">
      {{ passed
        ? 'Modul berikutnya telah terbuka di beranda.'
        : 'Pelajari kembali materi yang belum dipahami, lalu coba lagi.' }}
    </p>

    <!-- Analisis per modul (untuk final test) -->
    <div v-if="showAnalysis && perModule.length" class="quiz-result__analysis">
      <div class="mono-tag">PENGUASAAN PER MODUL</div>
      <div v-for="m in perModule" :key="m.moduleId" class="analysis-row">
        <span class="analysis-label">{{ m.label }}</span>
        <div class="analysis-bar">
          <div class="analysis-bar__fill" :style="{ width: m.percent + '%' }"></div>
        </div>
        <span class="analysis-percent">{{ m.percent }}%</span>
      </div>
    </div>

    <!-- Daftar soal salah (collapsible) -->
    <q-expansion-item v-if="wrongDetails.length" class="quiz-result__wrong" icon="fact_check"
      label="Lihat soal yang salah" caption="Beserta jawaban benar dan pembahasan" header-class="text-weight-bold">
      <div class="wrong-list">
        <div v-for="d in wrongDetails" :key="d.questionId" class="wrong-item">
          <div class="wrong-item__q">{{ d.question }}</div>
          <div class="wrong-item__ans">
            <span class="wrong">Jawaban Anda: <b>{{ d.userOptionId || '—' }}</b></span>
            <span class="correct">Jawaban benar: <b>{{ d.correctOptionId }}</b></span>
          </div>
          <div class="wrong-item__exp"><b>Pembahasan:</b> {{ d.pembahasan }}</div>
        </div>
      </div>
    </q-expansion-item>

    <div class="quiz-result__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import contentRepo from '../repositories/contentRepository'

const props = defineProps({
  result: { type: Object, required: true },
  showAnalysis: { type: Boolean, default: false },
})

const passed = computed(() => props.result.passed)
const wrongDetails = computed(() => props.result.details.filter((d) => !d.isCorrect))

const perModule = computed(() => {
  if (!props.showAnalysis) return []
  const map = new Map()
  for (const d of props.result.details) {
    const mid = d.moduleId || 'unknown'
    if (!map.has(mid)) map.set(mid, { moduleId: mid, correct: 0, total: 0 })
    const entry = map.get(mid)
    entry.total++
    if (d.isCorrect) entry.correct++
  }
  return [...map.values()]
    .map((e) => {
      const mod = contentRepo.getModuleById(e.moduleId)
      return {
        moduleId: e.moduleId,
        label: mod ? `Modul ${mod.urutan}` : e.moduleId,
        percent: e.total ? Math.round((e.correct / e.total) * 100) : 0,
      }
    })
    .sort((a, b) => a.moduleId.localeCompare(b.moduleId))
})
</script>

<style scoped>
.quiz-result {
  text-align: center;
  padding: 24px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.quiz-result--passed {
  border-left: 4px solid var(--gold-500);
}

.quiz-result--failed {
  border-left: 4px solid var(--red-500);
}

.quiz-result__icon {
  color: var(--gold-500);
  margin-bottom: 8px;
}

.quiz-result--failed .quiz-result__icon {
  color: var(--red-500);
}

.quiz-result__score {
  font-size: 3rem;
  font-weight: 700;
  color: var(--navy-900);
  line-height: 1;
}

.quiz-result__label {
  font-weight: 600;
  margin-top: 6px;
}

.quiz-result__meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 14px;
  font-size: 0.85rem;
  color: var(--ink-500);
}

.quiz-result__desc {
  margin-top: 16px;
  color: var(--ink-500);
  line-height: 1.6;
}

.quiz-result__analysis {
  margin-top: 20px;
  text-align: left;
  padding: 16px;
  background: var(--paper);
  border-radius: 6px;
}

.analysis-row {
  display: grid;
  grid-template-columns: 70px 1fr 44px;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
  font-size: 0.85rem;
}

.analysis-bar {
  height: 8px;
  background: #E0E6EC;
  border-radius: 4px;
  overflow: hidden;
}

.analysis-bar__fill {
  height: 100%;
  background: var(--gold-500);
  transition: width 0.3s;
}

.analysis-percent {
  text-align: right;
  font-weight: 600;
  color: var(--navy-900);
}

.quiz-result__wrong {
  margin-top: 16px;
  text-align: left;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}

.wrong-item {
  padding: 12px;
  background: var(--paper);
  border-radius: 4px;
  border-left: 3px solid var(--red-500);
}

.wrong-item__q {
  font-weight: 600;
  margin-bottom: 6px;
}

.wrong-item__ans {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.wrong-item__ans .wrong {
  color: var(--red-500);
}

.wrong-item__ans .correct {
  color: #21ba45;
}

.wrong-item__exp {
  font-size: 0.85rem;
  color: var(--ink-500);
  line-height: 1.5;
}

.quiz-result__actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}
</style>
