<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchActivities, fetchAllActivityPOs } from '@/api/activity'
import { fetchPositions, fetchTeams } from '@/api/auth'
import { createPackage, fetchAllUsers, fetchPackageById, updatePackage } from '@/api/package'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'

const router = useRouter()
const route = useRoute()
const { success, warning, error } = useToast()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser ?? null)

function todayKr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function nowSlash() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}/${m}/${day}`
}

// ── 편집 모드 ──────────────────────────────────────────────
const isEditMode = computed(() => !!route.query.edit)
const editId = computed(() => route.query.edit || '')

// ── 데이터 ─────────────────────────────────────────────────
const activities = ref([])
const poList = ref([])
const allUsers = ref([])
const teams = ref([])
const positions = ref([])
const isSaving = ref(false)

onMounted(async () => {
  // Promise.allSettled 로 한 fetch 실패가 다른 데이터 로드를 막지 않게 격리.
  // (이전 Promise.all 은 하나라도 reject 시 teams/users 등 모든 ref 가 빈 채로 남음)
  const settled = await Promise.allSettled([
    fetchActivities(),
    fetchAllActivityPOs(),
    fetchAllUsers(),
    fetchTeams(),
    fetchPositions(),
  ])
  const [actRes, poRes, userRes, teamRes, posRes] = settled
  const failed = []

  if (actRes.status === 'fulfilled') activities.value = Array.isArray(actRes.value) ? actRes.value : []
  else failed.push('activities')

  if (poRes.status === 'fulfilled') poList.value = Array.isArray(poRes.value) ? poRes.value : []
  else failed.push('po')

  if (userRes.status === 'fulfilled') {
    allUsers.value = (Array.isArray(userRes.value) ? userRes.value : []).filter(
      (u) => u.userStatus === 'active' || u.status === 'active' || u.status === '재직',
    )
  } else failed.push('users')

  if (teamRes.status === 'fulfilled') teams.value = Array.isArray(teamRes.value) ? teamRes.value : []
  else failed.push('teams')

  if (posRes.status === 'fulfilled') positions.value = Array.isArray(posRes.value) ? posRes.value : []
  else failed.push('positions')

  if (failed.length > 0) {
    console.error('데이터 로드 부분 실패:', failed, settled.filter(r => r.status === 'rejected').map(r => r.reason))
    error(`일부 데이터를 불러오지 못했습니다 (${failed.join(', ')}). 새로고침해주세요.`)
  }

  if (isEditMode.value) {
    try { await loadPackageForEdit() } catch (e) { console.error('패키지 편집 로드 실패', e) }
  }
})

async function loadPackageForEdit() {
  try {
    const pkg = await fetchPackageById(editId.value)
    packageTitle.value = pkg.packageTitle || ''
    packageDescription.value = pkg.packageDescription || ''
    selectedPoId.value = pkg.poId || ''
    poDisplay.value = pkg.poId || ''
    dateFrom.value = pkg.dateFrom || ''
    dateTo.value = pkg.dateTo || ''
    selectedActivityIds.value = [...(pkg.activityIds || [])]
    selectedViewerIds.value = [...(pkg.viewerIds || [])]
  } catch (e) {
    error(e?.response?.data?.message || '패키지 정보를 불러오지 못했습니다.')
  }
}

const poColumns = [
  { key: 'poId',         label: 'PO번호'  },
  { key: 'issueDate',    label: '등록일'  },
  { key: 'managerName',  label: '담당자명' },
  { key: 'country',      label: '국가'    },
  { key: 'deliveryDate', label: '납기일'  },
]

// ── PO 검색 모달 ───────────────────────────────────────────
const isPoModalOpen = ref(false)
const poSearchKeyword = ref('')
const selectedPoId = ref('')

const filteredPoList = computed(() => {
  let list = poList.value
  // PO 응답 필드는 issueDate(LocalDate ISO: YYYY-MM-DD). YYYY-MM-DD 형식으로 정규화해 비교.
  const norm = (s) => (s ? String(s).slice(0, 10).replaceAll('/', '-') : '')
  const from = norm(dateFrom.value)
  const to = norm(dateTo.value)
  if (from) list = list.filter((p) => norm(p.issueDate ?? p.date) >= from)
  if (to) list = list.filter((p) => norm(p.issueDate ?? p.date) <= to)
  const q = poSearchKeyword.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (p) =>
      String(p.poId ?? '').toLowerCase().includes(q) ||
      (p.clientName ?? '').toLowerCase().includes(q),
  )
})

function selectPo(po) {
  selectedPoId.value = po.poId
  poDisplay.value = po.poId
  isPoModalOpen.value = false
  poSearchKeyword.value = ''
}

function clearPo() {
  selectedPoId.value = ''
  poDisplay.value = ''
  selectedActivityIds.value = []
}

// ── 패키지 생성 폼 상태 ────────────────────────────────────
const packageTitle = ref('')
const packageDescription = ref('')
const keyword     = ref('')
const poDisplay   = ref('')
const dateFrom    = ref('')
const dateTo      = ref('')

// ── 열람 권한 ──────────────────────────────────────────────
const selectedViewerIds = ref([])
const viewerSearchQuery = ref('')
const viewerTeamFilter = ref('')

// 백엔드 Team 응답은 teamId / teamName 필드. Position 도 동일.
const teamNameById = computed(() => new Map(
  teams.value.map(t => [String(t.teamId ?? t.id), t.teamName ?? t.name])
))
const positionNameById = computed(() => new Map(
  positions.value.map(p => [String(p.positionId ?? p.id), p.positionName ?? p.name])
))

// BaseSelect 가 placeholder 옵션을 자체적으로 렌더하므로 첫 행에 별도 "전체 팀" 추가하지 않음.
// (중복 "전체 팀" 옵션 표시 방지)
const teamOptions = computed(() => teams.value.map((t) => ({
  label: t.teamName ?? t.name,
  value: String(t.teamId ?? t.id),
})))

const filteredUsers = computed(() => {
  const q = viewerSearchQuery.value.trim().toLowerCase()
  const meId = String(currentUser.value?.userId ?? currentUser.value?.id ?? '')
  let userList = allUsers.value.filter((u) => String(u.userId ?? u.id) !== meId)
  if (viewerTeamFilter.value) {
    userList = userList.filter((u) => String(u.teamId) === viewerTeamFilter.value)
  }
  if (!q) return userList
  return userList.filter((u) =>
    (u.userName ?? u.name ?? '').toLowerCase().includes(q) ||
    (u.employeeNo ?? '').includes(q) ||
    (u.userEmail ?? u.email ?? '').toLowerCase().includes(q),
  )
})

const groupedUsers = computed(() => {
  const groups = new Map()
  for (const user of filteredUsers.value) {
    const teamId = String(user.teamId ?? '')
    const teamName = teamNameById.value.get(teamId) || '기타'
    if (!groups.has(teamId)) groups.set(teamId, { teamId, teamName, users: [] })
    groups.get(teamId).users.push(user)
  }
  return [...groups.values()]
})

const isAllViewersSelected = computed(() =>
  filteredUsers.value.length > 0 &&
  filteredUsers.value.every((u) => selectedViewerIds.value.includes(String(u.userId ?? u.id))),
)

function isTeamAllSelected(users) {
  return users.length > 0 && users.every((u) => selectedViewerIds.value.includes(String(u.userId ?? u.id)))
}

function toggleViewer(userId) {
  const id = String(userId)
  if (selectedViewerIds.value.includes(id)) {
    selectedViewerIds.value = selectedViewerIds.value.filter((v) => v !== id)
  } else {
    selectedViewerIds.value = [...selectedViewerIds.value, id]
  }
}

function toggleAllViewers(checked) {
  const ids = filteredUsers.value.map((u) => String(u.userId ?? u.id))
  if (checked) {
    selectedViewerIds.value = [...new Set([...selectedViewerIds.value, ...ids])]
  } else {
    selectedViewerIds.value = selectedViewerIds.value.filter((id) => !ids.includes(id))
  }
}

function toggleTeamViewers(users, checked) {
  const ids = users.map((u) => String(u.userId ?? u.id))
  if (checked) {
    selectedViewerIds.value = [...new Set([...selectedViewerIds.value, ...ids])]
  } else {
    selectedViewerIds.value = selectedViewerIds.value.filter((id) => !ids.includes(id))
  }
}

// ── 유효성 검사 ────────────────────────────────────────────
const errors = ref({})

watch(packageTitle, (val) => { if (val) errors.value.title = undefined })
watch(poDisplay,  (val) => { if (val) errors.value.po       = undefined })
watch(dateFrom,   (val) => { if (val) errors.value.dateFrom = undefined })
watch(dateTo,     (val) => { if (val) errors.value.dateTo   = undefined })

function validate() {
  const e = {}
  if (!packageTitle.value.trim()) e.title = '패키지 제목을 입력해주세요.'
  if (!poDisplay.value)  e.po       = '수주건 값이 누락되었습니다.'
  // dateFrom/dateTo 는 더 이상 필수 아님. 기간은 활동기록 필터링에만 쓰이고,
  // 사용자가 이미 활동을 직접 선택했으면 기간 공란이어도 문제 없음. 다만 한쪽만 입력된
  // 경우에는 여전히 문제가 되므로 "둘 다 공란 OR 둘 다 입력" 중 하나만 허용.
  const hasFrom = !!dateFrom.value
  const hasTo = !!dateTo.value
  if (hasFrom !== hasTo) {
    if (!hasFrom) e.dateFrom = '기간 시작일을 입력하거나 종료일을 비워주세요.'
    if (!hasTo)   e.dateTo   = '기간 종료일을 입력하거나 시작일을 비워주세요.'
  }
  if (hasFrom && hasTo && dateFrom.value > dateTo.value) {
    e.dateTo = '종료일은 시작일 이후여야 합니다.'
  }
  if (selectedViewerIds.value.length === 0) e.viewers = '열람 권한을 1명 이상 선택해주세요.'
  if (selectedActivityIds.value.length === 0) e.activities = '활동기록을 1건 이상 선택해주세요.'
  errors.value = e
  return Object.keys(e).length === 0
}

// ── 활동기록 필터 ──────────────────────────────────────────
const actDateFrom = ref('')
const actDateTo   = ref(todayKr())
const activeTypeTab = ref('전체')

const typeTabs = [
  { key: '전체',     label: '전체'     },
  { key: 'meeting',  label: '미팅/협의' },
  { key: 'issue',    label: '이슈'     },
  { key: 'memo',     label: '메모/노트' },
  { key: 'schedule', label: '일정'     },
]

const selectedActivityIds = ref([])

function normalizeDate(value) {
  return value ? String(value).slice(0, 10).replaceAll('/', '-') : ''
}

function activityRowId(activity) {
  return activity?.id ?? activity?.activityId
}

function activityTypeOf(activity) {
  return activity?.type ?? activity?.activityType
}

function isActivitySelected(id) {
  return selectedActivityIds.value.some((selectedId) => String(selectedId) === String(id))
}

// 탭/필터와 무관하게 실제 선택된 활동기록 전체
const selectedActivities = computed(() => {
  const ids = new Set(selectedActivityIds.value.map((id) => String(id)))
  return activities.value.filter((a) => ids.has(String(activityRowId(a))))
})

const includedTypes = computed(() =>
  [...new Set(selectedActivities.value.map(activityTypeOf).filter(Boolean))],
)

const filteredActivities = computed(() => {
  if (!selectedPoId.value) return []
  let list = activities.value.filter((a) => a.poId === selectedPoId.value)
  if (activeTypeTab.value !== '전체') {
    list = list.filter((a) => activityTypeOf(a) === activeTypeTab.value)
  }
  if (keyword.value.trim()) {
    const q = keyword.value.trim().toLowerCase()
    list = list.filter((a) =>
      (a.title ?? a.activityTitle ?? '').toLowerCase().includes(q) ||
      (a.content ?? a.activityContent ?? '').toLowerCase().includes(q),
    )
  }
  const aFrom = normalizeDate(actDateFrom.value)
  const aTo   = normalizeDate(actDateTo.value)
  if (aFrom) list = list.filter((a) => normalizeDate(a.date ?? a.activityDate) >= aFrom)
  if (aTo)   list = list.filter((a) => normalizeDate(a.date ?? a.activityDate) <= aTo)
  return list
})

// 활동기록 기간 변경 시 필터 결과 전체 선택 (편집 모드에서는 초기 로드 시 건너뜀)
const initialLoadDone = ref(false)

watch([actDateFrom, actDateTo], async () => {
  if (isEditMode.value && !initialLoadDone.value) {
    initialLoadDone.value = true
    return
  }
  await nextTick()
  selectedActivityIds.value = filteredActivities.value.map(activityRowId).filter((id) => id != null)
})

// PO 변경 시 전체 선택으로 리셋 (편집 모드 초기 로드 제외)
const poInitialLoadDone = ref(false)

watch(selectedPoId, async () => {
  if (isEditMode.value && !poInitialLoadDone.value) {
    poInitialLoadDone.value = true
    return
  }
  await nextTick()
  selectedActivityIds.value = filteredActivities.value.map(activityRowId).filter((id) => id != null)
})

const isAllSelected = computed(() =>
  filteredActivities.value.length > 0 &&
  filteredActivities.value.every((a) => isActivitySelected(activityRowId(a))),
)

function toggleAll(checked) {
  const ids = filteredActivities.value.map(activityRowId).filter((id) => id != null)
  if (checked) {
    selectedActivityIds.value = [...new Set([...selectedActivityIds.value, ...ids])]
  } else {
    const visibleIds = new Set(ids.map((id) => String(id)))
    selectedActivityIds.value = selectedActivityIds.value.filter((id) => !visibleIds.has(String(id)))
  }
}

function toggleActivity(id) {
  if (isActivitySelected(id)) {
    selectedActivityIds.value = selectedActivityIds.value.filter((v) => String(v) !== String(id))
  } else {
    selectedActivityIds.value = [...selectedActivityIds.value, id]
  }
}

// ── 미리보기 요약 ──────────────────────────────────────────
const summaryText = computed(() => {
  if (selectedActivities.value.length === 0) return '활동기록 목록에서 항목을 선택하면 포함 건수가 표시됩니다.'
  const countByType = selectedActivities.value.reduce((acc, a) => {
    const type = activityTypeOf(a)
    if (!type) return acc
    acc[type] = (acc[type] ?? 0) + 1
    return acc
  }, {})
  const parts = Object.entries(countByType).map(([type, count]) => `${type} ${count}건`)
  return `미리보기: ${parts.join(', ')}이 포함됩니다.`
})

// ── 저장 ───────────────────────────────────────────────────
async function savePackage() {
  if (!validate()) {
    // 구체적 누락 필드를 토스트에 노출 — "입력 내용을 확인해주세요" 만으로는
    // 사용자가 뭘 빠뜨렸는지 몰라 재시도가 어려웠음 (2026-04-21 시연 피드백).
    const messages = Object.values(errors.value).filter(Boolean)
    warning(messages.length ? messages.join(' / ') : '입력 내용을 확인해주세요.')
    return
  }

  isSaving.value = true

  const viewerNames = selectedViewerIds.value.map((vid) => {
    const u = allUsers.value.find((u) => String(u.id) === String(vid))
    return u?.name || '-'
  })

  const payload = {
    packageTitle: packageTitle.value.trim(),
    packageDescription: packageDescription.value.trim(),
    poId: selectedPoId.value,
    dateFrom: dateFrom.value || null,
    dateTo: dateTo.value || null,
    activityIds: selectedActivityIds.value.map(Number).filter(Number.isFinite),
    viewerIds: selectedViewerIds.value.map(Number).filter(Number.isFinite),
  }

  try {
    let nextRoute = '/'
    if (isEditMode.value) {
      delete payload.createdAt
      await updatePackage(editId.value, payload)
      success('패키지가 수정되었습니다.')
    } else {
      // 이전엔 클라이언트가 "PKG..." prefix id 를 추가로 보냈는데, 백엔드
      // ActivityPackageCreateRequest 레코드엔 해당 필드가 없고 PK 는 DB auto.
      // Jackson strict 설정에서 이 알 수 없는 필드가 400 을 유발해 저장이 실패하던
      // 문제(G6). id 를 보내지 않도록 정리.
      const savedPackage = await createPackage(payload)
      const savedPackageId = savedPackage?.packageId ?? savedPackage?.id
      if (savedPackageId) {
        nextRoute = { path: '/', query: { createdPackageId: String(savedPackageId) } }
      }
      success('패키지가 저장되었습니다.')
    }
    router.push(nextRoute)
  } catch (e) {
    // 서버 400/403 메시지를 토스트에 그대로 노출해 디버깅 가능.
    error(e?.response?.data?.message || '패키지 저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 페이지 타이틀 -->
    <DocumentPageHeader title="활동기록 패키지" icon-class="fas fa-cube">
      <template #actions>
        <BaseButton variant="secondary" @click="router.push('/activities')">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd" />
            </svg>
          </template>
          기록 관리
        </BaseButton>
      </template>
    </DocumentPageHeader>

    <!-- 본문 2컬럼 그리드 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">

      <!-- ── 좌측: 패키지 생성 폼 ──────────────────────────── -->
      <div class="lg:col-span-2">
        <BaseCard :title="isEditMode ? '패키지 수정' : '패키지 작성'">
          <div class="space-y-5">

            <!-- 패키지 제목 -->
            <div class="space-y-1.5">
              <p class="text-sm font-semibold text-slate-700">
                패키지 제목 <span class="text-red-500">*</span>
              </p>
              <BaseTextField
                v-model="packageTitle"
                placeholder="패키지 제목을 입력하세요"
                :class="errors.title ? 'border-red-400' : ''"
              />
              <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
            </div>

            <!-- 설명 -->
            <div class="space-y-1.5">
              <p class="text-sm font-semibold text-slate-700">설명</p>
              <BaseTextarea
                v-model="packageDescription"
                placeholder="패키지에 대한 설명을 입력하세요 (선택)"
                :rows="3"
              />
            </div>

            <!-- 수주건 (PO) -->
            <div class="space-y-1.5">
              <p class="text-sm font-semibold text-slate-700">
                수주건 <span class="text-red-500">*</span>
              </p>
              <div class="flex items-center gap-2">
                <BaseTextField
                  v-model="poDisplay"
                  placeholder="수주건을 선택하세요 (PO 검색 클릭)"
                  :readonly="true"
                  class="flex-1"
                  :class="errors.po ? 'border-red-400' : ''"
                />
                <BaseButton variant="ghost" @click="isPoModalOpen = true">
                  <template #leading>
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.766l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clip-rule="evenodd" />
                    </svg>
                  </template>
                  PO 검색
                </BaseButton>
                <BaseButton variant="secondary" @click="clearPo">
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </BaseButton>
              </div>
              <p v-if="errors.po" class="mt-1 text-xs text-red-500">{{ errors.po }}</p>
            </div>

            <!-- 포함 항목 -->
            <div class="space-y-2">
              <p class="text-sm font-semibold text-slate-700">포함 항목</p>
              <div
                v-if="includedTypes.length > 0"
                class="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <ActivityTypeBadge v-for="type in includedTypes" :key="type" :value="type" />
              </div>
              <div v-else class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-400">
                우측 활동기록 목록에서 항목을 선택하면 여기에 표시됩니다.
              </div>
            </div>

            <!-- 열람 권한 -->
            <div class="space-y-2">
              <p class="text-sm font-semibold text-slate-700">
                열람 권한 <span class="text-red-500">*</span>
                <span v-if="selectedViewerIds.length > 0" class="ml-2 text-xs font-normal text-brand-600">
                  {{ selectedViewerIds.length }}명 선택됨
                </span>
              </p>
              <!-- 검색 + 팀 필터 -->
              <div class="flex gap-2">
                <BaseTextField
                  v-model="viewerSearchQuery"
                  placeholder="사번 · 이름 · 이메일로 검색"
                  class="flex-1"
                />
                <div class="w-36 shrink-0">
                  <BaseSelect
                    v-model="viewerTeamFilter"
                    :options="teamOptions"
                    placeholder="전체 팀"
                  />
                </div>
              </div>
              <div class="max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div
                  v-if="filteredUsers.length === 0"
                  class="py-4 text-center text-xs text-slate-400"
                >
                  검색 결과가 없습니다.
                </div>
                <template v-else>
                  <!-- 전체선택 -->
                  <label class="mb-1.5 flex cursor-pointer items-center gap-2 rounded-md border-b border-slate-200 px-2 pb-2 pt-1 transition hover:bg-slate-100">
                    <input
                      type="checkbox"
                      class="rounded border-slate-300 text-brand-500"
                      :checked="isAllViewersSelected"
                      @change="toggleAllViewers($event.target.checked)"
                    />
                    <span class="text-xs font-semibold text-slate-600">전체선택</span>
                  </label>
                  <!-- 팀별 트리 -->
                  <div v-for="group in groupedUsers" :key="group.teamId" class="mb-1.5">
                    <!-- 팀 헤더 -->
                    <label class="flex cursor-pointer items-center gap-2 rounded-md bg-slate-100 px-2 py-1.5 transition hover:bg-slate-200">
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-brand-500"
                        :checked="isTeamAllSelected(group.users)"
                        @change="toggleTeamViewers(group.users, $event.target.checked)"
                      />
                      <span class="text-xs font-bold text-slate-700">{{ group.teamName }}</span>
                      <span class="ml-auto text-xs text-slate-400">{{ group.users.length }}명</span>
                    </label>
                    <!-- 사용자 행 -->
                    <label
                      v-for="user in group.users"
                      :key="user.userId ?? user.id"
                      class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 pl-6 transition hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-brand-500"
                        :checked="selectedViewerIds.includes(String(user.userId ?? user.id))"
                        @change="toggleViewer(user.userId ?? user.id)"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="text-sm text-slate-700">
                          <span class="mr-1.5 text-xs text-slate-400">{{ user.employeeNo }}</span>
                          {{ user.userName ?? user.name }}
                        </p>
                        <p class="truncate text-xs text-slate-400">{{ user.userEmail ?? user.email ?? '' }}</p>
                      </div>
                      <span class="ml-auto shrink-0 text-xs text-slate-400">{{ positionNameById.get(String(user.positionId)) || '' }}</span>
                    </label>
                  </div>
                </template>
              </div>
              <p v-if="errors.viewers" class="mt-1 text-xs text-red-500">{{ errors.viewers }}</p>
            </div>

            <!-- 미리보기 요약 -->
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              {{ summaryText }}
            </div>
            <p v-if="errors.activities" class="text-xs text-red-500">{{ errors.activities }}</p>

            <!-- 저장 버튼 -->
            <BaseButton :block="true" :disabled="isSaving" @click="savePackage">
              <template #leading>
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
              </template>
              {{ isEditMode ? '패키지 수정' : '패키지 작성' }}
            </BaseButton>

          </div>
        </BaseCard>
      </div>

      <!-- ── 우측: 활동기록 목록 ─────────────────────────────── -->
      <div>
        <BaseCard title="활동기록 목록">
          <!-- 키워드 필터 -->
          <div class="mb-3 space-y-1.5">
            <p class="text-xs font-semibold text-slate-600">키워드 필터</p>
            <BaseTextField
              v-model="keyword"
              placeholder="활동 제목 또는 내용 일부"
            />
          </div>

          <!-- 활동기록 기간 필터 -->
          <div class="mb-3 space-y-1.5">
            <p class="text-xs font-semibold text-slate-600">기간 필터</p>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
              <DateField v-model="actDateFrom" />
              <span class="text-center text-xs text-slate-400">~</span>
              <DateField v-model="actDateTo" />
            </div>
            <div class="flex justify-end">
              <BaseButton variant="secondary" size="sm" @click="actDateFrom = ''; actDateTo = todayKr()">초기화</BaseButton>
            </div>
          </div>

          <!-- 전체 선택 -->
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-slate-400">
              {{ filteredActivities.length }}건
            </span>
            <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                class="rounded border-slate-300 text-brand-500"
                :checked="isAllSelected"
                @change="toggleAll($event.target.checked)"
              />
              전체 선택
            </label>
          </div>

          <!-- 유형 필터 탭 -->
          <div class="mb-3 border-b border-slate-200">
            <div class="flex items-center gap-1 overflow-x-auto">
              <button
                v-for="tab in typeTabs"
                :key="tab.key"
                type="button"
                class="border-b-2 px-3 py-2 text-xs font-semibold transition whitespace-nowrap"
                :class="activeTypeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-700'"
                @click="activeTypeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- 활동기록 목록 -->
          <div class="max-h-[420px] space-y-2 overflow-y-auto">
            <div
              v-if="filteredActivities.length === 0"
              class="py-8 text-center text-xs text-slate-400"
            >
              조건에 맞는 활동기록이 없습니다.
            </div>
            <div
              v-for="activity in filteredActivities"
              :key="activityRowId(activity)"
              class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:bg-slate-100"
            >
              <input
                type="checkbox"
                class="rounded border-slate-300 text-brand-500"
                :checked="isActivitySelected(activityRowId(activity))"
                @change="toggleActivity(activityRowId(activity))"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <ActivityTypeBadge :value="activityTypeOf(activity)" />
                  <span class="truncate text-sm font-medium text-slate-700">{{ activity.title ?? activity.activityTitle }}</span>
                </div>
                <p class="mt-0.5 text-xs text-slate-400">{{ activity.date ?? activity.activityDate }} · {{ activity.author ?? activity.authorName }}</p>
              </div>
            </div>
          </div>

          <!-- 선택 건수 -->
          <p v-if="selectedActivityIds.length > 0" class="mt-2 text-right text-xs font-medium text-brand-600">
            {{ selectedActivityIds.length }}건 선택됨
          </p>
        </BaseCard>
      </div>

    </div>
    <!-- PO 검색 모달 -->
    <SearchModal
      :open="isPoModalOpen"
      title="수주건 (PO) 검색"
      row-key="poId"
      :columns="poColumns"
      :rows="filteredPoList"
      :search-keyword="poSearchKeyword"
      :empty-text="dateFrom ? '검색된 PO가 없습니다.' : '기간을 먼저 설정해주세요.'"
      @close="isPoModalOpen = false"
      @update:search-keyword="poSearchKeyword = $event"
      @select="selectPo"
    >
      <template #filter>
        <div class="space-y-1.5">
          <p class="text-sm font-semibold text-slate-700">기간</p>
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <DateField v-model="dateFrom" />
            <span class="text-center text-sm text-slate-400">~</span>
            <DateField v-model="dateTo" />
          </div>
          <div class="flex justify-end">
            <BaseButton variant="secondary" size="sm" @click="dateFrom = ''; dateTo = ''">기간 초기화</BaseButton>
          </div>
        </div>
      </template>
    </SearchModal>

  </div>
</template>
