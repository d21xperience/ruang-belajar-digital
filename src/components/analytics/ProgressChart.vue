<template>
  <div class="progress-chart">
    <div v-if="!series.length" class="chart-empty">
      Belum ada data ujian. Kerjakan Post Test untuk melihat perkembangan.
    </div>

    <template v-else>
      <!-- Legend -->
      <div class="chart-legend">
        <span v-for="s in series" :key="s.moduleId" class="legend-item">
          <span class="legend-dot" :style="{ background: colorFor(s.moduleId) }" />
          {{ s.label }}
        </span>
      </div>

      <!-- SVG Chart -->
      <div class="chart-svg-wrap">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="xMidYMid meet"
          class="chart-svg"
          role="img"
          aria-label="Grafik perkembangan skor per modul"
        >
          <!-- Grid horizontal + label Y -->
          <g class="chart-grid">
            <template v-for="(tick, i) in yTicks" :key="i">
              <line
                :x1="PAD_L" :x2="W - PAD_R"
                :y1="yPos(tick)" :y2="yPos(tick)"
                stroke="#E0E6EC" stroke-dasharray="2 2"
              />
              <text
                :x="PAD_L - 6" :y="yPos(tick) + 4"
                text-anchor="end"
                class="chart-label"
              >{{ tick }}</text>
            </template>
          </g>

          <!-- Garis KKM -->
          <line
            :x1="PAD_L" :x2="W - PAD_R"
            :y1="yPos(passingScore)" :y2="yPos(passingScore)"
            stroke="#C9A227" stroke-width="1.5" stroke-dasharray="6 3"
          />
          <text
            :x="W - PAD_R" :y="yPos(passingScore) - 4"
            text-anchor="end"
            class="chart-kkm-label"
          >KKM {{ passingScore }}</text>

          <!-- Sumbu X & Y -->
          <line :x1="PAD_L" :x2="W - PAD_R" :y1="H - PAD_B" :y2="H - PAD_B" stroke="#A0AAB5" />
          <line :x1="PAD_L" :x2="PAD_L" :y1="PAD_T" :y2="H - PAD_B" stroke="#A0AAB5" />

          <!-- Line per modul -->
          <g v-for="s in series" :key="s.moduleId">
            <polyline
              :points="polylinePoints(s)"
              :stroke="colorFor(s.moduleId)"
              stroke-width="2.5"
              fill="none"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Dots -->
            <circle
              v-for="(score, i) in s.scores"
              :key="i"
              :cx="xPos(i, s.scores.length)"
              :cy="yPos(score)"
              :r="4"
              :fill="colorFor(s.moduleId)"
              stroke="#FFFFFF"
              stroke-width="1.5"
            >
              <title>{{ s.label }} · Percobaan {{ i + 1 }}: {{ score }}</title>
            </circle>
          </g>

          <!-- X labels (percobaan ke-N) -->
          <text
            v-for="i in maxAttempts"
            :key="`x${i}`"
            :x="xPos(i - 1, maxAttempts)"
            :y="H - PAD_B + 16"
            text-anchor="middle"
            class="chart-label"
          >#{{ i }}</text>
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, required: true }, // [{ moduleId, label, scores: [num], passingScore }]
  passingScore: { type: Number, default: 80 },
})

const W = 600
const H = 280
const PAD_L = 40
const PAD_R = 20
const PAD_T = 20
const PAD_B = 36

const maxAttempts = computed(() => {
  const max = Math.max(1, ...props.series.map((s) => s.scores.length))
  return max
})

const yTicks = computed(() => [0, 20, 40, 60, 80, 100])

function xPos(i, total) {
  if (total <= 1) return PAD_L + (W - PAD_L - PAD_R) / 2
  const step = (W - PAD_L - PAD_R) / (total - 1)
  return PAD_L + i * step
}

function yPos(score) {
  const usable = H - PAD_T - PAD_B
  // Skor 0 di bawah, 100 di atas
  return PAD_T + (1 - score / 100) * usable
}

function polylinePoints(s) {
  return s.scores
    .map((score, i) => `${xPos(i, s.scores.length)},${yPos(score)}`)
    .join(' ')
}

// Warna konsisten per modul
const PALETTE = ['#16324F', '#C9A227', '#A6403F', '#2E7D32', '#6A1B9A', '#0277BD', '#EF6C00']
function colorFor(moduleId) {
  // Hash moduleId ke palette
  let h = 0
  for (let i = 0; i < moduleId.length; i++) h = (h * 31 + moduleId.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}
</script>

<style scoped>
.progress-chart { padding: 8px 0; }
.chart-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--ink-500, #5B6B7C);
  font-style: italic;
  font-size: 0.9rem;
  background: var(--paper, #F4F6F8);
  border-radius: 6px;
}
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 0.78rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-900, #1B2733);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.chart-svg-wrap {
  width: 100%;
  overflow-x: auto;
}
.chart-svg {
  width: 100%;
  height: auto;
  min-width: 320px;
  display: block;
}
.chart-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  fill: #5B6B7C;
}
.chart-kkm-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  fill: #C9A227;
  font-weight: 700;
}
</style>
