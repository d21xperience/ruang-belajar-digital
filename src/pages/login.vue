<template>
  <q-page class="login-page">
    <div class="login-wrap">
      <q-card flat bordered class="login-card">
        <div class="login-head">
          <!-- <q-icon name="locked" size="42px" color="primary" /> -->
          <h1>Login Guru</h1>
          <!-- <p>Akses dashboard dan content builder</p> -->
        </div>

        <q-form @submit.prevent="doLogin">
          <q-input v-model="username" outlined dense label="Username" autocomplete="username" autofocus class="q-mb-md"
            :disable="loading">
            <template #prepend><q-icon name="person" /></template>
          </q-input>

          <q-input v-model="password" outlined dense type="password" label="Password" autocomplete="current-password"
            class="q-mb-md" :disable="loading">
            <template #prepend><q-icon name="lock" /></template>
          </q-input>

          <q-checkbox v-model="remember" dense label="Ingat saya 7 hari" class="q-mb-md" />

          <div v-if="error" class="login-error">
            <q-icon name="error" size="16px" />
            {{ error }}
          </div>

          <q-btn type="submit" class="btn-primary-tech full-width" unelevated :loading="loading" icon="login"
            label="Masuk" />
        </q-form>

        <div class="login-footer">
          <q-btn flat dense icon="arrow_back" label="Kembali ke Beranda" @click="goHome" />
        </div>

        <!-- <div class="login-info">
          <q-icon name="info" size="14px" />
          Hubungi admin sekolah jika lupa password.
        </div> -->
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { login, isAuthenticated } = useAuth()

const username = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const error = ref('')

onMounted(() => {
  // Kalau sudah login, langsung redirect
  if (isAuthenticated.value) {
    redirectAfterLogin()
  }
})

function redirectAfterLogin() {
  const redirect = route.query.redirect
  if (redirect && typeof redirect === 'string') {
    router.replace(redirect)
  } else {
    router.replace('/guru-dashboard')
  }
}

async function doLogin() {
  error.value = ''
  loading.value = true
  try {
    const result = await login(username.value, password.value, remember.value)
    if (!result.ok) {
      error.value = result.error
      return
    }
    $q.notify({
      type: 'positive',
      message: `Selamat datang, ${result.user.nama.split(',')[0]}!`,
      position: 'top',
    })
    redirectAfterLogin()
  } catch (e) {
    error.value = `Terjadi kesalahan: ${e.message}`
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #0B1F33 0%, #16324F 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-wrap {
  width: 100%;
  max-width: 400px;
}

.login-card {
  padding: 16px 14px;
  border-radius: 10px;
  background: #FFFFFF;
}

.login-head {
  text-align: center;
  margin-bottom: 24px;
}

.login-head h1 {
  font-size: 1.4rem;
  margin: 8px 0 4px;
  color: #0B1F33;
}

.login-head p {
  color: #5B6B7C;
  font-size: 0.88rem;
  margin: 0;
}

.btn-primary-tech {
  background: #C9A227;
  color: #0B1F33;
  font-weight: 600;
  border-radius: 4px;
  padding: 12px;
}

.login-error {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  background: #F1DCDB;
  color: #A6403F;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-bottom: 14px;
}

.login-footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #D8DEE5;
}

.login-info {
  margin-top: 14px;
  text-align: center;
  font-size: 0.75rem;
  color: #5B6B7C;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
