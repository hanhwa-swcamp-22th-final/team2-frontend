const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', JPY: '¥', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$',
  AED: 'د.إ', CNY: '¥', MYR: 'RM', THB: '฿', VND: '₫', IDR: 'Rp',
  INR: '₹', SAR: '﷼', BRL: 'R$', SEK: 'kr', CHF: 'CHF', KRW: '₩',
}

// 통화별 소수 자릿수.
// KRW 와 JPY 는 센트 단위가 없으므로 0, 그 외는 2자리.
const CURRENCY_DECIMALS = {
  KRW: 0,
  JPY: 0,
}

export function getCurrencySymbol(currencyCode) {
  return CURRENCY_SYMBOLS[currencyCode] ?? ''
}

export function getCurrencyDecimals(currencyCode) {
  return CURRENCY_DECIMALS[currencyCode] ?? 2
}

// row.currencyCode 가 null/"" 인 케이스를 USD 로 간주. CI 목록 "1,200,000" 처럼
// 통화 기호가 통째로 누락되던 증상 방지 (Issue #10).
function resolveCurrency(currencyCode) {
  return currencyCode && currencyCode !== '' ? currencyCode : 'USD'
}

/**
 * 통화 기호 + 숫자 포맷팅. 통화별 소수 자릿수 자동 적용.
 * 이전에는 maximumFractionDigits 를 0 으로 하드코딩해 $3,999.97 → $4,000 같이
 * 소수점 2자리가 강제 반올림 되는 표시 오류(Issue #2) 가 있었음.
 * currencyCode 가 null/"" 인 경우 USD 로 간주해 기호 누락 방지 (Issue #10).
 */
export function formatCurrencyAmount(amount, currencyCode) {
  const resolved = resolveCurrency(currencyCode)
  const symbol = getCurrencySymbol(resolved)
  const decimals = getCurrencyDecimals(resolved)
  const value = Number(amount || 0)
  // min = max = decimals 로 통일해 trailing zero 유지. USD $139,998.90 가 $139,998.9
  // 로 잘려 보이던 F3 해소. KRW/JPY 는 decimals=0 이므로 자연히 정수만 노출.
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${symbol}${formatted}`
}
