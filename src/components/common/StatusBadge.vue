<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: '',
  },
})

const statusMap = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  활성: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  confirmed: 'border-teal-200 bg-teal-50 text-teal-700',
  확정: 'border-teal-200 bg-teal-50 text-teal-700',
  sent: 'border-sky-200 bg-sky-50 text-sky-700',
  발송: 'border-sky-200 bg-sky-50 text-sky-700',
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  초안: 'border-slate-200 bg-slate-100 text-slate-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-500',
  비활성: 'border-slate-200 bg-slate-100 text-slate-500',
  ready: 'border-amber-200 bg-amber-50 text-amber-700',
  준비중: 'border-amber-200 bg-amber-50 text-amber-700',
  준비완료: 'border-amber-200 bg-amber-50 text-amber-700',
  in_progress: 'border-violet-200 bg-violet-50 text-violet-700',
  생산중: 'border-violet-200 bg-violet-50 text-violet-700',
  partial: 'border-orange-200 bg-orange-50 text-orange-700',
  부분수금: 'border-orange-200 bg-orange-50 text-orange-700',
  unpaid: 'border-rose-200 bg-rose-50 text-rose-700',
  미수금: 'border-rose-200 bg-rose-50 text-rose-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  완납: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  completed: 'border-brand/20 bg-brand/10 text-brand',
  완료: 'border-brand/20 bg-brand/10 text-brand',
  출하완료: 'border-brand/20 bg-brand/10 text-brand',
}

const badgeClasses = computed(() => {
  const key = props.variant || String(props.value).trim().toLowerCase()
  return statusMap[key] || 'border-slate-200 bg-slate-100 text-slate-700'
})
</script>

<template>
  <span
    class="inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.02em]"
    :class="badgeClasses"
  >
    <slot>{{ value }}</slot>
  </span>
</template>
