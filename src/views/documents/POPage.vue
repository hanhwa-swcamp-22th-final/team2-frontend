<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import ApprovalRequestModal from '@/components/common/ApprovalRequestModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import CollapsibleFilterCard from '@/components/common/CollapsibleFilterCard.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DateField from '@/components/common/DateField.vue'
import FilterToolbarCard from '@/components/common/FilterToolbarCard.vue'
import FormField from '@/components/common/FormField.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import SearchTriggerField from '@/components/common/SearchTriggerField.vue'
import SearchableCombobox from '@/components/common/SearchableCombobox.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import TableActions from '@/components/common/TableActions.vue'
import POFormModal from '@/components/domain/document/POFormModal.vue'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { useAuthStore } from '@/stores/auth'
import { usePiDocuments } from '@/stores/piDocuments'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { success } = useToast()

const isAdvancedOpen = ref(false)
const formOpen = ref(false)
const formMode = ref('create')
const selectedRow = ref(null)
const deleteOpen = ref(false)
const approvalRequestOpen = ref(false)
const piSearchOpen = ref(false)
const piSearchKeyword = ref('')
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedPi = ref(null)
const selectedClient = ref(null)
const codeSearchOpen = ref(false)
const codeSearchKeyword = ref('')
const productSearchOpen = ref(false)
const productSearchKeyword = ref('')
const clientSearchContext = ref('filter')
const pendingCreateFormValue = ref(null)

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
  { value: '호주', label: '호주' },
]

const statusOptions = [
  { value: '초안', label: '초안' },
  { value: '발송', label: '발송' },
  { value: '확정', label: '확정' },
  { value: '취소', label: '취소' },
]
const piRowsSource = usePiDocuments()
const clientRowsSource = [
  { id: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아' },
  { id: 'CL002', name: 'TechBridge GmbH', country: '독일' },
  { id: 'CL003', name: 'Pacific Trading Inc.', country: '미국' },
]

const columns = [
  { key: 'id', label: 'PO번호', align: 'center', width: '140px' },
  { key: 'issueDate', label: '발행일', align: 'center', width: '130px' },
  { key: 'clientName', label: '거래처', align: 'center', width: '220px' },
  { key: 'country', label: '국가', align: 'center', width: '120px' },
  { key: 'itemName', label: '품목명', align: 'center', width: '220px' },
  { key: 'amount', label: '총액', align: 'right', width: '140px' },
  { key: 'manager', label: '영업담당자', align: 'center', width: '120px' },
  { key: 'status', label: '상태', align: 'center', width: '120px' },
  { key: 'deliveryDate', label: '납기', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'center', width: '90px' },
]

const approvalItemColumns = [
  { key: 'name', label: '품목명', align: 'left' },
  { key: 'qty', label: '수량', align: 'right' },
  { key: 'unit', label: '단위', align: 'center' },
  { key: 'unitPrice', label: '단가', align: 'right' },
  { key: 'amount', label: '금액', align: 'right' },
  { key: 'remark', label: '비고', align: 'left' },
]

const initialRows = [
  {
    id: 'PO26001',
    piId: 'PI26001',
    issueDate: '2026/02/05',
    clientName: 'COOLSAY SDN BHD',
    country: '말레이시아',
    itemName: 'H-Beam 482x300x11x15',
    amount: '$42,400',
    currency: 'USD',
    manager: '김영업',
    status: '확정',
    deliveryDate: '2026/04/20',
    sourceDeliveryDate: '2026/04/15',
    deliveryDateOverride: true,
  },
  {
    id: 'PO26002',
    issueDate: '2026/02/20',
    clientName: 'TechBridge GmbH',
    country: '독일',
    itemName: 'H-Beam 482x300x11x15',
    amount: '€68,400',
    manager: '김영업',
    status: '발송',
    deliveryDate: '2026/05/25',
  },
  {
    id: 'PO26003',
    issueDate: '2026/03/03',
    clientName: 'Pacific Trading Inc.',
    country: '미국',
    itemName: 'Lubricant Oil SAE 10W-40',
    amount: '$15,600',
    manager: '정영업',
    status: '초안',
    deliveryDate: '2026/06/05',
  },
]

const rowsData = ref([...initialRows])
const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'clientName', 'country', 'itemName', 'amount', 'manager', 'status', 'issueDate', 'deliveryDate'],
  issueDateField: 'issueDate',
  deliveryDateField: 'deliveryDate',
})

const piRows = computed(() => {
  const keyword = piSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return piRowsSource.value
  return piRowsSource.value.filter((row) => [row.id, row.clientName, row.currency, row.deliveryDate].some((value) => value.toLowerCase().includes(keyword)))
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource
  return clientRowsSource.filter((row) => [row.id, row.name, row.country].some((value) => value.toLowerCase().includes(keyword)))
})

const codeRows = computed(() => {
  const keyword = codeSearchKeyword.value.trim().toLowerCase()
  const rows = rowsData.value.map((row) => ({ id: row.id, issueDate: row.issueDate, clientName: row.clientName }))
  if (!keyword) return rows
  return rows.filter((row) => [row.id, row.issueDate, row.clientName].some((value) => String(value).toLowerCase().includes(keyword)))
})

const productRows = computed(() => {
  const keyword = productSearchKeyword.value.trim().toLowerCase()
  const rows = [...new Map(rowsData.value.map((row) => [row.itemName, { name: row.itemName, country: row.country, manager: row.manager }])).values()]
  if (!keyword) return rows
  return rows.filter((row) => [row.name, row.country, row.manager].some((value) => String(value).toLowerCase().includes(keyword)))
})

function openClientSearch(context = 'filter') {
  clientSearchContext.value = context
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

function openCreateForm() {
  formMode.value = 'create'
  selectedRow.value = null
  selectedPi.value = null
  selectedClient.value = null
  pendingCreateFormValue.value = null
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  if (formMode.value === 'create') {
    pendingCreateFormValue.value = null
  }
}

function openEditForm(row) {
  selectedPi.value = piRowsSource.value.find((pi) => pi.id === (row.piId || row.linkedPiId || '')) ?? null
  selectedClient.value = clientRowsSource.find((client) => client.name === row.clientName) ?? null
  formMode.value = 'edit'
  selectedRow.value = {
    id: row.id,
    piId: row.piId || row.linkedPiId || '',
    clientName: row.clientName,
    currency: row.currency || selectedPi.value?.currency || '',
    deliveryDate: row.deliveryDate,
    sourceDeliveryDate: row.sourceDeliveryDate || selectedPi.value?.deliveryDate || row.deliveryDate,
    deliveryDateOverride: Boolean(row.deliveryDateOverride),
  }
  formOpen.value = true
}

function getTodaySlashDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function parseAmount(value) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '')
  return Number.parseFloat(normalized || '0') || 0
}

function formatAmount(currency, value) {
  const symbolMap = { USD: '$', EUR: '€', JPY: '¥', KRW: '₩' }
  const symbol = symbolMap[currency] ?? ''
  return `${symbol}${Number(value || 0).toLocaleString()}`
}

function getLinkedPiItems(linkedPi) {
  return linkedPi?.items ?? []
}

function buildRowPayload(formValue) {
  const matchedClient = clientRowsSource.find((client) => client.name === formValue.clientName)
  const linkedPi = piRowsSource.value.find((pi) => pi.id === formValue.linkedPiId)
  const linkedItems = getLinkedPiItems(linkedPi)
  const totalAmount = linkedItems.reduce((sum, item) => sum + parseAmount(item.amount), 0)

  return {
    issueDate: getTodaySlashDate(),
    clientName: formValue.clientName || '거래처 미선택',
    country: linkedPi?.country || matchedClient?.country || selectedClient.value?.country || '-',
    itemName: linkedItems[0]?.name || (linkedPi ? 'PI 연결 품목' : '품목 미입력'),
    amount: formatAmount(linkedPi?.currency || formValue.currency || 'USD', totalAmount),
    currency: linkedPi?.currency || formValue.currency || '',
    clientAddress: linkedPi?.clientAddress || '',
    clientCode: linkedPi?.clientCode || '',
    clientEmail: linkedPi?.clientEmail || '',
    clientTel: linkedPi?.clientTel || '',
    buyerName: linkedPi?.buyerName || '',
    incoterms: linkedPi?.incoterms || '',
    namedPlace: linkedPi?.namedPlace || '',
    deliveryDate: formValue.deliveryDate ? formValue.deliveryDate.replaceAll('-', '/') : '-',
    sourceDeliveryDate: formValue.sourceDeliveryDate ? formValue.sourceDeliveryDate.replaceAll('-', '/') : '',
    deliveryDateOverride: Boolean(formValue.linkedPiId && formValue.deliveryDateOverride),
    items: linkedItems.map((item) => ({ ...item })),
    linkedPiId: formValue.linkedPiId || '',
    piId: formValue.linkedPiId || '',
  }
}

function getCurrentRequesterName() {
  return authStore.currentUser?.name || '김영업'
}

function getRequestedAt() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

function buildNextPoId() {
  return `PO26${String(rowsData.value.length + 1).padStart(3, '0')}`
}

const createApprovalRequestRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  return [
    { label: '요청 유형', value: '등록 요청' },
    { label: '결재자', value: pendingCreateFormValue.value.approver || '-' },
    { label: '요청자', value: getCurrentRequesterName() },
    { label: '문서 상태', value: '결재대기' },
    { label: '요청 상태', value: '등록요청' },
    { label: '요청 시각', value: getRequestedAt() },
  ]
})

const createApprovalDocumentRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)
  const isDeliveryOverride = Boolean(nextRow.deliveryDateOverride && nextRow.sourceDeliveryDate && nextRow.deliveryDate !== nextRow.sourceDeliveryDate)

  return [
    { label: '예정 PO 번호', value: buildNextPoId() },
    { label: '발행일', value: nextRow.issueDate },
    { label: '납기일', value: nextRow.deliveryDate },
    { label: '납기 처리', value: isDeliveryOverride ? 'PI 기준값에서 별도 조정' : 'PI 기준값 사용' },
  ]
})

const createApprovalReferenceRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)

  if (!nextRow.piId) {
    return []
  }

  return [
    { label: '기준 PI 번호', value: nextRow.piId },
    { label: '거래처', value: nextRow.clientName },
    { label: '영문주소', value: nextRow.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: nextRow.buyerName || '-' },
    { label: '통화', value: nextRow.currency || '-' },
    { label: '인코텀즈', value: nextRow.incoterms ? `${nextRow.incoterms}${nextRow.namedPlace ? ` ${nextRow.namedPlace}` : ''}` : '-' },
    { label: 'PI 기준 납기일', value: nextRow.sourceDeliveryDate || '-' },
  ]
})

const createApprovalItemRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)

  return (nextRow.items ?? []).map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: parseAmount(item.qty) > 0 ? parseAmount(item.qty).toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(nextRow.currency || 'USD', parseAmount(item.unitPrice)),
    amount: formatAmount(nextRow.currency || 'USD', parseAmount(item.amount)),
    remark: item.remark || '-',
  }))
})

const createApprovalItemSummaryRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const nextRow = buildRowPayload(pendingCreateFormValue.value)

  return [
    { label: '품목 건수', value: `${nextRow.items?.length ?? 0}건` },
    { label: '총액', value: nextRow.amount, emphasis: true },
  ]
})

function confirmCreateApprovalRequest() {
  if (!pendingCreateFormValue.value) return

  const nextRow = buildRowPayload(pendingCreateFormValue.value)
  const requesterName = getCurrentRequesterName()

  rowsData.value = [
    {
      id: buildNextPoId(),
      ...nextRow,
      manager: requesterName,
      status: '결재대기',
      approver: pendingCreateFormValue.value.approver || '',
      approvalStatus: '대기',
      requestStatus: '등록요청',
      approvalAction: '등록',
      approvalRequestedBy: requesterName,
      approvalRequestedAt: getRequestedAt(),
    },
    ...rowsData.value,
  ]

  approvalRequestOpen.value = false
  pendingCreateFormValue.value = null
  formOpen.value = false
  selectedPi.value = null
  selectedClient.value = null
  success('PO 등록 결재 요청이 전송되었습니다.')
}

function cancelCreateApprovalRequest() {
  approvalRequestOpen.value = false
}

function handleSave(formValue) {
  if (formMode.value === 'create') {
    pendingCreateFormValue.value = { ...formValue }
    approvalRequestOpen.value = true
    return
  }

  rowsData.value = rowsData.value.map((row) => (
    row.id === selectedRow.value?.id
      ? {
        ...row,
        clientName: formValue.clientName || row.clientName,
        currency: formValue.currency || row.currency,
        deliveryDate: formValue.deliveryDate ? formValue.deliveryDate.replaceAll('-', '/') : row.deliveryDate,
        sourceDeliveryDate: formValue.sourceDeliveryDate ? formValue.sourceDeliveryDate.replaceAll('-', '/') : row.sourceDeliveryDate,
        deliveryDateOverride: Boolean(formValue.deliveryDateOverride),
        piId: formValue.linkedPiId || row.piId || '',
        linkedPiId: formValue.linkedPiId || row.linkedPiId || '',
      }
      : row
  ))
  success(`${selectedRow.value?.id} 수정 폼이 연결되었습니다.`)
}

function openDeleteModal(row) {
  selectedRow.value = row
  deleteOpen.value = true
}

function confirmDelete() {
  rowsData.value = rowsData.value.filter((row) => row.id !== selectedRow.value?.id)
  success(`${selectedRow.value?.id}가 삭제되었습니다.`)
  deleteOpen.value = false
  selectedRow.value = null
}

function goToDetail(id) {
  router.push({ name: 'po-detail', params: { id } })
}

function handlePiSelect(pi) {
  selectedPi.value = pi
  piSearchOpen.value = false
  piSearchKeyword.value = ''
}

function handleClientSelect(client) {
  if (clientSearchContext.value === 'form') {
    selectedClient.value = client
  } else {
    filters.value.clientName = client.name
  }
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function handleCodeSelect(code) {
  filters.value.code = code.id
  codeSearchOpen.value = false
  codeSearchKeyword.value = ''
}

function handleProductSelect(product) {
  filters.value.productName = product.name
  productSearchOpen.value = false
  productSearchKeyword.value = ''
}
</script>

<template>
  <div class="fade-in space-y-5">
    <PageHeader title="PO 관리" icon-class="fas fa-file-contract">
      <template #actions>
        <BaseButton @click="openCreateForm">
          <template #leading>
            <i class="fas fa-plus text-xs" aria-hidden="true"></i>
          </template>
          PO 작성
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

        <FormField label="영업담당자">
          <SearchableCombobox
            v-model="filters.manager"
            :options="managerOptions"
            placeholder="영업담당자 검색..."
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

      <template #cell-status="{ value }">
        <StatusBadge :value="value" />
      </template>

      <template #cell-actions="{ row }">
        <TableActions @edit="openEditForm(row)" @delete="openDeleteModal(row)" />
      </template>
    </BaseTable>

    <POFormModal
      :open="formOpen"
      :mode="formMode"
      :document="selectedRow"
      :selected-pi="selectedPi"
      :selected-client="selectedClient"
      @open-pi-search="piSearchOpen = true"
      @open-client-search="openClientSearch('form')"
      @close="closeForm"
      @save="handleSave"
    />

    <ApprovalRequestModal
      :open="approvalRequestOpen"
      title="PO 등록 결재 요청"
      message="선택한 결재자에게 PO 등록 결재 요청을 전송하시겠습니까?"
      :request-rows="createApprovalRequestRows"
      :document-rows="createApprovalDocumentRows"
      :item-columns="approvalItemColumns"
      :item-rows="createApprovalItemRows"
      :item-summary-rows="createApprovalItemSummaryRows"
      :reference-rows="createApprovalReferenceRows"
      document-section-title="PO 문서 정보"
      item-section-title="연결 PI 기준 품목"
      reference-section-title="연결 PI 정보"
      helper-text="요청 후 PO는 결재대기 상태로 등록되며, 승인 전까지 확정 처리되지 않습니다."
      width="max-w-6xl"
      confirm-label="결재 요청"
      @confirm="confirmCreateApprovalRequest"
      @cancel="cancelCreateApprovalRequest"
    />

    <ConfirmModal
      :open="deleteOpen"
      title="PO 삭제"
      message="아래 PO를 삭제하시겠습니까?"
      :detail="selectedRow?.id"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
    />

    <SearchModal
      :open="piSearchOpen"
      title="PI 검색"
      :columns="[
        { key: 'id', label: 'PI번호' },
        { key: 'clientName', label: '거래처명' },
        { key: 'currency', label: '통화' },
        { key: 'deliveryDate', label: '납기일' },
      ]"
      :rows="piRows"
      :search-keyword="piSearchKeyword"
      @update:search-keyword="piSearchKeyword = $event"
      @close="piSearchOpen = false"
      @select="handlePiSelect"
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
      :open="codeSearchOpen"
      title="PO번호 검색"
      :columns="[
        { key: 'id', label: 'PO번호' },
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
      :columns="[
        { key: 'name', label: '품목명' },
        { key: 'country', label: '국가' },
        { key: 'manager', label: '영업담당자' },
      ]"
      :rows="productRows"
      :search-keyword="productSearchKeyword"
      @update:search-keyword="productSearchKeyword = $event"
      @close="productSearchOpen = false"
      @select="handleProductSelect"
    />
  </div>
</template>
