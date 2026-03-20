<script setup>
import BaseModal from '@/components/common/BaseModal.vue'
import InfoField from '@/components/common/InfoField.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'

defineProps({
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
</script>

<template>
  <BaseModal
    :open="open"
    :title="activity.title || '활동 상세'"
    description="활동 기록 상세 내용을 확인하는 공통 모달"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <InfoField label="유형">
        <div class="flex justify-end">
          <ActivityTypeBadge :value="activity.type || '메모/노트'" />
        </div>
      </InfoField>
      <InfoField label="거래처" :value="activity.client" />
      <InfoField label="작성일" :value="activity.date" />
      <InfoField label="작성자" :value="activity.author" />
      <InfoField label="내용" :value="activity.content || '-'" />
    </div>
  </BaseModal>
</template>
