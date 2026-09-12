// src/composables/useAuth.js
// =============================================================
// Autentikasi guru berbasis static credentials (teachers.json).
// Session disimpan di sessionStorage (default) atau localStorage.
// =============================================================

import { ref, computed } from 'vue'
import teachersConfig from '../config/teachers.json'
import { sha256 } from '../utils/passwordHash'

const SESSION_KEY = 'ppkn-auth-v1'

// ═══════════════════════════════════════════════════════════
// Module-level state (shared singleton)
// ═══════════════════════════════════════════════════════════
const currentUser = ref(loadSession())

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Cek expiry (7 hari untuk remember-me)
    if (data.expiresAt && Date.now() > data.expiresAt) {
      clearSession()
      return null
    }
    return data
  } catch {
    return null
  }
}

function saveSession(user, remember) {
  const data = {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    loginAt: Date.now(),
    expiresAt: remember ? Date.now() + 7 * 24 * 60 * 60 * 1000 : null,
  }
  currentUser.value = data
  const target = remember ? localStorage : sessionStorage
  target.setItem(SESSION_KEY, JSON.stringify(data))
}

function clearSession() {
  currentUser.value = null
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* noop */
  }
}

// ═══════════════════════════════════════════════════════════
// Composable
// ═══════════════════════════════════════════════════════════
export function useAuth() {
  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  /**
   * Login dengan username + password.
   * @param {string} username
   * @param {string} password
   * @param {boolean} remember
   * @returns {Promise<{ok:boolean, user?:object, error?:string}>}
   */
  async function login(username, password, remember = false) {
    const u = String(username || '')
      .trim()
      .toLowerCase()
    const p = String(password || '')

    if (!u || !p) {
      return { ok: false, error: 'Username dan password wajib diisi.' }
    }

    const teacher = teachersConfig.teachers.find(
      (t) => t.username.toLowerCase() === u && t.active !== false,
    )
    if (!teacher) {
      return { ok: false, error: 'Username tidak ditemukan.' }
    }

    const hash = await sha256(p)
    if (hash !== teacher.passwordHash) {
      return { ok: false, error: 'Password salah.' }
    }

    saveSession(teacher, remember)
    return { ok: true, user: teacher }
  }

  function logout() {
    clearSession()
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
  }
}

export default { useAuth }
