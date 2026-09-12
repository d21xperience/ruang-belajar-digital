<template>
  <div class="block-list-editor">
    <div class="list-head">
      <span class="mono-tag">KONTEN ({{ blocks.length }} blok)</span>
      <q-btn-dropdown outline dense size="sm" icon="add" label="Tambah Blok" content-class="block-add-menu">
        <q-list dense>
          <q-item v-for="opt in blockTypeOptions" :key="opt.type" clickable v-close-popup @click="addBlock(opt.type)">
            <q-item-section avatar>
              <q-icon :name="opt.icon" size="18px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ opt.label }}</q-item-label>
              <q-item-label caption>{{ opt.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <div v-if="!blocks.length" class="empty-note">
      Belum ada blok. Klik "Tambah Blok" untuk memulai.
      <br />
      <span class="empty-hint">
        Tip: gunakan blok <b>Paragraf</b> untuk teks biasa, <b>Gambar</b> untuk ilustrasi,
        <b>Video</b> untuk embed YouTube, <b>Callout</b> untuk menonjolkan info penting.
      </span>
    </div>

    <!-- ═══════ DRAGGABLE (vue-draggable-plus) ═══════ -->
    <VueDraggable v-else v-model="localBlocks" :animation="180" :delay="120" :delay-on-touch-only="true"
      :touch-start-threshold="8" handle=".be-handle" ghost-class="block-ghost" drag-class="block-drag"
      chosen-class="block-chosen" @end="onDragEnd">
      <div v-for="(block, i) in localBlocks" :key="block._id || i" class="block-wrapper">
        <BlockEditor :block="block" :index="i" @update="(payload) => $emit('update', i, payload)"
          @delete="$emit('delete', i)" @duplicate="$emit('duplicate', i)"
          @paste-image="(payload) => onPasteImage(i, payload)" />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import BlockEditor from './BlockEditor.vue'

const props = defineProps({
  blocks: { type: Array, required: true },
})
const emit = defineEmits(['update', 'delete', 'duplicate', 'add', 'reorder', 'insert-after'])

const blockTypeOptions = [
  { type: 'paragraph', icon: 'notes', label: 'Paragraf', caption: 'Teks biasa' },
  { type: 'heading', icon: 'title', label: 'Judul', caption: 'Heading h2/h3/h4' },
  { type: 'image', icon: 'image', label: 'Gambar', caption: 'URL atau upload' },
  { type: 'video', icon: 'movie', label: 'Video', caption: 'YouTube / file .mp4' },
  { type: 'audio', icon: 'audiotrack', label: 'Audio', caption: 'File .mp3' },
  { type: 'callout', icon: 'info', label: 'Callout', caption: 'Kotak info/warning/success' },
  { type: 'quote', icon: 'format_quote', label: 'Kutipan', caption: 'Quote dengan sumber' },
  { type: 'list', icon: 'format_list_bulleted', label: 'Daftar', caption: 'Bullet atau bernomor' },
  { type: 'table', icon: 'table_chart', label: 'Tabel', caption: 'Header + baris data' },
  { type: 'divider', icon: 'horizontal_rule', label: 'Garis', caption: 'Pemisah visual' },
]

function addBlock(type) {
  emit('add', type)
}

const localBlocks = ref([...props.blocks])
watch(() => props.blocks, (v) => { localBlocks.value = [...v] })

function onDragEnd(evt) {
  const { oldIndex, newIndex } = evt
  if (oldIndex === newIndex || oldIndex == null || newIndex == null) return
  emit('reorder', { from: oldIndex, to: newIndex })
}

function onPasteImage(fromIndex, payload) {
  // Emit ke parent — parent akan insert blok baru SETELAH blok sumber
  emit('insert-after', {
    index: fromIndex,
    block: {
      _id: `blk-${Math.random().toString(36).slice(2, 8)}`,
      type: 'image',
      src: payload.src,
      alt: payload.alt || '',
      caption: '',
      width: 'full',
    },
    meta: {
      originalSize: payload.originalSize,
      finalSize: payload.finalSize,
      compressed: payload.compressed,
    },
  })
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
  padding: 24px 20px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-500, #5B6B7C);
  background: var(--paper, #F4F6F8);
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
  line-height: 1.7;
}

.empty-hint {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.78rem;
  max-width: 480px;
}

.block-wrapper {
  position: relative;
  margin-bottom: 8px;
  touch-action: manipulation;
}

.block-ghost {
  opacity: 0.4;
  background: var(--gold-100, #F3E7C4);
  border: 1px dashed var(--gold-500, #C9A227);
  border-radius: 6px;
}

.block-drag {
  opacity: 1;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  transform: rotate(1.5deg);
}

.block-chosen {
  cursor: grabbing;
}
</style>
