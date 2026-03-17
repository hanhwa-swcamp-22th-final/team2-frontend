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
  <section class="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur">
    <div class="mb-4">
      <p class="text-sm font-medium uppercase tracking-[0.22em] text-brand/70">{{ title }}</p>
      <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <slot />
  </section>
</template>
