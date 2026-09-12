// src/composables/useQuiz.js
// =============================================================
// Logika kuis: randomisasi, jawaban, submit, skor, attempt.
// Dijamin: randomisasi TIDAK merusak correctOptionId.
// =============================================================

import { ref, computed } from 'vue'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * @param {Object} options
 * @param {() => Array} options.getQuestions - fungsi yang mengembalikan array soal mentah
 * @param {boolean} [options.shuffleQuestions=true]
 * @param {boolean} [options.shuffleOptions=true]
 * @param {boolean} [options.autoStart=false]
 */
export function useQuiz({
  getQuestions,
  shuffleQuestions = true,
  shuffleOptions = true,
  autoStart = false,
}) {
  const questions = ref([]) // soal setelah diacak (opsi juga diacak)
  const answers = ref({}) // { [questionId]: optionId }
  const currentIndex = ref(0)
  const submitted = ref(false)
  const score = ref(0)
  const attempts = ref(0)

  function prepare() {
    const raw = getQuestions() || []

    const prepared = raw.map((q) => {
      // 1️⃣ Acak urutan opsi jika diaktifkan
      const shuffled = shuffleOptions ? shuffleArray(q.options) : [...q.options]

      // 2️⃣ Re-letter berdasarkan posisi baru (A, B, C, D, ...)
      //    Sekaligus petakan correctOptionId ke huruf baru
      const originalCorrectId = q.correctOptionId
      let newCorrectId = originalCorrectId

      const reLettered = shuffled.map((opt, idx) => {
        const newId = String.fromCharCode(65 + idx) // A, B, C, D, E, F...
        if (opt.id === originalCorrectId) newCorrectId = newId
        return { ...opt, id: newId }
      })

      return {
        ...q,
        options: reLettered,
        correctOptionId: newCorrectId,
      }
    })

    // 3️⃣ Acak urutan soal jika diaktifkan
    questions.value = shuffleQuestions ? shuffleArray(prepared) : prepared

    answers.value = {}
    currentIndex.value = 0
    submitted.value = false
    score.value = 0
  }

  const totalQuestions = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
  const answeredCount = computed(() => Object.keys(answers.value).length)
  const allAnswered = computed(() => answeredCount.value === totalQuestions.value)
  const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)

  function selectAnswer(questionId, optionId) {
    if (submitted.value) return
    answers.value = { ...answers.value, [questionId]: optionId }
  }

  function next() {
    if (currentIndex.value < totalQuestions.value - 1) currentIndex.value++
  }

  function prev() {
    if (currentIndex.value > 0) currentIndex.value--
  }

  function goto(i) {
    if (i >= 0 && i < totalQuestions.value) currentIndex.value = i
  }

  /**
   * Mengembalikan objek hasil lengkap.
   * @returns {{score:number, correct:number, wrong:number, total:number, passed:boolean, details:Array, passingScore:number}}
   */
  function submit(passingScore = 80) {
    let correct = 0
    const details = questions.value.map((q) => {
      const userOpt = answers.value[q.id] || null
      const isCorrect = userOpt === q.correctOptionId
      if (isCorrect) correct++
      return {
        questionId: q.id,
        question: q.pertanyaan,
        options: q.options,
        userOptionId: userOpt,
        correctOptionId: q.correctOptionId,
        isCorrect,
        pembahasan: q.pembahasan,
        moduleId: q.moduleId || null,
        concept: q.concept || null,
        tags: q.tags || [],
      }
    })
    const total = questions.value.length
    const computedScore = total ? Math.round((correct / total) * 100) : 0
    score.value = computedScore
    submitted.value = true
    attempts.value++

    return {
      score: computedScore,
      correct,
      wrong: total - correct,
      total,
      passed: computedScore >= passingScore,
      passingScore,
      details,
    }
  }

  function reset() {
    prepare()
  }

  if (autoStart) prepare()

  return {
    // state
    questions,
    answers,
    currentIndex,
    submitted,
    score,
    attempts,
    // computed
    totalQuestions,
    currentQuestion,
    answeredCount,
    allAnswered,
    unansweredCount,
    // actions
    prepare,
    selectAnswer,
    next,
    prev,
    goto,
    submit,
    reset,
  }
}

export default useQuiz
