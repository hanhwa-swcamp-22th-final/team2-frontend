// 전역 in-flight HTTP 요청 카운터.
// lib/api.js 의 axios 인터셉터가 request 시 inc / response·error 시 dec.
// GlobalLoadingOverlay 가 이 ref 를 watch 하여 카운터 > 0 이면 스피너 + pointer-events 차단 overlay 렌더.
//
// 배경: 리스트/폼이 API 응답 오기 전부터 렌더되면서 fallback/빈 데이터 상태에서 사용자가
// 버튼 클릭 → 중간 상태 insert → 정합성 깨지는 현상이 시연 중 관찰됨. 요청이 돌 때
// 전역적으로 잠그는 게 가장 작은 변경으로 해결.
//
// 특정 요청을 silent 처리하려면 axios config 에 { meta: { silent: true } } 전달.
// (예: 폴링, 토큰 refresh, 활동 로그 저장 등 백그라운드 요청)

import { ref, computed } from 'vue'

const pending = ref(0)

export function startLoading() {
  pending.value += 1
}

export function stopLoading() {
  if (pending.value > 0) pending.value -= 1
}

export function resetLoading() {
  pending.value = 0
}

export const isLoading = computed(() => pending.value > 0)
export const pendingCount = computed(() => pending.value)
