<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'

const isAdvancedOpen = ref(true)
const previewTarget = ref(null)

const filters = ref({
  keyword: '',
  registeredFrom: '',
  registeredTo: '',
  clientName: '',
  code: '',
  productName: '',
  country: '',
})

const appliedFilters = ref({
  ...filters.value,
})

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '독일', label: '독일' },
  { value: '미국', label: '미국' },
  { value: '태국', label: '태국' },
  { value: '싱가포르', label: '싱가포르' },
]

const columns = [
  { key: 'id', label: 'CI번호', align: 'center', width: '150px' },
  { key: 'invoiceDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rows = [
  {
    id: 'CI26001',
    invoiceDate: '2026/02/18',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
  },
  {
    id: 'CI26002',
    invoiceDate: '2026/02/28',
    clientName: 'TechBridge GmbH',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
  },
  {
    id: 'CI26003',
    invoiceDate: '2026/03/12',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
  },
]

function normalizeDate(value) {
  return String(value ?? '').replaceAll('/', '-')
}

const filteredRows = computed(() => {
  return rows.filter((row) => {
    const keyword = appliedFilters.value.keyword.trim().toLowerCase()

    if (keyword) {
      const keywordMatched = [
        row.id,
        row.invoiceDate,
        row.clientName,
        row.country,
        row.itemName,
        row.amount,
      ].some((value) => String(value).toLowerCase().includes(keyword))

      if (!keywordMatched) return false
    }

    if (appliedFilters.value.clientName && !row.clientName.toLowerCase().includes(appliedFilters.value.clientName.toLowerCase())) return false
    if (appliedFilters.value.code && !row.id.toLowerCase().includes(appliedFilters.value.code.toLowerCase())) return false
    if (appliedFilters.value.productName && !row.itemName.toLowerCase().includes(appliedFilters.value.productName.toLowerCase())) return false
    if (appliedFilters.value.country && row.country !== appliedFilters.value.country) return false

    const invoiceDate = normalizeDate(row.invoiceDate)

    if (appliedFilters.value.registeredFrom && invoiceDate < appliedFilters.value.registeredFrom) return false
    if (appliedFilters.value.registeredTo && invoiceDate > appliedFilters.value.registeredTo) return false

    return true
  })
})

const previewFields = computed(() => {
  if (!previewTarget.value) {
    return []
  }

  return [
    { label: '발행일', value: previewTarget.value.invoiceDate },
    { label: '거래처', value: previewTarget.value.clientName },
    { label: '국가', value: previewTarget.value.country },
    { label: '품목명', value: previewTarget.value.itemName },
    { label: '총액', value: previewTarget.value.amount },
  ]
})

function resetFilters() {
  filters.value = {
    keyword: '',
    registeredFrom: '',
    registeredTo: '',
    clientName: '',
    code: '',
    productName: '',
    country: '',
  }

  appliedFilters.value = {
    ...filters.value,
  }
}

function openClientSearch() {}

function openCodeSearch() {}

function openProductSearch() {}

function searchRows() {
  appliedFilters.value = {
    ...filters.value,
  }
}

function openPreview(row) {
  previewTarget.value = row
}

function closePreview() {
  previewTarget.value = null
}
</script>

<template>
  <div class="fade-in space-y-5">
    <DocumentPageHeader title="CI (Commercial Invoice)" icon-class="fas fa-file-invoice-dollar">
      <template #actions>
        <BaseButton variant="secondary" size="sm">
          <template #leading>
            <i class="fas fa-print text-xs" aria-hidden="true"></i>
          </template>
          인쇄
        </BaseButton>
        <BaseButton size="sm">
          <template #leading>
            <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
          </template>
          PDF 다운로드
        </BaseButton>
      </template>
    </DocumentPageHeader>

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

        <FormField label="거래처명">
          <SearchTriggerField
            v-model="filters.clientName"
            placeholder="거래처 검색..."
            title="거래처 검색"
            @trigger="openClientSearch"
          />
        </FormField>

        <FormField label="CI번호">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="CI번호"
            title="CI번호 검색"
            @trigger="openCodeSearch"
          />
        </FormField>

        <FormField label="품목명">
          <SearchTriggerField
            v-model="filters.productName"
            placeholder="품목명 검색..."
            title="품목명 검색"
            @trigger="openProductSearch"
          />
        </FormField>

        <FormField label="국가">
          <SearchableCombobox
            v-model="filters.country"
            :options="countryOptions"
            placeholder="국가 검색..."
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
      :footer-text="`총 ${filteredRows.length}건`"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs font-semibold text-brand-600">{{ value }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-2">
          <button
            type="button"
            class="text-xs text-brand-500 transition hover:underline"
            :title="`${row.id} 미리보기`"
            @click="openPreview(row)"
          >
            <i class="fas fa-eye mr-1" aria-hidden="true"></i>미리보기
          </button>
        </div>
      </template>
    </BaseTable>

    <DocumentPreviewModal
      :open="Boolean(previewTarget)"
      title="CI 미리보기"
      :document-title="previewTarget?.id"
      :fields="previewFields"
      @close="closePreview"
    />
  </div>
</template>
