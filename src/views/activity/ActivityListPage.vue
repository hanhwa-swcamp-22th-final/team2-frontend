<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchActivities, fetchActivityClients, deleteActivity, updateActivity } from '@/api/activity'
import { useToast } from '@/composables/useToast'
import ActivityDetailModal from '@/components/domain/activity/ActivityDetailModal.vue'
import ActivityEditModal from '@/components/domain/activity/ActivityEditModal.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DateRangeField from '@/components/common/DateRangeField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import TableActions from '@/components/common/TableActions.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'

const router = useRouter()
const { error } = useToast()

// ── 필터 상태 ──────────────────────────────────────────────
const isFilterOpen = ref(false)
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterAuthor = ref('')
const filterPo = ref('')
const filterType = ref('')
const filterTitle = ref('')

const typeOptions = [
  { label: '미팅/협의', value: '미팅/협의' },
  { label: '이슈', value: '이슈' },
  { label: '메모/노트', value: '메모/노트' },
  { label: '코멘트', value: '코멘트' },
  { label: '일정', value: '일정' },
]

const authorOptions = computed(() => {
  const unique = [...new Set(activities.value.map((a) => a.author).filter(Boolean))]
  return unique.map((a) => ({ label: a, value: a }))
})

const clientOptions = computed(() => {
  return clients.value.map((c) => ({ label: `${c.name} (${c.nameKr})`, value: c.id }))
})

// 실제 적용된 필터 (검색 버튼 클릭 시에만 반영)
const applied = ref({ title: '', dateFrom: '', dateTo: '', author: '', po: '', type: '' })

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

onMounted(async () => {
  try {
    const [activityData, clientData] = await Promise.all([
      fetchActivities(),
      fetchActivityClients(),
    ])
    activities.value = activityData
    clients.value = clientData
  } catch (e) {
    console.error('데이터 로드 실패', e)
    error('데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.')
  }
})

// ── 필터 computed (applied 기준) ───────────────────────────
const clientMap = computed(() =>
  Object.fromEntries(clients.value.map((c) => [c.id, c])),
)

const filteredActivities = computed(() => {
  return activities.value.filter((a) => {
    const client = clientMap.value[a.clientId]
    const matchType   = !applied.value.type   || a.type === applied.value.type
    const matchTitle  = !applied.value.title  || a.title.includes(applied.value.title)
      || client?.name.includes(applied.value.title) || client?.nameKr.includes(applied.value.title)
    const matchAuthor = !applied.value.author || a.author === applied.value.author
    const matchPo     = !applied.value.po     || (a.poId ?? '').includes(applied.value.po)
    const matchFrom   = !applied.value.dateFrom || a.date >= applied.value.dateFrom
    const matchTo     = !applied.value.dateTo   || a.date <= applied.value.dateTo
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
  selectedActivity.value = activity
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
  isEditOpen.value = true
}

function closeEdit() {
  isEditOpen.value = false
  editActivity.value = null
}

async function handleSave(updated) {
  try {
    await updateActivity(updated.id, updated)
    const idx = activities.value.findIndex((a) => a.id === updated.id)
    if (idx !== -1) activities.value[idx] = updated
    closeEdit()
  } catch (e) {
    console.error('기록 수정 실패', e)
    error('기록 수정에 실패했습니다. 다시 시도해주세요.')
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

async function handleDelete() {
  const targetId = deleteTarget.value?.id
  if (!targetId) return
  try {
    await deleteActivity(targetId)
    activities.value = activities.value.filter((a) => a.id !== targetId)
    closeDelete()
  } catch (e) {
    console.error('기록 삭제 실패', e)
    error('기록 삭제에 실패했습니다. 다시 시도해주세요.')
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
  { key: 'actions', label: '작업', width: '70px', align: 'center' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <PageHeader title="기록 관리" icon-class="fas fa-list-check">
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
    </PageHeader>

    <!-- 키워드 검색 + 상세검색 토글 -->
    <FilterToolbarCard
      v-model="filterTitle"
      placeholder="제목 검색..."
      :advanced-open="isFilterOpen"
      @toggle-advanced="isFilterOpen = !isFilterOpen"
    />

    <!-- 상세검색 패널 -->
    <CollapsibleFilterCard :open="isFilterOpen" @toggle="isFilterOpen = !isFilterOpen">
      <div class="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4">
        <!-- 날짜 기간 -->
        <div class="col-span-2">
          <FormField label="날짜 기간">
            <DateRangeField
              :start="filterDateFrom"
              :end="filterDateTo"
              @update:start="filterDateFrom = $event"
              @update:end="filterDateTo = $event"
              @reset="filterDateFrom = ''; filterDateTo = ''"
            />
          </FormField>
        </div>

        <!-- 작성자 -->
        <FormField label="작성자">
          <SearchableCombobox
            v-model="filterAuthor"
            :options="authorOptions"
            placeholder="작성자 검색..."
          />
        </FormField>

        <!-- PO -->
        <FormField label="PO">
          <SearchTriggerField
            v-model="filterPo"
            placeholder="PO 검색..."
            title="PO 검색"
          />
        </FormField>

        <!-- 유형 -->
        <FormField label="유형">
          <SearchableCombobox
            v-model="filterType"
            :options="typeOptions"
            placeholder="유형 선택..."
          />
        </FormField>
      </div>

      <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">초기화</BaseButton>
        <BaseButton size="sm" @click="applySearch">검색</BaseButton>
      </div>
    </CollapsibleFilterCard>

    <!-- 테이블 -->
    <div>
      <BaseTable :columns="columns" :rows="paginatedActivities" row-key="id" class="cursor-pointer" @row-click="openDetail">
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

        <!-- 작업 버튼 -->
        <template #cell-actions="{ row }">
          <div @click.stop>
            <TableActions @edit="openEdit(row)" @delete="openDelete(row)" />
          </div>
        </template>
      </BaseTable>

      <!-- 하단 카운트 + 페이지네이션 -->
      <div class="mt-2 px-1 text-xs text-slate-500">
        <span>총 {{ filteredActivities.length }}건</span>
      </div>
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
      @confirm="handleDelete"
      @cancel="closeDelete"
    />
  </div>
</template>
