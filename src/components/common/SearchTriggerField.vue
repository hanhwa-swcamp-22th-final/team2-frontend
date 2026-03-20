<script setup>
import BaseTextField from '@/components/common/BaseTextField.vue'

const props = defineProps({
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

const emit = defineEmits(['update:modelValue', 'trigger'])

function handleTrigger() {
  if (props.disabled) return
  emit('trigger')
}
</script>

<template>
  <div class="relative" @click="handleTrigger">
    <BaseTextField
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      class="cursor-pointer pr-9"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <button
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand-500 disabled:cursor-not-allowed disabled:text-slate-300"
      :disabled="disabled"
      :title="title"
      @click.stop="handleTrigger"
    >
      <i class="fas fa-search text-xs" aria-hidden="true"></i>
    </button>
  </div>
</template>
