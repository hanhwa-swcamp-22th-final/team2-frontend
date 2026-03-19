<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  iconClass: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
    <h2 class="flex items-center gap-2.5 text-xl font-bold text-slate-900">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
        <i :class="[iconClass, 'text-sm text-brand-600']" aria-hidden="true"></i>
      </div>
      {{ title }}
    </h2>

    <div
      v-if="$slots.actions"
      class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap"
    >
      <slot name="actions" />
    </div>
  </section>
</template>
