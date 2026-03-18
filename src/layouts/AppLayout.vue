<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-sand p-3">
    <AppSidebar />

    <div class="flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:ml-[232px]">
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
