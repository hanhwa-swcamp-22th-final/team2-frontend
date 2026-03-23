<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { usePagination } from '@/composables/usePagination'
import { useSearchModalLookups } from '@/composables/useSearchModalLookups'
import { useSalesCollectionDocuments, normalizeSalesCollectionRow } from '@/stores/salesCollectionDocuments'
import { openTableOutput } from '@/utils/documentOutput'
import { convertCurrencyAmountToKrw } from '@/utils/exchangeRate'
import { clientSearchColumns } from '@/utils/searchModalColumns'
import { buildSelectOptionsFromRows } from '@/utils/selectOptions'

const isAdvancedOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const poSearchOpen = ref(false)
const poSearchKeyword = ref('')
const viewScope = ref('all')
const currencyFilter = ref('')
const appliedCurrencyFilter = ref('')
const statusConfirmOpen = ref(false)
const pendingStatusChange = ref(null)

const columns = [
  { key: 'poId', label: 'PO 번호', width: '140px' },
  { key: 'clientName', label: '거래처', width: '220px' },
  { key: 'country', label: '국가', width: '110px' },
  { key: 'manager', label: '영업담당자', width: '120px' },
  { key: 'currency', label: '통화', width: '90px' },
  { key: 'salesAmount', label: '외화금액', width: '150px' },
  { key: 'salesAmountKrw', label: '원화환산액', width: '170px' },
  { key: 'issueDate', label: '발행일자', width: '130px' },
  { key: 'collectionDate', label: '수금일자', width: '130px' },
  { key: 'status', label: '수금상태', width: '120px' },
]

const rowsData = useSalesCollectionDocuments()
const statusOptions = computed(() => buildSelectOptionsFromRows(rowsData.value, 'status'))

function createOptionList(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => String(left).localeCompare(String(right), 'ko'))
    .map((value) => ({ value, label: value }))
}

const countryOptions = computed(() => createOptionList(rowsData.value.map((row) => row.country)))
const currencyOptions = computed(() => createOptionList(rowsData.value.map((row) => row.currency)))
const managerOptions = computed(() => createOptionList(rowsData.value.map((row) => row.manager)))

const { createClientRows } = useSearchModalLookups()

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

const enrichedRows = computed(() => filteredRows.value.map((row) => ({
  ...row,
  salesAmountKrw: convertCurrencyAmountToKrw(row.salesAmount, row.currency, row.issueDate?.replaceAll('/', '-')),
})))

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

const totalKrwAmount = computed(() => sortedRows.value.reduce((sum, row) => sum + row.salesAmountKrw, 0))

const clientRows = createClientRows(clientSearchKeyword)

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

const statusConfirmRows = computed(() => {
  if (!pendingStatusChange.value) return []

  return [
    { label: 'PO 번호', value: pendingStatusChange.value.poId },
    { label: '거래처', value: pendingStatusChange.value.clientName },
    { label: '현재 수금상태', value: pendingStatusChange.value.currentStatus },
    { label: '변경 수금상태', value: pendingStatusChange.value.nextStatus },
    { label: '수금일자 처리', value: pendingStatusChange.value.collectionDatePolicy, fullWidth: true },
  ]
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
  if (typeof value === 'number') {
    return `${symbol}${value.toLocaleString()}`
  }
  return `${symbol}${value}`
}

function formatCollectionDate(value) {
  return value || '-'
}

function getTodaySlashDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function resolveNextCollectionDate(row, nextStatusValue) {
  if (nextStatusValue === 'PAID') {
    return row.status === '수금완료' ? row.collectionDate : getTodaySlashDate()
  }

  return null
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

function openClientSearch() {
  clientSearchOpen.value = true
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

function openStatusConfirm(row, nextStatusValue) {
  const nextStatus = nextStatusValue === 'PAID' ? '수금완료' : '미수금'
  const nextCollectionDate = resolveNextCollectionDate(row, nextStatusValue)

  pendingStatusChange.value = {
    poId: row.poId,
    clientName: row.clientName,
    currentStatus: row.status,
    nextStatus,
    nextStatusValue,
    nextCollectionDate,
    collectionDatePolicy: nextStatus === '수금완료'
      ? `수금일자가 ${formatCollectionDate(nextCollectionDate)} 로 반영됩니다.`
      : '수금일자가 초기화되고 화면에는 - 로 표시됩니다.',
  }
  statusConfirmOpen.value = true
}

function updateStatus(poId, value) {
  rowsData.value = rowsData.value.map((row) => (
    row.poId === poId
      ? normalizeSalesCollectionRow({
        ...row,
        status: value === 'PAID' ? '수금완료' : '미수금',
        collectionDate: resolveNextCollectionDate(row, value),
      })
      : row
  ))
}

function confirmStatusChange() {
  if (!pendingStatusChange.value) return

  updateStatus(pendingStatusChange.value.poId, pendingStatusChange.value.nextStatusValue)
  statusConfirmOpen.value = false
  pendingStatusChange.value = null
}

function cancelStatusChange() {
  statusConfirmOpen.value = false
  pendingStatusChange.value = null
}

function downloadCurrentTablePdf() {
  const exportColumns = [
    { key: 'poId', label: 'PO 번호', align: 'center' },
    { key: 'clientName', label: '거래처', align: 'left' },
    { key: 'country', label: '국가', align: 'center' },
    { key: 'manager', label: '영업담당자', align: 'center' },
    { key: 'currency', label: '통화', align: 'center' },
    { key: 'salesAmount', label: '외화금액', align: 'right' },
    { key: 'salesAmountKrw', label: '원화환산액', align: 'right' },
    { key: 'issueDate', label: '발행일자', align: 'center' },
    { key: 'collectionDate', label: '수금일자', align: 'center' },
    { key: 'status', label: '수금상태', align: 'center' },
  ]

  const exportRows = []
  let currentCurrency = ''
  let originalSubtotal = 0
  let krwSubtotal = 0
  let rowCount = 0

  sortedRows.value.forEach((row, index) => {
    if (currentCurrency && currentCurrency !== row.currency) {
      exportRows.push({
        poId: `${currentCurrency} 통화 소계 (${rowCount}건)`,
        clientName: '',
        country: '',
        manager: '',
        currency: currentCurrency,
        salesAmount: formatAmount(originalSubtotal, currentCurrency),
        salesAmountKrw: formatAmount(krwSubtotal, 'KRW'),
        issueDate: '',
        collectionDate: '',
        status: '',
        rowType: 'summary',
      })
      originalSubtotal = 0
      krwSubtotal = 0
      rowCount = 0
    }

    currentCurrency = row.currency
    originalSubtotal += row.salesAmount
    krwSubtotal += row.salesAmountKrw
    rowCount += 1

    exportRows.push({
      poId: row.poId,
      clientName: row.clientName,
      country: row.country,
      manager: row.manager,
      currency: row.currency,
      salesAmount: formatAmount(row.salesAmount, row.currency),
      salesAmountKrw: formatAmount(row.salesAmountKrw, 'KRW'),
      issueDate: row.issueDate,
      collectionDate: formatCollectionDate(row.collectionDate),
      status: row.status,
    })

    if (index === sortedRows.value.length - 1) {
      exportRows.push({
        poId: `${currentCurrency} 통화 소계 (${rowCount}건)`,
        clientName: '',
        country: '',
        manager: '',
        currency: currentCurrency,
        salesAmount: formatAmount(originalSubtotal, currentCurrency),
        salesAmountKrw: formatAmount(krwSubtotal, 'KRW'),
        issueDate: '',
        collectionDate: '',
        status: '',
        rowType: 'summary',
      })
    }
  })

  if (sortedRows.value.length > 0) {
    exportRows.push({
      poId: '원화환산 총계',
      clientName: '',
      country: '',
      manager: '',
      currency: 'KRW',
      salesAmount: '',
      salesAmountKrw: formatAmount(totalKrwAmount.value, 'KRW'),
      issueDate: '',
      collectionDate: '',
      status: '',
      rowType: 'summary',
    })
  }

  openTableOutput({
    title: '매출·수금 현황 관리',
    subtitle: `총 ${sortedRows.value.length}건`,
    columns: exportColumns,
    rows: exportRows,
  })
}
</script>

<template>
  <div class="fade-in space-y-5">
    <PageHeader title="매출·수금 현황 관리" icon-class="fas fa-chart-bar">
      <template #actions>
        <BaseButton variant="secondary" @click="downloadCurrentTablePdf">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
          </template>
          PDF 다운로드
        </BaseButton>
      </template>
    </PageHeader>

    <FilterToolbarCard
      v-model="filters.keyword"
      :advanced-open="isAdvancedOpen"
      @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
    />

    <CollapsibleFilterCard :open="isAdvancedOpen">
      <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-4">
        <FormField label="발행일자" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filters.registeredFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.registeredTo" />
          </div>
        </FormField>

        <FormField label="수금일자" class="col-span-2">
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

        <FormField label="수금상태">
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
                <td colspan="5" class="border-b border-r border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-800">
                  {{ row.currency }} 통화 소계 ({{ row.rowCount }}건)
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
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                  {{ row.country }}
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                  {{ row.manager }}
                </td>
                <td class="border-b border-r border-slate-200 px-4 py-3 text-center text-sm">
                  <span class="text-xs font-semibold text-slate-700">{{ row.currency }}</span>
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
                  {{ formatCollectionDate(row.collectionDate) }}
                </td>
                <td class="border-b border-slate-200 px-4 py-3 text-center text-sm">
                  <select
                    class="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:border-brand-400 focus:outline-none"
                    :value="row.status === '수금완료' ? 'PAID' : 'UNPAID'"
                    @change="openStatusConfirm(row, $event.target.value)"
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
              <td colspan="6" class="border-t border-r border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-900">
                원화환산 총계
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
      :columns="clientSearchColumns"
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
        { key: 'issueDate', label: '발행일자' },
      ]"
      :rows="poRows"
      :search-keyword="poSearchKeyword"
      @update:search-keyword="poSearchKeyword = $event"
      @close="poSearchOpen = false"
      @select="handlePoSelect"
    />

    <ConfirmModal
      :open="statusConfirmOpen"
      title="수금상태 변경"
      message="선택한 수금상태를 반영하시겠습니까?"
      :detail-rows="statusConfirmRows"
      confirm-label="변경"
      helper-text="수금상태 변경 시 수금일자도 함께 조정됩니다."
      width="max-w-lg"
      @confirm="confirmStatusChange"
      @cancel="cancelStatusChange"
    />
  </div>
</template>
