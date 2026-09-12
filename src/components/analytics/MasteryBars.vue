<template>
  <div class="mastery-bars">
    <div v-if="!items.length" class="mb-empty">
      Belum ada data penguasaan.
    </div>

    <div v-for="item in items" :key="item.moduleId" class="mb-row">
      <div class="mb-label">
        <span class="mb-name">{{ item.label }}</span>
        <span v-if="item.passed" class="mb-badge mb-badge--passed">✓</span>
      </div>
      <div class="mb-bar-wrap">
        <div class="mb-bar" :class="`mb-bar--${barClass(item.percent)}`" :style="{ width: item.percent + '%' }">
          <span v-if="item.percent >= 20" class="mb-percent">{{ item.percent }}%</span>
        </div>
      </div>
      <div class="mb-score">
        <span class="mb-avg">{{ item.avgScore }}</span>
        <span class="mb-unit">/100</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true }, // [{ moduleId, label, percent, avgScore, passed }]
})

function barClass(percent) {
  if (percent >= 80) return 'high'
  if (percent >= 60) return 'mid'
  if (percent > 0) return 'low'
  return 'empty'
}
</script>

<style scoped>
.mastery-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mb-empty {
  padding: 24px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
  font-size: 0.9rem;
}

.mb-row {
  display: grid;
  grid-template-columns: 140px 1fr 60px;
  gap: 12px;
  align-items: center;
}

.mb-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--navy-900, #0B1F33);
  overflow: hidden;
}

.mb-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mb-badge {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 8px;
  background: #E8F7EE;
  color: #15663A;
  font-weight: 700;
  flex-shrink: 0;
}

.mb-bar-wrap {
  height: 18px;
  background: #E0E6EC;
  border-radius: 3px;
  overflow: hidden;
}

.mb-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  transition: width 0.4s ease;
  border-radius: 3px;
}

.mb-bar--high {
  background: #21ba45;
}

.mb-bar--mid {
  background: #C9A227;
}

.mb-bar--low {
  background: #f2c037;
}

.mb-bar--empty {
  background: #B0B8C0;
}

.mb-percent {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #FFFFFF;
  font-weight: 700;
}

.mb-score {
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
}

.mb-avg {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
}

.mb-unit {
  font-size: 0.7rem;
  color: var(--ink-500, #5B6B7C);
}

@media (max-width: 640px) {
  .mb-row {
    grid-template-columns: 100px 1fr 50px;
    gap: 8px;
  }

  .mb-name {
    font-size: 0.78rem;
  }
}
</style>
