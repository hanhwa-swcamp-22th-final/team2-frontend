<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import InfoField from '@/components/common/InfoField.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  activity: {
    type: Object,
    default: () => ({}),
  },
})

defineEmits(['close'])

const modalTitle = computed(() => {
  const title = props.activity.title || '활동 상세'
  if (props.activity.type === '일정' && props.activity.scheduleFrom && props.activity.scheduleTo) {
    return `${title}(${props.activity.scheduleFrom}~${props.activity.scheduleTo})`
  }
  return title
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    description="활동 기록 상세 내용을 확인하는 공통 모달"
    @close="$emit('close')"
  >
    <div class="space-y-5">
      <!-- 기본 정보 -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">기본 정보</p>
        <div class="rounded-lg border border-slate-100 bg-slate-50 px-4">
          <InfoField label="유형">
            <div class="flex justify-end">
              <ActivityTypeBadge :value="activity.type || '메모/노트'" />
            </div>
          </InfoField>
          <InfoField label="거래처" :value="activity.client" />
          <InfoField label="PO" :value="activity.poId || '-'" />
        </div>
      </div>

      <!-- 작성 정보 -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">작성 정보</p>
        <div class="rounded-lg border border-slate-100 bg-slate-50 px-4">
          <InfoField label="작성자" :value="activity.author" />
          <InfoField label="작성일" :value="activity.date" />
        </div>
      </div>

      <!-- 내용 -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">내용</p>
        <div class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <p class="whitespace-pre-wrap text-sm text-slate-700">
            {{ activity.type === '일정'
              ? (activity.scheduleFrom && activity.scheduleTo
                  ? `${activity.scheduleFrom} ~ ${activity.scheduleTo} ${activity.title || ''}`.trim()
                  : (activity.title || '-'))
              : (activity.content || '-') }}
          </p>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
