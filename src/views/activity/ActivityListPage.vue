<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ActivityDetailModal from '@/components/domain/activity/ActivityDetailModal.vue'
import ActivityEditModal from '@/components/domain/activity/ActivityEditModal.vue'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DateRangeField from '@/components/common/DateRangeField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'

const router = useRouter()

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

const authorOptions = [
  { label: '홍길동', value: '홍길동' },
  { label: '김영희', value: '김영희' },
  { label: '이철수', value: '이철수' },
]

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

// ── 더미 데이터 ────────────────────────────────────────────
const activities = ref([
  {
    id: 'ACT-001',
    client: 'Acme Corp',
    type: '미팅/협의',
    title: '1분기 전략 미팅',
    poId: 'PO-2024-001',
    date: '2025-03-10',
    author: '홍길동',
    content: '1분기 영업 전략에 대해 논의했습니다. 주요 목표 및 KPI를 설정하였으며, 다음 미팅은 4월 초로 예정되어 있습니다.',
  },
  {
    id: 'ACT-002',
    client: 'Globex Corp',
    type: '이슈',
    title: '납기 지연 이슈 발생',
    poId: 'PO-2024-002',
    date: '2025-03-08',
    author: '김영희',
    content: '생산 공정 문제로 인해 납기가 2주 지연될 예정입니다. 거래처에 공식 통보가 필요합니다.',
  },
  {
    id: 'ACT-003',
    client: 'Initech',
    type: '메모/노트',
    title: '거래처 미팅 메모',
    poId: '-',
    date: '2025-03-07',
    author: '이철수',
    content: '거래처 담당자와의 미팅에서 신규 제품 라인업에 대한 관심을 보였습니다.',
  },
  {
    id: 'ACT-004',
    client: 'Acme Corp',
    type: '코멘트',
    title: '제품 샘플 피드백',
    poId: 'PO-2024-001',
    date: '2025-03-05',
    author: '홍길동',
    content: '제품 샘플에 대한 긍정적인 피드백을 받았습니다. 색상 옵션 추가 요청이 있었습니다.',
  },
  {
    id: 'ACT-005',
    client: 'Globex Corp',
    type: '일정',
    title: '2분기 미팅 일정 확정',
    poId: '-',
    date: '2025-03-03',
    author: '김영희',
    content: '2분기 정기 미팅을 4월 15일로 확정하였습니다.',
  },
  {
    id: 'ACT-006',
    client: 'Initech',
    type: '미팅/협의',
    title: '신규 계약 협의',
    poId: 'PO-2024-003',
    date: '2025-03-01',
    author: '이철수',
    content: '신규 계약에 대한 조건을 협의하였습니다. 단가 및 납기 조건을 재검토 중입니다.',
  },
  {
    id: 'ACT-007',
    client: 'Acme Corp',
    type: '이슈',
    title: '품질 클레임 접수',
    poId: 'PO-2024-001',
    date: '2025-02-25',
    author: '홍길동',
    content: '불량 제품에 대한 클레임이 접수되었습니다. 품질팀과 협의 중입니다.',
  },
])

// ── 필터 computed (applied 기준) ───────────────────────────
const filteredActivities = computed(() => {
  return activities.value.filter((a) => {
    const matchType   = !applied.value.type   || a.type === applied.value.type
    const matchTitle  = !applied.value.title  || a.title.includes(applied.value.title) || a.client.includes(applied.value.title)
    const matchAuthor = !applied.value.author || a.author === applied.value.author
    const matchPo     = !applied.value.po     || a.poId.includes(applied.value.po)
    const matchFrom   = !applied.value.dateFrom || a.date >= applied.value.dateFrom
    const matchTo     = !applied.value.dateTo   || a.date <= applied.value.dateTo
    return matchType && matchTitle && matchAuthor && matchPo && matchFrom && matchTo
  })
})

// ── 체크박스 ───────────────────────────────────────────────
const selectedIds = ref([])

function toggleRow(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((v) => v !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

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

// ── 테이블 컬럼 ────────────────────────────────────────────
const columns = [
  { key: 'checkbox', label: '', width: '48px', align: 'center' },
  { key: 'index', label: '항목', width: '64px', align: 'center' },
  { key: 'type', label: '유형', width: '120px' },
  { key: 'title', label: '제목' },
  { key: 'poId', label: 'PO', width: '130px' },
  { key: 'date', label: '날짜', width: '110px', align: 'center' },
  { key: 'author', label: '작성자', width: '100px', align: 'center' },
  { key: 'actions', label: '작업', width: '80px', align: 'center' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 페이지 타이틀 -->
    <PageTitleBar title="기록 관리" description="활동 기록을 조회하고 관리합니다.">
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
    </PageTitleBar>

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
      <BaseTable :columns="columns" :rows="filteredActivities" row-key="id">
        <!-- 체크박스 셀 -->
        <template #cell-checkbox="{ row }">
          <input
            type="checkbox"
            class="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
            :checked="selectedIds.includes(row.id)"
            @change="toggleRow(row.id)"
            @click.stop
          />
        </template>

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

        <!-- 제목 (클릭 시 상세 모달) -->
        <template #cell-title="{ row }">
          <button
            type="button"
            class="text-left font-medium text-slate-800 transition hover:text-brand-600"
            @click="openDetail(row)"
          >
            {{ row.title }}
          </button>
        </template>

        <!-- 작업 버튼 -->
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <button
              type="button"
              class="text-xs text-brand-500 transition hover:text-brand-700"
              @click="openEdit(row)"
            >
              수정
            </button>
            <button
              type="button"
              class="text-xs text-slate-400 transition hover:text-red-500"
              @click="openDelete(row)"
            >
              삭제
            </button>
          </div>
        </template>
      </BaseTable>

      <!-- 하단 카운트 -->
      <div class="mt-2 flex items-center justify-between px-1 text-xs text-slate-500">
        <span>총 {{ filteredActivities.length }}건</span>
        <span v-if="selectedIds.length > 0" class="font-medium text-brand-600">
          {{ selectedIds.length }}건 선택됨
        </span>
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
    />

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :open="isDeleteOpen"
      title="기록 삭제"
      message="아래 기록을 삭제하시겠습니까?"
      :detail="deleteTarget?.title"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="closeDelete"
      @cancel="closeDelete"
    />
  </div>
</template>
