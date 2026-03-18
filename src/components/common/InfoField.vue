<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    default: '',
  },
  stacked: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: '-',
  },
})
</script>

<template>
  <div :class="stacked ? 'space-y-1.5' : 'flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0'">
    <p class="shrink-0 text-sm font-medium text-slate-500">{{ label }}</p>
    <div class="min-w-0 text-sm text-ink" :class="stacked ? '' : 'text-right font-medium'">
      <slot>
        {{ value || emptyText }}
      </slot>
    </div>
  </div>
</template>
