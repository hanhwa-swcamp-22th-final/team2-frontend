import { getKrwRate } from '@/stores/exchangeRates'

export function createExchangeRateHint(currency) {
  if (!currency || currency === 'KRW') {
    return '원화(KRW) 거래입니다.'
  }
  return `${currency} → KRW 환율은 백엔드에서 실시간 적용됩니다.`
}

/**
 * 외화 금액을 현재 환율로 KRW 환산.
 * 호출자는 @/stores/exchangeRates 의 loadExchangeRates() 를 사전에 호출해 rate 가
 * 메모리에 로드돼 있어야 한다. rate 미로드 시 getKrwRate 는 null 을 반환하므로
 * 이 경우 원금 그대로 반환하지 말고 0 을 반환해 "집계 불가" 임을 명확히 드러낸다
 * (이전엔 외화값을 1:1 로 KRW 로 찍어 수억원을 수십만으로 오표시 → Issue #1).
 */
export function convertCurrencyAmountToKrw(amount, currency) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return 0
  }

  if (!currency || currency === 'KRW') {
    return Math.round(numericAmount)
  }

  const rate = getKrwRate(currency)
  if (!rate || rate === 1) {
    // rate 로드 실패 또는 1 은 환율 데이터가 없음을 뜻함. 0 반환하여 UI 가 "-" 로
    // 표시하거나 집계에서 제외하도록 한다.
    return 0
  }

  return Math.round(numericAmount * rate)
}
