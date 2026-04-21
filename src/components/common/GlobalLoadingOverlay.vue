<script setup>
import { isLoading } from '@/stores/loading'
</script>

<template>
  <!--
    전역 로딩 오버레이 — lib/api.js 의 axios 인터셉터가 관리하는 pending 카운터가 0 이 아니면 노출.
    pointer-events: auto 로 하위 UI 클릭/폼 입력을 완전 차단해 fallback 중 action 을 막는다.
    시각적으론 반투명 흰 배경 + 중앙 스피너. 60ms 정도의 짧은 요청은 보이지 않도록
    transition delay 를 줘서 flicker 회피.
  -->
  <Transition name="overlay-fade">
    <div v-if="isLoading" class="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div class="spinner" aria-hidden="true"></div>
      <span class="visually-hidden">로딩 중</span>
    </div>
  </Transition>
</template>

<style scoped>
.global-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.55);
  backdrop-filter: blur(1px);
  cursor: wait;
}

.spinner {
  width: 42px;
  height: 42px;
  border: 4px solid #cbd5e1;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 140ms ease;
}
.overlay-fade-enter-active {
  transition-delay: 80ms;  /* 매우 빠른 요청은 아예 안 보임 (flicker 방지) */
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
