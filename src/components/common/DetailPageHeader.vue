<script setup>
import StatusBadge from '@/components/common/StatusBadge.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['back'])
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      @click="emit('back')"
    >
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
    </button>
    <h2 class="text-xl font-bold text-slate-900">{{ title }}</h2>
    <slot name="status">
      <StatusBadge v-if="status" :value="status" />
    </slot>
    <div class="flex-1"></div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
