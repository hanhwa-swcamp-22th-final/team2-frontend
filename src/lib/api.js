import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 8000,
  withCredentials: true, // HttpOnly 쿠키 자동 송수신 (RT)
})

/**
 * auth store + router 주입 (순환 참조 방지)
 * main.js에서 setupApiInterceptors(authStore) + setRouter(router) 호출
 */
let _authStore = null
let _router = null
let _isRedirecting = false // 401 중복 redirect 방지 플래그

export function setupApiInterceptors(authStore) {
  _authStore = authStore
}

export function setRouter(router) {
  _router = router
}

/**
 * 요청 인터셉터: AT를 Authorization 헤더에 첨부
 */
api.interceptors.request.use((config) => {
  if (_authStore?.accessToken) {
    config.headers.Authorization = `Bearer ${_authStore.accessToken}`
  }

  return config
})

/**
 * 안전한 로그인 페이지 이동 — Vue Router 우선, fallback window.location
 * 중복 redirect 방지 (여러 401이 동시에 발생해도 1회만)
 */
function redirectToLogin() {
  if (_isRedirecting) return
  _isRedirecting = true

  const redirect = _router?.currentRoute?.value?.fullPath
  const query = redirect && redirect !== '/login' ? { redirect } : {}

  if (_router) {
    _router.push({ name: 'login', query }).finally(() => {
      _isRedirecting = false
    })
  } else {
    window.location.href = '/login'
    // fallback 경로에서는 페이지가 reload되므로 플래그 리셋 불필요
  }
}

/**
 * 응답 인터셉터: 401 시 RT로 AT 갱신 후 재시도
 */
let isRefreshing = false
let pendingRequests = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // /auth/refresh 자체의 401 은 인터셉터에서 제외 — 데드락 방지.
    // 이 guard 가 없으면: refresh 401 → interceptor refresh → 또 401 → 큐 대기 → 영원히 안 풀림.
    // restoreSession() 의 try-catch 가 직접 처리한다.
    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry && _authStore) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const restored = await _authStore.refreshAccessToken()

        if (restored) {
          pendingRequests.forEach(({ resolve }) => resolve())
          pendingRequests = []
          return api(originalRequest)
        } else {
          _authStore.logout()
          pendingRequests.forEach(({ reject }) => reject(error))
          pendingRequests = []
          redirectToLogin()
          return Promise.reject(error)
        }
      } catch (refreshError) {
        _authStore.logout()
        pendingRequests.forEach(({ reject }) => reject(refreshError))
        pendingRequests = []
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
