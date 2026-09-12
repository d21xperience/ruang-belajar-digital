<template>
  <div class="media-manager">
    <!-- ══════ STATS ══════ -->
    <div class="mm-stats">
      <div class="mm-stat">
        <span class="mono-tag">TOTAL ITEM</span>
        <span class="stat-num">{{ items.length }}</span>
      </div>
      <div class="mm-stat">
        <span class="mono-tag">GAMBAR</span>
        <span class="stat-num">{{ counts.image }}</span>
      </div>
      <div class="mm-stat">
        <span class="mono-tag">AUDIO</span>
        <span class="stat-num">{{ counts.audio }}</span>
      </div>
      <div class="mm-stat" :class="{ 'mm-stat--warn': totalSize > SIZE_WARN }">
        <span class="mono-tag">ESTIMASI UKURAN</span>
        <span class="stat-num">{{ formatBytes(totalSize) }}</span>
        <span v-if="totalSize > SIZE_WARN" class="stat-warn">
          ⚠ Disarankan &lt; 5 MB
        </span>
      </div>
    </div>

    <!-- ══════ FILTERS ══════ -->
    <div class="mm-filters">
      <q-btn-toggle v-model="filterType" :options="filterOptions" dense outline toggle-color="primary" no-caps />
      <q-input v-model="search" dense outlined clearable placeholder="Cari URL, nama modul, atau ID..."
        class="mm-search">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <!-- ══════ WARNING TOTAL ══════ -->
    <div v-if="totalSize > SIZE_WARN" class="mm-global-warn">
      <q-icon name="warning" size="18px" />
      <span>
        Total ukuran media <b>{{ formatBytes(totalSize) }}</b> cukup besar.
        Pertimbangkan untuk memindahkan media besar ke folder <code>public/</code>
        dan menggunakan URL relatif.
      </span>
    </div>

    <!-- ══════ EMPTY ══════ -->
    <div v-if="!filteredItems.length" class="mm-empty">
      <q-icon name="perm_media" size="40px" color="grey-5" />
      <p v-if="!items.length">
        Belum ada media. Upload gambar atau tambahkan URL di Form Editor.
      </p>
      <p v-else>Tidak ada media yang cocok dengan filter.</p>
    </div>

    <!-- ══════ GRID ══════ -->
    <div v-else class="mm-grid">
      <div v-for="item in filteredItems" :key="item.id" class="mm-card">
        <!-- Preview -->
        <div class="mm-preview">
          <img v-if="item.type === 'image' && item.src" :src="item.src" :alt="item.alt || 'media'" loading="lazy"
            @error="onImgError(item.id)" />
          <div v-else-if="item.type === 'audio'" class="mm-audio-icon">
            <q-icon name="audiotrack" size="40px" color="primary" />
          </div>
          <div v-if="imgErrors.has(item.id)" class="mm-img-error">
            Gagal dimuat
          </div>

          <!-- Type badge -->
          <div class="mm-badge" :class="item.isBase64 ? 'mm-badge--b64' : 'mm-badge--url'">
            {{ item.isBase64 ? 'base64' : 'URL' }}
          </div>
        </div>

        <!-- Info -->
        <div class="mm-info">
          <div class="mm-meta">
            <span class="mm-size">
              {{ item.size != null ? formatBytes(item.size) : 'external' }}
            </span>
            <span v-if="item.mime" class="mm-mime">{{ shortMime(item.mime) }}</span>
          </div>
          <div class="mm-url" :title="item.src">
            {{ truncateSrc(item.src) }}
          </div>

          <div class="mm-usage">
            <span v-for="(u, i) in item.usage.slice(0, 3)" :key="i" class="usage-chip"
              :title="`${u.moduleId} / ${u.sectionId} / block ${u.blockIndex + 1}`">
              {{ moduleLabel(u.moduleId) }}
            </span>
            <span v-if="item.usage.length > 3" class="usage-more">
              +{{ item.usage.length - 3 }} lain
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="mm-actions">
          <q-btn flat dense round size="sm" icon="content_copy" @click="copySrc(item)">
            <q-tooltip>Copy src ke clipboard</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="delete" color="negative" @click="confirmDelete(item)">
            <q-tooltip>Hapus dari semua tempat ({{ item.usage.length }})</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { scanMedia, computeTotalSize, formatBytes } from '../../composables/useMediaLibrary'

const SIZE_WARN = 5 * 1024 * 1024 // 5 MB

const props = defineProps({
  content: { type: Object, required: true },
  modules: { type: Array, default: () => [] },
})
const emit = defineEmits(['delete-media'])

const $q = useQuasar()

// ══════ State ══════
const filterType = ref('all')
const search = ref('')
const imgErrors = ref(new Set())

const filterOptions = [
  { label: 'Semua', value: 'all' },
  { label: '🖼 Gambar', value: 'image' },
  { label: '🎵 Audio', value: 'audio' },
]

// ══════ Computed ══════
const items = computed(() => scanMedia(props.content))

const totalSize = computed(() => computeTotalSize(items.value))

const counts = computed(() => ({
  image: items.value.filter((i) => i.type === 'image').length,
  audio: items.value.filter((i) => i.type === 'audio').length,
}))

const filteredItems = computed(() => {
  let list = items.value
  if (filterType.value !== 'all') {
    list = list.filter((i) => i.type === filterType.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((item) => {
      if (item.src.toLowerCase().includes(q)) return true
      if ((item.alt || '').toLowerCase().includes(q)) return true
      for (const u of item.usage) {
        if (u.moduleId.toLowerCase().includes(q)) return true
        if (u.sectionId.toLowerCase().includes(q)) return true
      }
      return false
    })
  }
  return list
})

// ══════ Helpers ══════
function moduleLabel(moduleId) {
  const mod = props.modules.find((m) => m.id === moduleId)
  if (!mod) return moduleId
  return `Modul ${mod.urutan}`
}

function shortMime(mime) {
  return mime.replace('image/', '').replace('audio/', '').replace('video/', '').toUpperCase()
}

function truncateSrc(src) {
  if (!src) return ''
  if (src.startsWith('data:')) {
    const mime = src.match(/^data:([^;]+)/)
    const prefix = mime ? `[${mime[1]}]` : '[base64]'
    return `${prefix} ...${src.slice(-16)}`
  }
  if (src.length > 60) return src.slice(0, 30) + '...' + src.slice(-25)
  return src
}

function onImgError(id) {
  const next = new Set(imgErrors.value)
  next.add(id)
  imgErrors.value = next
}

async function copySrc(item) {
  try {
    await navigator.clipboard.writeText(item.src)
    $q.notify({ type: 'positive', message: 'src ter-copy ke clipboard.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'Gagal copy. Salin manual.', position: 'top' })
  }
}

function confirmDelete(item) {
  const usageText = item.usage.length === 1
    ? '1 tempat'
    : `${item.usage.length} tempat`
  $q.dialog({
    title: 'Hapus Media',
    message: `Media ini digunakan di ${usageText}. Menghapus akan mengosongkan ${usageText} tersebut. Lanjutkan?`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
  }).onOk(() => {
    emit('delete-media', { src: item.src, usages: item.usage })
  })
}
</script>

<style scoped>
.media-manager {
  padding-bottom: 40px;
}

/* ══════ Stats ══════ */
.mm-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.mm-stat {
  padding: 12px 14px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mm-stat--warn {
  border-color: #F2C037;
  background: #FFFCF3;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  color: var(--ink-500, #5B6B7C);
}

.stat-num {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
  font-family: 'IBM Plex Mono', monospace;
}

.mm-stat--warn .stat-num {
  color: #8A6A14;
}

.stat-warn {
  font-size: 0.7rem;
  color: #8A6A14;
}

/* ══════ Filters ══════ */
.mm-filters {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.mm-search {
  flex: 1;
  min-width: 200px;
}

/* ══════ Global warning ══════ */
.mm-global-warn {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: #FFF4D6;
  border-left: 3px solid #F2C037;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #8A6A14;
  line-height: 1.6;
  margin-bottom: 14px;
}

.mm-global-warn code {
  background: #fff;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.78rem;
}

/* ══════ Empty ══════ */
.mm-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  background: #fff;
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 6px;
}

.mm-empty p {
  margin: 12px 0 0;
  font-size: 0.9rem;
}

/* ══════ Grid ══════ */
.mm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.mm-card {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Preview */
.mm-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--paper, #F4F6F8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.mm-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.mm-audio-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EAF2FA, #F4F6F8);
}

.mm-img-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--red-100, #F1DCDB);
  color: var(--red-500, #A6403F);
  font-size: 0.78rem;
}

.mm-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.mm-badge--b64 {
  background: #C9A227;
  color: #0B1F33;
}

.mm-badge--url {
  background: #E5EBF1;
  color: #16324F;
}

/* Info */
.mm-info {
  padding: 10px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mm-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.mm-size {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--navy-700, #16324F);
}

.mm-mime {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: var(--paper, #F4F6F8);
  border-radius: 3px;
  color: var(--ink-500, #5B6B7C);
}

.mm-url {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: var(--ink-500, #5B6B7C);
  word-break: break-all;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
}

/* Usage */
.mm-usage {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px dashed var(--border, #D8DEE5);
}

.usage-chip {
  font-size: 0.68rem;
  padding: 2px 7px;
  background: var(--gold-100, #F3E7C4);
  color: #8A6A14;
  border-radius: 10px;
  font-weight: 600;
}

.usage-more {
  font-size: 0.68rem;
  color: var(--ink-500, #5B6B7C);
  align-self: center;
}

/* Actions */
.mm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  padding: 6px 8px;
  background: var(--paper, #F4F6F8);
  border-top: 1px solid var(--border, #D8DEE5);
}

@media (max-width: 600px) {
  .mm-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
