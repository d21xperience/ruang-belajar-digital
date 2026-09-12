<template>
  <div class="materi-renderer">
    <ContentBlock v-for="(block, i) in blocks" :key="i" :block="block" />
  </div>
</template>

<script setup>
import ContentBlock from './ContentBlock.vue'

defineProps({
  blocks: { type: Array, required: true },
})
</script>

<style scoped>
.materi-renderer {
  display: flex;
  flex-direction: column;
}
</style>
