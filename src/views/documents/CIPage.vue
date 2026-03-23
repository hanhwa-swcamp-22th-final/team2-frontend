<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import CIDocumentTemplate from '@/components/domain/document/CIDocumentTemplate.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { usePagination } from '@/composables/usePagination'
import { useCiDocuments } from '@/stores/ciDocuments'
import { useToast } from '@/composables/useToast'
import { openDocumentOutputByType, openTableOutput } from '@/utils/documentOutput'
import { buildSelectOptionsFromRows } from '@/utils/selectOptions'

const router = useRouter()
const toast = useToast()
const isAdvancedOpen = ref(false)
const previewTarget = ref(null)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const codeSearchOpen = ref(false)
const codeSearchKeyword = ref('')
const productSearchOpen = ref(false)
const productSearchKeyword = ref('')

const clientSearchColumns = [
  { key: 'name', label: '거래처명', align: 'left', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '110px' },
  { key: 'buyer', label: '바이어', align: 'left', width: '220px' },
  { key: 'address', label: '영문주소', align: 'left', width: '320px' },
  { key: 'currency', label: '통화', align: 'center', width: '90px' },
  { key: 'status', label: '상태', align: 'center', width: '90px' },
]

const productSearchColumns = [
  { key: 'name', label: '품목명', align: 'left', width: '220px' },
  { key: 'hsCode', label: 'HS Code', align: 'center', width: '110px' },
  { key: 'quantity', label: '수량', align: 'right', width: '100px' },
  { key: 'unitPrice', label: '단가', align: 'right', width: '120px' },
  { key: 'amount', label: '금액', align: 'right', width: '120px' },
  { key: 'documentIds', label: '관련 CI', align: 'left', width: '180px' },
]

const columns = [
  { key: 'id', label: 'CI번호', align: 'center', width: '150px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'actions', label: '', align: 'center', width: '120px' },
]

const rowsData = useCiDocuments()

const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'issueDate', 'clientName', 'country', 'itemName', 'amount'],
  issueDateField: 'issueDate',
})
const { currentPage, totalPages, paginatedRows } = usePagination(filteredRows)
const countryOptions = computed(() => buildSelectOptionsFromRows(rowsData.value, 'country'))

function includesKeyword(values, keyword) {
  if (!keyword) return true
  return values.some((value) => String(value ?? '').toLowerCase().includes(keyword))
}

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  const uniqueRows = Array.from(new Map(
    rowsData.value.map((row) => [
      row.clientName,
      {
        id: `client-${row.clientName}`,
        name: row.clientName,
        country: row.country ?? '-',
        buyer: row.buyer ?? '-',
        address: row.clientAddress ?? '-',
        currency: row.currency ?? row.currencyCode ?? '-',
        status: row.status ?? '-',
      },
    ]),
  ).values())

  return uniqueRows.filter((row) => includesKeyword(
    [row.name, row.country, row.buyer, row.address, row.currency, row.status],
    keyword,
  ))
})

const codeRows = computed(() => {
  const keyword = codeSearchKeyword.value.trim().toLowerCase()
  const source = rowsData.value.map((row) => ({ id: row.id, issueDate: row.issueDate, clientName: row.clientName }))
  if (!keyword) return source
  return source.filter((row) => [row.id, row.issueDate, row.clientName].some((value) => String(value).toLowerCase().includes(keyword)))
})

const productRows = computed(() => {
  const keyword = productSearchKeyword.value.trim().toLowerCase()
  const aggregatedRows = new Map()

  rowsData.value.forEach((row) => {
    row.items?.forEach((item) => {
      const current = aggregatedRows.get(item.name)
      if (current) {
        current.documentIds.push(row.id)
        return
      }

      aggregatedRows.set(item.name, {
        id: `product-${item.name}`,
        name: item.name,
        hsCode: item.hsCode || '-',
        quantity: item.quantity || '-',
        unitPrice: item.unitPrice || '-',
        amount: item.amount || '-',
        documentIds: [row.id],
      })
    })
  })

  return Array.from(aggregatedRows.values())
    .map((row) => ({
      ...row,
      documentIds: row.documentIds.join(', '),
    }))
    .filter((row) => includesKeyword(
      [row.name, row.hsCode, row.quantity, row.unitPrice, row.amount, row.documentIds],
      keyword,
    ))
})

/**
 * 목록 row 데이터를 CI 문서 템플릿이 필요로 하는 구조로 변환합니다.
 * 왜 이렇게 하는가?
 *   → 목록에는 요약 정보만 있으므로, 템플릿이 필요로 하는 items 배열 등을
 *     단일 품목 기준으로 구성하여 양식이 렌더링될 수 있게 합니다.
 */
const currentOutputTarget = computed(() => previewTarget.value ?? paginatedRows.value[0] ?? null)

/**
 * 미리보기 모달에서 인쇄 버튼 클릭 시 호출.
 * documentOutput.js의 CI 빌더를 사용하여 새 창에 양식을 띄우고 인쇄합니다.
 */
function handlePrint() {
  if (previewTarget.value) {
    openDocumentOutputByType('CI', previewTarget.value, true)
  }
}

function printCurrentDocument() {
  if (!currentOutputTarget.value) {
    toast.info('출력할 Commercial Invoice가 없습니다.', '인쇄')
    return
  }

  openDocumentOutputByType('CI', currentOutputTarget.value, true)
}

function downloadCurrentPdf() {
  if (!currentOutputTarget.value) {
    toast.info('출력할 Commercial Invoice가 없습니다.', 'PDF')
    return
  }

  const opened = openDocumentOutputByType('CI', currentOutputTarget.value, false)
  if (opened) {
    toast.info('브라우저 인쇄 창에서 PDF로 저장할 수 있습니다.', 'PDF')
  }
}

function downloadTablePdf() {
  const exportColumns = columns
    .filter((column) => column.key !== 'actions')
    .map((column) => ({
      key: column.key,
      label: column.label,
      align: column.align ?? 'left',
    }))

  openTableOutput({
    title: 'Commercial Invoice 관리',
    subtitle: `총 ${filteredRows.value.length}건`,
    columns: exportColumns,
    rows: filteredRows.value.map((row) => ({
      id: row.id,
      issueDate: row.issueDate,
      clientName: row.clientName,
      country: row.country,
      itemName: row.itemName,
      amount: row.amount,
    })),
  })
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

function goToDetail(id) {
  router.push({ name: 'ci-detail', params: { id } })
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
    <PageHeader title="Commercial Invoice 관리" icon-class="fas fa-file-invoice-dollar">
      <template #actions>
        <BaseButton variant="secondary" @click="downloadTablePdf">
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
      :rows="paginatedRows"
      clickable-rows
      empty-text="데이터가 없습니다."
      :footer-text="`총 ${filteredRows.length}건`"
      @row-click="goToDetail($event.id)"
    >
      <template #cell-id="{ value }">
        <button type="button" class="font-mono text-xs font-semibold text-brand-600 hover:underline" @click.stop="goToDetail(value)">
          {{ value }}
        </button>
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

    <!-- CI 문서 양식 미리보기 모달 (slot 모드) -->
    <DocumentPreviewModal
      :open="Boolean(previewTarget)"
      title="CI 미리보기"
      preview-background="white"
      @close="closePreview"
      @download="downloadCurrentPdf"
    >
      <CIDocumentTemplate v-if="previewTarget" :document="previewTarget" />
    </DocumentPreviewModal>

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
      :open="codeSearchOpen"
      title="CI번호 검색"
      :columns="[
        { key: 'id', label: 'CI번호' },
        { key: 'issueDate', label: '발행일' },
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
      :columns="productSearchColumns"
      :rows="productRows"
      :search-keyword="productSearchKeyword"
      @update:search-keyword="productSearchKeyword = $event"
      @close="productSearchOpen = false"
      @select="handleProductSelect"
    />
  </div>
</template>
