<script setup>
defineProps({
  to: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <RouterLink
    :to="to"
    class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
  >
    <slot />
  </RouterLink>
</template>
