<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()
const isDev = import.meta.env.DEV

const email = ref('')
const emailError = ref('')
const loading = ref(false)
const submitted = ref(false)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  emailError.value = ''
  if (!email.value.trim()) {
    emailError.value = '이메일을 입력해주세요.'
    return false
  }
  if (!EMAIL_REGEX.test(email.value.trim())) {
    emailError.value = '올바른 이메일 형식을 입력해주세요.'
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  try {
    // TODO: 백엔드 연동 시 await sendPasswordResetEmail(email.value.trim())
    submitted.value = true
    success('등록된 이메일이라면 재설정 링크가 발송됩니다.')
  } catch {
    error('이메일 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex w-full max-w-md flex-col items-center gap-6 px-4">
    <!-- 로고 + 타이틀 -->
    <div class="flex flex-col items-center gap-3">
      <img src="/salesboost.svg" alt="SalesBoost" class="h-14 w-14" />
      <div class="text-center">
        <h1 class="text-2xl font-bold text-ink">SalesBoost</h1>
        <p class="mt-1 text-sm text-slate-500">해외 B2B 영업관리 시스템</p>
      </div>
    </div>

    <!-- 비밀번호 찾기 카드 -->
    <div class="w-full rounded-[28px] bg-white p-8 shadow-panel">
      <div class="mb-6 flex flex-col items-center gap-3 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <svg class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.75Z" clip-rule="evenodd" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-ink">비밀번호 찾기</h2>
        <p class="text-sm text-slate-500">
          가입 시 등록한 이메일 주소를 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      <!-- 발송 완료 메시지 -->
      <div v-if="submitted" class="rounded-xl bg-green-50 px-4 py-4 text-center text-sm text-green-700">
        <p class="font-semibold">이메일이 발송되었습니다.</p>
        <p class="mt-1 text-xs text-green-600">
          <strong>{{ email }}</strong> 으로 비밀번호 재설정 링크를 발송했습니다.<br />
          이메일을 확인해 주세요.
        </p>
      </div>

      <form v-else class="space-y-5" @submit.prevent="handleSubmit">
        <FormField label="이메일" :error="emailError">
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
            </span>
            <BaseTextField
              v-model="email"
              type="email"
              placeholder="name@company.com"
              class="pl-9"
              autocomplete="email"
            />
          </div>
        </FormField>

        <BaseButton variant="primary" type="submit" block size="lg" :disabled="loading">
          {{ loading ? '확인 중...' : '재설정 링크 발송' }}
        </BaseButton>
      </form>

      <div class="mt-4 text-center">
        <RouterLink to="/login" class="text-sm text-slate-500 transition hover:text-brand">
          ← 로그인으로 돌아가기
        </RouterLink>
      </div>
    </div>

    <!-- Demo 계정 안내 -->
    <div v-if="isDev" class="w-full rounded-2xl bg-white p-4 shadow-panel">
      <p class="mb-2 text-xs font-semibold text-slate-600">Demo 계정 안내</p>
      <div class="space-y-1 text-xs text-slate-500">
        <p>관리자: admin@salesboost.com / 1234</p>
        <p>영업: kim@salesboost.com / 1234</p>
        <p>생산: lee@salesboost.com / 1234</p>
        <p>출하: park@salesboost.com / 1234</p>
      </div>
    </div>
  </div>
</template>
