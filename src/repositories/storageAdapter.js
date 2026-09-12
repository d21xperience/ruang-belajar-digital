// src/repositories/storageAdapter.js
// =============================================================
// Adapter storage — abstraksi agar UI tidak tahu apakah data
// disimpan di localStorage, IndexedDB, atau API.
// Jika localStorage tidak tersedia (private mode), fallback ke
// in-memory Map (progres hilang saat refresh, tapi app tidak crash).
// =============================================================

const memoryStore = new Map()
let memoryMode = false

function safeGet(key) {
  if (memoryMode) return memoryStore.get(key) ?? null
  try {
    return window.localStorage.getItem(key)
  } catch (err) {
    console.warn('[storageAdapter] localStorage tidak tersedia, fallback ke memory:', err)
    memoryMode = true
    return memoryStore.get(key) ?? null
  }
}

function safeSet(key, value) {
  if (memoryMode) {
    memoryStore.set(key, value)
    return
  }
  try {
    window.localStorage.setItem(key, value)
  } catch (err) {
    console.warn('[storageAdapter] gagal menulis localStorage, fallback ke memory:', err)
    memoryMode = true
    memoryStore.set(key, value)
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* noop */
  }
  memoryStore.delete(key)
}

export const storageAdapter = {
  isMemoryMode: () => memoryMode,

  get(key) {
    return safeGet(key)
  },

  set(key, value) {
    safeSet(key, String(value))
  },

  remove(key) {
    safeRemove(key)
  },

  getJSON(key, fallback = null) {
    const raw = safeGet(key)
    if (!raw) return fallback
    try {
      return JSON.parse(raw)
    } catch (err) {
      console.warn(`[storageAdapter] JSON corrupt di key "${key}", pakai fallback:`, err)
      return fallback
    }
  },

  setJSON(key, value) {
    safeSet(key, JSON.stringify(value))
  },

  // Daftar semua key dengan prefix tertentu (untuk migrasi legacy)
  keysWithPrefix(prefix) {
    const result = []
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(prefix)) result.push(k)
      }
    } catch {
      /* memory mode: tidak bisa enumerasi */
    }
    return result
  },
}

export default storageAdapter
