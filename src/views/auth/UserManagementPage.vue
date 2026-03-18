<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import CompanyInfoTab from '@/components/domain/auth/CompanyInfoTab.vue'
import UserListTab from '@/components/domain/auth/UserListTab.vue'

const activeTab = ref('users')
const userListRef = ref(null)

const tabs = [
  { key: 'users', label: '사용자 목록' },
  { key: 'company', label: '자사 정보' },
]

function handleCreateUser() {
  activeTab.value = 'users'
  userListRef.value?.openCreateModal()
}
</script>

<template>
  <div class="space-y-6">
    <!-- 페이지 헤더 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg class="h-6 w-6 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
        </svg>
        <h1 class="text-xl font-bold text-ink">사용자 관리</h1>
      </div>
      <BaseButton variant="primary" @click="handleCreateUser">
        <template #leading>
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </template>
        사용자 등록
      </BaseButton>
    </div>

    <!-- TODO: 공통 BaseTabs 컴포넌트 교체 예정 (#28) -->
    <div class="border-b border-slate-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition"
          :class="activeTab === tab.key
            ? 'border-brand text-brand'
            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- 탭 내용 -->
    <UserListTab v-if="activeTab === 'users'" ref="userListRef" />
    <CompanyInfoTab v-else />
  </div>
</template>
