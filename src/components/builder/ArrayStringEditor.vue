<template>
  <div class="array-editor">
    <div v-for="(item, i) in modelValue" :key="i" class="array-row">
      <q-input :model-value="item" outlined dense autogrow :label="`${label} ${i + 1}`" class="array-input"
        @update:model-value="(v) => updateAt(i, v)" />
      <div class="array-controls">
        <q-btn flat dense round size="sm" icon="arrow_upward" :disable="i === 0" @click="moveUp(i)" aria-label="Naik" />
        <q-btn flat dense round size="sm" icon="arrow_downward" :disable="i === modelValue.length - 1"
          @click="moveDown(i)" aria-label="Turun" />
        <q-btn flat dense round size="sm" icon="delete" color="negative" @click="removeAt(i)" aria-label="Hapus" />
      </div>
    </div>
    <q-btn outline dense size="sm" icon="add" :label="`Tambah ${label}`" class="q-mt-sm" @click="addItem" />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, required: true },
  label: { type: String, default: 'Item' },
})
const emit = defineEmits(['update:modelValue'])

function updateAt(i, val) {
  const next = [...props.modelValue]
  next[i] = val
  emit('update:modelValue', next)
}
function addItem() {
  emit('update:modelValue', [...props.modelValue, ''])
}
function removeAt(i) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
function moveUp(i) {
  if (i === 0) return
  const next = [...props.modelValue]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
  emit('update:modelValue', next)
}
function moveDown(i) {
  if (i === props.modelValue.length - 1) return
  const next = [...props.modelValue]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
  emit('update:modelValue', next)
}
</script>

<style scoped>
.array-row {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-bottom: 6px;
}

.array-input {
  flex: 1;
}

.array-controls {
  display: flex;
  gap: 2px;
  padding-top: 4px;
}
</style>
