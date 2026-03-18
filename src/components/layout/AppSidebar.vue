<script setup>
import { onMounted, ref } from 'vue'
import { fetchNavigationItems } from '@/api/navigation'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const navigationItems = ref([])

onMounted(async () => {
  try {
    navigationItems.value = await fetchNavigationItems()
  } catch (error) {
    console.error('Failed to fetch navigation items:', error)
  }
})
</script>

<template>
  <aside
    class="fixed inset-y-3 left-3 z-30 flex w-[220px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-transform lg:translate-x-0"
    :class="uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'"
  >
    <div class="flex h-[77px] flex-shrink-0 items-center border-b border-slate-200 px-4">
      <div class="flex w-full items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
            <img src="/salesboost.svg" alt="SalesBoost" class="h-9 w-9 object-contain" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-bold text-slate-900">SalesBoost</h1>
            <p class="mt-0.5 text-[11px] text-slate-400">해외 B2B 영업관리 시스템</p>
          </div>
        </div>
        <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 lg:hidden" @click="uiStore.closeSidebar">
          닫기
        </button>
      </div>
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.id ?? item.path"
        :to="item.path"
        class="block rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
        active-class="bg-slate-50"
        @click="uiStore.closeSidebar"
      >
        <p class="text-sm font-semibold text-slate-800">{{ item.label }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ item.caption }}</p>
      </RouterLink>
    </nav>

    <div class="border-t border-slate-100 px-4 py-3">
      <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-slate-400"></span>
        v1.0 Demo
      </div>
    </div>
  </aside>
</template>
