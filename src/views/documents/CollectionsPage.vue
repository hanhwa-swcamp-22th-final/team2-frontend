<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseTextField from '@/components/common/BaseTextField.vue'
import DateField from '@/components/common/DateField.vue'
import FormField from '@/components/common/FormField.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'

const isAdvancedOpen = ref(true)

const filters = ref({
  keyword: '',
  issueFrom: '',
  issueTo: '',
  collectionFrom: '',
  collectionTo: '',
  clientName: '',
  country: '',
  currency: '',
  poId: '',
  manager: '',
  status: '',
})

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '일본', label: '일본' },
  { value: '베트남', label: '베트남' },
  { value: 'UAE', label: 'UAE' },
]

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'JPY', label: 'JPY' },
]

const managerOptions = [
  { value: '김영업', label: '김영업' },
  { value: '정영업', label: '정영업' },
  { value: '최관리', label: '최관리' },
]

const statusOptions = [
  { value: '미수금', label: '미수금' },
  { value: '수금완료', label: '수금완료' },
]

const columns = [
  { key: 'poId', label: 'PO 번호', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  // 통화와 금액을 분리 — ERP 기준 다통화 합계를 위해 별도 컬럼으로 운영
  { key: 'currency', label: '통화', align: 'center', width: '80px' },
  { key: 'salesAmount', label: '매출액', align: 'right', width: '150px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'collectionDate', label: '수금일', align: 'center', width: '130px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
]

// 원본 데이터: 통화(currency)와 금액(salesAmount)을 분리하여 저장
// → 다통화 환경에서 정확한 합계 계산을 위한 필수 구조
const rows = [
  {
    poId: 'PO26001',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    manager: '김영업',
    currency: 'USD',       // 통화 코드 (별도 컬럼)
    salesAmount: 42400,    // 순수 숫자 금액 (통화 기호 제거)
    issueDate: '2026/02/10',
    collectionDate: '2026/03/10',
    status: '수금완료',
  },
  {
    poId: 'PO26003',
    clientName: 'Sakura Electronics Co., Ltd.',
    country: '일본',
    manager: '정영업',
    currency: 'JPY',
    salesAmount: 8388000,
    issueDate: '2026/02/20',
    collectionDate: '2026/05/05',
    status: '수금완료',
  },
  {
    poId: 'PO26004',
    clientName: 'Viet Steel JSC',
    country: '베트남',
    manager: '정영업',
    currency: 'USD',
    salesAmount: 53600,
    issueDate: '2025/12/20',
    collectionDate: '2026/04/10',
    status: '수금완료',
  },
  {
    poId: 'PO26006',
    clientName: 'Al Baraka Trading LLC',
    country: 'UAE',
    manager: '김영업',
    currency: 'USD',
    salesAmount: 28500,
    issueDate: '2025/08/15',
    collectionDate: '2025/08/20',
    status: '수금완료',
  },
  {
    poId: 'PO26008',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    manager: '김영업',
    currency: 'USD',
    salesAmount: 18400,
    issueDate: '2025/09/20',
    collectionDate: '2025/12/20',
    status: '수금완료',
  },
]

function resetFilters() {
  filters.value = {
    keyword: '',
    issueFrom: '',
    issueTo: '',
    collectionFrom: '',
    collectionTo: '',
    clientName: '',
    country: '',
    currency: '',
    poId: '',
    manager: '',
    status: '',
  }
}

function openClientSearch() {}

// ── 필터링된 행 (Filtered Rows) ──
// 상세검색 필터 조건에 따라 표시할 데이터를 동적으로 필터링
// → 합계 계산의 기준이 되는 데이터셋
const filteredRows = computed(() => {
  return rows.filter((row) => {
    // 통화 필터: 선택된 통화와 일치하는 행만 표시
    if (filters.value.currency && row.currency !== filters.value.currency) return false
    // 국가 필터
    if (filters.value.country && row.country !== filters.value.country) return false
    // 영업담당자 필터
    if (filters.value.manager && row.manager !== filters.value.manager) return false
    // 상태 필터
    if (filters.value.status && row.status !== filters.value.status) return false
    // PO 번호 필터 (부분 일치)
    if (filters.value.poId && !row.poId.includes(filters.value.poId)) return false
    // 거래처 필터 (부분 일치, 대소문자 무시)
    if (filters.value.clientName && !row.clientName.toLowerCase().includes(filters.value.clientName.toLowerCase())) return false
    // 키워드 통합 검색 (PO번호, 거래처명에서 부분 일치)
    if (filters.value.keyword) {
      const kw = filters.value.keyword.toLowerCase()
      const matchesKeyword = row.poId.toLowerCase().includes(kw)
        || row.clientName.toLowerCase().includes(kw)
        || row.manager.includes(kw)
      if (!matchesKeyword) return false
    }
    return true
  })
})

// ── 통화별 합계 행 (Summary Rows) ──
// ERP 핵심 로직: 필터 조건에 따라 합계 행을 동적으로 생성
// ① 통화 필터 적용 → 단일 통화 합계 1행
// ② 통화 필터 미적용 → 통화별 분리 합계 (USD, JPY 각각 별도 행)
const summaryRows = computed(() => {
  // filteredRows에서 통화별로 그룹핑하여 합산
  const currencyMap = {}  // { 'USD': { count: 3, total: 142900 }, 'JPY': { ... } }

  filteredRows.value.forEach((row) => {
    if (!currencyMap[row.currency]) {
      currencyMap[row.currency] = { count: 0, total: 0 }
    }
    currencyMap[row.currency].count += 1
    currencyMap[row.currency].total += row.salesAmount
  })

  // 통화 코드 기준 정렬 후 합계 행 배열로 변환
  return Object.entries(currencyMap)
    .sort(([a], [b]) => a.localeCompare(b))  // 알파벳순 정렬 (JPY → USD)
    .map(([currency, data]) => ({
      currency,                                      // 통화 코드
      count: data.count,                             // 해당 통화의 건수
      total: data.total,                             // 해당 통화의 합산 금액
      totalFormatted: data.total.toLocaleString(),   // 콤마 포맷 (예: 142,900)
    }))
})

// 통화 코드 → 기호 매핑 (매출액 셀에 기호를 표시하기 위함)
const currencySymbols = {
  USD: '$',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
}

// 금액을 "통화기호 + 콤마 포맷 숫자" 문자열로 변환하는 헬퍼 함수
// 예: formatAmount(42400, 'USD') → '$42,400'
function formatAmount(value, currency) {
  const symbol = currencySymbols[currency] || ''
  if (typeof value === 'number') return `${symbol}${value.toLocaleString()}`
  return `${symbol}${value}`
}
</script>

<template>
  <div class="fade-in space-y-4">
    <section class="flex items-center justify-between">
      <h2 class="flex items-center gap-2.5 text-xl font-bold text-slate-900">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
          <i class="fas fa-chart-bar text-sm text-brand-600" aria-hidden="true"></i>
        </div>
        매출·수금 현황
      </h2>
    </section>

    <BaseCard body-class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative w-full sm:max-w-[320px]">
        <i class="fas fa-search absolute left-3 top-2.5 text-xs text-slate-400" aria-hidden="true"></i>
        <BaseTextField
          v-model="filters.keyword"
          placeholder="검색어 입력..."
          class="pl-9"
        />
      </div>

      <BaseButton
        variant="secondary"
        size="sm"
        class="shrink-0"
        :class="isAdvancedOpen ? 'border-brand-200 bg-slate-50 text-brand-600' : ''"
        @click="isAdvancedOpen = !isAdvancedOpen"
      >
        <template #leading>
          <i class="fas fa-sliders-h text-xs" aria-hidden="true"></i>
        </template>
        상세검색
      </BaseButton>
    </BaseCard>

    <BaseCard body-class="overflow-hidden p-0">
      <button
        type="button"
        class="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
        @click="isAdvancedOpen = !isAdvancedOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <i class="fas fa-filter text-xs text-brand-500" aria-hidden="true"></i>
          상세검색
        </span>
        <i
          class="fas fa-chevron-up text-xs text-slate-400 transition-transform"
          :class="isAdvancedOpen ? '' : 'rotate-180'"
          aria-hidden="true"
        ></i>
      </button>

      <div v-if="isAdvancedOpen" class="border-t border-slate-100 px-5 pb-4 pt-3">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
          <FormField label="발행일" class="col-span-2">
            <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <DateField v-model="filters.issueFrom" />
              <span class="pb-2 text-xs text-slate-400">~</span>
              <DateField v-model="filters.issueTo" />
            </div>
          </FormField>

          <FormField label="수금일" class="col-span-2">
            <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <DateField v-model="filters.collectionFrom" />
              <span class="pb-2 text-xs text-slate-400">~</span>
              <DateField v-model="filters.collectionTo" />
            </div>
          </FormField>

          <FormField label="거래처">
            <SearchTriggerField
              v-model="filters.clientName"
              placeholder="거래처 검색..."
              title="거래처 검색"
              @trigger="openClientSearch"
            />
          </FormField>

          <FormField label="국가">
            <SearchableCombobox
              v-model="filters.country"
              :options="countryOptions"
              placeholder="국가 검색..."
            />
          </FormField>

          <FormField label="통화">
            <SearchableCombobox
              v-model="filters.currency"
              :options="currencyOptions"
              placeholder="통화 선택..."
            />
          </FormField>

          <FormField label="PO 번호">
            <SearchTriggerField
              v-model="filters.poId"
              placeholder="PO26001"
              title="PO 번호 검색"
            />
          </FormField>

          <FormField label="영업담당자">
            <SearchableCombobox
              v-model="filters.manager"
              :options="managerOptions"
              placeholder="담당자 검색..."
            />
          </FormField>

          <FormField label="상태">
            <SearchableCombobox
              v-model="filters.status"
              :options="statusOptions"
              placeholder="상태 선택..."
            />
          </FormField>
        </div>

        <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <BaseButton variant="secondary" size="sm" @click="resetFilters">
            <template #leading>
              <i class="fas fa-undo text-[10px]" aria-hidden="true"></i>
            </template>
            초기화
          </BaseButton>
          <BaseButton size="sm">
            <template #leading>
              <i class="fas fa-search text-[10px]" aria-hidden="true"></i>
            </template>
            검색
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- filteredRows를 전달하여 필터 조건에 맞는 데이터만 테이블에 표시 -->
    <BaseTable
      :columns="columns"
      :rows="filteredRows"
      empty-text="데이터가 없습니다."
    >
      <template #cell-poId="{ value }">
        <span class="font-mono text-xs font-semibold text-brand-600">{{ value }}</span>
      </template>

      <template #cell-clientName="{ value }">
        <span>{{ value }}</span>
      </template>

      <template #cell-country="{ value }">
        <span class="text-xs text-slate-600">{{ value }}</span>
      </template>

      <template #cell-manager="{ value }">
        <span class="text-xs text-slate-600">{{ value }}</span>
      </template>

      <!-- 통화 컬럼: 통화 코드만 표시 (금액과 혼합하지 않음) -->
      <template #cell-currency="{ value }">
        <span class="text-xs font-semibold text-slate-700">{{ value }}</span>
      </template>

      <!-- 매출액 컬럼: 통화 기호 + 콤마 포맷 숫자 (예: $42,400, ¥8,388,000) -->
      <template #cell-salesAmount="{ value, row }">
        <span class="text-sm font-semibold text-slate-800">{{ formatAmount(value, row.currency) }}</span>
      </template>

      <template #cell-issueDate="{ value }">
        <span class="text-xs">{{ value }}</span>
      </template>

      <template #cell-collectionDate="{ value }">
        <span class="text-xs">{{ value }}</span>
      </template>

      <template #cell-status="{ row }">
        <select
          class="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-brand-400 focus:outline-none"
          :value="row.status === '수금완료' ? 'PAID' : 'UNPAID'"
        >
          <option value="UNPAID">미수금</option>
          <option value="PAID">수금완료</option>
        </select>
      </template>

      <!-- ── 합계 Footer ── -->
      <!-- ERP 스타일: 건수를 첫 칸에, "합계"를 거래처~영업담당자 영역에 병합 → 빈 셀 제거 -->
      <!-- 레이아웃: 5건(rowspan) | 합계(colspan=3, rowspan) | USD | 142,900 | 빈칸(rowspan) -->
      <!--                       |                          | JPY | 8,388,000 |              -->
      <template #footer>
        <tr
          v-for="(summary, index) in summaryRows"
          :key="summary.currency"
          class="bg-slate-100/80"
        >
          <!-- 첫 행에만 rowspan 셀 렌더링 — 나머지 행은 통화/매출액만 표시 -->
          <template v-if="index === 0">
            <!-- 조회 건수: PO번호 자리에 배치, 세로 병합 -->
            <!-- 첫 행 상단: 두꺼운 구분선(border-t-2)으로 데이터 행과 합계 행을 시각적 분리 -->
            <td
              class="border-t-2 border-t-slate-300 border-r border-slate-200 px-4 py-3 text-center align-middle text-xs font-semibold text-slate-500"
              :rowspan="summaryRows.length"
            >
              {{ filteredRows.length }}건
            </td>
            <!-- "합계" 텍스트: 거래처 + 국가 + 영업담당자 영역을 가로·세로 병합 -->
            <td
              class="border-t-2 border-t-slate-300 border-r border-slate-200 px-4 py-3 text-center align-middle text-base font-extrabold text-slate-800"
              :rowspan="summaryRows.length"
              colspan="3"
            >
              합계
            </td>
          </template>
          <!-- 통화 컬럼: 행마다 해당 통화 코드 표시 -->
          <!-- 첫 행은 두꺼운 상단 보더, 이후 행은 기본 보더 -->
          <td
            class="border-r border-slate-200 px-4 py-3 text-center text-xs font-bold text-slate-700"
            :class="index === 0 ? 'border-t-2 border-t-slate-300' : 'border-t border-slate-200'"
          >
            {{ summary.currency }}
          </td>
          <!-- 매출액 컬럼: 통화 기호 + 합산 금액 (예: $142,900) -->
          <td
            class="border-r border-slate-200 px-4 py-3 text-right text-sm font-extrabold text-slate-800"
            :class="index === 0 ? 'border-t-2 border-t-slate-300' : 'border-t border-slate-200'"
          >
            {{ formatAmount(summary.total, summary.currency) }}
          </td>
          <!-- 발행일, 수금일, 상태: 비움, 첫 행에서만 세로 병합 -->
          <template v-if="index === 0">
            <td
              class="border-t-2 border-t-slate-300 px-4 py-3"
              :rowspan="summaryRows.length"
              colspan="3"
            ></td>
          </template>
        </tr>
      </template>
    </BaseTable>
  </div>
</template>
