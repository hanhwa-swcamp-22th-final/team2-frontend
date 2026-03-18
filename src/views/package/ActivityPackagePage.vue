<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateRangeField from '@/components/common/DateRangeField.vue'
import PageTitleBar from '@/components/layout/PageTitleBar.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const router = useRouter()

// ── 더미 데이터 ────────────────────────────────────────────
const activities = ref([
  { id: 'ACT-001', type: '미팅/협의', title: '1분기 전략 미팅',      date: '2025-03-10', author: '홍길동' },
  { id: 'ACT-002', type: '이슈',      title: '납기 지연 이슈 발생',   date: '2025-03-08', author: '김영희' },
  { id: 'ACT-003', type: '메모/노트', title: '거래처 미팅 메모',      date: '2025-03-07', author: '이철수' },
  { id: 'ACT-004', type: '코멘트',    title: '제품 샘플 피드백',      date: '2025-03-05', author: '홍길동' },
  { id: 'ACT-005', type: '일정',      title: '2분기 미팅 일정 확정',  date: '2025-03-03', author: '김영희' },
  { id: 'ACT-006', type: '미팅/협의', title: '신규 계약 협의',        date: '2025-03-01', author: '이철수' },
  { id: 'ACT-007', type: '이슈',      title: '품질 클레임 접수',      date: '2025-02-25', author: '홍길동' },
  { id: 'ACT-008', type: '메모/노트', title: '현지 시장 조사 메모',   date: '2025-02-20', author: '김영희' },
])

// ── PO 더미 데이터 ─────────────────────────────────────────
const poList = [
  { id: 'PO-2025-001', client: 'GlobalTech',  amount: '$120,000', deliveryDate: '2025-04-30', status: '확정' },
  { id: 'PO-2025-002', client: 'EuroSupply',  amount: '$85,000',  deliveryDate: '2025-05-15', status: '확정' },
  { id: 'PO-2025-003', client: 'AsiaConnect', amount: '$200,000', deliveryDate: '2025-06-01', status: '생산중' },
  { id: 'PO-2025-004', client: 'GlobalTech',  amount: '$60,000',  deliveryDate: '2025-04-10', status: '출하완료' },
  { id: 'PO-2025-005', client: 'EuroSupply',  amount: '$95,000',  deliveryDate: '2025-07-20', status: '접수' },
]

const poColumns = [
  { key: 'id',           label: 'PO번호'   },
  { key: 'client',       label: '거래처'   },
  { key: 'amount',       label: '총액'     },
  { key: 'deliveryDate', label: '납기일'   },
  { key: 'status',       label: '상태'     },
]

// ── PO 검색 모달 ───────────────────────────────────────────
const isPoModalOpen = ref(false)
const poSearchKeyword = ref('')
const filteredPoList = ref([...poList])

watch(poSearchKeyword, (keyword) => {
  const q = keyword.trim().toLowerCase()
  filteredPoList.value = q
    ? poList.filter((p) => p.id.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    : [...poList]
})

function selectPo(po) {
  poDisplay.value = `${po.id} - ${po.client}`
  isPoModalOpen.value = false
  poSearchKeyword.value = ''
  filteredPoList.value = [...poList]
}

// ── 패키지 생성 폼 상태 ────────────────────────────────────
const keyword     = ref('')
const poDisplay   = ref('')
const dateFrom    = ref('2025-01-01')
const dateTo      = ref('2025-03-19')

const includes = ref({
  meetings:    true,
  notes:       true,
  issues:      true,
  comments:    true,
  emails:      true,
  collections: true,
})

const includeItems = [
  { key: 'meetings',    label: '미팅/협의' },
  { key: 'notes',       label: '메모/노트' },
  { key: 'issues',      label: '이슈'      },
  { key: 'comments',    label: '코멘트/일정' },
  { key: 'emails',      label: '이메일'    },
  { key: 'collections', label: '수금'      },
]

// ── 활동기록 필터 ──────────────────────────────────────────
const activeTypeTab = ref('전체')

const typeTabs = [
  { key: '전체',     label: '전체'     },
  { key: '미팅/협의', label: '미팅/협의' },
  { key: '이슈',     label: '이슈'     },
  { key: '메모/노트', label: '메모/노트' },
  { key: '코멘트',   label: '코멘트'   },
  { key: '일정',     label: '일정'     },
]

const selectedActivityIds = ref(activities.value.map((a) => a.id))

const filteredActivities = computed(() => {
  let list = activities.value
  if (activeTypeTab.value !== '전체') {
    list = list.filter((a) => a.type === activeTypeTab.value)
  }
  if (keyword.value.trim()) {
    const q = keyword.value.trim().toLowerCase()
    list = list.filter((a) => a.title.toLowerCase().includes(q))
  }
  if (dateFrom.value) list = list.filter((a) => a.date >= dateFrom.value)
  if (dateTo.value)   list = list.filter((a) => a.date <= dateTo.value)
  return list
})

const isAllSelected = computed(() =>
  filteredActivities.value.length > 0 &&
  filteredActivities.value.every((a) => selectedActivityIds.value.includes(a.id)),
)

function toggleAll(checked) {
  const ids = filteredActivities.value.map((a) => a.id)
  if (checked) {
    selectedActivityIds.value = [...new Set([...selectedActivityIds.value, ...ids])]
  } else {
    selectedActivityIds.value = selectedActivityIds.value.filter((id) => !ids.includes(id))
  }
}

function toggleActivity(id) {
  if (selectedActivityIds.value.includes(id)) {
    selectedActivityIds.value = selectedActivityIds.value.filter((v) => v !== id)
  } else {
    selectedActivityIds.value = [...selectedActivityIds.value, id]
  }
}

// ── 미리보기 요약 ──────────────────────────────────────────
const summaryText = computed(() => {
  if (!poDisplay.value) return '수주건을 선택하면 포함 건수가 표시됩니다.'
  const actCount = filteredActivities.value.length
  const emailCount = 3 // 더미
  const colCount = 2   // 더미
  return `미리보기: 활동기록 ${actCount}건, 이메일 ${emailCount}건, 수금 ${colCount}건이 포함됩니다.`
})
</script>

<template>
  <div class="space-y-6">
    <!-- 페이지 타이틀 -->
    <PageTitleBar title="활동기록 패키지" description="활동기록을 PDF 패키지로 생성합니다.">
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
    </PageTitleBar>

    <!-- 본문 2컬럼 그리드 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">

      <!-- ── 좌측: 패키지 생성 폼 ──────────────────────────── -->
      <div class="lg:col-span-2">
        <BaseCard title="패키지 생성">
          <div class="space-y-5">

            <!-- 키워드 검색 -->
            <div class="space-y-1.5">
              <p class="text-sm font-semibold text-slate-700">키워드 검색</p>
              <BaseTextField
                v-model="keyword"
                placeholder="제목, 내용 등 키워드 검색"
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
                />
                <BaseButton variant="ghost" @click="isPoModalOpen = true">
                  <template #leading>
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.766l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clip-rule="evenodd" />
                    </svg>
                  </template>
                  PO 검색
                </BaseButton>
                <BaseButton variant="secondary" @click="poDisplay = ''">
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </BaseButton>
              </div>
            </div>

            <!-- 기간 -->
            <div class="space-y-1.5">
              <p class="text-sm font-semibold text-slate-700">
                기간 <span class="text-red-500">*</span>
              </p>
              <DateRangeField
                :start="dateFrom"
                :end="dateTo"
                @update:start="dateFrom = $event"
                @update:end="dateTo = $event"
                @reset="dateFrom = ''; dateTo = ''"
              />
            </div>

            <!-- 포함 항목 -->
            <div class="space-y-2">
              <p class="text-sm font-semibold text-slate-700">포함 항목</p>
              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="item in includeItems"
                  :key="item.key"
                  class="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-2.5 transition hover:bg-slate-100"
                >
                  <input
                    v-model="includes[item.key]"
                    type="checkbox"
                    class="rounded border-slate-300 text-brand-500"
                  />
                  <span class="text-sm text-slate-700">{{ item.label }}</span>
                </label>
              </div>
            </div>

            <!-- 미리보기 요약 -->
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              {{ summaryText }}
            </div>

            <!-- 생성 버튼 -->
            <BaseButton :block="true">
              <template #leading>
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
              </template>
              패키지(PDF) 생성
            </BaseButton>

          </div>
        </BaseCard>
      </div>

      <!-- ── 우측: 활동기록 목록 ─────────────────────────────── -->
      <div>
        <BaseCard title="활동기록 목록">
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
              :key="activity.id"
              class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:bg-slate-100"
            >
              <input
                type="checkbox"
                class="rounded border-slate-300 text-brand-500"
                :checked="selectedActivityIds.includes(activity.id)"
                @change="toggleActivity(activity.id)"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <ActivityTypeBadge :value="activity.type" />
                  <span class="truncate text-sm font-medium text-slate-700">{{ activity.title }}</span>
                </div>
                <p class="mt-0.5 text-xs text-slate-400">{{ activity.date }} · {{ activity.author }}</p>
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
      :columns="poColumns"
      :rows="filteredPoList"
      :search-keyword="poSearchKeyword"
      empty-text="검색된 PO가 없습니다."
      @close="isPoModalOpen = false"
      @update:search-keyword="poSearchKeyword = $event"
      @select="selectPo"
    >
      <template #cell-status="{ row }">
        <StatusBadge :value="row.status" />
      </template>
    </SearchModal>

  </div>
</template>
