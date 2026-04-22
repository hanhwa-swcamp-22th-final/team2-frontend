<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FileUploadField from '@/components/common/FileUploadField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'
import { resetPassword } from '@/api/auth'
import { inferRoleFromOrg } from '@/utils/userRole'
import { isValidEmail } from '@/utils/validators'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  user: { type: Object, default: null },
  positions: { type: Array, default: () => [] },
  departments: { type: Array, default: () => [] },
  teams: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])
const { success, error, warning } = useToast()

const form = ref(getInitialForm())
const errors = ref({})
const showResetConfirm = ref(false)

function derivedRole(deptId) {
  return inferRoleFromOrg({
    departmentId: deptId,
    teamId: form.value.teamId,
    departments: props.departments,
    teams: props.teams,
  })
}

const statusOptions = [
  { label: '재직', value: 'active' },
  { label: '퇴직', value: 'retired' },
]

function getInitialForm() {
  return {
    name: '',
    email: '',
    positionId: '',
    role: '',
    departmentId: '',   // 팀 드롭다운 필터용 (폼 제출 시 사용 안 함)
    teamId: '',
    status: '재직',
    transferReason: '',
    sealImage: null,
  }
}

watch(
  () => props.open,
  (isOpen) => {
    errors.value = {}
    if (isOpen && props.mode === 'edit' && props.user) {
      const resolvedPositionId = props.user.positionId
        ?? props.positions.find((p) => (p.positionName ?? p.name) === props.user.positionName)?.positionId
        ?? props.positions.find((p) => (p.positionName ?? p.name) === props.user.positionName)?.id
        ?? ''
      const resolvedTeamId = props.user.teamId
        ?? props.teams.find((t) => t.teamName === props.user.teamName)?.teamId
        ?? ''
      const team = props.teams.find((t) => String(t.teamId) === String(resolvedTeamId))
      const resolvedDepartmentId = team?.departmentId
        ?? props.user.departmentId
        ?? ''
      form.value = {
        name: props.user.userName ?? props.user.name ?? '',
        email: props.user.userEmail ?? props.user.email ?? '',
        positionId: String(resolvedPositionId),
        role: props.user.userRole ?? props.user.role ?? '',
        departmentId: String(resolvedDepartmentId),
        teamId: String(resolvedTeamId),
        status: props.user.userStatus ?? props.user.status ?? 'active',
        transferReason: '',
        sealImage: null,
      }
      if (!form.value.role) {
        form.value.role = derivedRole(form.value.departmentId)
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = getInitialForm()
    }
  },
)

// 부서 변경 시 팀 초기화 + role 자동 파생
watch(() => form.value.departmentId, (deptId) => {
  const team = props.teams.find((t) => String(t.teamId ?? t.id) === String(form.value.teamId))
  if (team && String(team.departmentId) !== String(deptId)) {
    form.value.teamId = ''
  }
  form.value.role = derivedRole(deptId)
})

watch(
  () => [form.value.teamId, props.departments.length, props.teams.length],
  () => {
    if (props.mode === 'create' || !form.value.role) {
      form.value.role = derivedRole(form.value.departmentId)
    }
  },
)

const teamOptions = computed(() => {
  const filtered = form.value.departmentId
    ? props.teams.filter((t) => String(t.departmentId) === String(form.value.departmentId))
    : props.teams
  return filtered.map((t) => ({ label: t.teamName, value: String(t.teamId) }))
})

function validate() {
  const e = {}

  if (!form.value.name.trim()) e.name = '이름을 입력해주세요.'

  if (!form.value.email.trim()) {
    e.email = '이메일을 입력해주세요.'
  } else if (!isValidEmail(form.value.email)) {
    e.email = '올바른 이메일 형식을 입력해주세요.'
  } else {
    const email = form.value.email.trim().toLowerCase()
    const duplicate = props.allUsers.find(
      (u) =>
        String(u.userEmail ?? u.email ?? '').trim().toLowerCase() === email &&
        (props.mode === 'create' || (u.userId ?? u.id) !== (props.user?.userId ?? props.user?.id)),
    )
    if (duplicate) e.email = '이미 사용 중인 이메일 주소입니다.'
  }

  if (!form.value.positionId) e.positionId = '직급을 선택해주세요.'
  if (!form.value.departmentId) e.departmentId = '부서를 선택해주세요.'
  if (!form.value.teamId) e.teamId = '팀을 선택해주세요.'
  if (form.value.departmentId && form.value.teamId && !derivedRole(form.value.departmentId)) {
    e.departmentId = '부서 권한 매핑을 확인해주세요.'
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

function confirmResetPassword() { showResetConfirm.value = true }

async function handleResetPassword() {
  if (!props.user?.userId && !props.user?.id) return
  try {
    await resetPassword(props.user.userId ?? props.user.id)
    success('비밀번호가 password123로 초기화되었습니다.')
  } catch (e) {
    error('비밀번호 초기화 중 오류가 발생했습니다.')
  } finally {
    showResetConfirm.value = false
  }
}

const currentTeamName = computed(() => {
  if (props.user?.teamName) return props.user.teamName
  const team = props.teams.find((t) => String(t.teamId) === String(props.user?.teamId))
  return team?.teamName ?? '-'
})
</script>

<template>
  <BaseModal
    :open="open"
    :title="mode === 'create' ? '사용자 등록' : `사용자 정보 수정 – ${user?.userName ?? user?.name ?? ''}`"
    width="max-w-2xl"
    @close="emit('close')"
  >
    <form class="space-y-6" @submit.prevent="handleSave">
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
            :options="positions.map((p) => ({ label: p.positionName ?? p.name, value: String(p.positionId ?? p.id) }))"
            placeholder="직급을 선택하세요"
          />
        </FormField>

        <FormField label="부서" required :error="errors.departmentId">
          <BaseSelect
            v-model="form.departmentId"
            :options="departments.map((d) => ({ label: d.departmentName ?? d.name, value: String(d.departmentId ?? d.id) }))"
            placeholder="부서를 선택하세요"
          />
        </FormField>

        <FormField label="팀" required :error="errors.teamId">
          <BaseSelect
            v-model="form.teamId"
            :options="teamOptions"
            :placeholder="form.departmentId ? '팀을 선택하세요' : '먼저 부서를 선택하세요'"
            :disabled="!form.departmentId"
          />
        </FormField>

        <template v-if="mode === 'create'">
          <FormField label="초기 비밀번호">
            <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <i class="fas fa-lock text-xs text-slate-400" />
              <span>password123</span>
              <span class="text-xs text-slate-400">(가입 후 변경 권장)</span>
            </div>
          </FormField>
        </template>
      </div>

      <template v-if="mode === 'edit'">
        <!-- 상태 필드는 UI 에서 숨김 — 신규 = active, "삭제" 버튼이 퇴직 처리 담당.
             form.status 는 submit 시 기존 값 그대로 유지됨 (undefined 방지). -->

        <div class="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <p class="text-xs text-slate-500">
            현재 팀: <span class="font-medium text-ink">{{ currentTeamName }}</span>
          </p>
          <FormField label="이동 사유 (팀 변경 시)">
            <BaseTextField v-model="form.transferReason" placeholder="팀 이동 사유를 입력하세요" />
          </FormField>
        </div>
      </template>

      <FileUploadField
        v-model="form.sealImage"
        label="서명 이미지"
        accept="image/*"
        helper-text="서명 이미지를 업로드하세요. (PNG, JPG 권장)"
      />

      <div v-if="mode === 'edit'" class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div>
          <p class="text-sm font-medium text-ink">비밀번호 초기화</p>
          <p class="text-xs text-slate-500">비밀번호를 초기값(password123)으로 재설정합니다.</p>
        </div>
        <BaseButton variant="secondary" size="sm" type="button" @click="confirmResetPassword">
          초기화
        </BaseButton>
      </div>
    </form>

    <ConfirmModal
      :open="showResetConfirm"
      title="비밀번호 초기화"
      :message="`${user?.userName ?? user?.name} 사용자의 비밀번호를 초기값(password123)으로 초기화하시겠습니까?`"
      confirm-label="초기화"
      confirm-variant="danger"
      @confirm="handleResetPassword"
      @cancel="showResetConfirm = false"
    />

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>
