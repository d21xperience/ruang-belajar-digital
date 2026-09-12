<template>
  <q-page class="faq-page">
    <div class="faq-wrap">
      <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" class="q-mb-md" @click="$router.push('/')" />

      <FaqSection />

      <div class="faq-meta">
        Terakhir diperbarui: {{ lastUpdated }}
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import FaqSection from '../components/faq/FaqSection.vue'
import faqData from '../data/faq.json'

const lastUpdated = computed(() => {
  const iso = faqData.lastUpdated || ''
  if (!iso) return '—'
  const d = new Date(iso)
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
})
</script>

<style scoped>
.faq-page {
  background: var(--paper, #F4F6F8);
  min-height: 100vh;
}

.faq-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}

.faq-meta {
  text-align: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  color: var(--ink-500, #5B6B7C);
  margin-top: 24px;
}
</style>
