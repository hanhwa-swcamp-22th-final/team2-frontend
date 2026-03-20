/**
 * 공통 유효성 검증 유틸리티
 */

/** 이메일 유효성 검증 정규식 (Auth 도메인 전체 통일) */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email.trim())
}
