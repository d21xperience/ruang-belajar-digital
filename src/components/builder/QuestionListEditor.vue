<template>
  <div class="question-list-editor">
    <div class="list-head">
      <span class="mono-tag">{{ title }} ({{ questions.length }})</span>
      <q-btn outline dense size="sm" icon="add" label="Tambah Soal" @click="$emit('add')" />
    </div>

    <div v-if="passingScore !== undefined" class="kkm-note">
      KKM untuk bagian ini: <b>{{ passingScore }}</b>
    </div>

    <div v-if="!questions.length" class="empty-note">
      Belum ada soal. Klik "Tambah Soal" untuk memulai.
    </div>

    <!-- ═══════ DRAGGABLE ═══════ -->
    <VueDraggable v-else v-model="localQuestions" :animation="180" :delay="120" :delay-on-touch-only="true"
      :touch-start-threshold="8" handle=".question-drag-handle" ghost-class="question-ghost" drag-class="question-drag"
      chosen-class="question-chosen" @end="onDragEnd">
      <div v-for="(q, i) in localQuestions" :key="q.id || i" class="question-wrapper">
        <QuestionCard :question="q" :index="i" :is-last="i === localQuestions.length - 1"
          :default-opened="i === 0 && localQuestions.length === 1" :modules="modules"
          @update="(payload) => $emit('update', i, payload)" @delete="$emit('delete', i)" @move-up="$emit('move-up', i)"
          @move-down="$emit('move-down', i)" />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import QuestionCard from './QuestionCard.vue'

const props = defineProps({
  title: { type: String, default: 'Soal' },
  questions: { type: Array, required: true },
  passingScore: { type: Number, default: undefined },
  modules: { type: Array, default: null },
})
const emit = defineEmits(['add', 'update', 'delete', 'move-up', 'move-down', 'reorder'])

// Local mirror untuk v-model
const localQuestions = ref([...props.questions])
watch(
  () => props.questions,
  (val) => { localQuestions.value = [...val] },
)

// Drag end → emit reorder ke parent
function onDragEnd(evt) {
  const { oldIndex, newIndex } = evt
  if (oldIndex === newIndex || oldIndex == null || newIndex == null) return
  emit('reorder', { from: oldIndex, to: newIndex })
}
</script>

<style scoped>
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.kkm-note {
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
  margin-bottom: 10px;
}

.empty-note {
  padding: 20px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-500, #5B6B7C);
  background: var(--paper, #F4F6F8);
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
}

/* Wrapper tiap soal */
.question-wrapper {
  margin-bottom: 8px;
  touch-action: manipulation;
}

/* ══════ Drag state classes ══════ */
.question-ghost {
  opacity: 0.35;
  background: var(--gold-100, #F3E7C4);
  border: 1px dashed var(--gold-500, #C9A227);
  border-radius: 6px;
}

.question-drag {
  opacity: 1;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.question-chosen {
  cursor: grabbing;
}
</style>
