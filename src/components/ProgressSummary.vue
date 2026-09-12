<template>
  <div class="progress-summary">
    <div class="progress-summary__head">
      <span class="mono-tag">PROGRES PEMBELAJARAN</span>
      <span class="progress-summary__percent">{{ progress.percent }}%</span>
    </div>
    <div class="ruler">
      <div v-for="(mod, i) in modules" :key="mod.id" class="ruler-tick" :class="{
        'ruler-tick--done': moduleStatus(mod.id) === 'passed',
        'ruler-tick--active': moduleStatus(mod.id) === 'active',
        'ruler-tick--locked': moduleStatus(mod.id) === 'locked',
      }" :aria-label="`Modul ${i + 1}: ${moduleStatus(mod.id)}`" />
    </div>
    <div class="progress-summary__caption">
      {{ progress.passedModules }} dari {{ progress.totalModules }} modul selesai
    </div>
  </div>
</template>

<script setup>
defineProps({
  progress: { type: Object, required: true }, // { percent, passedModules, totalModules }
  modules: { type: Array, required: true },
  moduleStatus: { type: Function, required: true }, // (moduleId) => 'passed'|'active'|'available'|'locked'
})
</script>

<style scoped>
.progress-summary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  padding: 20px;
}

.progress-summary__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: #9FB0C0;
}

.progress-summary__percent {
  color: var(--gold-500);
  font-size: 1.6rem;
  font-weight: 700;
}

.ruler {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.ruler-tick {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.ruler-tick--done {
  background: var(--gold-500);
}

.ruler-tick--active {
  background: rgba(201, 162, 39, 0.55);
}

.ruler-tick--locked {
  background: rgba(166, 64, 63, 0.35);
}

.progress-summary__caption {
  color: #9FB0C0;
  font-size: 0.85rem;
}
</style>
