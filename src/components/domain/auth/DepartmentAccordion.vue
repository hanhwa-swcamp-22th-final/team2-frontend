<script setup>
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import { label, USER_STATUS_LABEL } from '@/utils/enumLabels'

const props = defineProps({
  department: { type: String, required: true },
  users: { type: Array, default: () => [] },
  expanded: { type: Boolean, default: false },
  positionMap: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['toggle', 'edit-user', 'delete-user'])

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-amber-500', 'bg-rose-500', 'bg-teal-500',
]

const columns = [
  { key: 'employeeNo', label: '사번', width: '120px' },
  { key: 'userName', label: '이름', width: '200px' },
  { key: 'userEmail', label: '이메일' },
  { key: 'department', label: '부서', width: '120px' },
  { key: 'status', label: '상태', width: '100px', align: 'center' },
  { key: 'actions', label: '관리', width: '140px', align: 'center' },
]

function getAvatarColor(index) {
  return avatarColors[index % avatarColors.length]
}

function getActiveCount() {
  return props.users.filter((u) => u.userStatus === 'active').length
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <!-- 헤더 -->
    <button
      type="button"
      class="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
      :aria-expanded="expanded"
      :aria-controls="`dept-panel-${department}`"
      @click="emit('toggle')"
    >
      <!-- Chevron -->
      <svg
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-90': expanded }"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd" />
      </svg>
      <!-- 부서 아이콘 -->
      <svg class="h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3A1.5 1.5 0 0 1 13 3.5H7ZM3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1H3V6ZM2 9.5h16l-.663 7.283A2 2 0 0 1 15.345 18.5H4.655a2 2 0 0 1-1.992-1.717L2 9.5Z" />
      </svg>
      <span class="font-bold text-ink">{{ department }}</span>
      <span class="ml-auto text-sm text-slate-500">
        {{ getActiveCount() }}명 재직 / {{ users.length }}명
      </span>
    </button>

    <!-- 본문 테이블 -->
    <div v-show="expanded" :id="`dept-panel-${department}`" :aria-hidden="!expanded" class="border-t border-slate-100">
      <BaseTable :columns="columns" :rows="users" row-key="userId" empty-text="사용자가 없습니다.">
        <template #cell-userName="{ row, value }">
          <div class="flex items-center gap-2.5">
            <span
              role="img"
              :aria-label="`${value} 프로필`"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              :class="getAvatarColor(row.userId)"
            >
              {{ value?.charAt(0) }}
            </span>
            <div>
              <p class="font-medium text-ink">{{ value }}</p>
              <p class="text-xs text-slate-400">{{ row.positionName || positionMap[row.positionId] || '' }}</p>
            </div>
          </div>
        </template>

        <template #cell-status="{ row }">
          <StatusBadge
            :value="label(USER_STATUS_LABEL, row.userStatus)"
            :variant="row.userStatus === 'active' ? 'active' : 'inactive'"
          />
        </template>

        <template #cell-actions="{ row }">
          <TableActions
            edit-label="수정"
            delete-label="퇴직"
            @edit="emit('edit-user', row)"
            @delete="emit('delete-user', row)"
          />
        </template>
      </BaseTable>
    </div>
  </div>
</template>
