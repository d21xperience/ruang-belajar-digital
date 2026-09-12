<template>
  <div class="section-list-editor">
    <div class="list-head">
      <span class="mono-tag">SECTIONS ({{ sections.length }})</span>
      <q-btn outline dense size="sm" icon="add" label="Tambah Section"
        @click="$emit('add')" />
    </div>

    <div v-if="!sections.length" class="empty-note">
      Belum ada section. Klik "Tambah Section" untuk memulai.
    </div>

    <!-- ═══════════ DRAGGABLE (vue-draggable-plus) ═══════════ -->
    <VueDraggable
      v-else
      v-model="localSections"
      :animation="180"
      :delay="120"
      :delay-on-touch-only="true"
      :touch-start-threshold="8"
      handle=".section-drag-handle"
      ghost-class="section-ghost"
      drag-class="section-drag"
      chosen-class="section-chosen"
      @end="onDragEnd"
    >
      <div
        v-for="(sec, i) in localSections"
        :key="sec.id || i"
        class="section-wrapper"
      >
        <SectionCard
          :section="sec"
          :index="i"
          :is-last="i === sections.length - 1"
          :default-opened="i === 0 && sections.length === 1"
          @update="(payload) => $emit('update', i, payload)"
          @delete="$emit('delete', i)"
          @move-up="$emit('move-up', i)"
          @move-down="$emit('move-down', i)"
        />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import SectionCard from './SectionCard.vue'

const props = defineProps({
  sections: { type: Array, required: true },
})
const emit = defineEmits(['add', 'update', 'delete', 'move-up', 'move-down', 'reorder'])

// ══════ Local mirror untuk v-model ══════
// vue-draggable-plus memutasi array saat reorder — pakai local copy
// agar tidak memutasi props langsung.
const localSections = ref([...props.sections])

watch(
  () => props.sections,
  (val) => {
    localSections.value = [...val]
  },
)

// ══════ Drag end handler ══════
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
.empty-note {
  padding: 20px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-500, #5B6B7C);
  background: var(--paper, #F4F6F8);
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
}

/* Wrapper tiap section */
.section-wrapper {
  margin-bottom: 8px;
  touch-action: manipulation;
}

/* ══════ Drag state classes ══════ */
.section-ghost {
  opacity: 0.35;
  background: var(--gold-100, #F3E7C4);
  border: 1px dashed var(--gold-500, #C9A227);
  border-radius: 6px;
}
.section-drag {
  opacity: 1;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}
.section-chosen {
  cursor: grabbing;
}
</style>
