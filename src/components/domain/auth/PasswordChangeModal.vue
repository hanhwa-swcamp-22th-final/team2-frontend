<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'
import { changePassword, login as verifyPassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])
const { success, error, warning } = useToast()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errors = ref({})

const isMismatch = computed(() => {
  return confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      errors.value = {}
    }
  },
)

watch(confirmPassword, () => {
  if (errors.value.confirmPassword) {
    const { confirmPassword: _, ...rest } = errors.value
    errors.value = rest
  }
})

function validate() {
  const e = {}
  if (!currentPassword.value) {
    e.currentPassword = '현재 비밀번호를 입력해주세요.'
  }
  if (!newPassword.value) {
    e.newPassword = '새 비밀번호를 입력해주세요.'
  } else if (newPassword.value.length < 8) {
    e.newPassword = '비밀번호는 최소 8자 이상이어야 합니다.'
  }
  if (!confirmPassword.value) {
    e.confirmPassword = '새 비밀번호 확인을 입력해주세요.'
  } else if (isMismatch.value) {
    e.confirmPassword = '새 비밀번호가 일치하지 않습니다.'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSave() {
  if (!validate()) return

  const currentUser = authStore.currentUser
  if (!currentUser) {
    error('로그인 정보가 없습니다. 다시 로그인해주세요.')
    return
  }

  // 현재 비밀번호를 서버에서 검증 (login API로 확인)
  saving.value = true
  try {
    const verified = await verifyPassword(currentUser.email, currentPassword.value)
    if (!verified) {
      errors.value = { currentPassword: '현재 비밀번호가 올바르지 않습니다.' }
      warning('현재 비밀번호가 올바르지 않습니다.')
      saving.value = false
      return
    }

    await changePassword(currentUser.id, newPassword.value)
    success('비밀번호가 변경되었습니다.')
    emit('save')
    emit('close')
  } catch (e) {
    error('비밀번호 변경 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="비밀번호 변경"
    width="max-w-md"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="handleSave">
      <FormField label="현재 비밀번호" required :error="errors.currentPassword">
        <BaseTextField v-model="currentPassword" type="password" placeholder="현재 비밀번호를 입력하세요" autocomplete="current-password" />
      </FormField>

      <FormField label="새 비밀번호" required :error="errors.newPassword">
        <BaseTextField v-model="newPassword" type="password" placeholder="새 비밀번호를 입력하세요" autocomplete="new-password" />
      </FormField>

      <FormField
        label="새 비밀번호 확인"
        required
        :error="errors.confirmPassword"
      >
        <BaseTextField v-model="confirmPassword" type="password" placeholder="새 비밀번호를 다시 입력하세요" autocomplete="new-password" />
      </FormField>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="isMismatch || saving" @click="handleSave">
        {{ saving ? '변경 중...' : '저장' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
