// src/composables/useOnboarding.js
// =============================================================
// State management untuk tutorial onboarding (multi-tour).
// Setiap tour punya storage key sendiri di localStorage.
// =============================================================

import { ref, computed } from 'vue'
import mainTourConfig from '../data/tour.json'
import materiTourConfig from '../data/tour-materi.json'
import subjectTourConfig from '../data/tour-subject.json'
// ═══════════════════════════════════════════════════════════
// Registry config tour
// ═══════════════════════════════════════════════════════════
const TOURS = {
  main: {
    config: mainTourConfig,
    storageKey: `ppkn-tour-v${mainTourConfig.tourVersion || 1}`,
  },
  materi: {
    config: materiTourConfig,
    storageKey: `${materiTourConfig.storageKey || 'ppkn-tour-materi'}-v${materiTourConfig.tourVersion || 1}`,
  },
  subject: {
    config: subjectTourConfig,
    storageKey: `${subjectTourConfig.storageKey || 'ppkn-tour-subject'}-v${subjectTourConfig.tourVersion || 1}`,
  },
}

// ═══════════════════════════════════════════════════════════
// Module-level state (shared singleton)
// ═══════════════════════════════════════════════════════════
const activeTourId = ref(null) // 'main' | 'materi' | null
const currentStepIndex = ref(0)
const isActive = ref(false)

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
function getTour(tourId) {
  const t = TOURS[tourId]
  if (!t) {
    console.warn(`[Onboarding] Tour "${tourId}" tidak terdaftar.`)
    return null
  }
  return t
}

function hasCompletedTour(tourId) {
  const t = getTour(tourId)
  if (!t) return false
  try {
    return localStorage.getItem(t.storageKey) === 'completed'
  } catch {
    return false
  }
}

function markCompleted(tourId) {
  const t = getTour(tourId)
  if (!t) return
  try {
    localStorage.setItem(t.storageKey, 'completed')
    localStorage.setItem(`${t.storageKey}-at`, new Date().toISOString())
  } catch {
    /* noop */
  }
}

function resetCompletion(tourId) {
  const t = getTour(tourId)
  if (!t) return
  try {
    localStorage.removeItem(t.storageKey)
    localStorage.removeItem(`${t.storageKey}-at`)
  } catch {
    /* noop */
  }
}

// ═══════════════════════════════════════════════════════════
// Composable
// ═══════════════════════════════════════════════════════════
export function useOnboarding() {
  // ═══ Active tour config ═══
  const activeConfig = computed(() => {
    if (!activeTourId.value) return null
    return getTour(activeTourId.value)?.config || null
  })

  const steps = computed(() => activeConfig.value?.steps || [])
  const totalSteps = computed(() => steps.value.length)
  const currentStep = computed(() => steps.value[currentStepIndex.value] || null)
  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => currentStepIndex.value === totalSteps.value - 1)
  const progress = computed(() =>
    totalSteps.value > 0 ? Math.round(((currentStepIndex.value + 1) / totalSteps.value) * 100) : 0,
  )

  // ═══ Actions ═══
  function start(tourId = 'main', stepIndex = 0) {
    const t = getTour(tourId)
    if (!t) return
    if (!t.config.steps?.length) {
      console.warn(`[Onboarding] Tour "${tourId}" tidak punya steps.`)
      return
    }
    activeTourId.value = tourId
    currentStepIndex.value = Math.max(0, Math.min(stepIndex, t.config.steps.length - 1))
    isActive.value = true
  }

  // Alias untuk backward-compat
  function startTour(stepIndex = 0) {
    start('main', stepIndex)
  }

  function stop({ completed = false } = {}) {
    if (completed && activeTourId.value) {
      markCompleted(activeTourId.value)
    }
    isActive.value = false
    currentStepIndex.value = 0
    activeTourId.value = null
  }

  function next() {
    if (isLastStep.value) {
      stop({ completed: true })
      return
    }
    currentStepIndex.value++
  }

  function prev() {
    if (isFirstStep.value) return
    currentStepIndex.value--
  }

  function goTo(index) {
    if (index < 0 || index >= totalSteps.value) return
    currentStepIndex.value = index
  }

  function skip() {
    stop({ completed: true })
  }

  /**
   * Auto-start tour jika belum pernah selesai.
   *
   * @param {string} tourId - 'main' | 'materi'
   * @param {Object} [options]
   * @param {number} [options.delayMs=800] - delay sebelum start
   * @param {Function} [options.waitFor] - fungsi yang mengembalikan true saat kondisi siap
   * @param {number} [options.maxWaitMs=8000] - batas maksimal menunggu kondisi
   * @param {number} [options.pollMs=300] - interval cek kondisi
   * @returns {Function} cleanup function — panggil untuk membatalkan auto-start
   */
  function maybeAutoStart(tourId = 'main', options = {}) {
    const {
      delayMs = 800,
      waitFor = null,
      maxWaitMs = 8000,
      pollMs = 300,
    } = typeof options === 'number' ? { delayMs: options } : options

    if (hasCompletedTour(tourId)) return () => {}

    let cancelled = false
    let timeoutId = null
    let pollId = null
    const startedAt = Date.now()

    const tryStart = () => {
      if (cancelled) return
      if (isActive.value) return
      start(tourId, 0)
    }

    const poll = () => {
      if (cancelled) return
      if (isActive.value) return

      const elapsed = Date.now() - startedAt
      let ready

      try {
        ready = typeof waitFor === 'function' ? !!waitFor() : true
      } catch (e) {
        console.warn('[Onboarding] waitFor error:', e)
        ready = true
      }

      if (ready) {
        tryStart()
        return
      }

      if (elapsed >= maxWaitMs) {
        console.info('[Onboarding] Batas waktu tunggu tercapai — start tour anyway.')
        tryStart()
        return
      }

      pollId = setTimeout(poll, pollMs)
    }

    // Delay awal, lalu mulai polling
    timeoutId = setTimeout(() => {
      if (cancelled) return
      if (delayMs <= 0) {
        poll()
      } else {
        poll()
      }
    }, delayMs)

    // Return cleanup
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      if (pollId) clearTimeout(pollId)
    }
  }

  return {
    // state
    isActive,
    currentStepIndex,
    activeTourId,
    // computed
    steps,
    totalSteps,
    currentStep,
    isFirstStep,
    isLastStep,
    progress,
    // actions
    start,
    startTour,
    stop,
    next,
    prev,
    goTo,
    skip,
    maybeAutoStart,
    // per-tour helpers
    hasCompletedTour,
    resetCompletion,
  }
}

export default { useOnboarding }
