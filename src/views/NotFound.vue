<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()

function goHome() {
  router.replace('/')
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/')
  }
}
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
    <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-500">
      <i class="fas fa-compass text-3xl" aria-hidden="true"></i>
    </div>
    <p class="mb-2 text-sm font-semibold tracking-wider text-brand-500">404 NOT FOUND</p>
    <h1 class="mb-3 text-2xl font-bold text-slate-800">요청하신 페이지를 찾을 수 없습니다.</h1>
    <p class="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
      입력하신 주소가 정확한지 다시 한 번 확인해주세요.
      <br />
      페이지가 이동되었거나 일시적으로 접근할 수 없는 상태일 수 있습니다.
    </p>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <BaseButton variant="secondary" @click="goBack">
        <i class="fas fa-arrow-left mr-2" aria-hidden="true"></i>
        이전 페이지
      </BaseButton>
      <BaseButton variant="primary" @click="goHome">
        <i class="fas fa-home mr-2" aria-hidden="true"></i>
        홈으로 이동
      </BaseButton>
    </div>
  </div>
</template>
