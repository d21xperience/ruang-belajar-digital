<template>
  <div class="module-sidebar">
    <div class="sidebar-head">
      <span class="mono-tag">MODUL</span>
      <q-btn flat dense round size="sm" icon="add" color="primary"
        @click="$emit('add-module')" aria-label="Tambah modul">
        <q-tooltip>Tambah modul baru</q-tooltip>
      </q-btn>
    </div>

    <div v-if="!modules.length" class="sidebar-empty">
      Belum ada modul. Klik <q-icon name="add" /> untuk menambah.
    </div>

    <!-- ═══════════ DRAGGABLE ═══════════ -->
    <VueDraggable
      v-else
      v-model="localModules"
      :animation="180"
      :delay="120"
      :delay-on-touch-only="true"
      :touch-start-threshold="8"
      handle=".module-drag-handle"
      ghost-class="module-ghost"
      drag-class="module-drag"
      chosen-class="module-chosen"
      @end="onDragEnd"
    >
      <q-item
        v-for="(mod, i) in localModules"
        :key="mod.id || i"
        clickable
        :active="i === activeIndex"
        active-class="sidebar-item--active"
        class="module-item"
        @click="$emit('select', i)"
      >
        <!-- ══════ DRAG HANDLE ══════ -->
        <q-item-section
          avatar
          class="module-drag-handle"
          style="cursor: grab"
          :aria-label="`Geser modul ${mod.judul}`"
        >
          <div class="handle-inner">
            <q-icon name="drag_indicator" size="14px" class="handle-icon" />
            <span class="mod-num mono-tag">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
        </q-item-section>

        <q-item-section>
          <q-item-label class="mod-title">{{ mod.judul || '(Tanpa judul)' }}</q-item-label>
          <q-item-label caption class="mod-id">{{ mod.id }}</q-item-label>
        </q-item-section>

        <q-item-section side @click.stop>
          <q-btn flat dense round size="sm" icon="delete" color="negative"
            @click="$emit('delete', i)" aria-label="Hapus modul">
            <q-tooltip>Hapus modul</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </VueDraggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  modules: { type: Array, required: true },
  activeIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['select', 'add-module', 'delete', 'reorder'])

// ══════ Local mirror ══════
const localModules = ref([...props.modules])
watch(
  () => props.modules,
  (val) => { localModules.value = [...val] },
)

// ══════ Drag end → emit reorder ══════
function onDragEnd(evt) {
  const { oldIndex, newIndex } = evt
  if (oldIndex === newIndex || oldIndex == null || newIndex == null) return
  emit('reorder', { from: oldIndex, to: newIndex })
}
</script>

<style scoped>
.module-sidebar {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  overflow: hidden;
  height: fit-content;
}
.sidebar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, #D8DEE5);
  background: var(--paper, #F4F6F8);
}
.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

/* ─── Item modul ─── */
.module-item {
  touch-action: manipulation;
}
.module-item :deep(.q-item__section--avatar) {
  min-width: 56px;
}

/* ─── Drag handle ─── */
.module-drag-handle {
  display: flex !important;
  align-items: center;
}
.handle-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 3px;
  color: var(--ink-500, #5B6B7C);
}
.module-drag-handle:active .handle-inner {
  background: rgba(0, 0, 0, 0.05);
  cursor: grabbing;
}
.handle-icon {
  opacity: 0.5;
}
.mod-num {
  display: inline-block;
  min-width: 20px;
  text-align: center;
}

/* ─── Title & ID ─── */
.mod-title {
  font-weight: 600;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mod-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
}

/* ─── Active state ─── */
.sidebar-item--active {
  background: var(--gold-100, #F3E7C4);
}
.sidebar-item--active .mod-title { color: #8A6A14; }

/* ─── Empty ─── */
.sidebar-empty {
  padding: 20px 12px;
  text-align: center;
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
}

/* ══════ Drag state classes ══════ */
.module-ghost {
  opacity: 0.4;
  background: var(--gold-100, #F3E7C4);
}
.module-drag {
  opacity: 1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  background: #fff;
}
.module-chosen {
  cursor: grabbing;
}
</style>
