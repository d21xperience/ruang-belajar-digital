<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="(v) => $emit('update:modelValue', v)">
    <q-card class="picker-card">
      <div class="picker-head">
        <div>
          <div class="mono-tag">PUSTAKA MEDIA</div>
          <h3 class="picker-title">Pilih {{ type === 'audio' ? 'Audio' : 'Gambar' }}</h3>
        </div>
        <q-btn flat dense round icon="close" @click="$emit('update:modelValue', false)" />
      </div>

      <q-input v-model="search" dense outlined clearable placeholder="Cari..." class="q-mb-md">
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <div v-if="!filteredItems.length" class="picker-empty">
        <q-icon name="perm_media" size="32px" color="grey-5" />
        <p>Belum ada {{ type === 'audio' ? 'audio' : 'gambar' }} di pustaka.</p>
        <p class="hint">Upload dulu lewat Form Editor.</p>
      </div>

      <div v-else class="picker-grid">
        <div v-for="item in filteredItems" :key="item.id" class="picker-item" @click="select(item)">
          <div class="picker-preview">
            <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt || 'media'" loading="lazy" />
            <div v-else class="picker-audio-icon">
              <q-icon name="audiotrack" size="32px" color="primary" />
            </div>
          </div>
          <div class="picker-info">
            <div class="picker-size">{{ formatBytes(item.size) }}</div>
            <div class="picker-url">{{ truncate(item.src, 40) }}</div>
          </div>
        </div>
      </div>

      <div class="picker-actions">
        <q-btn flat label="Batal" @click="$emit('update:modelValue', false)" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { scanMedia, formatBytes } from '../../composables/useMediaLibrary'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  content: { type: Object, required: true },
  type: { type: String, default: 'image' }, // 'image' | 'audio'
})
const emit = defineEmits(['update:modelValue', 'select'])

const search = ref('')

const allItems = computed(() => scanMedia(props.content))

const filteredItems = computed(() => {
  let list = allItems.value.filter((i) => i.type === props.type)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((i) =>
      i.src.toLowerCase().includes(q) || (i.alt || '').toLowerCase().includes(q)
    )
  }
  return list
})

function select(item) {
  emit('select', item.src)
  emit('update:modelValue', false)
}

function truncate(str, n) {
  if (!str) return ''
  if (str.startsWith('data:')) {
    const mime = str.match(/^data:([^;]+)/)
    return `${mime ? mime[1] : 'base64'} ...${str.slice(-12)}`
  }
  return str.length > n ? str.slice(0, n) + '…' : str
}
</script>

<style scoped>
.picker-card {
  width: 90vw;
  max-width: 720px;
  max-height: 85vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.picker-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.picker-title {
  font-size: 1.2rem;
  color: var(--navy-900, #0B1F33);
  margin: 4px 0 0;
}

.picker-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  background: var(--paper, #F4F6F8);
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
}

.picker-empty p {
  margin: 10px 0 0;
  font-size: 0.9rem;
}

.picker-empty .hint {
  font-size: 0.78rem;
  font-style: italic;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  max-height: 50vh;
  padding-right: 4px;
}

.picker-item {
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.15s, transform 0.15s;
}

.picker-item:hover {
  border-color: var(--gold-500, #C9A227);
  transform: translateY(-1px);
}

.picker-item:focus-visible {
  outline: 2px solid var(--gold-500, #C9A227);
  outline-offset: 2px;
}

.picker-preview {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--paper, #F4F6F8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.picker-audio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.picker-info {
  padding: 6px 8px;
  border-top: 1px solid var(--border, #D8DEE5);
}

.picker-size {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--navy-700, #16324F);
}

.picker-url {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.62rem;
  color: var(--ink-500, #5B6B7C);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border, #D8DEE5);
}
</style>
