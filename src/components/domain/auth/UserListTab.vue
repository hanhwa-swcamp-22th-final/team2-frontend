<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import UserFormModal from '@/components/domain/auth/UserFormModal.vue'
import { useToast } from '@/composables/useToast'
import {
  changeUserStatus,
  createUser,
  fetchDepartments,
  fetchPositions,
  fetchTeams,
  fetchUsers,
  updateUser,
} from '@/api/auth'
import { label, USER_STATUS_LABEL } from '@/utils/enumLabels'

const { success, error } = useToast()

const users = ref([])
const positions = ref([])
const departments = ref([])
const teams = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const [usersData, positionsData, departmentsData, teamsData] = await Promise.all([
      fetchUsers(),
      fetchPositions(),
      fetchDepartments(),
      fetchTeams(),
    ])
    users.value = usersData
    positions.value = positionsData
    const seenDeptIds = new Set()
    departments.value = (departmentsData ?? []).filter((d) => {
      const id = String(d.departmentId ?? d.id ?? '')
      if (!id || seenDeptIds.has(id)) return false
      seenDeptIds.add(id)
      return true
    })
    teams.value = teamsData ?? []
    if (departments.value.length > 0) {
      expandedDepts.value = new Set([departments.value[0].departmentId ?? departments.value[0].id])
    }
  } catch (e) {
    error('데이터를 불러오는 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const positionMap = computed(() =>
  Object.fromEntries(positions.value.map((p) => [String(p.positionId ?? p.id), p.positionName ?? p.name])),
)

const searchKeyword = ref('')
const departmentFilter = ref('')

const expandedDepts = ref(new Set())
const expandedTeams = ref(new Set())

const showFormModal = ref(false)
const formMode = ref('create')
const selectedUser = ref(null)
const saving = ref(false)

const showDeleteModal = ref(false)
const userToDelete = ref(null)
const deleting = ref(false)

// department → team → users 트리 구성
const tree = computed(() => {
  let filtered = users.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        (u.userName && u.userName.toLowerCase().includes(kw)) ||
        (u.employeeNo && u.employeeNo.includes(kw)) ||
        (u.userEmail && u.userEmail.toLowerCase().includes(kw)),
    )
  }
  if (departmentFilter.value) {
    filtered = filtered.filter((u) => String(u.departmentId) === String(departmentFilter.value))
  }

  return departments.value
    .map((dept) => {
      const deptId = dept.departmentId ?? dept.id
      const deptName = dept.departmentName ?? dept.name
      const deptTeams = teams.value.filter((t) => String(t.departmentId) === String(deptId))
      const teamGroups = deptTeams.map((t) => ({
        teamId: t.teamId,
        teamName: t.teamName,
        users: filtered.filter((u) => String(u.teamId) === String(t.teamId)),
      }))
      // 팀 없이 소속된 사용자 ('미배정')
      const unassigned = filtered.filter(
        (u) => String(u.departmentId) === String(deptId) && !u.teamId,
      )
      if (unassigned.length > 0) {
        teamGroups.push({ teamId: `__unassigned_${deptId}`, teamName: '(팀 미배정)', users: unassigned })
      }
      const total = teamGroups.reduce((s, g) => s + g.users.length, 0)
      return { deptId, deptName, teamGroups, total }
    })
    .filter((g) => g.total > 0)
})

const totalTeams = computed(() =>
  tree.value.reduce((s, d) => s + d.teamGroups.filter((t) => t.users.length > 0).length, 0),
)
const totalUsers = computed(() => tree.value.reduce((s, d) => s + d.total, 0))
const activeUsers = computed(() =>
  tree.value.reduce(
    (s, d) => s + d.teamGroups.reduce(
      (s2, t) => s2 + t.users.filter((u) => u.userStatus === 'active').length, 0), 0),
)

const departmentFilterOptions = computed(() => [
  { label: '전체 부서', value: '' },
  ...departments.value.map((d) => ({
    label: d.departmentName ?? d.name,
    value: String(d.departmentId ?? d.id),
  })),
])

function toggleDept(deptId) {
  const next = new Set(expandedDepts.value)
  if (next.has(deptId)) next.delete(deptId)
  else next.add(deptId)
  expandedDepts.value = next
}

function toggleTeam(teamId) {
  const next = new Set(expandedTeams.value)
  if (next.has(teamId)) next.delete(teamId)
  else next.add(teamId)
  expandedTeams.value = next
}

const allVisibleExpanded = computed(() => {
  const visibleDeptIds = tree.value.map((g) => g.deptId)
  return visibleDeptIds.length > 0 && visibleDeptIds.every((id) => expandedDepts.value.has(id))
})

function toggleAll() {
  const visibleDeptIds = tree.value.map((g) => g.deptId)
  const visibleTeamIds = tree.value.flatMap((g) => g.teamGroups.map((t) => t.teamId))
  const allExpanded = allVisibleExpanded.value
  if (allExpanded) {
    expandedDepts.value = new Set()
    expandedTeams.value = new Set()
  } else {
    expandedDepts.value = new Set([...expandedDepts.value, ...visibleDeptIds])
    expandedTeams.value = new Set([...expandedTeams.value, ...visibleTeamIds])
  }
}

const userColumns = [
  { key: 'employeeNo', label: '사번', width: '120px' },
  { key: 'userName', label: '이름', width: '200px' },
  { key: 'userEmail', label: '이메일' },
  { key: 'status', label: '상태', width: '100px', align: 'center' },
  { key: 'actions', label: '', width: '140px', align: 'center', sortable: false },
]

const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500']
function getAvatarColor(index) { return avatarColors[index % avatarColors.length] }

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
      const newUser = {
        name: formData.name,
        email: formData.email,
        password: 'password123',
        role: formData.role,
      }
      await createUser(newUser)
      success('사용자가 등록되었습니다.')
    } else {
      const original = selectedUser.value
      const updateData = {
        name: formData.name,
        email: formData.email,
        teamId: formData.teamId ? Number(formData.teamId) : (original.teamId ? Number(original.teamId) : undefined),
        positionId: formData.positionId ? Number(formData.positionId) : undefined,
      }
      await updateUser(original.userId, updateData)
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
    await changeUserStatus(userToDelete.value.userId, 'RETIRED')
    success(`${userToDelete.value.userName} 사용자가 퇴직 처리되었습니다.`)
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

    <div v-if="loading" class="py-12 text-center text-sm text-slate-400">
      불러오는 중...
    </div>

    <!-- 부서 → 팀 → 사용자 트리 -->
    <div v-else class="space-y-3">
      <div
        v-for="dept in tree"
        :key="dept.deptId"
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <button
          type="button"
          class="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
          @click="toggleDept(dept.deptId)"
        >
          <svg
            class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
            :class="{ 'rotate-90': expandedDepts.has(dept.deptId) }"
            viewBox="0 0 20 20" fill="currentColor"
          >
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd"/>
          </svg>
          <svg class="h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3A1.5 1.5 0 0 1 13 3.5H7ZM3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1H3V6ZM2 9.5h16l-.663 7.283A2 2 0 0 1 15.345 18.5H4.655a2 2 0 0 1-1.992-1.717L2 9.5Z"/>
          </svg>
          <span class="font-bold text-ink">{{ dept.deptName }}</span>
          <span class="ml-auto text-sm text-slate-500">{{ dept.total }}명</span>
        </button>

        <div v-show="expandedDepts.has(dept.deptId)" class="border-t border-slate-100">
          <div
            v-for="team in dept.teamGroups"
            :key="team.teamId"
            class="border-b border-slate-100 last:border-b-0"
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 bg-slate-50 px-8 py-3 text-left text-sm transition hover:bg-slate-100"
              @click="toggleTeam(team.teamId)"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-90': expandedTeams.has(team.teamId) }"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd"/>
              </svg>
              <span class="font-semibold text-slate-700">{{ team.teamName }}</span>
              <span class="ml-auto text-xs text-slate-500">{{ team.users.length }}명</span>
            </button>
            <div v-show="expandedTeams.has(team.teamId)" class="bg-white px-2">
              <BaseTable :columns="userColumns" :rows="team.users" row-key="userId" empty-text="사용자가 없습니다.">
                <template #cell-userName="{ row, value }">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :class="getAvatarColor(row.userId)">
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
                    @edit="openEditModal(row)"
                    @delete="openDeleteModal(row)"
                  />
                </template>
              </BaseTable>
            </div>
          </div>
        </div>
      </div>
      <div v-if="tree.length === 0" class="py-12 text-center text-sm text-slate-400">
        검색 결과가 없습니다.
      </div>
    </div>

    <div class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span>총 {{ totalTeams }}개 팀 {{ totalUsers }}명</span>
      <span>{{ activeUsers }}명 재직</span>
    </div>

    <UserFormModal
      :open="showFormModal"
      :mode="formMode"
      :user="selectedUser"
      :positions="positions"
      :departments="departments"
      :teams="teams"
      :all-users="users"
      :saving="saving"
      @close="showFormModal = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="showDeleteModal"
      title="사용자 퇴직 처리"
      :message="`${userToDelete?.userName} 사용자를 퇴직 처리하시겠습니까?`"
      confirm-label="퇴직 처리"
      confirm-variant="danger"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
