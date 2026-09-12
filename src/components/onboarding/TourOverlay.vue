<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="isActive && currentStep" class="tour-root" role="dialog" aria-modal="true"
        :aria-label="`Tur: ${currentStep.title}`" @keydown.esc="skip" @keydown.right="next" @keydown.left="prev"
        tabindex="-1" ref="rootRef">
        <!-- ══════ SPOTLIGHT (cut-out) ══════ -->
        <div class="tour-backdrop" :style="backdropStyle" @click="onBackdropClick" />

        <!-- ══════ HIGHLIGHT BORDER ══════ -->
        <div v-if="targetRect" class="tour-highlight" :style="highlightStyle" aria-hidden="true" />

        <!-- ══════ TOOLTIP ══════ -->
        <div class="tour-tooltip" :class="[`tour-tooltip--${placement}`]" :style="tooltipStyle" @click.stop>
          <!-- Arrow pointer -->
          <div v-if="showArrow" class="tour-arrow" :class="`tour-arrow--${placement}`" />

          <!-- Header -->
          <div class="tour-head">
            <div class="tour-step-badge">
              {{ currentStepIndex + 1 }} / {{ totalSteps }}
            </div>
            <button type="button" class="tour-close" aria-label="Tutup tur" @click="skip">
              <q-icon name="close" size="16px" />
            </button>
          </div>

          <!-- Content -->
          <h3 class="tour-title">{{ currentStep.title }}</h3>
          <p class="tour-desc">{{ currentStep.description }}</p>

          <!-- Progress dots -->
          <div class="tour-dots" role="tablist">
            <button v-for="(step, i) in steps" :key="step.id" type="button" class="tour-dot" :class="{
              'tour-dot--active': i === currentStepIndex,
              'tour-dot--done': i < currentStepIndex,
            }" :aria-label="`Ke langkah ${i + 1}`" @click="goTo(i)" />
          </div>

          <!-- Actions -->
          <div class="tour-actions">
            <button type="button" class="tour-btn tour-btn--ghost" @click="skip">
              Lewati
            </button>
            <div class="tour-actions-right">
              <button v-if="!isFirstStep" type="button" class="tour-btn tour-btn--ghost" @click="prev">
                Kembali
              </button>
              <button type="button" class="tour-btn tour-btn--primary" @click="next">
                {{ isLastStep ? 'Selesai' : 'Lanjut' }}
                <q-icon :name="isLastStep ? 'check' : 'chevron_right'" size="16px" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useOnboarding } from '../../composables/useOnboarding'

const {
  isActive,
  currentStepIndex,
  steps,
  totalSteps,
  currentStep,
  isFirstStep,
  isLastStep,
  next,
  prev,
  goTo,
  skip,
} = useOnboarding()

// ══════ State ══════
const rootRef = ref(null)
const targetRect = ref(null)
const targetEl = ref(null)
const tooltipSize = ref({ width: 340, height: 220 })
const viewportSize = ref({ width: 1024, height: 768 })

// ══════ Computed: placement & posisi ══════
const placement = computed(() => {
  if (!targetRect.value) return 'center'
  const step = currentStep.value
  const preferred = step?.placement || 'bottom'

  // Auto-flip jika tidak muat
  const space = {
    top: targetRect.value.top,
    bottom: viewportSize.value.height - targetRect.value.bottom,
    left: targetRect.value.left,
    right: viewportSize.value.width - targetRect.value.right,
  }

  const tooltipW = tooltipSize.value.width
  const tooltipH = tooltipSize.value.height
  const margin = 16

  // Cek apakah preferred placement muat
  const fits = {
    top: space.top > tooltipH + margin,
    bottom: space.bottom > tooltipH + margin,
    left: space.left > tooltipW + margin,
    right: space.right > tooltipW + margin,
  }

  if (fits[preferred]) return preferred

  // Fallback: cari yang muat (prioritas: bawah, atas, kanan, kiri)
  const fallbackOrder = ['bottom', 'top', 'right', 'left']
  for (const p of fallbackOrder) {
    if (fits[p]) return p
  }

  // Kalau semua tidak muat → tampilkan di bawah tapi overlap
  return 'bottom'
})

const showArrow = computed(() =>
  !!targetRect.value && placement.value !== 'center'
)

// ══════ Computed: styles ══════
const backdropStyle = computed(() => {
  if (!targetRect.value) {
    return { background: 'rgba(11, 31, 51, 0.85)' }
  }
  const r = targetRect.value
  const padding = 8
  // Cut-out: pakai box-shadow trick
  return {
    background: 'transparent',
    boxShadow: `0 0 0 9999px rgba(11, 31, 51, 0.75)`,
    position: 'fixed',
    top: `${r.top - padding}px`,
    left: `${r.left - padding}px`,
    width: `${r.width + padding * 2}px`,
    height: `${r.height + padding * 2}px`,
    borderRadius: '8px',
    pointerEvents: 'auto',
  }
})

const highlightStyle = computed(() => {
  if (!targetRect.value) return { display: 'none' }
  const r = targetRect.value
  const padding = 8
  return {
    position: 'fixed',
    top: `${r.top - padding}px`,
    left: `${r.left - padding}px`,
    width: `${r.width + padding * 2}px`,
    height: `${r.height + padding * 2}px`,
    border: '2px solid #C9A227',
    borderRadius: '8px',
    boxShadow: '0 0 0 4px rgba(201, 162, 39, 0.25), 0 0 30px rgba(201, 162, 39, 0.4)',
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
    zIndex: 999999,
  }
})

const tooltipStyle = computed(() => {
  const tW = tooltipSize.value.width
  const tH = tooltipSize.value.height
  const vW = viewportSize.value.width
  const vH = viewportSize.value.height
  const margin = 16

  // Center placement (no target)
  if (!targetRect.value || placement.value === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${Math.min(tW, vW - 32)}px`,
      maxWidth: '92vw',
    }
  }

  const r = targetRect.value
  let top = 0
  let left = 0

  switch (placement.value) {
    case 'bottom':
      top = r.bottom + margin
      left = r.left + r.width / 2 - tW / 2
      break
    case 'top':
      top = r.top - tH - margin
      left = r.left + r.width / 2 - tW / 2
      break
    case 'right':
      top = r.top + r.height / 2 - tH / 2
      left = r.right + margin
      break
    case 'left':
      top = r.top + r.height / 2 - tH / 2
      left = r.left - tW - margin
      break
  }

  // Clamp ke viewport
  left = Math.max(12, Math.min(left, vW - tW - 12))
  top = Math.max(12, Math.min(top, vH - tH - 12))

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${Math.min(tW, vW - 32)}px`,
    maxWidth: '92vw',
  }
})

// ══════ Functions ══════
function updateViewport() {
  if (typeof window === 'undefined') return
  viewportSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function updateTooltipSize() {
  nextTick(() => {
    const el = document.querySelector('.tour-tooltip')
    if (el) {
      tooltipSize.value = {
        width: el.offsetWidth,
        height: el.offsetHeight,
      }
    }
  })
}

function findTarget() {
  const step = currentStep.value
  if (!step?.target) {
    targetRect.value = null
    targetEl.value = null
    return false
  }

  try {
    const el = document.querySelector(step.target)
    if (!el) {
      targetRect.value = null
      targetEl.value = null
      return false
    }

    const rect = el.getBoundingClientRect()
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(updateTargetRect, 350)
    } else {
      targetRect.value = rect
    }
    targetEl.value = el
    return true
  } catch (e) {
    console.warn('[Tour] Gagal cari target:', e)
    targetRect.value = null
    return false
  }
}

function updateTargetRect() {
  if (!targetEl.value) {
    targetRect.value = null
    return
  }
  targetRect.value = targetEl.value.getBoundingClientRect()
}

function onBackdropClick() {
  // Klik backdrop = next (UX-friendly)
  next()
}

function onResize() {
  updateViewport()
  updateTargetRect()
}

function onKeyDown(e) {
  if (!isActive.value) return
  if (e.key === 'Escape') skip()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

// ══════ Lifecycle ══════
onMounted(() => {
  updateViewport()
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', updateTargetRect, { passive: true })
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', updateTargetRect)
  window.removeEventListener('keydown', onKeyDown)
})

// ═══════════════════════════════════════════════════════════
// Auto-skip step "optional" yang target-nya tidak ada di DOM
// ═══════════════════════════════════════════════════════════
async function trySkipOptionalStep() {
  const step = currentStep.value
  if (!step || !step.optional || !step.target) return false

  await nextTick()
  const el = document.querySelector(step.target)
  if (el) return false

  // Target tidak ada → skip
  if (isLastStep.value) {
    stop({ completed: true })
  } else {
    // Langsung increment untuk avoid recursion via next()
    currentStepIndex.value++
  }
  return true
}

// Watch step changes
watch(currentStepIndex, async () => {
  targetRect.value = null
  await nextTick()

  // Coba skip jika optional & target tidak ada
  const skipped = await trySkipOptionalStep()
  if (skipped) return // watch akan trigger lagi untuk step berikutnya

  findTarget()
  updateTooltipSize()
})

watch(isActive, async (active) => {
  if (active) {
    await nextTick()
    findTarget()
    updateTooltipSize()
    rootRef.value?.focus()
  } else {
    targetRect.value = null
    targetEl.value = null
  }
})
</script>

<style>
/* ═══ Root ═══ */
.tour-root {
  position: fixed;
  inset: 0;
  z-index: 9999999;
  outline: none;
}

.tour-backdrop {
  position: fixed;
  inset: 0;
  transition: all 0.3s ease;
  z-index: 1;
}

/* ═══ Highlight border ═══ */
.tour-highlight {
  z-index: 2;
}

/* ═══ Tooltip ═══ */
.tour-tooltip {
  position: fixed;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(201, 162, 39, 0.2);
  padding: 20px;
  z-index: 3;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: #1B2733;
  transition: top 0.3s ease, left 0.3s ease;
}

/* Arrow */
.tour-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #FFFFFF;
  transform: rotate(45deg);
  box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.05);
}

.tour-arrow--bottom {
  top: -6px;
  left: 50%;
  margin-left: -6px;
}

.tour-arrow--top {
  bottom: -6px;
  left: 50%;
  margin-left: -6px;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
}

.tour-arrow--right {
  left: -6px;
  top: 50%;
  margin-top: -6px;
}

.tour-arrow--left {
  right: -6px;
  top: 50%;
  margin-top: -6px;
  box-shadow: 1px -1px 2px rgba(0, 0, 0, 0.05);
}

/* ═══ Head ═══ */
.tour-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tour-step-badge {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #8A6A14;
  background: #F3E7C4;
  padding: 3px 10px;
  border-radius: 10px;
}

.tour-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #5B6B7C;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.tour-close:hover {
  background: #F4F6F8;
}

.tour-close:focus-visible {
  outline: 2px solid #C9A227;
  outline-offset: 2px;
}

/* ═══ Content ═══ */
.tour-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0B1F33;
  margin: 0 0 8px;
  line-height: 1.3;
}

.tour-desc {
  font-size: 0.88rem;
  line-height: 1.65;
  color: #5B6B7C;
  margin: 0 0 14px;
}

/* ═══ Dots ═══ */
.tour-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.tour-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #D8DEE5;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.tour-dot:hover {
  background: #A0AAB5;
}

.tour-dot--done {
  background: #C9A227;
}

.tour-dot--active {
  background: #16324F;
  width: 24px;
  border-radius: 4px;
}

.tour-dot:focus-visible {
  outline: 2px solid #C9A227;
  outline-offset: 2px;
}

/* ═══ Actions ═══ */
.tour-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.tour-actions-right {
  display: flex;
  gap: 8px;
}

.tour-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 36px;
}

.tour-btn:focus-visible {
  outline: 2px solid #C9A227;
  outline-offset: 2px;
}

.tour-btn--ghost {
  background: transparent;
  color: #5B6B7C;
}

.tour-btn--ghost:hover {
  background: #F4F6F8;
  color: #16324F;
}

.tour-btn--primary {
  background: #C9A227;
  color: #0B1F33;
}

.tour-btn--primary:hover {
  background: #b08f1e;
}

/* ═══ Transitions ═══ */
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}

/* ═══ Mobile ═══ */
@media (max-width: 480px) {
  .tour-tooltip {
    padding: 16px;
  }

  .tour-title {
    font-size: 0.98rem;
  }

  .tour-desc {
    font-size: 0.83rem;
  }

  .tour-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}
</style>
