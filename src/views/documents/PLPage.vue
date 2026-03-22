<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PLDocumentTemplate from '@/components/domain/document/PLDocumentTemplate.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { usePagination } from '@/composables/usePagination'
import { openDocumentOutputByType } from '@/utils/documentOutput'

const isAdvancedOpen = ref(false)
const previewTarget = ref(null)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const codeSearchOpen = ref(false)
const codeSearchKeyword = ref('')
const productSearchOpen = ref(false)
const productSearchKeyword = ref('')

const countryOptions = [
  { value: '말레이시아', label: '말레이시아' },
  { value: '독일', label: '독일' },
  { value: '미국', label: '미국' },
  { value: '태국', label: '태국' },
  { value: '싱가포르', label: '싱가포르' },
]

const columns = [
  { key: 'id', label: 'PL번호', align: 'center', width: '150px' },
  { key: 'invoiceDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'grossWeight', label: '총중량(kg)', align: 'right', width: '150px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rowsData = ref([
  {
    id: 'PL26001',
    invoiceDate: '2026/02/18',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    grossWeight: '18,520',
  },
  {
    id: 'PL26002',
    invoiceDate: '2026/02/28',
    clientName: 'TechBridge GmbH',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    grossWeight: '24,860',
  },
  {
    id: 'PL26003',
    invoiceDate: '2026/03/12',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    grossWeight: '7,430',
  },
])

const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'invoiceDate', 'clientName', 'country', 'itemName', 'grossWeight'],
  issueDateField: 'invoiceDate',
})
const { currentPage, totalPages, paginatedRows } = usePagination(filteredRows)

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  const source = [...new Map(rowsData.value.map((row) => [row.clientName, { id: row.id, name: row.clientName, country: row.country }])).values()]
  if (!keyword) return source
  return source.filter((row) => [row.id, row.name, row.country].some((value) => String(value).toLowerCase().includes(keyword)))
})

const codeRows = computed(() => {
  const keyword = codeSearchKeyword.value.trim().toLowerCase()
  const source = rowsData.value.map((row) => ({ id: row.id, invoiceDate: row.invoiceDate, clientName: row.clientName }))
  if (!keyword) return source
  return source.filter((row) => [row.id, row.invoiceDate, row.clientName].some((value) => String(value).toLowerCase().includes(keyword)))
})

const productRows = computed(() => {
  const keyword = productSearchKeyword.value.trim().toLowerCase()
  const source = [...new Map(rowsData.value.map((row) => [row.itemName, { name: row.itemName, country: row.country, clientName: row.clientName }])).values()]
  if (!keyword) return source
  return source.filter((row) => [row.name, row.country, row.clientName].some((value) => String(value).toLowerCase().includes(keyword)))
})

/**
 * 목록 row 데이터를 PL 문서 템플릿이 필요로 하는 구조로 변환합니다.
 * CI와 동일한 헤더 구조이지만, 품목 컬럼이 중량/용적 기준입니다.
 */
const previewDoc = computed(() => {
  if (!previewTarget.value) return null
  const row = previewTarget.value
  return {
    id: row.id,
    issueDate: row.invoiceDate,
    clientName: row.clientName,
    buyer: '',
    country: row.country,
    incoterms: 'FOB BUSAN',
    deliveryDate: '',
    portOfDischarge: '',
    carrier: '',
    bookingNo: '',
    totalQuantity: '-',
    totalNetWeight: '-',
    totalGrossWeight: row.grossWeight || '-',
    totalMeasurement: '-',
    items: [
      {
        name: row.itemName,
        quantity: '-',
        netWeight: '-',
        grossWeight: row.grossWeight || '-',
        measurement: '-',
      },
    ],
  }
})

/**
 * 미리보기 모달에서 인쇄 버튼 클릭 시 호출.
 * documentOutput.js의 PL 빌더를 사용하여 새 창에 양식을 띄우고 인쇄합니다.
 */
function handlePrint() {
  if (previewDoc.value) {
    openDocumentOutputByType('PL', previewDoc.value, true)
  }
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function openCodeSearch() {
  codeSearchOpen.value = true
}

function openProductSearch() {
  productSearchOpen.value = true
}

function searchRows() {
  applyFilters()
}

function openPreview(row) {
  previewTarget.value = row
}

function closePreview() {
  previewTarget.value = null
}

function handleClientSelect(client) {
  filters.value.clientName = client.name
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function handleCodeSelect(row) {
  filters.value.code = row.id
  codeSearchOpen.value = false
  codeSearchKeyword.value = ''
}

function handleProductSelect(row) {
  filters.value.productName = row.name
  productSearchOpen.value = false
  productSearchKeyword.value = ''
}
</script>

<template>
  <div class="fade-in space-y-5">
    <PageHeader title="Packing List 관리" icon-class="fas fa-box-open">
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
    </PageHeader>

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

        <FormField label="PL번호">
          <SearchTriggerField
            v-model="filters.code"
            placeholder="PL번호"
            title="PL번호 검색"
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
      :rows="paginatedRows"
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

    <BasePagination
      v-model:current-page="currentPage"
      :total-pages="totalPages"
    />

    <!-- PL 문서 양식 미리보기 모달 (slot 모드) -->
    <DocumentPreviewModal
      :open="Boolean(previewTarget)"
      title="PL 미리보기"
      preview-background="white"
      @close="closePreview"
      @print="handlePrint"
    >
      <PLDocumentTemplate v-if="previewDoc" :document="previewDoc" />
    </DocumentPreviewModal>

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
      :open="codeSearchOpen"
      title="PL번호 검색"
      :columns="[
        { key: 'id', label: 'PL번호' },
        { key: 'invoiceDate', label: '발행일' },
        { key: 'clientName', label: '거래처명' },
      ]"
      :rows="codeRows"
      :search-keyword="codeSearchKeyword"
      @update:search-keyword="codeSearchKeyword = $event"
      @close="codeSearchOpen = false"
      @select="handleCodeSelect"
    />

    <SearchModal
      :open="productSearchOpen"
      title="품목명 검색"
      :columns="[
        { key: 'name', label: '품목명' },
        { key: 'country', label: '국가' },
        { key: 'clientName', label: '거래처명' },
      ]"
      :rows="productRows"
      :search-keyword="productSearchKeyword"
      @update:search-keyword="productSearchKeyword = $event"
      @close="productSearchOpen = false"
      @select="handleProductSelect"
    />
  </div>
</template>
