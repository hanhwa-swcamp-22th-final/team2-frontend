<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { usePagination } from '@/composables/usePagination'
import { convertCurrencyAmountToKrw } from '@/utils/exchangeRate'

const isAdvancedOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const poSearchOpen = ref(false)
const poSearchKeyword = ref('')
const viewScope = ref('all')
const currencyFilter = ref('')
const appliedCurrencyFilter = ref('')

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
  { key: 'currency', label: '통화', align: 'center', width: '90px' },
  { key: 'salesAmount', label: '원문매출액', align: 'right', width: '150px' },
  { key: 'salesAmountKrw', label: '환산매출액(KRW)', align: 'right', width: '170px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'collectionDate', label: '수금일', align: 'center', width: '130px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
]

const rowsData = ref([
  {
    poId: 'PO26001',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    manager: '김영업',
    currency: 'USD',
    salesAmount: 42400,
    issueDate: '2026/02/10',
    collectionDate: '2026/03/10',
    status: '미수금',
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
    status: '미수금',
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
    status: '미수금',
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
    status: '미수금',
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
    status: '미수금',
  },
])

const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아' },
  { id: 'CL002', name: 'Sakura Electronics Co., Ltd.', country: '일본' },
  { id: 'CL003', name: 'Viet Steel JSC', country: '베트남' },
  { id: 'CL004', name: 'Al Baraka Trading LLC', country: 'UAE' },
]

function openClientSearch() {
  clientSearchOpen.value = true
}

const {
  filters,
  filteredRows: baseFilteredRows,
  resetFilters: resetBaseFilters,
  applyFilters,
} = useDocumentFilter(rowsData, {
  keywordFields: ['poId', 'clientName', 'manager', 'country', 'currency', 'status', 'issueDate', 'collectionDate'],
  issueDateField: 'issueDate',
  deliveryDateField: 'collectionDate',
  codeField: 'poId',
})

const filteredRows = computed(() => {
  let rows = baseFilteredRows.value

  if (viewScope.value === 'krw') {
    rows = rows.filter((row) => row.currency === 'KRW')
  } else if (viewScope.value === 'foreign') {
    rows = rows.filter((row) => row.currency !== 'KRW')
  }

  return rows.filter((row) => !appliedCurrencyFilter.value || row.currency === appliedCurrencyFilter.value)
})

const enrichedRows = computed(() => {
  return filteredRows.value.map((row) => ({
    ...row,
    salesAmountKrw: convertCurrencyAmountToKrw(row.salesAmount, row.currency, row.issueDate?.replaceAll('/', '-')),
  }))
})

const sortedRows = computed(() => {
  return [...enrichedRows.value].sort((left, right) => {
    const currencyCompare = left.currency.localeCompare(right.currency)

    if (currencyCompare !== 0) {
      return currencyCompare
    }

    return right.issueDate.localeCompare(left.issueDate)
  })
})

const { currentPage, totalPages, paginatedRows } = usePagination(sortedRows)
const totalKrwAmount = computed(() => sortedRows.value.reduce((sum, row) => sum + row.salesAmountKrw, 0))
const tableRows = computed(() => {
  const rows = []
  let currentCurrency = ''
  let originalSubtotal = 0
  let krwSubtotal = 0
  let rowCount = 0

  paginatedRows.value.forEach((row, index) => {
    if (currentCurrency && currentCurrency !== row.currency) {
      rows.push({
        rowKey: `subtotal-${currentCurrency}-${index}`,
        rowType: 'subtotal',
        currency: currentCurrency,
        originalSubtotal,
        krwSubtotal,
        rowCount,
      })

      originalSubtotal = 0
      krwSubtotal = 0
      rowCount = 0
    }

    currentCurrency = row.currency
    originalSubtotal += row.salesAmount
    krwSubtotal += row.salesAmountKrw
    rowCount += 1

    rows.push({
      ...row,
      rowKey: `row-${row.poId}`,
      rowType: 'data',
    })
  })

  if (currentCurrency) {
    rows.push({
      rowKey: `subtotal-${currentCurrency}-final`,
      rowType: 'subtotal',
      currency: currentCurrency,
      originalSubtotal,
      krwSubtotal,
      rowCount,
    })
  }

  return rows
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((row) => [row.id, row.name, row.country].some((value) => String(value).toLowerCase().includes(keyword)))
})

const poRows = computed(() => {
  const keyword = poSearchKeyword.value.trim().toLowerCase()
  const source = rowsData.value.map((row) => ({
    poId: row.poId,
    clientName: row.clientName,
    issueDate: row.issueDate,
  }))
  if (!keyword) return source
  return source.filter((row) => [row.poId, row.clientName, row.issueDate].some((value) => String(value).toLowerCase().includes(keyword)))
})

const currencySymbols = {
  KRW: '₩',
  USD: '$',
  JPY: '¥',
  EUR: '€',
  GBP: '£',
}

function formatAmount(value, currency) {
  const symbol = currencySymbols[currency] || ''
  if (typeof value === 'number') return `${symbol}${value.toLocaleString()}`
  return `${symbol}${value}`
}

function resetFilters() {
  resetBaseFilters()
  currencyFilter.value = ''
  appliedCurrencyFilter.value = ''
}

function searchRows() {
  appliedCurrencyFilter.value = currencyFilter.value
  applyFilters()
}

function handleClientSelect(client) {
  filters.value.clientName = client.name
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function openPoSearch() {
  poSearchOpen.value = true
}

function handlePoSelect(row) {
  filters.value.code = row.poId
  poSearchOpen.value = false
  poSearchKeyword.value = ''
}

function updateStatus(poId, value) {
  rowsData.value = rowsData.value.map((row) => (
    row.poId === poId
      ? {
        ...row,
        status: value === 'PAID' ? '수금완료' : '미수금',
      }
      : row
  ))
}
</script>

<template>
  <div class="fade-in space-y-5">
    <PageHeader title="매출·수금 현황 관리" icon-class="fas fa-chart-bar" />

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard :open="isAdvancedOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
          <FormField label="발행일" class="col-span-2">
            <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <DateField v-model="filters.registeredFrom" />
              <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
              <DateField v-model="filters.registeredTo" />
            </div>
          </FormField>

          <FormField label="수금일" class="col-span-2">
            <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <DateField v-model="filters.deliveryFrom" />
              <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
              <DateField v-model="filters.deliveryTo" />
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
              v-model="currencyFilter"
              :options="currencyOptions"
              placeholder="통화 선택..."
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

      <div class="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <BaseButton variant="secondary" size="sm" @click="resetFilters">
          <template #leading>
            <i class="fas fa-undo text-xs" aria-hidden="true"></i>
          </template>
          초기화
        </BaseButton>
        <BaseButton size="sm" @click="searchRows">
          <template #leading>
            <i class="fas fa-search text-xs" aria-hidden="true"></i>
          </template>
          검색
        </BaseButton>
      </div>
    </CollapsibleFilterCard>

    <section class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-semibold text-slate-700">표시 기준</span>
        <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="viewScope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            @click="viewScope = 'all'"
          >
            전체
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="viewScope === 'krw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            @click="viewScope = 'krw'"
          >
            원화
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="viewScope === 'foreign' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            @click="viewScope = 'foreign'"
          >
            외화
          </button>
        </div>
      </div>
      <div class="text-xs text-slate-500">
        통화별로 정렬된 행 뒤에 소계를 표시하고, 맨 아래에서 전체 환산 총액을 확인합니다.
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-slate-50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="border-b border-r border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 last:border-r-0"
                :style="{ width: column.width, minWidth: column.width }"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody v-if="tableRows.length > 0" class="bg-white">
            <tr
              v-for="row in tableRows"
              :key="row.rowKey"
              :class="row.rowType === 'subtotal' ? 'bg-slate-50' : 'transition hover:bg-slate-50/70'"
            >
              <template v-if="row.rowType === 'subtotal'">
                <td colspan="3" class="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                  {{ row.currency }} 소계 ({{ row.rowCount }}건)
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800">
                  {{ formatAmount(row.originalSubtotal, row.currency) }}
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-right text-sm font-bold text-slate-900">
                  {{ formatAmount(row.krwSubtotal, 'KRW') }}
                </td>
                <td colspan="3" class="border-b border-slate-200 px-4 py-3 text-right text-xs text-slate-400"></td>
              </template>

              <template v-else>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-sm">
                  <span class="font-mono text-xs font-semibold text-brand-600">
                    {{ row.poId }}
                  </span>
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-left text-sm">
                  <span class="font-medium text-slate-900">{{ row.clientName }}</span>
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-sm">
                  <span class="text-xs font-semibold text-slate-700">
                    {{ row.currency }}
                  </span>
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-right text-sm">
                  <span class="font-semibold text-slate-800">
                    {{ formatAmount(row.salesAmount, row.currency) }}
                  </span>
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-right text-sm">
                  <span class="font-semibold text-slate-900">
                    {{ formatAmount(row.salesAmountKrw, 'KRW') }}
                  </span>
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-xs text-slate-700">
                  {{ row.issueDate }}
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-xs text-slate-700">
                  {{ row.collectionDate }}
                </td>
                <td class="border-b border-slate-200 px-4 py-3 text-center text-sm">
                  <select
                    class="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-brand-400 focus:outline-none"
                    :value="row.status === '수금완료' ? 'PAID' : 'UNPAID'"
                    @change="updateStatus(row.poId, $event.target.value)"
                  >
                    <option value="UNPAID">미수금</option>
                    <option value="PAID">수금완료</option>
                  </select>
                </td>
              </template>
            </tr>
          </tbody>
          <tfoot v-if="tableRows.length > 0" class="bg-slate-50">
            <tr>
              <td colspan="4" class="border-t border-r border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-900">
                전체 환산 총액
              </td>
              <td class="border-t border-r border-slate-200 px-4 py-3 text-right text-sm font-extrabold text-slate-900">
                {{ formatAmount(totalKrwAmount, 'KRW') }}
              </td>
              <td colspan="3" class="border-t border-slate-200 px-4 py-3 text-right text-xs text-slate-400">
                KRW 기준 집계
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div
        v-if="tableRows.length === 0"
        class="flex min-h-[160px] items-center justify-center border-t border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400"
      >
        데이터가 없습니다.
      </div>
    </section>

    <BasePagination
      v-model:current-page="currentPage"
      :total-pages="totalPages"
    />

    <SearchModal
      :open="clientSearchOpen"
      title="거래처 검색"
      :columns="[
        { key: 'id', label: '코드' },
        { key: 'name', label: '거래처명' },
        { key: 'country', label: '국가' },
      ]"
      :rows="clientRows"
      :search-keyword="clientSearchKeyword"
      @update:search-keyword="clientSearchKeyword = $event"
      @close="clientSearchOpen = false"
      @select="handleClientSelect"
    />

    <SearchModal
      :open="poSearchOpen"
      title="PO 번호 검색"
      :columns="[
        { key: 'poId', label: 'PO 번호' },
        { key: 'clientName', label: '거래처명' },
        { key: 'issueDate', label: '발행일' },
      ]"
      :rows="poRows"
      :search-keyword="poSearchKeyword"
      @update:search-keyword="poSearchKeyword = $event"
      @close="poSearchOpen = false"
      @select="handlePoSelect"
    />
  </div>
</template>
