<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'
import { changePassword } from '@/api/auth'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  user: { type: Object, default: null },
  positions: { type: Array, default: () => [] },
  departments: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])
const { success, error, warning } = useToast()

const form = ref(getInitialForm())
const errors = ref({})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

watch(
  () => props.open,
  (isOpen) => {
    errors.value = {}
    if (isOpen && props.mode === 'edit' && props.user) {
      form.value = {
        name: props.user.name ?? '',
        email: props.user.email ?? '',
        positionId: String(props.user.positionId ?? ''),
        role: props.user.role ?? '',
        departmentId: String(props.user.departmentId ?? ''),
        status: props.user.status ?? '재직',
        transferDepartmentId: '',
        transferReason: '',
        sealImage: null,
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
    }
  },
)

function validate() {
  const e = {}

  if (!form.value.name.trim()) {
    e.name = '이름을 입력해주세요.'
  }

  if (!form.value.email.trim()) {
    e.email = '이메일을 입력해주세요.'
  } else if (!EMAIL_REGEX.test(form.value.email.trim())) {
    e.email = '올바른 이메일 형식을 입력해주세요.'
  } else {
    // 중복 이메일 체크
    const duplicate = props.allUsers.find(
      (u) =>
        u.email === form.value.email.trim() &&
        (props.mode === 'create' || u.id !== props.user?.id),
    )
    if (duplicate) {
      e.email = '이미 사용 중인 이메일 주소입니다.'
    }
  }

  if (!form.value.positionId) {
    e.positionId = '직급을 선택해주세요.'
  }

  if (!form.value.role) {
    e.role = '역할을 선택해주세요.'
  }

  if (!form.value.departmentId && props.mode === 'create') {
    e.departmentId = '팀을 선택해주세요.'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSave() {
  if (!validate()) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  emit('save', { ...form.value })
}

async function handleResetPassword() {
  if (!props.user?.id) return
  try {
    await changePassword(props.user.id, '1234')
    success('비밀번호가 1234로 초기화되었습니다.')
  } catch (e) {
    error('비밀번호 초기화 중 오류가 발생했습니다.')
  }
}

const currentDepartmentName = computed(() => {
  const dept = props.departments.find(d => String(d.id) === String(props.user?.departmentId))
  return dept?.name ?? '-'
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '사용자 등록' : `사용자 정보 수정 – ${user?.name ?? ''}`"
    width="max-w-2xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
      <!-- 기본 정보: 2열 그리드 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="이름" required :error="errors.name">
          <BaseTextField v-model="form.name" placeholder="이름을 입력하세요" />
        </FormField>

        <FormField label="이메일" required :error="errors.email">
          <BaseTextField v-model="form.email" type="email" placeholder="이메일을 입력하세요" :readonly="mode === 'edit'" />
        </FormField>

        <FormField label="직급" required :error="errors.positionId">
          <BaseSelect
            v-model="form.positionId"
            :options="positions.map((p) => ({ label: p.name, value: String(p.id) }))"
            placeholder="직급을 선택하세요"
          />
        </FormField>

        <FormField label="역할" required :error="errors.role">
          <BaseSelect v-model="form.role" :options="roleOptions" placeholder="역할을 선택하세요" />
        </FormField>

        <template v-if="mode === 'create'">
          <FormField label="팀" required :error="errors.departmentId">
            <BaseSelect
              v-model="form.departmentId"
              :options="departments.map((d) => ({ label: d.name, value: String(d.id) }))"
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
            현재 팀: <span class="font-medium text-ink">{{ currentDepartmentName }}</span> → 이동할 팀
          </p>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="이동할 팀">
              <BaseSelect
                v-model="form.transferDepartmentId"
                :options="[{ label: '변경안함', value: '' }, ...departments.map((d) => ({ label: d.name, value: String(d.id) }))]"
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
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>
