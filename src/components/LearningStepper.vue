<template>
  <div class="stepper" role="list">
    <div v-for="(step, i) in steps" :key="step.key" class="stepper__item"
      :class="[`stepper__item--${step.status}`, { 'stepper__item--last': i === steps.length - 1 }]" role="listitem">
      <div class="stepper__node">
        <q-icon v-if="step.status === 'done'" name="check" size="16px" />
        <q-icon v-else-if="step.status === 'locked'" name="lock" size="14px" />
        <span v-else class="stepper__num">{{ i + 1 }}</span>
      </div>
      <div class="stepper__label">
        <div class="stepper__title">{{ step.label }}</div>
        <div v-if="step.caption" class="stepper__caption">{{ step.caption }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * Array of { key, label, caption?, status: 'done'|'active'|'available'|'locked' }
   */
  steps: { type: Array, required: true },
})
</script>

<style scoped>
.stepper {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 16px;
  background: var(--paper);
  border-radius: 6px;
  margin-bottom: 20px;
}

.stepper__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper__node {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border: 1px solid var(--border);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ink-500);
  flex-shrink: 0;
}

.stepper__item--done .stepper__node {
  background: var(--gold-500);
  border-color: var(--gold-500);
  color: var(--navy-900);
}

.stepper__item--active .stepper__node {
  background: var(--navy-700);
  border-color: var(--navy-700);
  color: white;
}

.stepper__item--locked .stepper__node {
  background: var(--red-100);
  border-color: var(--red-100);
  color: var(--red-500);
}

.stepper__title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-900);
}

.stepper__caption {
  font-size: 0.72rem;
  color: var(--ink-500);
}

.stepper__item:not(.stepper__item--last)::after {
  content: '';
  width: 14px;
  height: 1px;
  background: var(--border);
  margin-left: 4px;
}
</style>
