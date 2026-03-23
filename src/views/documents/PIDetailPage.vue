<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ApprovalRequestModal from '@/components/common/ApprovalRequestModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PIDocumentTemplate from '@/components/domain/document/PIDocumentTemplate.vue'
import PIFormModal from '@/components/domain/document/PIFormModal.vue'
import { fetchBuyers, fetchClients, fetchCountries } from '@/api/master'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { usePiDocuments } from '@/stores/piDocuments'
import { usePoDocuments } from '@/stores/poDocuments'
import { useShipmentOrderDocuments } from '@/stores/shipmentOrderDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import {
  buildApprovalInfoRows,
  buildApprovalRequestRows,
  createDeleteApprovalMeta,
  createEditApprovalMeta,
  DELETE_REQUEST_DOCUMENT_STATUS,
  DELETE_REQUEST_STATUS,
  EDIT_REQUEST_DOCUMENT_STATUS,
  EDIT_REQUEST_STATUS,
} from '@/utils/documentApproval'
import { openDocumentOutputByType } from '@/utils/documentOutput'
import {
  formatPiShipmentLockMessage,
  getPiShipmentLockInfo,
} from '@/utils/documentShipmentLock'
import { formatReferenceDocumentStatus } from '@/utils/referenceDocumentStatus'
import { formatIncotermsLabel, resolveIncotermState } from '@/utils/incoterms'
import { clientSearchColumns } from '@/utils/searchModalColumns'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { info, success, warning } = useToast()

const previewOpen = ref(false)
const formOpen = ref(false)
const editConfirmOpen = ref(false)
const editApprovalRequestOpen = ref(false)
const deleteApprovalRequestOpen = ref(false)
const clientSearchOpen = ref(false)
const clientSearchKeyword = ref('')
const selectedClient = ref(null)
const pendingEditRequest = ref(null)
const piDocuments = usePiDocuments()
const poDocuments = usePoDocuments()
const shipmentOrderDocuments = useShipmentOrderDocuments()
const shipmentStatusDocuments = useShipmentStatusDocuments()

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

const fallbackClientRowsSource = [
  { id: 'CL001', code: 'CL001', name: 'COOLSAY SDN BHD', country: '말레이시아', city: 'Port Klang', currency: 'USD', manager: 'Ahmad Razak', tel: '+60-3-555-0101', status: '활성', buyers: ['Mr. Ahmad Razak (Purchasing Manager)', 'Ms. Siti Nurhaliza (Director)'] },
  { id: 'CL002', code: 'CL002', name: 'TechBridge GmbH', country: '독일', city: 'Hamburg', currency: 'EUR', manager: 'Hanna Schneider', tel: '+49-40-555-0202', status: '활성', buyers: ['Ms. Hanna Schneider (Procurement Lead)'] },
  { id: 'CL003', code: 'CL003', name: 'Pacific Trading Inc.', country: '미국', city: 'Seattle', currency: 'USD', manager: 'Jacob Miller', tel: '+1-206-555-0303', status: '활성', buyers: ['Mr. Jacob Miller (Import Manager)'] },
]
const clientRowsSource = ref([...fallbackClientRowsSource])

const clientRows = computed(() => {
  const keyword = clientSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return clientRowsSource.value
  return clientRowsSource.value.filter((client) => [
    client.code,
    client.name,
    client.country,
    client.city,
    client.currency,
    client.manager,
    client.tel,
    client.status,
  ].some((value) => String(value ?? '').toLowerCase().includes(keyword)))
})

const incotermsLabel = computed(() => (
  detail.value ? formatIncotermsLabel(detail.value.incoterms, detail.value.namedPlace) : '-'
))

const previewFields = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '바이어', value: detail.value.buyer },
    { label: '통화', value: detail.value.currency },
    { label: '인코텀즈', value: incotermsLabel.value },
    { label: '납기일', value: detail.value.deliveryDate },
    { label: '발행일', value: detail.value.issueDate },
  ]
})

const summaryRows = computed(() => {
  if (!detail.value) return []

  return [
    { label: '거래처', value: detail.value.clientName },
    { label: '영업담당자', value: detail.value.manager || '-' },
    { label: '통화 / 총액', value: `${detail.value.currency} / ${detail.value.totalAmount}` },
    { label: '납기일', value: detail.value.deliveryDate || '-' },
  ]
})

const documentNote = computed(() => {
  if (!detail.value) return '-'
  return detail.value.remarks || '-'
})

const totalItemQuantity = computed(() => (
  detail.value?.items.reduce((sum, item) => sum + parseNumericValue(item.quantity ?? item.qty), 0) ?? 0
))

const quantityUnitLabel = computed(() => detail.value?.items?.[0]?.unit || '')

const itemAmountSummary = computed(() => detail.value?.totalAmount || '-')

const currencySymbolMap = {
  KRW: '₩',
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

function parseNumericValue(value) {
  const numeric = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatCurrencyValue(currency, value) {
  const symbol = currencySymbolMap[currency] ?? `${currency} `
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`
}

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

function buildLinkedDocuments(documentId) {
  return poDocuments.value
    .filter((row) => (row.piId || row.linkedPiId) === documentId)
    .map((row) => ({ id: row.id, status: row.status }))
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

function getDefaultDeleteApprover(row) {
  return row?.approver || '김영업'
}

function createComparableItem(item) {
  const quantity = parseNumericValue(item.qty ?? item.quantity)
  const unitPrice = parseNumericValue(item.unitPrice)
  const amount = parseNumericValue(item.amount) || quantity * unitPrice

  return {
    name: item.name ?? '',
    qty: quantity,
    unit: item.unit ?? '',
    unitPrice,
    amount,
    remark: item.remark ?? '',
  }
}

function createComparableSnapshot(source) {
  const currency = source.currency || 'USD'
  const items = (source.items ?? []).map(createComparableItem)
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  return {
    id: source.id ?? '',
    clientName: source.clientName ?? '',
    clientAddress: source.clientAddress ?? '',
    buyerName: source.buyerName ?? source.buyer ?? '',
    currency,
    issueDate: source.issueDate ?? '-',
    deliveryDate: source.deliveryDate ?? '-',
    incoterms: source.incoterms ?? '',
    namedPlace: source.namedPlace ?? '',
    items,
    amount: formatCurrencyValue(currency, totalAmount),
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

function createApprovalReviewSnapshot({
  title,
  message,
  requestRows = [],
  documentRows = [],
  changeRows = [],
  itemRows = [],
  itemSummaryRows = [],
  documentSectionTitle = '문서 정보',
  changeSectionTitle = '변경 사항',
  itemSectionTitle = '품목 정보',
  helperText = '',
}) {
  return {
    title,
    message,
    requestRows: requestRows.map((row) => ({ ...row })),
    requestSectionTitle: '팀장 결재 정보',
    documentRows: documentRows.map((row) => ({ ...row })),
    documentSectionTitle,
    changeColumns: changeRows.length ? approvalChangeColumns.map((column) => ({ ...column })) : [],
    changeRows: changeRows.map((row) => ({ ...row })),
    changeSectionTitle,
    itemColumns: itemRows.length ? approvalItemColumns.map((column) => ({ ...column })) : [],
    itemRows: itemRows.map((row) => ({ ...row })),
    itemSummaryRows: itemSummaryRows.map((row) => ({ ...row })),
    itemSectionTitle,
    referenceRows: [],
    referenceSectionTitle: '참조 문서 정보',
    helperText,
  }
}

function resolveItemUnitPriceValue(item) {
  const quantity = parseNumericValue(item.qty ?? item.quantity)
  const unitPrice = parseNumericValue(item.unitPrice)
  const amount = parseNumericValue(item.amount)

  if (unitPrice > 0) {
    return unitPrice
  }

  if (quantity > 0 && amount > 0) {
    return Math.round(amount / quantity)
  }

  return 0
}

function resolveItemAmountValue(item) {
  const quantity = parseNumericValue(item.qty ?? item.quantity)
  const unitPrice = resolveItemUnitPriceValue(item)
  const amount = parseNumericValue(item.amount)

  if (amount > 0) {
    return amount
  }

  return quantity * unitPrice
}

function normalizeDetail(row) {
  if (!row) return null

  const currency = row.currency || 'USD'
  const items = (row.items ?? []).map((item) => {
    const quantity = String(item.qty ?? item.quantity ?? '')
    const unitPriceValue = parseNumericValue(item.unitPrice)
    const amountValue = parseNumericValue(item.amount)

    return {
      name: item.name ?? '',
      quantity,
      unit: item.unit ?? 'EA',
      unitPrice: formatCurrencyValue(currency, unitPriceValue),
      amount: formatCurrencyValue(currency, amountValue),
      remark: item.remark ?? '',
    }
  })

  const totalAmountValue = items.reduce((sum, item) => sum + parseNumericValue(item.amount), 0)

  return {
    ...row,
    buyer: row.buyerName || row.buyer || '-',
    linkedDocuments: buildLinkedDocuments(row.id),
    items,
    totalAmount: row.totalAmount || row.amount || formatCurrencyValue(currency, totalAmountValue),
    revisionHistory: row.revisionHistory ?? [],
  }
}

const sourceRow = computed(() => (
  piDocuments.value.find((row) => row.id === route.params.id) ?? null
))

const detail = computed(() => normalizeDetail(sourceRow.value))

const approvalInfoRows = computed(() => buildApprovalInfoRows(detail.value))
const shipmentLockInfo = computed(() => (
  getPiShipmentLockInfo(
    detail.value?.id,
    poDocuments.value,
    shipmentOrderDocuments.value,
    shipmentStatusDocuments.value,
  )
))
const shipmentLockMessage = computed(() => formatPiShipmentLockMessage(shipmentLockInfo.value))

const editApprovalRequestRows = computed(() => {
  if (!pendingEditRequest.value) return []

  return buildApprovalRequestRows({
    approver: pendingEditRequest.value.approver,
    requesterName: getCurrentRequesterName(),
    requestedAt: getRequestedAt(),
    documentStatus: EDIT_REQUEST_DOCUMENT_STATUS,
    requestStatus: EDIT_REQUEST_STATUS,
    requestTypeLabel: '수정 요청',
    applyPolicy: '팀장 승인 후 PI 수정 내용이 반영됩니다.',
  })
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
    unitPrice: formatCurrencyValue(pendingEditRequest.value.revisedSnapshot.currency, item.unitPrice),
    amount: formatCurrencyValue(pendingEditRequest.value.revisedSnapshot.currency, item.amount),
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

const deleteApprovalRequestRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  return buildApprovalRequestRows({
    approver: getDefaultDeleteApprover(sourceRow.value),
    requesterName: getCurrentRequesterName(),
    requestedAt: getRequestedAt(),
    documentStatus: DELETE_REQUEST_DOCUMENT_STATUS,
    requestStatus: DELETE_REQUEST_STATUS,
    requestTypeLabel: '삭제 요청',
    applyPolicy: '팀장 승인 후 PI가 삭제 처리됩니다.',
  })
})

const deleteApprovalDocumentRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  return [
    { label: '대상 PI 번호', value: sourceRow.value.id || '-' },
    { label: '현재 상태', value: sourceRow.value.status || '-' },
    { label: '거래처', value: snapshot.clientName || '-' },
    { label: '영문주소', value: snapshot.clientAddress || '-', fullWidth: true },
    { label: '바이어', value: snapshot.buyerName || '-' },
    { label: '통화', value: snapshot.currency || '-' },
    { label: '발행일', value: snapshot.issueDate || '-' },
    { label: '납기일', value: snapshot.deliveryDate || '-' },
    { label: '인코텀즈', value: formatIncotermsLabel(snapshot.incoterms, snapshot.namedPlace) || '-' },
  ]
})

const deleteApprovalItemRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  return snapshot.items.map((item, index) => ({
    id: `${item.name || 'item'}-${index}`,
    name: item.name || '-',
    qty: item.qty > 0 ? item.qty.toLocaleString() : '-',
    unit: item.unit || '-',
    unitPrice: formatCurrencyValue(snapshot.currency, item.unitPrice),
    amount: formatCurrencyValue(snapshot.currency, item.amount),
    remark: item.remark || '-',
  }))
})

const deleteApprovalItemSummaryRows = computed(() => {
  if (!sourceRow.value || !deleteApprovalRequestOpen.value) return []

  const snapshot = createComparableSnapshot(sourceRow.value)

  return [
    { label: '품목 건수', value: `${snapshot.items.length}건` },
    { label: '총액', value: snapshot.amount, emphasis: true },
  ]
})

async function loadClientRows() {
  try {
    const [clientsData, countriesData, buyersData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchBuyers(),
    ])

    const countryMap = new Map(
      countriesData.map((country) => [String(country.id), country.nameKr ?? country.name ?? '-']),
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
      city: client.city ?? '-',
      currency: '-',
      manager: client.manager ?? '-',
      tel: client.tel ?? '-',
      status: client.status ?? '-',
      buyers: buyersByClientId.get(String(client.id)) ?? [],
    }))
  } catch {
    clientRowsSource.value = [...fallbackClientRowsSource]
  }
}

onMounted(loadClientRows)

function goBack() {
  router.push({ name: 'pi' })
}

function openPreview() {
  previewOpen.value = true
}

function handleEdit() {
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    return
  }

  selectedClient.value = null
  formOpen.value = true
}

function handleDelete() {
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    return
  }

  deleteApprovalRequestOpen.value = true
}

function handlePrint() {
  if (!detail.value) return
  openDocumentOutputByType('PI', detail.value, true)
}

function handlePdfDownload() {
  if (!detail.value) return
  const opened = openDocumentOutputByType('PI', detail.value, false)
  if (opened) {
    info('브라우저 인쇄 창에서 "PDF로 저장"을 선택하세요.', 'PDF')
  }
}

function handlePreviewPrint() {
  previewOpen.value = false
  handlePrint()
}

function handleSave(formValue) {
  if (!sourceRow.value) return
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    formOpen.value = false
    return
  }

  const normalizedIncoterms = resolveIncotermState(formValue.incoterms, formValue.namedPlace)
  const nextRow = {
    clientName: formValue.clientName,
    clientAddress: formValue.clientAddress ?? sourceRow.value.clientAddress ?? '',
    clientTel: formValue.clientTel ?? sourceRow.value.clientTel ?? '',
    clientEmail: formValue.clientEmail ?? sourceRow.value.clientEmail ?? '',
    buyerName: formValue.buyerName,
    currency: formValue.currency,
    incoterms: normalizedIncoterms.code,
    namedPlace: normalizedIncoterms.namedPlace,
    issueDate: formatSlashDate(formValue.issueDate),
    deliveryDate: formatSlashDate(formValue.deliveryDate),
    itemName: formValue.items?.[0]?.name || sourceRow.value.itemName,
    amount: formatCurrencyValue(
      formValue.currency,
      (formValue.items ?? []).reduce((sum, item) => sum + resolveItemAmountValue(item), 0),
    ),
    items: (formValue.items ?? []).map((item) => ({
      name: item.name ?? '',
      qty: String(item.qty ?? item.quantity ?? ''),
      unit: item.unit ?? '',
      unitPrice: String(resolveItemUnitPriceValue(item)),
      amount: String(resolveItemAmountValue(item)),
      remark: item.remark ?? '',
    })),
  }

  const originalSnapshot = createComparableSnapshot(sourceRow.value)
  const revisedSnapshot = createComparableSnapshot({
    id: sourceRow.value.id,
    ...sourceRow.value,
    ...nextRow,
  })
  const changeRows = buildChangeRows(originalSnapshot, revisedSnapshot)

  if (!changeRows.length) {
    warning('변경된 내용이 없습니다.')
    return
  }

  pendingEditRequest.value = {
    id: sourceRow.value.id,
    approver: formValue.approver || sourceRow.value.approver || '',
    nextRow,
    revisedSnapshot,
    changeRows,
  }
  editConfirmOpen.value = true
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handleClientSelect(client) {
  selectedClient.value = client
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function goToLinkedDocument(documentId) {
  if (!documentId?.startsWith('PO')) return
  router.push({ name: 'po-detail', params: { id: documentId } })
}

function confirmEditRequestIntent() {
  editConfirmOpen.value = false
  editApprovalRequestOpen.value = true
}

function cancelEditRequestIntent() {
  editConfirmOpen.value = false
  pendingEditRequest.value = null
}

function confirmEditApprovalRequest() {
  if (!pendingEditRequest.value) return

  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()
  const approvalReview = createApprovalReviewSnapshot({
    title: 'PI 수정 결재 검토',
    message: '요청된 변경 사항과 변경 후 문서 정보를 검토한 뒤 승인 또는 반려를 결정합니다.',
    requestRows: editApprovalRequestRows.value,
    documentRows: editApprovalDocumentRows.value,
    changeRows: pendingEditRequest.value.changeRows ?? [],
    itemRows: editApprovalItemRows.value,
    itemSummaryRows: editApprovalItemSummaryRows.value,
    documentSectionTitle: '수정 대상 PI 정보',
    changeSectionTitle: '변경 사항 비교',
    itemSectionTitle: '변경 후 PI 품목 정보',
    helperText: '수정 요청은 승인 전까지 확정되지 않으며, 반려 시 요청 상태만 반영됩니다.',
  })

  piDocuments.value = piDocuments.value.map((row) => (
    row.id === pendingEditRequest.value.id
      ? {
        ...row,
        ...pendingEditRequest.value.nextRow,
        approvalReview,
        ...createEditApprovalMeta({
          approver: pendingEditRequest.value.approver,
          requesterName,
          requestedAt,
        }),
      }
      : row
  ))

  editApprovalRequestOpen.value = false
  pendingEditRequest.value = null
  formOpen.value = false
  success(`${sourceRow.value?.id} 수정 결재 요청이 전송되었습니다.`)
}

function cancelEditApprovalRequest() {
  editApprovalRequestOpen.value = false
}

function confirmDeleteApprovalRequest() {
  if (!sourceRow.value) return
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    deleteApprovalRequestOpen.value = false
    return
  }

  const requesterName = getCurrentRequesterName()
  const requestedAt = getRequestedAt()
  const approvalReview = createApprovalReviewSnapshot({
    title: 'PI 삭제 결재 검토',
    message: '선택한 PI 삭제 요청 건입니다. 문서와 품목 정보를 확인한 뒤 승인 또는 반려를 결정합니다.',
    requestRows: deleteApprovalRequestRows.value,
    documentRows: deleteApprovalDocumentRows.value,
    itemRows: deleteApprovalItemRows.value,
    itemSummaryRows: deleteApprovalItemSummaryRows.value,
    documentSectionTitle: '삭제 대상 PI 정보',
    itemSectionTitle: '삭제 대상 PI 품목 정보',
    helperText: '삭제 요청은 승인 전까지 실제 삭제되지 않으며, 승인 시 문서 상태가 취소로 전환됩니다.',
  })

  piDocuments.value = piDocuments.value.map((row) => (
    row.id === sourceRow.value.id
      ? {
        ...row,
        approvalReview,
        ...createDeleteApprovalMeta({
          approver: getDefaultDeleteApprover(sourceRow.value),
          requesterName,
          requestedAt,
        }),
      }
      : row
  ))

  deleteApprovalRequestOpen.value = false
  success(`${sourceRow.value.id} 삭제 결재 요청이 전송되었습니다.`)
}

function cancelDeleteApprovalRequest() {
  deleteApprovalRequestOpen.value = false
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton v-if="!shipmentLockInfo.locked" size="sm" @click="handleEdit">
            <template #leading>
              <i class="fas fa-edit text-xs" aria-hidden="true"></i>
            </template>
            수정
          </BaseButton>
          <BaseButton v-if="!shipmentLockInfo.locked" variant="secondary" size="sm" @click="handleDelete">
            <template #leading>
              <i class="fas fa-trash text-xs" aria-hidden="true"></i>
            </template>
            삭제
          </BaseButton>
          <BaseButton variant="secondary" size="sm" @click="openPreview">
            <template #leading>
              <i class="fas fa-eye text-xs text-brand-500" aria-hidden="true"></i>
            </template>
            미리보기
          </BaseButton>
          <BaseButton size="sm" @click="handlePdfDownload">
            <template #leading>
              <i class="fas fa-file-pdf text-xs" aria-hidden="true"></i>
            </template>
            PDF 다운로드
          </BaseButton>
        </template>
      </DetailPageHeader>
    </div>

    <div class="mb-6 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-4">
      <div
        v-for="row in summaryRows"
        :key="row.label"
        class="border-b border-slate-200 px-5 py-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
      >
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ row.label }}</div>
        <div class="mt-1 text-sm font-semibold text-slate-900">{{ row.value }}</div>
      </div>
    </div>

    <div
      v-if="shipmentLockInfo.locked"
      class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
    >
      <div class="font-semibold">출하완료 문서가 연결되어 있어 수정 및 삭제가 제한됩니다.</div>
      <div class="mt-1">{{ shipmentLockMessage }}</div>
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="reference in shipmentLockInfo.references"
          :key="`${reference.poId}-${reference.type}-${reference.id}`"
          class="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
        >
          {{ reference.poId }} / {{ reference.type }} {{ reference.id }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">문서 기본정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">거래처</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.clientName }}</div>
            </div>
            <div>
              <span class="text-slate-500">바이어</span>
              <div class="mt-0.5 break-words font-medium">{{ detail.buyer }}</div>
            </div>
            <div>
              <span class="text-slate-500">영문주소</span>
              <div class="mt-0.5 break-words">{{ detail.clientAddress || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">국가</span>
              <div class="mt-0.5">{{ detail.country || '-' }}</div>
            </div>
            <div>
              <span class="text-slate-500">발행일</span>
              <div class="mt-0.5">{{ detail.issueDate }}</div>
            </div>
            <div>
              <span class="text-slate-500">PI 번호</span>
              <div class="mt-0.5 font-medium">{{ detail.id }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">거래 조건 정보</h3>
          <div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span class="text-slate-500">통화</span>
              <div class="mt-0.5">{{ detail.currency }}</div>
            </div>
            <div>
              <span class="text-slate-500">총액</span>
              <div class="mt-0.5 font-semibold text-slate-900">{{ detail.totalAmount }}</div>
            </div>
            <div>
              <span class="text-slate-500">인코텀즈</span>
              <div class="mt-0.5">{{ incotermsLabel }}</div>
            </div>
            <div>
              <span class="text-slate-500">납기일</span>
              <div class="mt-0.5">{{ detail.deliveryDate }}</div>
            </div>
            <div class="sm:col-span-2">
              <span class="text-slate-500">Named Place</span>
              <div class="mt-0.5">{{ detail.namedPlace || '-' }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-4 font-bold text-slate-800">품목 내역</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="p-3 text-left">품목</th>
                  <th class="p-3 text-center">단위</th>
                  <th class="p-3 text-right">수량</th>
                  <th class="p-3 text-right">단가</th>
                  <th class="p-3 text-right">금액</th>
                  <th class="p-3 text-left">비고</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in detail.items" :key="`${detail.id}-${item.name}`">
                  <td class="p-3">{{ item.name }}</td>
                  <td class="p-3 text-center">{{ item.unit || '-' }}</td>
                  <td class="p-3 text-right">{{ item.quantity }}</td>
                  <td class="p-3 text-right">{{ item.unitPrice }}</td>
                  <td class="p-3 text-right font-semibold">{{ item.amount }}</td>
                  <td class="p-3 text-slate-600">{{ item.remark || '-' }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-slate-200 bg-slate-50">
                  <td class="p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">합계</td>
                  <td></td>
                  <td class="p-3 text-right font-semibold text-slate-900">
                    {{ totalItemQuantity.toLocaleString('ko-KR') }}{{ quantityUnitLabel ? ` ${quantityUnitLabel}` : '' }}
                  </td>
                  <td></td>
                  <td class="p-3 text-right text-base font-extrabold text-slate-900">{{ itemAmountSummary }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">비고</h3>
          <p class="text-sm leading-6 text-slate-700">{{ documentNote }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">결재 정보</h3>
          <div v-if="approvalInfoRows.length" class="space-y-3 text-sm">
            <div
              v-for="row in approvalInfoRows"
              :key="row.label"
              class="flex items-start justify-between gap-3"
            >
              <span class="text-slate-500">{{ row.label }}</span>
              <div class="text-right">
                <StatusBadge
                  v-if="['문서 상태', '결재 상태', '요청 상태'].includes(row.label)"
                  :value="row.value"
                />
                <span v-else class="break-words font-medium text-slate-700">{{ row.value }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-slate-400">결재 요청 이력 없음</div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="mb-3 font-bold text-slate-800">참조 문서</h3>
          <div class="space-y-2 text-sm">
            <template v-if="detail.linkedDocuments.length">
              <button
                v-for="document in detail.linkedDocuments"
                :key="document.id"
                type="button"
                class="flex items-center gap-2 rounded-lg p-2.5 text-brand-500 transition hover:bg-slate-50"
                @click="goToLinkedDocument(document.id)"
              >
                <i class="fas fa-file-contract" aria-hidden="true"></i>
                {{ document.id }}
                <StatusBadge :value="document.status" :variant="document.status">
                  {{ formatReferenceDocumentStatus(document.id, document.status) }}
                </StatusBadge>
              </button>
            </template>
            <div v-else class="text-xs text-slate-400">연결 문서 없음</div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">변경 이력</h3>
          </div>
          <div class="text-xs text-slate-400">
            {{ detail.revisionHistory.length ? detail.revisionHistory.join(', ') : '변경 이력 없음' }}
          </div>
        </div>
      </div>
    </div>

    <DocumentPreviewModal
      :open="previewOpen"
      title="PI 미리보기"
      :document-title="detail.id"
      :fields="previewFields"
      @close="previewOpen = false"
      @print="handlePreviewPrint"
    >
      <PIDocumentTemplate :document="detail" />
    </DocumentPreviewModal>

    <PIFormModal
      :open="formOpen"
      mode="edit"
      :document="{
        id: sourceRow?.id,
        clientName: sourceRow?.clientName,
        clientAddress: sourceRow?.clientAddress,
        clientTel: sourceRow?.clientTel,
        clientEmail: sourceRow?.clientEmail,
        buyerName: sourceRow?.buyerName,
        country: sourceRow?.country ?? '',
        currency: sourceRow?.currency,
        incoterms: sourceRow?.incoterms,
        namedPlace: sourceRow?.namedPlace,
        issueDate: sourceRow?.issueDate,
        deliveryDate: sourceRow?.deliveryDate,
        approver: sourceRow?.approver,
        items: (sourceRow?.items ?? []).map((item) => {
          const quantity = parseNumericValue(item.qty ?? item.quantity)
          const amount = parseNumericValue(item.amount ?? '0')
          const unitPrice = parseNumericValue(item.unitPrice)
          const resolvedUnitPrice = unitPrice > 0
            ? unitPrice
            : (quantity > 0 && amount > 0 ? Math.round(amount / quantity) : 0)

          return {
            name: item.name,
            qty: item.qty ?? item.quantity,
            unit: item.unit ?? 'EA',
            unitPrice: String(resolvedUnitPrice),
            amount: String(amount > 0 ? amount : quantity * resolvedUnitPrice),
            remark: item.remark ?? '',
          }
        }),
      }"
      :selected-client="selectedClient"
      @open-client-search="openClientSearch"
      @close="formOpen = false"
      @save="handleSave"
    />

    <ConfirmModal
      :open="editConfirmOpen"
      title="PI 수정 요청"
      message="해당 PI의 수정 결재 요청을 진행하시겠습니까?"
      :detail="sourceRow?.id || ''"
      confirm-label="수정 요청"
      @confirm="confirmEditRequestIntent"
      @cancel="cancelEditRequestIntent"
    />

    <ApprovalRequestModal
      :open="editApprovalRequestOpen"
      title="PI 수정 결재 요청"
      message="변경 사항을 확인한 뒤 선택한 결재자에게 PI 수정 결재 요청을 전송하시겠습니까?"
      :request-rows="editApprovalRequestRows"
      request-section-title="팀장 결재 정보"
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

    <ApprovalRequestModal
      :open="deleteApprovalRequestOpen"
      title="PI 삭제 결재 요청"
      message="선택한 PI 문서의 삭제 결재 요청을 전송하시겠습니까?"
      :request-rows="deleteApprovalRequestRows"
      request-section-title="팀장 결재 정보"
      :document-rows="deleteApprovalDocumentRows"
      :item-columns="approvalItemColumns"
      :item-rows="deleteApprovalItemRows"
      :item-summary-rows="deleteApprovalItemSummaryRows"
      document-section-title="삭제 대상 PI 정보"
      item-section-title="삭제 대상 PI 품목 정보"
      helper-text="요청 후 PI는 결재대기 상태가 되며, 승인 전까지 실제 삭제되지 않습니다."
      width="max-w-6xl"
      confirm-label="삭제 요청"
      @confirm="confirmDeleteApprovalRequest"
      @cancel="cancelDeleteApprovalRequest"
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
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    PI 문서를 찾을 수 없습니다.
  </div>
</template>
