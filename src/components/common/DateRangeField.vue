<script setup>
import BaseButton from '@/components/common/BaseButton.vue'
import DateField from '@/components/common/DateField.vue'

defineProps({
  start: {
    type: String,
    default: '',
  },
  end: {
    type: String,
    default: '',
  },
})

defineEmits(['update:start', 'update:end', 'reset'])
</script>

<template>
  <div class="space-y-3">
    <div class="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <DateField :model-value="start" @update:model-value="$emit('update:start', $event)" />
      <span class="text-center text-sm text-slate-400">~</span>
      <DateField :model-value="end" @update:model-value="$emit('update:end', $event)" />
    </div>
    <div class="flex justify-end">
      <BaseButton variant="secondary" size="sm" @click="$emit('reset')">기간 초기화</BaseButton>
    </div>
  </div>
</template>
