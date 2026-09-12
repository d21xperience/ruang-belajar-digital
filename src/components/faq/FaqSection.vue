<template>
  <div class="faq-section" :class="{ 'faq-section--embedded': embedded }">
    <!-- Header (opsional) -->
    <div v-if="!embedded && showHeader" class="faq-header">
      <h1 class="faq-title">Pertanyaan yang Sering Diajukan</h1>
      <p class="faq-subtitle">
        Temukan jawaban cepat untuk pertanyaan umum tentang E-Modul PPKn.
      </p>
    </div>

    <!-- Search -->
    <div v-if="showSearch" class="faq-search-wrap">
      <q-input v-model="search" outlined dense clearable placeholder="Cari pertanyaan…" class="faq-search">
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Category chips -->
    <div v-if="showCategories" class="faq-categories">
      <q-chip :selected="activeCategory === 'all'" clickable dense class="cat-chip" @click="activeCategory = 'all'">
        <q-icon name="apps" size="14px" class="q-mr-xs" />
        Semua
        <q-badge color="gold" text-color="navy-900" class="q-ml-sm" :label="String(items.length)" />
      </q-chip>
      <q-chip v-for="cat in categoriesWithCounts" :key="cat.id" :selected="activeCategory === cat.id" clickable dense
        class="cat-chip" @click="activeCategory = cat.id">
        <q-icon :name="cat.icon" size="14px" class="q-mr-xs" />
        {{ cat.label }}
        <q-badge color="grey-5" text-color="white" class="q-ml-sm" :label="String(cat.count)" />
      </q-chip>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredItems.length" class="faq-empty">
      <q-icon name="search_off" size="40px" color="grey-5" />
      <p v-if="search">
        Tidak ada FAQ yang cocok dengan kata kunci
        "<b>{{ search }}</b>".
      </p>
      <p v-else>Tidak ada FAQ di kategori ini.</p>
      <q-btn v-if="search || activeCategory !== 'all'" flat dense color="primary" label="Reset filter"
        @click="resetFilter" />
    </div>

    <!-- FAQ accordion -->
    <div v-else class="faq-list">
      <q-expansion-item v-for="item in filteredItems" :key="item.id" :id="item.id" class="faq-item" expand-separator
        header-class="faq-item-head" @show="onExpand(item)">
        <template #header>
          <q-item-section avatar>
            <q-icon :name="categoryIcon(item.category)" size="18px" class="faq-cat-icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="faq-question">{{ item.question }}</q-item-label>
            <q-item-label caption class="faq-cat-label">
              {{ categoryLabel(item.category) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat dense round size="sm" icon="link" class="faq-link-btn" @click.stop="copyLink(item)">
              <q-tooltip>Copy link ke pertanyaan ini</q-tooltip>
            </q-btn>
          </q-item-section>
        </template>

        <div class="faq-answer">
          <p>{{ item.answer }}</p>

          <!-- Feedback -->
          <div class="faq-feedback">
            <span class="faq-feedback-label">Apakah jawaban ini membantu?</span>
            <div class="faq-feedback-actions">
              <q-btn flat dense size="sm" no-caps :icon="feedback[item.id] === 'yes' ? 'thumb_up' : 'thumb_up_off_alt'"
                :color="feedback[item.id] === 'yes' ? 'positive' : 'grey-7'" label="Ya"
                @click="giveFeedback(item.id, 'yes')" />
              <q-btn flat dense size="sm" no-caps
                :icon="feedback[item.id] === 'no' ? 'thumb_down' : 'thumb_down_off_alt'"
                :color="feedback[item.id] === 'no' ? 'negative' : 'grey-7'" label="Belum"
                @click="giveFeedback(item.id, 'no')" />
            </div>
          </div>
        </div>
      </q-expansion-item>
    </div>

    <!-- Footer: contact -->
    <div v-if="!embedded" class="faq-footer">
      <q-icon name="support_agent" size="24px" color="primary" />
      <div>
        <div class="faq-footer-title">Tidak menemukan jawaban?</div>
        <div class="faq-footer-desc">
          Hubungi guru pengajar PPKn Anda atau admin sekolah untuk bantuan lebih lanjut.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import faqData from '../../data/faq.json'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  showHeader: { type: Boolean, default: true },
  showSearch: { type: Boolean, default: true },
  showCategories: { type: Boolean, default: true },
  /** Batasi jumlah FAQ yang ditampilkan (0 = semua) */
  limit: { type: Number, default: 0 },
  /** Pre-filter ke kategori tertentu */
  categoryFilter: { type: String, default: 'all' },
})

const $q = useQuasar()

// ══════ State ══════
const search = ref('')
const activeCategory = ref(props.categoryFilter)
const feedback = ref({})

// ══════ Computed ══════
const categories = computed(() => faqData.categories || [])
const items = computed(() => faqData.items || [])

const categoriesWithCounts = computed(() => {
  return categories.value.map((cat) => ({
    ...cat,
    count: items.value.filter((i) => i.category === cat.id).length,
  }))
})

const filteredItems = computed(() => {
  let list = items.value

  // Filter kategori
  if (activeCategory.value !== 'all') {
    list = list.filter((i) => i.category === activeCategory.value)
  }

  // Filter search
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
    )
  }

  // Limit
  if (props.limit > 0) {
    list = list.slice(0, props.limit)
  }

  return list
})

// ══════ Actions ══════
function resetFilter() {
  search.value = ''
  activeCategory.value = 'all'
}

function onExpand(item) {
  // Update URL hash agar bisa di-share
  if (typeof window !== 'undefined' && item?.id) {
    const newHash = `#${item.id}`
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash)
    }
  }
}

async function copyLink(item) {
  try {
    const url = `${window.location.origin}${window.location.pathname}#/faq#${item.id}`
    await navigator.clipboard.writeText(url)
    $q.notify({
      type: 'positive',
      message: 'Link ke pertanyaan ter-copy.',
      position: 'top',
      timeout: 2000,
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Gagal copy link. Salin manual dari address bar.',
      position: 'top',
    })
  }
}

function giveFeedback(id, value) {
  // Toggle
  if (feedback.value[id] === value) {
    const next = { ...feedback.value }
    delete next[id]
    feedback.value = next
    return
  }
  feedback.value = { ...feedback.value, [id]: value }
  $q.notify({
    type: 'positive',
    message: 'Terima kasih atas masukannya!',
    position: 'top',
    timeout: 1500,
  })
}

function categoryIcon(categoryId) {
  return categories.value.find((c) => c.id === categoryId)?.icon || 'help_outline'
}
function categoryLabel(categoryId) {
  return categories.value.find((c) => c.id === categoryId)?.label || categoryId
}
</script>

<style scoped>
.faq-section {
  max-width: 820px;
  margin: 0 auto;
}

.faq-section--embedded {
  max-width: 100%;
}

/* ══════ Header ══════ */
.faq-header {
  margin-bottom: 24px;
}

.faq-title {
  font-size: 1.6rem;
  margin: 0 0 6px;
  color: var(--navy-900, #0B1F33);
}

.faq-subtitle {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  margin: 0;
}

/* ══════ Search ══════ */
.faq-search-wrap {
  margin-bottom: 14px;
}

/* ══════ Category chips ══════ */
.faq-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.cat-chip {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  cursor: pointer;
  color: var(--ink-900, #1B2733);
  transition: all 0.15s;
}

.cat-chip.q-chip--selected {
  background: var(--gold-100, #F3E7C4);
  color: #8A6A14;
  border-color: var(--gold-500, #C9A227);
  font-weight: 600;
}

/* ══════ Empty ══════ */
.faq-empty {
  padding: 48px 20px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  background: #fff;
  border: 1px dashed var(--border, #D8DEE5);
  border-radius: 8px;
}

.faq-empty p {
  margin: 12px 0 0;
  line-height: 1.6;
}

.faq-empty b {
  color: var(--navy-900, #0B1F33);
}

/* ══════ FAQ items ══════ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item {
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.faq-item:hover {
  border-color: var(--gold-500, #C9A227);
}

.faq-item :deep(.faq-item-head) {
  min-height: 60px;
  padding: 8px 8px 8px 12px;
}

.faq-cat-icon {
  color: var(--gold-500, #C9A227);
}

.faq-question {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--navy-900, #0B1F33);
  line-height: 1.4;
}

.faq-cat-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.68rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 2px;
}

.faq-link-btn {
  color: var(--ink-500, #5B6B7C);
  opacity: 0;
  transition: opacity 0.15s;
}

.faq-item:hover .faq-link-btn {
  opacity: 1;
}

/* ══════ Answer ══════ */
.faq-answer {
  padding: 4px 20px 16px 46px;
  border-top: 1px solid var(--border, #D8DEE5);
  background: #FAFBFC;
}

.faq-answer p {
  margin: 12px 0 0;
  line-height: 1.75;
  color: var(--ink-900, #1B2733);
  font-size: 0.92rem;
}

/* ══════ Feedback ══════ */
.faq-feedback {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--border, #D8DEE5);
}

.faq-feedback-label {
  font-size: 0.8rem;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
}

.faq-feedback-actions {
  display: flex;
  gap: 4px;
}

/* ══════ Footer ══════ */
.faq-footer {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 32px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid var(--border, #D8DEE5);
  border-left: 4px solid var(--gold-500, #C9A227);
  border-radius: 8px;
}

.faq-footer-title {
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
  font-size: 0.92rem;
}

.faq-footer-desc {
  color: var(--ink-500, #5B6B7C);
  font-size: 0.85rem;
  line-height: 1.6;
  margin-top: 2px;
}

/* ══════ Responsive ══════ */
@media (max-width: 600px) {
  .faq-answer {
    padding: 4px 16px 14px 16px;
  }

  .faq-title {
    font-size: 1.3rem;
  }

  .faq-question {
    font-size: 0.9rem;
  }

  .faq-link-btn {
    opacity: 1;
  }
}
</style>
