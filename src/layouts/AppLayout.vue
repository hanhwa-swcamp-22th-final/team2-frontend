<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <div class="min-h-screen">
    <AppSidebar />

    <div class="px-4 pb-8 pt-4 lg:ml-[20rem] lg:px-8">
      <AppHeader />
      <main class="mt-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
