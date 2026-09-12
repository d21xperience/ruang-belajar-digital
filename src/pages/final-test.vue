<template>
  <q-page class="final-page">
    <div class="final-wrap">
      <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" class="q-mb-md" @click="$router.push('/')" />

      <!-- GUARD: Final Test terkunci -->
      <q-card v-if="!unlocked" flat bordered class="locked-card">
        <q-icon name="lock" size="48px" color="negative" />
        <h2 class="locked-title">Final Test Belum Terbuka</h2>
        <p class="locked-desc">
          Selesaikan seluruh 5 modul dengan nilai ≥ KKM {{ passingScore }} untuk membuka Final Test.
        </p>
        <q-btn class="btn-primary-tech" unelevated label="Kembali ke Beranda" icon="home" @click="$router.push('/')" />
      </q-card>

      <!-- INTRO -->
      <template v-else-if="stage === 'intro'">
        <q-card flat bordered class="intro-card">
          <div class="mono-tag">EVALUASI AKHIR</div>
          <h1 class="intro-title">Final Test</h1>
          <p class="intro-desc">
            Final Test terdiri dari <b>{{ totalQuestions }} soal</b> yang mencakup seluruh materi
            dari lima modul. KKM kelulusan: <b>{{ passingScore }}</b>.
          </p>
          <ul class="intro-list">
            <li>Urutan soal dan pilihan jawaban diacak.</li>
            <li>Anda dapat berpindah soal sebelum mengumpulkan.</li>
            <li>Pembahasan dan analisis capaian akan muncul setelah submit.</li>
          </ul>
          <div class="intro-actions">
            <q-btn class="btn-primary-tech" unelevated icon="play_arrow" label="Mulai Final Test" @click="startQuiz" />
          </div>
        </q-card>
      </template>

      <!-- QUIZ -->
      <template v-else-if="stage === 'quiz'">
        <div class="quiz-head">
          <span class="mono-tag">SOAL {{ currentIndex + 1 }} / {{ totalQuestions }}</span>
          <span class="mono-tag">{{ answeredCount }} terjawab</span>
        </div>

        <div class="dot-nav">
          <button v-for="(q, i) in questions" :key="q.id" type="button" class="quiz-dot" :class="{
            'quiz-dot--current': i === currentIndex,
            'quiz-dot--answered': answers[q.id] !== undefined,
          }" @click="goto(i)">{{ i + 1 }}</button>
        </div>

        <QuizQuestion v-if="currentQuestion" :question="currentQuestion" :index="currentIndex" :total="totalQuestions"
          :selected-option-id="answers[currentQuestion.id] || null"
          @select="(optId) => selectAnswer(currentQuestion.id, optId)" />

        <div class="quiz-nav">
          <q-btn class="btn-ghost-tech" outline label="Sebelumnya" icon="chevron_left" :disable="currentIndex === 0"
            @click="prev" />
          <q-btn v-if="currentIndex < totalQuestions - 1" class="btn-primary-tech" unelevated label="Berikutnya"
            icon-right="chevron_right" @click="next" />
          <q-btn v-else class="btn-primary-tech" unelevated label="Kumpulkan" icon-right="send"
            @click="confirmSubmit" />
        </div>
      </template>

      <!-- RESULT -->
      <template v-else-if="stage === 'result'">
        <QuizResult :result="lastResult" :show-analysis="true">
          <template #actions>
            <q-btn class="btn-primary-tech" unelevated label="Ulangi Final Test" icon="replay" @click="restart" />
            <q-btn class="btn-ghost-tech" outline label="Kembali ke Beranda" icon="home" @click="$router.push('/')" />
          </template>
        </QuizResult>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import contentRepo from '../repositories/contentRepository'
import LEARNING_CONFIG from '../config/learning.js'
import { useQuiz } from '../composables/useQuiz'
import { useLearningProgress } from '../composables/useLearningProgress'
import QuizQuestion from '../components/QuizQuestion.vue'
import QuizResult from '../components/QuizResult.vue'

const $q = useQuasar()
const passingScore = contentRepo.getFinalTestMeta()?.passingScore ?? LEARNING_CONFIG.passingScore

const { finalTestUnlocked, recordFinalTest } = useLearningProgress()
const unlocked = finalTestUnlocked

const stage = ref('intro') // 'intro' | 'quiz' | 'result'
const lastResult = ref(null)

const quiz = useQuiz({
  getQuestions: () => contentRepo.getFinalTestQuestions(),
  shuffleQuestions: true,
  shuffleOptions: true,
})
const {
  questions, answers, currentIndex, currentQuestion, totalQuestions,
  answeredCount, unansweredCount, selectAnswer, next, prev, goto,
  prepare, submit,
} = quiz

function startQuiz() {
  prepare()
  stage.value = 'quiz'
}

function confirmSubmit() {
  if (unansweredCount.value > 0) {
    $q.dialog({
      title: 'Belum semua dijawab',
      message: `Anda masih memiliki ${unansweredCount.value} soal yang belum dijawab. Yakin ingin mengumpulkan?`,
      cancel: { label: 'Kembali', flat: true },
      ok: { label: 'Kumpulkan', unelevated: true, color: 'primary' },
    }).onOk(doSubmit)
    return
  }
  doSubmit()
}

function doSubmit() {
  const result = submit(passingScore)
  recordFinalTest(result.score)
  lastResult.value = result
  stage.value = 'result'
}

function restart() {
  prepare()
  stage.value = 'quiz'
}
</script>

<style scoped>
.final-page {
  background: var(--paper, #F4F6F8);
  min-height: 100vh;
}

.final-wrap {
  max-width: 820px;
  margin: 0 auto;
  padding: 24px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.btn-primary-tech {
  background: var(--gold-500, #C9A227);
  color: var(--navy-900, #0B1F33);
  font-weight: 600;
  border-radius: 4px;
}

.btn-ghost-tech {
  color: var(--navy-700, #16324F);
  border: 1px solid var(--border, #D8DEE5);
  border-radius: 4px;
}

.locked-card,
.intro-card {
  padding: 32px;
  text-align: center;
  border-radius: 8px;
}

.locked-title {
  font-size: 1.4rem;
  margin: 12px 0 8px;
  color: var(--navy-900, #0B1F33);
}

.locked-desc {
  color: var(--ink-500, #5B6B7C);
  line-height: 1.6;
  margin-bottom: 20px;
}

.intro-title {
  font-size: 1.8rem;
  margin: 8px 0 12px;
  color: var(--navy-900, #0B1F33);
}

.intro-desc {
  line-height: 1.7;
  color: var(--ink-900, #1B2733);
}

.intro-list {
  text-align: left;
  margin: 16px auto;
  max-width: 46ch;
  color: var(--ink-500, #5B6B7C);
  line-height: 1.7;
}

.intro-actions {
  margin-top: 20px;
}

.quiz-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dot-nav {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.quiz-dot {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border, #D8DEE5);
  background: #fff;
  color: var(--ink-500, #5B6B7C);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  cursor: pointer;
}

.quiz-dot--answered {
  background: var(--gold-100, #F3E7C4);
  border-color: var(--gold-500, #C9A227);
}

.quiz-dot--current {
  border-color: var(--navy-700, #16324F);
  box-shadow: 0 0 0 2px rgba(22, 50, 79, 0.15);
}

.quiz-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border, #D8DEE5);
}
</style>
