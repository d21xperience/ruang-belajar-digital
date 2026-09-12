<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="(v) => $emit('update:modelValue', v)">
    <q-card class="share-card">
      <div class="share-head">
        <h3>Bagikan Progres ke Guru</h3>
        <q-btn flat dense round icon="close" @click="$emit('update:modelValue', false)" />
      </div>

      <p class="share-desc">
        Isi data berikut. File yang diunduh berisi <b>ringkasan progres belajar</b> Anda
        yang akan dikirim ke guru.
      </p>

      <q-input v-model="form.name" outlined dense label="Nama Lengkap *" class="q-mb-sm" />
      <q-input v-model="form.class" outlined dense label="Kelas *" placeholder="contoh: X TKJ 1" class="q-mb-sm" />
      <q-input v-model="form.nis" outlined dense label="NIS (opsional)" class="q-mb-sm" />

      <div class="share-summary">
        <div class="mono-tag">RINGKASAN YANG AKAN DIKIRIM</div>
        <div class="summary-row">
          <span>Modul selesai</span>
          <b>{{ passedModules }} / {{ totalModules }}</b>
        </div>
        <div class="summary-row">
          <span>Final Test</span>
          <b>{{ finalScore || '—' }}</b>
        </div>
        <div class="summary-row">
          <span>Waktu export</span>
          <b>{{ nowLabel }}</b>
        </div>
      </div>

      <div class="share-actions">
        <q-btn flat label="Batal" @click="$emit('update:modelValue', false)" />
        <q-btn class="btn-primary-tech" unelevated icon="download" label="Download File" :disable="!isValid"
          @click="doShare" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { buildShareData, downloadShareFile } from '../../composables/useStudentShare'
import { useLearningProgress } from '../../composables/useLearningProgress'
import contentRepo from '../../repositories/contentRepository'
import repo from '../../repositories/learningStateRepository'
import { useSubject } from '@/composables/useSubject'
const { activeSubjectId } = useSubject()
defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'shared'])

const $q = useQuasar()
const { globalProgress } = useLearningProgress()

const form = ref({ name: '', class: '', nis: '' })

const isValid = computed(() =>
  form.value.name.trim().length >= 3 &&
  form.value.class.trim().length >= 2
)

const totalModules = computed(() => contentRepo.getAllModules().length)
const passedModules = computed(() => globalProgress.value.passedModules)
const finalScore = computed(() => repo.loadState()?.finalTest?.bestScore || 0)
const nowLabel = computed(() => new Date().toLocaleString('id-ID'))

function doShare() {
  try {
    const shareData = buildShareData(
      repo.loadState(),
      contentRepo.getContentMeta(activeSubjectId.value),
      form.value,
    )
    const filename = downloadShareFile(shareData)
    $q.notify({
      type: 'positive',
      message: `File "${filename}" terunduh. Kirim ke guru Anda.`,
      position: 'top',
      timeout: 5000,
    })
    emit('shared', shareData)
    emit('update:modelValue', false)
  } catch (e) {
    $q.notify({ type: 'negative', message: `Gagal: ${e.message}`, position: 'top' })
  }
}
</script>

<style scoped>
.share-card {
  width: 90vw;
  max-width: 480px;
  padding: 20px;
}

.share-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.share-head h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--navy-900, #0B1F33);
}

.share-desc {
  color: var(--ink-500, #5B6B7C);
  font-size: 0.88rem;
  line-height: 1.6;
  margin: 0 0 16px;
}

.share-summary {
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--paper, #F4F6F8);
  border-radius: 6px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
  margin-bottom: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 3px 0;
}

.summary-row b {
  color: var(--navy-900, #0B1F33);
}

.share-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.btn-primary-tech {
  background: var(--gold-500, #C9A227);
  color: var(--navy-900, #0B1F33);
  font-weight: 600;
  border-radius: 4px;
}
</style>
