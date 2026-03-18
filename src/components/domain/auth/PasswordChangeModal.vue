<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

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
  window.alert('비밀번호가 변경되었습니다.')
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
      <!-- TODO: 공통 FormField 컴포넌트 교체 예정 (#28) -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-slate-700">현재 비밀번호 <span class="text-red-500">*</span></label>
        <BaseTextField v-model="currentPassword" type="password" placeholder="현재 비밀번호를 입력하세요" />
      </div>

      <!-- TODO: 공통 FormField 컴포넌트 교체 예정 (#28) -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-slate-700">새 비밀번호 <span class="text-red-500">*</span></label>
        <BaseTextField v-model="newPassword" type="password" placeholder="새 비밀번호를 입력하세요" />
      </div>

      <!-- TODO: 공통 FormField 컴포넌트 교체 예정 (#28) -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-slate-700">새 비밀번호 확인 <span class="text-red-500">*</span></label>
        <BaseTextField v-model="confirmPassword" type="password" placeholder="새 비밀번호를 다시 입력하세요" />
        <p v-if="isMismatch" class="text-xs text-red-500">새 비밀번호가 일치하지 않습니다.</p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton variant="primary" :disabled="isMismatch" @click="handleSave">저장</BaseButton>
    </template>
  </BaseModal>
</template>
