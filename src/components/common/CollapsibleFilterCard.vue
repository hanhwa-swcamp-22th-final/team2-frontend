<script setup>
import BaseCard from '@/components/common/BaseCard.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <BaseCard v-if="open" body-class="px-5 pb-3 pt-3">
      <slot />
  </BaseCard>
</template>
