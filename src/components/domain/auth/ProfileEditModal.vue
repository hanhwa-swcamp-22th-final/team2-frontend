<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import { useToast } from '@/composables/useToast'
import { api } from '@/lib/api'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'save'])
const { success, error } = useToast()

const form = ref({
  name: '',
  email: '',
})
const errors = ref({})
const isSaving = ref(false)

watch(() => props.open, (val) => {
  if (val && props.user) {
    form.value = {
      name: props.user.name || '',
      email: props.user.email || '',
    }
    errors.value = {}
  }
})

function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = '이름을 입력해주세요.'
  if (!form.value.email.trim()) e.email = '이메일을 입력해주세요.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) e.email = '올바른 이메일 형식이 아닙니다.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  isSaving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
    }
    await api.patch(`/users/${props.user.id}`, payload)
    success('내 정보가 수정되었습니다.')
    emit('save', payload)
  } catch {
    error('정보 수정에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="내 정보 수정"
    width="max-w-md"
    @close="emit('close')"
  >
    <div v-if="user" class="space-y-4">
      <!-- 사번 (읽기 전용) -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">사번</p>
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          {{ user.employeeNo || '-' }}
        </div>
      </div>

      <!-- 이름 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          이름 <span class="text-red-500">*</span>
        </p>
        <BaseTextField
          v-model="form.name"
          placeholder="이름을 입력하세요"
          :class="errors.name ? 'border-red-400' : ''"
        />
        <p v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</p>
      </div>

      <!-- 이메일 -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">
          이메일 <span class="text-red-500">*</span>
        </p>
        <BaseTextField
          v-model="form.email"
          placeholder="이메일을 입력하세요"
          :class="errors.email ? 'border-red-400' : ''"
        />
        <p v-if="errors.email" class="text-xs text-red-500">{{ errors.email }}</p>
      </div>

      <!-- 역할 (읽기 전용) -->
      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-700">역할</p>
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          {{ { admin: '관리자', sales: '영업', production: '생산', shipping: '출하' }[user.role] || '-' }}
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">취소</BaseButton>
      <BaseButton :disabled="isSaving" @click="save">
        {{ isSaving ? '저장 중...' : '저장' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
