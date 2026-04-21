<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchActivity, fetchActivities, fetchAllActivityPOs, deleteActivity, updateActivity } from '@/api/activity'
import { fetchClients } from '@/api/master'
import { useToast } from '@/composables/useToast'
import ActivityDetailModal from '@/components/domain/activity/ActivityDetailModal.vue'
import ActivityEditModal from '@/components/domain/activity/ActivityEditModal.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import TableActions from '@/components/common/TableActions.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import { label, PI_PO_STATUS_LABEL } from '@/utils/enumLabels'

const router = useRouter()
const route = useRoute()
const { success, error } = useToast()

// ── 필터 상태 ──────────────────────────────────────────────
const isFilterOpen = ref(false)
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterAuthor = ref('')
const filterPo = ref('')
const filterType = ref('')
const filterTitle = ref('')
const poSearchOpen = ref(false)
const poSearchKeyword = ref('')

const typeOptions = [
  { label: '미팅/협의', value: 'meeting' },
  { label: '이슈', value: 'issue' },
  { label: '메모/노트', value: 'memo' },
  { label: '일정', value: 'schedule' },
]

const authorOptions = computed(() => {
  const unique = [...new Set(activities.value.map((a) => a.author).filter(Boolean))]
  return unique.map((a) => ({ label: a, value: a }))
})

const clientOptions = computed(() => {
  return clients.value.map((c) => ({ label: `${c.clientName} (${c.clientNameKr})`, value: c.clientId }))
})

// 실제 적용된 필터 (검색 버튼 클릭 시에만 반영)
const applied = ref({ title: '', dateFrom: '', dateTo: '', author: '', po: '', type: '' })
const poSearchColumns = [
  { key: 'id', label: 'PO 번호', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'left', width: '220px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'status', label: '상태', align: 'center', width: '110px' },
]

function applySearch() {
  applied.value = {
    title:    filterTitle.value,
    dateFrom: filterDateFrom.value,
    dateTo:   filterDateTo.value,
    author:   filterAuthor.value,
    po:       filterPo.value,
    type:     filterType.value,
  }
}

function resetFilters() {
  filterDateFrom.value = ''
  filterDateTo.value   = ''
  filterAuthor.value   = ''
  filterPo.value       = ''
  filterType.value     = ''
  filterTitle.value    = ''
  applied.value = { title: '', dateFrom: '', dateTo: '', author: '', po: '', type: '' }
}

// ── 데이터 ─────────────────────────────────────────────────
const activities = ref([])
const clients = ref([])
const purchaseOrders = ref([])

function activityIdOf(activity) {
  return activity?.id ?? activity?.activityId
}

function upsertActivity(activity) {
  const activityId = activityIdOf(activity)
  if (!activityId) return
  const exists = activities.value.some((row) => String(activityIdOf(row)) === String(activityId))
  activities.value = exists
    ? activities.value.map((row) => String(activityIdOf(row)) === String(activityId) ? activity : row)
    : [activity, ...activities.value]
}

async function ensureCreatedActivityVisible() {
  const rawId = Array.isArray(route.query.createdActivityId)
    ? route.query.createdActivityId[0]
    : route.query.createdActivityId
  if (!rawId) return
  const existing = activities.value.find((activity) => String(activityIdOf(activity)) === String(rawId))
  if (existing) {
    openDetail(existing)
    return
  }
  try {
    const activity = await fetchActivity(rawId)
    upsertActivity(activity)
    openDetail(activity)
  } catch (e) {
    console.error('생성 기록 상세 로드 실패', e)
  }
}

async function loadActivities() {
  try {
    activities.value = await fetchActivities()
  } catch (e) {
    console.error('기록 목록 로드 실패', e)
    error('기록 목록을 불러오지 못했습니다.')
  }
}

onMounted(async () => {
  try {
    const [activityData, clientData, poData] = await Promise.all([
      fetchActivities(),
      fetchClients(),
      fetchAllActivityPOs().catch(() => []),
    ])
    activities.value = activityData
    clients.value = clientData
    purchaseOrders.value = poData
    await ensureCreatedActivityVisible()
  } catch (e) {
    console.error('데이터 로드 실패', e)
    error('데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.')
  }
})

const poRows = computed(() => {
  const rows = purchaseOrders.value.map((po) => ({
    id: po.poId ?? po.id ?? po.poCode ?? '',
    clientName: po.clientName ?? '-',
    issueDate: po.issueDate ?? '-',
    status: label(PI_PO_STATUS_LABEL, String(po.status ?? '').toLowerCase()),
  })).filter((po) => po.id)

  const keyword = poSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return rows
  return rows.filter((row) => [
    row.id,
    row.clientName,
    row.issueDate,
    row.status,
  ].some((value) => String(value ?? '').toLowerCase().includes(keyword)))
})

function openPoSearch() {
  poSearchKeyword.value = ''
  poSearchOpen.value = true
}

function handlePoSelect(row) {
  filterPo.value = row.id
  poSearchKeyword.value = ''
  poSearchOpen.value = false
}

// ── 필터 computed (applied 기준) ───────────────────────────
const clientMap = computed(() =>
  Object.fromEntries(clients.value.map((c) => [c.clientId, c])),
)

function normalizeDate(value) {
  return value ? String(value).slice(0, 10).replaceAll('/', '-') : ''
}

const filteredActivities = computed(() => {
  return activities.value.filter((a) => {
    const client = clientMap.value[a.clientId]
    const matchType   = !applied.value.type   || a.type === applied.value.type
    const matchTitle  = !applied.value.title  || (a.title ?? '').includes(applied.value.title)
      || (client?.clientName ?? '').includes(applied.value.title) || (client?.clientNameKr ?? '').includes(applied.value.title)
    const matchAuthor = !applied.value.author || a.author === applied.value.author
    const matchPo     = !applied.value.po     || (a.poId ?? '').includes(applied.value.po)
    const dateFrom = normalizeDate(applied.value.dateFrom)
    const dateTo   = normalizeDate(applied.value.dateTo)
    const activityDate = normalizeDate(a.date ?? a.activityDate)
    const matchFrom   = !dateFrom || activityDate >= dateFrom
    const matchTo     = !dateTo   || activityDate <= dateTo
    return matchType && matchTitle && matchAuthor && matchPo && matchFrom && matchTo
  })
})

// ── 페이지네이션 ────────────────────────────────────────────
const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredActivities.value.length / PAGE_SIZE)))
const paginatedActivities = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredActivities.value.slice(start, start + PAGE_SIZE)
})

// 필터 변경 시 첫 페이지로 리셋
watch(filteredActivities, () => { currentPage.value = 1 })

// ── 상세 모달 ──────────────────────────────────────────────
const selectedActivity = ref(null)
const isDetailOpen = ref(false)

function openDetail(activity) {
  const client = clientMap.value[activity.clientId]
  selectedActivity.value = {
    ...activity,
    client: client ? `${client.clientName} (${client.clientNameKr})` : '-',
  }
  isDetailOpen.value = true
}

function closeDetail() {
  isDetailOpen.value = false
  selectedActivity.value = null
}

// ── 수정 모달 ──────────────────────────────────────────────
const editActivity = ref(null)
const isEditOpen = ref(false)

function openEdit(activity) {
  editActivity.value = activity
  isDetailOpen.value = false
  isEditOpen.value = true
}

function closeEdit() {
  isEditOpen.value = false
  editActivity.value = null
}

const isSaving = ref(false)

async function handleSave(updated) {
  if (isSaving.value) return
  const activityId = activityIdOf(editActivity.value)
  if (!activityId) return
  isSaving.value = true
  try {
    await updateActivity(activityId, updated)
    // 이전엔 폼 payload 를 로컬 row 에 spread 해서 type/author 등 서버 가공값이
    // 덮이지 않아 목록이 stale 로 보임. 서버 응답을 신뢰하기 위해 목록 재fetch.
    await loadActivities()
    success('기록이 수정되었습니다.')
    closeEdit()
  } catch (e) {
    console.error('기록 수정 실패', e)
    error(e?.response?.data?.message || '기록 수정에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isSaving.value = false
  }
}

// ── 삭제 확인 모달 ─────────────────────────────────────────
const deleteTarget = ref(null)
const isDeleteOpen = ref(false)

function openDelete(activity) {
  deleteTarget.value = activity
  isDeleteOpen.value = true
}

function closeDelete() {
  isDeleteOpen.value = false
  deleteTarget.value = null
}

const isDeleting = ref(false)

async function handleDelete() {
  if (isDeleting.value) return
  const targetId = activityIdOf(deleteTarget.value)
  if (!targetId) return
  isDeleting.value = true
  try {
    await deleteActivity(targetId)
    activities.value = activities.value.filter((a) => String(activityIdOf(a)) !== String(targetId))
    success('기록이 삭제되었습니다.')
    closeDelete()
  } catch (e) {
    console.error('기록 삭제 실패', e)
    error(e?.response?.data?.message || '기록 삭제에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isDeleting.value = false
  }
}

// ── 테이블 컬럼 ────────────────────────────────────────────
const columns = [
  { key: 'index', label: '항목', width: '64px', align: 'center' },
  { key: 'type', label: '유형', width: '120px' },
  { key: 'title', label: '제목', width: '302px' },
  { key: 'poId', label: 'PO', width: '130px', align: 'center' },
  { key: 'date', label: '날짜', width: '110px', align: 'center' },
  { key: 'author', label: '작성자', width: '100px' },
  { key: 'actions', label: '', width: '70px', align: 'center', sortable: false },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <DocumentPageHeader title="기록 관리" icon-class="fas fa-list-check">
      <template #actions>
        <BaseButton @click="router.push('/activities/manage')">
          <template #leading>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </template>
          기록 등록
        </BaseButton>
      </template>
    </DocumentPageHeader>

    <!-- 키워드 검색 + 상세검색 토글. Enter 로 검색 적용 (ItemListPage 와 동일 패턴) -->
    <div @keyup.enter="applySearch">
      <FilterToolbarCard
        v-model="filterTitle"
        placeholder="제목 검색..."
        :advanced-open="isFilterOpen"
        @toggle-advanced="isFilterOpen = !isFilterOpen"
      />
    </div>

    <!-- 상세검색 패널 -->
    <CollapsibleFilterCard :open="isFilterOpen" @toggle="isFilterOpen = !isFilterOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <FormField label="날짜 기간" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filterDateFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filterDateTo" />
          </div>
        </FormField>

        <FormField label="작성자">
          <SearchableCombobox
            v-model="filterAuthor"
            :options="authorOptions"
            placeholder="작성자 검색..."
          />
        </FormField>

        <FormField label="PO">
          <SearchTriggerField
            v-model="filterPo"
            placeholder="PO 검색..."
            title="PO 검색"
            @trigger="openPoSearch"
          />
        </FormField>

        <FormField label="유형">
          <SearchableCombobox
            v-model="filterType"
            :options="typeOptions"
            placeholder="유형 선택..."
          />
        </FormField>
      </div>

      <div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">
          <template #leading>
            <i class="fas fa-undo text-xs" aria-hidden="true"></i>
          </template>
          초기화
        </BaseButton>
        <BaseButton size="sm" @click="applySearch">
          <template #leading>
            <i class="fas fa-search text-xs" aria-hidden="true"></i>
          </template>
          검색
        </BaseButton>
      </div>
    </CollapsibleFilterCard>

    <!-- 테이블 -->
    <div>
      <BaseTable :columns="columns" :rows="paginatedActivities" row-key="id" class="cursor-pointer" :footer-text="`총 ${filteredActivities.length}건`" @row-click="openDetail">
        <!-- 항목 번호 -->
        <template #cell-index="{ row }">
          <span class="text-xs font-medium text-slate-500">
            {{ filteredActivities.findIndex((a) => a.id === row.id) + 1 }}
          </span>
        </template>

        <!-- 유형 배지 -->
        <template #cell-type="{ row }">
          <ActivityTypeBadge :value="row.type" />
        </template>

        <!-- 제목 -->
        <template #cell-title="{ row }">
          <span class="font-medium text-slate-800">{{ row.title }}</span>
        </template>

        <!-- PO -->
        <template #cell-poId="{ row }">
          <span v-if="row.poId" class="text-slate-800">{{ row.poId }}</span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- 작업 버튼 -->
        <template #cell-actions="{ row }">
          <div @click.stop>
            <TableActions @edit="openEdit(row)" @delete="openDelete(row)" />
          </div>
        </template>
      </BaseTable>

      <!-- 페이지네이션 -->
      <div class="mt-4">
        <BasePagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
        />
      </div>
    </div>

    <!-- 상세 모달 -->
    <ActivityDetailModal
      :open="isDetailOpen"
      :activity="selectedActivity ?? {}"
      @close="closeDetail"
    />

    <!-- 수정 모달 -->
    <ActivityEditModal
      :open="isEditOpen"
      :activity="editActivity ?? {}"
      @close="closeEdit"
      @save="handleSave"
    />

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :open="isDeleteOpen"
      title="기록 삭제"
      message="아래 기록을 삭제하시겠습니까?"
      :detail="deleteTarget?.title"
      confirm-label="삭제"
      confirm-variant="danger"
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="closeDelete"
    />

    <SearchModal
      :open="poSearchOpen"
      title="PO 검색"
      :columns="poSearchColumns"
      :rows="poRows"
      row-key="id"
      v-model:search-keyword="poSearchKeyword"
      @select="handlePoSelect"
      @close="poSearchOpen = false"
    />
  </div>
</template>
