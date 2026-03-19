<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
</script>

<template>
  <div class="min-h-screen bg-[#F5F6F7] p-3">
    <button
      v-if="uiStore.sidebarOpen"
      type="button"
      class="fixed inset-0 z-20 bg-slate-900/20 lg:hidden"
      aria-label="사이드바 닫기"
      @click="uiStore.closeSidebar"
    />

    <AppSidebar />

    <div
      class="flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-[margin] duration-200"
      :class="uiStore.sidebarOpen ? 'lg:ml-[232px]' : 'ml-[44px]'"
    >
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
