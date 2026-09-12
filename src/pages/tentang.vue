<template>
  <q-page class="bg-grey-1 q-pa-lg flex flex-center">
    <q-card flat bordered class="bg-white shadow-1 q-pa-xl rounded-borders" style="width: 100%; max-width: 900px;">

      <!-- Tombol Kembali -->
      <q-btn flat color="primary" icon="arrow_back" label="Kembali ke Beranda" @click="$router.push('/')"
        class="q-mb-md" />

      <div class="row q-col-gutter-xl items-center">
        <!-- Foto Profil Guru (Placeholder Menggunakan Avatar Icon) -->
        <div class="col-12 col-md-4 text-center">
          <q-avatar size="150px" class="bg-blue-1 text-primary shadow-2">
            <q-icon name="person" size="100px" />
          </q-avatar>
          <div class="text-h7 text-weight-bold q-mt-md text-grey-9">{{ profilGuru.nama }}</div>
          <div class="text-caption text-grey-6 text-uppercase text-weight-bold q-mt-xs">{{ profilGuru.jabatan }}</div>
        </div>

        <!-- Detail Informasi & Visi Pembelajaran -->
        <div class="col-12 col-md-8">
          <h2 class="text-h4 text-weight-bold text-primary q-mt-none q-mb-sm">Profil Pengajar</h2>
          <q-separator color="primary" size="2px" style="width: 60px;" class="q-mb-lg" />

          <p class="text-body1 text-grey-8 text-justify">
            Halo👋, selamat datang di <b>Ruang Belajar Digital</b> — sebuah platform
            pembelajaran mandiri yang menghadirkan pengalaman belajar interaktif,
            fleksibel, dan dapat diakses kapan saja melalui integrasi teknologi digital modern.
          </p>

          <q-list dense class="q-mt-md text-body1 text-grey-7">
            <q-item class="q-px-none">
              <q-item-section avatar min-width="30px"><q-icon name="school" color="primary" /></q-item-section>
              <q-item-section><b>Instansi:</b> {{ profilGuru.sekolah }}</q-item-section>
            </q-item>
            <q-item class="q-px-none">
              <q-item-section avatar min-width="30px"><q-icon name="mail" color="primary" /></q-item-section>
              <q-item-section><b>Kontak:</b> {{ profilGuru.email }}</q-item-section>
            </q-item>
          </q-list>

          <!-- Informasi PWA -->
          <q-card flat class="bg-blue-50 q-pa-md q-mt-xl rounded-borders bordered border-blue">
            <div class="row no-wrap items-center">
              <q-icon name="bolt" color="warning" size="md" class="q-mr-md" />
              <div>
                <div class="text-subtitle2 text-weight-bold text-blue-9">Aplikasi Mendukung Akses Luring (PWA)</div>
                <div class="text-caption text-blue-8">
                  Website ini dapat Anda simpan (*install*) langsung ke layar utama HP/Laptop tanpa Play Store. Setelah
                  dibuka sekali, materi & kuis tetap dapat diakses penuh meski tanpa koneksi internet.
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <q-separator class="q-my-xl" />

      <div class="faq-embedded-wrap">
        <h2 class="text-h6 text-weight-bold text-primary q-mb-md">
          Pertanyaan Umum
        </h2>
        <FaqSection :embedded="true" :show-header="false" :show-search="false" :show-categories="false" :limit="5" />
        <div class="text-center q-mt-md">
          <q-btn flat dense color="primary" icon-right="arrow_forward" label="Lihat semua FAQ"
            @click="$router.push('/faq')" />
        </div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import FaqSection from '../components/faq/FaqSection.vue'
const profilGuru = ref({
  nama: 'Deden Moh Jaenudin, S.H.',
  jabatan: 'Guru Mata Pelajaran',
  sekolah: 'SMK Pasundan Jatinangor',
  email: 'deden.moh41@guru.smk.belajar.id'
})
</script>

<style scoped>
.bg-blue-50 {
  background-color: #E3F2FD;
}

.text-blue-9 {
  color: #0D47A1;
}

.text-blue-8 {
  color: #1565C0;
}

.border-blue {
  border: 1px solid #BBDEFB;
}
</style>
