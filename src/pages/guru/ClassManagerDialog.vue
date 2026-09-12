<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="(v) => $emit('update:modelValue', v)"
  >
    <q-card class="cm-card">
      <div class="cm-head">
        <h3>Kelola Kelas</h3>
        <q-btn flat dense round icon="close" @click="$emit('update:modelValue', false)" />
      </div>

      <!-- Create new -->
      <div class="cm-create">
        <q-input v-model="newNama" outlined dense label="Nama Kelas *"
          placeholder="contoh: X TKJ 1" class="q-mb-sm" />
        <q-input v-model="newTahun" outlined dense
          label="Tahun Ajaran" placeholder="contoh: 2026/2027" class="q-mb-sm" />
        <q-btn class="btn-primary-tech full-width" unelevated icon="add"
          label="Tambah Kelas" :disable="!newNama.trim()" @click="doCreate" />
      </div>

      <q-separator class="q-my-md" />

      <!-- List -->
      <div v-if="!state.classes.length" class="cm-empty">
        Belum ada kelas.
      </div>
      <div v-else class="cm-list">
        <div v-for="c in state.classes" :key="c.id" class="cm-item">
          <div class="cm-item-info">
            <div class="cm-item-name">
              {{ c.nama }}
              <span v-if="c.tahunAjaran" class="cm-item-year">{{ c.tahunAjaran }}</span>
            </div>
            <div class="cm-item-meta">
              {{ countStudents(c.id) }} siswa
            </div>
          </div>
          <div class="cm-item-actions">
            <q-btn flat dense round icon="edit" size="sm" @click="openEdit(c)" />
            <q-btn flat dense round icon="delete" size="sm" color="negative" @click="confirmDelete(c)" />
          </div>
        </div>
      </div>

      <!-- Edit dialog -->
      <q-dialog v-model="editOpen">
        <q-card v-if="editing" class="cm-edit-card">
          <h3 class="q-mb-md">Edit Kelas</h3>
          <q-input v-model="editNama" outlined dense label="Nama Kelas" class="q-mb-sm" />
          <q-input v-model="editTahun" outlined dense label="Tahun Ajaran" class="q-mb-md" />
          <div class="cm-edit-actions">
            <q-btn flat label="Batal" @click="editOpen = false" />
            <q-btn class="btn-primary-tech" unelevated label="Simpan" @click="doUpdate" />
          </div>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: Boolean,
  state: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue', 'create-class', 'update-class', 'delete-class'])

const $q = useQuasar()

const newNama = ref('')
const newTahun = ref('')
const editOpen = ref(false)
const editing = ref(null)
const editNama = ref('')
const editTahun = ref('')

function doCreate() {
  const nama = newNama.value.trim()
  if (!nama) return
  emit('create-class', { nama, tahunAjaran: newTahun.value.trim() })
  newNama.value = ''
  newTahun.value = ''
}

function countStudents(classId) {
  return Object.keys(props.state.students?.[classId] || {}).length
}

function openEdit(c) {
  editing.value = c
  editNama.value = c.nama
  editTahun.value = c.tahunAjaran || ''
  editOpen.value = true
}

function doUpdate() {
  if (!editing.value) return
  emit('update-class', {
    id: editing.value.id,
    patch: { nama: editNama.value.trim(), tahunAjaran: editTahun.value.trim() },
  })
  editOpen.value = false
}

function confirmDelete(c) {
  const count = countStudents(c.id)
  $q.dialog({
    title: 'Hapus Kelas',
    message: `Hapus kelas "${c.nama}"?${count ? ` Semua ${count} data siswa akan dihapus.` : ''}`,
    cancel: { label: 'Batal', flat: true },
    ok: { label: 'Hapus', color: 'negative', unelevated: true },
  }).onOk(() => {
    emit('delete-class', c.id)
  })
}
</script>

<style scoped>
.cm-card { width: 90vw; max-width: 460px; padding: 20px; }
.cm-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.cm-head h3 { margin: 0; font-size: 1.15rem; color: var(--navy-900, #0B1F33); }
.cm-create { padding: 12px; background: var(--paper, #F4F6F8); border-radius: 6px; }
.cm-empty { padding: 20px; text-align: center; color: var(--ink-500, #5B6B7C); font-size: 0.88rem; }
.cm-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
.cm-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #fff; border: 1px solid var(--border, #D8DEE5); border-radius: 6px; }
.cm-item-name { font-weight: 600; color: var(--navy-900, #0B1F33); font-size: 0.92rem; }
.cm-item-year { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: var(--ink-500, #5B6B7C); margin-left: 6px; }
.cm-item-meta { font-size: 0.78rem; color: var(--ink-500, #5B6B7C); margin-top: 2px; }
.cm-item-actions { display: flex; gap: 2px; }
.cm-edit-card { width: 90vw; max-width: 400px; padding: 20px; }
.cm-edit-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-primary-tech { background: var(--gold-500, #C9A227); color: var(--navy-900, #0B1F33); font-weight: 600; border-radius: 4px; }
</style>
