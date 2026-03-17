<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  rows: {
    type: Number,
    default: 5,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  resize: {
    type: String,
    default: 'vertical',
  },
})

const emit = defineEmits(['update:modelValue'])

const fieldValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const resizeClassMap = {
  none: 'resize-none',
  vertical: 'resize-y',
  both: 'resize',
}
</script>

<template>
  <textarea
    v-model="fieldValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :class="[
      'w-full rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm text-ink shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
      resizeClassMap[resize] || resizeClassMap.vertical,
    ]"
  />
</template>
