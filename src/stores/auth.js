import { computed, readonly, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  decodeToken,
  getRefreshTokenCookie,
  isTokenExpired,
  removeRefreshTokenCookie,
  setRefreshTokenCookie,
} from '@/lib/token'
import {
  login as apiLogin,
  refreshToken as apiRefresh,
  logoutApi,
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(null)
  const _refreshToken = ref(null)
  const user = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value && !isTokenExpired(accessToken.value))

  const currentUser = computed(() => user.value)

  /**
   * 로그인
   */
  async function login(email, password) {
    const data = await apiLogin(email, password)

    accessToken.value = data.accessToken
    _refreshToken.value = data.refreshToken
    setRefreshTokenCookie(data.refreshToken)
    user.value = data.user

    return data.user
  }

  /**
   * 로그아웃
   */
  async function logout() {
    try {
      if (user.value?.userId) {
        await logoutApi(user.value.userId)
      }
    } catch {
      // 서버 오류 시에도 로컬 세션은 정리
    }
    accessToken.value = null
    _refreshToken.value = null
    user.value = null
    removeRefreshTokenCookie()
  }

  /**
   * RT로 세션 복구 (새로고침 시)
   */
  async function restoreSession() {
    const rt = _refreshToken.value || getRefreshTokenCookie()
    if (!rt) return false

    try {
      const data = await apiRefresh(rt)

      accessToken.value = data.accessToken
      _refreshToken.value = data.refreshToken
      setRefreshTokenCookie(data.refreshToken)
      user.value = data.user

      return true
    } catch {
      removeRefreshTokenCookie()
      accessToken.value = null
      _refreshToken.value = null
      user.value = null
      return false
    }
  }

  /**
   * AT 갱신 (인터셉터에서 호출)
   */
  async function refreshAccessToken() {
    return restoreSession()
  }

  /**
   * 사용자 정보 부분 업데이트
   */
  function updateUserInfo(partial) {
    if (user.value) {
      user.value = { ...user.value, ...partial }
    }
  }

  return {
    accessToken: readonly(accessToken),
    isLoggedIn,
    currentUser,
    login,
    logout,
    restoreSession,
    refreshAccessToken,
    updateUserInfo,
  }
})
