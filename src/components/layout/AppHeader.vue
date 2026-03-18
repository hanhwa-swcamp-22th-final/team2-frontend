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
    title: '출하 상태 변경',
    message: 'SH26002 출하완료 처리되었습니다.',
    time: '2026/04/10 09:00',
    unread: true,
  },
  {
    id: 3,
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
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3 5.75A.75.75 0 0 1 3.75 5h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 5.75Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm.75 3.5a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H3.75Z" />
        </svg>
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
        <svg class="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.766l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clip-rule="evenodd" />
        </svg>
      </div>

      <div class="relative">
        <button
          type="button"
          class="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50"
          @click="toggleNotifications"
        >
          <span class="sr-only">알림</span>
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 2.75a4.25 4.25 0 0 0-4.25 4.25v1.31c0 .53-.211 1.039-.586 1.414L4.22 10.66A1.75 1.75 0 0 0 5.457 13.65h9.086a1.75 1.75 0 0 0 1.237-2.989l-.943-.943a2 2 0 0 1-.586-1.414V7A4.25 4.25 0 0 0 10 2.75ZM8 15.25a2 2 0 1 0 4 0H8Z" />
          </svg>
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
            :class="notification.unread ? 'bg-indigo-50' : ''"
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

      <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" title="비밀번호 변경">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 2.75a3.75 3.75 0 0 0-3.75 3.75v1H5.5A1.75 1.75 0 0 0 3.75 9.25v6A1.75 1.75 0 0 0 5.5 17h9a1.75 1.75 0 0 0 1.75-1.75v-6A1.75 1.75 0 0 0 14.5 7.5h-.75v-1A3.75 3.75 0 0 0 10 2.75Zm2.25 4.75v-1a2.25 2.25 0 0 0-4.5 0v1h4.5Z" clip-rule="evenodd" />
        </svg>
      </button>

      <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" title="로그아웃">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M3.75 4A1.75 1.75 0 0 1 5.5 2.25h4a.75.75 0 0 1 0 1.5h-4A.25.25 0 0 0 5.25 4v12c0 .138.112.25.25.25h4a.75.75 0 0 1 0 1.5h-4A1.75 1.75 0 0 1 3.75 16V4Zm8.22 3.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H8.5a.75.75 0 0 1 0-1.5h4.44l-.97-.97a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </header>
</template>
