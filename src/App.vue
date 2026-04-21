<script setup>
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
</script>

<template>
  <RouterView />
  <GlobalLoadingOverlay />
  <ToastContainer />
</template>
