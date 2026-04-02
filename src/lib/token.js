/**
 * JWT 토큰 유틸리티
 *
 * AccessToken  → 메모리(Pinia store)
 * RefreshToken → 쿠키
 */

const RT_COOKIE_NAME = 'sb_refresh_token'
const RT_EXPIRY_DAYS = 7

/** JWT 페이로드 디코딩 (서명 검증은 서버에서 수행) */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(atob(base64)))
  } catch {
    return null
  }
}

/** AT 만료 여부 */
export function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() > payload.exp * 1000
}

/** RT를 쿠키에 저장 */
export function setRefreshTokenCookie(token) {
  const expires = new Date(Date.now() + RT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${RT_COOKIE_NAME}=${token}; expires=${expires}; path=/; SameSite=Strict; Secure`
}

/** RT를 쿠키에서 읽기 */
export function getRefreshTokenCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${RT_COOKIE_NAME}=([^;]*)`))
  return match ? match[1] : null
}

/** RT 쿠키 삭제 */
export function removeRefreshTokenCookie() {
  document.cookie = `${RT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure`
}
