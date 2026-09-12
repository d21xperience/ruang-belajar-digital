// src/composables/useLearningProgress.js
// =============================================================

import { ref, computed } from 'vue'
import repo from '../repositories/learningStateRepository'
import contentRepo from '../repositories/contentRepository'
import LEARNING_CONFIG from '../config/learning.js'
import { useSubject } from './useSubject'

const state = ref(repo.loadState())

function refresh() {
  state.value = repo.loadState()
}

export function useLearningProgress() {
  const { activeSubjectId } = useSubject()

  // ═══ Filter modul by active subject ═══
  const orderedModules = computed(() => {
    const modules = contentRepo.getModulesBySubject(activeSubjectId.value)
    return [...modules].sort((a, b) => (a.urutan || 0) - (b.urutan || 0))
  })

  const globalProgress = computed(() => repo.getGlobalProgress(state.value, orderedModules.value))

  function moduleStatus(moduleId) {
    const p = repo.getModuleProgress(state.value, moduleId)
    const idx = orderedModules.value.findIndex((m) => m.id === moduleId)
    const unlocked = repo.isModuleUnlocked(state.value, orderedModules.value, idx)
    if (p.passed) return 'passed'
    if (!unlocked) return 'locked'
    if (p.postTestAttempts > 0 || p.freeTestCompleted) return 'active'
    return 'available'
  }

  function isUnlocked(moduleId) {
    const idx = orderedModules.value.findIndex((m) => m.id === moduleId)
    if (idx < 0) return false
    return repo.isModuleUnlocked(state.value, orderedModules.value, idx)
  }

  function moduleProgress(moduleId) {
    return repo.getModuleProgress(state.value, moduleId)
  }

  function recordFreeTest(moduleId, score) {
    repo.recordFreeTest(state.value, moduleId, score)
    refresh()
  }

  function recordPostTest(moduleId, score) {
    const mod = contentRepo.getModuleById(moduleId)
    const passing = mod?.postTest?.passingScore ?? mod?.passingScore ?? LEARNING_CONFIG.passingScore
    repo.recordPostTest(state.value, moduleId, score, passing)
    refresh()
  }

  function recordFinalTest(score) {
    const meta = contentRepo.getFinalTestMeta(activeSubjectId.value)
    const passing = meta?.passingScore ?? LEARNING_CONFIG.passingScore
    repo.recordFinalTest(state.value, score, passing)
    refresh()
  }

  function resetProgress() {
    repo.resetState()
    refresh()
  }

  const finalTestUnlocked = computed(() =>
    repo.isFinalTestUnlocked(state.value, orderedModules.value),
  )

  const finalTestState = computed(() => state.value.finalTest)

  return {
    state,
    activeSubjectId,
    orderedModules,
    globalProgress,
    finalTestUnlocked,
    finalTestState,
    moduleStatus,
    isUnlocked,
    moduleProgress,
    recordFreeTest,
    recordPostTest,
    recordFinalTest,
    resetProgress,
    refresh,
  }
}

export default useLearningProgress
