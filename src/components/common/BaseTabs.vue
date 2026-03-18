<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  tabs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function selectTab(key) {
  activeTab.value = key
}
</script>

<template>
  <div class="border-b border-slate-200">
    <div class="flex items-center gap-1 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="border-b-2 px-4 py-3 text-sm font-semibold transition"
        :class="activeTab === tab.key
          ? 'border-brand text-brand'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>
