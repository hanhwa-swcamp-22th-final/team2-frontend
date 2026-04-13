/**
 * 국가별 전화번호 포맷 유틸리티
 *
 * 국가 선택 시 국제 전화번호 prefix 자동 삽입 + 하이픈 자동 포맷.
 * countryId → 국가 코드 매핑은 countries 마스터 데이터의 countryName 기반.
 */

const COUNTRY_PHONE = {
  'United States':  { code: '+1',   format: '###-###-####',       placeholder: '+1 XXX-XXX-XXXX' },
  'Canada':         { code: '+1',   format: '###-###-####',       placeholder: '+1 XXX-XXX-XXXX' },
  'Japan':          { code: '+81',  format: '##-####-####',       placeholder: '+81 XX-XXXX-XXXX' },
  'China':          { code: '+86',  format: '###-####-####',      placeholder: '+86 XXX-XXXX-XXXX' },
  'South Korea':    { code: '+82',  format: '##-####-####',       placeholder: '+82 XX-XXXX-XXXX' },
  'Korea':          { code: '+82',  format: '##-####-####',       placeholder: '+82 XX-XXXX-XXXX' },
  'Germany':        { code: '+49',  format: '####-#######',       placeholder: '+49 XXXX-XXXXXXX' },
  'United Kingdom': { code: '+44',  format: '####-######',        placeholder: '+44 XXXX-XXXXXX' },
  'France':         { code: '+33',  format: '#-##-##-##-##',      placeholder: '+33 X-XX-XX-XX-XX' },
  'Australia':      { code: '+61',  format: '###-###-###',        placeholder: '+61 XXX-XXX-XXX' },
  'India':          { code: '+91',  format: '#####-#####',        placeholder: '+91 XXXXX-XXXXX' },
  'Singapore':      { code: '+65',  format: '####-####',          placeholder: '+65 XXXX-XXXX' },
  'Thailand':       { code: '+66',  format: '##-###-####',        placeholder: '+66 XX-XXX-XXXX' },
  'Vietnam':        { code: '+84',  format: '###-###-####',       placeholder: '+84 XXX-XXX-XXXX' },
  'Indonesia':      { code: '+62',  format: '###-####-####',      placeholder: '+62 XXX-XXXX-XXXX' },
  'Malaysia':       { code: '+60',  format: '##-####-####',       placeholder: '+60 XX-XXXX-XXXX' },
  'UAE':            { code: '+971', format: '##-###-####',        placeholder: '+971 XX-XXX-XXXX' },
  'Saudi Arabia':   { code: '+966', format: '##-###-####',        placeholder: '+966 XX-XXX-XXXX' },
  'Brazil':         { code: '+55',  format: '##-#####-####',      placeholder: '+55 XX-XXXXX-XXXX' },
  'Mexico':         { code: '+52',  format: '###-###-####',       placeholder: '+52 XXX-XXX-XXXX' },
  'Turkey':         { code: '+90',  format: '###-###-####',       placeholder: '+90 XXX-XXX-XXXX' },
  'Netherlands':    { code: '+31',  format: '##-########',        placeholder: '+31 XX-XXXXXXXX' },
  'Italy':          { code: '+39',  format: '###-###-####',       placeholder: '+39 XXX-XXX-XXXX' },
  'Spain':          { code: '+34',  format: '###-###-###',        placeholder: '+34 XXX-XXX-XXX' },
  'Sweden':         { code: '+46',  format: '##-###-####',        placeholder: '+46 XX-XXX-XXXX' },
  'Switzerland':    { code: '+41',  format: '##-###-##-##',       placeholder: '+41 XX-XXX-XX-XX' },
  'Poland':         { code: '+48',  format: '###-###-###',        placeholder: '+48 XXX-XXX-XXX' },
  'Russia':         { code: '+7',   format: '###-###-##-##',      placeholder: '+7 XXX-XXX-XX-XX' },
  'Philippines':    { code: '+63',  format: '###-###-####',       placeholder: '+63 XXX-XXX-XXXX' },
  'Taiwan':         { code: '+886', format: '##-####-####',       placeholder: '+886 XX-XXXX-XXXX' },
}

const DEFAULT_PHONE = { code: '', format: '###-####-####', placeholder: '전화번호를 입력하세요' }

/**
 * 국가명으로 전화번호 정보 조회
 */
export function getPhoneInfoByCountry(countryName) {
  if (!countryName) return DEFAULT_PHONE
  return COUNTRY_PHONE[countryName] ?? DEFAULT_PHONE
}

/**
 * 입력값에 포맷 마스크 적용 (하이픈 자동 삽입)
 * @param {string} raw 숫자만 추출된 입력값
 * @param {string} format 포맷 패턴 (예: '###-###-####')
 * @returns {string} 포맷된 전화번호
 */
export function applyPhoneMask(raw, format) {
  const digits = String(raw).replace(/[^\d]/g, '')
  let result = ''
  let di = 0

  for (let i = 0; i < format.length && di < digits.length; i++) {
    if (format[i] === '#') {
      result += digits[di++]
    } else {
      result += format[i]
      // 마지막 숫자가 채워진 직후의 하이픈은 포함하지 않음
      if (di >= digits.length) break
    }
  }

  return result
}

/**
 * 전화번호 입력 이벤트 핸들러 — v-model과 함께 사용
 * @param {string} inputValue 사용자 입력값
 * @param {string} countryCode 국제 전화번호 prefix (예: '+82')
 * @param {string} format 포맷 패턴
 * @returns {string} prefix + 포맷된 번호
 */
export function formatPhoneInput(inputValue, countryCode, format) {
  const prefix = countryCode ? `${countryCode} ` : ''
  // prefix 이후의 순수 입력 부분만 추출
  const afterPrefix = inputValue.startsWith(prefix)
    ? inputValue.slice(prefix.length)
    : inputValue.replace(/^\+?\d{1,3}\s?/, '')

  const formatted = applyPhoneMask(afterPrefix, format)
  return formatted ? `${prefix}${formatted}` : prefix
}

/**
 * 전화번호에서 prefix 제거 후 순수 숫자만 추출
 */
export function extractPhoneDigits(value) {
  return String(value ?? '').replace(/[^\d]/g, '')
}
