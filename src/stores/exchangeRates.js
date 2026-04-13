import { ref } from 'vue'

/**
 * 환율 Pinia-like store (PI 관리 페이지 진입 시 로드, 이탈 시 클리어)
 *
 * 데이터 소스: https://github.com/fawazahmed0/exchange-api
 * KRW 기준 환율을 가져와서 1 KRW = ? 외화 비율을 저장한다.
 */

const API_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'

const rates = ref({})
const rateDate = ref('')
const loading = ref(false)
const loaded = ref(false)

/**
 * 환율 데이터 로드 (KRW 기준)
 * rates = { usd: 0.000742, eur: 0.000686, jpy: 0.1124, ... }
 * 의미: 1 KRW = 0.000742 USD
 */
export async function loadExchangeRates() {
  if (loaded.value || loading.value) return
  loading.value = true

  try {
    const response = await fetch(`${API_BASE}/krw.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    rates.value = data.krw ?? {}
    rateDate.value = data.date ?? ''
    loaded.value = true
  } catch (e) {
    console.warn('환율 데이터 로드 실패 (fallback 없음):', e.message)
  } finally {
    loading.value = false
  }
}

/**
 * 환율 데이터 클리어 (PI 페이지 이탈 시)
 */
export function clearExchangeRates() {
  rates.value = {}
  rateDate.value = ''
  loaded.value = false
}

/**
 * KRW → 외화 변환
 * @param {number} krwAmount KRW 금액
 * @param {string} targetCurrency 목표 통화 코드 (예: 'USD')
 * @returns {number} 변환된 금액 (소수점 2자리)
 */
export function convertFromKrw(krwAmount, targetCurrency) {
  const amount = Number(krwAmount)
  if (!Number.isFinite(amount)) return 0
  if (!targetCurrency || targetCurrency === 'KRW') return amount

  const rate = rates.value[targetCurrency.toLowerCase()]
  if (!rate) return amount

  return Number((amount * rate).toFixed(2))
}

/**
 * 특정 통화의 환율 조회 (1 USD = ? KRW 형태로 반환)
 * @param {string} currencyCode 통화 코드
 * @returns {number|null} 환율 (예: 1 USD = 1348.5 KRW) 또는 null
 */
export function getKrwRate(currencyCode) {
  if (!currencyCode || currencyCode === 'KRW') return 1

  const rate = rates.value[currencyCode.toLowerCase()]
  if (!rate || rate === 0) return null

  return Number((1 / rate).toFixed(2))
}

/**
 * 환율 힌트 텍스트 생성
 * @param {string} currency 통화 코드
 * @returns {string} 힌트 텍스트
 */
export function createExchangeRateHint(currency) {
  if (!currency || currency === 'KRW') {
    return '원화(KRW) 거래입니다.'
  }

  const krwRate = getKrwRate(currency)
  if (krwRate === null) {
    return `${currency} 환율 정보를 불러오는 중...`
  }

  return `1 ${currency} = ${krwRate.toLocaleString('ko-KR')} KRW (${rateDate.value})`
}

export function useExchangeRates() {
  return { rates, rateDate, loading, loaded, loadExchangeRates, clearExchangeRates, convertFromKrw, getKrwRate, createExchangeRateHint }
}
