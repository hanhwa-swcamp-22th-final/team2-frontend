<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '선택하세요',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const fieldValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function normalizeOption(option) {
  if (typeof option === 'object' && option !== null) {
    return {
      label: option.label ?? option.name ?? String(option.value ?? ''),
      value: option.value ?? '',
    }
  }

  return {
    label: String(option),
    value: option,
  }
}
</script>

<template>
  <div class="relative">
    <select
      :id="id"
      v-model="fieldValue"
      :name="name"
      :disabled="disabled"
      class="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-ink transition duration-200 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="normalizeOption(option).value"
        :value="normalizeOption(option).value"
      >
        {{ normalizeOption(option).label }}
      </option>
    </select>
    <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
          clip-rule="evenodd"
        />
      </svg>
    </span>
  </div>
</template>
