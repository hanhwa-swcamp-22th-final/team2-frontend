<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const route = useRoute()
const pageTitle = computed(() => String(route.meta.serviceName ?? '공통 대시보드'))
</script>

<template>
  <header class="flex items-start justify-between gap-4 rounded-[28px] bg-white/80 p-5 shadow-panel backdrop-blur">
    <div>
      <p class="text-xs uppercase tracking-[0.28em] text-brand">Screen Design Phase</p>
      <h2 class="mt-2 text-2xl font-semibold text-ink">{{ pageTitle }}</h2>
      <p class="mt-2 text-sm text-slate-500">백엔드 연동 전 화면 검토와 IA 정리에 집중하는 공통 작업공간</p>
    </div>

    <button class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium lg:hidden" @click="uiStore.toggleSidebar">
      메뉴
    </button>
  </header>
</template>
