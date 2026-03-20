/**
 * 토큰 유틸리티
 *
 * 현재(프론트 단독 개발 단계):
 *   - json-server에 JWT 발급 기능이 없으므로 간이 토큰을 생성해 시뮬레이션
 *   - AccessToken → 메모리(Pinia store)
 *   - RefreshToken → HttpOnly 쿠키 (시뮬레이션: 일반 쿠키)
 *
 * TODO: 백엔드 연동 시 실제 JWT 발급/검증 흐름으로 교체
 */

const AT_EXPIRY_MS = 30 * 60 * 1000 // 30분
const RT_EXPIRY_DAYS = 7
const RT_COOKIE_NAME = 'sb_refresh_token'

/**
 * 간이 토큰 생성 (base64 인코딩된 JSON)
 * 백엔드 연동 시 서버에서 발급받은 JWT로 대체
 */
export function generateTokens(user) {
  const now = Date.now()

  const accessPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: now,
    exp: now + AT_EXPIRY_MS,
  }

  const refreshPayload = {
    sub: user.id,
    iat: now,
    exp: now + RT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  }

  const accessToken = btoa(encodeURIComponent(JSON.stringify(accessPayload)))
  const refreshToken = btoa(encodeURIComponent(JSON.stringify(refreshPayload)))

  return { accessToken, refreshToken }
}

/** AT 페이로드 디코딩 */
export function decodeToken(token) {
  try {
    return JSON.parse(decodeURIComponent(atob(token)))
  } catch {
    return null
  }
}

/** AT 만료 여부 */
export function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() > payload.exp
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
