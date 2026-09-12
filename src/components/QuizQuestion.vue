<template>
  <div class="quiz-question">
    <div class="quiz-question__head">
      <span class="mono-tag">SOAL {{ index + 1 }} / {{ total }}</span>
      <span v-if="question.concept" class="concept-tag">{{ question.concept }}</span>
    </div>

    <h3 class="quiz-question__text">{{ question.pertanyaan }}</h3>

    <div class="quiz-question__options">
      <button v-for="opt in question.options" :key="opt.id" type="button" class="quiz-option" :class="{
        'quiz-option--selected': selectedOptionId === opt.id,
        'quiz-option--correct': showFeedback && opt.id === question.correctOptionId,
        'quiz-option--wrong': showFeedback && selectedOptionId === opt.id && opt.id !== question.correctOptionId,
      }" :aria-pressed="selectedOptionId === opt.id" :disabled="showFeedback" @click="$emit('select', opt.id)">
        <span class="quiz-option__marker">{{ opt.id }}</span>
        <span class="quiz-option__text">{{ opt.text }}</span>
        <q-icon v-if="showFeedback && opt.id === question.correctOptionId" name="check_circle" size="18px"
          class="quiz-option__icon" />
        <q-icon v-else-if="showFeedback && selectedOptionId === opt.id" name="cancel" size="18px"
          class="quiz-option__icon" />
      </button>
    </div>

    <div v-if="showFeedback" class="quiz-question__feedback">
      <div class="mono-tag">MENGAPA?</div>
      <p>{{ question.pembahasan }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  selectedOptionId: { type: String, default: null },
  showFeedback: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<style scoped>
.quiz-question__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500);
}

.concept-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 3px;
  background: var(--gold-100);
  color: #8A6A14;
}

.quiz-question__text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--navy-900);
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.quiz-question__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  background: #FFFFFF;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  color: var(--ink-900);
  transition: border-color 0.15s, background 0.15s;
  min-height: 48px;
}

.quiz-option:hover:not(:disabled) {
  border-color: var(--navy-700);
}

.quiz-option:focus-visible {
  outline: 2px solid var(--gold-500);
  outline-offset: 2px;
}

.quiz-option--selected {
  border-color: var(--navy-700);
  background: #F5F8FB;
}

.quiz-option--correct {
  border-color: #21ba45;
  background: #E8F7EE;
}

.quiz-option--wrong {
  border-color: var(--red-500);
  background: var(--red-100);
}

.quiz-option__marker {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--paper);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--navy-700);
}

.quiz-option--selected .quiz-option__marker {
  background: var(--gold-500);
  color: var(--navy-900);
}

.quiz-option--correct .quiz-option__marker {
  background: #21ba45;
  color: white;
}

.quiz-option--wrong .quiz-option__marker {
  background: var(--red-500);
  color: white;
}

.quiz-option__text {
  flex: 1;
}

.quiz-option__icon {
  flex-shrink: 0;
}

.quiz-question__feedback {
  margin-top: 18px;
  padding: 14px 16px;
  background: var(--paper);
  border-left: 3px solid var(--gold-500);
  border-radius: 4px;
}

.quiz-question__feedback p {
  margin: 6px 0 0 0;
  line-height: 1.6;
}
</style>
