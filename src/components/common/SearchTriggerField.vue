<script setup>
import BaseTextField from '@/components/common/BaseTextField.vue'

defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  placeholder: {
    type: String,
    default: '검색...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '검색',
  },
})

defineEmits(['update:modelValue', 'trigger'])
</script>

<template>
  <div class="relative">
    <BaseTextField
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      class="pr-9"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <button
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-500 disabled:cursor-not-allowed disabled:text-slate-300"
      :disabled="disabled"
      :title="title"
      @click="$emit('trigger')"
    >
      <i class="fas fa-search text-xs" aria-hidden="true"></i>
    </button>
  </div>
</template>
