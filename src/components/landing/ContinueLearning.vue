<template>
  <div v-if="hasActivity" class="continue-card">
    <div class="cc-icon">
      <q-icon name="play_arrow" size="28px" />
    </div>
    <div class="cc-body">
      <div class="cc-label">LANJUTKAN BELAJAR</div>
      <div class="cc-title">{{ lastModule?.judul || 'Mulai belajar' }}</div>
      <div class="cc-meta">
        <span>{{ subjectLabel }}</span>
        <span class="cc-dot">·</span>
        <span>{{ progressInfo }}</span>
      </div>
    </div>
    <button
      type="button"
      class="cc-cta"
      @click="goContinue"
    >
      <span>{{ lastModule ? 'Lanjutkan' : 'Mulai' }}</span>
      <q-icon name="arrow_forward" size="18px" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import contentRepo from '../../repositories/contentRepository'
import repo from '../../repositories/learningStateRepository'

const router = useRouter()

const state = repo.loadState()

// Cari modul dengan progress terakhir (terbaru atau sedang aktif)
const lastModule = computed(() => {
  const allModules = contentRepo.getAllModules()
  const candidates = allModules
    .map((m) => {
      const p = repo.getModuleProgress(state, m.id)
      return {
        mod: m,
        progress: p,
        // Prioritas: sedang aktif (postTestAttempts > 0 tapi belum lulus)
        //          atau terakhir dikerjakan
        lastAt: p.lastAttemptAt ? new Date(p.lastAttemptAt).getTime() : 0,
      }
    })
    .filter((x) => x.progress.freeTestCompleted || x.progress.postTestAttempts > 0)

  if (!candidates.length) return null

  // Sort: aktif dulu (belum lulus), lalu terbaru
  candidates.sort((a, b) => {
    const aActive = !a.progress.passed && a.progress.postTestAttempts > 0
    const bActive = !b.progress.passed && b.progress.postTestAttempts > 0
    if (aActive !== bActive) return aActive ? -1 : 1
    return b.lastAt - a.lastAt
  })

  return candidates[0].mod
})

const hasActivity = computed(() => !!lastModule.value)

const subjectLabel = computed(() => {
  if (!lastModule.value) return ''
  const subj = contentRepo.getSubjectById(lastModule.value.subjectId)
  return subj?.judul || 'Pendidikan Pancasila'
})

const progressInfo = computed(() => {
  if (!lastModule.value) return ''
  const p = repo.getModuleProgress(state, lastModule.value.id)
  if (p.passed) return '✓ Lulus — siap lanjut modul berikutnya'
  if (p.postTestAttempts > 0) {
    return `Percobaan ke-${p.postTestAttempts} · Best ${p.postTestBestScore}`
  }
  if (p.freeTestCompleted) return 'Free Test selesai · lanjut ke materi'
  return ''
})

function goContinue() {
  if (!lastModule.value) {
    router.push('/subject/ppkn')
    return
  }
  router.push(`/materi/${lastModule.value.id}`)
}
</script>

<style scoped>
.continue-card {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
  border: 1px solid var(--gold-500, #C9A227);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(201, 162, 39, 0.15);
}
.cc-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gold-500, #C9A227);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cc-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  color: #8A6A14;
  font-weight: 700;
  margin-bottom: 3px;
}
.cc-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--navy-900, #0B1F33);
  line-height: 1.3;
  margin-bottom: 3px;
}
.cc-meta {
  font-size: 0.78rem;
  color: var(--ink-500, #5B6B7C);
}
.cc-dot {
  margin: 0 4px;
  opacity: 0.5;
}
.cc-cta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--navy-900, #0B1F33);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 40px;
  transition: transform 0.15s;
}
.cc-cta:hover {
  transform: translateY(-1px);
}
.cc-cta:focus-visible {
  outline: 2px solid var(--gold-500, #C9A227);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .continue-card {
    grid-template-columns: 40px 1fr;
    gap: 10px;
    padding: 14px 16px;
  }
  .cc-icon {
    width: 40px;
    height: 40px;
  }
  .cc-cta {
    grid-column: 1 / -1;
    width: 100%;
    justify-content: center;
  }
}
</style>
