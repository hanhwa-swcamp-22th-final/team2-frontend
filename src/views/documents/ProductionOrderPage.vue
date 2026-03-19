<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPageHeader from '@/components/common/DocumentPageHeader.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useToast } from '@/composables/useToast'

const isAdvancedOpen = ref(true)
const previewTarget = ref(null)
const toast = useToast()

const filters = ref({
  keyword: '',
  registeredFrom: '',
  registeredTo: '',
  manager: '',
  clientName: '',
  code: '',
  productName: '',
  country: '',
  status: '',
  deliveryFrom: '',
  deliveryTo: '',
})

const appliedFilters = ref({
  ...filters.value,
})

const managerOptions = [
  { value: '김영업', label: '김영업' },
  { value: '정영업', label: '정영업' },
  { value: '최관리', label: '최관리' },
]

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '독일', label: '독일' },
  { value: '미국', label: '미국' },
  { value: '태국', label: '태국' },
  { value: '싱가포르', label: '싱가포르' },
  { value: '인도', label: '인도' },
]

const statusOptions = [
  { value: '대기', label: '대기' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
]

const columns = [
  { key: 'id', label: '지시서번호', align: 'center', width: '150px' },
  { key: 'issueDate', label: '생산지시일', align: 'center', width: '130px' },
  { key: 'poId', label: 'PO', align: 'center', width: '140px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'dueDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rows = [
  {
    id: 'MO2026001',
    issueDate: '2026/02/24',
    poId: 'PO26001',
    country: '말레이시아',
    clientName: 'COOLSAY SDN BHD',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    status: '완료',
    dueDate: '2026/04/20',
  },
  {
    id: 'MO2026002',
    issueDate: '2026/03/03',
    poId: 'PO26002',
    country: '독일',
    clientName: 'TechBridge GmbH',
    itemName: 'H-Beam 482x300x11x15',
    manager: '김영업',
    status: '진행중',
    dueDate: '2026/05/25',
  },
  {
    id: 'MO2026003',
    issueDate: '2026/03/14',
    poId: 'PO26003',
    country: '미국',
    clientName: 'Pacific Trading Inc.',
    itemName: 'Lubricant Oil SAE 10W-40',
    manager: '정영업',
    status: '대기',
    dueDate: '2026/06/05',
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
        row.issueDate,
        row.poId,
        row.country,
        row.clientName,
        row.itemName,
        row.manager,
        row.status,
        row.dueDate,
      ].some((value) => String(value).toLowerCase().includes(keyword))

      if (!keywordMatched) return false
    }

    if (appliedFilters.value.manager && row.manager !== appliedFilters.value.manager) return false
    if (appliedFilters.value.clientName && !row.clientName.toLowerCase().includes(appliedFilters.value.clientName.toLowerCase())) return false
    if (appliedFilters.value.code && !row.id.toLowerCase().includes(appliedFilters.value.code.toLowerCase())) return false
    if (appliedFilters.value.productName && !row.itemName.toLowerCase().includes(appliedFilters.value.productName.toLowerCase())) return false
    if (appliedFilters.value.country && row.country !== appliedFilters.value.country) return false
    if (appliedFilters.value.status && row.status !== appliedFilters.value.status) return false

    const issueDate = normalizeDate(row.issueDate)
    const dueDate = normalizeDate(row.dueDate)

    if (appliedFilters.value.registeredFrom && issueDate < appliedFilters.value.registeredFrom) return false
    if (appliedFilters.value.registeredTo && issueDate > appliedFilters.value.registeredTo) return false
    if (appliedFilters.value.deliveryFrom && dueDate < appliedFilters.value.deliveryFrom) return false
    if (appliedFilters.value.deliveryTo && dueDate > appliedFilters.value.deliveryTo) return false

    return true
  })
})

const previewFields = computed(() => {
  if (!previewTarget.value) {
    return []
  }

  return [
    { label: '생산지시일', value: previewTarget.value.issueDate },
    { label: 'PO', value: previewTarget.value.poId },
    { label: '국가', value: previewTarget.value.country },
    { label: '거래처', value: previewTarget.value.clientName },
    { label: '품목명', value: previewTarget.value.itemName },
    { label: '영업담당자', value: previewTarget.value.manager },
    { label: '상태', value: previewTarget.value.status },
    { label: '납기일', value: previewTarget.value.dueDate },
  ]
})

function resetFilters() {
  filters.value = {
    keyword: '',
    registeredFrom: '',
    registeredTo: '',
    manager: '',
    clientName: '',
    code: '',
    productName: '',
    country: '',
    status: '',
    deliveryFrom: '',
    deliveryTo: '',
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

function printDocument(row) {
  toast.info(`${row.id} 인쇄 기능은 다음 단계에서 연결됩니다.`, '인쇄')
}

function downloadPdf(row) {
  toast.info(`${row.id} PDF 다운로드 기능은 다음 단계에서 연결됩니다.`, 'PDF')
}
</script>

<template>
  <div class="fade-in space-y-5">
    <DocumentPageHeader title="생산지시서" icon-class="fas fa-industry">
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="toast.info('생산지시서 인쇄 기능은 다음 단계에서 연결됩니다.', '인쇄')">
          <template #leading>
            <i class="fas fa-print text-xs" aria-hidden="true"></i>
          </template>
          인쇄
        </BaseButton>
        <BaseButton size="sm" @click="toast.info('생산지시서 PDF 다운로드 기능은 다음 단계에서 연결됩니다.', 'PDF')">
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
        <FormField label="생산지시일" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filters.registeredFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.registeredTo" />
          </div>
        </FormField>

        <FormField label="영업담당자">
          <SearchableCombobox
            v-model="filters.manager"
            :options="managerOptions"
            placeholder="담당자 검색..."
          />
        </FormField>

        <FormField label="거래처명">
          <SearchTriggerField
            v-model="filters.clientName"
            placeholder="거래처 검색..."
            title="거래처 검색"
            @trigger="openClientSearch"
          />
        </FormField>

        <FormField label="지시서번호">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="지시서번호"
            title="지시서번호 검색"
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

        <FormField label="상태">
          <SearchableCombobox
            v-model="filters.status"
            :options="statusOptions"
            placeholder="상태 선택..."
          />
        </FormField>

        <FormField label="납기일" class="col-span-2">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <DateField v-model="filters.deliveryFrom" />
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <DateField v-model="filters.deliveryTo" />
          </div>
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

      <template #cell-poId="{ value }">
        <span class="text-brand-500 hover:underline">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-2">
          <button type="button" class="text-xs text-brand-500 transition hover:underline" :title="`${row.id} 미리보기`" @click="openPreview(row)">
            <i class="fas fa-eye" aria-hidden="true"></i>
          </button>
          <button type="button" class="text-xs text-slate-400 transition hover:text-slate-700" :title="`${row.id} 인쇄`" @click="printDocument(row)">
            <i class="fas fa-print" aria-hidden="true"></i>
          </button>
          <button type="button" class="text-xs text-slate-400 transition hover:text-slate-700" :title="`${row.id} PDF 다운로드`" @click="downloadPdf(row)">
            <i class="fas fa-file-pdf" aria-hidden="true"></i>
          </button>
        </div>
      </template>
    </BaseTable>

    <DocumentPreviewModal
      :open="Boolean(previewTarget)"
      title="생산지시서 미리보기"
      :document-title="previewTarget?.id ?? ''"
      :fields="previewFields"
      @close="closePreview"
    />
  </div>
</template>
