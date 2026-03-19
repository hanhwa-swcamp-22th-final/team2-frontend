<script setup>
import { ref, watch } from 'vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'

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

const emit = defineEmits(['close', 'save'])

// ── 폼 상태 ────────────────────────────────────────────────
const formDate    = ref('')
const formTitle   = ref('')
const formContent = ref('')

// 모달이 열릴 때마다 activity 데이터로 폼 초기화
watch(
  () => props.activity,
  (val) => {
    formDate.value    = val?.date    ?? ''
    formTitle.value   = val?.title   ?? ''
    formContent.value = val?.content ?? ''
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :open="open"
    title="기록 수정"
    width="max-w-xl"
    @close="$emit('close')"
  >
    <div class="space-y-4">

      <!-- 유형 배지 -->
      <div class="flex items-center gap-2">
        <ActivityTypeBadge :value="activity.type" />
      </div>

      <!-- 날짜 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          날짜 <span class="text-red-500">*</span>
        </p>
        <DateField v-model="formDate" />
      </div>

      <!-- 제목 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          제목 <span class="text-red-500">*</span>
        </p>
        <BaseTextField v-model="formTitle" placeholder="활동 제목을 입력하세요" />
      </div>

      <!-- 내용 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">내용</p>
        <BaseTextarea
          v-model="formContent"
          placeholder="상세 내용을 입력하세요"
          :rows="5"
        />
      </div>

    </div>

    <!-- 모달 하단 버튼 -->
    <template #footer>
      <BaseButton variant="secondary" @click="$emit('close')">취소</BaseButton>
      <BaseButton @click="$emit('save', { ...activity, date: formDate, title: formTitle, content: formContent })">저장</BaseButton>
    </template>
  </BaseModal>
</template>
