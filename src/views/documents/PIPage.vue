<script setup>
import { computed, onMounted, ref } from 'vue'
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
import PIFormModal from '@/components/domain/document/PIFormModal.vue'
import { fetchBuyers, fetchClients, fetchCountries, fetchCurrencies } from '@/api/master'
import { useDocumentFilter } from '@/composables/useDocumentFilter'
import { useAuthStore } from '@/stores/auth'
import { usePiDocuments } from '@/stores/piDocuments'
import { useToast } from '@/composables/useToast'
import {
  createEditApprovalMeta,
  createRegistrationApprovalMeta,
  EDIT_REQUEST_DOCUMENT_STATUS,
  EDIT_REQUEST_STATUS,
  REGISTRATION_DOCUMENT_STATUS,
  REGISTRATION_REQUEST_STATUS,
} from '@/utils/documentApproval'
import { formatIncotermsLabel, resolveIncotermState } from '@/utils/incoterms'

const router = useRouter()
const authStore = useAuthStore()
const { success, warning } = useToast()

const isAdvancedOpen = ref(false)
const formOpen = ref(false)
const formMode = ref('create')
const selectedRow = ref(null)
const deleteOpen = ref(false)
const approvalRequestOpen = ref(false)
const editApprovalRequestOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedClient = ref(null)
const codeSearchOpen = ref(false)
const codeSearchKeyword = ref('')
const productSearchOpen = ref(false)
const productSearchKeyword = ref('')
const clientSearchContext = ref('filter')
const pendingCreateFormValue = ref(null)
const pendingEditRequest = ref(null)

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
const fallbackClientRowsSource = [
  {
    id: 'CL001',
    code: 'CL001',
    name: 'COOLSAY SDN BHD',
    country: '말레이시아',
    currency: 'USD',
    address: 'Lot 18, Jalan Pelabuhan Utara 27, 42000 Port Klang, Selangor, Malaysia',
    tel: '+60-3-555-0101',
    email: 'contact@coolsay.com',
    buyers: ['Mr. Ahmad Razak (Purchasing Manager)', 'Ms. Siti Nurhaliza (Director)'],
  },
  {
    id: 'CL002',
    code: 'CL002',
    name: 'TechBridge GmbH',
    country: '독일',
    currency: 'EUR',
    address: 'Am Sandtorkai 35, 20457 Hamburg, Germany',
    tel: '+49-40-555-0202',
    email: 'info@techbridge.de',
    buyers: ['Ms. Hanna Schneider (Procurement Lead)'],
  },
  {
    id: 'CL003',
    code: 'CL003',
    name: 'Pacific Trading Inc.',
    country: '미국',
    currency: 'USD',
    address: '1201 Harbor Avenue SW, Seattle, WA 98134, USA',
    tel: '+1-206-555-0303',
    email: 'contact@pacifictrading.com',
    buyers: ['Mr. Jacob Miller (Import Manager)'],
  },
]
const clientRowsSource = ref([...fallbackClientRowsSource])
const rowsData = usePiDocuments()

const columns = [
  { key: 'id', label: 'PI번호', align: 'center', width: '140px' },
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

const approvalChangeColumns = [
  { key: 'label', label: '변경 항목', align: 'left' },
  { key: 'before', label: '원본값', align: 'left' },
  { key: 'after', label: '변경값', align: 'left' },
]

const { filters, filteredRows, resetFilters, applyFilters } = useDocumentFilter(rowsData, {
  keywordFields: ['id', 'clientName', 'country', 'itemName', 'amount', 'manager', 'status', 'issueDate', 'deliveryDate'],
  issueDateField: 'issueDate',
  deliveryDateField: 'deliveryDate',
})

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource.value
  return clientRowsSource.value.filter((client) => [client.id, client.name, client.country].some((value) => value.toLowerCase().includes(keyword)))
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

const currencySymbolMap = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'AED ',
  CNY: '¥',
  MYR: 'RM ',
  THB: '฿',
  VND: '₫',
  IDR: 'Rp ',
  INR: '₹',
  SAR: 'SAR ',
  BRL: 'R$',
  SEK: 'kr ',
  CHF: 'CHF ',
}

async function loadClientRows() {
  try {
    const [clientsData, countriesData, buyersData, currenciesData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchBuyers(),
      fetchCurrencies(),
    ])

    const countryMap = new Map(
      countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
    )
    const currencyMap = new Map(
      currenciesData.map((currency) => [String(currency.id), currency.code ?? 'USD']),
    )

    const buyersByClientId = buyersData.reduce((map, buyer) => {
      const clientId = String(buyer.clientId)
      const label = buyer.position ? `${buyer.name} (${buyer.position})` : buyer.name
      const rows = map.get(clientId) ?? []
      rows.push(label)
      map.set(clientId, rows)
      return map
    }, new Map())

    clientRowsSource.value = clientsData.map((client) => ({
      id: String(client.id),
      code: client.code,
      name: client.name,
      country: countryMap.get(String(client.countryId)) ?? '-',
      currency: currencyMap.get(String(client.currencyId)) ?? 'USD',
      address: client.address ?? '',
      tel: client.tel ?? '',
      email: client.email ?? '',
      buyers: buyersByClientId.get(String(client.id)) ?? [],
    }))
  } catch {
    clientRowsSource.value = [...fallbackClientRowsSource]
  }
}

onMounted(loadClientRows)

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
  selectedClient.value = null
  pendingEditRequest.value = null
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  pendingEditRequest.value = null
}

function openEditForm(row) {
  const matchedClient = clientRowsSource.value.find((client) => client.name === row.clientName) ?? null
  const normalizedIncoterms = resolveIncotermState(row.incoterms, row.namedPlace)
  selectedClient.value = matchedClient
  formMode.value = 'edit'
  selectedRow.value = {
    id: row.id,
    clientName: row.clientName,
    clientCode: row.clientCode ?? matchedClient?.code ?? '',
    clientAddress: row.clientAddress ?? matchedClient?.address ?? '',
    clientTel: row.clientTel ?? matchedClient?.tel ?? '',
    clientEmail: row.clientEmail ?? matchedClient?.email ?? '',
    buyerName: row.buyerName ?? matchedClient?.buyers?.[0] ?? '',
    currency: row.currency ?? matchedClient?.currency ?? (row.amount.startsWith('€') ? 'EUR' : 'USD'),
    country: row.country,
    incoterms: normalizedIncoterms.code || 'FOB',
    namedPlace: normalizedIncoterms.namedPlace,
    issueDate: row.issueDate,
    deliveryDate: row.deliveryDate,
    items: (row.items ?? []).map((item) => ({
      ...item,
    })),
  }
  formOpen.value = true
}

function parseAmount(value) {
  const normalized = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function formatAmount(currency, value) {
  const symbol = currencySymbolMap[currency] ?? `${currency} `
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

function buildRowPayload(formValue) {
  const currency = formValue.currency || 'USD'
  const totalAmount = (formValue.items ?? []).reduce((sum, item) => {
    const qty = parseAmount(item.qty)
    const unitPrice = parseAmount(item.unitPrice)
    const amount = parseAmount(item.amount)
    const calculatedAmount = amount > 0 ? amount : (qty > 0 && unitPrice > 0 ? qty * unitPrice : 0)
    return sum + calculatedAmount
  }, 0)
  const matchedClient = clientRowsSource.value.find((client) => client.name === formValue.clientName)
  const nextRow = {
    clientName: formValue.clientName || '거래처 미선택',
    clientCode: matchedClient?.code || selectedRow.value?.clientCode || '',
    clientAddress: matchedClient?.address || selectedRow.value?.clientAddress || '',
    clientTel: matchedClient?.tel || selectedRow.value?.clientTel || '',
    clientEmail: matchedClient?.email || selectedRow.value?.clientEmail || '',
    buyerName: formValue.buyerName || '',
    currency,
    country: formValue.country || matchedClient?.country || selectedClient.value?.country || '-',
    itemName: formValue.items?.[0]?.name || '품목 미입력',
    amount: formatAmount(currency, totalAmount),
    issueDate: formatSlashDate(formValue.issueDate),
    deliveryDate: formatSlashDate(formValue.deliveryDate),
    incoterms: formValue.incoterms || 'FOB',
    namedPlace: formValue.namedPlace || '',
    items: (formValue.items ?? []).map((item) => ({
      name: item.name ?? '',
      qty: String(item.qty ?? ''),
      unit: item.unit ?? '',
      unitPrice: String(item.unitPrice ?? ''),
      amount: String(item.amount ?? '0'),
      remark: item.remark ?? '',
    })),
  }

  return {
    currency,
    totalAmount,
    nextRow,
  }
}

function createComparableItem(item) {
  const quantity = parseAmount(item.qty ?? item.quantity)
  const unitPrice = parseAmount(item.unitPrice)
  const amount = parseAmount(item.amount) || quantity * unitPrice

  return {
    name: item.name ?? '',
    qty: quantity,
    unit: item.unit ?? '',
    unitPrice,
    amount,
    remark: item.remark ?? '',
  }
}

function createItemDigest(items) {
  if (!items.length) return '없음'

  const firstItem = items[0]
  const quantityLabel = firstItem.qty > 0
    ? ` / ${firstItem.qty.toLocaleString()}${firstItem.unit ? ` ${firstItem.unit}` : ''}`
    : ''
  const tailLabel = items.length > 1 ? ` 외 ${items.length - 1}건` : ''

  return `${firstItem.name || '품목'}${quantityLabel}${tailLabel}`
}

function createComparableSnapshot(source) {
  const currency = source.currency || 'USD'
  const items = (source.items ?? []).map(createComparableItem)
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  return {
    id: source.id ?? '',
    clientName: source.clientName ?? '',
    clientAddress: source.clientAddress ?? '',
    buyerName: source.buyerName ?? '',
    currency,
    issueDate: formatSlashDate(source.issueDate),
    deliveryDate: formatSlashDate(source.deliveryDate),
    incoterms: source.incoterms ?? '',
    namedPlace: source.namedPlace ?? '',
    items,
    amount: formatAmount(currency, totalAmount),
  }
}

function buildChangeRows(originalSnapshot, revisedSnapshot) {
  return [
    { label: '거래처', before: originalSnapshot.clientName || '-', after: revisedSnapshot.clientName || '-' },
    { label: '영문주소', before: originalSnapshot.clientAddress || '-', after: revisedSnapshot.clientAddress || '-' },
    { label: '바이어', before: originalSnapshot.buyerName || '-', after: revisedSnapshot.buyerName || '-' },
    { label: '통화', before: originalSnapshot.currency || '-', after: revisedSnapshot.currency || '-' },
    { label: '발행일', before: originalSnapshot.issueDate || '-', after: revisedSnapshot.issueDate || '-' },
    { label: '납기일', before: originalSnapshot.deliveryDate || '-', after: revisedSnapshot.deliveryDate || '-' },
    {
      label: '인코텀즈',
      before: formatIncotermsLabel(originalSnapshot.incoterms, originalSnapshot.namedPlace) || '-',
      after: formatIncotermsLabel(revisedSnapshot.incoterms, revisedSnapshot.namedPlace) || '-',
    },
    {
      label: '품목 목록',
      before: createItemDigest(originalSnapshot.items),
      after: createItemDigest(revisedSnapshot.items),
    },
    { label: '총액', before: originalSnapshot.amount || '-', after: revisedSnapshot.amount || '-' },
  ].filter((row) => row.before !== row.after)
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

function buildNextPiId() {
  return `PI26${String(rowsData.value.length + 1).padStart(3, '0')}`
}

const createApprovalRequestRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  return [
    { label: '요청 유형', value: '등록 요청' },
    { label: '결재자', value: pendingCreateFormValue.value.approver || '-' },
    { label: '요청자', value: getCurrentRequesterName() },
    { label: '문서 상태', value: REGISTRATION_DOCUMENT_STATUS },
    { label: '요청 상태', value: REGISTRATION_REQUEST_STATUS },
    { label: '요청 시각', value: getRequestedAt() },
  ]
})

const createApprovalDocumentRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const { nextRow } = buildRowPayload(pendingCreateFormValue.value)

  return [
    { label: '예정 PI 번호', value: buildNextPiId() },
    { label: '거래처', value: nextRow.clientName },
    { label: '영문주소', value: nextRow.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: nextRow.buyerName || '-' },
    { label: '통화', value: nextRow.currency },
    { label: '발행일', value: nextRow.issueDate },
    { label: '납기일', value: nextRow.deliveryDate },
    { label: '인코텀즈', value: formatIncotermsLabel(nextRow.incoterms, nextRow.namedPlace) || '-' },
  ]
})

const createApprovalItemRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const { currency, nextRow } = buildRowPayload(pendingCreateFormValue.value)

  return (nextRow.items ?? []).map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: parseAmount(item.qty) > 0 ? parseAmount(item.qty).toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(currency, parseAmount(item.unitPrice)),
    amount: formatAmount(currency, parseAmount(item.amount)),
    remark: item.remark || '-',
  }))
})

const createApprovalItemSummaryRows = computed(() => {
  if (!pendingCreateFormValue.value) return []

  const { nextRow } = buildRowPayload(pendingCreateFormValue.value)

  return [
    { label: '품목 건수', value: `${nextRow.items?.length ?? 0}건` },
    { label: '총액', value: nextRow.amount, emphasis: true },
  ]
})

const editApprovalRequestRows = computed(() => {
  if (!pendingEditRequest.value) return []

  return [
    { label: '요청 유형', value: '수정 요청' },
    { label: '결재자', value: pendingEditRequest.value.approver || '-' },
    { label: '요청자', value: getCurrentRequesterName() },
    { label: '문서 상태', value: EDIT_REQUEST_DOCUMENT_STATUS },
    { label: '요청 상태', value: EDIT_REQUEST_STATUS },
    { label: '요청 시각', value: getRequestedAt() },
  ]
})

const editApprovalDocumentRows = computed(() => {
  if (!pendingEditRequest.value) return []

  const { revisedSnapshot, id } = pendingEditRequest.value

  return [
    { label: '대상 PI 번호', value: id || '-' },
    { label: '거래처', value: revisedSnapshot.clientName || '-' },
    { label: '영문주소', value: revisedSnapshot.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: revisedSnapshot.buyerName || '-' },
    { label: '통화', value: revisedSnapshot.currency || '-' },
    { label: '발행일', value: revisedSnapshot.issueDate || '-' },
    { label: '납기일', value: revisedSnapshot.deliveryDate || '-' },
    { label: '인코텀즈', value: formatIncotermsLabel(revisedSnapshot.incoterms, revisedSnapshot.namedPlace) || '-' },
  ]
})

const editApprovalItemRows = computed(() => {
  if (!pendingEditRequest.value) return []

  return pendingEditRequest.value.revisedSnapshot.items.map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: item.qty > 0 ? item.qty.toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatAmount(pendingEditRequest.value.revisedSnapshot.currency, item.unitPrice),
    amount: formatAmount(pendingEditRequest.value.revisedSnapshot.currency, item.amount),
    remark: item.remark || '-',
  }))
})

const editApprovalItemSummaryRows = computed(() => {
  if (!pendingEditRequest.value) return []

  const { revisedSnapshot } = pendingEditRequest.value

  return [
    { label: '품목 건수', value: `${revisedSnapshot.items.length}건` },
    { label: '총액', value: revisedSnapshot.amount, emphasis: true },
  ]
})

function confirmCreateApprovalRequest() {
  if (!pendingCreateFormValue.value) return

  const { nextRow } = buildRowPayload(pendingCreateFormValue.value)
  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()

  rowsData.value = [
    {
      id: buildNextPiId(),
      ...nextRow,
      manager: requesterName,
      ...createRegistrationApprovalMeta({
        approver: pendingCreateFormValue.value.approver,
        requesterName,
        requestedAt,
      }),
    },
    ...rowsData.value,
  ]

  approvalRequestOpen.value = false
  pendingCreateFormValue.value = null
  formOpen.value = false
  selectedClient.value = null
  success('PI 등록 결재 요청이 전송되었습니다.')
}

function cancelCreateApprovalRequest() {
  approvalRequestOpen.value = false
}

function confirmEditApprovalRequest() {
  if (!pendingEditRequest.value) return

  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()

  rowsData.value = rowsData.value.map((row) => (
    row.id === pendingEditRequest.value.id
      ? {
        ...row,
        ...pendingEditRequest.value.nextRow,
        ...createEditApprovalMeta({
          approver: pendingEditRequest.value.approver || row.approver || '',
          requesterName,
          requestedAt,
        }),
      }
      : row
  ))

  editApprovalRequestOpen.value = false
  pendingEditRequest.value = null
  formOpen.value = false
  selectedClient.value = null
  success('PI 수정 결재 요청이 전송되었습니다.')
}

function cancelEditApprovalRequest() {
  editApprovalRequestOpen.value = false
}

function handleSave(formValue) {
  const { nextRow } = buildRowPayload(formValue)

  if (formMode.value === 'create') {
    pendingCreateFormValue.value = {
      ...formValue,
      items: (formValue.items ?? []).map((item) => ({ ...item })),
    }
    approvalRequestOpen.value = true
    return
  }

  const originalSnapshot = createComparableSnapshot(selectedRow.value ?? {})
  const revisedSnapshot = createComparableSnapshot({
    id: selectedRow.value?.id,
    ...selectedRow.value,
    ...nextRow,
  })
  const changeRows = buildChangeRows(originalSnapshot, revisedSnapshot)

  if (!changeRows.length) {
    warning('변경된 내용이 없습니다.')
    return
  }

  pendingEditRequest.value = {
    id: selectedRow.value?.id,
    approver: formValue.approver || '',
    nextRow,
    revisedSnapshot,
    changeRows,
  }
  editApprovalRequestOpen.value = true
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
  router.push({ name: 'pi-detail', params: { id } })
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
    <PageHeader title="PI 관리" icon-class="fas fa-file-invoice">
      <template #actions>
        <BaseButton @click="openCreateForm">
          <template #leading>
            <i class="fas fa-plus text-xs" aria-hidden="true"></i>
          </template>
          PI 작성
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
            <div>
              <DateField v-model="filters.deliveryFrom" />
            </div>
            <span class="text-center text-sm text-slate-400 sm:pb-2">~</span>
            <div>
              <DateField v-model="filters.deliveryTo" />
            </div>
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

    <PIFormModal
      :open="formOpen"
      :mode="formMode"
      :document="selectedRow"
      :selected-client="selectedClient"
      @open-client-search="openClientSearch('form')"
      @close="closeForm"
      @save="handleSave"
    />

    <ApprovalRequestModal
      :open="approvalRequestOpen"
      title="PI 등록 결재 요청"
      message="선택한 결재자에게 PI 등록 결재 요청을 전송하시겠습니까?"
      :request-rows="createApprovalRequestRows"
      :document-rows="createApprovalDocumentRows"
      :item-columns="approvalItemColumns"
      :item-rows="createApprovalItemRows"
      :item-summary-rows="createApprovalItemSummaryRows"
      document-section-title="PI 문서 정보"
      item-section-title="PI 품목 정보"
      helper-text="요청 후 PI는 결재대기 상태로 등록되며, 승인 전까지 확정 처리되지 않습니다."
      width="max-w-6xl"
      confirm-label="결재 요청"
      @confirm="confirmCreateApprovalRequest"
      @cancel="cancelCreateApprovalRequest"
    />

    <ApprovalRequestModal
      :open="editApprovalRequestOpen"
      title="PI 수정 결재 요청"
      message="변경 사항을 확인한 뒤 선택한 결재자에게 PI 수정 결재 요청을 전송하시겠습니까?"
      :request-rows="editApprovalRequestRows"
      :document-rows="editApprovalDocumentRows"
      :change-columns="approvalChangeColumns"
      :change-rows="pendingEditRequest?.changeRows ?? []"
      :item-columns="approvalItemColumns"
      :item-rows="editApprovalItemRows"
      :item-summary-rows="editApprovalItemSummaryRows"
      document-section-title="수정 대상 PI 정보"
      change-section-title="변경 사항 비교"
      item-section-title="변경 후 PI 품목 정보"
      helper-text="요청 후 PI는 결재대기 상태가 되며, 승인 전까지 수정 내용이 확정되지 않습니다."
      width="max-w-6xl"
      confirm-label="수정 요청"
      @confirm="confirmEditApprovalRequest"
      @cancel="cancelEditApprovalRequest"
    />

    <ConfirmModal
      :open="deleteOpen"
      title="PI 삭제"
      message="아래 PI를 삭제하시겠습니까?"
      :detail="selectedRow?.id"
      confirm-label="삭제"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="deleteOpen = false"
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
      title="PI번호 검색"
      :columns="[
        { key: 'id', label: 'PI번호' },
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
