<template>
  <q-page class="landing-page">
    <!-- ═══════════════════════════════════════════════════════
         HERO — Visi platform + stats
         ═══════════════════════════════════════════════════════ -->
    <section class="hero" data-tour="landing-hero">
      <div class="hero-inner">
        <div class="hero-content">
          <div class="eyebrow-tech">Ruang Belajar Digital</div>
          <h1 class="hero-title">
            Jelajahi berbagai mata pelajaran dalam satu tempat
          </h1>
          <p class="hero-desc">
            Dari Pendidikan Pancasila hingga Ilmu Hukum dan Komputer Jaringan —
            belajar mandiri, kapan saja, di mana saja. Bahkan tanpa internet.
          </p>
          <div class="hero-actions">
            <q-btn class="btn-primary-tech" unelevated icon="explore" label="Mulai Jelajahi"
              @click="scrollToSubjects" />
            <q-btn v-if="hasProgress" class="btn-ghost-tech" outline icon="trending_up" label="Lihat Analitik"
              @click="$router.push('/analitik')" />
          </div>
        </div>

        <!-- Stats panel -->
        <div class="hero-stats" data-tour="landing-stats">
          <div class="hs-title">
            <span class="mono-tag">KATALOG KONTEN</span>
          </div>
          <div class="hs-grid">
            <div class="hs-item">
              <div class="hs-num">{{ subjects.length }}</div>
              <div class="hs-label">Mata Pelajaran</div>
            </div>
            <div class="hs-item">
              <div class="hs-num">{{ totalModules }}</div>
              <div class="hs-label">Total Modul</div>
            </div>
            <div class="hs-item">
              <div class="hs-num">{{ totalFinalQuestions }}</div>
              <div class="hs-label">Soal Final</div>
            </div>
            <div class="hs-item">
              <div class="hs-num">∞</div>
              <div class="hs-label">Akses Gratis</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         CONTINUE LEARNING — muncul jika user sudah ada progress
         ═══════════════════════════════════════════════════════ -->
    <section v-if="hasProgress" class="section-continue" data-tour="landing-continue">
      <ContinueLearning />
    </section>

    <!-- ═══════════════════════════════════════════════════════
         SUBJECTS — grid kartu per mata pelajaran
         ═══════════════════════════════════════════════════════ -->
    <section ref="subjectsSectionRef" class="section-subjects" data-tour="landing-subjects">
      <div class="section-head">
        <h2 class="section-title">Jelajahi Konten</h2>
        <p class="section-subtitle">
          Pilih mata pelajaran untuk mulai belajar. Setiap subject memiliki
          modul berjenjang dengan kuis dan evaluasi akhir.
        </p>
      </div>

      <!-- <div class="subjects-grid">
        <SubjectCard v-for="subj in subjects" :key="subj.id" :subject="subj" @select="goToSubject" />
      </div> -->
      <div v-for="(subj, index) in subjects" :key="subj.id" :data-tour="index === 0 ? 'subject-card-first' : null">
        <SubjectCard :subject="subj" @select="goToSubject" />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         ABOUT — info singkat platform
         ═══════════════════════════════════════════════════════ -->
    <section class="section-about" data-tour="landing-about">
      <div class="about-card">
        <div class="about-icon">
          <q-icon name="auto_stories" size="32px" />
        </div>
        <div class="about-body">
          <h3 class="about-title">Tentang Platform</h3>
          <p class="about-desc">
            Platform ini dikembangkan sebagai media pembelajaran mandiri
            untuk siswa SMK. Setiap materi dilengkapi kuis diagnostik,
            ujian penguasaan, dan evaluasi akhir untuk memastikan
            pemahaman yang menyeluruh.
          </p>
          <div class="about-actions">
            <q-btn flat dense color="primary" icon="info" label="Selengkapnya tentang platform"
              @click="$router.push('/tentang')" />
            <q-btn flat dense color="primary" icon="help_outline" label="Pertanyaan umum"
              @click="$router.push('/faq')" />
          </div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSubject } from '../composables/useSubject'
import { useLearningProgress } from '../composables/useLearningProgress'
import contentRepo from '../repositories/contentRepository'
import SubjectCard from '../components/landing/SubjectCard.vue'
import ContinueLearning from '../components/landing/ContinueLearning.vue'



const router = useRouter()

const { subjects } = useSubject()
const { globalProgress } = useLearningProgress()

// ═══ Computed stats ═══
const totalModules = computed(() =>
  subjects.value.reduce(
    (sum, s) => sum + contentRepo.getModulesBySubject(s.id).length,
    0
  )
)

const totalFinalQuestions = computed(() =>
  subjects.value.reduce((sum, s) => {
    const meta = contentRepo.getFinalTestMeta(s.id)
    return sum + (meta?.totalQuestions || 0)
  }, 0)
)

const hasProgress = computed(() => {
  return globalProgress.value.passedModules > 0
})

// ═══ Actions ═══
const subjectsSectionRef = ref(null)

function scrollToSubjects() {
  subjectsSectionRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function goToSubject(subjectId) {
  router.push(`/subject/${subjectId}`)
}

</script>

<style scoped>
.landing-page {
  --navy-900: #0B1F33;
  --navy-700: #16324F;
  --gold-500: #C9A227;
  --gold-100: #F3E7C4;
  --red-500: #A6403F;
  --paper: #F4F6F8;
  --ink-900: #1B2733;
  --ink-500: #5B6B7C;
  --border: #D8DEE5;
  background: var(--paper);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink-900);
}

/* ══════════ HERO ══════════ */
.hero {
  background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);
  padding: 56px 24px 64px;
}

.hero-inner {
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 40px;
  align-items: center;
}

.eyebrow-tech {
  color: var(--gold-500);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}

.hero-title {
  color: #FFFFFF;
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 14px;
  max-width: 22ch;
}

.hero-desc {
  color: #C7D2DC;
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 46ch;
  margin: 0 0 24px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Hero stats */
.hero-stats {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 20px;
}

.hs-title {
  margin-bottom: 14px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: #9FB0C0;
}

.hs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 12px;
}

.hs-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hs-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gold-500);
  line-height: 1;
}

.hs-label {
  font-size: 0.72rem;
  color: #9FB0C0;
  letter-spacing: 0.03em;
}

/* ══════════ BUTTONS ══════════ */
.btn-primary-tech {
  background: var(--gold-500);
  color: var(--navy-900);
  font-weight: 600;
  border-radius: 6px;
}

.btn-ghost-tech {
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
}

/* ══════════ CONTINUE SECTION ══════════ */
.section-continue {
  max-width: 1040px;
  margin: 32px auto 0;
  padding: 0 24px;
}

/* ══════════ SUBJECTS SECTION ══════════ */
.section-subjects {
  max-width: 1040px;
  margin: 0 auto;
  padding: 56px 24px 40px;
}

.section-head {
  margin-bottom: 28px;
  text-align: center;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 8px;
}

.section-subtitle {
  color: var(--ink-500);
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 auto;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

/* ══════════ ABOUT SECTION ══════════ */
.section-about {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.about-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: 12px;
  align-items: flex-start;
}

.about-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: var(--gold-100);
  color: var(--gold-500);
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-body {
  flex: 1;
  min-width: 0;
}

.about-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 6px;
}

.about-desc {
  color: var(--ink-500);
  line-height: 1.7;
  margin: 0 0 12px;
  font-size: 0.92rem;
}

.about-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* ══════════ RESPONSIVE ══════════ */
@media (max-width: 800px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .hero-title {
    font-size: 1.7rem;
    max-width: none;
  }

  .hero-desc {
    max-width: none;
  }

  .section-title {
    font-size: 1.35rem;
  }

  .about-card {
    flex-direction: column;
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 40px 20px 48px;
  }

  .hs-grid {
    gap: 12px;
  }

  .hs-num {
    font-size: 1.35rem;
  }

  .subjects-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}

.subjects-grid>div {
  display: contents;
}
</style>
