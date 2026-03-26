<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import DepartmentAccordion from '@/components/domain/auth/DepartmentAccordion.vue'
import UserFormModal from '@/components/domain/auth/UserFormModal.vue'
import { useToast } from '@/composables/useToast'
import {
  createUser,
  fetchDepartments,
  fetchPositions,
  fetchUsers,
  updateUser,
} from '@/api/auth'

const { success, error } = useToast()

// 데이터
const users = ref([])
const positions = ref([])
const departments = ref([])
const loading = ref(false)

// 사번 자동 생성 (YYMMDD + 2자리 순번)
function generateEmployeeNo(existingUsers) {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const prefix = `${yy}${mm}${dd}`
  const todayNos = existingUsers
    .map((u) => u.employeeNo)
    .filter((no) => no && no.startsWith(prefix))
  const maxSeq = todayNos.reduce((max, no) => {
    const seq = parseInt(no.slice(6), 10)
    return isNaN(seq) ? max : Math.max(max, seq)
  }, 0)
  return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`
}

async function loadData() {
  loading.value = true
  try {
    const [usersData, positionsData, departmentsData] = await Promise.all([
      fetchUsers(),
      fetchPositions(),
      fetchDepartments(),
    ])
    users.value = usersData
    positions.value = positionsData
    departments.value = departmentsData
    // 첫 번째 부서 펼치기
    if (departmentsData.length > 0) {
      expandedDepts.value = new Set([departmentsData[0].id])
    }
  } catch (e) {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const positionMap = computed(() => Object.fromEntries(positions.value.map((p) => [String(p.id), p.name])))

// 검색 / 필터
const searchKeyword = ref('')
const departmentFilter = ref('')

// 아코디언 상태
const expandedDepts = ref(new Set())

// 모달 상태
const showFormModal = ref(false)
const formMode = ref('create')
const selectedUser = ref(null)
const saving = ref(false)

// 삭제 확인 모달 상태
const showDeleteModal = ref(false)
const userToDelete = ref(null)
const deleting = ref(false)

// 부서별 그룹핑 + 필터
const groupedByDepartment = computed(() => {
  let filtered = users.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        (u.employeeNo && u.employeeNo.includes(kw)) ||
        (u.email && u.email.toLowerCase().includes(kw)),
    )
  }

  if (departmentFilter.value) {
    filtered = filtered.filter((u) => String(u.departmentId) === String(departmentFilter.value))
  }

  return departments.value
    .map((dept) => ({
      department: dept,
      users: filtered
        .filter((u) => String(u.departmentId) === String(dept.id))
        .map((u) => ({ ...u, department: dept.name })),
    }))
    .filter((g) => g.users.length > 0)
})

const totalTeams = computed(() => groupedByDepartment.value.length)
const totalUsers = computed(() =>
  groupedByDepartment.value.reduce((sum, g) => sum + g.users.length, 0),
)
const activeUsers = computed(() =>
  groupedByDepartment.value.reduce(
    (sum, g) => sum + g.users.filter((u) => u.status === '재직').length,
    0,
  ),
)

const departmentFilterOptions = computed(() => [
  { label: '전체 부서', value: '' },
  ...departments.value.map((d) => ({ label: d.name, value: d.id })),
])

function toggleDepartment(deptId) {
  const next = new Set(expandedDepts.value)
  if (next.has(deptId)) next.delete(deptId)
  else next.add(deptId)
  expandedDepts.value = next
}

const allVisibleExpanded = computed(() => {
  const visibleDeptIds = groupedByDepartment.value.map(g => g.department.id)
  return visibleDeptIds.length > 0 && visibleDeptIds.every(id => expandedDepts.value.has(id))
})

function toggleAll() {
  const visibleDeptIds = groupedByDepartment.value.map(g => g.department.id)
  const allExpanded = visibleDeptIds.length > 0 && visibleDeptIds.every(id => expandedDepts.value.has(id))
  if (allExpanded) {
    expandedDepts.value = new Set()
  } else {
    expandedDepts.value = new Set([...expandedDepts.value, ...visibleDeptIds])
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

function openDeleteModal(user) {
  userToDelete.value = user
  showDeleteModal.value = true
}

async function handleSave(formData) {
  saving.value = true
  try {
    if (formMode.value === 'create') {
      const employeeNo = generateEmployeeNo(users.value)
      const newUser = {
        ...formData,
        employeeNo,
        pw: 'test1234',
        status: formData.status || '재직',
      }
      await createUser(newUser)
      success('사용자가 등록되었습니다.')
    } else {
      const original = selectedUser.value
      const { pw: _pw, ...safeOriginal } = original
      const updateData = { ...safeOriginal, ...formData }
      // 팀 이동 처리
      if (formData.transferDepartmentId) {
        updateData.departmentId = formData.transferDepartmentId
      }
      delete updateData.transferDepartmentId
      delete updateData.transferReason
      delete updateData.department
      await updateUser(original.id, updateData)
      success('사용자 정보가 수정되었습니다.')
    }
    await loadData()
    showFormModal.value = false
  } catch (e) {
    error('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    // 물리 삭제(deleteUser) 대신 소프트 삭제: status를 '퇴직'으로 변경
    const { pw: _, ...safeUser } = userToDelete.value
    await updateUser(safeUser.id, { ...safeUser, status: '퇴직' })
    success(`${userToDelete.value.name} 사용자가 퇴직 처리되었습니다.`)
    await loadData()
  } catch (e) {
    error('처리 중 오류가 발생했습니다.')
  } finally {
    deleting.value = false
    showDeleteModal.value = false
    userToDelete.value = null
  }
}

defineExpose({ openCreateModal })
</script>

<template>
  <div class="space-y-4">
    <!-- 상단 필터 바 -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="min-w-0 flex-1">
        <SearchInput v-model="searchKeyword" placeholder="사번 · 이름 · 이메일로 검색" />
      </div>
      <div class="w-40">
        <BaseSelect v-model="departmentFilter" :options="departmentFilterOptions" placeholder="전체 부서" />
      </div>
      <BaseButton variant="ghost" size="sm" @click="toggleAll">
        {{ allVisibleExpanded ? '전체 접기' : '전체 펼치기' }}
      </BaseButton>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="py-12 text-center text-sm text-slate-400">
      불러오는 중...
    </div>

    <!-- 부서별 아코디언 -->
    <div v-else class="space-y-3">
      <DepartmentAccordion
        v-for="group in groupedByDepartment"
        :key="group.department.id"
        :department="group.department.name"
        :users="group.users"
        :expanded="expandedDepts.has(group.department.id)"
        :position-map="positionMap"
        @toggle="toggleDepartment(group.department.id)"
        @edit-user="openEditModal"
        @delete-user="openDeleteModal"
      />
      <div v-if="groupedByDepartment.length === 0" class="py-12 text-center text-sm text-slate-400">
        검색 결과가 없습니다.
      </div>
    </div>

    <!-- 하단 요약 -->
    <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span>총 {{ totalTeams }}개 팀 {{ totalUsers }}명</span>
      <span>{{ activeUsers }}명 재직</span>
    </div>

    <!-- 사용자 등록/수정 모달 -->
    <UserFormModal
      :open="showFormModal"
      :mode="formMode"
      :user="selectedUser"
      :positions="positions"
      :departments="departments"
      :all-users="users"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :open="showDeleteModal"
      title="사용자 퇴직 처리"
      :message="`${userToDelete?.name} 사용자를 퇴직 처리하시겠습니까?`"
      confirm-label="퇴직 처리"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
