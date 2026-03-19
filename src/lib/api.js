import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 8000,
})

/**
 * auth store 주입 (순환 참조 방지)
 * main.js 또는 router guard에서 setupApiInterceptors(authStore) 호출
 */
let _authStore = null

export function setupApiInterceptors(authStore) {
  _authStore = authStore
}

/**
 * 요청 인터셉터: AT를 Authorization 헤더에 첨부
 */
api.interceptors.request.use((config) => {
  config.headers['X-Screen-Only'] = 'true'

  if (_authStore?.accessToken) {
    config.headers.Authorization = `Bearer ${_authStore.accessToken}`
  }

  return config
})

/**
 * 응답 인터셉터: 401 시 RT로 AT 갱신 후 재시도
 *
 * TODO: 백엔드 연동 시 실제 401 응답에 대해 동작
 * 현재 json-server는 401을 주지 않으므로 방어 코드로만 존재
 */
let isRefreshing = false
let pendingRequests = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

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
          window.location.href = '/login'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        _authStore.logout()
        pendingRequests.forEach(({ reject }) => reject(refreshError))
        pendingRequests = []
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
