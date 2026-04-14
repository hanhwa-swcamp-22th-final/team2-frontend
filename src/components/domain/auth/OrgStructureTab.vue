<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormField from '@/components/common/FormField.vue'
import {
  createDepartment,
  createTeam,
  deleteDepartment,
  deleteTeam,
  fetchDepartments,
  fetchTeams,
  updateDepartment,
  updateTeam,
} from '@/api/auth'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()

const departments = ref([])
const teams = ref([])
const loading = ref(false)
const selectedDeptId = ref(null)

// 모달 상태
const deptModalOpen = ref(false)
const deptMode = ref('create')
const deptForm = ref({ id: null, name: '' })
const deptError = ref('')

const teamModalOpen = ref(false)
const teamMode = ref('create')
const teamForm = ref({ id: null, teamName: '', departmentId: null })
const teamError = ref('')

const confirmOpen = ref(false)
const confirmTarget = ref(null) // { kind: 'dept'|'team', id, name }
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    const [depts, ts] = await Promise.all([fetchDepartments(), fetchTeams()])
    departments.value = depts ?? []
    teams.value = ts ?? []
    if (!selectedDeptId.value && departments.value.length > 0) {
      selectedDeptId.value = departments.value[0].departmentId ?? departments.value[0].id
    }
  } catch (e) {
    error('조직 정보를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const deptOptions = computed(() =>
  departments.value.map((d) => ({ label: d.departmentName ?? d.name, value: d.departmentId ?? d.id })),
)

const teamsOfSelected = computed(() =>
  teams.value.filter((t) => String(t.departmentId) === String(selectedDeptId.value)),
)

const selectedDepartment = computed(() =>
  departments.value.find((d) => String(d.departmentId ?? d.id) === String(selectedDeptId.value)),
)

// ── 부서 ─────────────────────────────────────────
function openCreateDept() {
  deptMode.value = 'create'
  deptForm.value = { id: null, name: '' }
  deptError.value = ''
  deptModalOpen.value = true
}

function openEditDept(dept) {
  deptMode.value = 'edit'
  deptForm.value = {
    id: dept.departmentId ?? dept.id,
    name: dept.departmentName ?? dept.name,
  }
  deptError.value = ''
  deptModalOpen.value = true
}

async function saveDept() {
  const name = deptForm.value.name?.trim()
  if (!name) {
    deptError.value = '부서명을 입력하세요.'
    return
  }
  try {
    if (deptMode.value === 'create') {
      await createDepartment({ name })
      success('부서가 생성되었습니다.')
    } else {
      await updateDepartment(deptForm.value.id, { name })
      success('부서명이 수정되었습니다.')
    }
    deptModalOpen.value = false
    await load()
  } catch (e) {
    error(e.response?.data?.message ?? '저장 중 오류가 발생했습니다.')
  }
}

function askDeleteDept(dept) {
  confirmTarget.value = {
    kind: 'dept',
    id: dept.departmentId ?? dept.id,
    name: dept.departmentName ?? dept.name,
  }
  confirmOpen.value = true
}

// ── 팀 ─────────────────────────────────────────
function openCreateTeam() {
  if (!selectedDeptId.value) {
    error('먼저 부서를 선택하세요.')
    return
  }
  teamMode.value = 'create'
  teamForm.value = { id: null, teamName: '', departmentId: selectedDeptId.value }
  teamError.value = ''
  teamModalOpen.value = true
}

function openEditTeam(team) {
  teamMode.value = 'edit'
  teamForm.value = {
    id: team.teamId,
    teamName: team.teamName,
    departmentId: team.departmentId,
  }
  teamError.value = ''
  teamModalOpen.value = true
}

async function saveTeam() {
  const name = teamForm.value.teamName?.trim()
  if (!name) {
    teamError.value = '팀명을 입력하세요.'
    return
  }
  if (!teamForm.value.departmentId) {
    teamError.value = '소속 부서를 선택하세요.'
    return
  }
  try {
    if (teamMode.value === 'create') {
      await createTeam({
        teamName: name,
        departmentId: Number(teamForm.value.departmentId),
      })
      success('팀이 생성되었습니다.')
    } else {
      await updateTeam(teamForm.value.id, {
        teamName: name,
        departmentId: Number(teamForm.value.departmentId),
      })
      success('팀 정보가 수정되었습니다.')
    }
    teamModalOpen.value = false
    await load()
  } catch (e) {
    error(e.response?.data?.message ?? '저장 중 오류가 발생했습니다.')
  }
}

function askDeleteTeam(team) {
  confirmTarget.value = { kind: 'team', id: team.teamId, name: team.teamName }
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!confirmTarget.value) return
  deleting.value = true
  try {
    if (confirmTarget.value.kind === 'dept') {
      await deleteDepartment(confirmTarget.value.id)
      success('부서가 삭제되었습니다.')
      if (String(selectedDeptId.value) === String(confirmTarget.value.id)) {
        selectedDeptId.value = null
      }
    } else {
      await deleteTeam(confirmTarget.value.id)
      success('팀이 삭제되었습니다.')
    }
    confirmOpen.value = false
    await load()
  } catch (e) {
    error(e.response?.data?.message ?? '삭제할 수 없습니다. (소속된 하위 항목이 있을 수 있습니다)')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="py-12 text-center text-sm text-slate-400">
      불러오는 중...
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <!-- 부서 패널 -->
      <div class="rounded-2xl border border-slate-200 bg-white lg:col-span-2">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 class="text-sm font-bold text-ink">부서</h3>
          <BaseButton variant="primary" size="sm" @click="openCreateDept">+ 부서 추가</BaseButton>
        </div>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="dept in departments"
            :key="dept.departmentId ?? dept.id"
            class="flex cursor-pointer items-center gap-2 px-5 py-3 transition hover:bg-slate-50"
            :class="String(dept.departmentId ?? dept.id) === String(selectedDeptId) ? 'bg-slate-50' : ''"
            @click="selectedDeptId = dept.departmentId ?? dept.id"
          >
            <span class="flex-1 text-sm font-medium text-ink">
              {{ dept.departmentName ?? dept.name }}
            </span>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-brand"
              @click.stop="openEditDept(dept)"
            >수정</button>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-rose-500"
              @click.stop="askDeleteDept(dept)"
            >삭제</button>
          </li>
          <li v-if="departments.length === 0" class="px-5 py-8 text-center text-xs text-slate-400">
            부서가 없습니다.
          </li>
        </ul>
      </div>

      <!-- 팀 패널 -->
      <div class="rounded-2xl border border-slate-200 bg-white lg:col-span-3">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 class="text-sm font-bold text-ink">
            {{ selectedDepartment ? `${selectedDepartment.departmentName ?? selectedDepartment.name} · 팀` : '팀' }}
          </h3>
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="!selectedDeptId"
            @click="openCreateTeam"
          >
            + 팀 추가
          </BaseButton>
        </div>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="team in teamsOfSelected"
            :key="team.teamId"
            class="flex items-center gap-2 px-5 py-3"
          >
            <span class="flex-1 text-sm font-medium text-ink">{{ team.teamName }}</span>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-brand"
              @click="openEditTeam(team)"
            >수정</button>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-rose-500"
              @click="askDeleteTeam(team)"
            >삭제</button>
          </li>
          <li v-if="teamsOfSelected.length === 0" class="px-5 py-8 text-center text-xs text-slate-400">
            이 부서에 등록된 팀이 없습니다.
          </li>
        </ul>
      </div>
    </div>

    <!-- 부서 모달 -->
    <BaseModal
      :open="deptModalOpen"
      :title="deptMode === 'create' ? '부서 추가' : '부서 수정'"
      width="max-w-md"
      @close="deptModalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="saveDept">
        <FormField label="부서명" required :error="deptError">
          <BaseTextField v-model="deptForm.name" placeholder="예: 영업부" />
        </FormField>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="deptModalOpen = false">취소</BaseButton>
        <BaseButton variant="primary" @click="saveDept">저장</BaseButton>
      </template>
    </BaseModal>

    <!-- 팀 모달 -->
    <BaseModal
      :open="teamModalOpen"
      :title="teamMode === 'create' ? '팀 추가' : '팀 수정'"
      width="max-w-md"
      @close="teamModalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="saveTeam">
        <FormField label="소속 부서" required>
          <BaseSelect v-model="teamForm.departmentId" :options="deptOptions" placeholder="부서를 선택하세요" />
        </FormField>
        <FormField label="팀명" required :error="teamError">
          <BaseTextField v-model="teamForm.teamName" placeholder="예: 영업1팀" />
        </FormField>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="teamModalOpen = false">취소</BaseButton>
        <BaseButton variant="primary" @click="saveTeam">저장</BaseButton>
      </template>
    </BaseModal>

    <!-- 삭제 확인 -->
    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTarget?.kind === 'dept' ? '부서 삭제' : '팀 삭제'"
      :message="`${confirmTarget?.name} 을(를) 삭제하시겠습니까?`"
      :detail="confirmTarget?.kind === 'dept' ? '소속된 팀/사용자가 있으면 삭제되지 않습니다.' : '소속된 사용자가 있으면 삭제되지 않습니다.'"
      confirm-label="삭제"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
