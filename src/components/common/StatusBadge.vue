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
  active: 'border-teal-200 bg-teal-50 text-teal-700',
  활성: 'border-teal-200 bg-teal-50 text-teal-700',
  재직: 'border-teal-200 bg-teal-50 text-teal-700',
  leave: 'border-amber-200 bg-amber-50 text-amber-700',
  휴직: 'border-amber-200 bg-amber-50 text-amber-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-500',
  비활성: 'border-slate-200 bg-slate-100 text-slate-500',
  resigned: 'border-slate-200 bg-slate-100 text-slate-400',
  퇴직: 'border-slate-200 bg-slate-100 text-slate-400',

  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-700',
  초안: 'border-slate-200 bg-slate-100 text-slate-700',
  sent: 'border-brand-200 bg-brand-100 text-brand-700',
  SENT: 'border-brand-200 bg-brand-100 text-brand-700',
  발송: 'border-brand-200 bg-brand-100 text-brand-700',
  confirmed: 'border-brand-200 bg-brand-100 text-brand-700',
  CONFIRMED: 'border-brand-200 bg-brand-100 text-brand-700',
  확정: 'border-brand-200 bg-brand-100 text-brand-700',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-500',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-500',
  취소: 'border-slate-200 bg-slate-100 text-slate-500',

  received: 'border-sky-200 bg-sky-50 text-sky-700',
  RECEIVED: 'border-sky-200 bg-sky-50 text-sky-700',
  접수: 'border-sky-200 bg-sky-50 text-sky-700',
  in_production: 'border-amber-200 bg-amber-50 text-amber-700',
  IN_PRODUCTION: 'border-amber-200 bg-amber-50 text-amber-700',
  생산중: 'border-amber-200 bg-amber-50 text-amber-700',
  shipped: 'border-teal-200 bg-teal-50 text-teal-700',
  SHIPPED: 'border-teal-200 bg-teal-50 text-teal-700',
  출하완료: 'border-teal-200 bg-teal-50 text-teal-700',
  preparing: 'border-amber-200 bg-amber-50 text-amber-700',
  PREPARING: 'border-amber-200 bg-amber-50 text-amber-700',
  준비중: 'border-amber-200 bg-amber-50 text-amber-700',
  ready: 'border-amber-200 bg-amber-50 text-amber-700',
  READY: 'border-amber-200 bg-amber-50 text-amber-700',
  준비완료: 'border-amber-200 bg-amber-50 text-amber-700',
  pending: 'border-slate-200 bg-slate-100 text-slate-500',
  PENDING: 'border-slate-200 bg-slate-100 text-slate-500',
  대기: 'border-slate-200 bg-slate-100 text-slate-500',
  approval_pending: 'border-amber-200 bg-amber-50 text-amber-700',
  결재대기: 'border-amber-200 bg-amber-50 text-amber-700',
  registration_requested: 'border-sky-200 bg-sky-50 text-sky-700',
  등록요청: 'border-sky-200 bg-sky-50 text-sky-700',
  update_requested: 'border-brand-200 bg-brand-100 text-brand-700',
  수정요청: 'border-brand-200 bg-brand-100 text-brand-700',
  deletion_requested: 'border-rose-200 bg-rose-50 text-rose-700',
  삭제요청: 'border-rose-200 bg-rose-50 text-rose-700',
  in_progress: 'border-sky-200 bg-sky-50 text-sky-700',
  IN_PROGRESS: 'border-sky-200 bg-sky-50 text-sky-700',
  진행중: 'border-sky-200 bg-sky-50 text-sky-700',
  completed: 'border-teal-200 bg-teal-50 text-teal-700',
  COMPLETED: 'border-teal-200 bg-teal-50 text-teal-700',
  완료: 'border-teal-200 bg-teal-50 text-teal-700',
  approved: 'border-green-200 bg-green-50 text-green-700',
  APPROVED: 'border-green-200 bg-green-50 text-green-700',
  승인: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  반려: 'border-rose-200 bg-rose-50 text-rose-700',

  paid: 'border-green-200 bg-green-50 text-green-700',
  PAID: 'border-green-200 bg-green-50 text-green-700',
  완납: 'border-green-200 bg-green-50 text-green-700',
  unpaid: 'border-rose-200 bg-rose-50 text-rose-700',
  UNPAID: 'border-rose-200 bg-rose-50 text-rose-700',
  미수금: 'border-rose-200 bg-rose-50 text-rose-700',

  normal: 'border-teal-200 bg-teal-50 text-teal-700',
  NORMAL: 'border-teal-200 bg-teal-50 text-teal-700',
  정상: 'border-teal-200 bg-teal-50 text-teal-700',
  delay_risk: 'border-amber-200 bg-amber-50 text-amber-700',
  DELAY_RISK: 'border-amber-200 bg-amber-50 text-amber-700',
  지연위험: 'border-amber-200 bg-amber-50 text-amber-700',
  delayed: 'border-rose-200 bg-rose-50 text-rose-700',
  DELAYED: 'border-rose-200 bg-rose-50 text-rose-700',
  지연: 'border-rose-200 bg-rose-50 text-rose-700',

  sent_complete: 'border-brand-200 bg-brand-100 text-brand-700',
  발송완료: 'border-brand-200 bg-brand-100 text-brand-700',
  temp_saved: 'border-slate-200 bg-slate-100 text-slate-700',
  임시저장: 'border-slate-200 bg-slate-100 text-slate-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  실패: 'border-rose-200 bg-rose-50 text-rose-700',
}

const badgeClasses = computed(() => {
  const rawValue = String(props.value).trim()
  const key = props.variant || rawValue
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
