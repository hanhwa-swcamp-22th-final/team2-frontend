<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'

const isAdvancedOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const poSearchOpen = ref(false)
const poSearchKeyword = ref('')
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
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  { key: 'currency', label: '통화', align: 'center', width: '80px' },
  { key: 'salesAmount', label: '매출액', align: 'right', width: '150px' },
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
  return baseFilteredRows.value.filter((row) => !appliedCurrencyFilter.value || row.currency === appliedCurrencyFilter.value)
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

const summaryRows = computed(() => {
  const currencyMap = {}

  filteredRows.value.forEach((row) => {
    if (!currencyMap[row.currency]) {
      currencyMap[row.currency] = { count: 0, total: 0 }
    }
    currencyMap[row.currency].count += 1
    currencyMap[row.currency].total += row.salesAmount
  })

  return Object.entries(currencyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, data]) => ({
      currency,
      count: data.count,
      total: data.total,
      totalFormatted: data.total.toLocaleString(),
    }))
})

const currencySymbols = {
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
    <PageHeader title="매출·수금 현황" icon-class="fas fa-chart-bar" />

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

      <template #cell-currency="{ value }">
        <span class="text-xs font-semibold text-slate-700">{{ value }}</span>
      </template>

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
          @change="updateStatus(row.poId, $event.target.value)"
        >
          <option value="UNPAID">미수금</option>
          <option value="PAID">수금완료</option>
        </select>
      </template>

      <template #footer>
        <tr
          v-for="(summary, index) in summaryRows"
          :key="summary.currency"
          class="bg-slate-100/80"
        >
          <template v-if="index === 0">
            <td
              class="border-t-2 border-t-slate-300 border-r border-slate-200 px-4 py-3 text-center align-middle text-xs font-semibold text-slate-500"
              :rowspan="summaryRows.length"
            >
              {{ filteredRows.length }}건
            </td>
            <td
              class="border-t-2 border-t-slate-300 border-r border-slate-200 px-4 py-3 text-center align-middle text-base font-extrabold text-slate-800"
              :rowspan="summaryRows.length"
              colspan="3"
            >
              합계
            </td>
          </template>
          <td
            class="border-r border-slate-200 px-4 py-3 text-center text-xs font-bold text-slate-700"
            :class="index === 0 ? 'border-t-2 border-t-slate-300' : 'border-t border-slate-200'"
          >
            {{ summary.currency }}
          </td>
          <td
            class="border-r border-slate-200 px-4 py-3 text-right text-sm font-extrabold text-slate-800"
            :class="index === 0 ? 'border-t-2 border-t-slate-300' : 'border-t border-slate-200'"
          >
            {{ formatAmount(summary.total, summary.currency) }}
          </td>
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
