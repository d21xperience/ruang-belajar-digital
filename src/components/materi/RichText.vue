<template>
  <component
    :is="tag"
    ref="rootRef"
    class="rich-text"
    :class="customClass"
  />
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { markdownToHtml, renderKatexInElement } from '../../composables/useRichText'

const props = defineProps({
  text: { type: [String, Number], default: '' },
  tag: { type: String, default: 'span' },
  customClass: { type: [String, Array, Object], default: '' },
})

const rootRef = ref(null)

async function renderContent() {
  if (!rootRef.value) return

  // Set HTML via innerHTML — lebih aman dari v-html pada <component :is>
  // Konten di-escape di markdownToHtml() sebelum di-render
  rootRef.value.innerHTML = markdownToHtml(props.text)

  await nextTick()

  // Render KaTeX pada text node yang mengandung $...$
  await renderKatexInElement(rootRef.value)
}

onMounted(renderContent)
watch(() => props.text, renderContent)
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   RichText styling — WAJIB pakai :deep() karena konten
   di-render via innerHTML (tidak dapat scope attribute Vue)
   ═══════════════════════════════════════════════════════════ */

.rich-text :deep(strong) {
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
}

.rich-text :deep(em) {
  font-style: italic;
  color: var(--navy-700, #16324F);
}

.rich-text :deep(u) {
  text-decoration: underline;
  text-decoration-color: var(--gold-500, #C9A227);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.rich-text :deep(s) {
  color: var(--ink-500, #5B6B7C);
  text-decoration: line-through;
}

.rich-text :deep(code) {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.88em;
  background: var(--paper, #F4F6F8);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--red-500, #A6403F);
  border: 1px solid var(--border, #D8DEE5);
}

.rich-text :deep(a) {
  color: var(--navy-700, #16324F);
  text-decoration: underline;
  text-decoration-color: var(--gold-500, #C9A227);
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
}

.rich-text :deep(a:hover) {
  color: var(--gold-500, #C9A227);
}

/* ═══ KaTeX inline — bisa di-scroll horizontal jika panjang ═══ */
.rich-text :deep(.katex-inline) {
  display: inline-block;
  vertical-align: middle;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

/* ═══ KaTeX block — center, margin atas-bawah ═══ */
.rich-text :deep(.katex-block) {
  display: block;
  margin: 16px 0;
  padding: 12px 0;
  overflow-x: auto;
  overflow-y: hidden;
  text-align: center;
}

/* ═══ Rumus gagal → tampil merah, tidak crash ═══ */
.rich-text :deep(.katex-error) {
  color: var(--red-500, #A6403F);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.85em;
  background: var(--red-100, #F1DCDB);
  padding: 1px 5px;
  border-radius: 3px;
}
</style>
