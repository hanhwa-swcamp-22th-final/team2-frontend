<script setup>
import { ref, watch } from 'vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import { useToast } from '@/composables/useToast'

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
const { warning } = useToast()

// ── 폼 상태 ────────────────────────────────────────────────
const formDate    = ref('')
const formTitle   = ref('')
const formContent = ref('')
const errors      = ref({})

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

function handleSave() {
  const e = {}
  if (!formDate.value)         e.date  = '날짜 값이 누락되었습니다.'
  if (!formTitle.value.trim()) e.title = '제목 값이 누락되었습니다.'
  errors.value = e
  if (Object.keys(e).length > 0) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  emit('save', { ...props.activity, date: formDate.value, title: formTitle.value, content: formContent.value })
}
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
        <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
      </div>

      <!-- 제목 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          제목 <span class="text-red-500">*</span>
        </p>
        <BaseTextField v-model="formTitle" placeholder="활동 제목을 입력하세요" />
        <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
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
      <BaseButton @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
