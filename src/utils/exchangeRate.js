export const exchangeRateRangeMap = {
  USD: { unitLabel: '1 USD', quoteAmount: 1, min: 1430, max: 1490 },
  EUR: { unitLabel: '1 EUR', quoteAmount: 1, min: 1560, max: 1640 },
  JPY: { unitLabel: '100 JPY', quoteAmount: 100, min: 900, max: 950 },
  GBP: { unitLabel: '1 GBP', quoteAmount: 1, min: 1830, max: 1910 },
  AUD: { unitLabel: '1 AUD', quoteAmount: 1, min: 930, max: 980 },
  CAD: { unitLabel: '1 CAD', quoteAmount: 1, min: 1030, max: 1080 },
  SGD: { unitLabel: '1 SGD', quoteAmount: 1, min: 1070, max: 1130 },
  AED: { unitLabel: '1 AED', quoteAmount: 1, min: 390, max: 410 },
  CNY: { unitLabel: '1 CNY', quoteAmount: 1, min: 197, max: 208 },
  MYR: { unitLabel: '1 MYR', quoteAmount: 1, min: 300, max: 340 },
  THB: { unitLabel: '1 THB', quoteAmount: 1, min: 41, max: 45 },
  VND: { unitLabel: '1000 VND', quoteAmount: 1000, min: 56, max: 62 },
  IDR: { unitLabel: '100 IDR', quoteAmount: 100, min: 8, max: 10 },
  INR: { unitLabel: '1 INR', quoteAmount: 1, min: 16, max: 18 },
  SAR: { unitLabel: '1 SAR', quoteAmount: 1, min: 381, max: 398 },
  BRL: { unitLabel: '1 BRL', quoteAmount: 1, min: 255, max: 290 },
  SEK: { unitLabel: '1 SEK', quoteAmount: 1, min: 136, max: 145 },
  CHF: { unitLabel: '1 CHF', quoteAmount: 1, min: 1620, max: 1690 },
}

export function getDeterministicRate(seedText, min, max) {
  let hash = 0

  for (let index = 0; index < seedText.length; index += 1) {
    hash = (hash * 31 + seedText.charCodeAt(index)) >>> 0
  }

  return min + (hash % (max - min + 1))
}

function getTodayDateInput() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function resolveExchangeRateValue(currency, issueDate) {
  const range = exchangeRateRangeMap[currency]

  if (!range) {
    return null
  }

  const seed = `${currency}:${issueDate || getTodayDateInput()}`
  return getDeterministicRate(seed, range.min, range.max)
}

export function createExchangeRateHint(currency, issueDate) {
  const range = exchangeRateRangeMap[currency]

  if (!range) {
    return `${currency} 환율은 실시간 변동 통화입니다.`
  }

  const rate = resolveExchangeRateValue(currency, issueDate)
  return `참고 환율 ${range.unitLabel} = ${rate.toLocaleString('ko-KR')} KRW`
}

export function convertCurrencyAmountToKrw(amount, currency, issueDate) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return 0
  }

  if (!currency || currency === 'KRW') {
    return Math.round(numericAmount)
  }

  const range = exchangeRateRangeMap[currency]
  const rate = resolveExchangeRateValue(currency, issueDate)

  if (!range || !rate) {
    return Math.round(numericAmount)
  }

  return Math.round((numericAmount / range.quoteAmount) * rate)
}
