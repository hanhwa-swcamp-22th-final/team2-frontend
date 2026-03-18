<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const route = useRoute()
const pageTitle = computed(() => String(route.meta.serviceName ?? '공통 대시보드'))
const isNotificationOpen = ref(false)

const notifications = [
  {
    id: 1,
    title: '결재 요청',
    message: '김영업(과장)이 PO26002 수정 결재를 요청했습니다.',
    time: '2026/03/15 10:00',
    unread: true,
  },
  {
    id: 2,
    title: '결재 요청',
    message: '정영업(대리)이 PO26004 삭제 결재를 요청했습니다.',
    time: '2026/03/14 09:30',
    unread: true,
  },
  {
    id: 3,
    title: '출하 상태 변경',
    message: 'SH26002 출하완료 처리되었습니다.',
    time: '2026/04/10 09:00',
    unread: true,
  },
  {
    id: 4,
    title: '완납 처리',
    message: 'PO26003 잔금 입금 확인. 완납 처리.',
    time: '2026/05/05 11:00',
    unread: false,
  },
]

const unreadCount = computed(() => notifications.filter((item) => item.unread).length)

function toggleNotifications() {
  isNotificationOpen.value = !isNotificationOpen.value
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-[77px] flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 no-print"
    style="height: 77px; min-height: 77px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
  >
    <div class="flex items-center gap-3">
      <button class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 lg:hidden" @click="uiStore.toggleSidebar">
        <span class="sr-only">메뉴</span>
        <i class="fas fa-bars text-sm" aria-hidden="true"></i>
      </button>
      <span class="text-sm font-semibold text-[#32363A]">{{ pageTitle }}</span>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative hidden lg:block">
        <input
          class="w-48 rounded-lg border border-slate-200 px-4 py-1.5 pl-8 text-xs font-medium text-slate-600"
          placeholder="검색..."
          readonly
        />
        <i class="fas fa-search absolute left-2.5 top-2 text-[10px] text-slate-300" aria-hidden="true"></i>
      </div>

      <div class="relative">
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
          class="absolute right-0 top-11 z-50 max-h-80 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <div class="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-[#32363A]">알림</div>
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
            :class="notification.unread ? 'bg-[#EEF2FF]' : ''"
            style="border-bottom: 1px solid #E5E7EB;"
          >
            <div class="text-sm font-medium" :class="notification.unread ? 'text-[#32363A]' : 'text-slate-500'">
              {{ notification.title }}
            </div>
            <div class="mt-0.5 text-xs text-slate-500">{{ notification.message }}</div>
            <div class="mt-1 text-[10px] text-slate-400">{{ notification.time }}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2.5 border-l border-slate-200 pl-3 text-sm">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[11px] font-semibold text-white">최</div>
        <div>
          <div class="text-[12px] font-semibold text-[#32363A]">최관리</div>
          <div class="text-[10px] text-slate-400">경영지원 · 관리자</div>
        </div>
      </div>

      <button type="button" class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" title="비밀번호 변경">
        <i class="fas fa-key text-xs" aria-hidden="true"></i>
      </button>

      <button type="button" class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" title="로그아웃">
        <i class="fas fa-sign-out-alt text-xs" aria-hidden="true"></i>
      </button>
    </div>
  </header>
</template>
