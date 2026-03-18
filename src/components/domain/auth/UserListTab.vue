<script setup>
import { computed, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import DepartmentAccordion from '@/components/domain/auth/DepartmentAccordion.vue'
import PasswordChangeModal from '@/components/domain/auth/PasswordChangeModal.vue'
import UserFormModal from '@/components/domain/auth/UserFormModal.vue'

const emit = defineEmits(['open-create-modal'])

// Mock 데이터
const positions = [
  { id: 1, name: '팀장', level: 1 },
  { id: 2, name: '팀원', level: 2 },
]

const departments = [
  { id: 1, name: '영업1팀' },
  { id: 2, name: '영업2팀' },
  { id: 3, name: '생산팀' },
  { id: 4, name: '출하팀' },
  { id: 5, name: '경영지원' },
]

const users = ref([
  { id: 1, employeeNo: '25061501', name: '김영업', email: 'kim@salesboost.com', role: 'sales', departmentId: 1, positionId: 1, status: '재직' },
  { id: 2, employeeNo: '25061502', name: '이생산', email: 'lee@salesboost.com', role: 'production', departmentId: 3, positionId: 1, status: '재직' },
  { id: 3, employeeNo: '25061503', name: '박출하', email: 'park@salesboost.com', role: 'shipping', departmentId: 4, positionId: 1, status: '재직' },
  { id: 4, employeeNo: '25061504', name: '최관리', email: 'admin@salesboost.com', role: 'admin', departmentId: 5, positionId: 1, status: '재직' },
  { id: 5, employeeNo: '25080101', name: '정영업', email: 'jung@salesboost.com', role: 'sales', departmentId: 2, positionId: 2, status: '재직' },
  { id: 6, employeeNo: '25062001', name: '한퇴사', email: 'han@salesboost.com', role: 'sales', departmentId: 1, positionId: 2, status: '퇴직' },
])

const positionMap = Object.fromEntries(positions.map((p) => [p.id, p.name]))

// 검색 / 필터
const searchKeyword = ref('')
const departmentFilter = ref('')

// 아코디언 상태
const expandedDepts = ref(new Set([1]))

// 모달 상태
const showFormModal = ref(false)
const formMode = ref('create')
const selectedUser = ref(null)
const showPasswordModal = ref(false)

// 부서별 그룹핑 + 필터
const groupedByDepartment = computed(() => {
  let filtered = users.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw) || u.employeeNo.includes(kw),
    )
  }

  if (departmentFilter.value) {
    filtered = filtered.filter((u) => u.departmentId === Number(departmentFilter.value))
  }

  return departments.map((dept) => ({
    department: dept,
    users: filtered
      .filter((u) => u.departmentId === dept.id)
      .map((u) => ({ ...u, department: dept.name })),
  })).filter((g) => g.users.length > 0)
})

const totalTeams = computed(() => groupedByDepartment.value.length)
const totalUsers = computed(() => groupedByDepartment.value.reduce((sum, g) => sum + g.users.length, 0))
const activeUsers = computed(() => groupedByDepartment.value.reduce((sum, g) => sum + g.users.filter((u) => u.status === '재직').length, 0))

const departmentFilterOptions = [
  { label: '전체 부서', value: '' },
  ...departments.map((d) => ({ label: d.name, value: d.id })),
]

function toggleDepartment(deptId) {
  if (expandedDepts.value.has(deptId)) {
    expandedDepts.value.delete(deptId)
  } else {
    expandedDepts.value.add(deptId)
  }
}

function toggleAll() {
  if (expandedDepts.value.size === departments.length) {
    expandedDepts.value.clear()
  } else {
    expandedDepts.value = new Set(departments.map((d) => d.id))
  }
}

function openEditModal(user) {
  selectedUser.value = user
  formMode.value = 'edit'
  showFormModal.value = true
}

function openCreateModal() {
  selectedUser.value = null
  formMode.value = 'create'
  showFormModal.value = true
}

defineExpose({ openCreateModal })
</script>

<template>
  <div class="space-y-4">
    <!-- 상단 필터 바 -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-0 flex-1">
        <SearchInput v-model="searchKeyword" placeholder="이름, 이메일, 사번으로 검색" />
      </div>
      <div class="w-40">
        <BaseSelect v-model="departmentFilter" :options="departmentFilterOptions" placeholder="전체 부서" />
      </div>
      <BaseButton variant="ghost" size="sm" @click="toggleAll">
        {{ expandedDepts.size === departments.length ? '전체 접기' : '전체 펼치기' }}
      </BaseButton>
    </div>

    <!-- 부서별 아코디언 -->
    <div class="space-y-3">
      <DepartmentAccordion
        v-for="group in groupedByDepartment"
        :key="group.department.id"
        :department="group.department.name"
        :users="group.users"
        :expanded="expandedDepts.has(group.department.id)"
        :position-map="positionMap"
        @toggle="toggleDepartment(group.department.id)"
        @edit-user="openEditModal"
      />
    </div>

    <!-- 하단 요약 -->
    <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span>총 {{ totalTeams }}개 팀 {{ totalUsers }}명</span>
      <span>{{ activeUsers }}명 재직</span>
    </div>

    <!-- 모달들 -->
    <UserFormModal
      :open="showFormModal"
      :mode="formMode"
      :user="selectedUser"
      :positions="positions"
      :departments="departments"
      @close="showFormModal = false"
    />

    <PasswordChangeModal
      :open="showPasswordModal"
      @close="showPasswordModal = false"
    />
  </div>
</template>
