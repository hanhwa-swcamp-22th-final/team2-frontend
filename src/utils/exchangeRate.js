export function createExchangeRateHint(currency) {
  if (!currency || currency === 'KRW') {
    return '원화(KRW) 거래입니다.'
  }
  return `${currency} → KRW 환율은 백엔드에서 실시간 적용됩니다.`
}

export function convertCurrencyAmountToKrw(amount, currency) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return 0
  }

  if (!currency || currency === 'KRW') {
    return Math.round(numericAmount)
  }

  return Math.round(numericAmount)
}
