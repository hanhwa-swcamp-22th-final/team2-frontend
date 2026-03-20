import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setupApiInterceptors } from './lib/api'
import './styles/tailwind.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Pinia 등록 후 auth store 초기화 & API 인터셉터 연결
const authStore = useAuthStore()
setupApiInterceptors(authStore)

// 라우터 가드: 비로그인 시 /login으로 리다이렉트
const PUBLIC_ROUTES = ['login', 'forgot-password']

router.beforeEach(async (to) => {
  // 공개 페이지는 통과
  if (PUBLIC_ROUTES.includes(to.name)) {
    // 이미 로그인 상태면 대시보드로
    if (authStore.isLoggedIn) return { name: 'dashboard' }
    return true
  }

  // 로그인 상태면 통과
  if (authStore.isLoggedIn) {
    if (to.meta.requiredRole && authStore.currentUser?.role !== to.meta.requiredRole) {
      return { name: 'dashboard' }
    }
    return true
  }

  // AT 없으면 RT로 세션 복구 시도
  const restored = await authStore.restoreSession()
  if (restored) {
    if (to.meta.requiredRole && authStore.currentUser?.role !== to.meta.requiredRole) {
      return { name: 'dashboard' }
    }
    return true
  }

  // 복구 실패 → 로그인 페이지
  return { name: 'login', query: { redirect: to.fullPath } }
})

app.use(router)
app.mount('#app')
