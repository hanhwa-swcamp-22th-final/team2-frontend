<script setup>
import { navigationItems } from '@/data/navigation'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
</script>

<template>
  <aside
    class="fixed inset-y-4 left-4 z-30 w-72 rounded-[28px] bg-ink px-5 py-6 text-white shadow-2xl transition-transform lg:translate-x-0"
    :class="uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'"
  >
    <div class="mb-8 flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.32em] text-teal-200">Team2</p>
        <h1 class="mt-2 text-2xl font-semibold">Screen Kit</h1>
      </div>
      <button class="rounded-full border border-white/20 px-3 py-1 text-sm lg:hidden" @click="uiStore.closeSidebar">
        닫기
      </button>
    </div>

    <nav class="space-y-2">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.path"
        :to="item.path"
        class="block rounded-2xl px-4 py-3 transition hover:bg-white/10"
        active-class="bg-white/15"
        @click="uiStore.closeSidebar"
      >
        <p class="text-sm font-semibold">{{ item.label }}</p>
        <p class="mt-1 text-xs text-slate-300">{{ item.caption }}</p>
      </RouterLink>
    </nav>
  </aside>
</template>
