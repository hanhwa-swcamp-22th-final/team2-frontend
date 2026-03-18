<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-ink">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
