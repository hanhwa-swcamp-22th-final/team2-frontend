import axios from 'axios'
import { startLoading, stopLoading } from '@/stores/loading'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20000,
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

  // 전역 로딩 오버레이 on. config.meta.silent=true 면 카운터 증가 생략 (폴링/백그라운드).
  if (!config?.meta?.silent) {
    startLoading()
    config._loadingTracked = true
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
  (response) => {
    if (response?.config?._loadingTracked) stopLoading()
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (originalRequest?._loadingTracked) {
      stopLoading()
      originalRequest._loadingTracked = false
    }

    // /auth/refresh, /auth/login 의 401 은 인터셉터에서 제외 — 데드락/오류 가림 방지.
    // refresh 401 을 또 refresh 로 보내면 큐 대기 무한루프, login 401 을 refresh 로 가리면
    // 잘못된 비밀번호 toast 가 안 뜨고 logout/redirect 만 일어남.
    const url = originalRequest?.url ?? ''
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
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
