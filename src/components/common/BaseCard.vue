<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="mb-4">
      <p class="text-sm font-semibold text-slate-800">{{ title }}</p>
      <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <slot />
  </section>
</template>
