// 자사정보(회사명/주소/TEL/도장 이미지 URL) 전역 캐시 store.
// 문서 템플릿(PI/PO/CI/PL)이 발행 시점에 도장을 합성하려면 companySealImageUrl 이
// 필요한데, 매 템플릿 마운트마다 /api/company 를 재호출하는 건 낭비라 Pinia 스타일
// 경량 store 로 한 번만 로드하고 재사용한다. 도장 재업로드 시 refreshCompany() 호출.

import { ref } from 'vue'
import { fetchCompany as fetchCompanyApi } from '@/api/auth'

const company = ref(null)
let loadingPromise = null

export async function loadCompany() {
  if (company.value) return company.value
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      const data = await fetchCompanyApi()
      company.value = data
      return data
    } catch (e) {
      console.error('Failed to load company info:', e)
      return null
    } finally {
      loadingPromise = null
    }
  })()
  return loadingPromise
}

export async function refreshCompany() {
  company.value = null
  return loadCompany()
}

export function useCompany() {
  if (!company.value && !loadingPromise) {
    loadCompany()
  }
  return company
}
