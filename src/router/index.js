// src/router/index.js
import { defineRouter } from '#q-app'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import { useAuth } from '../composables/useAuth'

export default defineRouter(() => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  })

  // ═════════════════════════════════════════════════════════════
  // ROUTE GUARD — cek autentikasi guru
  // ═════════════════════════════════════════════════════════════
  Router.beforeEach((to) => {
    const { isAuthenticated } = useAuth()

    // Route yang butuh login (definisikan via <route> block di .vue)
    if (to.meta?.requiresAuth && !isAuthenticated.value) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    // Route khusus admin
    if (to.meta?.requiresAdmin) {
      const { isAdmin } = useAuth()
      if (!isAdmin.value) {
        return { path: '/guru-dashboard' }
      }
    }

    return true
  })

  Router.onError((error, to) => {
    console.error('[Router Error]', {
      message: error?.message,
      to: to?.fullPath,
      stack: error?.stack,
    })
  })

  if (import.meta.hot) {
    handleHotUpdate(Router)
  }

  return Router
})
