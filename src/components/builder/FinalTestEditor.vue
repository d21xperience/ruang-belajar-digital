<template>
  <div class="final-test-editor">
    <!-- ══════ METADATA ══════ -->
    <q-card flat bordered class="meta-card q-mb-md">
      <div class="mono-tag q-mb-md">METADATA FINAL TEST</div>
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-4">
          <q-input :model-value="finalTest.id" outlined dense label="ID" hint="contoh: final-test"
            @update:model-value="(v) => updateMeta('id', v)" />
        </div>
        <div class="col-12 col-sm-5">
          <q-input :model-value="finalTest.judul" outlined dense label="Judul Final Test"
            @update:model-value="(v) => updateMeta('judul', v)" />
        </div>
        <div class="col-12 col-sm-3">
          <q-input :model-value="finalTest.passingScore" outlined dense type="number" label="KKM Final Test"
            @update:model-value="(v) => updateMeta('passingScore', Number(v) || 80)" />
        </div>
      </div>
    </q-card>

    <!-- ══════ STATS ══════ -->
    <q-card flat bordered class="stats-card q-mb-md">
      <div class="stats-head">
        <div class="stats-count">
          <span class="mono-tag">TOTAL SOAL</span>
          <span class="stats-number" :class="countMatch ? 'stats-number--ok' : 'stats-number--warn'">
            {{ totalQuestions }}
          </span>
          <span class="stats-target">/ {{ expectedCount }}</span>
        </div>
        <div class="stats-status" :class="countMatch ? 'stats-status--ok' : 'stats-status--warn'">
          <q-icon :name="countMatch ? 'check_circle' : 'warning'" size="18px" />
          <span>{{ countMatch ? 'Sesuai target' : `Target: ${expectedCount} soal` }}</span>
        </div>
      </div>

      <div class="dist-section">
        <div class="mono-tag q-mb-sm">DISTRIBUSI PER MODUL</div>
        <div v-for="d in distribution" :key="d.moduleId" class="dist-row">
          <span class="dist-label">{{ d.label }}</span>
          <div class="dist-bar">
            <div class="dist-bar-fill" :style="{ width: d.percent + '%' }" />
          </div>
          <span class="dist-count">{{ d.count }}</span>
        </div>

        <div v-if="unassignedCount > 0" class="dist-row dist-row--warn">
          <span class="dist-label">⚠ Belum ada modul</span>
          <div class="dist-bar">
            <div class="dist-bar-fill dist-bar-fill--warn"
              :style="{ width: (unassignedCount / Math.max(1, totalQuestions)) * 100 + '%' }" />
          </div>
          <span class="dist-count">{{ unassignedCount }}</span>
        </div>
      </div>
    </q-card>

    <!-- ══════ QUESTIONS ══════ -->
    <q-card flat bordered class="editor-card">
      <QuestionListEditor title="SOAL FINAL" :questions="finalTest.questions || []"
        :passing-score="finalTest.passingScore" :modules="modules" @add="$emit('add-question')"
        @update="(i, payload) => $emit('update-question', i, payload)" @delete="(i) => $emit('delete-question', i)"
        @move-up="(i) => $emit('move-question', i, -1)" @move-down="(i) => $emit('move-question', i, 1)"
        @reorder="(payload) => $emit('reorder-question', payload)" />
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QuestionListEditor from './QuestionListEditor.vue'

const props = defineProps({
  finalTest: { type: Object, required: true },
  modules: { type: Array, default: () => [] },
  expectedCount: { type: Number, default: 35 },
})
const emit = defineEmits([
  'update-meta',
  'add-question',
  'update-question',
  'delete-question',
  'move-question',
  'reorder-question'
])

const totalQuestions = computed(() => (props.finalTest.questions || []).length)
const countMatch = computed(() => totalQuestions.value === props.expectedCount)

const distribution = computed(() => {
  const map = new Map()
  // Inisialisasi semua modul dengan count 0
  for (const mod of props.modules) {
    map.set(mod.id, {
      moduleId: mod.id,
      label: `Modul ${mod.urutan}: ${mod.judulShort || mod.judul}`,
      count: 0,
    })
  }
  // Hitung soal per modul
  for (const q of props.finalTest.questions || []) {
    const entry = map.get(q.moduleId)
    if (entry) entry.count++
  }
  const max = Math.max(1, ...Array.from(map.values()).map((e) => e.count))
  return Array.from(map.values()).map((e) => ({
    ...e,
    percent: Math.round((e.count / max) * 100),
  }))
})

const unassignedCount = computed(() => {
  const validIds = new Set(props.modules.map((m) => m.id))
  return (props.finalTest.questions || []).filter((q) => !validIds.has(q.moduleId)).length
})

function updateMeta(key, value) {
  emit('update-meta', { key, value })
}
</script>

<style scoped>
.final-test-editor {
  padding-bottom: 40px;
}

.meta-card,
.editor-card {
  padding: 16px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

/* Stats card */
.stats-card {
  padding: 16px;
}

.stats-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stats-number {
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}

.stats-number--ok {
  color: #21ba45;
}

.stats-number--warn {
  color: #f2c037;
}

.stats-target {
  color: var(--ink-500, #5B6B7C);
  font-size: 0.9rem;
}

.stats-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  padding: 4px 10px;
  border-radius: 4px;
}

.stats-status--ok {
  background: #E8F7EE;
  color: #15663A;
}

.stats-status--warn {
  background: #FFF4D6;
  color: #8A6A14;
}

/* Distribution */
.dist-section {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border, #D8DEE5);
}

.dist-row {
  display: grid;
  grid-template-columns: 200px 1fr 32px;
  gap: 10px;
  align-items: center;
  margin-top: 6px;
  font-size: 0.82rem;
}

.dist-row--warn {
  color: #8A6A14;
}

.dist-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dist-bar {
  height: 8px;
  background: #E0E6EC;
  border-radius: 4px;
  overflow: hidden;
}

.dist-bar-fill {
  height: 100%;
  background: var(--gold-500, #C9A227);
  transition: width 0.2s;
}

.dist-bar-fill--warn {
  background: #f2c037;
}

.dist-count {
  text-align: right;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
}

@media (max-width: 700px) {
  .dist-row {
    grid-template-columns: 130px 1fr 28px;
    font-size: 0.78rem;
  }
}
</style>
