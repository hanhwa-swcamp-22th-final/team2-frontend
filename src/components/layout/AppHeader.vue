<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ProfileEditModal from '@/components/domain/auth/ProfileEditModal.vue'
import PasswordChangeModal from '@/components/domain/auth/PasswordChangeModal.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { getRoleHomePath } from '@/utils/roleAccess'
import { usePiDocuments } from '@/stores/piDocuments'
import { usePoDocuments } from '@/stores/poDocuments'
import { useSalesCollectionDocuments } from '@/stores/salesCollectionDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'

const uiStore = useUiStore()
const authStore = useAuthStore()
const piDocuments = usePiDocuments()
const poDocuments = usePoDocuments()
const salesCollectionDocuments = useSalesCollectionDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()
const route = useRoute()
const router = useRouter()
const roleDashboardTitles = { admin: '관리자 대시보드', sales: '영업 대시보드', production: '생산 대시보드', shipping: '출하 대시보드' }

const pageTitle = computed(() => {
  const currentPath = route.path
  const role = authStore.currentUser?.role
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
  const role = authStore.currentUser?.role
  const home = getRoleHomePath(role)

  if (currentPath === home || currentPath === '/') {
    return roleDashboardDescriptions[role] || '역할별 주요 업무 현황을 한눈에 확인하는 메인 화면입니다.'
  }

  return route.meta.description || ''
})

const isNotificationOpen = ref(false)
const isPasswordModalOpen = ref(false)
const notificationRef = ref(null)
const readNotificationIds = ref([])

function normalizeTimestamp(value) {
  if (!value) return 0
  const normalized = value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00`
  const timestamp = Date.parse(normalized.replaceAll('/', '-'))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function createApprovalNotifications() {
  const currentUser = authStore.currentUser
  if (!currentUser) return []

  const approvalDocuments = [...piDocuments.value, ...poDocuments.value]
    .filter((row) => row.requestStatus && row.approvalStatus === '대기')
    .filter((row) => {
      if (currentUser.role === 'admin') return true
      if (currentUser.role !== 'sales') return false
      if (currentUser.positionId === 1) return true
      return row.approvalRequestedBy === currentUser.name
    })

  return approvalDocuments.map((row) => ({
    id: `approval-${row.id}-${row.requestStatus}`,
    title: '결재 요청',
    message: `${row.approvalRequestedBy || '요청자'}이(가) ${row.id} ${row.requestStatus}을 올렸습니다.`,
    time: row.approvalRequestedAt || row.issueDate || '-',
    sortTime: normalizeTimestamp(row.approvalRequestedAt || row.issueDate),
    to: row.id.startsWith('PI') ? '/pi' : '/po',
    query: {
      code: row.id,
      source: 'header-notification',
    },
  }))
}

function createShipmentNotifications() {
  const currentUser = authStore.currentUser
  if (!currentUser || currentUser.role === 'production') return []

  return shipmentStatusDocuments.value
    .filter((row) => row.status === '출하완료')
    .map((row) => ({
      id: `shipment-${row.id}-${row.status}`,
      title: '출하 상태 변경',
      message: `${row.id} 건이 출하완료 처리되었습니다.`,
      time: row.lastUpdated || row.requestDate || '-',
      sortTime: normalizeTimestamp(row.lastUpdated || row.requestDate),
      to: '/shipments',
      query: {
        code: row.id,
        source: 'header-notification',
      },
    }))
}

function createCollectionNotifications() {
  const currentUser = authStore.currentUser
  if (!currentUser || !['sales', 'admin'].includes(currentUser.role)) return []

  return salesCollectionDocuments.value
    .filter((row) => row.status === '수금완료')
    .map((row) => ({
      id: `collection-${row.poId}-${row.collectionDate}`,
      title: '수금 완료',
      message: `${row.poId} 건의 수금이 완료되었습니다.`,
      time: row.collectionDate || row.issueDate || '-',
      sortTime: normalizeTimestamp(row.collectionDate || row.issueDate),
      to: '/collections',
      query: {
        code: row.poId,
        source: 'header-notification',
      },
    }))
}

const notifications = computed(() => (
  [
    ...createApprovalNotifications(),
    ...createShipmentNotifications(),
    ...createCollectionNotifications(),
  ]
    .sort((left, right) => right.sortTime - left.sortTime)
    .slice(0, 8)
    .map((notification) => ({
      ...notification,
      unread: !readNotificationIds.value.includes(notification.id),
    }))
))

const unreadCount = computed(() => notifications.value.filter((item) => item.unread).length)

function toggleNotifications() {
  isNotificationOpen.value = !isNotificationOpen.value
}

function openPasswordModal() {
  isPasswordModalOpen.value = true
}

function closePasswordModal() {
  isPasswordModalOpen.value = false
}

function goToNotification(notification) {
  isNotificationOpen.value = false
  if (!readNotificationIds.value.includes(notification.id)) {
    readNotificationIds.value = [...readNotificationIds.value, notification.id]
  }
  router.push({
    path: notification.to,
    query: notification.query,
  })
}

const loggedInUser = computed(() => authStore.currentUser)
const userInitial = computed(() => loggedInUser.value?.name?.charAt(0) || '?')
const userName = computed(() => loggedInUser.value?.name || '사용자')
const userRole = computed(() => {
  const roles = { admin: '관리자', sales: '영업', production: '생산', shipping: '출하' }
  return roles[loggedInUser.value?.role] || ''
})
const userEmployeeNo = computed(() => loggedInUser.value?.employeeNo || '-')
const userEmail = computed(() => loggedInUser.value?.email || '-')
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
  if (notificationRef.value && !notificationRef.value.contains(event.target)) {
    isNotificationOpen.value = false
  }
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

      <div ref="notificationRef" class="relative">
        <button
          type="button"
          class="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50"
          @click="toggleNotifications"
        >
          <span class="sr-only">알림</span>
          <i class="fas fa-bell text-sm" aria-hidden="true"></i>
          <span
            v-if="unreadCount"
            class="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-[9px] font-bold text-white"
            style="box-shadow: 0 0 8px rgba(10,110,209,0.15);"
          >
            {{ unreadCount }}
          </span>
        </button>

        <div
          v-if="isNotificationOpen"
          class="absolute right-0 top-11 z-50 max-h-80 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-[#32363A]">알림</div>
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
            :class="notification.unread ? 'bg-[#EEF2FF]' : ''"
            style="border-bottom: 1px solid #E5E7EB;"
            @click="goToNotification(notification)"
          >
            <div class="text-sm font-medium" :class="notification.unread ? 'text-[#32363A]' : 'text-slate-500'">
              {{ notification.title }}
            </div>
            <div class="mt-0.5 text-xs text-slate-500">{{ notification.message }}</div>
            <div class="mt-1 text-[10px] text-slate-400">{{ notification.time }}</div>
          </div>
        </div>
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
