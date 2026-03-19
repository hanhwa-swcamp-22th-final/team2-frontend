<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import FormField from '@/components/common/FormField.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const isDev = import.meta.env.DEV
const authStore = useAuthStore()
const { error } = useToast()

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const loading = ref(false)

function validate() {
  emailError.value = ''
  passwordError.value = ''
  let valid = true

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!email.value.trim()) {
    emailError.value = '이메일을 입력해주세요.'
    valid = false
  } else if (!EMAIL_REGEX.test(email.value.trim())) {
    emailError.value = '올바른 이메일 형식을 입력해주세요.'
    valid = false
  }
  if (!password.value) {
    passwordError.value = '비밀번호를 입력해주세요.'
    valid = false
  }
  return valid
}

async function handleLogin() {
  if (!validate()) return

  loading.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
    const redirect = route.query.redirect
    const safePath = redirect && typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
    router.push(safePath)
  } catch (e) {
    if (e.message === 'INVALID_CREDENTIALS') {
      error('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      error('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
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

    <!-- 로그인 카드 -->
    <div class="w-full rounded-[28px] bg-white p-8 shadow-panel">
      <form class="space-y-5" @submit.prevent="handleLogin">
        <!-- 이메일 -->
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

        <!-- 비밀번호 -->
        <FormField label="비밀번호" :error="passwordError">
          <div class="relative">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clip-rule="evenodd" />
              </svg>
            </span>
            <BaseTextField
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              class="pl-9"
              autocomplete="current-password"
            />
          </div>
        </FormField>

        <!-- 로그인 버튼 -->
        <BaseButton variant="primary" type="submit" block size="lg" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </BaseButton>
      </form>

      <!-- 비밀번호 찾기 링크 -->
      <div class="mt-4 text-center">
        <RouterLink to="/forgot-password" class="text-sm text-slate-500 transition hover:text-brand">
          비밀번호 찾기
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
