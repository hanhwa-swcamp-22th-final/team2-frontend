<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '검색어를 입력하세요',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'search'])

const fieldValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function handleSearch() {
  emit('search', fieldValue.value)
}

function clearInput() {
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 shadow-sm transition duration-200 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
    <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.473 9.766l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clip-rule="evenodd"
      />
    </svg>
    <input
      v-model="fieldValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="h-11 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400"
      @keydown.enter.prevent="handleSearch"
    />
    <button
      v-if="clearable && fieldValue"
      type="button"
      class="text-xs font-medium text-slate-400 transition hover:text-slate-600"
      @click="clearInput"
    >
      초기화
    </button>
    <button
      type="button"
      class="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      :disabled="disabled"
      @click="handleSearch"
    >
      검색
    </button>
  </div>
</template>
