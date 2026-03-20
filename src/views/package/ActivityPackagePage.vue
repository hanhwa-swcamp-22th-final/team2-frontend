<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchActivities, fetchAllActivityPOs } from '@/api/activity'
import { useToast } from '@/composables/useToast'
import { jsPDF } from 'jspdf'
import ActivityTypeBadge from '@/components/domain/activity/ActivityTypeBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'

const router = useRouter()
const { warning, error } = useToast()

// ── 데이터 ─────────────────────────────────────────────────
const activities = ref([])
const poList = ref([])

onMounted(async () => {
  try {
    const [actData, poData] = await Promise.all([fetchActivities(), fetchAllActivityPOs()])
    activities.value = actData
    poList.value = poData
  } catch (e) {
    console.error('데이터 로드 실패', e)
    error('데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.')
  }
})

const poColumns = [
  { key: 'id',    label: 'PO번호' },
  { key: 'title', label: '제목'   },
  { key: 'date',  label: '날짜'   },
]

// ── PO 검색 모달 ───────────────────────────────────────────
const isPoModalOpen = ref(false)
const poSearchKeyword = ref('')
const selectedPoId = ref('')

const filteredPoList = computed(() => {
  const q = poSearchKeyword.value.trim().toLowerCase()
  if (!q) return poList.value
  return poList.value.filter(
    (p) => p.id.toLowerCase().includes(q) || p.title.toLowerCase().includes(q),
  )
})

function selectPo(po) {
  selectedPoId.value = po.id
  poDisplay.value = `${po.id} - ${po.title}`
  isPoModalOpen.value = false
  poSearchKeyword.value = ''
}

function clearPo() {
  selectedPoId.value = ''
  poDisplay.value = ''
  selectedActivityIds.value = []
}

// ── 패키지 생성 폼 상태 ────────────────────────────────────
const keyword     = ref('')
const poDisplay   = ref('')
const dateFrom    = ref('')
const dateTo      = ref(new Date().toISOString().slice(0, 10))

// 탭/필터와 무관하게 실제 선택된 활동기록 전체
const selectedActivities = computed(() =>
  activities.value.filter((a) => selectedActivityIds.value.includes(a.id)),
)

const includedTypes = computed(() =>
  [...new Set(selectedActivities.value.map((a) => a.type))],
)

// ── 유효성 검사 ────────────────────────────────────────────
const errors = ref({})

watch(poDisplay,  (val) => { if (val) errors.value.po       = undefined })
watch(dateFrom,   (val) => { if (val) errors.value.dateFrom = undefined })
watch(dateTo,     (val) => { if (val) errors.value.dateTo   = undefined })

function validate() {
  const e = {}
  if (!poDisplay.value)  e.po       = '수주건 값이 누락되었습니다.'
  if (!dateFrom.value)   e.dateFrom = '기간 시작일 값이 누락되었습니다.'
  if (!dateTo.value)     e.dateTo   = '기간 종료일 값이 누락되었습니다.'
  errors.value = e
  return Object.keys(e).length === 0
}

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

const selectedActivityIds = ref([])

const filteredActivities = computed(() => {
  let list = activities.value
  if (selectedPoId.value) {
    list = list.filter((a) => a.poId === selectedPoId.value)
  }
  if (activeTypeTab.value !== '전체') {
    list = list.filter((a) => a.type === activeTypeTab.value)
  }
  if (keyword.value.trim()) {
    const q = keyword.value.trim().toLowerCase()
    list = list.filter((a) =>
      a.title.toLowerCase().includes(q) || (a.content ?? '').toLowerCase().includes(q),
    )
  }
  if (dateFrom.value) list = list.filter((a) => a.date >= dateFrom.value)
  if (dateTo.value)   list = list.filter((a) => a.date <= dateTo.value)
  return list
})

// PO 변경 시 전체 선택으로 리셋
watch(selectedPoId, async () => {
  await nextTick()
  selectedActivityIds.value = filteredActivities.value.map((a) => a.id)
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
  if (selectedActivities.value.length === 0) return '활동기록 목록에서 항목을 선택하면 포함 건수가 표시됩니다.'
  const countByType = selectedActivities.value.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1
    return acc
  }, {})
  const parts = Object.entries(countByType).map(([type, count]) => `${type} ${count}건`)
  return `미리보기: ${parts.join(', ')}이 포함됩니다.`
})

function generatePdf() {
  if (!validate()) {
    warning('입력 내용을 확인해주세요.')
    return
  }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // ── 헤더 ──────────────────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Activity Record Package', pageW / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleDateString('ko-KR')}`, pageW / 2, y, { align: 'center' })
  y += 4

  if (poDisplay.value) {
    doc.text(`PO: ${poDisplay.value}`, pageW / 2, y, { align: 'center' })
    y += 4
  }
  doc.text(`Period: ${dateFrom.value || '전체'} ~ ${dateTo.value || '전체'}`, pageW / 2, y, { align: 'center' })
  y += 8

  // 구분선
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // ── 선택된 활동기록 목록 ───────────────────────────────────
  const selected = selectedActivities.value

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text(`Activity Records (${selected.length})`, margin, y)
  y += 7

  if (selected.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150)
    doc.text('No records selected.', margin, y)
    y += 6
  } else {
    // 테이블 헤더
    const cols = [
      { label: 'No',     x: margin,      w: 12  },
      { label: 'Date',   x: margin + 12, w: 25  },
      { label: 'Type',   x: margin + 37, w: 28  },
      { label: 'Title',  x: margin + 65, w: 70  },
      { label: 'Author', x: margin + 135, w: 30 },
    ]

    doc.setFillColor(240, 244, 255)
    doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50)
    cols.forEach((c) => doc.text(c.label, c.x + 1, y))
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)

    selected.forEach((a, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      const bg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(...bg)
      doc.rect(margin, y - 4, pageW - margin * 2, 6, 'F')

      doc.setFontSize(8.5)
      doc.text(String(i + 1), cols[0].x + 1, y)
      doc.text(a.date ?? '-',  cols[1].x + 1, y)
      doc.text(a.type ?? '-',  cols[2].x + 1, y)

      // 제목 말줄임
      const title = doc.splitTextToSize(a.title ?? '-', cols[3].w - 2)[0]
      doc.text(title, cols[3].x + 1, y)
      doc.text(a.author ?? '-', cols[4].x + 1, y)
      y += 6
    })
  }

  y += 6
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── 포함 항목 요약 ─────────────────────────────────────────
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text('Include Options', margin, y)
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60)
  if (includedTypes.value.length === 0) {
    doc.text('• 선택된 항목 없음', margin + 4, y)
    y += 5
  } else {
    includedTypes.value.forEach((type) => {
      doc.text(`• ${type}`, margin + 4, y)
      y += 5
    })
  }

  // ── 푸터 ──────────────────────────────────────────────────
  const totalPages = doc.internal.pages.length - 1
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(160)
    doc.text(`Page ${p} / ${totalPages}`, pageW / 2, 290, { align: 'center' })
    doc.text('SalesBoost - Activity Package', margin, 290)
  }

  // 새 탭에서 PDF 미리보기
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 페이지 타이틀 -->
    <PageHeader title="활동기록 패키지" icon-class="fas fa-cube">
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
    </PageHeader>

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

            <!-- 기간 -->
            <div class="space-y-1.5">
              <p class="text-sm font-semibold text-slate-700">
                기간 <span class="text-red-500">*</span>
              </p>
              <div class="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
                <div>
                  <DateField v-model="dateFrom" />
                  <p v-if="errors.dateFrom" class="mt-1 text-xs text-red-500">{{ errors.dateFrom }}</p>
                </div>
                <span class="hidden pt-2 text-center text-sm text-slate-400 md:block">~</span>
                <div>
                  <DateField v-model="dateTo" />
                  <p v-if="errors.dateTo" class="mt-1 text-xs text-red-500">{{ errors.dateTo }}</p>
                </div>
              </div>
              <div class="flex justify-end">
                <BaseButton variant="secondary" size="sm" @click="dateFrom = ''; dateTo = ''">기간 초기화</BaseButton>
              </div>
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

            <!-- 미리보기 요약 -->
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              {{ summaryText }}
            </div>

            <!-- 생성 버튼 -->
            <BaseButton :block="true" @click="generatePdf">
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
    />

  </div>
</template>
