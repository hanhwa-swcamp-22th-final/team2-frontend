import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  decodeToken,
  generateTokens,
  getRefreshTokenCookie,
  isTokenExpired,
  removeRefreshTokenCookie,
  setRefreshTokenCookie,
} from '@/lib/token'
import { login as apiLogin, fetchUserById } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // AccessToken은 메모리에만 보관 (새로고침 시 사라짐 → RT로 복구)
  const accessToken = ref(null)
  const user = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value && !isTokenExpired(accessToken.value))

  const currentUser = computed(() => user.value)

  /**
   * 로그인
   */
  async function login(email, pw) {
    const userData = await apiLogin(email, pw)
    if (!userData) throw new Error('INVALID_CREDENTIALS')

    const tokens = generateTokens(userData)
    accessToken.value = tokens.accessToken
    setRefreshTokenCookie(tokens.refreshToken)

    // 비밀번호는 store에 저장하지 않음
    const { pw: _, ...safeUser } = userData
    user.value = safeUser

    return safeUser
  }

  /**
   * 로그아웃
   */
  function logout() {
    accessToken.value = null
    user.value = null
    removeRefreshTokenCookie()
  }

  /**
   * RT로 세션 복구 (새로고침 시)
   *
   * TODO: 백엔드 연동 시 POST /auth/refresh 로 새 AT 발급받는 흐름으로 교체
   * 현재는 RT 디코딩 → userId로 사용자 조회 → 새 토큰 쌍 생성
   */
  async function restoreSession() {
    const rt = getRefreshTokenCookie()
    if (!rt) return false

    const payload = decodeToken(rt)
    if (!payload?.sub || Date.now() > payload.exp) {
      removeRefreshTokenCookie()
      return false
    }

    try {
      // json-server에서 사용자 조회
      const userData = await fetchUserById(payload.sub)
      if (!userData) {
        removeRefreshTokenCookie()
        return false
      }

      const tokens = generateTokens(userData)
      accessToken.value = tokens.accessToken
      setRefreshTokenCookie(tokens.refreshToken)

      const { pw: _, ...safeUser } = userData
      user.value = safeUser
      return true
    } catch {
      removeRefreshTokenCookie()
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
   * 비밀번호 변경 후 store 반영 (pw 제외)
   */
  function updateUserInfo(partial) {
    if (user.value) {
      user.value = { ...user.value, ...partial }
    }
  }

  return {
    accessToken,
    isLoggedIn,
    currentUser,
    login,
    logout,
    restoreSession,
    refreshAccessToken,
    updateUserInfo,
  }
})
