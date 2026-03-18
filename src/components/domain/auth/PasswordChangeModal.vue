<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])
const { success } = useToast()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const isMismatch = computed(() => {
  return confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
})

function handleSave() {
  if (isMismatch.value) return
  success('비밀번호가 변경되었습니다.')
  emit('save')
  emit('close')
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
      <FormField label="현재 비밀번호" required>
        <BaseTextField v-model="currentPassword" type="password" placeholder="현재 비밀번호를 입력하세요" />
      </FormField>

      <FormField label="새 비밀번호" required>
        <BaseTextField v-model="newPassword" type="password" placeholder="새 비밀번호를 입력하세요" />
      </FormField>

      <FormField label="새 비밀번호 확인" required :error="isMismatch ? '새 비밀번호가 일치하지 않습니다.' : ''">
        <BaseTextField v-model="confirmPassword" type="password" placeholder="새 비밀번호를 다시 입력하세요" />
      </FormField>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="isMismatch" @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
