<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'

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
const formClient  = ref('')
const formType    = ref('')
const formDate    = ref('')
const formTitle   = ref('')
const formContent = ref('')

// 모달이 열릴 때마다 activity 데이터로 폼 초기화
watch(
  () => props.activity,
  (val) => {
    formClient.value  = val?.client  ?? ''
    formType.value    = val?.type    ?? ''
    formDate.value    = val?.date    ?? ''
    formTitle.value   = val?.title   ?? ''
    formContent.value = val?.content ?? ''
  },
  { immediate: true },
)

// ── options ────────────────────────────────────────────────
const clientOptions = [
  { label: 'Acme Corp',    value: 'Acme Corp'    },
  { label: 'Globex Corp',  value: 'Globex Corp'  },
  { label: 'Initech',      value: 'Initech'      },
  { label: 'Umbrella Corp', value: 'Umbrella Corp' },
]

const typeOptions = [
  { label: '미팅/협의', value: '미팅/협의' },
  { label: '이슈',      value: '이슈'      },
  { label: '메모/노트', value: '메모/노트' },
  { label: '코멘트',    value: '코멘트'    },
  { label: '일정',      value: '일정'      },
]
</script>

<template>
  <BaseModal
    :open="open"
    :title="`기록 수정 - ${activity.id ?? ''}`"
    width="max-w-xl"
    @close="$emit('close')"
  >
    <div class="space-y-4">

      <!-- 거래처 + 유형 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">
            거래처 <span class="text-red-500">*</span>
          </p>
          <SearchableCombobox
            v-model="formClient"
            :options="clientOptions"
            placeholder="거래처 검색/선택..."
          />
        </div>
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">
            유형 <span class="text-red-500">*</span>
          </p>
          <BaseSelect
            v-model="formType"
            :options="typeOptions"
          />
        </div>
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
      <BaseButton>저장</BaseButton>
    </template>
  </BaseModal>
</template>
