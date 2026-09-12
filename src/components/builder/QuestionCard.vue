<template>
  <q-expansion-item class="question-card" :default-opened="defaultOpened">
    <template #header>
      <!-- <q-item-section avatar>
        <span class="mono-tag">{{ String(index + 1).padStart(2, '0') }}</span>
      </q-item-section> -->
      <q-item-section avatar class="question-drag-handle" style="cursor: grab">
        <q-icon name="drag_indicator" size="18px" />
        <span class="mono-tag q-ml-xs">{{ String(index + 1).padStart(2, '0') }}</span>
      </q-item-section>
      <q-item-section>
        <q-item-label class="q-title">
          {{ question.pertanyaan ? truncate(question.pertanyaan, 70) : '(Pertanyaan kosong)' }}
        </q-item-label>
        <q-item-label caption class="q-id">{{ question.id }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="q-controls" @click.stop>
          <q-btn flat dense round size="sm" icon="arrow_upward" :disable="index === 0" @click="$emit('move-up')"
            aria-label="Naik" />
          <q-btn flat dense round size="sm" icon="arrow_downward" :disable="isLast" @click="$emit('move-down')"
            aria-label="Turun" />
          <q-btn flat dense round size="sm" icon="delete" color="negative" @click="$emit('delete')"
            aria-label="Hapus" />
        </div>
      </q-item-section>
    </template>

    <div class="q-body">
      <div class="row q-col-gutter-sm">
        <!-- ══════ BARU: selector modul (hanya saat prop modules di-pass) ══════ -->
        <div v-if="hasModules" class="col-12">
          <q-select :model-value="question.moduleId" outlined dense label="Modul Terkait (untuk analisis hasil belajar)"
            :options="moduleOptions" emit-value map-options @update:model-value="(v) => update('moduleId', v)" />
        </div>
        <div class="col-12 col-sm-5">
          <q-input :model-value="question.id" outlined dense label="ID Soal" hint="contoh: q-pt-06-01"
            @update:model-value="(v) => update('id', v)" />
        </div>
        <div class="col-12 col-sm-4">
          <q-input :model-value="question.concept" outlined dense label="Konsep" hint="contoh: Mpu Tantular"
            @update:model-value="(v) => update('concept', v)" />
        </div>
        <div class="col-12 col-sm-3">
          <q-select :model-value="question.difficulty" outlined dense label="Kesulitan" :options="difficultyOptions"
            emit-value map-options @update:model-value="(v) => update('difficulty', v)" />
        </div>

        <div class="col-12">
          <q-input :model-value="question.pertanyaan" outlined dense type="textarea" autogrow label="Pertanyaan"
            @update:model-value="(v) => update('pertanyaan', v)" />
        </div>

        <div class="col-12">
          <div class="field-label">
            Pilihan Jawaban
            <span class="field-hint">— klik huruf untuk menandai jawaban benar</span>
          </div>
          <div v-for="(opt, i) in question.options" :key="i" class="option-row">
            <q-btn round dense size="md" :color="question.correctOptionId === opt.id ? 'positive' : 'grey-5'"
              :label="opt.id" class="option-marker" @click="update('correctOptionId', opt.id)"
              :aria-label="`Tandai ${opt.id} sebagai jawaban benar`" />
            <q-input :model-value="opt.text" outlined dense :label="`Pilihan ${opt.id}`" class="option-input"
              @update:model-value="(v) => updateOption(i, v)" />
            <q-btn flat dense round size="sm" icon="delete" color="negative" :disable="question.options.length <= 2"
              @click="removeOption(i)" aria-label="Hapus pilihan" />
          </div>
          <q-btn outline dense size="sm" icon="add" label="Tambah Pilihan" :disable="question.options.length >= 6"
            class="q-mt-sm" @click="addOption" />
        </div>

        <div class="col-12">
          <q-input :model-value="question.pembahasan" outlined dense type="textarea" autogrow label="Pembahasan"
            hint="Mengapa jawaban ini yang benar?" @update:model-value="(v) => update('pembahasan', v)" />
        </div>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  isLast: { type: Boolean, default: false },
  defaultOpened: { type: Boolean, default: false },
})
const emit = defineEmits(['update', 'delete', 'move-up', 'move-down'])

const difficultyOptions = [
  { label: 'Mudah', value: 'easy' },
  { label: 'Sedang', value: 'medium' },
  { label: 'Sulit', value: 'hard' },
]

// ══════ BARU ══════
const hasModules = computed(() => Array.isArray(props.modules) && props.modules.length > 0)
const moduleOptions = computed(() =>
  (props.modules || []).map((m) => ({
    label: `Modul ${m.urutan}: ${m.judulShort || m.judul}`,
    value: m.id,
  }))
)

function update(key, value) {
  emit('update', { key, value })
}

function updateOption(i, text) {
  const next = [...props.question.options]
  next[i] = { ...next[i], text }
  emit('update', { key: 'options', value: next })
}

function addOption() {
  const used = new Set(props.question.options.map((o) => o.id))
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']
  const nextLetter = letters.find((l) => !used.has(l))
  if (!nextLetter) return
  const next = [...props.question.options, { id: nextLetter, text: '' }]
  emit('update', { key: 'options', value: next })
}

function removeOption(i) {
  if (props.question.options.length <= 2) return
  const next = [...props.question.options]
  const removed = next.splice(i, 1)[0]
  // Jika opsi yang dihapus adalah jawaban benar, reset ke opsi pertama
  const updates = { options: next }
  if (props.question.correctOptionId === removed.id) {
    updates.correctOptionId = next[0]?.id || ''
  }
  emit('update', updates)
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str
}
</script>

<style scoped>
/* Drag handle */
.question-drag-handle {
  display: flex !important;
  align-items: center;
  min-width: 48px !important;
  color: var(--ink-500, #5B6B7C);
}

.question-drag-handle:active {
  cursor: grabbing;
}



.question-card {
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
}

.q-title {
  font-weight: 600;
  font-size: 0.88rem;
}

.q-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
}

.q-controls {
  display: flex;
  gap: 2px;
}

.q-body {
  padding: 16px;
  background: #FAFBFC;
  border-top: 1px solid var(--border, #D8DEE5);
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: var(--ink-500, #5B6B7C);
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--ink-900, #1B2733);
}

.field-hint {
  font-weight: 400;
  color: var(--ink-500, #5B6B7C);
  font-size: 0.75rem;
}

.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.option-marker {
  flex-shrink: 0;
  font-family: 'IBM Plex Mono', monospace;
}

.option-input {
  flex: 1;
}
</style>
