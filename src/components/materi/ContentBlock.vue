<template>
  <!-- PARAGRAPH -->
  <RichText v-if="block.type === 'paragraph'" tag="p" class="cb-paragraph" :text="block.text" />

  <!-- HEADING -->
  <RichText v-else-if="block.type === 'heading'" :tag="`h${block.level || 3}`" class="cb-heading" :text="block.text" />

  <!-- IMAGE -->
  <figure v-else-if="block.type === 'image'" class="cb-image" :class="`cb-image--${block.width || 'full'}`">
    <img :src="imageUrl" :alt="block.alt || block.caption || 'Ilustrasi materi'" loading="lazy"
      referrerpolicy="no-referrer" crossorigin="anonymous" @error="onImageError" />
    <div v-if="imageWarning" class="cb-warning">
      <q-icon name="warning" size="14px" />
      {{ imageWarning }}
    </div>
    <RichText v-if="block.caption" tag="figcaption" :text="block.caption" />
    <div v-if="imageError" class="cb-error">
      <div class="cb-error-title">Gambar gagal dimuat.</div>
      <div v-if="imageWarning" class="cb-error-hint">{{ imageWarning }}</div>
      <q-btn flat dense size="sm" icon="open_in_new" label="Buka URL di tab baru" :href="block.src" target="_blank"
        rel="noopener" class="q-mt-sm" />
    </div>
  </figure>

  <!-- VIDEO -->
  <figure v-else-if="block.type === 'video'" class="cb-video">
    <div class="cb-video-frame">
      <iframe v-if="isYouTube" :src="videoUrl" :title="block.caption || 'Video materi'" frameborder="0" loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen />
      <video v-else :src="videoUrl" :poster="block.poster" controls preload="metadata" />
      <div v-if="videoWarning" class="cb-warning">
        <q-icon name="warning" size="14px" />
        {{ videoWarning }}
      </div>
    </div>
    <RichText v-if="block.caption" tag="figcaption" :text="block.caption" />
  </figure>

  <!-- AUDIO -->
  <figure v-else-if="block.type === 'audio'" class="cb-audio">
    <div class="cb-audio-label">🎧 AUDIO</div>
    <audio :src="block.src" controls preload="metadata" />
    <RichText v-if="block.caption" tag="figcaption" :text="block.caption" />
  </figure>

  <!-- CALLOUT -->
  <div v-else-if="block.type === 'callout'" class="cb-callout" :class="`cb-callout--${block.variant || 'info'}`">
    <RichText v-if="block.title" tag="div" class="cb-callout-title" :text="block.title" />
    <RichText tag="p" class="cb-callout-text" :text="block.text" />
  </div>

  <!-- QUOTE -->
  <blockquote v-else-if="block.type === 'quote'" class="cb-quote">
    <RichText tag="p" class="cb-quote-text" :text="block.text" />
    <RichText v-if="block.author" tag="footer" class="cb-quote-author" :text="`— ${block.author}`" />
  </blockquote>

  <!-- LIST -->
  <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.type === 'list'" class="cb-list">
    <RichText v-for="(item, i) in block.items" :key="i" tag="li" :text="item" />
  </component>

  <!-- TABLE -->
  <div v-else-if="block.type === 'table'" class="cb-table-wrap">
    <table class="cb-table">
      <thead>
        <tr>
          <RichText v-for="(h, i) in block.headers" :key="i" tag="th" :text="h" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, r) in block.rows" :key="r">
          <RichText v-for="(cell, c) in row" :key="c" tag="td" :text="cell" />
        </tr>
      </tbody>
    </table>
  </div>

  <!-- DIVIDER -->
  <hr v-else-if="block.type === 'divider'" class="cb-divider" />

  <!-- FALLBACK -->
  <RichText v-else tag="p" class="cb-paragraph cb-paragraph--fallback" :text="block.text || ''" />
</template>

<script setup>
// ═══════════════════════════════════════════════════════════════
// ⚠️ JANGAN LUPA IMPORT INI — kalau hilang, error
//    "Failed to resolve component: RichText" akan muncul
// ═══════════════════════════════════════════════════════════════
import { ref, computed } from 'vue'
import RichText from './RichText.vue'
import { normalizeImageUrl, normalizeVideoUrl } from '../../utils/urlConverter'
const props = defineProps({
  block: { type: Object, required: true },
})

const imageError = ref(false)
function onImageError() { imageError.value = true }

// ═══ Normalisasi URL gambar ═══
const imageUrl = computed(() => {
  const r = normalizeImageUrl(props.block.src)
  // r.url selalu ada (fallback ke input original)
  return r.url
})

const imageWarning = computed(() => normalizeImageUrl(props.block.src).warning)

// ═══ Normalisasi URL video ═══
const videoUrl = computed(() => {
  const r = normalizeVideoUrl(props.block.src)
  return r.url
})

const videoWarning = computed(() => normalizeVideoUrl(props.block.src).warning)

const isYouTube = computed(() => {
  const r = normalizeVideoUrl(props.block.src)
  return /youtube(-nocookie)?\.com\/embed\//.test(r.url)
})
</script>

<style scoped>
/* ═══ Paragraph & Heading ═══ */
.cb-paragraph {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--ink-900, #1B2733);
  margin: 0 0 14px;
  max-width: 68ch;
}

.cb-paragraph--fallback {
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
}

.cb-heading {
  color: var(--navy-900, #0B1F33);
  margin: 20px 0 10px;
  line-height: 1.3;
}

h3.cb-heading {
  font-size: 1.1rem;
}

h4.cb-heading {
  font-size: 1rem;
}

/* ═══ Image ═══ */
.cb-image {
  margin: 20px 0;
  text-align: center;
}

.cb-image img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid var(--border, #D8DEE5);
}

.cb-image--small img {
  max-width: 320px;
}

.cb-image--medium img {
  max-width: 520px;
}

.cb-image--full img {
  max-width: 100%;
}

.cb-image figcaption {
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
  margin-top: 6px;
}

.cb-error {
  font-size: 0.8rem;
  color: var(--red-500, #A6403F);
  padding: 10px;
  background: var(--red-100, #F1DCDB);
  border-radius: 4px;
  margin-top: 8px;
}

/* ═══ Video ═══ */
.cb-video {
  margin: 20px 0;
}

.cb-video-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
}

.cb-video-frame iframe,
.cb-video-frame video {
  width: 100%;
  height: 100%;
  border: 0;
}

.cb-video figcaption {
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
  margin-top: 6px;
  text-align: center;
}

/* ═══ Audio ═══ */
.cb-audio {
  margin: 20px 0;
  padding: 14px 16px;
  background: var(--paper, #F4F6F8);
  border-left: 3px solid var(--gold-500, #C9A227);
  border-radius: 4px;
}

.cb-audio-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: var(--gold-500, #C9A227);
  margin-bottom: 8px;
}

.cb-audio audio {
  width: 100%;
}

.cb-audio figcaption {
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 6px;
}

/* ═══ Callout ═══ */
.cb-callout {
  margin: 20px 0;
  padding: 14px 18px;
  border-radius: 4px;
  border-left: 4px solid;
}

.cb-callout--info {
  background: #EAF2FA;
  border-color: #4A90D9;
}

.cb-callout--warning {
  background: #FFF7E6;
  border-color: #F2C037;
}

.cb-callout--success {
  background: #E8F7EE;
  border-color: #21ba45;
}

.cb-callout-title {
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--navy-900, #0B1F33);
}

.cb-callout-text {
  margin: 0;
  line-height: 1.6;
}

/* ═══ Quote ═══ */
.cb-quote {
  margin: 20px 0;
  padding: 16px 20px;
  background: var(--paper, #F4F6F8);
  border-left: 4px solid var(--gold-500, #C9A227);
  border-radius: 4px;
  font-style: italic;
}

.cb-quote-text {
  margin: 0 0 8px;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--navy-900, #0B1F33);
}

.cb-quote-author {
  font-size: 0.85rem;
  color: var(--ink-500, #5B6B7C);
  font-style: normal;
}

/* ═══ List ═══ */
.cb-list {
  margin: 12px 0 16px;
  padding-left: 24px;
  line-height: 1.75;
  color: var(--ink-900, #1B2733);
  max-width: 68ch;
}

.cb-list li {
  margin-bottom: 4px;
}

/* ═══ Table ═══ */
.cb-table-wrap {
  margin: 20px 0;
  overflow-x: auto;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 6px;
}

.cb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.cb-table th,
.cb-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border, #D8DEE5);
}

.cb-table th {
  background: var(--paper, #F4F6F8);
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
}

.cb-table tr:last-child td {
  border-bottom: none;
}

/* ═══ Divider ═══ */
.cb-divider {
  border: 0;
  border-top: 1px dashed var(--border, #D8DEE5);
  margin: 24px 0;
}

.cb-warning {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-top: 8px;
  padding: 8px 10px;
  background: #FFF4D6;
  border-left: 3px solid #F2C037;
  border-radius: 3px;
  font-size: 0.78rem;
  color: #8A6A14;
  line-height: 1.5;
}

.cb-error-title {
  font-weight: 700;
  margin-bottom: 4px;
}

.cb-error-hint {
  font-size: 0.75rem;
  color: #8A6A14;
  margin-bottom: 6px;
  line-height: 1.5;
}
</style>
