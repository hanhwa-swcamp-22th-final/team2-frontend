<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTabs from '@/components/common/BaseTabs.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
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
    <PageTitleBar title="사용자 관리">
      <template #actions>
        <BaseButton variant="primary" @click="handleCreateUser">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </template>
          사용자 등록
        </BaseButton>
      </template>
    </PageTitleBar>

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <!-- 탭 내용 -->
    <UserListTab v-if="activeTab === 'users'" ref="userListRef" />
    <CompanyInfoTab v-else />
  </div>
</template>
