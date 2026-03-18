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
  active: 'border-brand-200 bg-slate-50 text-brand-600',
  활성: 'border-brand-200 bg-slate-50 text-brand-600',
  confirmed: 'border-brand-200 bg-slate-50 text-brand-600',
  확정: 'border-brand-200 bg-slate-50 text-brand-600',
  sent: 'border-brand-200 bg-slate-50 text-brand-600',
  발송: 'border-brand-200 bg-slate-50 text-brand-600',
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
  completed: 'border-brand-200 bg-slate-50 text-brand-600',
  완료: 'border-brand-200 bg-slate-50 text-brand-600',
  출하완료: 'border-brand-200 bg-slate-50 text-brand-600',
}

const badgeClasses = computed(() => {
  const key = props.variant || String(props.value).trim().toLowerCase()
  return statusMap[key] || 'border-slate-200 bg-slate-100 text-slate-700'
})
</script>

<template>
  <span
    class="inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.02em]"
    :class="badgeClasses"
  >
    <slot>{{ value }}</slot>
  </span>
</template>
