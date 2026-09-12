<template>
  <q-card flat bordered class="meta-card">
    <div class="mono-tag q-mb-md">METADATA MODUL</div>

    <div class="row q-col-gutter-sm">
      <div class="col-12 col-sm-4">
        <q-input :model-value="module.id" outlined dense label="ID Modul (unik)" hint="contoh: module-06"
          @update:model-value="(v) => update('id', v)" />
      </div>
      <div class="col-12 col-sm-2">
        <q-input :model-value="module.urutan" outlined dense type="number" label="Urutan"
          @update:model-value="(v) => update('urutan', Number(v) || 0)" />
      </div>
      <div class="col-12 col-sm-3">
        <q-input :model-value="module.judulShort" outlined dense label="Judul Singkat" hint="contoh: Modul 6"
          @update:model-value="(v) => update('judulShort', v)" />
      </div>
      <div class="col-12 col-sm-3">
        <q-input :model-value="module.passingScore" outlined dense type="number" label="KKM Modul"
          @update:model-value="(v) => update('passingScore', Number(v) || 80)" />
      </div>
      <div class="col-12">
        <q-input :model-value="module.judul" outlined dense label="Judul Lengkap"
          @update:model-value="(v) => update('judul', v)" />
      </div>
      <div class="col-12">
        <q-input :model-value="module.deskripsi" outlined dense type="textarea" autogrow label="Deskripsi"
          @update:model-value="(v) => update('deskripsi', v)" />
      </div>
      <div class="col-12">
        <div class="field-label">Tujuan Pembelajaran</div>
        <ArrayStringEditor :model-value="module.tujuanPembelajaran || []" label="Tujuan"
          @update:model-value="(v) => update('tujuanPembelajaran', v)" />
      </div>
    </div>
  </q-card>
</template>

<script setup>
import ArrayStringEditor from './ArrayStringEditor.vue'

defineProps({
  module: { type: Object, required: true },
})
const emit = defineEmits(['update'])

function update(key, value) {
  emit('update', { key, value })
}
</script>

<style scoped>
.meta-card {
  padding: 16px;
}

.mono-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-500, #5B6B7C);
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--ink-900, #1B2733);
}
</style>
