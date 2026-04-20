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

/**
 * 통화 기호 + 숫자 포맷팅. 통화별 소수 자릿수 자동 적용.
 * 이전에는 maximumFractionDigits 를 0 으로 하드코딩해 $3,999.97 → $4,000 같이
 * 소수점 2자리가 강제 반올림 되는 표시 오류(Issue #2) 가 있었음.
 */
export function formatCurrencyAmount(amount, currencyCode) {
  const symbol = getCurrencySymbol(currencyCode)
  const decimals = getCurrencyDecimals(currencyCode)
  const value = Number(amount || 0)
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
  return `${symbol}${formatted}`
}
