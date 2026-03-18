<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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
    default: '검색 또는 선택',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: '검색 결과가 없습니다.',
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const wrapperRef = ref(null)
const inputValue = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(-1)

function normalizeOption(option) {
  if (typeof option === 'object' && option !== null) {
    return {
      label: option.label ?? option.name ?? String(option.value ?? ''),
      value: option.value ?? '',
      sublabel: option.sublabel ?? option.caption ?? '',
    }
  }

  return {
    label: String(option),
    value: option,
    sublabel: '',
  }
}

const normalizedOptions = computed(() => props.options.map(normalizeOption))

const filteredOptions = computed(() => {
  const query = inputValue.value.trim().toLowerCase()

  if (!query) {
    return normalizedOptions.value
  }

  return normalizedOptions.value.filter((option) => (
    option.label.toLowerCase().includes(query) ||
    option.sublabel.toLowerCase().includes(query)
  ))
})

watch(
  () => props.modelValue,
  (value) => {
    const matched = normalizedOptions.value.find((option) => String(option.value) === String(value))
    inputValue.value = matched?.label ?? ''
  },
  { immediate: true },
)

function openList() {
  if (props.disabled) {
    return
  }

  isOpen.value = true
}

function closeList() {
  isOpen.value = false
  highlightedIndex.value = -1
}

function selectOption(option) {
  inputValue.value = option.label
  emit('update:modelValue', option.value)
  emit('select', option)
  closeList()
}

function onKeydown(event) {
  if (!isOpen.value && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
    openList()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter' && highlightedIndex.value >= 0) {
    event.preventDefault()
    selectOption(filteredOptions.value[highlightedIndex.value])
    return
  }

  if (event.key === 'Escape') {
    closeList()
  }
}

function handleClickOutside(event) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    closeList()
  }
}

document.addEventListener('click', handleClickOutside)

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <div class="relative">
      <input
        v-model="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-ink transition duration-200 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        @focus="openList"
        @input="openList"
        @keydown="onKeydown"
      />
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

    <div
      v-if="isOpen"
      class="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
    >
      <button
        v-for="(option, index) in filteredOptions"
        :key="option.value"
        type="button"
        class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition"
        :class="index === highlightedIndex ? 'bg-brand/10 text-brand' : 'hover:bg-slate-50 text-slate-700'"
        @click="selectOption(option)"
      >
        <span class="font-medium">{{ option.label }}</span>
        <span v-if="option.sublabel" class="ml-3 text-xs text-slate-400">{{ option.sublabel }}</span>
      </button>
      <div v-if="filteredOptions.length === 0" class="px-3 py-6 text-center text-sm text-slate-400">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>
