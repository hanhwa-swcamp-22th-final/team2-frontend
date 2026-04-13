/**
 * 공통 유효성 검증 유틸리티
 */

// ── 이메일 ────────────────────────────────────────────────
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email ?? '').trim())
}

// ── 전화번호 (숫자·하이픈·플러스·공백·괄호 허용, 7~20자) ──
export const TEL_REGEX = /^\+?[\d\s()-]{7,20}$/

export function isValidTel(tel) {
  return TEL_REGEX.test(String(tel ?? '').trim())
}

// ── HS Code (숫자·점만 허용) ──────────────────────────────
export const HS_CODE_REGEX = /^[\d.]+$/

export function isValidHsCode(code) {
  return HS_CODE_REGEX.test(String(code ?? '').trim())
}

// ── 숫자 범위 검증 ───────────────────────────────────────
export function isInRange(value, min, max) {
  const num = Number(value)
  if (Number.isNaN(num)) return false
  return num >= min && num <= max
}

// ── 양수 / 비음수 검증 ──────────────────────────────────
export function isPositiveNumber(value) {
  const num = Number(value)
  return !Number.isNaN(num) && num > 0
}

export function isNonNegativeNumber(value) {
  const num = Number(value)
  return !Number.isNaN(num) && num >= 0
}

// ── 글자 수 제한 ────────────────────────────────────────
export function isWithinLength(value, maxLen) {
  return String(value ?? '').length <= maxLen
}

// ── 필수 문자열 ─────────────────────────────────────────
export function isRequired(value) {
  return String(value ?? '').trim().length > 0
}

// ── 상수 ────────────────────────────────────────────────
export const MAX_LEN = {
  NAME: 100,
  NAME_KR: 50,
  ADDRESS: 200,
  TEL: 20,
  FAX: 20,
  EMAIL: 100,
  CODE: 20,
  CITY: 50,
  MANAGER: 50,
  HS_CODE: 20,
  REMARK: 500,
}

export const NUM_RANGE = {
  DIMENSION_MAX: 99999,
  WEIGHT_MAX: 999999,
  UNIT_PRICE_MAX: 9999999999,
  QUANTITY_MAX: 99999999,
}
