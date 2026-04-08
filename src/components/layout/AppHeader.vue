<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ProfileEditModal from '@/components/domain/auth/ProfileEditModal.vue'
import PasswordChangeModal from '@/components/domain/auth/PasswordChangeModal.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { getRoleHomePath } from '@/utils/roleAccess'

const uiStore = useUiStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const roleDashboardTitles = { admin: '관리자 대시보드', sales: '영업 대시보드', production: '생산 대시보드', shipping: '출하 대시보드' }

const pageTitle = computed(() => {
  const currentPath = route.path
  const role = authStore.currentUser?.userRole ?? authStore.currentUser?.role
  const home = getRoleHomePath(role)

  if (currentPath === home) {
    return roleDashboardTitles[role] || '대시보드'
  }
  if (currentPath === '/') {
    return '대시보드'
  }

  return String(route.meta.serviceName ?? '대시보드')
})

const roleDashboardDescriptions = {
  admin: '전체 부서의 주요 업무 현황을 한눈에 확인하는 관리자 화면입니다.',
  sales: '영업 문서 현황과 결재 요청을 확인하는 영업 전용 화면입니다.',
  production: '생산지시서 현황과 진행 상태를 확인하는 생산 전용 화면입니다.',
  shipping: '출하 현황과 출하 일정을 확인하는 출하 전용 화면입니다.',
}

const pageTooltip = computed(() => {
  const currentPath = route.path
  const role = authStore.currentUser?.userRole ?? authStore.currentUser?.role
  const home = getRoleHomePath(role)

  if (currentPath === home || currentPath === '/') {
    return roleDashboardDescriptions[role] || '역할별 주요 업무 현황을 한눈에 확인하는 메인 화면입니다.'
  }

  return route.meta.description || ''
})

// TODO(#244): 헤더 알림 기능은 실제 알림 도메인/API/SSE가 준비될 때까지 임시 비활성화됨.
// 아이콘 버튼 자체는 레이아웃 유지 및 추후 재활성화를 위해 템플릿에 남겨둠.
const isPasswordModalOpen = ref(false)

function openPasswordModal() {
  isPasswordModalOpen.value = true
}

function closePasswordModal() {
  isPasswordModalOpen.value = false
}

const loggedInUser = computed(() => authStore.currentUser)
const userInitial = computed(() => (loggedInUser.value?.userName ?? loggedInUser.value?.name)?.charAt(0) || '?')
const userName = computed(() => loggedInUser.value?.userName ?? loggedInUser.value?.name ?? '사용자')
const userRole = computed(() => {
  const roles = { ADMIN: '관리자', SALES: '영업', PRODUCTION: '생산', SHIPPING: '출하', admin: '관리자', sales: '영업', production: '생산', shipping: '출하' }
  return roles[loggedInUser.value?.userRole ?? loggedInUser.value?.role] || ''
})
const userEmployeeNo = computed(() => loggedInUser.value?.employeeNo || '-')
const userEmail = computed(() => loggedInUser.value?.userEmail ?? loggedInUser.value?.email ?? '-')
const userDepartment = computed(() => loggedInUser.value?.departmentName || userRole.value)

const isProfileOpen = ref(false)
const isProfileEditOpen = ref(false)
const profileRef = ref(null)

function toggleProfile() {
  isProfileOpen.value = !isProfileOpen.value
}

function openProfileEdit() {
  isProfileOpen.value = false
  isProfileEditOpen.value = true
}

function closeProfileEdit() {
  isProfileEditOpen.value = false
}

function handleProfileSave(updatedData) {
  authStore.updateUserInfo(updatedData)
  isProfileEditOpen.value = false
}

const isLogoutConfirmOpen = ref(false)

function handleLogout() {
  isLogoutConfirmOpen.value = true
}

function confirmLogout() {
  isLogoutConfirmOpen.value = false
  authStore.logout()
  router.push({ name: 'login' })
}

function handleClickOutside(event) {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    isProfileOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-[77px] flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 no-print"
    style="height: 77px; min-height: 77px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
  >
    <div class="min-w-0 flex items-center gap-3">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 lg:hidden"
        @click="uiStore.toggleSidebar"
      >
        <span class="sr-only">사이드바 토글</span>
        <i class="fas text-sm" :class="uiStore.sidebarOpen ? 'fa-bars-staggered' : 'fa-bars'" aria-hidden="true"></i>
      </button>
      <div class="group/tip relative min-w-0 flex-1">
        <span class="flex items-center gap-1.5 truncate text-sm font-semibold text-[#32363A] sm:max-w-none">
          {{ pageTitle }}
          <i
            v-if="pageTooltip"
            class="fas fa-circle-info text-sm text-slate-300 transition group-hover/tip:text-slate-400"
            aria-hidden="true"
          />
        </span>
        <div
          v-if="pageTooltip"
          class="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-max max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 opacity-0 shadow-lg transition-opacity group-hover/tip:opacity-100"
        >
          <p class="text-xs font-semibold text-slate-700">{{ pageTitle }}</p>
          <p class="mt-1 text-xs font-normal leading-relaxed text-slate-500">{{ pageTooltip }}</p>
        </div>
      </div>
    </div>

    <div class="ml-2 flex flex-shrink-0 items-center gap-2 sm:gap-3">
      <div class="relative hidden lg:block">
        <input
          class="w-48 rounded-lg border border-slate-200 px-4 py-1.5 pl-8 text-xs font-medium text-slate-600"
          placeholder="검색..."
          readonly
        />
        <i class="fas fa-search absolute left-2.5 top-2 text-[10px] text-slate-300" aria-hidden="true"></i>
      </div>

      <!-- TODO(#244): 알림 기능 임시 비활성화. 실제 알림 도메인/API/SSE 구현 후 재활성화 예정. -->
      <div class="relative">
        <button
          type="button"
          class="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-300"
          title="알림 기능 준비 중"
          disabled
          aria-disabled="true"
        >
          <span class="sr-only">알림 (준비 중)</span>
          <i class="fas fa-bell text-sm" aria-hidden="true"></i>
        </button>
      </div>

      <div ref="profileRef" class="relative hidden items-center gap-2.5 border-l border-slate-200 pl-3 text-sm sm:flex">
        <div
          class="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
          @click="toggleProfile"
        >
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[11px] font-semibold text-white">{{ userInitial }}</div>
          <div>
            <div class="text-[12px] font-semibold text-[#32363A]">{{ userName }}</div>
            <div class="text-[10px] text-slate-400">{{ userRole }}</div>
          </div>
          <i class="fas fa-chevron-down text-[9px] text-slate-300" />
        </div>

        <!-- Profile Dropdown -->
        <div
          v-if="isProfileOpen"
          class="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <div class="border-b border-slate-100 px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">{{ userInitial }}</div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-slate-800">{{ userName }}</div>
                <div class="truncate text-xs text-slate-400">{{ userRole }}</div>
              </div>
            </div>
          </div>
          <div class="space-y-1 px-4 py-3 text-xs">
            <div class="flex items-center gap-2">
              <i class="fas fa-id-badge w-4 text-center text-slate-400" />
              <span class="text-slate-500">사번</span>
              <span class="ml-auto font-medium text-slate-700">{{ userEmployeeNo }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-envelope w-4 text-center text-slate-400" />
              <span class="text-slate-500">이메일</span>
              <span class="ml-auto truncate font-medium text-slate-700">{{ userEmail }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-building w-4 text-center text-slate-400" />
              <span class="text-slate-500">부서</span>
              <span class="ml-auto font-medium text-slate-700">{{ userDepartment }}</span>
            </div>
          </div>
          <div class="border-t border-slate-100 px-4 py-2">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-600 transition hover:bg-slate-50"
              @click="openProfileEdit"
            >
              <i class="fas fa-user-edit w-4 text-center text-slate-400" />
              내 정보 수정
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        title="비밀번호 변경"
        @click="openPasswordModal"
      >
        <i class="fas fa-key text-xs" aria-hidden="true"></i>
      </button>

      <button
        type="button"
        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        title="로그아웃"
        @click="handleLogout"
      >
        <i class="fas fa-sign-out-alt text-xs" aria-hidden="true"></i>
      </button>
    </div>
  </header>

  <PasswordChangeModal :open="isPasswordModalOpen" @close="closePasswordModal" @save="closePasswordModal" />

  <ProfileEditModal
    :open="isProfileEditOpen"
    :user="loggedInUser"
    @close="closeProfileEdit"
    @save="handleProfileSave"
  />

  <ConfirmModal
    :open="isLogoutConfirmOpen"
    title="로그아웃"
    message="로그아웃 하시겠습니까?"
    confirm-label="로그아웃"
    @confirm="confirmLogout"
    @cancel="isLogoutConfirmOpen = false"
  />
</template>
