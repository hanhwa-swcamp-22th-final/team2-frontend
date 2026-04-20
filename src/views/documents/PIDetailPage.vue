<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ApprovalRequestModal from '@/components/common/ApprovalRequestModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DetailPageHeader from '@/components/common/DetailPageHeader.vue'
import SearchModal from '@/components/common/SearchModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatRevisionEntry } from '@/utils/revisionFormat'
import DocumentPreviewModal from '@/components/domain/document/DocumentPreviewModal.vue'
import PIDocumentTemplate from '@/components/domain/document/PIDocumentTemplate.vue'
import PIFormModal from '@/components/domain/document/PIFormModal.vue'
import {
  validatePiDeletable,
  requestPiDeletion,
  requestPiModification,
  deleteProformaInvoiceDraft,
  updateProformaInvoiceDraft,
  cancelProformaInvoiceApproval,
  updateApprovalRequest,
} from '@/api/documents'
import { loadApprovalRequests } from '@/stores/approvalRequests'
import { fetchBuyers, fetchClients, fetchCountries, fetchCurrencies } from '@/api/master'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { loadPiDocuments, usePiDocuments } from '@/stores/piDocuments'
import { usePoDocuments } from '@/stores/poDocuments'
import { useShipmentOrderDocuments } from '@/stores/shipmentOrderDocuments'
import { useShipmentStatusDocuments } from '@/stores/shipmentStatusDocuments'
import { useCiDocuments } from '@/stores/ciDocuments'
import { usePlDocuments } from '@/stores/plDocuments'
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
import { createDocumentClientRows } from '@/utils/documentClientRows'
import {
  formatPiShipmentLockMessage,
  getPiShipmentLockInfo,
} from '@/utils/documentShipmentLock'
import { canMutateDocument } from '@/utils/documentOwnership'
import { formatReferenceDocumentStatus } from '@/utils/referenceDocumentStatus'
import { formatIncotermsLabel, resolveIncotermState } from '@/utils/incoterms'
import { clientSearchColumns } from '@/utils/searchModalColumns'
import { label, PI_PO_STATUS_LABEL } from '@/utils/enumLabels'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { info, success, warning, error } = useToast()

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
const ciDocuments = useCiDocuments()
const plDocuments = usePlDocuments()

const isTeamLeader = computed(() => Number(authStore.currentUser?.positionId) === 1)

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

const clientRowsSource = ref(createDocumentClientRows())

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
  // 통화별 소수 자릿수 자동 적용 (KRW/JPY=0, USD/EUR 등=2). 이전 Math.round 강제
  // 정수화로 $3,999.97 → $4,000 로 표시되던 버그(Issue #2) 해소.
  const numeric = Number(value || 0)
  const decimals = currency === 'KRW' || currency === 'JPY' ? 0 : 2
  const symbol = currencySymbolMap[currency] ?? `${currency || ''} `
  return `${symbol}${numeric.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })}`
}

function formatSlashDate(value) {
  return value ? value.replaceAll('-', '/') : '-'
}

function buildLinkedDocuments(documentId) {
  // NEW-7: PI 역참조는 PO.linkedDocuments JSON 을 중간 매개로 사용. 이유:
  // 백엔드 CI/PL 응답의 poId 가 Long PK 로 내려오는데 poDocuments 의 id 는 PO code 문자열.
  // 그래서 `ciDocuments.filter(r => linkedPoIds.includes(r.poId))` 는 매칭 실패.
  // PO.linkedDocuments 는 자동 생성된 CI/PL/SO code 를 문자열로 담고 있으니 그걸로 매칭.
  const linkedPos = poDocuments.value
    .filter((row) => (row.piId || row.linkedPiId) === documentId)

  const childCodesByType = { CI: new Set(), PL: new Set(), SO: new Set() }
  for (const po of linkedPos) {
    const list = Array.isArray(po.linkedDocuments) ? po.linkedDocuments : []
    for (const doc of list) {
      if (!doc?.id || !doc?.type) continue
      if (childCodesByType[doc.type]) {
        childCodesByType[doc.type].add(doc.id)
      }
    }
  }

  const childDocs = [
    ...ciDocuments.value
      .filter((row) => childCodesByType.CI.has(row.id))
      .map((row) => ({ id: row.id, status: row.status, type: 'CI' })),
    ...plDocuments.value
      .filter((row) => childCodesByType.PL.has(row.id))
      .map((row) => ({ id: row.id, status: row.status, type: 'PL' })),
    ...shipmentOrderDocuments.value
      .filter((row) => childCodesByType.SO.has(row.id))
      .map((row) => ({ id: row.id, status: row.status, type: 'SO' })),
    // 출하현황(Shipment) 은 PO.linkedDocuments 에 들어가지 않아 poId 로 역매칭.
    // poDocuments.id 가 PO code 이고 shipmentStatusDocuments.poId 도 PO code 라 OK.
    ...shipmentStatusDocuments.value
      .filter((row) => linkedPos.some((po) => po.id === row.poId))
      .map((row) => ({ id: row.id, status: row.status, type: '출하현황' })),
  ]

  return [
    ...linkedPos.map((row) => ({ id: row.id, status: row.status, type: 'PO' })),
    ...childDocs,
  ]
}

function getCurrentRequesterName() {
  // 백엔드 user 객체는 userName 필드를 사용한다.
  return authStore.currentUser?.userName || authStore.currentUser?.name || '미지정'
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
  return row?.approver || ''
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

const canMutate = computed(() => canMutateDocument(sourceRow.value, authStore.currentUser))

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
    { label: '현재 상태', value: sourceRow.value.status ? label(PI_PO_STATUS_LABEL, sourceRow.value.status) : '-' },
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
    const [clientsData, countriesData, buyersData, currenciesData] = await Promise.all([
      fetchClients(),
      fetchCountries(),
      fetchBuyers(),
      fetchCurrencies(),
    ])

    clientRowsSource.value = createDocumentClientRows({
      clientsData,
      countriesData,
      currenciesData,
      buyersData,
    })
  } catch {
    clientRowsSource.value = createDocumentClientRows()
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

async function handleDelete() {
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    return
  }

  try {
    await validatePiDeletable(sourceRow.value?.id)
  } catch (e) {
    error(e.response?.data?.message || e.response?.data || '후속 문서가 존재하여 삭제할 수 없습니다.')
    return
  }

  // DRAFT 는 결재 없이 바로 삭제 (백엔드 DELETE /proforma-invoices/{id}).
  const statusKey = String(sourceRow.value?.status ?? '').trim().toLowerCase()
  const isDraft = statusKey === 'draft' || statusKey === '초안'
  if (isDraft) {
    try {
      await deleteProformaInvoiceDraft(sourceRow.value.id)
      await loadPiDocuments()
      success(`${sourceRow.value.id} 초안 PI가 삭제되었습니다.`)
      router.back()
    } catch (e) {
      error(e.response?.data?.message || '초안 삭제 중 오류가 발생했습니다.')
    }
    return
  }

  if (isTeamLeader.value) {
    try {
      const userId = authStore.currentUser?.userId
      await requestPiDeletion({ piId: sourceRow.value.id, userId })
      await loadPiDocuments()
      success(`${sourceRow.value.id} PI가 삭제되었습니다.`)
    } catch (e) {
      error(e.response?.data?.message || '삭제 처리 중 오류가 발생했습니다.')
    }
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
    // formValue 를 보존해 confirmEditApprovalRequest 단계에서 팀장 직접 수정 PUT
    // payload 를 만들 수 있게 한다 (G3+G4 프론트 반영).
    formValue,
    nextRow,
    revisedSnapshot,
    changeRows,
  }
  editConfirmOpen.value = true
}

// 팀장 직접 수정용 PUT payload 빌더. ProformaInvoiceCreateRequest 구조에 맞춤.
// PI 상세의 sourceRow 는 clientId/currencyId 같은 FK 를 보존하지 않으므로 가능
// 한 범위 내에서 resolve 하고 나머지는 null 로 둬 백엔드 updateDraft 가 기존
// 값을 유지하도록 한다.
function buildManagerUpdatePayload(formValue) {
  const matchedClient = clientRowsSource.value.find((c) => c.name === formValue.clientName)
  const currencyCode = formValue.currency || sourceRow.value?.currency || 'USD'
  const items = (formValue.items ?? []).map((item) => ({
    itemId: null,
    itemName: item.name ?? '',
    quantity: Number(item.qty ?? item.quantity ?? 0) || 0,
    unit: item.unit ?? '',
    unitPrice: Number(item.unitPrice ?? 0) || 0,
    amount: Number(item.amount ?? 0) || 0,
    remark: item.remark ?? '',
  }))
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return {
    piId: null,
    issueDate: (formValue.issueDate ?? '').replaceAll('/', '-'),
    clientId: matchedClient?.clientId ?? null,
    currencyId: null,
    managerId: sourceRow.value?.managerId ?? authStore.currentUser?.userId ?? null,
    deliveryDate: (formValue.deliveryDate ?? '').replaceAll('/', '-') || null,
    incotermsCode: formValue.incoterms || 'FOB',
    namedPlace: formValue.namedPlace || '',
    totalAmount,
    clientName: formValue.clientName || '',
    clientAddress: formValue.clientAddress || matchedClient?.address || sourceRow.value?.clientAddress || '',
    country: matchedClient?.country || sourceRow.value?.country || '',
    currencyCode,
    exchangeRate: null,
    managerName: sourceRow.value?.manager || authStore.currentUser?.userName || '',
    userId: authStore.currentUser?.userId ?? null,
    remarks: formValue.reason ?? sourceRow.value?.remarks ?? '',
    items,
  }
}

function openClientSearch() {
  clientSearchOpen.value = true
}

function handleClientSelect(client) {
  selectedClient.value = client
  clientSearchOpen.value = false
  clientSearchKeyword.value = ''
}

function goToLinkedDocument(documentId, docType) {
  // NEW-7 지원: type 을 1순위로, prefix 를 fallback 으로 라우트 분기.
  // Shipment 는 ID 가 숫자("8") 라 prefix 매칭 실패해서 type 직접 전달 필수.
  if (!documentId) return
  const routeByType = {
    PO: 'po-detail',
    CI: 'ci-detail',
    PL: 'pl-detail',
    SO: 'shipment-order-detail',
    출하현황: 'shipment-detail',
  }
  const routeByPrefix = {
    PO: 'po-detail',
    CI: 'ci-detail',
    PL: 'pl-detail',
    SO: 'shipment-order-detail',
    SH: 'shipment-detail',
  }
  const routeName =
    routeByType[docType] ||
    routeByPrefix[String(documentId).substring(0, 2).toUpperCase()]
  if (!routeName) return
  router.push({ name: routeName, params: { id: String(documentId) } })
}

function confirmEditRequestIntent() {
  editConfirmOpen.value = false
  editApprovalRequestOpen.value = true
}

function cancelEditRequestIntent() {
  editConfirmOpen.value = false
  pendingEditRequest.value = null
}

async function confirmEditApprovalRequest() {
  if (!pendingEditRequest.value) return
  try {
    const userId = authStore.currentUser?.userId
    if (isTeamLeader.value) {
      // 팀장/ADMIN: 결재 요청 경로를 건너뛰고 PUT /proforma-invoices/{id} 로 즉시
      // 필드 반영. 백엔드 updateDraft 가 MANAGER 모드에서 CONFIRMED 도 허용하도록
      // 확장됨 (docs 98bc5d4). 상태는 그대로 유지.
      const payload = buildManagerUpdatePayload(pendingEditRequest.value.formValue)
      await updateProformaInvoiceDraft(pendingEditRequest.value.id, payload)
    } else {
      await requestPiModification({ piId: pendingEditRequest.value.id, userId })
    }
    await loadPiDocuments()

    editApprovalRequestOpen.value = false
    pendingEditRequest.value = null
    formOpen.value = false
    success(isTeamLeader.value
      ? `${sourceRow.value?.id} 수정 내용이 즉시 반영되었습니다.`
      : `${sourceRow.value?.id} 수정 결재 요청이 전송되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || '수정 처리 중 오류가 발생했습니다.')
  }
}

function cancelEditApprovalRequest() {
  editApprovalRequestOpen.value = false
}

async function confirmDeleteApprovalRequest() {
  if (!sourceRow.value) return
  if (shipmentLockInfo.value.locked) {
    warning(shipmentLockMessage.value)
    deleteApprovalRequestOpen.value = false
    return
  }

  try {
    const userId = authStore.currentUser?.userId
    await requestPiDeletion({ piId: sourceRow.value.id, userId })
    await loadPiDocuments()
    success(`${sourceRow.value.id} 삭제 결재 요청이 전송되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || '삭제 결재 요청 중 오류가 발생했습니다.')
  }

  deleteApprovalRequestOpen.value = false
}

function cancelDeleteApprovalRequest() {
  deleteApprovalRequestOpen.value = false
}

// APPROVAL_PENDING 상태에서 요청자 본인이 결재 요청을 취소.
// 백엔드가 REGISTRATION 은 DRAFT, MODIFICATION/DELETION 은 CONFIRMED 로 상태 복구.
async function handleCancelApproval() {
  if (!sourceRow.value) return
  try {
    await cancelProformaInvoiceApproval(sourceRow.value.id)
    await loadPiDocuments()
    success(`${sourceRow.value.id} 결재 요청이 취소되었습니다.`)
  } catch (e) {
    error(e.response?.data?.message || '결재 요청 취소 중 오류가 발생했습니다.')
  }
}

// --- 팀장(결재자)이 본인 대기 건을 상세에서 직접 승인/반려 ----------------------
// OOS-1 ("결재 요청함" 위젯 부재) 로 인해 팀장은 대시보드에서 자기 팀 결재 진입점이
// 없음. 상세 페이지에 승인/반려 버튼을 노출해 최소 경로를 보장.
const approveConfirmOpen = ref(false)
const rejectConfirmOpen = ref(false)
const rejectReason = ref('')

const isPendingApprovalStatus = computed(() =>
  ['결재대기', 'pending_approval', 'APPROVAL_PENDING'].includes(String(sourceRow.value?.status ?? '')),
)
const isCurrentUserApprover = computed(() => {
  const currentId = Number(authStore.currentUser?.userId)
  const approverId = Number(sourceRow.value?.approverId)
  return Boolean(currentId && approverId && currentId === approverId)
})
const canReviewAsApprover = computed(() =>
  Boolean(sourceRow.value?.approvalRequestId) && isPendingApprovalStatus.value && isCurrentUserApprover.value,
)

function openApproveConfirm() {
  approveConfirmOpen.value = true
}
function openRejectConfirm() {
  rejectReason.value = ''
  rejectConfirmOpen.value = true
}
async function confirmApprove() {
  if (!sourceRow.value?.approvalRequestId) return
  try {
    await updateApprovalRequest(sourceRow.value.approvalRequestId, { status: 'APPROVED' })
    await Promise.all([loadPiDocuments(), loadApprovalRequests()])
    success(`${sourceRow.value.id} 결재가 승인되었습니다.`)
  } catch (e) {
    error(e?.response?.data?.message || '결재 승인 중 오류가 발생했습니다.')
  } finally {
    approveConfirmOpen.value = false
  }
}
async function confirmReject() {
  if (!sourceRow.value?.approvalRequestId) return
  try {
    await updateApprovalRequest(sourceRow.value.approvalRequestId, {
      status: 'REJECTED',
      reason: rejectReason.value.trim(),
    })
    await Promise.all([loadPiDocuments(), loadApprovalRequests()])
    success(`${sourceRow.value.id} 결재가 반려되었습니다.`)
  } catch (e) {
    error(e?.response?.data?.message || '결재 반려 중 오류가 발생했습니다.')
  } finally {
    rejectConfirmOpen.value = false
    rejectReason.value = ''
  }
}
</script>

<template>
  <div v-if="detail" class="fade-in">
    <div class="mb-6">
      <DetailPageHeader :title="detail.id" :status="detail.status" @back="goBack">
        <template #actions>
          <BaseButton v-if="canMutate && !shipmentLockInfo.locked && !['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status)" size="sm" @click="handleEdit">
            <template #leading>
              <i class="fas fa-edit text-xs" aria-hidden="true"></i>
            </template>
            {{ ['확정','confirmed','CONFIRMED'].includes(detail.status) ? '수정요청' : '수정' }}
          </BaseButton>
          <BaseButton v-if="canMutate && !shipmentLockInfo.locked && !['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status)" variant="secondary" size="sm" @click="handleDelete">
            <template #leading>
              <i class="fas fa-trash text-xs" aria-hidden="true"></i>
            </template>
            {{ ['확정','confirmed','CONFIRMED'].includes(detail.status) ? '삭제요청' : '삭제' }}
          </BaseButton>
          <BaseButton
            v-if="canReviewAsApprover"
            size="sm"
            @click="openApproveConfirm"
          >
            <template #leading>
              <i class="fas fa-check text-xs" aria-hidden="true"></i>
            </template>
            승인
          </BaseButton>
          <BaseButton
            v-if="canReviewAsApprover"
            variant="secondary"
            size="sm"
            @click="openRejectConfirm"
          >
            <template #leading>
              <i class="fas fa-times text-xs" aria-hidden="true"></i>
            </template>
            반려
          </BaseButton>
          <BaseButton
            v-if="['결재대기','pending_approval','APPROVAL_PENDING'].includes(detail.status) && !canReviewAsApprover"
            variant="secondary"
            size="sm"
            @click="handleCancelApproval"
          >
            <template #leading>
              <i class="fas fa-undo text-xs" aria-hidden="true"></i>
            </template>
            결재 요청 취소
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
                  v-if="row.label === '상태'"
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
                @click="goToLinkedDocument(document.id, document.type)"
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
          <div class="space-y-1 text-xs text-slate-400">
            <template v-if="Array.isArray(detail.revisionHistory) && detail.revisionHistory.length">
              <div v-for="(rev, i) in detail.revisionHistory" :key="i" class="rounded border border-slate-100 bg-slate-50 px-2 py-1">
                {{ formatRevisionEntry(rev) }}
              </div>
            </template>
            <span v-else>변경 이력 없음</span>
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
      @download="handlePdfDownload"
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

    <ConfirmModal
      :open="approveConfirmOpen"
      title="PI 결재 승인"
      :message="`해당 PI 결재 요청을 승인하시겠습니까?`"
      :detail="sourceRow?.id || ''"
      confirm-label="승인"
      @confirm="confirmApprove"
      @cancel="approveConfirmOpen = false"
    />

    <ConfirmModal
      :open="rejectConfirmOpen"
      title="PI 결재 반려"
      :message="`해당 PI 결재 요청을 반려하시겠습니까? 반려 사유는 요청자에게 노출됩니다.`"
      :detail="sourceRow?.id || ''"
      confirm-label="반려"
      confirm-variant="secondary"
      @confirm="confirmReject"
      @cancel="rejectConfirmOpen = false"
    >
      <div>
        <label class="text-sm font-semibold text-slate-700">반려 사유</label>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="반려 사유를 입력하세요."
        ></textarea>
      </div>
    </ConfirmModal>
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    PI 문서를 찾을 수 없습니다.
  </div>
</template>
