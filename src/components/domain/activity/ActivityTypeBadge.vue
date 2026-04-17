<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
})

const labelMap = {
  meeting: '미팅/협의',
  issue: '이슈',
  memo: '메모/노트',
  schedule: '일정',
}

const variantMap = {
  '미팅/협의': 'bg-sky-50 text-sky-700 border-sky-200',
  '메모/노트': 'bg-slate-100 text-slate-700 border-slate-200',
  '이슈': 'bg-rose-50 text-rose-700 border-rose-200',
  '일정': 'bg-amber-50 text-amber-700 border-amber-200',
}

const displayLabel = computed(() => labelMap[props.value] ?? props.value)
const badgeClasses = computed(() => variantMap[displayLabel.value] || 'bg-slate-100 text-slate-700 border-slate-200')
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
    :class="badgeClasses"
  >
    {{ displayLabel }}
  </span>
</template>
