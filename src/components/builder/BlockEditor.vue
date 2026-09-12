<template>
  <div class="block-editor" :class="{ 'block-editor--drop-active': isDropActive }" @dragenter="onDragEnter"
    @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <!-- ══════ HEADER ══════ -->
    <div class="be-header">
      <div class="be-handle" :aria-label="`Geser blok ${typeLabel}`" title="Tahan & geser untuk mengubah urutan">
        <q-icon name="drag_indicator" size="18px" />
      </div>

      <div class="be-type">
        <q-icon :name="typeIcon" size="16px" />
        <span class="be-type-label">{{ typeLabel }}</span>
      </div>

      <div class="be-actions" @click.stop>
        <q-btn flat dense round size="sm" icon="content_copy" @click="$emit('duplicate')" aria-label="Duplikat">
          <q-tooltip>Duplikat blok</q-tooltip>
        </q-btn>
        <q-btn flat dense round size="sm" icon="delete" color="negative" @click="$emit('delete')" aria-label="Hapus">
          <q-tooltip>Hapus blok</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- ══════ BODY ══════ -->
    <div class="be-body">
      <!-- PARAGRAPH -->
      <q-input v-if="block.type === 'paragraph'" :model-value="block.text" outlined dense autogrow label="Paragraf"
        hint="💡 Bisa paste gambar (Ctrl+V) di sini" @update:model-value="(v) => update('text', v)"
        @paste="(e) => onPasteText(e)" />

      <!-- HEADING -->
      <div v-else-if="block.type === 'heading'" class="row q-col-gutter-sm">
        <div class="col-8">
          <q-input :model-value="block.text" outlined dense label="Judul" @update:model-value="(v) => update('text', v)"
            @paste="(e) => onPasteText(e)" />
        </div>
        <div class="col-4">
          <q-select :model-value="block.level || 3" outlined dense label="Level" :options="[2, 3, 4]"
            @update:model-value="(v) => update('level', v)" />
        </div>
      </div>

      <!-- IMAGE -->
      <template v-else-if="block.type === 'image'">
        <div class="image-source">
          <q-input :model-value="isDataUrl ? '(gambar ter-upload)' : block.src" outlined dense label="URL Gambar"
            hint="URL langsung ke file gambar (.jpg, .png) — bukan URL halaman" :disable="isDataUrl" :error="srcInvalid"
            @update:model-value="(v) => update('src', v)" @paste="(e) => onPasteSrc(e)" />
          <div v-if="srcWarning" class="src-warning">
            <q-icon name="warning" size="16px" />
            <div>
              <div class="src-warning-title">⚠ URL tidak langsung ke gambar</div>
              <div class="src-warning-msg">{{ srcWarning }}</div>
            </div>
          </div>
          <div class="image-uploader">
            <q-btn outline dense size="sm" icon="upload" label="Upload" :loading="uploading" @click="pickImageFile" />
            <q-btn v-if="isDataUrl" flat dense size="sm" icon="link_off" color="negative" label="Hapus"
              @click="update('src', '')" />
            <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="handleImageUpload" />
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input :model-value="block.alt" outlined dense label="Alt Text (aksesibilitas)"
              hint="Deskripsi singkat gambar" @update:model-value="(v) => update('alt', v)" />
          </div>
          <div class="col-12 col-sm-6">
            <q-input :model-value="block.caption" outlined dense label="Caption (opsional)"
              @update:model-value="(v) => update('caption', v)" />
          </div>
          <div class="col-12 col-sm-4">
            <q-select :model-value="block.width || 'full'" outlined dense label="Ukuran Tampil" :options="[
              { label: 'Kecil (320px)', value: 'small' },
              { label: 'Sedang (520px)', value: 'medium' },
              { label: 'Penuh', value: 'full' },
            ]" emit-value map-options @update:model-value="(v) => update('width', v)" />
          </div>
        </div>

        <!-- Preview -->
        <div v-if="block.src" class="image-preview">
          <img :src="block.src" :alt="block.alt || 'preview'" @error="previewError = true" />
          <div v-if="previewError" class="preview-error">
            ⚠ Gambar gagal dimuat. Periksa URL atau upload ulang.
          </div>
          <div v-if="isDataUrl" class="preview-warning">
            ℹ Gambar tersimpan sebagai base64 ({{ dataUrlSizeKB }} KB).
          </div>
        </div>
      </template>

      <!-- VIDEO -->
      <template v-else-if="block.type === 'video'">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-8">
            <q-input :model-value="block.src" outlined dense label="URL Video"
              :hint="videoConverted ? `→ akan dikonversi ke: ${videoConverted}` : 'YouTube: /watch?v=ID atau /embed/ID, atau file .mp4'"
              :error="srcInvalid" @update:model-value="(v) => update('src', v)" />
            <div v-if="srcWarning" class="src-warning">
              <q-icon name="warning" size="16px" />
              <div>{{ srcWarning }}</div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <q-select :model-value="block.provider || 'youtube'" outlined dense label="Provider" :options="[
              { label: 'YouTube Embed', value: 'youtube' },
              { label: 'File Video', value: 'file' },
            ]" emit-value map-options @update:model-value="(v) => update('provider', v)" />
          </div>
          <div class="col-12 col-sm-8">
            <q-input :model-value="block.caption" outlined dense label="Caption"
              @update:model-value="(v) => update('caption', v)" />
          </div>
          <div v-if="block.provider === 'file'" class="col-12 col-sm-4">
            <q-input :model-value="block.poster" outlined dense label="Poster (opsional)" hint="Bisa paste gambar"
              @update:model-value="(v) => update('poster', v)" @paste="(e) => onPastePoster(e)" />
          </div>
        </div>
        <div v-if="block.provider === 'youtube' && block.src" class="hint-box">
          <b>Tips:</b> Gunakan format <code>https://www.youtube.com/embed/VIDEO_ID</code>.
        </div>
      </template>

      <!-- AUDIO -->
      <template v-else-if="block.type === 'audio'">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-8">
            <div class="audio-source-row">
              <q-input :model-value="block.src" outlined dense label="URL Audio" hint="File .mp3, .ogg, .wav"
                class="audio-input" @update:model-value="(v) => update('src', v)" />
              <q-btn outline dense size="sm" icon="photo_library" label="Pustaka" :disable="!content"
                @click="openPicker('audio')" />
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <q-input :model-value="block.caption" outlined dense label="Caption"
              @update:model-value="(v) => update('caption', v)" />
          </div>
        </div>
      </template>

      <!-- CALLOUT -->
      <template v-else-if="block.type === 'callout'">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-4">
            <q-select :model-value="block.variant || 'info'" outlined dense label="Varian" :options="[
              { label: 'Info (biru)', value: 'info' },
              { label: 'Warning (kuning)', value: 'warning' },
              { label: 'Success (hijau)', value: 'success' },
            ]" emit-value map-options @update:model-value="(v) => update('variant', v)" />
          </div>
          <div class="col-12 col-sm-8">
            <q-input :model-value="block.title" outlined dense label="Judul (opsional)"
              @update:model-value="(v) => update('title', v)" @paste="(e) => onPasteText(e)" />
          </div>
          <div class="col-12">
            <q-input :model-value="block.text" outlined dense autogrow label="Isi Callout"
              @update:model-value="(v) => update('text', v)" @paste="(e) => onPasteText(e)" />
          </div>
        </div>
      </template>

      <!-- QUOTE -->
      <template v-else-if="block.type === 'quote'">
        <q-input :model-value="block.text" outlined dense autogrow label="Kutipan" class="q-mb-sm"
          @update:model-value="(v) => update('text', v)" @paste="(e) => onPasteText(e)" />
        <q-input :model-value="block.author" outlined dense label="Penulis / Sumber"
          @update:model-value="(v) => update('author', v)" />
      </template>

      <!-- LIST -->
      <template v-else-if="block.type === 'list'">
        <div class="row items-center q-mb-sm">
          <q-toggle :model-value="block.ordered" dense label="Gunakan penomoran (1, 2, 3)"
            @update:model-value="(v) => update('ordered', v)" />
        </div>
        <ArrayStringEditor :model-value="block.items || []" label="Item"
          @update:model-value="(v) => update('items', v)" />
      </template>

      <!-- TABLE -->
      <template v-else-if="block.type === 'table'">
        <div class="field-label">Header Kolom (pisahkan dengan koma)</div>
        <q-input :model-value="(block.headers || []).join(', ')" outlined dense hint="contoh: No, Nama, Keterangan"
          @update:model-value="(v) => update('headers', v.split(',').map((s) => s.trim()))" class="q-mb-md" />

        <div class="field-label">Baris Data (pisahkan sel dengan <code>|</code>)</div>
        <q-input :model-value="rowsToText(block.rows)" outlined autogrow type="textarea"
          hint="contoh: 1 | Soekarno | Presiden pertama"
          :input-style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.82rem' }"
          @update:model-value="(v) => update('rows', textToRows(v))" />
      </template>

      <!-- DIVIDER -->
      <div v-else-if="block.type === 'divider'" class="divider-note">
        <q-icon name="horizontal_rule" size="20px" color="grey-6" />
        <span>Garis pemisah — tidak ada konfigurasi</span>
      </div>

      <!-- FALLBACK -->
      <div v-else class="fallback-warn">
        ⚠ Tipe blok tidak dikenal: <code>{{ block.type }}</code>
      </div>
    </div>

    <!-- ══════ OVERLAY: Drop Active ══════ -->
    <Transition name="drop-fade">
      <div v-if="isDropActive" class="be-drop-overlay">
        <q-icon name="add_photo_alternate" size="32px" />
        <span>Lepaskan gambar untuk menambahkan</span>
      </div>
    </Transition>

    <!-- ══════ MEDIA PICKER ══════ -->
    <MediaPickerDialog v-if="content" v-model="pickerOpen" :content="content" :type="pickerType"
      @select="onPickMedia" />
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useQuasar } from 'quasar'
import ArrayStringEditor from './ArrayStringEditor.vue'
import MediaPickerDialog from './MediaPickerDialog.vue'
import { useImagePaste } from '../../composables/useImagePaste'
import { normalizeImageUrl, normalizeVideoUrl } from '../../utils/urlConverter'

const props = defineProps({
  block: { type: Object, required: true },
  index: { type: Number, required: true },
  content: { type: Object, default: null },
})
const emit = defineEmits(['update', 'delete', 'duplicate', 'paste-image'])

const $q = useQuasar()

// ══════ Image paste composable ══════
const {
  extractImagesFromClipboard,
  extractImagesFromDataTransfer,
  processImageFiles,
  formatBytes,
} = useImagePaste()

// ══════ State ══════
const fileInputRef = ref(null)
const uploading = ref(false)
const previewError = ref(false)
const pickerOpen = ref(false)
const pickerType = ref('image')
const isDropActive = ref(false)
let dropCounter = 0 // counter untuk handle nested dragenter/dragleave

// ══════ Content (provide/inject) ══════
const injectedContent = inject('builderContent', null)
const content = computed(() => props.content || injectedContent)

// ══════ Type meta ══════
const typeMeta = {
  paragraph: { icon: 'notes', label: 'Paragraf' },
  heading: { icon: 'title', label: 'Judul' },
  image: { icon: 'image', label: 'Gambar' },
  video: { icon: 'movie', label: 'Video' },
  audio: { icon: 'audiotrack', label: 'Audio' },
  callout: { icon: 'info', label: 'Callout' },
  quote: { icon: 'format_quote', label: 'Kutipan' },
  list: { icon: 'format_list_bulleted', label: 'Daftar' },
  table: { icon: 'table_chart', label: 'Tabel' },
  divider: { icon: 'horizontal_rule', label: 'Garis' },
}
const typeIcon = computed(() => typeMeta[props.block.type]?.icon || 'help_outline')
const typeLabel = computed(() => typeMeta[props.block.type]?.label || props.block.type)

// ══════ Image helpers ══════
const isDataUrl = computed(() => (props.block.src || '').startsWith('data:image/'))
const dataUrlSizeKB = computed(() => {
  if (!isDataUrl.value) return 0
  const base64 = props.block.src.split(',')[1] || ''
  return Math.round((base64.length * 3) / 4 / 1024)
})

function pickImageFile() {
  fileInputRef.value?.click()
}

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  processUploadedFile(file)
  event.target.value = ''
}

async function processUploadedFile(file) {
  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: 'File harus berupa gambar.', position: 'top' })
    return
  }

  uploading.value = true
  try {
    const [result] = await processImageFiles([file])
    update('src', result.src)
    previewError.value = false

    if (result.compressed) {
      $q.notify({
        type: 'positive',
        message: `Gambar dikompres ${formatBytes(result.originalSize)} → ${formatBytes(result.finalSize)}`,
        position: 'top',
      })
    } else {
      $q.notify({
        type: 'positive',
        message: `Gambar diterapkan (${formatBytes(result.finalSize)}).`,
        position: 'top',
      })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  } finally {
    uploading.value = false
  }
}

// ══════ Paste handlers ══════
async function onPasteText(event) {
  const files = extractImagesFromClipboard(event)
  if (!files.length) return // biarkan paste teks normal

  event.preventDefault()
  $q.notify({
    type: 'info',
    message: `Memproses ${files.length} gambar dari clipboard…`,
    position: 'top',
    timeout: 1500,
  })

  try {
    const results = await processImageFiles(files)
    for (const r of results) {
      emit('paste-image', {
        src: r.src,
        alt: '',
        originalSize: r.originalSize,
        finalSize: r.finalSize,
        compressed: r.compressed,
      })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  }
}

async function onPasteSrc(event) {
  // Khusus field "URL Gambar" di blok image: paste → langsung jadi src
  const files = extractImagesFromClipboard(event)
  if (!files.length) return

  event.preventDefault()
  try {
    const [result] = await processImageFiles(files)
    update('src', result.src)
    previewError.value = false
    $q.notify({
      type: 'positive',
      message: `Gambar ditempel ke field (${formatBytes(result.finalSize)}).`,
      position: 'top',
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  }
}

async function onPastePoster(event) {
  const files = extractImagesFromClipboard(event)
  if (!files.length) return
  event.preventDefault()
  try {
    const [result] = await processImageFiles(files)
    update('poster', result.src)
    $q.notify({ type: 'positive', message: 'Poster ditempel.', position: 'top' })
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  }
}

// ══════ Drag & Drop handlers ══════
function onDragEnter(e) {
  if (!hasImageFile(e.dataTransfer)) return
  e.preventDefault()
  dropCounter++
  if (dropCounter === 1) isDropActive.value = true
}

function onDragOver(e) {
  if (!hasImageFile(e.dataTransfer)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function onDragLeave(e) {
  if (!hasImageFile(e.dataTransfer)) return
  dropCounter = Math.max(0, dropCounter - 1)
  if (dropCounter === 0) isDropActive.value = false
}

async function onDrop(event) {
  const files = extractImagesFromDataTransfer(event.dataTransfer)
  dropCounter = 0
  isDropActive.value = false

  if (!files.length) return

  event.preventDefault()
  event.stopPropagation()

  try {
    // Kalau blok ini adalah image → langsung pakai gambar pertama
    if (props.block.type === 'image' && files.length === 1) {
      const [result] = await processImageFiles([files[0]])
      update('src', result.src)
      previewError.value = false
      $q.notify({
        type: 'positive',
        message: `Gambar diganti (${formatBytes(result.finalSize)}).`,
        position: 'top',
      })
      return
    }

    // Selain itu → buat blok image baru untuk setiap file
    const results = await processImageFiles(files)
    for (const r of results) {
      emit('paste-image', {
        src: r.src,
        alt: '',
        originalSize: r.originalSize,
        finalSize: r.finalSize,
        compressed: r.compressed,
      })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  }
}

function hasImageFile(dt) {
  if (!dt) return false
  if (!dt.types) return false
  return Array.from(dt.types).includes('Files')
}

// ══════ Table helpers ══════
function rowsToText(rows) {
  if (!Array.isArray(rows)) return ''
  return rows.map((r) => r.join(' | ')).join('\n')
}
function textToRows(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((row) => row.some((c) => c !== ''))
}

// ══════ Update helper ══════
function update(key, value) {
  emit('update', { key, value })
  if (key === 'src') previewError.value = false
}

// ══════ Media Picker ══════
function openPicker(type) {
  pickerType.value = type
  pickerOpen.value = true
}
function onPickMedia(src) {
  update('src', src)
  $q.notify({ type: 'positive', message: 'Media dari pustaka diterapkan.', position: 'top' })
}

// ═══ Validasi URL saat edit ═══
const srcWarning = computed(() => {
  if (!props.block.src) return null
  if (props.block.type === 'image') return normalizeImageUrl(props.block.src).warning
  if (props.block.type === 'video') return normalizeVideoUrl(props.block.src).warning
  return null
})

const srcInvalid = computed(() => {
  if (!props.block.src) return false
  if (props.block.type === 'image') return normalizeImageUrl(props.block.src).invalid
  if (props.block.type === 'video') return normalizeVideoUrl(props.block.src).invalid
  return false
})

const videoConverted = computed(() => {
  if (props.block.type !== 'video' || !props.block.src) return null
  const r = normalizeVideoUrl(props.block.src)
  return r.converted ? r.url : null
})
</script>

<style scoped>
.block-editor {
  position: relative;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
  background: #fff;
  margin-bottom: 8px;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.block-editor:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.block-editor--drop-active {
  border-color: var(--gold-500, #C9A227);
  box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.2);
}

.be-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--paper, #F4F6F8);
  border-bottom: 1px solid var(--border, #D8DEE5);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.be-handle {
  cursor: grab;
  color: var(--ink-500, #5B6B7C);
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 3px;
  user-select: none;
}

.be-handle:active {
  cursor: grabbing;
}

.be-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--navy-700, #16324F);
  background: #fff;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid var(--border, #D8DEE5);
}

.be-actions {
  margin-left: auto;
  display: flex;
  gap: 2px;
}

.be-body {
  padding: 12px;
}

/* ═══ Drop overlay ═══ */
.be-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(201, 162, 39, 0.12);
  border: 2px dashed var(--gold-500, #C9A227);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--navy-900, #0B1F33);
  font-weight: 600;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 5;
}

.drop-fade-enter-active,
.drop-fade-leave-active {
  transition: opacity 0.15s;
}

.drop-fade-enter-from,
.drop-fade-leave-to {
  opacity: 0;
}

/* ═══ Image source ═══ */
.image-source {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.image-source .q-input {
  flex: 1;
}

.image-uploader {
  display: flex;
  gap: 4px;
  padding-top: 4px;
  flex-shrink: 0;
}

.image-preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 4px;
  background: var(--paper, #F4F6F8);
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 240px;
  border-radius: 4px;
}

.preview-error {
  color: var(--red-500, #A6403F);
  font-size: 0.8rem;
  margin-top: 6px;
}

.preview-warning {
  color: #8A6A14;
  font-size: 0.75rem;
  margin-top: 8px;
}

/* ═══ Audio ═══ */
.audio-source-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.audio-input {
  flex: 1;
}

/* ═══ Utility ═══ */
.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--ink-900, #1B2733);
}

.field-label code {
  background: var(--paper, #F4F6F8);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.75rem;
}

.hint-box {
  margin-top: 8px;
  padding: 8px 12px;
  background: #EAF2FA;
  border-left: 3px solid #4A90D9;
  border-radius: 4px;
  font-size: 0.78rem;
  line-height: 1.5;
}

.hint-box code {
  background: #fff;
  padding: 1px 4px;
  border-radius: 3px;
}

.divider-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-500, #5B6B7C);
  font-size: 0.82rem;
  font-style: italic;
}

.fallback-warn {
  color: var(--red-500, #A6403F);
  padding: 8px;
  background: var(--red-100, #F1DCDB);
  border-radius: 4px;
  font-size: 0.85rem;
}

.src-warning {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 6px;
  padding: 8px 10px;
  background: #FFF4D6;
  border-left: 3px solid #F2C037;
  border-radius: 3px;
  font-size: 0.78rem;
  color: #8A6A14;
  line-height: 1.5;
}

.src-warning-title {
  font-weight: 700;
  margin-bottom: 2px;
}

.src-warning-msg {
  color: #8A6A14;
}
</style>
