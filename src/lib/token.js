/**
 * JWT AccessToken 유틸리티
 *
 * AccessToken  → 메모리(Pinia store)만 사용
 * RefreshToken → HttpOnly Secure 쿠키 (서버 Set-Cookie로 관리, JS 접근 불가)
 */

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
