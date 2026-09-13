<template>
  <!-- Layout Utama Global -->
  <q-layout view="lHh Lpr lFf">

    <!-- Header / Navbar Atas -->
    <q-header elevated class="app-header">
      <q-toolbar :dense="$q.screen.lt.sm" class="app-toolbar">
        <q-avatar square size="32px" class="q-mr-sm">
          <img src="@/assets/quasar-logo-vertical.svg" alt="Logo E-Modul">
        </q-avatar>

        <q-toolbar-title class="app-title" shrink>
          {{ judulHeader }}
        </q-toolbar-title>

        <q-space />

        <!-- ═══════════════════════════════════════════════════════
       NAV BUTTONS — Disembunyikan di halaman materi
       ═══════════════════════════════════════════════════════ -->
        <template v-if="!isMateriPage">
          <q-btn flat dense no-caps icon="home" class="nav-btn" :class="{ 'nav-btn--active': route.path === '/' }"
            @click="router.push('/')">
            <span class="nav-label gt-xs q-ml-xs">Beranda</span>
          </q-btn>
          <q-btn flat dense no-caps icon="info" class="nav-btn"
            :class="{ 'nav-btn--active': route.path === '/tentang' }" @click="router.push('/tentang')">
            <span class="nav-label gt-xs q-ml-xs">Tentang</span>
          </q-btn>

          <q-btn flat dense no-caps icon="insights" data-tour="nav-analitik" class="nav-btn"
            :class="{ 'nav-btn--active': route.path == '/analitik' }" @click="router.push('/analitik')">
            <span class="nav-label gt-xs q-ml-xs">Analitik</span>
          </q-btn>


          <!-- <q-btn v-if="isMateriPage" flat dense no-caps icon="menu_book" class="nav-btn" @click="startMateriTour">
          <span class="nav-label gt-xs q-ml-xs">Tour Materi</span>
        </q-btn> -->

          <q-btn v-if="showTourButton" flat dense no-caps :icon="tourButtonIcon" class="nav-btn"
            :class="{ 'nav-btn--active': isTourActive }" @click="handleTourClick">
            <span class="nav-label gt-xs q-ml-xs">{{ tourButtonLabel }}</span>
          </q-btn>

          <q-btn flat dense no-caps icon="help_outline" data-tour="nav-faq" class="nav-btn"
            :class="{ 'nav-btn--active': route.path == '/faq' }" @click="router.push('/faq')">
            <span class="nav-label gt-xs q-ml-xs">FAQ</span>
          </q-btn>

          <q-btn v-if="isAuthenticated" flat dense no-caps icon="school" class="nav-btn"
            :class="{ 'nav-btn--active': route.path == '/guru-dashboard' }" @click="router.push('/guru-dashboard')">
            <span class="nav-label gt-xs q-ml-xs">Guru</span>
          </q-btn>
          <q-btn v-else flat dense no-caps icon="login" class="nav-btn" @click="router.push('/login')">
            <span class="nav-label gt-xs q-ml-xs">Login</span>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <!-- Halaman dari src/pages dirender di sini -->
    <q-page-container>
      <router-view v-slot="{ Component, route: r }">
        <component :is="Component" v-bind="r.params" />
      </router-view>
    </q-page-container>

    <!-- Footer -->
    <q-footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-copyright">
          RBD &copy; 2026 &middot; Made with <span class="text-red-14">❤</span> by Deden Moh.J.
        </div>
        <div class="footer-datetime">
          <q-icon name="calendar_today" size="xs" class="q-mr-xs" />
          {{ currentDate }}, {{ currentTime }}
        </div>
      </div>
    </q-footer>

    <TourOverlay />
  </q-layout>
</template>

<script setup>
import { computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCurrentDateTime } from '@/composables/ui/useCurrentDateTime'
import { useAuth } from './composables/useAuth'
import { useOnboarding } from './composables/useOnboarding'
import TourOverlay from './components/onboarding/TourOverlay.vue'
// const isMateriPage = computed(() => route.path.startsWith('/materi/'))

const { start: startTourById, isActive: isTourActive, maybeAutoStart } = useOnboarding()

const { isAuthenticated } = useAuth()
const router = useRouter()
const route = useRoute()
const isMateriPage = computed(() => route.path.startsWith('/materi/'))




const PAGE_TITLES = {
  '/': 'Ruang Belajar Digital',
  '/tentang': 'Tentang — Ruang Belajar Digital',
  '/faq': 'FAQ — Ruang Belajar Digital',
  '/analitik': 'Analitik — Ruang Belajar Digital',
  '/login': 'Login Guru — Ruang Belajar Digital',
  '/guru-dashboard': 'Dashboard Guru — Ruang Belajar Digital',
  '/content-builder': 'Content Builder — Ruang Belajar Digital',
}

watch(
  () => route.path,
  (path) => {
    let title = PAGE_TITLES[path]

    // Dynamic routes
    if (!title && path.startsWith('/subject/')) {
      title = 'Mata Pelajaran — Ruang Belajar Digital'
    } else if (!title && path.startsWith('/materi/')) {
      title = 'Materi — Ruang Belajar Digital'
    } else if (!title && path.startsWith('/artikel/')) {
      title = 'Artikel — Ruang Belajar Digital'
    }

    document.title = title || 'Ruang Belajar Digital'
  },
  { immediate: true }
)




const $q = useQuasar()
const { currentDate, currentTime } = useCurrentDateTime()

const judulHeader = computed(() => {
  if ($q.screen.lt.sm) return 'Ruang Belajar'
  return 'Ruang Belajar Digital'
})

onMounted(() => {
  // Trigger tour untuk first-time users
  maybeAutoStart('main', 1200)
})

// ═══════════════════════════════════════════════════════════
// Smart tour launcher — redirect ke beranda kalau perlu
// ═══════════════════════════════════════════════════════════
async function handleTourClick() {
  if (isTourActive.value) return

  // ═══ Halaman materi → tour materi ═══
  if (route.path.startsWith('/materi/')) {
    startTourById('materi', 0)
    return
  }

  // ═══ Halaman subject → tour subject ═══
  if (route.path.startsWith('/subject/')) {
    startTourById('subject', 0)
    return
  }

  // ═══ Beranda → tour utama ═══
  if (route.path === '/') {
    startTourById('main', 0)
    return
  }

  // ═══ Halaman lain → redirect ke beranda ═══
  $q.notify({
    type: 'info',
    message: 'Membuka beranda untuk memulai tur…',
    icon: 'tour',
    position: 'top',
    timeout: 1200,
  })

  await router.push('/')
  window.scrollTo({ top: 0, behavior: 'instant' })
  await nextTick()
  setTimeout(() => {
    startTourById('main', 0)
  }, 400)
}

// ═══ Label tombol dinamis ═══
const tourButtonLabel = computed(() => {
  if (route.path.startsWith('/materi/')) return 'Tour Materi'
  if (route.path.startsWith('/subject/')) return 'Tour Subject'
  return 'Tour'
})

const tourButtonIcon = computed(() => {
  if (route.path.startsWith('/materi/')) return 'menu_book'
  if (route.path.startsWith('/subject/')) return 'library_books'
  return 'tour'
})

// ═══ Kapan tombol tampil ═══
// OPSI 1 (default): selalu tampil kecuali halaman terkunci
const showTourButton = computed(() => {
  const excluded = ['/login', '/guru-dashboard', '/content-builder']
  return !excluded.some((p) => route.path.startsWith(p))
})
</script>

<!--
  Style GLOBAL (tidak scoped) — sengaja diletakkan di sini supaya variabel
  warna bisa dipakai oleh semua halaman (HomePage, MateriPage, dst) tanpa
  didefinisikan ulang di tiap file.
-->
<style>
:root {
  --navy-900: #0B1F33;
  --navy-700: #16324F;
  --gold-500: #C9A227;
  --gold-100: #F3E7C4;
  --red-500: #A6403F;
  --red-100: #F1DCDB;
  --paper: #F4F6F8;
  --ink-900: #1B2733;
  --ink-500: #5B6B7C;
  --border: #D8DEE5;
}

body {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--ink-900);
}
</style>

<!-- Style khusus App.vue (header & footer) -->
<style scoped>
.app-header {
  background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);
}

.app-toolbar {
  padding-left: 12px;
  padding-right: 12px;
}

.app-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-btn {
  color: #C7D2DC;
  min-width: 40px;
}

.nav-btn--active {
  color: var(--gold-500);
  font-weight: 600;
}

.nav-label {
  font-size: 0.85rem;
}

.app-footer {
  background: #FFFFFF;
  color: var(--ink-500);
  border-top: 1px solid var(--border);
}

.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  text-align: center;
  font-size: 0.8rem;
}

.footer-copyright {
  font-weight: 600;
  color: var(--ink-900);
}

.footer-datetime {
  display: flex;
  align-items: center;
}

/* Di layar lebih besar, sejajarkan kiri-kanan */
@media (min-width: 600px) {
  .footer-inner {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
}
</style>
