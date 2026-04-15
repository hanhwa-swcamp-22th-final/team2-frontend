import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { decodeToken, isTokenExpired } from '@/lib/token'
import { login as apiLogin, refreshToken as apiRefresh, logoutApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(null)
  const user = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value && !isTokenExpired(accessToken.value))

  const currentUser = computed(() => user.value)

  /**
   * 백엔드 UserInfo 정규화.
   * 백엔드 필드명: userRole ('ADMIN'), 프론트 14곳에서 .role (소문자)로 접근.
   * → role = userRole.toLowerCase() 를 항상 세팅하여 양쪽 다 동작하도록.
   */
  function normalizeUser(raw) {
    if (!raw) return null
    return { ...raw, role: (raw.userRole ?? raw.role ?? '').toLowerCase() }
  }

  /**
   * 로그인
   * 응답 body: { accessToken, user }
   * RefreshToken은 서버가 Set-Cookie(HttpOnly)로 직접 설정
   */
  async function login(email, password) {
    const data = await apiLogin(email, password)

    accessToken.value = data.accessToken
    // 백엔드: userRole='ADMIN'. 프론트 14곳에서 .role (소문자)로 접근 → 양쪽 다 세팅.
    user.value = normalizeUser(data.user)

    return user.value
  }

  /**
   * 로그아웃
   * 서버가 Set-Cookie: sb_refresh_token=; Max-Age=0 으로 RT 쿠키 만료
   */
  async function logout() {
    try {
      if (user.value?.userId) {
        await logoutApi(user.value.userId)
      }
    } catch {
      // 서버 오류 시에도 로컬 세션 정리
    }
    accessToken.value = null
    user.value = null
  }

  /**
   * RT로 세션 복구 (새로고침 시)
   * withCredentials=true 설정으로 HttpOnly 쿠키가 자동 전송됨
   */
  async function restoreSession() {
    try {
      const data = await apiRefresh()

      accessToken.value = data.accessToken
      user.value = normalizeUser(data.user)

      return true
    } catch {
      accessToken.value = null
      user.value = null
      return false
    }
  }

  /**
   * AT 갱신 (401 인터셉터에서 호출)
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
