import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setupApiInterceptors, setRouter } from './lib/api'
import { canAccessRouteByRole, getRoleHomePath } from './utils/roleAccess'
import { useToast } from './composables/useToast'
import './styles/tailwind.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Pinia 등록 후 auth store 초기화 & API 인터셉터 연결
const authStore = useAuthStore()
setupApiInterceptors(authStore)
setRouter(router)

// 라우터 가드: 비로그인 시 /login으로 리다이렉트
const PUBLIC_ROUTES = ['login', 'forgot-password']

router.beforeEach(async (to) => {
  // 공개 페이지는 통과
  if (PUBLIC_ROUTES.includes(to.name)) {
    // 이미 로그인 상태면 대시보드로
    if (authStore.isLoggedIn) return getRoleHomePath(authStore.currentUser?.userRole ?? authStore.currentUser?.role)
    return true
  }

  // 로그인 상태면 통과
  // JWT role claim 은 대문자("ADMIN"), meta.requiredRole 은 소문자("admin") → normalize 필수
  const getRole = () => (authStore.currentUser?.userRole ?? authStore.currentUser?.role ?? '').toLowerCase()
  const denyAccess = () => {
    // sessionStorage flash: 현재 route 언마운트 후 다음 route 마운트 시점에 toast 노출.
    // useToast() 를 가드 내에서 즉시 호출하면 redirect 로 DOM 이 바뀌며 transition 이 유실됨.
    try { sessionStorage.setItem('flash.denyAccess', '1') } catch {}
    return getRoleHomePath(getRole())
  }
  if (authStore.isLoggedIn) {
    if (to.meta.requiredRole && getRole() !== to.meta.requiredRole) {
      return denyAccess()
    }
    if (!canAccessRouteByRole(authStore.currentUser, to.name)) {
      return denyAccess()
    }
    return true
  }

  // AT 없으면 RT로 세션 복구 시도
  const restored = await authStore.restoreSession()
  if (restored) {
    if (to.meta.requiredRole && getRole() !== to.meta.requiredRole) {
      return denyAccess()
    }
    if (!canAccessRouteByRole(authStore.currentUser, to.name)) {
      return denyAccess()
    }
    return true
  }

  // 복구 실패 → 로그인 페이지
  return { name: 'login', query: { redirect: to.fullPath } }
})

router.afterEach(() => {
  if (typeof sessionStorage === 'undefined') return
  if (sessionStorage.getItem('flash.denyAccess') === '1') {
    sessionStorage.removeItem('flash.denyAccess')
    // 다음 tick 에서 toast 띄워 ToastContainer 마운트 완료 보장
    setTimeout(() => {
      useToast().warning('해당 페이지에 접근할 권한이 없습니다.', '접근 제한')
    }, 0)
  }
})

app.use(router)
app.mount('#app')
