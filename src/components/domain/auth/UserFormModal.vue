<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  user: { type: Object, default: null },
  positions: { type: Array, default: () => [] },
  departments: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save', 'reset-password'])
const { success } = useToast()

const form = ref(getInitialForm())

const roleOptions = [
  { label: '영업', value: 'sales' },
  { label: '생산', value: 'production' },
  { label: '출하', value: 'shipping' },
  { label: '관리자', value: 'admin' },
]

const statusOptions = [
  { label: '재직', value: '재직' },
  { label: '퇴직', value: '퇴직' },
]

function getInitialForm() {
  return {
    employeeNo: '',
    name: '',
    email: '',
    positionId: '',
    role: '',
    departmentId: '',
    status: '재직',
    transferDepartmentId: '',
    transferReason: '',
    sealImage: null,
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'edit' && props.user) {
    form.value = {
      employeeNo: props.user.employeeNo ?? '',
      name: props.user.name ?? '',
      email: props.user.email ?? '',
      positionId: props.user.positionId ?? '',
      role: props.user.role ?? '',
      departmentId: props.user.departmentId ?? '',
      status: props.user.status ?? '재직',
      transferDepartmentId: '',
      transferReason: '',
      sealImage: null,
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = getInitialForm()
  }
})

function handleSave() {
  success(props.mode === 'create' ? '사용자가 등록되었습니다.' : '사용자 정보가 수정되었습니다.')
  emit('save', { ...form.value })
  emit('close')
}

function handleResetPassword() {
  success('비밀번호가 1234로 초기화되었습니다.')
  emit('reset-password', props.user?.id)
}

function getCurrentDepartmentName() {
  const dept = props.departments.find((d) => d.id === props.user?.departmentId)
  return dept?.name ?? '-'
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '사용자 등록' : `사용자 정보 수정 – ${user?.name ?? ''}`"
    width="max-w-3xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
      <!-- 기본 정보: 2열 그리드 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="사번" required>
          <BaseTextField v-model="form.employeeNo" placeholder="사번을 입력하세요" :readonly="mode === 'edit'" />
        </FormField>

        <FormField label="이름" required>
          <BaseTextField v-model="form.name" placeholder="이름을 입력하세요" />
        </FormField>

        <FormField label="이메일" required>
          <BaseTextField v-model="form.email" type="email" placeholder="이메일을 입력하세요" />
        </FormField>

        <FormField label="직급" required>
          <BaseSelect
            v-model="form.positionId"
            :options="positions.map((p) => ({ label: p.name, value: p.id }))"
            placeholder="직급을 선택하세요"
          />
        </FormField>

        <FormField label="부서" required>
          <BaseSelect v-model="form.role" :options="roleOptions" placeholder="부서를 선택하세요" />
        </FormField>

        <template v-if="mode === 'create'">
          <FormField label="팀" required>
            <BaseSelect
              v-model="form.departmentId"
              :options="departments.map((d) => ({ label: d.name, value: d.id }))"
              placeholder="팀을 선택하세요"
            />
          </FormField>

          <FormField label="초기 비밀번호">
            <BaseTextField model-value="1234" readonly />
          </FormField>
        </template>
      </div>

      <!-- 수정 모드 전용 -->
      <template v-if="mode === 'edit'">
        <!-- 상태 -->
        <FormField label="상태">
          <BaseSelect v-model="form.status" :options="statusOptions" />
        </FormField>

        <!-- 팀 이동 -->
        <div class="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.28a.75.75 0 0 0-.75.75v3.952a.75.75 0 0 0 1.5 0v-2.146l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.384Zm.39-3.44a.75.75 0 0 0 .326-1.275 7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.449.384 5.5 5.5 0 0 1 9.201-2.466l.312.311H13.28a.75.75 0 0 0 0 1.5h3.952a.75.75 0 0 0 .75-.75V5.384a.75.75 0 0 0-1.5 0v2.146l-.312-.311a.747.747 0 0 0-.468-.235Z" clip-rule="evenodd" />
            </svg>
            <h3 class="text-sm font-bold text-ink">팀 이동</h3>
          </div>
          <p class="text-xs text-slate-500">
            현재 팀: <span class="font-medium text-ink">{{ getCurrentDepartmentName() }}</span> → 이동할 팀
          </p>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="이동할 팀">
              <BaseSelect
                v-model="form.transferDepartmentId"
                :options="[{ label: '변경안함', value: '' }, ...departments.map((d) => ({ label: d.name, value: d.id }))]"
              />
            </FormField>
            <FormField label="이동 사유">
              <BaseTextField v-model="form.transferReason" placeholder="이동 사유를 입력하세요" />
            </FormField>
          </div>
        </div>
      </template>

      <!-- 서명 이미지 -->
      <FileUploadField
        v-model="form.sealImage"
        label="서명 이미지"
        accept="image/*"
        helper-text="서명 이미지를 업로드하세요. (PNG, JPG 권장)"
      />

      <!-- 비밀번호 초기화 (수정 모드) -->
      <div v-if="mode === 'edit'" class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div>
          <p class="text-sm font-medium text-ink">비밀번호 초기화</p>
          <p class="text-xs text-slate-500">비밀번호를 초기값(1234)으로 재설정합니다.</p>
        </div>
        <BaseButton variant="secondary" size="sm" type="button" @click="handleResetPassword">
          초기화
        </BaseButton>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
