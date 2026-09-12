<template>
  <q-expansion-item class="section-card" :default-opened="defaultOpened" header-class="section-header">
    <!-- ✅ SESUDAH -->
    <template #header>
      <q-item-section avatar class="section-drag-handle" style="cursor: grab">
        <span class="mono-tag">{{ String(index + 1).padStart(2, '0') }}</span>
      </q-item-section>
      <q-item-section>
        <q-item-label class="section-title">{{ section.judul || '(Judul belum diisi)' }}</q-item-label>
        <q-item-label caption class="section-id">{{ section.id }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="section-controls" @click.stop>
          <q-btn flat dense round size="sm" icon="arrow_upward" :disable="index === 0" @click="$emit('move-up')"
            aria-label="Naik" />
          <q-btn flat dense round size="sm" icon="arrow_downward" :disable="isLast" @click="$emit('move-down')"
            aria-label="Turun" />
          <q-btn flat dense round size="sm" icon="delete" color="negative" @click="$emit('delete')"
            aria-label="Hapus" />
        </div>
      </q-item-section>
    </template>

    <div class="section-body">
      <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-5">
          <q-input :model-value="section.id" outlined dense label="ID Section" hint="contoh: lesson-06-01"
            @update:model-value="(v) => update('id', v)" />
        </div>
        <div class="col-12 col-sm-7">
          <q-input :model-value="section.judul" outlined dense label="Judul Section"
            @update:model-value="(v) => update('judul', v)" />
        </div>
        <!-- <div class="col-12">
          <div class="field-label">Konten (paragraf)</div>
          <ArrayStringEditor :model-value="section.konten || []" label="Paragraf"
            @update:model-value="(v) => update('konten', v)" />
        </div> -->
        <div class="col-12">
          <div class="field-label">Konten Materi</div>
          <BlockListEditor :blocks="normalizedKonten" @add="(type) => addBlock(type)" @update="updateBlock"
            @delete="deleteBlock" @duplicate="duplicateBlock" @reorder="reorderBlock"
            @insert-after="insertBlockAfter" />
        </div>
        <div class="col-12 col-md-6">
          <div class="field-label">Poin Penting</div>
          <ArrayStringEditor :model-value="section.poinPenting || []" label="Poin"
            @update:model-value="(v) => update('poinPenting', v)" />
        </div>
        <div class="col-12 col-md-6">
          <div class="field-label">Kata Kunci</div>
          <ArrayStringEditor :model-value="section.kataKunci || []" label="Kata"
            @update:model-value="(v) => update('kataKunci', v)" />
        </div>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import ArrayStringEditor from './ArrayStringEditor.vue'
import BlockListEditor from './BlockListEditor.vue'
const props = defineProps({
  section: { type: Object, required: true },
  index: { type: Number, required: true },
  isLast: { type: Boolean, default: false },
  defaultOpened: { type: Boolean, default: false },
})
const emit = defineEmits(['update', 'delete', 'move-up', 'move-down'])
const $q = useQuasar()
function update(key, value) {
  emit('update', { key, value })
}

const normalizedKonten = computed(() => {
  const raw = props.section.konten
  if (!raw) return []
  if (!Array.isArray(raw)) return []

  return raw.map((item, idx) => {
    // Legacy: string → paragraph block
    if (typeof item === 'string') {
      return { _id: `legacy-${idx}`, type: 'paragraph', text: item }
    }
    // Block object → pastikan punya _id untuk key
    return { _id: item._id || `blk-${idx}-${Math.random().toString(36).slice(2, 8)}`, ...item }
  })
})

function addBlock(type) {
  const newBlock = createDefaultBlock(type)
  const next = [...normalizedKonten.value, newBlock]
  update('konten', next)
}

function updateBlock(index, payload) {
  const next = [...normalizedKonten.value]
  if (!next[index]) return
  if (payload.key) {
    next[index] = { ...next[index], [payload.key]: payload.value }
  } else {
    next[index] = { ...next[index], ...payload }
  }
  update('konten', next)
}

function deleteBlock(index) {
  const next = [...normalizedKonten.value]
  next.splice(index, 1)
  update('konten', next)
}

function duplicateBlock(index) {
  const src = normalizedKonten.value[index]
  if (!src) return
  const copy = {
    ...JSON.parse(JSON.stringify(src)),
    _id: `blk-${Math.random().toString(36).slice(2, 8)}`,
  }
  const next = [...normalizedKonten.value]
  next.splice(index + 1, 0, copy)
  update('konten', next)
}

function reorderBlock({ from, to }) {
  if (from === to) return
  const next = [...normalizedKonten.value]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  update('konten', next)
}

// Factory blok default per tipe
function createDefaultBlock(type) {
  const _id = `blk-${Math.random().toString(36).slice(2, 8)}`
  switch (type) {
    case 'paragraph': return { _id, type, text: '' }
    case 'heading': return { _id, type, text: '', level: 3 }
    case 'image': return { _id, type, src: '', alt: '', caption: '', width: 'full' }
    case 'video': return { _id, type, src: '', provider: 'youtube', caption: '', poster: '' }
    case 'audio': return { _id, type, src: '', caption: '' }
    case 'callout': return { _id, type, variant: 'info', title: '', text: '' }
    case 'quote': return { _id, type, text: '', author: '' }
    case 'list': return { _id, type, ordered: false, items: [''] }
    case 'table': return { _id, type, headers: ['Kolom 1', 'Kolom 2'], rows: [['', '']] }
    case 'divider': return { _id, type }
    default: return { _id, type: 'paragraph', text: '' }
  }
}

function insertBlockAfter({ index, block, meta }) {
  const next = [...normalizedKonten.value]
  next.splice(index + 1, 0, block)
  update('konten', next)

  if (meta?.finalSize) {
    const msg = meta.compressed
      ? `Gambar ditambahkan sebagai blok baru (${formatBytes(meta.finalSize)}, dikompres dari ${formatBytes(meta.originalSize)}).`
      : `Gambar ditambahkan sebagai blok baru (${formatBytes(meta.finalSize)}).`
    $q.notify({ type: 'positive', message: msg, position: 'top', timeout: 2500 })
  } else {
    $q.notify({ type: 'positive', message: 'Gambar ditambahkan sebagai blok baru.', position: 'top' })
  }
}

function formatBytes(n) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

</script>

<style scoped>
.section-card {
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
}

.section-header {
  min-height: 56px;
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.section-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
}

.section-controls {
  display: flex;
  gap: 2px;
}

.section-body {
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
  margin-bottom: 6px;
  color: var(--ink-900, #1B2733);
}
</style>
